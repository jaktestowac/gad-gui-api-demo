const dbEndpoint = "./api/db";

const refreshBtn = document.getElementById("refreshBtn");
const statsLbl = document.getElementById("statsLbl");

async function issueGetDb() {
  const dbAsJson = await fetch(dbEndpoint, {}).then((r) => r.json());
  return dbAsJson;
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
    }, 4000);
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

function refreshData() {
  refreshBtn.disable = true;
  jsonTable.innerHTML = "";
  issueGetDb().then((data) => {
    let status = "";
    Object.keys(data).forEach((tableName) => {
      const normalizedData = normalizeObjects(data[tableName]);
      jsonTable.appendChild(generateTable(normalizedData, tableName));
      status += `${tableName}: ${normalizedData.length} rows, `;
    });
    refreshBtn.disable = false;
    statsLbl.innerHTML = `Last updated: ${new Date().toLocaleTimeString()}; <br/>Status:<br/>${status}`;
  });
}

refreshData();
