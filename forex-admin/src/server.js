const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const fs = require("fs");
const https = require("https");
const path = require("path");
const axios = require("axios");
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
app.use("/admin", express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());

const pool = new Pool({
	host: DB_HOST,
	user: DB_USER,
	password: DB_PASS,
	database: DB_NAME,
	port: 5432,
});

async function connectWithRetry(retries = 25, delay = 3000) {
	for (let i = 0; i < retries; i++) {
		try {
			await pool.connect();
			console.log("Connected to PostgreSQL");
			return pool;
		} catch (err) {
			console.error(
				`Connection attempt ${i + 1} failed: ${
					err.message
				}. Retrying in ${delay / 1000} seconds...`
			);
			if (i < retries - 1) {
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				throw new Error(
					"Failed to connect to PostgreSQL after multiple attempts."
				);
			}
		}
	}
}

connectWithRetry()
	.then(() => {
		app.locals.db = pool;

		const server = https.createServer(sslOptions, app);
		server.listen(port, "0.0.0.0", () => {
			console.log(`HTTPS Server running on port ${port}`);
		});
	})
	.catch((err) => {
		console.error(
			"Could not start server due to DB connection issues:",
			err.message
		);
		process.exit(1);
	});

app.get("/api/admin/fetchPairs", async (req, res) => {
	const db = req.app.locals.db;
	try {
		const result = await db.query(
			`SELECT 
                f.currency AS "fromcurrency",
                f.id AS "fromcurrencyid",
                f1.currency AS "tocurrency",
                f1.id AS "tocurrencyid",
                e."exchangerate"
            FROM 
                "forexreserves" AS f 
            JOIN 
                "exchangeablepairs" AS e 
            ON 
                f.id = e."fromcurrency" 
            JOIN 
                "forexreserves" AS f1 
            ON 
                f1.id = e."tocurrency"`
		);
		if (result.rows.length === 0) {
			return res.status(404).json({ message: "No pairs found" });
		}
		res.json(result.rows);
	} catch (err) {
		console.error("Error fetching pairs:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.put("/api/admin/updateExchangeRate", async (req, res) => {
	const db = req.app.locals.db;
	const endpoint = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/`;

	try {
		const result = await db.query(
			'SELECT id, currency FROM "forexreserves"'
		);
		const mappings = result.rows.reduce((acc, row) => {
			acc[row.currency] = row.id;
			return acc;
		}, {});
		const currencies = result.rows.map((row) => row.currency);
		const exchangerates = await exchangeRatesHelper(
			currencies,
			endpoint,
			mappings
		);
		const pairs = await db.query(
			'SELECT "fromcurrency", "tocurrency" FROM "exchangeablepairs"'
		);
		for (const pair of pairs.rows) {
			const fromcurrency = pair.fromcurrency;
			const tocurrency = pair.tocurrency;
			if (!exchangerates[fromcurrency] || !exchangerates[tocurrency]) {
				console.error(
					`Exchange rate not found for ${fromcurrency} to ${tocurrency}`
				);
				continue;
			}
			const rate = exchangerates[fromcurrency][tocurrency];
			await db.query(
				`UPDATE "exchangeablepairs" 
                 SET "exchangerate" = $1 
                 WHERE "fromcurrency" = $2 AND "tocurrency" = $3`,
				[rate, fromcurrency, tocurrency]
			);
		}
		res.json({ message: "Exchange rates updated successfully" });
	} catch (error) {
		console.error("Error updating exchange rates:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.post("/api/admin/buyCurrency", async (req, res) => {
	const db = req.app.locals.db;
	const token = req.headers["authorization"]?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const { userid, fromcurrency, tocurrency, amount } = await verifyToken(
			token
		);
		if (!fromcurrency || !tocurrency || !amount) {
			console.log("Invalid token payload");
			return res.status(402).json({ message: "Invalid token" });
		}

		const exchangeablePairResult = await db.query(
			`SELECT * FROM "exchangeablepairs" 
             WHERE "fromcurrency" = $1 AND "tocurrency" = $2`,
			[fromcurrency, tocurrency]
		);

		if (exchangeablePairResult.rows.length === 0) {
			return res.status(404).json({ message: "Invalid currency pair" });
		}
		const exchangeablePair = exchangeablePairResult.rows[0];

		const paidAmount = amount * exchangeablePair.exchangerate;

		const reservesResult = await db.query(
			`SELECT amount FROM "forexreserves" WHERE id = $1`,
			[exchangeablePair.fromcurrency]
		);

		if (reservesResult.rows.length === 0) {
			return res
				.status(404)
				.json({ message: "Currency reserves not found" });
		}

		const availableReserves = reservesResult.rows[0].amount;

		if (availableReserves < paidAmount) {
			return res.status(400).json({
				message: "Insufficient reserves for the requested transaction",
			});
		}

		await db.query(
			`INSERT INTO "transactionledger" 
             ("userid", "exchangepair", "amount", "exchangerate") 
             VALUES ($1, $2, $3, $4)`,
			[userid, exchangeablePair.id, amount, exchangeablePair.exchangerate]
		);

		const fromcurrencyId = exchangeablePair.fromcurrency;
		const tocurrencyId = exchangeablePair.tocurrency;

		await db.query(
			`UPDATE "forexreserves" 
             SET amount = amount - $1 
             WHERE id = $2`,
			[paidAmount, fromcurrencyId]
		);

		await db.query(
			`UPDATE "forexreserves" 
             SET amount = amount + $1 
             WHERE id = $2`,
			[amount, tocurrencyId]
		);

		const newToken = await generateToken(userid, fromcurrency, amount);
		res.status(200).json({
			message: "Transaction successful",
			newToken: newToken,
		});
	} catch (error) {
		console.error("Error processing transaction:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});
app.get("/api/admin/currentReserves", async (req, res) => {
	const db = req.app.locals.db;

	try {
		const currentReservesResult = await db.query(
			'SELECT currency, amount FROM "forexreserves"'
		);

		if (currentReservesResult.rows.length === 0) {
			return res.status(404).json({ message: "No reserves found" });
		}

		res.json(currentReservesResult.rows);
	} catch (error) {
		console.error("Error fetching current reserves:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/admin/adminLogin", async (req, res) => {
	res.sendFile(path.join(__dirname, "public", "adminLogin.html"));
});

app.get("/admin/admin", async (req, res) => {
	res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/admin/adminBuy", async (req, res) => {
	res.sendFile(path.join(__dirname, "public", "adminBuy.html"));
});

app.get("/api/admin/transactionHistory", async (req, res) => {
	const db = req.app.locals.db;

	try {
		const transactionHistoryResult = await db.query(`
			SELECT 
				t.id AS "transactionid",
				t."userid",
				t."transactiondate",
				f.currency AS "fromcurrency",
				f1.currency AS "tocurrency",
				t.amount,
				t."exchangerate"
			FROM 
				"transactionledger" t
			JOIN 
				"exchangeablepairs" e ON t."exchangepair" = e.id
			JOIN 
				"forexreserves" f ON e."fromcurrency" = f.id
			JOIN 
				"forexreserves" f1 ON e."tocurrency" = f1.id
		`);

		if (transactionHistoryResult.rows.length === 0) {
			return res.status(404).json({ message: "No transactions found" });
		}

		res.json(transactionHistoryResult.rows);
	} catch (error) {
		console.error("Error fetching transaction history:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.post("/api/admin/generateToken", async (req, res) => {
	const { userid, fromcurrencyid, tocurrencyid, amount } = req.body;
	if (userid !== 0 || !fromcurrencyid || !tocurrencyid || !amount) {
		console.log("here");
		return res.status(400).json({ message: "Missing required fields" });
	}

	try {
		const token = await generateToken(
			userid,
			fromcurrencyid,
			tocurrencyid,
			amount
		);
		res.status(200).json({ token });
	} catch (error) {
		console.error("Error generating token:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

async function updateExchangeRates() {
	try {
		const httpsAgent = new https.Agent({
			rejectUnauthorized: false,
		});

		const response = await axios.put(
			`https://forex-admin.forex-crm.svc.cluster.local:3000/api/admin/updateExchangeRate`,
			{},
			{
				headers: {
					"Content-Type": "application/json",
				},
				httpsAgent,
			}
		);

		if (response.status === 200) {
			console.log("Exchange rates updated successfully");
		} else {
			console.error("Failed to update exchange rates:", response.data);
		}
	} catch (error) {
		console.error("Error calling updateExchangeRates API:", error.message);
	}
}

setInterval(() => {
	console.log("Starting periodic exchange rate update...");
	updateExchangeRates();
}, 60 * 1000);
