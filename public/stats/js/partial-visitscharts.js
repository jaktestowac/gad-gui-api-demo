const articlesVisitsEndpoint = "../../api/visits/articles";
const commentsVisitsEndpoint = "../../api/visits/comments";
const usersVisitsEndpoint = "../../api/visits/users";
const articlesEndpoint = "../../api/articles/";
const commentsEndpoint = "../../api/comments/";
const usersEndpoint = "../../api/users/";

let results;
let maxNumberOfVisits = 10;
const minValueElement = document.getElementById("minValue");
const minValueLabelElement = document.getElementById("minValueLabel");

async function issueGetRequest() {
  // get data from the server:

  if (dataType === "comments") {
    results = await Promise.all(
      [commentsVisitsEndpoint, commentsEndpoint, articlesEndpoint].map((url) => fetch(url).then((r) => r.json()))
    );
  } else if (dataType === "users") {
    results = await Promise.all([usersVisitsEndpoint, usersEndpoint].map((url) => fetch(url).then((r) => r.json())));
  } else {
    results = await Promise.all(
      [articlesVisitsEndpoint, articlesEndpoint].map((url) => fetch(url).then((r) => r.json()))
    );
  }

  google.charts.setOnLoadCallback(displayData);
}

const displayData = (limit = 0) => {
  const visitsData = results[0];
  const entitiesData = results[1];
  let additionalData;

  if (dataType === "comments") {
    additionalData = results[2];
  }

  const entityIdToTitle = {};

  for (let j = 0; j < entitiesData.length; j++) {
    if (dataType === "articles") {
      entityIdToTitle[entitiesData[j].id] = `${entitiesData[j].title?.substring(0, 100)} (...)`;
    } else if (dataType === "comments") {
      entityIdToTitle[entitiesData[j].id] = `${entitiesData[j].body?.substring(0, 100)} (...)`;
    } else if (dataType === "users") {
      entityIdToTitle[entitiesData[j].id] = `${entitiesData[j].firstname} ${entitiesData[j].lastname}`;
    } else {
      entityIdToTitle[entitiesData[j].id] = `${entitiesData[j].id}`;
    }
  }

  const dataForChart = [["Entities", "Number of visits"]];

  for (const entityId in visitsData) {
    let key = entityIdToTitle[entityId] ? entityIdToTitle[entityId] : entityId;
    if (key.length === 0) {
      // key = "[empty]";
      continue;
    } else if (key.includes("article_id=")) {
      key = `[a] ${key.split("?")[1]}`;
    }

    if (visitsData[entityId] >= limit) {
      dataForChart.push([key, visitsData[entityId]]);
    }

    if (visitsData[entityId] >= maxNumberOfVisits) {
      maxNumberOfVisits = visitsData[entityId];
    }
  }

  minValueElement.max = maxNumberOfVisits;

  // Doc: https://developers.google.com/chart/interactive/docs/gallery/columnchart?hl=pl
  const dataTable = google.visualization.arrayToDataTable(dataForChart);

  const element = document.getElementById("visits");
  let chart = new google.visualization.ColumnChart(element);
  let options = {
    title: "Number of visits",
    width: 720,
    height: 400,
    vAxis: {
      minValue: 0,
      format: "0",
    },
    legend: { position: "none" },
  };

  if (chartType === "pie") {
    chart = new google.visualization.PieChart(element);

    options = {
      title: "Number of visits",
      width: 720,
      height: 400,
      vAxis: {
        minValue: 0,
        format: "0",
      },
      legend: { position: "left", textStyle: { fontSize: 10 } },
    };
    options.chartArea = { left: 20, right: 20, top: 40, bottom: 20 };
    chart.draw(dataTable, options);

    document.querySelector("#btnDownloadVisitsDataCsv").onclick = () => {
      download("visits.csv", dataForChart);
    };
    document.querySelector("#btnDownloadVisitsDataJson").onclick = () => {
      download("visits.json", dataForChart);
    };
    document.querySelector("#btnDownloadVisitsDataCsv").disabled = false;
    document.querySelector("#btnDownloadVisitsDataJson").disabled = false;
    document.querySelector("#tableChart").style.visibility = "visible";
  } else {
    chart.draw(dataTable, options);

    document.querySelector("#btnDownloadVisitsDataCsv").onclick = () => {
      download("visits.csv", dataForChart);
    };
    document.querySelector("#btnDownloadVisitsDataJson").onclick = () => {
      download("visits.json", dataForChart);
    };
    document.querySelector("#btnDownloadVisitsDataCsv").disabled = false;
    document.querySelector("#btnDownloadVisitsDataJson").disabled = false;
    document.querySelector("#tableChart").style.visibility = "visible";
  }
};

function invokeChart(type) {
  chartType = type;
  issueGetRequest();
}

// Load google charts
google.charts.load("current", { packages: ["corechart"] });

let dataType = getParams()["data"];
if (dataType === undefined || dataType === "undefined" || dataType.length === 0) {
  dataType = "articles";
}

let chartType = getParams()["type"];
invokeChart(chartType);

function changeMinValue() {
  minValueLabelElement.innerHTML = minValueElement.value;
  displayData(minValueElement.value);
}

function generateChartPDF(filename) {
  generatePDF(filename, "tableChart");
}
