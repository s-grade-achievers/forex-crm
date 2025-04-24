const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const https = require("https");

const app = express();
app.use(express.json());
app.use(cors());

// JWT Secret - must match the one in the master backend
const JWT_SECRET = process.env.JWT_SECRET_PHRASE;

// Environment variables with fallbacks
const adminProtocol = process.env.ADMIN_PROTOCOL;
const adminHost = process.env.ADMIN_HOST;
const adminPort = process.env.ADMIN_PORT;
const adminUrl = `${adminProtocol}://${adminHost}:${adminPort}`;
console.log(adminHost, adminPort, adminUrl);

const host = process.env.LOYALTY_SERVICE_HOST;
const port = process.env.LOYALTY_SERVICE_PORT;
const loyaltyServiceUrl = `https://9ed0-2406-7400-10a-85d5-80bf-6fb2-e3c3-fdf7.ngrok-free.app`;
console.log("Loyalty Service URL:", loyaltyServiceUrl);
const agent = new https.Agent({
	rejectUnauthorized: false,
});

app.get("/api/backend/getPairs", async (req, res) => {
	try {
		console.log("Attempting to connect to admin service via HTTPS...");
		const httpsAgent = new https.Agent({
			rejectUnauthorized: false,
			servername: "admin",
		});

		// Use the Docker service name and proper port
		const response = await axios.get(`${adminUrl}/api/admin/fetchPairs`, {
			httpsAgent,
			timeout: 8000,
			headers: {
				Host: "admin",
			},
		});

		const data = response.data;
		const idSymbolMapFor = {};
		const idSymbolMapTo = {};
		const idSymbolMapRates = {};

		// console.log("Received data from admin service:", data);

		if (!data || !Array.isArray(data)) {
			console.error("Invalid data format received:", data);
			return res.status(500).json({
				error: "Invalid data format received from admin service",
			});
		}

		data.forEach((pair) => {
			// Check for property name mismatches - adapt these to match the actual response
			const fromId = pair.fromcurrencyid || pair.fromCurrencyId;
			const fromCurr = pair.fromcurrency || pair.fromCurrency;
			const toId = pair.tocurrencyid || pair.toCurrencyId;
			const toCurr = pair.tocurrency || pair.toCurrency;
			const rate = pair.exchangerate;

			idSymbolMapFor[fromId] = fromCurr;
			idSymbolMapTo[toId] = toCurr;
			const key = `${fromId}_${toId}`;
			idSymbolMapRates[key] = rate;
		});

		const pairs = {
			for: idSymbolMapFor,
			to: idSymbolMapTo,
			rates: idSymbolMapRates,
		};

		res.json(pairs);
	} catch (error) {
		console.error("Error in HTTPS connection:", {
			message: error.message,
			code: error.code,
			response: error.response?.data,
			statusCode: error.response?.status,
			host: error.address || "unknown host",
			port: error.port || "unknown port",
		});

		// Provide more specific error message based on the error type
		if (error.code === "ECONNREFUSED") {
			return res
				.status(503)
				.json({ error: "Admin service is not available" });
		} else if (error.code === "ETIMEDOUT") {
			return res
				.status(504)
				.json({ error: "Connection to admin service timed out" });
		} else if (error.response) {
			return res.status(error.response.status).json({
				error: `Admin service returned error: ${error.response.status}`,
				details: error.response.data,
			});
		}

		res.status(500).json({
			error: "Failed to fetch currency pairs from admin service",
		});
	}
});

app.post("/api/backend/forexPayment", (req, res) => {
	const { fromCurrencyId, toCurrencyId, amount, rate, accountId, username } =
		req.body;

	const convertedAmount = amount * rate;
	const grandTotal = convertedAmount * 1.05; // 5% handling charge
	const bill = {
		fromCurrencyId,
		accountId,
		username,
		toCurrencyId,
		rate,
		amount,
		convertedAmount,
		time: new Date().toLocaleString(),
		grandTotal,
	};

	console.log(`Bill generated:`, bill);
	res.json({ message: "Transaction sent for approval", bill });
});

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
});

app.post("/api/backend/verifyPayment", async (req, res) => {
	const payload = req.body;

	try {
		if (!payload.userID && !payload.accountId) {
			return res.status(400).json({ message: "Missing user ID" });
		}
		if (!payload.fromCurrency && !payload.fromCurrencyId) {
			return res.status(400).json({ message: "Missing from currency" });
		}
		if (!payload.toCurrency && !payload.toCurrencyId) {
			return res.status(400).json({ message: "Missing to currency" });
		}
		if (!payload.amount) {
			return res.status(400).json({ message: "Missing amount" });
		}
		if (!payload.grandTotal) {
			return res.status(400).json({ message: "Missing grand total" });
		}

		const userId = payload.userID || payload.accountId;

		try {
			await updatePoints(
				userId,
				payload.amount,
				payload.fromCurrencyId,
				payload.toCurrencyId
			);
			console.log("Points updated successfully");
		} catch (pointsError) {
			console.error("Error updating points:", pointsError);
		}

		const tokenPayload = {
			userid: userId,
			fromcurrency: payload.fromCurrency || payload.fromCurrencyId,
			tocurrency: payload.toCurrency || payload.toCurrencyId,
			amount: payload.amount,
		};

		console.log("Creating token with payload:", tokenPayload);

		const signedToken = jwt.sign(tokenPayload, JWT_SECRET, {
			expiresIn: "1h",
		});

		console.log("Sending request to master backend with token");

		const httpsAgent = new https.Agent({
			rejectUnauthorized: false,
			servername: "admin",
		});

		const response = await axios.post(
			`${adminUrl}/api/admin/buyCurrency`,
			{},
			{
				headers: {
					Authorization: `Bearer ${signedToken}`,
					Host: "admin",
				},
				httpsAgent,
				timeout: 8000,
			}
		);

		console.log("Response from master backend:", response.data);

		await updateWallet(
			tokenPayload.userid,
			tokenPayload.amount,
			tokenPayload.fromcurrency
		);
		console.log("Wallet updated successfully");

		res.status(200).json({
			message: "Transaction complete",
			newToken: response.data.newToken,
		});
	} catch (error) {
		console.error("Error during transaction:", {
			message: error.message,
			code: error.code,
			response: error.response?.data,
			statusCode: error.response?.status,
		});

		if (error.code === "ECONNREFUSED") {
			return res
				.status(503)
				.json({ error: "Admin service is not available" });
		} else if (error.code === "ETIMEDOUT") {
			return res
				.status(504)
				.json({ error: "Connection to admin service timed out" });
		} else if (error.response) {
			return res.status(error.response.status).json({
				error: `Admin service returned error: ${error.response.status}`,
				details: error.response.data,
			});
		}

		res.status(500).json({
			error: "Internal server error during transaction",
		});
	}
});

app.post("/api/backend/confirmTransaction", async (req, res) => {
	const dataForSQL = req.body;
	try {
		console.log("Transaction confirmed:", dataForSQL);
		res.status(200).send("Transaction acknowledged");
	} catch (error) {
		console.error("Error in confirmation:", error);
		res.status(500).send("Internal server error");
	}
});

async function updateWallet(userId, amount, fromCurrency) {
	let client;
	try {
		client = await pool.connect();
		console.log(
			`Updating wallet for user ${userId}, adding amount ${amount}, currency ${fromCurrency}`
		);

		await client.query("BEGIN");

		const checkQuery = `
      SELECT * FROM wallets 
        WHERE user_id = $1 AND currency_id = $2
    `;

		const checkResult = await client.query(checkQuery, [
			userId,
			fromCurrency,
		]);

		if (checkResult.rows.length === 0) {
			console.log(
				`Creating new wallet for user ${userId} with currency ${fromCurrency}`
			);

			const createQuery = `
        INSERT INTO wallets (user_id, currency_id, balance, created_at, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
        `;

			const createResult = await client.query(createQuery, [
				userId,
				fromCurrency,
				amount,
			]);
			console.log("Created wallet:", createResult.rows[0]);
			await client.query("COMMIT");
			return createResult.rows[0];
		} else {
			const updateQuery = `
        UPDATE wallets
        SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND currency_id = $3
        RETURNING *
        `;
			const updateResult = await client.query(updateQuery, [
				amount,
				userId,
				fromCurrency,
			]);
			console.log("Updated wallet:", updateResult.rows[0]);

			await client.query("COMMIT");
			return updateResult.rows[0];
		}
	} catch (error) {
		if (client) {
			await client.query("ROLLBACK");
		}
		console.error("Error in wallet update:", error);
		throw error;
	} finally {
		if (client) {
			client.release();
		}
	}
}

app.get("/api/backend/wallet/:userId", async (req, res) => {
	const userId = req.params.userId;
	let client;

	try {
		client = await pool.connect();
		const result = await client.query(
			"SELECT * FROM wallets WHERE user_id = $1",
			[userId]
		);

		if (result.rows.length === 0) {
			return res
				.status(404)
				.json({ message: "No wallets found for user" });
		}
		return res.status(200).json(result.rows);
	} catch (error) {
		return res.status(500).json({ message: "Server error" });
	} finally {
		if (client) {
			client.release();
		}
	}
});

async function updatePoints(userId, grandTotal, fromCurrencyId, toCurrencyId) {
	try {
		const httpsAgent = new https.Agent({
			rejectUnauthorized: false,
		});
		const pairs = await axios.get(`${adminUrl}/api/admin/fetchPairs`, {
			httpsAgent,
			timeout: 8000,
			headers: {
				Host: "admin",
			},
		});

		fromCurrencyId = parseInt(fromCurrencyId);
		const inrID = 9;
		let getObj = null;
		if (fromCurrencyId === inrID) {
			getObj = 1;
		} else {
			for (const pair of pairs.data) {
				if (
					pair.fromcurrencyid === fromCurrencyId &&
					pair.tocurrencyid === inrID
				) {
					getObj = pair.exchangerate;
					break;
				}
			}
		}

		if (!getObj) {
			throw new Error(
				`No exchange rate found for fromCurrencyId=${fromCurrencyId} to toCurrencyId=${inrID}`
			);
		}

		console.log("getObj:", getObj);

		const rate = parseFloat(getObj);
		const toBeProcessed = grandTotal * rate;

		console.log(
			`Updating points for user ${userId} with amount ${toBeProcessed}`
		);

		const response = await axios.post(
			`${loyaltyServiceUrl}/api/wallet/${userId}/add?payment_amount=${toBeProcessed}`,
			{
				headers: {
					"ngrok-skip-browser-warning": "true",
				},
				httpsAgent,
				timeout: 8000,
			}
		);

		console.log("Loyalty points updated:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"Failed to update loyalty points:",
			error.response?.data || error.message
		);
		throw error;
	}
}

app.listen(4000, () => {
	console.log(`Server running on port: 4000`);
});
