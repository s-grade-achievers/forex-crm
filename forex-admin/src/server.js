const express = require("express");
const cors = require("cors");
const mssql = require("mssql");
const dotenv = require("dotenv");
const fs = require("fs");
const https = require("https");
const path = require("path");
const { exchangeRatesHelper, verifyToken, generateToken } = require("./helper");

dotenv.config();

const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
const apiKey = fs.readFileSync("/app/src/secret.txt", "utf8").trim();
const sslOptions = {
	key: fs.readFileSync("/app/src/server.key"),
	cert: fs.readFileSync("/app/src/server.cert"),
};

const app = express();
const port = 3000;
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());

const config = {
	user: DB_USER,
	password: DB_PASS,
	server: DB_HOST,
	database: DB_NAME,
	options: {
		encrypt: true,
		trustServerCertificate: true,
	},
};

async function connectWithRetry(retries = 10, delay = 3000) {
	for (let i = 0; i < retries; i++) {
		try {
			const pool = await mssql.connect(config);
			console.log("Connected to MSSQL");
			return pool;
		} catch (err) {
			console.log(
				` Connection attempt ${i + 1} failed. Retrying in ${
					delay / 1000
				}s...`
			);
			await new Promise((res) => setTimeout(res, delay));
		}
	}
	throw new Error("Failed to connect to MSSQL after multiple attempts.");
}

connectWithRetry()
	.then((pool) => {
		app.locals.db = pool;

		const server = https.createServer(sslOptions, app);
		server.listen(port, () => {
			console.log(`HTTPS Server running on port ${port}`);
		});
	})
	.catch((err) => {
		console.error("Could not start server due to DB issues:", err.message);
		process.exit(1);
	});

app.get("/api/fetchPairs", (req, res) => {
	const db = req.app.locals.db;
	db.query(
		`SELECT 
            f.currency AS fromCurrency,
			f.id AS fromCurrencyId,
            f1.currency AS toCurrency,
			f1.id AS toCurrencyId,
			e.exchangeRate
        FROM 
            forexReserves AS f 
        JOIN 
            exchangeablePairs AS e 
        ON 
            f.id = e.fromCurrency 
        JOIN 
            forexReserves AS f1 
        ON 
            f1.id = e.toCurrency`,
		(err, result) => {
			if (err) {
				console.error("Error fetching pairs:", err);
				return res.status(500).json({ error: "Internal server error" });
			}
			if (result.recordset.length === 0) {
				return res.status(404).json({ message: "No pairs found" });
			}
			res.json(result.recordsets[0]);
		}
	);
});

app.put("/api/updateExchangeRate", async (req, res) => {
	const db = req.app.locals.db;
	const endpoint = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/`;

	try {
		const result = await db.query("SELECT id, currency FROM forexReserves");
		const mappings = result.recordset.reduce((acc, row) => {
			acc[row.currency] = row.id;
			return acc;
		}, {});
		const currencies = result.recordset.map((row) => row.currency);
		const exchangeRates = await exchangeRatesHelper(
			currencies,
			endpoint,
			mappings
		);
		const pairs = await db.query(
			"SELECT fromCurrency, toCurrency FROM exchangeablePairs"
		);
		pairs.recordset.forEach(async (pair) => {
			const fromCurrency = pair.fromCurrency;
			const toCurrency = pair.toCurrency;
			if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
				console.error(
					`Exchange rate not found for ${fromCurrency} to ${toCurrency}`
				);
				return;
			}
			const rate = exchangeRates[fromCurrency][toCurrency];
			await db
				.request()
				.input("fromCurrency", mssql.Int, fromCurrency)
				.input("toCurrency", mssql.Int, toCurrency)
				.input("rate", mssql.Decimal(18, 6), rate)
				.query(
					"UPDATE exchangeablePairs SET exchangeRate = @rate WHERE fromCurrency = @fromCurrency AND toCurrency = @toCurrency"
				);
		});
		res.json({ message: "Exchange rates updated successfully" });
	} catch (error) {
		console.error("Error updating exchange rates:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.post("/api/buyCurrency", async (req, res) => {
	const db = req.app.locals.db;
	const token = req.headers["authorization"]?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const { userId, fromCurrency, toCurrency, amount } =
			await verifyToken(token);

		if (userId === undefined || !fromCurrency || !toCurrency || !amount) {
			console.log("Invalid token payload");
			return res.status(402).json({ message: "Invalid token" });
		}

		const exchangeablePairResult = await db
			.request()
			.input("fromCurrency", mssql.Int, fromCurrency)
			.input("toCurrency", mssql.Int, toCurrency)
			.query(
				"SELECT * FROM exchangeablePairs WHERE fromCurrency = @fromCurrency AND toCurrency = @toCurrency"
			);

		if (exchangeablePairResult.recordset.length === 0) {
			return res.status(404).json({ message: "Invalid currency pair" });
		}
		const exchangeablePair = exchangeablePairResult.recordset[0];

		await db
			.request()
			.input("userId", mssql.Int, userId)
			.input("exchangePair", mssql.Int, exchangeablePair.id)
			.input("amount", mssql.Decimal(18, 2), amount)
			.input(
				"exchangeRate",
				mssql.Decimal(18, 2),
				exchangeablePair.exchangeRate
			)
			.query(
				"INSERT INTO transactionLedger (userId, exchangePair, amount, exchangeRate) VALUES (@userId, @exchangePair, @amount, @exchangeRate)"
			);
		const fromCurrencyId = exchangeablePair.fromCurrency;
		const toCurrencyId = exchangeablePair.toCurrency;
		const paidAmount = amount * exchangeablePair.exchangeRate;

		await db
			.request()
			.input("paidAmount", mssql.Decimal(18, 2), paidAmount)
			.input("fromCurrency", mssql.Int, fromCurrencyId)
			.query(
				"UPDATE forexReserves SET amount = amount - @paidAmount WHERE id = @fromCurrency"
			);

		await db
			.request()
			.input("amount", mssql.Decimal(18, 2), amount)
			.input("toCurrency", mssql.Int, toCurrencyId)
			.query(
				"UPDATE forexReserves SET amount = amount + @amount WHERE id = @toCurrency"
			);

		const newToken = await generateToken(userId, fromCurrency, amount);
		res.status(200).json({
			message: "Transaction successful",
			newToken: newToken,
		});
	} catch (error) {
		console.error("Error processing transaction:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/adminLogin", async (req, res) => {
	res.sendFile(path.join(__dirname, "public", "adminLogin.html"));
});

app.get("/admin", async (req, res) => {
	res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/transactionHistory", async (req, res) => {
	const db = req.app.locals.db;

	try {
		const transactionHistoryResult = await db.request().query(
			`SELECT 
					t.id AS transactionId,
					t.userId,
					t.transactionDate,
					f.currency AS fromCurrency,
					f1.currency AS toCurrency,
					t.amount,
					t.exchangeRate
				FROM 
					transactionLedger AS t 
				JOIN 
					exchangeablePairs AS e ON t.exchangePair = e.id
				JOIN 
					forexReserves AS f ON e.fromCurrency = f.id
				JOIN 
					forexReserves AS f1 ON e.toCurrency = f1.id`
		);

		if (transactionHistoryResult.recordset.length === 0) {
			return res.status(404).json({ message: "No transactions found" });
		}

		res.json(transactionHistoryResult.recordsets[0]);
	} catch (error) {
		console.error("Error fetching transaction history:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/api/currentReserves", async (req, res) => {
	const db = req.app.locals.db;

	try {
		const currentReservesResult = await db
			.request()
			.query("SELECT currency, amount FROM forexReserves");

		if (currentReservesResult.recordset.length === 0) {
			return res.status(404).json({ message: "No reserves found" });
		}

		res.json(currentReservesResult.recordsets[0]);
	} catch (error) {
		console.error("Error fetching current reserves:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/adminBuy", async (req, res) => {
	res.sendFile(path.join(__dirname, "public", "adminBuy.html"));
});

app.post("/api/generateToken", async (req, res) => {
	const { userId, fromCurrencyId, toCurrencyId, amount } = req.body;
	if (userId !== 0 || !fromCurrencyId || !toCurrencyId || !amount) {
		console.log("here");
		return res.status(400).json({ message: "Missing required fields" });
	}

	try {
		const token = await generateToken(
			userId,
			fromCurrencyId,
			toCurrencyId,
			amount
		);
		res.status(200).json({ token });
	} catch (error) {
		console.error("Error generating token:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});
