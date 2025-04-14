const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const { JWT_SECRET } = process.env;

async function exchangeRatesHelper(currencies, endpoint, mappings) {
	const exchangeRates = {};
	await Promise.all(
		currencies.map(async (baseCurrency) => {
			try {
				const response = await fetch(endpoint + baseCurrency);
				if (!response.ok) {
					throw new Error(
						`Failed to fetch rates for ${baseCurrency}`
					);
				}
				const data = await response.json();
				console.log(`Fetched rates for ${baseCurrency}`);
				exchangeRates[mappings[baseCurrency]] = {};
				currencies.forEach((targetCurrency) => {
					if (baseCurrency !== targetCurrency) {
						exchangeRates[mappings[baseCurrency]][
							mappings[targetCurrency]
						] = data.conversion_rates[targetCurrency];
					}
				});
			} catch (error) {
				console.error(
					`Error fetching rates for ${baseCurrency}:`,
					error.message
				);
			}
		})
	);
	return exchangeRates;
}

async function verifyToken(token) {
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		return decoded;
	} catch (err) {
		throw new Error("Invalid token");
	}
}

async function generateToken(userId, fromCurrency = null, toCurrency, amount) {
	let payload;
	if (!fromCurrency) {
		payload = {
			userId: userId,
			currency: fromCurrency,
			amount: amount,
		};
	} else {
		payload = {
			userId: userId,
			fromCurrency: fromCurrency,
			toCurrency: toCurrency,
			amount: amount,
		};
	}
	const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
	return token;
}

module.exports = {
	verifyToken,
	exchangeRatesHelper,
	generateToken,
};
