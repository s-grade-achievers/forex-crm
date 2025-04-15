const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

// JWT Secret - must match the one in the master backend
const JWT_SECRET = process.env.JWT_SECRET_PHRASE ;

// Environment variables with fallbacks
const dummyApiUrl = process.env.DUMMY_API_URL || 'http://dummy-api:3001';
const masterApiUrl = process.env.MASTER_API_URL || 'http://master:5000';

app.get('/api/getPairs', async (req, res) => {
  try {
    // Use the service name in Docker network instead of localhost
    const response = await axios.get(`${dummyApiUrl}/api/fetchPairs`);
    const data = response.data;

    const idSymbolMapFor = {};
    const idSymbolMapTo = {};
    const idSymbolMapRates = {};

    data.forEach(pair => {
      idSymbolMapFor[pair.fromCurrencyId] = pair.fromCurrency;
      idSymbolMapTo[pair.toCurrencyId] = pair.toCurrency;
      const key = `${pair.fromCurrencyId}_${pair.toCurrencyId}`;
      idSymbolMapRates[key] = pair.exchangerate;
    });

    const pairs = { for: idSymbolMapFor, to: idSymbolMapTo, rates: idSymbolMapRates };
    res.json(pairs);
  } catch (error) {
    console.error("Error in /api/getPairs:", error);
    res.status(500).json({ error: "Failed to fetch currency pairs" });
  }
});

app.post('/api/forexPayment', (req, res) => {
  const { fromCurrencyId, toCurrencyId, amount, rate, accountId, username } = req.body;
  console.log(rate);
  const convertedAmount = amount * rate;

  const bill = {
    fromCurrencyId,
    accountId,
    username,
    toCurrencyId,
    rate,
    amount,
    convertedAmount,
    time: new Date().toLocaleString()
  };
  console.log(`Bill generated:`, bill);
  res.json({ message: 'Transaction sent for approval', bill });
});

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres', // Use service name in Docker
  database: process.env.DB_NAME || 'forex',
  password: process.env.DB_PASSWORD || '1234',
  port: process.env.DB_PORT || 5432,
});

app.post('/api/verifyPayment', async (req, res) => {
  const payload = req.body;
  
  try {
    const tokenPayload = {
      userId: payload.userID || payload.accountId,
      fromCurrency: payload.fromCurrency || payload.fromCurrencyId,
      toCurrency: payload.toCurrency || payload.toCurrencyId,
      amount: payload.amount
    };
    
    console.log("Creating token with payload:", tokenPayload);
    
    const signedToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

    console.log("Sending request to master backend with token");
    
    const response = await axios.post(`${masterApiUrl}/api/buyCurrency`, {}, {
      headers: { Authorization: `Bearer ${signedToken}` },
    });

    console.log("Response from master backend:", response.data);
    
    const { signedAck } = response.data;
    
    await updateWallet(tokenPayload.userId, tokenPayload.amount, tokenPayload.fromCurrency);
    console.log('Wallet updated successfully');
    
    res.status(200).json({ message: 'Transaction complete', signedAck });
  } catch (error) {
    console.error('Error during transaction:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/confirmTransaction', async (req, res) => {
  const dataForSQL = req.body;

  try {
    console.log("Transaction confirmed:", dataForSQL);
    res.status(200).send('Transaction acknowledged');
  } catch (error) {
    console.error('Error in confirmation:', error);
    res.status(500).send('Internal server error');
  }
});

async function updateWallet(userId, amount, fromCurrency) {
  let client;
  
  try {
    client = await pool.connect();
    console.log(`Updating wallet for user ${userId}, adding amount ${amount}, currency ${fromCurrency}`);
    
    await client.query('BEGIN');
    
    const checkQuery = `
      SELECT * FROM wallets 
      WHERE user_id = $1 AND currency_id = $2
    `;
    
    const checkResult = await client.query(checkQuery, [userId, fromCurrency]);
    
    if (checkResult.rows.length === 0) {
      console.log(`Creating new wallet for user ${userId} with currency ${fromCurrency}`);
      
      const createQuery = `
        INSERT INTO wallets (user_id, currency_id, balance, created_at, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const createResult = await client.query(createQuery, [userId, fromCurrency, amount]);
      console.log('Created wallet:', createResult.rows[0]);
      await client.query('COMMIT');
      return createResult.rows[0];
    } else {
      const updateQuery = `
        UPDATE wallets
        SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND currency_id = $3
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [amount, userId, fromCurrency]);
      console.log('Updated wallet:', updateResult.rows[0]);
      
      await client.query('COMMIT');
      return updateResult.rows[0];
    }
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error in wallet update:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

app.get('/api/wallet/:userId', async (req, res) => {
  const userId = req.params.userId;
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No wallets found for user' });
    }
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.listen(4000, () => {
  console.log(`Server running on port: 4000`);
});