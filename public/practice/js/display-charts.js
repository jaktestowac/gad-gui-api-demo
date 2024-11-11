function displayChartsData(weatherDataForCanvas, chartId, width = 1000, height = 600) {
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
      width: width,
      height: height,
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

function displayGeneratedData(weatherData, chartId, width = 1000, height = 600) {
  google.charts.load("current", { packages: ["corechart"] });
  google.charts.setOnLoadCallback(drawChart);
  console.log(weatherData);
  function drawChart() {
    const dataRaw = [];

    dataRaw.push(["Date", "Temperature [C]", "Humidity [%]"]);

    for (let i = weatherData.length - 1; i >= 0; i--) {
      const weather = weatherData[i];
      const date = weather.date;
      const temperature = parseInt(weather.temperature.trim("°C"));
      const humidity = parseInt(weather.humidity.trim("%"));
      dataRaw.push([date, temperature, humidity]);
    }

    const options = {
      title: "Weather Data",
      width: width,
      height: height,
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

function displayChartsDataFromAPI(weatherDataForCanvas, chartId, width = 1000, height = 600) {
  google.charts.load("current", { packages: ["corechart"] });
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
    const dataRaw = [];

    dataRaw.push(["Date", "Temperature [C]", "Humidity [%]", "Wind Speed [km/h]"]);

    for (let i = weatherDataForCanvas.length - 1; i >= 0; i--) {
      const weather = weatherDataForCanvas[i];
      const date = weather.date;
      const temperature = weather.temperatureRaw;
      const humidity = parseInt(weather.humidity.trim("%"));
      const windSpeed = weather.windSpeedData.actual;
      dataRaw.push([date, temperature, humidity, windSpeed]);
    }

    const options = {
      title: "Weather Data (from API)",
      width: width,
      height: height,
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
