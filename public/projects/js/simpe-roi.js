const calcRoiEndpoint = "../../api/calc/simpleroi";

async function issuePostRoiRequest(settings) {
  const data = fetch(calcRoiEndpoint, {
    method: "POST",
    body: JSON.stringify(settings),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).then((r) => r.json());
  return data;
}

function calculateSprintROI() {
  const data = getValues();
  issuePostRoiRequest(data).then((results) => {
    displayData(results);
  });
}

function getValues() {
  // Retrieve input values
  var costPerSprint = parseFloat(document.getElementById("costPerSprint").value);
  var benefitPerSprint = parseFloat(document.getElementById("benefitPerSprint").value);
  var numberOfSprints = parseInt(document.getElementById("numberOfSprints").value);

  const data = {};
  data.costPerSprint = costPerSprint;
  data.benefitPerSprint = benefitPerSprint;
  data.numberOfSprints = numberOfSprints;

  return data;
}

function displayData(data) {
  // Prepare the table for results
  var resultTable = document.getElementById("resultTable");
  resultTable.innerHTML = ""; // Clear previous results

  // Create table headers
  var header = resultTable.createTHead();
  var headerRow = header.insertRow(0);
  headerRow.insertCell(0).outerHTML = "<th>Sprint Number</th>";
  headerRow.insertCell(1).outerHTML = "<th>Total Cost ($)</th>";
  headerRow.insertCell(2).outerHTML = "<th>Total Benefit ($)</th>";
  headerRow.insertCell(3).outerHTML = "<th>ROI (%)</th>";

  for (var i = 0; i <= data.numberOfSprints; i++) {
    // Insert row per sprint
    var row = resultTable.insertRow(-1);
    row.insertCell(0).textContent = i + 1; // Sprint number
    row.insertCell(1).textContent = data.totalCumulativeCostsPerSprint[i].toFixed(2);
    row.insertCell(2).textContent = data.totalCumulativeBenefitsPerSprint[i].toFixed(2);
    row.insertCell(3).textContent = data.sprintROI[i].toFixed(2);
  }

  displayChart(
    data.sprints,
    [
      { label: "Total Cumulative Benefits Per Sprint", data: data.totalCumulativeBenefitsPerSprint, yAxisID: "A" },
      { label: "Total Cumulative Costs Per Sprint", data: data.totalCumulativeCostsPerSprint, yAxisID: "A" },
      { label: "Profit Per Sprint", data: data.profitPerSprint, yAxisID: "A" },
      { label: "Total Cumulative Profit Per Sprint", data: data.totalCumulativeProfitPerSprint, yAxisID: "A" },
    ],
    "chartRoi",
    "ROI - Manual Tests and Automation (Cumulative Costs)",
    ["USD", ""]
  );
}

function displayChart(x, y, chartId, title, yLabels = ["USD", ""]) {
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
                const lbl = context.dataset.label.toLowerCase();
                if (lbl.includes("cost") || lbl.includes("benefit") || lbl.includes("profit")) {
                  label += new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                    context.parsed.y
                  );
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
          title: { display: true, text: yLabels[0] },
        },
        B: {
          beginAtZero: true,
          position: "right",
          title: { display: true, text: yLabels[1] },
        },
      },
    },
  });
}
