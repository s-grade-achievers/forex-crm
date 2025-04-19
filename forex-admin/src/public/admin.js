const BASE_URL = "http://api.forex-crm.local/api/admin";

document
	.getElementById("viewTransactions")
	.addEventListener("click", async () => {
		const response = await fetch(
			`${BASE_URL}/transactionHistory`
		);
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

		const buyMoreContainer = document.getElementById("buyMoreContainer");
		if (buyMoreContainer) {
			buyMoreContainer.remove();
		}
	});

document.getElementById("viewReserves").addEventListener("click", async () => {
	const response = await fetch(
		`${BASE_URL}/reserves`
	);
	const data = await response.json();
	populateTable(data, ["Currency", "Amount"]);

	let buyMoreContainer = document.getElementById("buyMoreContainer");
	if (!buyMoreContainer) {
		buyMoreContainer = document.createElement("div");
		buyMoreContainer.id = "buyMoreContainer";
		buyMoreContainer.style.marginTop = "20px";
		buyMoreContainer.style.textAlign = "center";

		const buyMoreButton = document.createElement("button");
		buyMoreButton.id = "buyMore";
		buyMoreButton.textContent = "Buy More";
		buyMoreButton.style.backgroundColor = "#007bff";
		buyMoreButton.style.color = "#fff";
		buyMoreButton.style.border = "none";
		buyMoreButton.style.padding = "10px 20px";
		buyMoreButton.style.borderRadius = "5px";
		buyMoreButton.style.cursor = "pointer";

		buyMoreButton.addEventListener("click", () => {
			window.location.href = "/adminBuy";
		});

		buyMoreContainer.appendChild(buyMoreButton);

		const tableContainer = document.querySelector("table")?.parentElement;
		if (tableContainer) {
			tableContainer.appendChild(buyMoreContainer);
		} else {
			document.body.appendChild(buyMoreContainer); // fallback
		}
	}
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
