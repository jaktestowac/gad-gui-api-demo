const urlBookShopOrdersStatsUrl = "/api/book-shop-stats/orders";
const urlBookShopUsersStatsUrl = "/api/book-shop-stats/users";
const urlBookShopItemsStatsUrl = "/api/book-shop-stats/items";

async function issueGetAllOrdersStatsRequest() {
  let urlOrders = `${urlBookShopOrdersStatsUrl}`;
  const data = fetch(urlOrders, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetAllUsersStatsRequest() {
  let urlUsers = `${urlBookShopUsersStatsUrl}`;
  const data = fetch(urlUsers, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetAllItemsStatsRequest() {
  let urlItems = `${urlBookShopItemsStatsUrl}`;
  const data = fetch(urlItems, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

function formatCostValue(value) {
  return (parseInt(value) / 100).toFixed(2);
}

function formatCostValueInObject(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = formatCostValue(obj[key]);
    return acc;
  }, {});
}

function presentOrderStatsOnCharts(stats) {
  stats.totalCost = formatCostValue(stats.totalCost);
  stats.totalPartialCosts = formatCostValueInObject(stats.totalPartialCosts);

  const itemTypes = Object.keys(stats.totalBooksPerType);

  displayBarChart(
    Object.keys(stats.totalBooksPerType),
    [{ label: "Total item types in orders", data: Object.values(stats.totalBooksPerType), yAxisID: "A" }],
    "booksCountChartCanvas",
    "Total item types in orders",
    "Number of items",
    "Order ID"
  );

  issueGetBookShopOrderStatusesRequest().then((response) => {
    if (response.status === 200) {
      response.json().then((statuses) => {
        const statusesMap = {};
        statuses.forEach((status) => {
          statusesMap[status.id] = status;
        });
        const statusNameWithCounts = {};
        Object.keys(statusesMap).forEach((statusId) => {
          statusNameWithCounts[statusesMap[statusId].name] = stats.totalStatusesPerType[statusId];
        });

        displayBarChart(
          Object.keys(statusNameWithCounts),
          [{ label: "Order statuses", data: Object.values(statusNameWithCounts), yAxisID: "A" }],
          "orderStatusesCountChartCanvas",
          "Order statuses",
          "Number of order",
          "Order status"
        );
      });
    }
  });

  displayBarChart(
    Object.keys(stats.totalPartialCosts),
    [{ label: "Cumulative Partial Costs", data: Object.values(stats.totalPartialCosts), yAxisID: "A" }],
    "totalCostsPerPartialCostChartCanvas",
    "Cumulative Partial Costs",
    "PLN",
    "Partial Cost Type"
  );
}

function presentUserStatsOnCharts(stats) {
  stats.totalCost = formatCostValue(stats.totalCost);
  stats.costsPerUser = formatCostValueInObject(stats.costsPerUser);

  displayBarChart(
    Object.keys(stats.costsPerUser),
    [{ label: "Total Cost per User", data: Object.values(stats.costsPerUser), yAxisID: "A" }],
    "totalCostsPerUserChartCanvas",
    "Total Cost per User",
    "PLN",
    "Account ID"
  );

  displayBarChart(
    Object.keys(stats.booksPerUser),
    [{ label: "Total Books per User", data: Object.values(stats.booksPerUser), yAxisID: "A" }],
    "totalBooksPerUserChartCanvas",
    "Total Books per User",
    "Number of books",
    "Account ID"
  );
}

function presentItemsStatsOnCharts(stats) {
  displayBarChart(
    Object.keys(stats.totalItemsPerPrice),
    [{ label: "Total Items per Price", data: Object.values(stats.totalItemsPerPrice), yAxisID: "A" }],
    "totalItemsPerPriceChartCanvas",
    "Price",
    "Number of uniqueitems",
    "PLN"
  );

  displayBarChart(
    Object.keys(stats.totalItemsPerQuantity),
    [{ label: "Total Items per Quantity", data: Object.values(stats.totalItemsPerQuantity), yAxisID: "A" }],
    "totalItemsPerQuantityChartCanvas",
    "Quantity",
    "Number of unique items",
    "Quantity"
  );
}

function displayBarChart(x, y, chartId, title, yLabel = "", xLabel = "") {
  if (window.myCharts === undefined) {
    window.myCharts = {};
  }

  if (window.myCharts[chartId] != undefined) {
    window.myCharts[chartId].destroy();
  }

  const datasets = [];

  y.forEach((element) => {
    datasets.push({
      label: element.label,
      data: element.data,
      borderWidth: 1,
      yAxisID: element.yAxisID,
      type: element.type,
    });
  });

  var ctx = document.getElementById(chartId).getContext("2d");
  window.myCharts[chartId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: x,
      datasets: datasets,
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 24,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                if (context.dataset.label.toLowerCase().includes("cost")) {
                  label += new Intl.NumberFormat("PL", { style: "currency", currency: "PLN" }).format(context.parsed.y);
                } else {
                  label += Math.round(context.parsed.y);
                }
              }
              return label;
            },
          },
        },
      },
      scales: {
        A: {
          beginAtZero: true,
          position: "left",
          title: { display: true, text: yLabel },
        },
        x: {
          title: {
            display: true,
            text: xLabel,
          },
        },
      },
    },
  });
}

function displayRawStatsInTable(stats) {
  const keyHeaderPair = {
    totalOrders: "Total Orders",
    totalCost: "Total Cost<br>(after discounts)",
    totalBooks: "Total Books",
    totalBooksSold: "Total Books Sold",
  };

  const container = document.getElementById("raw-stats-container");
  container.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("table");
  table.classList.add("table-small");

  Object.keys(keyHeaderPair).forEach((key) => {
    const tr = document.createElement("tr");

    const th = document.createElement("th");
    const tdHeader = document.createElement("td");
    tdHeader.innerHTML = keyHeaderPair[key];

    th.appendChild(tdHeader);
    tr.appendChild(th);

    const value = key.toLowerCase().includes("cost") ? formatPrice(stats[key]) : stats[key];

    const td = document.createElement("td");
    td.appendChild(document.createTextNode(value));
    tr.appendChild(td);

    table.appendChild(tr);
  });

  container.appendChild(table);
}

function addControls() {
  const container = document.getElementById("manage-charts-controls");
  container.innerHTML = "";

  // add two radio buttons to switch charts
  const radio1 = document.createElement("input");
  radio1.type = "radio";
  radio1.id = "orders-stats";
  radio1.name = "chart-type";
  radio1.value = "orders-stats";
  radio1.checked = true;

  const label1 = document.createElement("label");
  label1.htmlFor = "orders-stats";
  label1.appendChild(document.createTextNode("Orders"));

  const radio2 = document.createElement("input");
  radio2.type = "radio";
  radio2.id = "users-stats";
  radio2.name = "chart-type";
  radio2.value = "users-stats";

  const label2 = document.createElement("label");
  label2.htmlFor = "users-stats";
  label2.appendChild(document.createTextNode("Users"));

  const radio3 = document.createElement("input");
  radio3.type = "radio";
  radio3.id = "items-stats";
  radio3.name = "chart-type";
  radio3.value = "items-stats";

  const label3 = document.createElement("label");
  label3.htmlFor = "items-stats";
  label3.appendChild(document.createTextNode("Items"));

  container.appendChild(radio1);
  container.appendChild(label1);
  container.appendChild(radio2);
  container.appendChild(label2);
  container.appendChild(radio3);
  container.appendChild(label3);

  radio1.addEventListener("change", () => {
    const containerCostCharts = document.getElementById("costCharts");
    containerCostCharts.style.display = "block";

    const containerUserCharts = document.getElementById("userCharts");
    containerUserCharts.style.display = "none";

    const containerItemsCharts = document.getElementById("itemsCharts");
    containerItemsCharts.style.display = "none";

    issueGetAllOrdersStatsRequest().then((response) => {
      if (response.status === 200) {
        response.json().then((data) => {
          displayRawStatsInTable(data);
          presentOrderStatsOnCharts(data);
        });
      } else {
        response.json().then((data) => {
          if (data.error?.message) {
            showSimpleAlert(`${data.error.message}`, 2);
          }
        });
      }
    });
  });

  radio2.addEventListener("change", () => {
    const containerCostCharts = document.getElementById("costCharts");
    containerCostCharts.style.display = "none";

    const containerUserCharts = document.getElementById("userCharts");
    containerUserCharts.style.display = "block";

    const containerItemsCharts = document.getElementById("itemsCharts");
    containerItemsCharts.style.display = "none";

    issueGetAllUsersStatsRequest().then((response) => {
      if (response.status === 200) {
        response.json().then((data) => {
          displayRawStatsInTable(data);
          presentUserStatsOnCharts(data);
        });
      } else {
        response.json().then((data) => {
          if (data.error?.message) {
            showSimpleAlert(`${data.error.message}`, 2);
          }
        });
      }
    });
  });

  radio3.addEventListener("change", () => {
    const containerCostCharts = document.getElementById("costCharts");
    containerCostCharts.style.display = "none";

    const containerUserCharts = document.getElementById("userCharts");
    containerUserCharts.style.display = "none";

    const containerItemsCharts = document.getElementById("itemsCharts");
    containerItemsCharts.style.display = "block";

    issueGetAllItemsStatsRequest().then((response) => {
      if (response.status === 200) {
        response.json().then((data) => {
          displayRawStatsInTable(data);
          presentItemsStatsOnCharts(data);
        });
      } else {
        response.json().then((data) => {
          if (data.error?.message) {
            showSimpleAlert(`${data.error.message}`, 2);
          }
        });
      }
    });
  });
}

checkIfAuthenticated(
  "dashboard-info",
  () => {
    issueGetBookShopAccountRequest().then((response) => {
      if (response.status === 200) {
        addControls();
        issueGetAllOrdersStatsRequest().then((response) => {
          if (response.status === 200) {
            response.json().then((data) => {
              displayRawStatsInTable(data);
              presentOrderStatsOnCharts(data);
            });
          } else {
            const dashboardInfo = document.getElementById("dashboard-info");
            setBoxMessage(dashboardInfo, "You dont have permission to see statistics", "simpleInfoBox");

            response.json().then((data) => {
              if (data.error?.message) {
                showSimpleAlert(`${data.error.message}`, 2);
              }
            });
          }
        });
      } else {
        response.json().then((data) => {
          const dashboardInfo = document.getElementById("dashboard-info");
          setBoxMessage(dashboardInfo, "Please log in (as Admin) to see the content", "simpleInfoBox");
        });
      }
    });
  },
  () => {},
  { defaultRedirect: true }
);
