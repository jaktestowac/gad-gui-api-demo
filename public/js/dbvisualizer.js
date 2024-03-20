// JSON data
var jsonData = {
  users: [
    {
      id: 1,
      email: "Moses.Armstrong@Feest.ca",
      firstname: "Moses",
      lastname: "Armstrong",
      password: "test1",
      avatar: ".\\data\\users\\face_1591133479.7144732.jpg",
    },
    {
      id: 2,
      email: "Danial.Dicki@dicki.test",
      firstname: "Danial",
      lastname: "Dicki",
      password: "test2",
      avatar: ".\\data\\users\\face_1591133060.68834.jpg",
    },
  ],
  articles: [
    {
      id: 1,
      title: "How to write effective test cases",
      body: "Test cases are the backbone of any testing process...",
      user_id: 1,
      date: "2021-07-13T16:35:00Z",
      image: ".\\data\\images\\256\\presentation_b9889e1e-d60f-4230-b7d6-04981145c588.jpg",
    },
    {
      id: 2,
      title: "Benefits of continuous integration and delivery",
      body: "Continuous integration (CI) and continuous delivery (CD)...",
      user_id: 2,
      date: "2020-06-15T11:12:00Z",
      image: ".\\data\\images\\256\\tester-app_744f913b-f1de-4334-87e4-0b9e43171a10.jpg",
    },
  ],
};

const dbEndpoint = "./api/db";

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
      if (key === "id") {
        const singularTableName = tableName.slice(0, -1);
        row.setAttribute("id", `${singularTableName}_${value}`);
        td.textContent = cellValue;
      } else if (key.includes("_ids")) {
        const foreignTable = key.split("_")[0];

        cellValue.split(",").forEach((id) => {
          const fullId = `${foreignTable}_${id}`;
          td.innerHTML += `<a href="#${fullId}" onclick="highlightRow('${fullId}')" >${id}</a> `;
        });
      } else if (key.includes("_id")) {
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

// Render JSON data as table
const jsonTable = document.getElementById("jsonTable");

issueGetDb().then((data) => {
  Object.keys(data).forEach((tableName) => {
    jsonTable.appendChild(generateTable(data[tableName], tableName));
  });
});
