const express = require("express");
const cors = require("cors");
const mssql = require("mssql");
const dotenv = require("dotenv");
const fs = require("fs");
const https = require("https");
const { exchangeRatesHelper } = require("./helper");

dotenv.config();

const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
const apiKey = fs.readFileSync("/app/src/secret.txt", "utf8").trim();
const sslOptions = {
	key: fs.readFileSync("/app/src/server.key"),
	cert: fs.readFileSync("/app/src/server.cert"),
};

const app = express();
const port = 3000;

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
            f1.currency AS toCurrency 
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
			const rate = exchangeRates[fromCurrency][toCurrency];
			await db.query(
				`UPDATE exchangeablePairs 
					SET exchangeRate = ${rate} 
					WHERE fromCurrency = ${fromCurrency} 
					AND toCurrency = ${toCurrency}`
			);
			console.log(
				`Updated exchange rate from ${fromCurrency} to ${toCurrency}: ${rate}`
			);
		});
		res.json({ message: "Exchange rates updated successfully" });
	} catch (error) {
		console.error("Error updating exchange rates:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});


