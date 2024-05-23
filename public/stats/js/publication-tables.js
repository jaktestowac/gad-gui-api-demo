const articlesStatsEndpoint = "../../api/stats/users/articles";
const commentsStatsEndpoint = "../../api/stats/users/comments";

async function issueGetArticlesStatsRequest() {
  return issueGetStatsRequest(articlesStatsEndpoint);
}

async function issueGetCommentsStatsRequest() {
  return issueGetStatsRequest(commentsStatsEndpoint);
}

async function issueGetStatsRequest(endpoint) {
  const data = fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).then((r) => r.json());
  return data;
}

function sortJsonDataByKey(jsonData, key) {
  return jsonData.sort((a, b) => b[key] - a[key]);
}

function displayData(jsonData, dataType) {
  const detailsPlaceholder = document.getElementById("detailsPlaceholder");
  detailsPlaceholder.textContent = `Showing user publication stats - total number of published ${dataType.toLowerCase()}`;
  // Create the table element
  const tablePlaceholder = document.getElementById("tablePlaceholder");
  const table = document.createElement("table");

  // Create the table headers
  const headers = ["User Name", dataType];
  const headerRow = document.createElement("tr");
  headers.forEach((headerText) => {
    const headerCell = document.createElement("th");
    headerCell.textContent = headerText;
    headerCell.style.textAlign = "center";
    headerCell.style.width = "50%";
    headerRow.appendChild(headerCell);
  });
  table.appendChild(headerRow);

  jsonData = sortJsonDataByKey(jsonData, dataType.toLowerCase());

  // Create the table rows
  jsonData.forEach((item) => {
    const row = document.createElement("tr");

    // Create the user name cell
    let userLink = `<a href="/user.html?id=${item.user.id}">${item.user.name}</a>`;
    const nameCell = document.createElement("td");
    nameCell.style.textAlign = "center";
    nameCell.innerHTML = userLink;
    row.appendChild(nameCell);

    // Create the value cell
    let valueLink = `<a href="/${dataType}.html?user_id=${item.user.id}">${item[dataType.toLowerCase()]}</a>`;
    const valueCell = document.createElement("td");
    valueCell.innerHTML = valueLink;
    valueCell.style.textAlign = "center";
    row.appendChild(valueCell);

    table.appendChild(row);
  });

  // Append the table to the document body
  tablePlaceholder.appendChild(table);
}

function getAndDisplayData(dataType) {
  dataType = dataType ?? "Articles";

  if (dataType?.toLowerCase() === "comments") {
    issueGetCommentsStatsRequest().then((jsonData) => {
      displayData(jsonData, "Comments");
    });
  } else {
    issueGetArticlesStatsRequest().then((jsonData) => {
      displayData(jsonData, "Articles");
    });
  }
}

const dataType = getParams()["data"];
getAndDisplayData(dataType);
