const surveyStatisticsEndpoint = "../../api/surveys/statistics";
const surveyQuestionsEndpoint = "../../api/surveys";

async function issueGetSurveyDescription(type) {
  const surveyDescriptionData = await fetch(`${surveyQuestionsEndpoint}/${type}/description`, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return surveyDescriptionData;
}

async function issueGetSurveyStatistics() {
  const surveyStatisticsData = await fetch(`${surveyStatisticsEndpoint}/${statsType}`, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return surveyStatisticsData;
}

function drawChart(title, data) {
  const containerDiv = document.getElementById("charts");
  const chartElement = document.createElement("div");
  containerDiv.appendChild(chartElement);

  let chart = new google.visualization.ColumnChart(chartElement);
  let options = {
    title: title,
    width: 720,
    height: 300,
    vAxis: {
      minValue: 0,
      format: "0",
    },
    legend: { position: "none" },
  };

  const dataForChart = [["", title]];

  dataForChart.push(...data);

  const dataTable = google.visualization.arrayToDataTable(dataForChart);
  chart.draw(dataTable, options);
}

function getAndDrawCharts() {
  issueGetSurveyStatistics().then((surveyStatisticsData) => {
    if (Object.keys(surveyStatisticsData).length === 0) {
      const containerDiv = document.getElementById("noDataHeader");
      containerDiv.style.visibility = "visible";
      return;
    } else {
      const containerDiv = document.getElementById("noDataHeader");
      containerDiv.style.visibility = "hidden";
    }

    Object.keys(surveyStatisticsData).forEach((key) => {
      const data = [];
      Object.keys(surveyStatisticsData[key]).forEach((answer) => {
        data.push([answer, surveyStatisticsData[key][answer]]);
      });

      drawChart(key, data);
    });
  });
}

let statsType = getParams()["type"];

// Load google charts
google.charts.load("current", { packages: ["corechart"] });

issueGetSurveyDescription(statsType).then((surveyDescriptionData) => {
  document.getElementById("surveyDetails").innerHTML = surveyDescriptionData.description.base;
});

issueGetSurveyStatistics();

google.charts.setOnLoadCallback(getAndDrawCharts);
