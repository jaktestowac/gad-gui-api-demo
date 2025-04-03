async function getTicketCardData() {
  return fetch(`/api/v1/data/random/simple-bus-ticket-card`, {
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
    // eslint-disable-next-line no-console
    console.log("Congratulations! You have found a bug in the code!");
    return value;
  }

  return value.toLocaleString("pl", {
    style: "currency",
    currency: "PLN",
  });
}

const possibleStatuses = {
  0: "inactive",
  1: "active",
  2: "banned",
  3: "deleted",
  4: "suspended",
};

function calculateDifferenceInDatesInDays(date1, date2) {
  const differenceInMilliseconds = Math.abs(date1 - date2);
  const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
  return differenceInDays;
}

function formatTimeElapsedFromMinutes(minutes) {
  if (minutes <= 60) {
    return `${Math.floor(minutes)} min`;
  }

  const days = Math.floor(minutes / 1440);
  const remainingHours = minutes % 1440;
  const hours = Math.floor(remainingHours / 60);
  const remainingMinutes = remainingHours % 60;

  if (days > 0) {
    if (hours === 0) {
      return `${days} d ${remainingMinutes} min`;
    }

    if (remainingMinutes === 0) {
      return `${days} d ${hours} h`;
    }

    return `${days} d ${hours} h ${remainingMinutes} min`;
  }

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

function downloadTicketAsXLSX(ticketNumber, dataToDownload) {
  downloadXlsx(`bus-ticket-data-${ticketNumber}.xlsx`, dataToDownload);
}

function createXlsxDownloadButton(data) {
  const downloadButton = document.createElement("button");
  downloadButton.classList.add("btn", "button-primary");
  downloadButton.textContent = "Download XLSX";
  downloadButton.style.margin = "2px";
  downloadButton.style.padding = "2px";
  downloadButton.addEventListener("click", () => {
    const dataToDownload = [
      ["Ticket Number", "Owner", "Age", "Funds", "Valid Until", "Status"],
      [
        data.ticketNumber,
        data.owner.name,
        data.owner.age,
        formatCurrency(data.funds),
        new Date(data.validUntil).toLocaleDateString(),
        possibleStatuses[data.status],
      ],
    ];

    const tripsData = data.useHistory.map((history) => [
      new Date(history.date).toLocaleDateString(),
      history.from,
      history.to,
      formatCurrency(history.cost),
      formatTimeElapsedFromMinutes(history.timeInMinutes),
    ]);

    const tripsDataToDownload = [["Date", "From", "To", "Cost", "Time"], ...tripsData];

    const allDataToDownload = [...dataToDownload, [], ["Trips History"], ...tripsDataToDownload];

    downloadTicketAsXLSX(data.ticketNumber, allDataToDownload);
  });

  return downloadButton;
}

function getAndShowSimpleTicketData() {
  return getTicketCardData(getTicketCardData).then((data) => {
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
    headerDate.textContent = "Ticket Card Data";
    headerDate.style.border = "1px solid black";
    headerDate.style.textAlign = "center";
    headerRow.appendChild(headerDate);

    const headerTransactions = document.createElement("th");
    headerTransactions.textContent = "History";
    headerTransactions.style.border = "1px solid black";
    headerTransactions.style.textAlign = "center";
    headerRow.appendChild(headerTransactions);

    table.appendChild(headerRow);

    const dataRow = document.createElement("tr");
    const dateCell = document.createElement("td");
    dateCell.classList.add("table-cell");

    const ticketNumberLabel = document.createElement("span");
    ticketNumberLabel.textContent = "Ticket Number:";
    ticketNumberLabel.style.fontWeight = "bold";
    dateCell.appendChild(ticketNumberLabel);

    const ticketNumberValue = document.createElement("span");
    ticketNumberValue.classList.add("table-cell");
    ticketNumberValue.textContent = data.ticketNumber;
    dateCell.appendChild(ticketNumberValue);

    dateCell.appendChild(document.createElement("br"));

    const ownerLabel = document.createElement("span");
    ownerLabel.textContent = "Owner:";
    ownerLabel.style.fontWeight = "bold";
    dateCell.appendChild(ownerLabel);

    const ownerValue = document.createElement("span");
    ownerValue.classList.add("table-cell");
    ownerValue.textContent = data.owner.name;
    dateCell.appendChild(ownerValue);

    dateCell.appendChild(document.createElement("br"));

    const ageLabel = document.createElement("span");
    ageLabel.textContent = "Age:";
    ageLabel.style.fontWeight = "bold";
    dateCell.appendChild(ageLabel);

    const ageValue = document.createElement("span");
    ageValue.classList.add("table-cell");
    ageValue.textContent = data.owner.age;
    dateCell.appendChild(ageValue);

    dateCell.appendChild(document.createElement("br"));

    const fundsLabel = document.createElement("span");
    fundsLabel.textContent = "Funds:";
    fundsLabel.style.fontWeight = "bold";
    dateCell.appendChild(fundsLabel);

    const fundsValue = document.createElement("span");
    fundsValue.classList.add("table-cell");
    fundsValue.textContent = `${formatCurrency(data.funds)}`;
    dateCell.appendChild(fundsValue);

    dateCell.appendChild(document.createElement("br"));

    const validUntilLabel = document.createElement("span");
    validUntilLabel.textContent = "Valid Until:";
    validUntilLabel.style.fontWeight = "bold";
    dateCell.appendChild(validUntilLabel);

    const validUntilValue = document.createElement("span");
    validUntilValue.classList.add("table-cell");
    validUntilValue.textContent = new Date(data.validUntil).toLocaleDateString();
    dateCell.appendChild(validUntilValue);

    dateCell.appendChild(document.createElement("br"));

    const cardValidityInfo = document.createElement("span");
    cardValidityInfo.classList.add("user-small-label");
    const cardValidDays = calculateDifferenceInDatesInDays(new Date(), new Date(data.validUntil));
    cardValidityInfo.textContent = `(Card expires in ${Math.round(cardValidDays)} days)`;
    dateCell.appendChild(cardValidityInfo);

    dateCell.appendChild(document.createElement("br"));

    const statusLabel = document.createElement("span");
    statusLabel.textContent = "Status:";
    statusLabel.style.fontWeight = "bold";
    dateCell.appendChild(statusLabel);

    const statusValue = document.createElement("span");
    statusValue.classList.add("table-cell");
    statusValue.textContent = possibleStatuses[data.status];
    dateCell.appendChild(statusValue);

    dateCell.appendChild(document.createElement("br"));

    const buttonsContainer = document.createElement("div");
    buttonsContainer.setAttribute("id", "buttons-container");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.flexDirection = "column";
    buttonsContainer.style.justifyContent = "center";

    dateCell.appendChild(buttonsContainer);

    dataRow.appendChild(dateCell);

    const transactionsCell = document.createElement("td");
    transactionsCell.classList.add("table-cell");
    transactionsCell.style.textAlign = "center";

    const historyTable = document.createElement("table");
    historyTable.style.border = "1px solid black";

    const headerRowInner = document.createElement("tr");
    headerRowInner.style.backgroundColor = "lightgray";
    headerRowInner.style.border = "1px solid black";

    const headerDateInner = document.createElement("th");
    headerDateInner.textContent = "Date";
    headerDateInner.style.textAlign = "center";
    headerRowInner.appendChild(headerDateInner);

    const headerFrom = document.createElement("th");
    headerFrom.textContent = "From";
    headerFrom.style.textAlign = "center";

    headerRowInner.appendChild(headerFrom);

    const headerTo = document.createElement("th");
    headerTo.textContent = "To";
    headerTo.style.textAlign = "center";
    headerRowInner.appendChild(headerTo);

    const headerCost = document.createElement("th");
    headerCost.textContent = "Cost";
    headerCost.style.textAlign = "center";
    headerRowInner.appendChild(headerCost);

    const headerTime = document.createElement("th");
    headerTime.textContent = "Time";
    headerTime.style.textAlign = "center";
    headerRowInner.appendChild(headerTime);

    historyTable.appendChild(headerRowInner);

    data.useHistory.forEach((history, index) => {
      const historyRow = document.createElement("tr");
      historyRow.style.border = "1px solid black";

      const historyDateCell = document.createElement("td");
      historyDateCell.classList.add("table-cell");
      historyDateCell.textContent = new Date(history.date).toLocaleDateString();
      historyDateCell.style.textAlign = "center";
      historyRow.appendChild(historyDateCell);

      const historyFromCell = document.createElement("td");
      historyFromCell.classList.add("table-cell");
      historyFromCell.textContent = history.from;
      historyFromCell.style.textAlign = "center";
      historyRow.appendChild(historyFromCell);

      const historyToCell = document.createElement("td");
      historyToCell.classList.add("table-cell");
      historyToCell.textContent = history.to;
      historyToCell.style.textAlign = "center";
      historyRow.appendChild(historyToCell);

      const historyCostCell = document.createElement("td");
      historyCostCell.classList.add("table-cell");
      historyCostCell.textContent = `${formatCurrency(history.cost)}`;
      historyCostCell.style.textAlign = "center";
      historyRow.appendChild(historyCostCell);

      const historyTimeCell = document.createElement("td");
      historyTimeCell.classList.add("table-cell");
      historyTimeCell.textContent = `${formatTimeElapsedFromMinutes(history.timeInMinutes)}`;
      historyTimeCell.style.textAlign = "center";
      historyRow.appendChild(historyTimeCell);

      historyTable.appendChild(historyRow);
    });

    if (data.useHistory.length === 0) {
      const transactionsRow = document.createElement("tr");

      const transactionsCategoryEmojiCell = document.createElement("td");
      transactionsCategoryEmojiCell.textContent = " ";
      transactionsRow.appendChild(transactionsCategoryEmojiCell);

      const transactionsCategoryCell = document.createElement("td");
      transactionsCategoryCell.textContent = "No trips recorded";
      transactionsRow.appendChild(transactionsCategoryCell);

      const transactionsAmountCell = document.createElement("td");
      transactionsAmountCell.textContent = ` `;
      transactionsRow.appendChild(transactionsAmountCell);

      historyTable.appendChild(transactionsRow);
    }

    transactionsCell.appendChild(historyTable);

    dataRow.appendChild(transactionsCell);

    table.appendChild(dataRow);
    resultsContainer.appendChild(table);

    const summaryContainer = document.createElement("div");
    summaryContainer.style.width = "500px";
    summaryContainer.innerHTML = "";

    const summaryTitle = document.createElement("h5");
    summaryTitle.textContent = "Ticket Card Summary";
    summaryContainer.appendChild(summaryTitle);

    const summaryText = document.createElement("p");

    const totalTrips = data.useHistory.length;
    const totalCost = data.useHistory.reduce((acc, cur) => acc + cur.cost, 0) % 1000; // 🐞
    const totalMinutes = data.useHistory.reduce((acc, cur) => acc + cur.timeInMinutes, 0) % 1000; // 🐞

    summaryText.textContent = `The ticket card:`;

    const summaryList = document.createElement("ul");
    summaryList.style.textAlign = "left";
    const summaryItem1 = document.createElement("li");
    summaryItem1.textContent = `was used ${totalTrips} times`;
    summaryList.appendChild(summaryItem1);

    const summaryItem2 = document.createElement("li");
    summaryItem2.textContent = `total cost of ${formatCurrency(totalCost)} (mean: ${formatCurrency(
      totalCost / totalTrips
    )})`;
    summaryList.appendChild(summaryItem2);

    const summaryItem3 = document.createElement("li");
    summaryItem3.textContent = `total time of ${formatTimeElapsedFromMinutes(
      totalMinutes
    )} (mean: ${formatTimeElapsedFromMinutes(totalMinutes / totalTrips)})`;
    summaryList.appendChild(summaryItem3);

    summaryText.appendChild(summaryList);
    summaryContainer.appendChild(summaryText);

    const towns = data.useHistory.map((history) => history.to);
    const townsSet = new Set(towns);
    const townsArray = Array.from(townsSet);
    const townsSummary = townsArray.map((town) => {
      const townTrips = data.useHistory.filter((history) => history.to === town || history.from === town).length; // 🐞
      return {
        town,
        townTrips,
      };
    });

    const townsSummaryTitle = document.createElement("h5");
    townsSummaryTitle.textContent = "Trips Summary";
    summaryContainer.appendChild(townsSummaryTitle);

    const townsSummaryList = document.createElement("ul");
    townsSummaryList.style.textAlign = "left";
    townsSummary.forEach((town) => {
      const townSummaryItem = document.createElement("li");
      townSummaryItem.textContent = `${town.town}: ${town.townTrips} trips`;
      townsSummaryList.appendChild(townSummaryItem);
    });

    summaryContainer.appendChild(townsSummaryList);

    resultsContainer.appendChild(summaryContainer);
    return data;
  });
}

const data1 = {
  id: 415,
  ticketNumber: "TICKET-7662",
  owner: {
    name: "Rose Melo",
    age: 29,
  },
  funds: 306,
  validUntil: "2025-03-20T11:08:54.287Z",
  status: 0,
  useHistory: [
    {
      date: "2014-11-02T11:08:54.287Z",
      from: "Smallville",
      to: "Bludhaven",
      cost: 11,
      timeInMinutes: 25,
    },
    {
      date: "2014-11-03T11:08:54.287Z",
      from: "Vanity",
      to: "Midway City",
      cost: 11,
      timeInMinutes: 38,
    },
    {
      date: "2015-01-04T11:08:54.287Z",
      from: "Dakota City",
      to: "Gotham",
      cost: 10,
      timeInMinutes: 53,
    },
    {
      date: "2015-02-20T11:08:54.287Z",
      from: "Blue Valley",
      to: "Opal City",
      cost: 16,
      timeInMinutes: 40,
    },
    {
      date: "2015-03-21T11:08:54.287Z",
      from: "Metropolis",
      to: "Keystone City",
      cost: 20,
      timeInMinutes: 30,
    },
  ],
};

function formatDataAsStringForDoc(data) {
  const lines = [
    `Ticket Number: ${data.ticketNumber}`,
    `Owner: ${data.owner.name}`,
    `Age: ${data.owner.age}`,
    `Funds: ${formatCurrency(data.funds)}`,
    `Valid Until: ${new Date(data.validUntil).toLocaleDateString()}`,
    `Status: ${possibleStatuses[data.status]}`,
    ` `,
    `Trips History:`,
  ];

  data.useHistory.forEach((history) => {
    lines.push(
      `Date: ${new Date(history.date).toLocaleDateString()}, From: ${history.from}, To: ${
        history.to
      }, Cost: ${formatCurrency(history.cost)}, Time: ${formatTimeElapsedFromMinutes(history.timeInMinutes)}`
    );
  });

  return lines.join("\r\n\r\n");
}

function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

function generateDocx(data) {
  loadFile("./data/input.docx", function (error, content) {
    if (error) {
      throw error;
    }
    const zip = new PizZip(content);
    const doc = new window.docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render({
      first_name: "John",
      last_name: "Doe",
      phone: "+",
      description: "GAD application",
      content: formatDataAsStringForDoc(data),
    });

    const blob = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
    });
    saveAs(blob, `bus-ticket-data-${data.ticketNumber}.docx`);
  });
}
