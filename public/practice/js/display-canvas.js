function displayCanvasData(weatherDataForCanvas, chartId) {
  if (window.myCharts === undefined) {
    window.myCharts = {};
  }

  if (window.myCharts[chartId] != undefined) {
    window.myCharts[chartId].destroy();
  }

  var ctx = document.getElementById(chartId).getContext("2d");

  const dates = weatherDataForCanvas.weatherData.map((data) => data.date);
  const temperatures = weatherDataForCanvas.weatherData.map((data) => data.temperature.average);
  const temperaturesHigh = weatherDataForCanvas.weatherData.map((data) => data.temperature.high);
  const temperaturesLow = weatherDataForCanvas.weatherData.map((data) => data.temperature.low);
  const humidities = weatherDataForCanvas.weatherData.map((data) => data.humidity);
  const winds = weatherDataForCanvas.weatherData.map((data) => data.wind.speed);

  window.myCharts[chartId] = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Temperature",
          data: temperaturesHigh,
          borderColor: "red",
          backgroundColor: "rgba(255, 0, 0, 0.2)",
        },
        {
          label: "Temperature",
          data: temperatures,
          borderColor: "orange",
          backgroundColor: "rgba(255, 0, 0, 0.2)",
        },
        {
          label: "Temperature",
          data: temperaturesLow,
          borderColor: "yellow",
          backgroundColor: "rgba(255, 0, 0, 0.2)",
        },
        {
          label: "Humidity",
          data: humidities,
          borderColor: "blue",
          backgroundColor: "rgba(0, 0, 255, 0.2)",
        },
        {
          label: "Wind Speed",
          data: winds,
          borderColor: "green",
          backgroundColor: "rgba(0, 255, 0, 0.2)",
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Weather Data",
          font: {
            size: 24,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.dataset.label + ": " + context.parsed.y;
            },
          },
        },
      },
    },
  });
}
