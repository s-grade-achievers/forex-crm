const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const { JWT_SECRET } = process.env;

const generateToken = () => {
	const payload = {
		userid: 123,
		fromcurrency: 1,
        tocurrency: 2,
		amount: 1000,
	};
	const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
	return token;
};

const a = generateToken();
console.log(a);