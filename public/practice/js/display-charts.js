function displayChartsData(weatherDataForCanvas, chartId) {
  google.charts.load("current", { packages: ["corechart"] });
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
    const dataRaw = [];

    dataRaw.push(["Date", "Temperature", "Humidity", "Wind Speed"]);

    for (let i = 0; i < weatherDataForCanvas.weatherData.length; i++) {
      const weather = weatherDataForCanvas.weatherData[i];
      const date = weather.date;
      const temperature = weather.temperature.average;
      const humidity = weather.humidity;
      const windSpeed = weather.wind.speed;
      dataRaw.push([date, temperature, humidity, windSpeed]);
    }

    const options = {
      title: "Weather Data",
      width: 1000,
      height: 600,
      hAxis: {
        title: "Date",
      },
      legend: { position: "bottom" },
    };

    const chart = new google.visualization.LineChart(document.getElementById(chartId));
    const data = google.visualization.arrayToDataTable(dataRaw);
    chart.draw(data, options);
  }
}
