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
  document.querySelector("#btnDownloadDataXlsx").onclick = () => {
    downloadXlsx("publications.xlsx", dataForChart);
  };
  document.querySelector("#btnDownloadVisitsDataJson").onclick = () => {
    download("publications.json", publicationData);
  };
  document.querySelector("#btnDownloadVisitsDataCsv").disabled = false;
  document.querySelector("#btnDownloadVisitsDataJson").disabled = false;
  document.querySelector("#btnDownloadDataXlsx").disabled = false;
  document.querySelector("#tableChart").style.visibility = "visible";
};

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
