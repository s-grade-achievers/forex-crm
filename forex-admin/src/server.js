const express = require("express");
const cors = require("cors");
const mssql = require("mssql");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
const apiKey = fs.readFileSync("/app/src/secret.txt", "utf8").trim();

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
		app.listen(port, () => {
			console.log(`Server running on port ${port}`);
		});

		app.locals.db = pool;
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

app.get("/api/fetchExchangeRate/", async (req, res) => {
	const endpoint = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/`;
	const db = req.app.locals.db;

	try {
		const result = await db.query("SELECT id, currency FROM forexReserves");
		const currencies = result.recordset.map((row) => row.currency);
		const exchangeRates = {};
		await Promise.all(
			currencies.map(async (baseCurrency) => {
				const response = await fetch(endpoint + baseCurrency);
				if (!response.ok) {
					throw new Error(
						`Failed to fetch rates for ${baseCurrency}`
					);
				}
				const data = await response.json();
				console.log(1);
				exchangeRates[baseCurrency] = {};
				currencies.forEach((targetCurrency) => {
					if (baseCurrency !== targetCurrency) {
						exchangeRates[baseCurrency][targetCurrency] =
							data.conversion_rates[targetCurrency];
					}
				});
			})
		);

		res.json(exchangeRates);
	} catch (error) {
		console.error("Error fetching exchange rates:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/api/fetchCurrencyMappings", async (req, res) => {
	const db = req.app.locals.db;
	try {
		const result = await db.query("SELECT id, currency FROM forexReserves");
		const mappings = result.recordset.map((row) => ({
			id: row.id,
			currency: row.currency,
		}));
		if (mappings.length === 0) {
			return res.status(404).json({ message: "No mappings found" });
		}
		res.json(mappings);
	} catch (error) {
		console.error("Error fetching currency mappings:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

