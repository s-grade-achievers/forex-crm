const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// JWT Secret - must match the one in the client backend
const JWT_SECRET = 'hellofromclient007';

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("Token verification error:", err);
        reject(err);
      } else {
        console.log("Token decoded successfully:", decoded);
        resolve(decoded);
      }
    });
  });
}

function generateToken(userId, fromCurrency, amount) {
  return new Promise((resolve, reject) => {
    const payload = { userId, fromCurrency, amount };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
}

app.post("/api/buyCurrency", async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = await verifyToken(token);
    console.log("Decoded token:", decoded);
    
    const { userId, fromCurrency, toCurrency, amount } = decoded;

    if (userId === undefined || !fromCurrency || !toCurrency || !amount) {
      console.log("Invalid token payload");
      return res.status(402).json({ message: "Invalid token" });
    }

    // Simulating the exchangeable pair check
    const isValidCurrencyPair = fromCurrency && toCurrency; // Assume valid pair

    if (!isValidCurrencyPair) {
      return res.status(404).json({ message: "Invalid currency pair" });
    }

    // Simulate transaction ledger and forex reserve updates
    const paidAmount = amount * 1.1; // Assuming exchangeRate is 1.1 for simplicity

    console.log(`Paid Amount: ${paidAmount}, From Currency: ${fromCurrency}, To Currency: ${toCurrency}`);
    const newToken = await generateToken(userId, fromCurrency, amount);

    res.status(200).json({
      message: "Transaction successful",
      signedAck: newToken,
    });
  } catch (error) {
    console.error("Error processing transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(5000, () => {
  console.log('Master backend running on port 5000');
});