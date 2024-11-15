async function getCostsData(daysBack) {
  return fetch(`/api/v1/data/random/costs?days=${daysBack}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  }).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      return {};
    }
  });
}

function formatCurrency(value) {
  if (value === undefined) {
    return value;
  }

  return value.toLocaleString("pl", {
    style: "currency",
    currency: "PLN",
  });
}

function getAndShowData(daysBack = 7) {
  getCostsData(daysBack).then((data) => {
    const resultsContainer = document.getElementById("results-container");
    const table = document.createElement("table");
    table.classList.add("results-table");
    table.setAttribute("id", "results-table");
    table.setAttribute("class", "results-table");
    table.style.borderCollapse = "collapse";
    table.style.textAlign = "center";

    const headerRow = document.createElement("tr");
    headerRow.style.backgroundColor = "lightgray";
    headerRow.style.border = "1px solid black";

    const headerDate = document.createElement("th");
    headerDate.textContent = "Date";
    headerDate.style.border = "1px solid black";
    headerDate.style.textAlign = "center";
    headerRow.appendChild(headerDate);

    const headerNumberOfTransactions = document.createElement("th");
    headerNumberOfTransactions.textContent = "Number of Transactions";
    headerNumberOfTransactions.style.border = "1px solid black";
    headerNumberOfTransactions.style.textAlign = "center";
    headerRow.appendChild(headerNumberOfTransactions);

    const headerTotalBalance = document.createElement("th");
    headerTotalBalance.textContent = "Total Balance";
    headerTotalBalance.style.border = "1px solid black";
    headerTotalBalance.style.textAlign = "center";
    headerRow.appendChild(headerTotalBalance);

    const headerDailyBalance = document.createElement("th");
    headerDailyBalance.textContent = "Daily Balance";
    headerDailyBalance.style.border = "1px solid black";
    headerDailyBalance.style.textAlign = "center";
    headerRow.appendChild(headerDailyBalance);

    const headerTransactions = document.createElement("th");
    headerTransactions.textContent = "Transactions";
    headerTransactions.style.border = "1px solid black";
    headerTransactions.style.textAlign = "center";
    headerRow.appendChild(headerTransactions);

    table.appendChild(headerRow);

    data.forEach((row, index) => {
      let idSuffix = "";

      const tr = document.createElement("tr");
      tr.classList.add("transactions-row");
      const dateCell = document.createElement("td");
      dateCell.textContent = row.date;
      dateCell.setAttribute("data-testid", `dti-date${idSuffix}`);
      dateCell.setAttribute("id", `date${idSuffix}`);
      dateCell.classList.add("table-cell");
      dateCell.style.textAlign = "center";
      tr.appendChild(dateCell);

      const numberOfTransactionsCell = document.createElement("td");
      numberOfTransactionsCell.textContent = row.numberOfTransactions;
      numberOfTransactionsCell.setAttribute("data-testid", `dti-numberOfTransactions${idSuffix}`);
      numberOfTransactionsCell.setAttribute("id", `numberOfTransactions${idSuffix}`);
      numberOfTransactionsCell.style.textAlign = "center";
      numberOfTransactionsCell.classList.add("table-cell");
      tr.appendChild(numberOfTransactionsCell);

      const weeklyBalanceCell = document.createElement("td");
      let weeklyBalance = 0;
      for (let i = index; i < data.length; i++) {
        weeklyBalance += data[i].dailyBalance;
      }

      weeklyBalanceCell.textContent = formatCurrency(weeklyBalance);
      weeklyBalanceCell.setAttribute("data-testid", `dti-weeklyBalance${idSuffix}`);
      weeklyBalanceCell.setAttribute("id", `weeklyBalance${idSuffix}`);
      weeklyBalanceCell.classList.add("table-cell");
      weeklyBalanceCell.style.textAlign = "center";
      tr.appendChild(weeklyBalanceCell);

      const dailyBalanceCell = document.createElement("td");
      dailyBalanceCell.textContent = formatCurrency(row.dailyBalance);
      dailyBalanceCell.setAttribute("data-testid", `dti-dailyBalance${idSuffix}`);
      dailyBalanceCell.setAttribute("id", `dailyBalance${idSuffix}`);
      dailyBalanceCell.style.textAlign = "center";
      dailyBalanceCell.classList.add("table-cell");
      tr.appendChild(dailyBalanceCell);

      const transactionsCell = document.createElement("td");
      transactionsCell.setAttribute("data-testid", `dti-transactions${idSuffix}`);
      transactionsCell.setAttribute("id", `transactions${idSuffix}`);
      transactionsCell.style.textAlign = "center";
      transactionsCell.style.width = "300px";
      transactionsCell.classList.add("expenses-cell");

      const transactionsTable = document.createElement("table");
      transactionsTable.classList.add("transactions-table");
      transactionsTable.style.width = "100%";
      transactionsTable.style.borderCollapse = "collapse";
      transactionsTable.style.border = "1px solid black";
      transactionsTable.style.textAlign = "center";

      const transactionsHeaderRow = document.createElement("tr");
      transactionsHeaderRow.style.backgroundColor = "lightgray";
      transactionsHeaderRow.style.border = "1px solid black";

      const transactionsHeaderCategoryIcon = document.createElement("th");
      transactionsHeaderCategoryIcon.textContent = "Icon";
      transactionsHeaderCategoryIcon.style.border = "1px solid black";
      transactionsHeaderCategoryIcon.style.textAlign = "center";
      transactionsHeaderCategoryIcon.style.width = "100px";
      transactionsHeaderRow.appendChild(transactionsHeaderCategoryIcon);

      const transactionsHeaderCategory = document.createElement("th");
      transactionsHeaderCategory.textContent = "Category";
      transactionsHeaderCategory.style.border = "1px solid black";
      transactionsHeaderCategory.style.textAlign = "center";
      transactionsHeaderCategoryIcon.style.width = "200px";
      transactionsHeaderRow.appendChild(transactionsHeaderCategory);

      const transactionsHeaderAmount = document.createElement("th");
      transactionsHeaderAmount.textContent = "Amount";
      transactionsHeaderAmount.style.border = "1px solid black";
      transactionsHeaderAmount.style.textAlign = "center";
      transactionsHeaderAmount.style.width = "100px";
      transactionsHeaderRow.appendChild(transactionsHeaderAmount);

      transactionsTable.appendChild(transactionsHeaderRow);

      row.transactions.forEach((transaction) => {
        const transactionsRow = document.createElement("tr");

        const transactionsCategoryEmojiCell = document.createElement("td");
        transactionsCategoryEmojiCell.textContent = transaction.category.emoji;
        transactionsRow.appendChild(transactionsCategoryEmojiCell);

        const transactionsCategoryCell = document.createElement("td");
        transactionsCategoryCell.textContent = `${transaction.category.name}`;
        transactionsRow.appendChild(transactionsCategoryCell);

        const transactionsAmountCell = document.createElement("td");
        transactionsAmountCell.textContent = formatCurrency(transaction.amount);
        transactionsRow.appendChild(transactionsAmountCell);

        transactionsTable.appendChild(transactionsRow);
      });

      if (row.transactions.length === 0) {
        const transactionsRow = document.createElement("tr");

        const transactionsCategoryEmojiCell = document.createElement("td");
        transactionsCategoryEmojiCell.textContent = " ";
        transactionsRow.appendChild(transactionsCategoryEmojiCell);

        const transactionsCategoryCell = document.createElement("td");
        transactionsCategoryCell.textContent = "No transactions";
        transactionsRow.appendChild(transactionsCategoryCell);

        const transactionsAmountCell = document.createElement("td");
        transactionsAmountCell.textContent = `${formatCurrency(row.transactions[0]?.amount)}`;
        transactionsRow.appendChild(transactionsAmountCell);

        transactionsTable.appendChild(transactionsRow);
      }

      transactionsCell.appendChild(transactionsTable);

      tr.appendChild(transactionsCell);

      table.appendChild(tr);
    });

    resultsContainer.appendChild(table);
    displaySimpleHouseholdExpenses(data, "sampleChart");
  });
}
