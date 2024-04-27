const calcRoiEndpoint = "../../api/calc/roi";

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

function getValues() {
  const data = {};

  // Fetch inputs from form
  const numberOfEnvs = parseFloat(document.getElementById("numberOfEnvs").value);
  const numberOfSprints = parseFloat(document.getElementById("numberOfSprints").value);
  const baseTestCases = parseFloat(document.getElementById("baseTestCases").value);
  const startingTestCases = parseFloat(document.getElementById("startingTestCases").value);
  const newTestsPerRelease = parseFloat(document.getElementById("newTestsPerRelease").value) / 100;
  const modifiedTestsPerRelease = parseFloat(document.getElementById("modifiedTestsPerRelease").value) / 100;
  const removedTestsPerRelease = parseFloat(document.getElementById("removedTestsPerRelease").value) / 100;
  const automationNotApplicable = parseFloat(document.getElementById("automationNotApplicable").value) / 100;
  const averageEffortOnModificationOfManualTC =
    parseFloat(document.getElementById("averageEffortOnModificationOfManualTC").value) / 100;
  const averageEffortOnModificationOfAutomatedTC =
    parseFloat(document.getElementById("averageEffortOnModificationOfAutomatedTC").value) / 100;
  const numberOfAutomationOfBaseTestCases =
    parseFloat(document.getElementById("numberOfAutomationOfBaseTestCases").value) / 100;

  const manualCreationHours = parseFloat(document.getElementById("manualCreationHours").value);
  const manualExecutionHours = parseFloat(document.getElementById("manualExecutionHours").value);
  const automationCreationHours = parseFloat(document.getElementById("automationCreationHours").value);
  const automationExecutionHours = parseFloat(document.getElementById("automationExecutionHours").value);
  const additionalMaintenanceHours = parseFloat(document.getElementById("additionalMaintenanceHours").value);

  const hourlyCost = parseFloat(document.getElementById("hourlyCost").value);

  data.numberOfEnvs = numberOfEnvs;
  data.numberOfSprints = numberOfSprints;
  data.baseTestCases = baseTestCases;
  if (
    data.baseTestCases === undefined ||
    data.baseTestCases === null ||
    data.baseTestCases === "" ||
    isNaN(data.baseTestCases)
  ) {
    data.baseTestCases = 0;
  }

  data.startingTestCases = startingTestCases;
  data.newTestsPerRelease = newTestsPerRelease;
  data.modifiedTestsPerRelease = modifiedTestsPerRelease;
  data.removedTestsPerRelease = removedTestsPerRelease;
  data.automationNotApplicable = automationNotApplicable;
  data.averageEffortOnModificationOfManualTC = averageEffortOnModificationOfManualTC;
  data.averageEffortOnModificationOfAutomatedTC = averageEffortOnModificationOfAutomatedTC;
  data.numberOfAutomationOfBaseTestCases = numberOfAutomationOfBaseTestCases;
  data.manualCreationHours = manualCreationHours;
  data.manualExecutionHours = manualExecutionHours;
  data.automationCreationHours = automationCreationHours;
  data.automationExecutionHours = automationExecutionHours;
  data.additionalMaintenanceHours = additionalMaintenanceHours;
  data.hourlyCost = hourlyCost;

  return data;
}

function createTable(data) {
  var table = document.createElement("table");
  var div = document.getElementById("roiTable");
  div.appendChild(table);

  // Add table headers
  var headers = ["Sprint", "New", "Modified", "Removed", "Total", "Not Automation"];
  var headerRow = table.insertRow();
  for (var i = 0; i < headers.length; i++) {
    var headerCell = headerRow.insertCell();
    headerCell.innerHTML = headers[i];
  }

  // Add table rows
  for (var sprint = 1; sprint <= 10; sprint++) {
    var row = table.insertRow();
    var sprintCell = row.insertCell();
    sprintCell.innerHTML = sprint;

    var manualCostCell = row.insertCell();
    manualCostCell.innerHTML = "";

    var automationCostCell = row.insertCell();
    automationCostCell.innerHTML = "";
  }
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
                if (context.dataset.label.toLowerCase().includes("cost")) {
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

//create new instance of octavalidate
let formVal = new octaValidate("roiForm");
//attach event listener
document.querySelector("#calculateRoi").addEventListener("click", function (e) {
  e.preventDefault();
  //invoke the validate method
  if (formVal.validate() === true) {
    //validation successful
    presentROI();
  } else {
    //validation failed
  }
});

function presentROI() {
  const data = getValues();

  issuePostRoiRequest(data).then((dataCalc) => {
    displayChart(
      dataCalc.sprints,
      [
        { label: "Manual TC creation effort", data: dataCalc.manual.effort.creation, yAxisID: "A" },
        { label: "Automation of TC effort", data: dataCalc.automation.effort.creation, yAxisID: "A" },
        { label: "Manual execution effort", data: dataCalc.manual.effort.execution, yAxisID: "A" },
        { label: "Automation execution effort", data: dataCalc.automation.effort.execution, yAxisID: "A" },
        { label: "Automation maintenance effort", data: dataCalc.automation.effort.maintenance, yAxisID: "A" },
        { label: "Total no. of TC", data: dataCalc.totalTestCases, yAxisID: "B", type: "line" },
        { label: "Total no. of automated TC", data: dataCalc.automation.total, yAxisID: "B", type: "line" },
        { label: "No. of new TC", data: dataCalc.newTests, yAxisID: "B", type: "line" },
      ],
      "chartEffort",
      "Effort of Manual Tests and Automation (per Each Sprint)",
      ["Hours", ""]
    );
    displayChart(
      dataCalc.sprints,
      [
        { label: "Manual TC creation costs", data: dataCalc.manual.cost.creation, yAxisID: "A" },
        { label: "Automation of TC costs", data: dataCalc.automation.cost.creation, yAxisID: "A" },
        { label: "Manual execution costs", data: dataCalc.manual.cost.execution, yAxisID: "A" },
        { label: "Automation execution costs", data: dataCalc.automation.cost.execution, yAxisID: "A" },
        { label: "Automation maintenance costs", data: dataCalc.automation.cost.maintenance, yAxisID: "A" },
        { label: "Total no. of TC", data: dataCalc.totalTestCases, yAxisID: "B", type: "line" },
        { label: "Total no. of automated TC", data: dataCalc.automation.total, yAxisID: "B", type: "line" },
        { label: "No. of new TC", data: dataCalc.newTests, yAxisID: "B", type: "line" },
      ],
      "chartCosts",
      "Costs of Manual and Automation (per Each Sprint)",
      ["USD", ""]
    );
    displayChart(
      dataCalc.sprints,
      [
        { label: "Automation total costs", data: dataCalc.automation.cost.total, yAxisID: "A" },
        { label: "Manual total costs", data: dataCalc.manual.cost.total, yAxisID: "A" },
        { label: "Automation costs over manual", data: dataCalc.diff.automationAdditionalCosts, yAxisID: "A" },
        { label: "Total no. of TC", data: dataCalc.totalTestCases, yAxisID: "B", type: "line" },
        { label: "Total no. of automated TC", data: dataCalc.automation.total, yAxisID: "B", type: "line" },
        { label: "No. of new TC", data: dataCalc.newTests, yAxisID: "B", type: "line" },
      ],
      "chartRoi",
      "ROI - Manual Tests and Automation (Cumulative Costs)",
      ["USD", ""]
    );
  });
}

function change() {
  var startingValue = document.getElementById("startingValue");
  var baseTestCases = document.getElementById("baseTestCases").value;
  if (baseTestCases == 0) {
    startingValue.style.visibility = "visible";
  } else {
    startingValue.style.visibility = "collapse";
  }
}
