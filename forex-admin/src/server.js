const express = require("express");
const cors = require("cors");
const mssql = require("mssql");
const dotenv = require("dotenv");

dotenv.config();

const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;

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
			console.log(`🚀 Server running on port ${port}`);
		});

		app.locals.db = pool;
	})
	.catch((err) => {
		console.error(
			"🔥 Could not start server due to DB issues:",
			err.message
		);
		process.exit(1);
	});

app.get("/example", (req, res) => {
	const db = req.app.locals.db; 
	db.query("SELECT * FROM forexReserves", (err, result) => {
		if (err) {
			return res.status(500).send("Database error");
		}
		res.json(result);
	});
});
