document.addEventListener("DOMContentLoaded", async () => {
	const BASE_URL = "https://api.forex-crm.local/api/admin";
	const fromCurrencyDropdown = document.getElementById("fromCurrency");
	const toCurrencyDropdown = document.getElementById("toCurrency");
	const amountInput = document.getElementById("amount");
	const exchangeRateDisplay = document.getElementById("exchangeRate");
	const payableAmountDisplay = document.getElementById("payable");
	const paymentButton = document.getElementById("makePayment");

	let currencyPairs = [];
	try {
		const response = await fetch(`${BASE_URL}/fetchPairs`);
		currencyPairs = await response.json();
		console.log("Fetched currency pairs:", currencyPairs);
		const uniqueFromCurrencies = Array.from(
			new Set(currencyPairs.map((pair) => pair.fromcurrency))
		);

		uniqueFromCurrencies.forEach((fromcurrency) => {
			const option = document.createElement("option");
			option.value = fromcurrency;
			option.textContent = fromcurrency;
			fromCurrencyDropdown.appendChild(option);
		});

		fromCurrencyDropdown.addEventListener("change", () => {
			const selectedFromCurrency = fromCurrencyDropdown.value;

			toCurrencyDropdown.innerHTML = "";

			const filteredPairs = currencyPairs.filter(
				(pair) => pair.fromcurrency === selectedFromCurrency
			);

			filteredPairs.forEach((pair) => {
				const option = document.createElement("option");
				option.value = pair.tocurrencyid;
				option.textContent = pair.tocurrency;
				toCurrencyDropdown.appendChild(option);
			});

			toCurrencyDropdown.dispatchEvent(new Event("change"));
		});

		toCurrencyDropdown.addEventListener(
			"change",
			updateExchangeRateAndPayableAmount
		);
		amountInput.addEventListener(
			"input",
			updateExchangeRateAndPayableAmount
		);

		function updateExchangeRateAndPayableAmount() {
			const selectedFromCurrency = fromCurrencyDropdown.value;
			const selectedToCurrencyId = toCurrencyDropdown.value;
			const enteredAmount = parseFloat(amountInput.value);

			const selectedPair = currencyPairs.find(
				(pair) =>
					pair.fromcurrency === selectedFromCurrency &&
					pair.tocurrencyid === parseInt(selectedToCurrencyId)
			);

			if (selectedPair) {
				exchangeRateDisplay.textContent = `Exchange Rate: ${selectedPair.exchangerate}`;

				if (!isNaN(enteredAmount)) {
					const payableAmount =
						enteredAmount / selectedPair.exchangerate;
					payableAmountDisplay.textContent = `Amount Payable: ${payableAmount.toFixed(
						2
					)} ${selectedFromCurrency}`;
				} else {
					payableAmountDisplay.textContent = "";
				}
			} else {
				exchangeRateDisplay.textContent = "Exchange Rate: N/A";
				payableAmountDisplay.textContent = "";
			}
		}

		paymentButton.addEventListener("click", async () => {
			const selectedFromCurrency = fromCurrencyDropdown.value;
			const selectedToCurrencyId = toCurrencyDropdown.value;
			const enteredAmount = parseFloat(amountInput.value);

			const selectedPair = currencyPairs.find(
				(pair) =>
					pair.fromcurrency === selectedFromCurrency &&
					pair.tocurrencyid === parseInt(selectedToCurrencyId)
			);

			if (!selectedPair || isNaN(enteredAmount) || enteredAmount <= 0) {
				alert(
					"Please select valid currencies and enter a valid amount."
				);
				return;
			}

			try {
				const tokenResponse = await fetch(`${BASE_URL}/generateToken`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userid: 0,
						fromcurrencyid: selectedPair.fromcurrencyid,
						tocurrencyid: selectedPair.tocurrencyid,
						amount: enteredAmount,
					}),
				});
				if (!tokenResponse.ok) {
					throw new Error("Failed to generate token.");
				}

				const { token } = await tokenResponse.json();
				const buyResponse = await fetch(`${BASE_URL}/buyCurrency`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						userid: 0,
						fromcurrencyid: selectedPair.fromcurrencyid,
						tocurrencyid: selectedPair.tocurrencyid,
						amount: enteredAmount,
					}),
				});
				if (!buyResponse.ok) {
					throw new Error("Payment failed.");
				}

				const { newToken } = await buyResponse.json();
				console.log("Payment successful! New token received.");
				console.log("New Token:", newToken);
				if (newToken) window.location.href = `/admin/admin`;
			} catch (error) {
				console.log("Error during payment:", error);
				console.log("Payment failed. Please try again.");
			}
		});

		fromCurrencyDropdown.dispatchEvent(new Event("change"));
	} catch (error) {
		console.log("Error fetching currency pairs:", error);
	}
});
