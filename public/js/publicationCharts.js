const articlesEndpoint = "/api/stats/publish/articles/";
const commentsEndpoint = "/api/stats/publish/comments/";

let results;

async function issueGetRequest() {
  // get data from the server:

  if (dataType === "comments") {
    results = await Promise.all([commentsEndpoint].map((url) => fetch(url).then((r) => r.json())));
  } else {
    results = await Promise.all([articlesEndpoint].map((url) => fetch(url).then((r) => r.json())));
  }

  google.charts.setOnLoadCallback(displayData);
}

const displayData = () => {
  chartType = chartType ?? "yearly";
  const publicationData = results[0][chartType];

  const dataForChart = [];

  for (const key of Object.keys(publicationData)) {
    dataForChart.push([key, publicationData[key]]);
  }
  dataForChart.sort(function (a, b) {
    return a[0].localeCompare(b[0]);
  });
  dataForChart.splice(0, 0, ["Entities", "Number of publications"]);

  // Doc: https://developers.google.com/chart/interactive/docs/gallery/columnchart?hl=pl
  const dataTable = google.visualization.arrayToDataTable(dataForChart);

  const element = document.getElementById("publications");
  let chart = new google.visualization.ColumnChart(element);
  let options = {
    title: "Number of publications",
    width: 720,
    height: 400,
    vAxis: {
      minValue: 0,
      format: "0",
    },
    legend: { position: "none" },
  };

  chart.draw(dataTable, options);

  document.querySelector("#btnDownloadVisitsDataCsv").onclick = () => {
    download("publications.csv", dataForChart);
  };
  document.querySelector("#btnDownloadVisitsDataJson").onclick = () => {
    download("publications.json", publicationData);
  };
  document.querySelector("#btnDownloadVisitsDataCsv").disabled = false;
  document.querySelector("#btnDownloadVisitsDataJson").disabled = false;
  document.querySelector("#tableChart").style.visibility = "visible";
};

const CSV_SEP = ";";
const jsonToCSV = (object) => {
  console.log(object);
  let csv = "";
  if (!Array.isArray(object)) {
    csv = Object.entries(Object.entries(object)[0][1])
      .map((e) => e[0])
      .join(CSV_SEP);
    csv += "\r\n";
  }

  for (const [k, v] of Object.entries(object)) {
    csv += Object.values(v).join(CSV_SEP) + "\r\n";
  }
  return csv;
};

const download = (filename, data) => {
  let text = "NO DATA";
  if (filename.includes("csv")) {
    text = jsonToCSV(data);
  } else if (filename.includes("json")) {
    text = JSON.stringify(data, null, 4);
  }

  var element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

function getParams() {
  var values = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    values[key] = value;
  });
  return values;
}

function invokeChart(type) {
  chartType = type;
  issueGetRequest();
}

function changeChart(type) {
  chartType = type;
  displayData();
}

// Load google charts
google.charts.load("current", { packages: ["corechart"] });

let dataType = getParams()["data"];
if (dataType === undefined || dataType === "undefined" || dataType.length === 0) {
  dataType = "articles";
}

let chartType = getParams()["type"];
invokeChart(chartType);

function generatePDF() {
  const element = document.getElementById("tableChart");
  var opt = {
    margin: 1,
    filename: "visit_stats.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 1 },
    jsPDF: { unit: "mm", format: "a3", orientation: "portrait" },
  };
  // Docs: https://github.com/eKoopmans/html2pdf.js
  html2pdf().set(opt).from(element).save();
}
