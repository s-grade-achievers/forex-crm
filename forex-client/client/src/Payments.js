import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Payments() {
	const { state } = useLocation();
	const navigate = useNavigate();

	const {
		fromCurrencyId,
		toCurrencyId,
		rate,
		amount,
		convertedAmount,
		accountId,
		username,
		time,
		toName,
		fromName,
	} = state || {};

	const handlingCharge = convertedAmount * 0.05;
	const grandTotal = convertedAmount + handlingCharge;

	const handleProceed = () => {
		navigate("/fakeGateway", { state: { ...state, grandTotal } });
	};

	return (
		<div
			style={{
				maxWidth: "600px",
				margin: "40px auto",
				padding: "30px",
				border: "1px solid #ccc",
				borderRadius: "10px",
				boxShadow: "0 0 12px rgba(0,0,0,0.1)",
				fontFamily: "Segoe UI, sans-serif",
				backgroundColor: "#fff",
			}}
		>
			<h2 style={{ textAlign: "center", marginBottom: "30px" }}>
				🧾 Forex Transaction Invoice
			</h2>

			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<tbody>
					<Row label="Invoice To" value={username} />
					<Row label="Account ID" value={accountId} />
					<Row
						label="From Currency (ID)"
						value={`${fromCurrencyId}`}
					/>
					<Row label="To Currency (ID)" value={`${toCurrencyId}`} />
					<Row label="Exchange Rate" value={`1 : ${rate}`} />
					<Row label={"Amount Paid"} value={amount} />
					<Row
						label={"Converted Amount"}
						value={convertedAmount.toFixed(4)}
					/>
					<Row
						label="Handling Charges (5%)"
						value={handlingCharge.toFixed(4)}
					/>
					<Row label="Grand Total " value={grandTotal.toFixed(4)} />
					<Row label="Transaction Time" value={time} />
				</tbody>
			</table>

			<button
				onClick={handleProceed}
				style={{
					marginTop: "30px",
					padding: "12px 25px",
					fontSize: "16px",
					backgroundColor: "#007bff",
					color: "#fff",
					border: "none",
					borderRadius: "6px",
					cursor: "pointer",
					width: "100%",
				}}
			>
				Proceed to Payment
			</button>
		</div>
	);
}

function Row({ label, value }) {
	return (
		<tr>
			<td
				style={{
					padding: "10px 0",
					fontWeight: "bold",
					textAlign: "left",
				}}
			>
				{label}
			</td>
			<td style={{ padding: "10px 0", textAlign: "right" }}>{value}</td>
		</tr>
	);
}
