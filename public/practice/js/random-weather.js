async function getRandomSimpleWeatherData(daysBack = 1) {
  return fetch(`/api/v1/data/random/weather-simple?days=${daysBack}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  }).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      return {};
    }
  });
}

function presentDataOnUIAsATable(weatherData) {
  const resultsContainer = document.getElementById("results-container");
  const table = document.createElement("table");
  table.classList.add("results-table");
  table.setAttribute("id", "results-table");
  table.setAttribute("class", "results-table");
  table.style.borderCollapse = "collapse";
  table.style.textAlign = "center";

  const headerRow = document.createElement("tr");
  headerRow.style.backgroundColor = "lightgray";
  headerRow.style.border = "1px solid black";

  const headerDate = document.createElement("th");
  headerDate.textContent = "Date";
  headerDate.style.border = "1px solid black";
  headerDate.style.textAlign = "center";
  headerRow.appendChild(headerDate);

  const headerTemperature = document.createElement("th");
  headerTemperature.innerHTML = "Temperature<br>(°C)";
  headerTemperature.style.border = "1px solid black";
  headerTemperature.style.textAlign = "center";
  headerRow.appendChild(headerTemperature);

  const headerHumidity = document.createElement("th");
  headerHumidity.innerHTML = "Humidity<br>(%)";
  headerHumidity.style.border = "1px solid black";
  headerHumidity.style.textAlign = "center";
  headerRow.appendChild(headerHumidity);

  const headerDayLength = document.createElement("th");
  headerDayLength.innerHTML = "Day Length<br>(hours)";
  headerDayLength.style.border = "1px solid black";
  headerDayLength.style.textAlign = "center";
  headerRow.appendChild(headerDayLength);

  const headerWindSpeed = document.createElement("th");
  headerWindSpeed.innerHTML = "Wind Speed<br>(km/h)";
  headerWindSpeed.style.border = "1px solid black";
  headerWindSpeed.style.textAlign = "center";
  headerRow.appendChild(headerWindSpeed);

  const headerWindSpeedRange = document.createElement("th");
  headerWindSpeedRange.innerHTML = "Wind Speed<br>Range (km/h)";
  headerWindSpeedRange.style.border = "1px solid black";
  headerWindSpeedRange.style.textAlign = "center";
  headerRow.appendChild(headerWindSpeedRange);

  table.appendChild(headerRow);

  weatherData.forEach((row, index) => {
    let idSuffix = "";

    const tr = document.createElement("tr");
    tr.classList.add("transactions-row");
    const dateCell = document.createElement("td");
    dateCell.textContent = row.date;

    if (row.date === undefined) {
      dateCell.textContent = "Unknown";
    }

    dateCell.setAttribute("data-testid", `dti-date${idSuffix}`);
    dateCell.setAttribute("id", `date${idSuffix}`);
    dateCell.classList.add("table-cell");
    dateCell.style.textAlign = "center";
    tr.appendChild(dateCell);

    const temperatureCell = document.createElement("td");
    temperatureCell.textContent = row.temperature;
    if (row.temperature === undefined) {
      temperatureCell.textContent = "Unknown";
    }
    temperatureCell.setAttribute("data-testid", `dti-temperature${idSuffix}`);
    temperatureCell.setAttribute("id", `temperature${idSuffix}`);
    temperatureCell.classList.add("table-cell");
    temperatureCell.style.textAlign = "center";
    tr.appendChild(temperatureCell);

    const humidityCell = document.createElement("td");
    humidityCell.textContent = row.humidity;
    if (row.humidity === undefined) {
      humidityCell.textContent = ""; // 🐞
    }
    humidityCell.setAttribute("data-testid", `dti-humidity${idSuffix}`);
    humidityCell.setAttribute("id", `humidity${idSuffix}`);
    humidityCell.classList.add("table-cell");
    humidityCell.style.textAlign = "center";
    tr.appendChild(humidityCell);

    const dayLengthCell = document.createElement("td");
    dayLengthCell.textContent = row.dayLength;
    if (row.dayLength === undefined) {
      dayLengthCell.textContent = "Unknown";
    }
    dayLengthCell.setAttribute("data-testid", `dti-dayLength${idSuffix}`);
    dayLengthCell.setAttribute("id", `dayLength${idSuffix}`);
    dayLengthCell.classList.add("table-cell");
    dayLengthCell.style.textAlign = "center";
    tr.appendChild(dayLengthCell);

    const windSpeedCell = document.createElement("td");
    windSpeedCell.textContent = row.windSpeed;
    if (row.windSpeed === undefined) {
      dayLengthCell.textContent = "Unknown"; // 🐞
    }
    windSpeedCell.setAttribute("data-testid", `dti-windSpeed${idSuffix}`);
    windSpeedCell.setAttribute("id", `windSpeed${idSuffix}`);
    windSpeedCell.classList.add("table-cell");
    windSpeedCell.style.textAlign = "center";
    tr.appendChild(windSpeedCell);

    const windSpeedRangeCell = document.createElement("td");

    windSpeedRangeCell.textContent = row.windSpeedRange;
    if (row.windSpeedRange === undefined) {
      windSpeedRangeCell.textContent = "Unknown";
    }
    windSpeedRangeCell.setAttribute("data-testid", `dti-windSpeedRange${idSuffix}`);
    windSpeedRangeCell.setAttribute("id", `windSpeedRange${idSuffix}`);
    windSpeedRangeCell.classList.add("table-cell");
    windSpeedRangeCell.style.textAlign = "center";
    tr.appendChild(windSpeedRangeCell);

    table.appendChild(tr);
  });
  resultsContainer.appendChild(table);

  // add comment based on weather data - about temperature, wind speed, humidity, and min/max temperature
  const summaryContainer = document.getElementById("results-summary");

  const comment = document.createElement("p");
  comment.setAttribute("id", "comment");
  comment.setAttribute("class", "comment");

  const temperature = weatherData[0].temperature;
  const windSpeed = weatherData[0].windSpeed;
  const humidity = weatherData[0].humidity;
  const humidityValue = parseInt(humidity.slice(0, -1));
  const temperatureMin = weatherData[0].temperatureMin;
  const temperatureMax = weatherData[0].temperatureMax;

  if (temperature < 10) {
    const emoji = temperature < 5 ? "❄️" : "🥶";
    comment.innerHTML = `It's cold ${emoji} outside`;
  } else if (temperature >= 10 && temperature < 20) {
    const emoji = temperature < 15 ? "🌤️" : "🌥️";
    comment.innerHTML = `It's cool ${emoji} outside`;
  } else if (temperature >= 20) {
    const emoji = temperature < 25 ? "🌞" : "🔥";
    comment.innerHTML = `It's warm ${emoji} outside`;
  } else {
    comment.innerHTML = `Temperate is unknown`;
  }

  if (windSpeed < 10) {
    const emoji = windSpeed < 5 ? "🍃" : "🌬️";
    comment.innerHTML += ` and wind is calm ${emoji}.`;
  } else if (windSpeed >= 10 && windSpeed < 30) {
    const emoji = windSpeed < 20 ? "🌬️" : "💨";
    comment.innerHTML += ` and wind is moderate ${emoji}.`;
  } else if (windSpeed >= 30) {
    const emoji = windSpeed < 40 ? "💨" : "🌪️";
    comment.innerHTML += ` and wind is strong ${emoji}.`;
  } else {
    comment.innerHTML = ` and wind is unknown. Stay safe!`;
  }

  comment.innerHTML += "<br>";

  if (humidityValue < 30) {
    comment.innerHTML += " The air is dry.";
  } else if (humidityValue >= 30 && humidityValue < 60) {
    comment.innerHTML += " The air is moderate.";
  } else if (humidityValue >= 60) {
    comment.innerHTML += " The air is humid.";
  } else {
    comment.innerHTML += " The air humidity is unknown.";
  }

  if (temperatureMin < 10 && temperatureMax < 20) {
    const emoji = temperatureMin < 5 ? "❄️" : "🥶";
    comment.innerHTML += ` The temperature will be low today ${emoji}.`;
  } else if (temperatureMin >= 10 && temperatureMax < 20) {
    const emoji = temperatureMin < 15 ? "🌤️" : "🌥️";
    comment.innerHTML += ` The temperature will be moderate today ${emoji}.`;
  } else if (temperatureMin >= 20) {
    const emoji = temperatureMin < 25 ? "🌞" : "🔥";
    comment.innerHTML += ` The temperature will be high today ${emoji}.`;
  }

  comment.innerHTML += "<br>";
  if (temperature < 0) {
    comment.innerHTML += `<br><span style='color: red;'><strong>Warning</strong>: Extreme cold weather conditions. Stay inside and keep warm.</span>`;
  }
  if (temperature > 30) {
    comment.innerHTML += `<br><span style='color: red;'><strong>Warning</strong>: Extreme hot weather conditions. Stay hydrated and avoid direct sun exposure.</span>`;
  }
  if (windSpeed > 40) {
    comment.innerHTML += `<br><span style='color: red;'><strong>Warning</strong>: Extreme wind speed. Stay inside and avoid going outside.</span>`;
  }
  if (humidityValue > 80) {
    comment.innerHTML += `<br><span style='color: red;'><strong>Warning</strong>: Extreme humidity. Stay inside and keep cool.</span>`;
  }

  summaryContainer.appendChild(comment);
}

function getAndPresentRandomWeatherData() {
  getRandomSimpleWeatherData().then((data) => {
    presentDataOnUIAsATable(data);
  });
}
