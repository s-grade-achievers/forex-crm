import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "./apiConfig.js";

export default function PaymentProcessing() {
	const navigate = useNavigate();
	const { state } = useLocation();
	const [wallets, setWallets] = useState([]);
	const [loading, setLoading] = useState(true);

	const { accountId, username } = state || {};

	useEffect(() => {
		const fetchWallets = async () => {
			try {
				const response = await axios.get(
					`${BASE_URL}/wallet/${accountId}`
				);
				setWallets(response.data);
				setLoading(false);
			} catch (error) {
				console.error("Error fetching wallets:", error);
				setLoading(false);
			}
		};

		if (accountId) {
			fetchWallets();
		} else {
			navigate("/login");
		}
	}, [accountId, navigate]);

	const handleBuy = () => {
		navigate("/");
	};

	if (loading) {
		return <div>Loading wallets...</div>;
	}

	return (
		<div className="p-4 max-w-3xl mx-auto">
			<h1 className="text-xl font-bold mb-4">
				Hello, {username || "User"}
			</h1>

			<div className="bg-white shadow rounded-lg p-4 mb-6">
				<h2 className="text-lg font-semibold mb-4">Your Wallets</h2>
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="bg-gray-200">
							<th className="p-2">Wallet ID</th>
							<th className="p-2">Currency ID</th>
							<th className="p-2">Balance</th>
							<th className="p-2">Created</th>
							<th className="p-2">Updated</th>
							<th className="p-2">Points</th>
						</tr>
					</thead>
					<tbody>
						{wallets.map((wallet) => (
							<tr key={wallet.id} className="border-b">
								<td className="p-2">{wallet.id}</td>
								<td className="p-2">{wallet.currency_id}</td>
								<td className="p-2">
									${parseFloat(wallet.balance).toFixed(2)}
								</td>
								<td className="p-2">
									{new Date(
										wallet.created_at
									).toLocaleDateString()}
								</td>
								<td className="p-2">
									{new Date(
										wallet.updated_at
									).toLocaleDateString()}
								</td>
								<td className="p-2">{wallet.points}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<button
				onClick={handleBuy}
				className="w-full bg-green-500 text-white p-3 rounded-lg font-medium text-lg"
			>
				Shop Now
			</button>
		</div>
	);
}
