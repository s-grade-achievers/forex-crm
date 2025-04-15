const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

const dummyData = [
  {
    fromCurrencyId: 1,
    fromCurrency: "USD",
    toCurrencyId: 2,
    toCurrency: "INR",
    exchangerate: 0.012
  },
  {
    fromCurrencyId: 1,
    fromCurrency: "USD",
    toCurrencyId: 3,
    toCurrency: "EUR",
    exchangerate: 0.88
  },
  {
    fromCurrencyId: 2,
    fromCurrency: "INR",
    toCurrencyId: 3,
    toCurrency: "EUR",
    exchangerate: 0.0012
  }
];

app.get('/api/fetchPairs', (req, res) => {
  res.json(dummyData);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Dummy API running on http://localhost:${PORT}`);
});
