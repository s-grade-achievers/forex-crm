document
	.getElementById("viewTransactions")
	.addEventListener("click", async () => {
		const response = await fetch("/api/transactionHistory");
		const data = await response.json();
		populateTable(data, [
			"Transaction ID",
			"User ID",
			"Date",
			"From",
            "To",
			"Amount",
			"Exchange Rate",
		]);
	});

document.getElementById("viewReserves").addEventListener("click", async () => {
	const response = await fetch("/api/currentReserves");
	const data = await response.json();
	populateTable(data, ["Currency", "Amount"]);
});

function populateTable(data, headers) {
	const tableHeader = document.getElementById("tableHeader");
	const tableBody = document.getElementById("tableBody");

	tableHeader.innerHTML = "";
	tableBody.innerHTML = "";

	headers.forEach((header) => {
		const th = document.createElement("th");
		th.textContent = header;
		tableHeader.appendChild(th);
	});

	data.forEach((row) => {
		const tr = document.createElement("tr");
		Object.values(row).forEach((value) => {
			const td = document.createElement("td");
			td.textContent = value;
			tr.appendChild(td);
		});
		tableBody.appendChild(tr);
	});
}
