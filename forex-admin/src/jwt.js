const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const { JWT_SECRET } = process.env;

const generateToken = () => {
	const payload = {
		userId: 123,
		fromCurrency: 1,
        toCurrency: 2,
		reqAmount: 1000,
	};
	const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
	return token;
};

const a = generateToken();
console.log(a);