const { RandomValueGenerator } = require("./random-data.generator");

const weatherTypes = [
  "☀️ Sunny",
  "🌤️ Partly Cloudy",
  "⛅ Cloudy",
  "🌦️ Showers",
  "🌧️ Rainy",
  "🌩️ Thunderstorms",
  "❄️ Snowy",
  "💨 Windy",
  "🌫️ Foggy",
];

const moonPhaseTypes = [
  "🌑 New Moon",
  "🌒 Waxing Crescent",
  "🌓 First Quarter",
  "🌔 Waxing Gibbous",
  "🌕 Full Moon",
  "🌖 Waning Gibbous",
  "🌗 Last Quarter",
  "🌘 Waning Crescent",
];

const airQualityIndexAQI = [
  { range: "0-50", quality: "Good", color: "green" },
  { range: "51-100", quality: "Moderate", color: "yellow" },
  { range: "101-150", quality: "Unhealthy for Sensitive Groups", color: "orange" },
  { range: "151-200", quality: "Unhealthy", color: "red" },
  { range: "201-300", quality: "Very Unhealthy", color: "purple" },
  { range: "301-500", quality: "Hazardous", color: "maroon" },
];

const windSpeedTypes = [
  "0-5 km/h",
  "5-10 km/h",
  "10-15 km/h",
  "15-20 km/h",
  "20-25 km/h",
  "25-30 km/h",
  "30-35 km/h",
  "35-40 km/h",
];

const weatherAlertTypes = [
  { name: "None", icon: "" },
  { name: "Thunderstorm Warning", icon: "⛈️" },
  { name: "Tornado Watch", icon: "🌪️" },
  { name: "Flood Advisory", icon: "🌊" },
  { name: "Blizzard Warning", icon: "❄️" },
  { name: "Heat Advisory", icon: "🌡️" },
  { name: "Air Quality Alert", icon: "🌬️" },
  { name: "High Wind Warning", icon: "💨" },
  { name: "Winter Storm Watch", icon: "🌨️" },
  { name: "Volcano Alert", icon: "🌋" },
  { name: "Meteor Alert", icon: "☄️" },
  { name: "Solar Flare Warning", icon: "🔆" },
  { name: "Earthquake Alert", icon: "🌍" },
  { name: "Tsunami Warning", icon: "🌊" },
  { name: "Avalanche Warning", icon: "❄️" },
];

function generateDateStrings(pastDays) {
  const dateStrings = [];
  for (let i = 0; i < pastDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dateStrings.push(date.toISOString().split("T")[0]);
  }
  return dateStrings;
}

function generateWeatherDataForNDays(nSamples) {
  const pastDays = generateDateStrings(nSamples);

  const weatherData = [];
  for (let i = 0; i < nSamples; i++) {
    const dataGenerator = new RandomValueGenerator(pastDays[i]);

    const date = pastDays[i];
    const weather = weatherTypes[dataGenerator.getNextValue(0, weatherTypes.length - 1)];

    let temperature = `${dataGenerator.getNextValue(15, 35)}°C`;
    if (dataGenerator.getNextValue(0, 100) < 20) {
      temperature = `${dataGenerator.getNextValue(-20, 50)}°C`;
    }

    const sunriseHour = dataGenerator.getNextValue(4, 6);
    const sunsetHour = dataGenerator.getNextValue(19, 23);
    const sunriseSunset = `${sunriseHour}:00 AM - ${sunsetHour}:00 PM`;

    const humidity = `${dataGenerator.getNextValue(30, 90)}%`;

    let windSpeed = windSpeedTypes[0];
    if (dataGenerator.getNextValue(0, 100) < 20) {
      windSpeed = windSpeedTypes[dataGenerator.getNextValue(0, windSpeedTypes.length - 1)];
    }

    const windDirection = dataGenerator.getNextValue(0, 360);
    const moonPhase = moonPhaseTypes[dataGenerator.getNextValue(0, moonPhaseTypes.length - 1)];
    const airQualityIndex = airQualityIndexAQI[dataGenerator.getNextValue(0, airQualityIndexAQI.length - 1)];

    let weatherAlert = weatherAlertTypes[0];
    if (dataGenerator.getNextValue(0, 100) < 25) {
      weatherAlert = weatherAlertTypes[dataGenerator.getNextValue(0, weatherAlertTypes.length - 1)];
    }

    weatherData.push({
      date,
      weather,
      temperature,
      sunriseSunset,
      humidity,
      windSpeed,
      windDirection,
      moonPhase,
      airQualityIndex,
      weatherAlert,
    });
  }

  return weatherData;
}

module.exports = {
  generateWeatherDataForNDays,
};
