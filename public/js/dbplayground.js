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

const maxFieldLength = 70;

const sampleQueries = {
  0: "> Pick a query...",
  1: "-- Users:",
  2: "SELECT * FROM users",
  3: `SELECT *
  FROM users
  WHERE id = 1`,
  4: `SELECT *
  FROM users
  WHERE email
  LIKE '%@test.test'`,
  5: `SELECT email, firstname, lastname
  FROM users`,
  6: `Insert into users (email, firstname, lastname) values ('xyz@test.test', 'John', 'Doe')`,
  10: "-- Articles:",
  11: `SELECT *
  FROM articles
  WHERE title
  LIKE '%test%'`,
  12: `SELECT *
  FROM articles
  WHERE body
  LIKE '%playwright%'`,
  13: `SELECT title, body
  FROM articles
  WHERE body
  LIKE '%playwright%'`,
  20: "-- Comments:",
  21: `SELECT *
  FROM comments
  WHERE body
  LIKE '%automation%'`,
  50: "-- Joins:",
  51: `SELECT a.id, a.title, a.date, u.firstname, u.lastname
  FROM articles a
  INNER JOIN users u ON a.user_id = u.id;`,
  52: `SELECT users.id, users.email, COUNT(articles.id) AS article_count
  FROM users
  JOIN articles ON users.id = articles.user_id
  GROUP BY users.id, users.email;`,
  53: `SELECT articles.id, articles.title, users.email
  FROM articles
  JOIN users ON articles.user_id = users.id;`,
  54: `SELECT articles.id, articles.title, users.email
  FROM articles
  JOIN users ON articles.user_id = users.id
  WHERE articles.title LIKE '%test%';`,
  55: `SELECT a.id AS article_id, a.title, COUNT(c.id) AS comment_count
  FROM articles a
  LEFT JOIN comments c ON a.id = c.article_id 
  GROUP BY a.id, a.title;`,
  900: "-- Advanced:",
  901: `SHOW TABLES`,
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
function generateTable(data, tableName, addLinks = true) {
  var table = document.createElement("table");
  var thead = document.createElement("thead");
  var tbody = document.createElement("tbody");

  // Create table header
  var headerRow = document.createElement("tr");

  if (data.length > 0) {
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
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table rows
  data.forEach(function (item) {
    var row = document.createElement("tr");
    Object.entries(item).forEach(function ([key, value]) {
      var td = document.createElement("td");
      let cellValue = value;

      if (cellValue !== null && cellValue !== undefined) {
        cellValue = `${value}`.slice(0, maxFieldLength) + (value.length > maxFieldLength ? "(...)" : "");
      } else {
        cellValue = "";
      }
      if (key === "id" && isNotNullNorUndefined(value)) {
        const singularTableName = tableName.slice(0, -1);
        row.setAttribute("id", `${singularTableName}_${value}`);
        td.textContent = cellValue;

        var spanAnchor = document.createElement("span");
        spanAnchor.setAttribute("id", `anchor_${singularTableName}_${value}`);
        spanAnchor.classList.add("anchor");
        td.appendChild(spanAnchor);
      } else if (key?.includes("_ids") && isNotNullNorUndefined(value)) {
        const foreignTable = key.split("_")[0];

        cellValue.split(",").forEach((id) => {
          const fullId = `${foreignTable}_${id}`;
          if (addLinks === true) {
            td.innerHTML += `<a href="#anchor_${fullId}" onclick="highlightRow('${fullId}')" >${id}</a> `;
          } else {
            td.innerHTML += `${id} `;
          }
        });
      } else if (key?.includes("_id") && isNotNullNorUndefined(value)) {
        const foreignTable = key.split("_")[0];
        const fullId = `${foreignTable}_${value}`;
        if (addLinks === true) {
          td.innerHTML = `<a href="#anchor_${fullId}" onclick="highlightRow('${fullId}')" >${value}</a>`;
        } else {
          td.textContent = value;
        }
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
  if (data === undefined || Object.keys(data).length === 0) {
    return [];
  }

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
    status += `${tableName} [${normalizedData.length}], `;
  });
  refreshBtn.disable = false;
  statsLbl.innerHTML = `Last updated: ${new Date().toLocaleTimeString()}; <br/>Rows: ${status}`;
}

function executeSqlQuery(sqlQuery) {
  const DB_NAME = "gaddb";
  try {
    try {
      alasql(`CREATE DATABASE IF NOT EXISTS ${DB_NAME};`);
    } catch (error) {
      if (!error.message.includes("already exists")) {
        console.error(`${error.message} but proceeding...`);
      }
    }
    alasql(`USE ${DB_NAME};`);
    Object.keys(databaseAsJson).forEach((tableName) => {
      alasql(`CREATE TABLE IF NOT EXISTS \`${tableName}\``);
      alasql.tables[tableName].data = databaseAsJson[tableName];
    });

    var res = alasql(sqlQuery);

    if (res.length >= 0) {
      const normalizedData = normalizeObjects(res);
      jsonTable.innerHTML = "";
      jsonTable.appendChild(generateTable(normalizedData, "Results:", false));
      setMessage(`Found: ${normalizedData?.length} records`, simpleSuccessBox);
    } else if (res === 1) {
      setMessage("Query executed successfully (but READ-ONLY MODE!)", simpleInfoBox);
    } else {
      setMessage(res, simpleErrorBox);
    }
  } catch (error) {
    console.error(error);
    setMessage(error, simpleErrorBox);
  }
}

function runQuery() {
  // https://github.com/AlaSQL/alasql
  //   const sqlQuery = document.getElementById("sqlQuery").value;
  const sqlQuery = inputQueryArea.getValue();
  const checkbox = document.getElementById("refreshRequest");
  const checkboxValue = checkbox.checked;

  if (sqlQuery === "") {
    setMessage("Please provide query", simpleInfoBox);
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
  const query = sampleQueries[sqlQueryId];
  if (query === undefined || query.startsWith("> ") || query.startsWith("-- ")) {
    // document.getElementById("sqlQuery").value = "";
    inputQueryArea.setValue("");
    setMessage("", "");
    return;
  }
  // document.getElementById("sqlQuery").value = sampleQueries[sqlQueryId];
  inputQueryArea.setValue(sampleQueries[sqlQueryId]);
}

resizeBtn.addEventListener("click", function () {
  if (isExpanded) {
    floatingBox.style.width = "400px";
    isExpanded = false;
    sqlQuery.rows = 5;
    inputQueryArea.setSize("100%", 50);
  } else {
    floatingBox.style.width = "600px";
    isExpanded = true;
    sqlQuery.rows = 8;
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
  extraKeys: { "Ctrl-Space": "autocomplete" },
  hint: CodeMirror.hint.sql,
});

const menu = document.querySelector(".floating-menu");

document.addEventListener("scroll", () => {
  if (document.documentElement.scrollTop > 120) menu.classList.add("transparent");
  else menu.classList.remove("transparent");
});

refreshData();
