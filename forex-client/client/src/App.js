import React from "react";
import { Routes, Route } from "react-router-dom";
import BuyCurrency from "./BuyCurrency.js";
import Payments from "./Payments.js";
import FakeGateway from "./FakeGateway.js";
import Wallet from "./Wallet.js";

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<BuyCurrency />} />
			<Route path="/payments" element={<Payments />} />
			<Route path="/fakeGateway" element={<FakeGateway />} />
			<Route path="/wallet" element={<Wallet />} />
		</Routes>
	);
}

