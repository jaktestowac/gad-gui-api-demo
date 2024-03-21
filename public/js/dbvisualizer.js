const dbEndpoint = "./api/db";

const refreshBtn = document.getElementById("refreshBtn");
const statsLbl = document.getElementById("statsLbl");
const queryInfoLbl = document.getElementById("queryInfo");

const floatingBox = document.getElementById("floatingBox");
const resizeBtn = document.getElementById("resizeBtn");
const sqlQuery = document.getElementById("sqlQuery");
let isExpanded = false;

let simpleSuccessBox = "simpleSuccessBox";
let simpleErrorBox = "simpleErrorBox";
let simpleInfoBox = "simpleInfoBox";

const sampleQueries = {
  0: "Sample query...",
  1: "SELECT * FROM users",
  2: `SELECT *
FROM users
WHERE id = 1`,
  3: `SELECT *
FROM users
WHERE email
LIKE '%@test.test'`,
  4: `SELECT email, firstname, lastname
FROM users`,
  5: `SELECT a.id, a.title, a.date, u.firstname, u.lastname
FROM articles a
INNER JOIN users u ON a.user_id = u.id;`,
  10: `SELECT users.id, users.email, COUNT(articles.id) AS article_count
FROM users
JOIN articles ON users.id = articles.user_id
GROUP BY users.id, users.email;`,
  11: `SELECT articles.id, articles.title, users.email
FROM articles
JOIN users ON articles.user_id = users.id;`,
  12: `SELECT articles.id, articles.title, users.email
FROM articles
JOIN users ON articles.user_id = users.id
WHERE articles.title LIKE '%test%';`,
  20: `SELECT a.id AS article_id, a.title, COUNT(c.id) AS comment_count
FROM articles a
LEFT JOIN comments c ON a.id = c.article_id 
GROUP BY a.id, a.title;`,
};

const sampleQuerySelect = document.getElementById("sampleQuerySelect");

Object.keys(sampleQueries).forEach((key) => {
  const option = document.createElement("option");
  option.value = key;
  option.text = sampleQueries[key];
  sampleQuerySelect.appendChild(option);
});

async function issueGetDb() {
  const dbAsJson = await fetch(dbEndpoint, {}).then((r) => r.json());
  return dbAsJson;
}

function setMessage(msg, className) {
  queryInfoLbl.innerHTML = `<div class="${className}">${msg}</div>`;
}

// Function to generate table from JSON data
function generateTable(data, tableName) {
  var table = document.createElement("table");
  var thead = document.createElement("thead");
  var tbody = document.createElement("tbody");

  // Create table header
  var headerRow = document.createElement("tr");
  Object.keys(data[0]).forEach(function (key) {
    var th = document.createElement("th");
    th.textContent = key;

    if (key === "id") {
      th.classList.add("primary-key");
      th.textContent = key + " (PK)";
    }
    if (key.includes("_id")) {
      th.classList.add("foreign-key");
      th.textContent = key + " (FK)";
    }
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table rows
  data.forEach(function (item) {
    var row = document.createElement("tr");
    Object.entries(item).forEach(function ([key, value]) {
      var td = document.createElement("td");
      let cellValue = value;

      if (cellValue !== null && cellValue !== undefined) {
        cellValue = `${value}`.slice(0, 75) + (value.length > 75 ? "(...)" : "");
      } else {
        cellValue = "";
      }
      if (key === "id" && isNotNullNorUndefined(value)) {
        const singularTableName = tableName.slice(0, -1);
        row.setAttribute("id", `${singularTableName}_${value}`);
        td.textContent = cellValue;
      } else if (key?.includes("_ids") && isNotNullNorUndefined(value)) {
        const foreignTable = key.split("_")[0];

        cellValue.split(",").forEach((id) => {
          const fullId = `${foreignTable}_${id}`;
          td.innerHTML += `<a href="#${fullId}" onclick="highlightRow('${fullId}')" >${id}</a> `;
        });
      } else if (key?.includes("_id") && isNotNullNorUndefined(value)) {
        const foreignTable = key.split("_")[0];
        const fullId = `${foreignTable}_${value}`;
        td.innerHTML = `<a href="#${fullId}" onclick="highlightRow('${fullId}')" >${value}</a>`;
      } else {
        td.textContent = cellValue;
      }

      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  // Add table name as h2 element
  const tableNameHeading = document.createElement("h2");
  tableNameHeading.textContent = tableName;
  jsonTable.appendChild(tableNameHeading);

  return table;
}

function isNotNullNorUndefined(value) {
  return value !== null && value !== undefined && value !== "null" && value !== "undefined";
}

// Function to highlight destination row
function highlightRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.classList.add("highlight");
    setTimeout(() => {
      row.classList.remove("highlight");
    }, 5000);
  }
}

// Normalize objects with null properties
function normalizeObjects(data) {
  const keys = data.reduce((allKeys, obj) => {
    Object.keys(obj).forEach((key) => {
      if (!allKeys.includes(key)) {
        allKeys.push(key);
      }
    });
    return allKeys;
  }, []);

  const normalizedData = data.map((obj) => {
    const normalizedObj = {};
    keys.forEach((key) => {
      normalizedObj[key] = obj.hasOwnProperty(key) ? obj[key] : null;
    });
    return normalizedObj;
  });

  return normalizedData;
}

// Render JSON data as table
const jsonTable = document.getElementById("jsonTable");
let databaseAsJson = {};

async function refreshData() {
  refreshBtn.disable = true;
  jsonTable.innerHTML = "";
  return issueGetDb().then((data) => {
    displayResults(data);
  });
}

function displayResults(data) {
  databaseAsJson = data;
  let status = "";
  Object.keys(data).forEach((tableName) => {
    const normalizedData = normalizeObjects(data[tableName]);
    jsonTable.appendChild(generateTable(normalizedData, tableName));
    status += `${tableName}: ${normalizedData.length} rows, `;
  });
  refreshBtn.disable = false;
  statsLbl.innerHTML = `Last updated: ${new Date().toLocaleTimeString()}; <br/>Status:<br/>${status}`;
}

function executeSqlQuery(sqlQuery) {
  try {
    Object.keys(databaseAsJson).forEach((tableName) => {
      alasql(`CREATE TABLE IF NOT EXISTS \`${tableName}\``);
      alasql.tables[tableName].data = databaseAsJson[tableName];
    });

    var res = alasql(sqlQuery);
    const normalizedData = normalizeObjects(res);
    jsonTable.innerHTML = "";
    jsonTable.appendChild(generateTable(normalizedData, "Results:"));
    setMessage(`Found: ${res?.length} records`, simpleSuccessBox);
  } catch (error) {
    setMessage(error.message, simpleErrorBox);
  }
}

function runQuery() {
  // https://github.com/AlaSQL/alasql
  const sqlQuery = document.getElementById("sqlQuery").value;
  const checkbox = document.getElementById("refreshRequest");
  const checkboxValue = checkbox.checked;

  if (sqlQuery === "") {
    setMessage("Invalid query", simpleInfoBox);
    return;
  }

  if (checkboxValue === true) {
    refreshData().then(() => {
      executeSqlQuery(sqlQuery);
    });
  } else {
    executeSqlQuery(sqlQuery);
  }
}

function selectSampleQuery() {
  const sqlQueryId = document.getElementById("sampleQuerySelect").value;
  if (sqlQueryId === "0") {
    // document.getElementById("sqlQuery").value = "";
    inputQueryArea.setValue("");
    setMessage("", "");
    return;
  }
  //   document.getElementById("sqlQuery").value = sampleQueries[sqlQueryId];
  inputQueryArea.setValue(sampleQueries[sqlQueryId]);
}

resizeBtn.addEventListener("click", function () {
  if (isExpanded) {
    floatingBox.style.width = "400px"; // Set the width back to the original size
    isExpanded = false;
    sqlQuery.rows = 4;
    inputQueryArea.setSize("100%", 50);
  } else {
    floatingBox.style.width = "600px"; // Update the width to 2x the original size
    isExpanded = true;
    sqlQuery.rows = 7;
    inputQueryArea.setSize("100%", 210);
  }
});

var inputQueryArea = CodeMirror.fromTextArea(document.getElementById("sqlQuery"), {
  mode: "sql",
  indentWithTabs: true,
  smartIndent: true,
  lineNumbers: true,
  autofocus: true,
  styleActiveLine: true,
});

refreshData();
