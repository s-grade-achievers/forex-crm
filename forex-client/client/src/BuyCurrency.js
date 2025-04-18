import React, { PureComponent } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import "./App.css";
import { BASE_URL } from "./apiConfig.js";


function getKeyByValue(obj, value) {
	return Object.keys(obj).find(key => obj[key] === value);
}

export class App extends PureComponent {
	state = {
		optionsTo: {},
		optionsFrom: {},
		conversion: {},
		from: "",
		to: "",
		amount: "",
		message: "",
	};

	async componentDidMount() {
		try {
			const res = await axios.get(`${BASE_URL}/api/getPairs`);

			this.setState({
				optionsTo: res.data["to"],
				optionsFrom: res.data["for"],
				conversion: res.data["rates"],
			});
		} catch (err) {
			console.error("Error fetching currency pairs", err);
		}
	}

	handleWallet = () => {
		const userInfo = { accountId: "12345", username: "Sourabh" };
		this.setState({
			redirectToWallet: true,
			userInfo: userInfo,
		});
	};

	handleSelectChange = (e) => {
		this.setState({ [e.target.name]: e.target.value });
	};

	handleBuy = async () => {
		const { from, to, amount, conversion, optionsTo, optionsFrom } = this.state;

		if (!from || !to || !amount) {
			this.setState({ message: "Please fill all fields" });
			return;
		}
		console.log("conversion:", conversion);
		const rateKey = `${from}_${to}`;
		const demand = conversion[rateKey];
		const toName = getKeyByValue(optionsTo, to);
		const fromName = getKeyByValue(optionsFrom, from);

		if (!demand) {
			this.setState({
				message:
					"Conversion rate not available for selected currencies",
			});
			return;
		}

		try {
			const res = await axios.post(`${BASE_URL}/api/forexPayment`, {
				fromCurrencyId: from,
				toCurrencyId: to,
				amount: parseFloat(amount),
				rate: demand,
				accountId: "12345",
				username: "Sourabh",
				toName: toName,
				fromName: fromName,
			});
			console.log(toName, fromName);
			if (res.status === 200) {
				const bill = res.data.bill;
				this.setState({
					redirectToPayment: true,
					bill: bill,
				});
			} else {
				this.setState({ message: "Something went wrong" });
			}
		} catch (error) {
			console.error("Error buying currency:", error);
			this.setState({ message: "Failed to process transaction" });
		}
	};

	render() {
		if (this.state.redirectToWallet) {
			return <Navigate to="/wallet" state={this.state.userInfo} />;
		}

		if (this.state.redirectToPayment) {
			return <Navigate to="/payments" state={this.state.bill} />;
		}

		const { optionsFrom, optionsTo, from, to, amount, message } =
			this.state;

		return (
			<div className="container">
				<h2>💱 Forex Exchange</h2>
				<button
					onClick={this.handleWallet}
					style={{ padding: "10px", width: "100%" }}
				>
					Wallet
				</button>
				<div style={{ marginBottom: "10px" }}>
					<label>From Currency:</label>
					<br />
					<select
						name="from"
						value={from}
						onChange={this.handleSelectChange}
						style={{ width: "100%" }}
					>
						<option value="">Select</option>
						{Object.entries(optionsFrom).map(([id, symbol]) => (
							<option key={id} value={id}>
								{symbol}
							</option>
						))}
					</select>
				</div>

				<div style={{ marginBottom: "10px" }}>
					<label>To Currency:</label>
					<br />
					<select
						name="to"
						value={to}
						onChange={this.handleSelectChange}
						style={{ width: "100%" }}
					>
						<option value="">Select</option>
						{Object.entries(optionsTo).map(([id, symbol]) => (
							<option key={id} value={id}>
								{symbol}
							</option>
						))}
					</select>
				</div>

				<div style={{ marginBottom: "10px" }}>
					<label>Amount to Buy:</label>
					<br />
					<input
						type="number"
						name="amount"
						value={amount}
						onChange={this.handleSelectChange}
						placeholder="Enter amount"
						style={{ width: "100%", padding: "5px" }}
					/>
				</div>

				<button
					onClick={this.handleBuy}
					style={{ padding: "10px", width: "100%" }}
				>
					Buy Currency
				</button>

				{message && (
					<p style={{ marginTop: "15px", color: "green" }}>
						{message}
					</p>
				)}
			</div>
		);
	}
}

export default App;