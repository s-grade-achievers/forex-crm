async function exchangeRatesHelper(currencies, endpoint, mappings) {
    const exchangeRates = {};
    await Promise.all(
		currencies.map(async (baseCurrency) => {
			const response = await fetch(endpoint + baseCurrency);
			if (!response.ok) {
				throw new Error(`Failed to fetch rates for ${baseCurrency}`);
			}
			const data = await response.json();
			console.log(1);
			exchangeRates[mappings[baseCurrency]] = {};
			currencies.forEach((targetCurrency) => {
				if (baseCurrency !== targetCurrency) {
					exchangeRates[mappings[baseCurrency]][
						mappings[targetCurrency]
					] = data.conversion_rates[targetCurrency];
				}
			});
		})
	);
    return exchangeRates;
}

module.exports = {
    exchangeRatesHelper,
};