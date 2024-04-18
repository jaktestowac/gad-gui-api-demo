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

  for (var i = 1; i <= data.numberOfSprints; i++) {
    // Insert row per sprint
    var row = resultTable.insertRow(-1);
    row.insertCell(0).textContent = i; // Sprint number
    row.insertCell(1).textContent = data.totalCostsPerSprint[i].toFixed(2);
    row.insertCell(2).textContent = data.totalBenefitsPerSprint[i].toFixed(2);
    row.insertCell(3).textContent = data.sprintROI[i].toFixed(2);
  }
}
