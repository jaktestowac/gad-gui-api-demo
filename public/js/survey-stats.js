const surveyStatisticsEndpoint = "../../api/surveys/manualapi/statistics";

async function issueGetSurveyStatistics() {
  const surveyStatisticsData = await fetch(surveyStatisticsEndpoint, {
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
    Object.keys(surveyStatisticsData).forEach((key) => {
      const data = [];
      Object.keys(surveyStatisticsData[key]).forEach((answer) => {
        data.push([answer, surveyStatisticsData[key][answer]]);
      });

      drawChart(key, data);
    });
  });
}

// Load google charts
google.charts.load("current", { packages: ["corechart"] });
issueGetSurveyStatistics();

google.charts.setOnLoadCallback(getAndDrawCharts);
