const express = require("express");
const cors = require("cors");
const mssql = require("mssql");
const dontenv = require("dotenv");

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

const config = {
	user: DB_USER,
	password: DB_PASSWORD,
	server: DB_HOST,
	database: DB_NAME,
	options: {
		encrypt: true, 
		trustServerCertificate: true,
	},
};

const poolPromise = new mssql.ConnectionPool(config)
        .connect()
        .then((pool) => {
            console.log("Connected to MSSQL");
            return pool;
        })
        .catch((err) => console.log("Database connection failed: ", err));

