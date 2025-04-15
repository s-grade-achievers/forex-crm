document.addEventListener("DOMContentLoaded", async () => {
	const fromCurrencyDropdown = document.getElementById("fromCurrency");
	const toCurrencyDropdown = document.getElementById("toCurrency");
	const amountInput = document.getElementById("amount");
	const exchangeRateDisplay = document.getElementById("exchangeRate");
	const payableAmountDisplay = document.getElementById("payable");
	const paymentButton = document.getElementById("makePayment");

	let currencyPairs = []; 
	try {
		const response = await fetch("/api/fetchPairs");
		currencyPairs = await response.json();

		const uniqueFromCurrencies = Array.from(
			new Set(currencyPairs.map((pair) => pair.fromCurrency))
		);

		uniqueFromCurrencies.forEach((fromCurrency) => {
			const option = document.createElement("option");
			option.value = fromCurrency;
			option.textContent = fromCurrency;
			fromCurrencyDropdown.appendChild(option);
		});

		fromCurrencyDropdown.addEventListener("change", () => {
			const selectedFromCurrency = fromCurrencyDropdown.value;

			toCurrencyDropdown.innerHTML = "";

			const filteredPairs = currencyPairs.filter(
				(pair) => pair.fromCurrency === selectedFromCurrency
			);

			filteredPairs.forEach((pair) => {
				const option = document.createElement("option");
				option.value = pair.toCurrencyId;
				option.textContent = pair.toCurrency;
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
					pair.fromCurrency === selectedFromCurrency &&
					pair.toCurrencyId === parseInt(selectedToCurrencyId)
			);

			if (selectedPair) {
				exchangeRateDisplay.textContent = `Exchange Rate: ${selectedPair.exchangeRate}`;

				if (!isNaN(enteredAmount)) {
					const payableAmount =
						enteredAmount / selectedPair.exchangeRate;
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
					pair.fromCurrency === selectedFromCurrency &&
					pair.toCurrencyId === parseInt(selectedToCurrencyId)
			);

			if (!selectedPair || isNaN(enteredAmount) || enteredAmount <= 0) {
				alert(
					"Please select valid currencies and enter a valid amount."
				);
				return;
			}

			try {
				const tokenResponse = await fetch("/api/generateToken", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userId: 0,
						fromCurrencyId: selectedPair.fromCurrencyId,
						toCurrencyId: selectedPair.toCurrencyId,
						amount: enteredAmount,
					}),
				});
				if (!tokenResponse.ok) {
					throw new Error("Failed to generate token.");
				}

				const { token } = await tokenResponse.json();
				const buyResponse = await fetch("/api/buyCurrency", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						userId: 0,
						fromCurrencyId: selectedPair.fromCurrencyId,
						toCurrencyId: selectedPair.toCurrencyId,
						amount: enteredAmount,
					}),
				});
				if (!buyResponse.ok) {
					throw new Error("Payment failed.");
				}

				const { newToken } = await buyResponse.json();
				console.log("Payment successful! New token received.");
				console.log("New Token:", newToken);
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
