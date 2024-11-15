function displayCanvasData(weatherDataForCanvas, chartId, animationDuration = 1000) {
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
      animation: {
        duration: animationDuration,
      },
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

function displaySimpleHouseholdExpenses(dataForCanvas, chartId, animationDuration = 750) {
  if (window.myCharts === undefined) {
    window.myCharts = {};
  }

  if (window.myCharts[chartId] != undefined) {
    window.myCharts[chartId].destroy();
  }

  var ctx = document.getElementById(chartId).getContext("2d");

  const dates = dataForCanvas.map((data) => data.date);
  const dailyBalance = dataForCanvas.map((data) => data.dailyBalance);

  dates.reverse();
  dailyBalance.reverse();

  let totalBalance = 0;
  const totalBalanceData = dailyBalance.map((balance) => {
    if (balance === 0) {
      return NaN;
    } else {
      totalBalance += balance;
    }
    return totalBalance;
  });

  window.myCharts[chartId] = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Daily Balance",
          data: dailyBalance,
          borderColor: "red",
          backgroundColor: "rgba(255, 0, 0, 0.2)",
        },
        {
          label: "Total Balance",
          data: totalBalanceData,
          borderColor: "blue",
          backgroundColor: "rgba(255, 0, 0, 0.2)",
        },
      ],
    },
    options: {
      scales: {
        y: {
          grid: {
            lineWidth: ({ tick }) => (tick.value == 0 ? 1 : 1),
            color: ({ tick }) => (tick.value == 0 ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.1)"),
          },
        },
      },
      animation: {
        duration: animationDuration,
      },
      plugins: {
        title: {
          display: true,
          text: "Household Expenses",
          font: {
            size: 16,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.dataset.label + ": " + context.parsed.y + " zł";
            },
          },
        },
      },
    },
  });
}
