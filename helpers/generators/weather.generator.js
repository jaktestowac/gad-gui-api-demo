const { RandomValueGeneratorWithSeed } = require("./random-data.generator");
const { logDebug } = require("../logger-api");

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
  { range: "0-50", quality: "Good", color: "green", icon: "😊", index: 0 },
  { range: "51-100", quality: "Moderate", color: "yellow", icon: "😐", index: 1 },
  { range: "101-150", quality: "Unhealthy for Sensitive Groups", color: "orange", icon: "😷", index: 2 },
  { range: "151-200", quality: "Unhealthy", color: "red", icon: "🤢", index: 3 },
  { range: "201-300", quality: "Very Unhealthy", color: "purple", icon: "🤮", index: 4 },
  { range: "301-500", quality: "Hazardous", color: "maroon", icon: "💀", index: 5 },
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
  "40+ km/h",
];

const windSpeedRange = {
  "0-5 km/h": { min: 0, max: 5 },
  "5-10 km/h": { min: 5, max: 10 },
  "10-15 km/h": { min: 10, max: 15 },
  "15-20 km/h": { min: 15, max: 20 },
  "20-25 km/h": { min: 20, max: 25 },
  "25-30 km/h": { min: 25, max: 30 },
  "30-35 km/h": { min: 30, max: 35 },
  "35-40 km/h": { min: 35, max: 40 },
  "40+ km/h": { min: 40, max: 100 },
};

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

const pollenCountTypes = [
  { name: "Low", icon: "🟢", value: "0-2", index: 0 },
  { name: "Moderate", icon: "🟡", value: "3-5", index: 1 },
  { name: "High", icon: "🔴", value: "6-8", index: 2 },
  { name: "Very High", icon: "🟣", value: "9-10", index: 3 },
  { name: "Extreme", icon: "🟤", value: "11+", index: 4 },
];

const uvIndexTypes = [
  { name: "Low", icon: "🟢", value: "0-2", index: 0 },
  { name: "Moderate", icon: "🟡", value: "3-5", index: 1 },
  { name: "High", icon: "🔴", value: "6-7", index: 2 },
  { name: "Very High", icon: "🟣", value: "8-10", index: 3 },
  { name: "Extreme", icon: "🟤", value: "11+", index: 4 },
];

const fireRiskTypes = [
  { name: "Low", icon: "🟢", index: 0, value: { min: 0, max: 10 } },
  { name: "Moderate", icon: "🟡", index: 1, value: { min: 11, max: 20 } },
  { name: "High", icon: "🔴", index: 2, value: { min: 21, max: 40 } },
  { name: "Very High", icon: "🟣", index: 3, value: { min: 31, max: 50 } },
  { name: "Extreme", icon: "🟤", index: 4, value: { min: 41, max: 70 } },
  { name: "Catastrophic", icon: "⚫", index: 5, value: { min: 51, max: 100 } },
];

const floodRiskTypes = [
  { name: "Low", icon: "🟢", index: 0, value: { min: 0, max: 10 } },
  { name: "Moderate", icon: "🟡", index: 1, value: { min: 11, max: 20 } },
  { name: "High", icon: "🔴", index: 2, value: { min: 21, max: 40 } },
  { name: "Very High", icon: "🟣", index: 3, value: { min: 31, max: 50 } },
  { name: "Extreme", icon: "🟤", index: 4, value: { min: 41, max: 70 } },
  { name: "Catastrophic", icon: "⚫", index: 5, value: { min: 51, max: 100 } },
];

const lightningActivityTypes = [
  { name: "None", icon: "", index: 0 },
  { name: "Low", icon: "⚡", index: 1 },
  { name: "Moderate", icon: "⚡⚡", index: 2 },
  { name: "High", icon: "⚡⚡⚡", index: 3 },
  { name: "Very High", icon: "⚡⚡⚡⚡", index: 4 },
  { name: "Extreme", icon: "⚡⚡⚡⚡⚡", index: 5 },
];

function generatePasteDateStrings(pastDays) {
  const dateStrings = [];
  for (let i = 0; i < pastDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dateStrings.push(date.toISOString().split("T")[0]);
  }
  return dateStrings;
}

function generatePastAndFutureDateStringsFromDate(dateStr, pastDays = 0, futureDays = 0) {
  const dateStrings = [];
  for (let i = 0; i <= pastDays; i++) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - i);
    dateStrings.push(date.toISOString().split("T")[0]);
  }
  for (let i = 0; i <= futureDays; i++) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + i);
    dateStrings.push(date.toISOString().split("T")[0]);
  }

  const uniqueDateStrings = [...new Set(dateStrings)];
  uniqueDateStrings.sort((a, b) => new Date(a) - new Date(b));

  return uniqueDateStrings;
}

function generatePastDateStringsFromDate(dateStr, pastDays) {
  const dateStrings = [];
  for (let i = 0; i < pastDays; i++) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - i);
    dateStrings.push(date.toISOString().split("T")[0]);
  }
  return dateStrings;
}

function generateFutureDateStrings(pastDays) {
  const dateStrings = [];
  for (let i = 0; i < pastDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dateStrings.push(date.toISOString().split("T")[0]);
  }
  return dateStrings;
}

function generateFutureDateStringsFromDate(dateStr, pastDays) {
  const dateStrings = [];
  for (let i = 0; i < pastDays; i++) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + i);
    dateStrings.push(date.toISOString().split("T")[0]);
  }
  return dateStrings;
}

function generateWeatherDataForNPastDaysFromDate(date, nSamples, totalRandom = false, additionalSeed = "") {
  const pastDays = generatePastDateStringsFromDate(date, nSamples);
  return generateWeatherDataForNDays(nSamples, pastDays, totalRandom, additionalSeed);
}

function generateWeatherDataForNPastDays(nSamples, totalRandom = false, additionalSeed = "") {
  const pastDays = generatePasteDateStrings(nSamples);
  return generateWeatherDataForNDays(nSamples, pastDays, totalRandom, additionalSeed);
}

function generateWeatherDataForNFutureDays(nSamples, totalRandom = false, additionalSeed = "") {
  const pastDays = generateFutureDateStrings(nSamples);
  return generateWeatherDataForNDays(nSamples, pastDays, totalRandom, additionalSeed);
}

function generateWeatherDataForNFutureDaysFromDate(date, nSamples, totalRandom = false, additionalSeed = "") {
  const pastDays = generateFutureDateStringsFromDate(date, nSamples);
  return generateWeatherDataForNDays(nSamples, pastDays, totalRandom, additionalSeed);
}

function generateWeatherDataForNDays(nSamples, dayList, totalRandom = false, additionalSeed = "") {
  const weatherData = [];
  for (let i = 0; i < nSamples; i++) {
    let dataGenerator = new RandomValueGeneratorWithSeed(dayList[i] + additionalSeed);

    if (totalRandom === true) {
      dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
    }

    const date = dayList[i];

    let weather = weatherTypes[0];
    if (dataGenerator.getNextValue(0, 100) < 50) {
      weather = weatherTypes[dataGenerator.getNextValue(0, weatherTypes.length - 1)];
    }

    let temperature = dataGenerator.getNextValue(15, 35);
    if (dataGenerator.getNextValue(0, 100) < 20) {
      temperature = dataGenerator.getNextValue(-20, 50);
    }

    let temperatureLow = dataGenerator.getNextValue(temperature - 15, temperature);
    let temperatureHigh = dataGenerator.getNextValue(temperature, temperature + 15);
    let highLowTemperature = {
      low: `${temperatureLow}°C`,
      high: `${temperatureHigh}°C`,
      temperatureHigh,
      temperatureLow,
    };
    if (dataGenerator.getNextValue(0, 100) < 10) {
      let temperatureLow = dataGenerator.getNextValue(temperature - 30, temperature - 20);
      let temperatureHigh = dataGenerator.getNextValue(temperature + 20, temperature + 30);
      highLowTemperature = {
        low: `${temperatureLow}°C`,
        high: `${temperatureHigh}°C`,
        temperatureLow,
        temperatureHigh,
      };
    }

    let temperatureRaw = temperature;
    temperature = `${temperature}°C`;

    let pressure = `${dataGenerator.getNextValue(1000, 1050)} hPa`;
    if (dataGenerator.getNextValue(0, 100) < 20) {
      pressure = `${dataGenerator.getNextValue(950, 1050)} hPa`;
    } else if (dataGenerator.getNextValue(0, 100) < 10) {
      pressure = `${dataGenerator.getNextValue(950, 1000)} hPa`;
    }

    const sunriseHour = dataGenerator.getNextValue(4, 6);
    const sunsetHour = dataGenerator.getNextValue(19, 23);
    const sunriseSunset = `${sunriseHour}:00 AM - ${sunsetHour}:00 PM`;

    const dayLength = sunsetHour - sunriseHour;

    const humidity = `${dataGenerator.getNextValue(30, 90)}%`;

    const windDirection = dataGenerator.getNextValue(0, 360);
    const moonPhase = moonPhaseTypes[dataGenerator.getNextValue(0, moonPhaseTypes.length - 1)];

    let airQualityIndex = airQualityIndexAQI[0];
    if (dataGenerator.getNextValue(0, 100) < 50) {
      airQualityIndex = airQualityIndexAQI[dataGenerator.getNextValue(0, airQualityIndexAQI.length - 1)];
    }

    let weatherAlert = weatherAlertTypes[0];
    if (dataGenerator.getNextValue(0, 100) < 25) {
      weatherAlert = weatherAlertTypes[dataGenerator.getNextValue(0, weatherAlertTypes.length - 1)];
    }

    let pollenCount = pollenCountTypes[0];
    if (dataGenerator.getNextValue(0, 100) < 25) {
      pollenCount = pollenCountTypes[dataGenerator.getNextValue(0, pollenCountTypes.length - 1)];
    }

    let precipitation = `${dataGenerator.getNextValue(0, 10)}%`;
    if (weather === "🌧️ Rainy" || weather === "🌦️ Showers") {
      precipitation = `${dataGenerator.getNextValue(0, 100)}%`;
    }

    let uvIndex = uvIndexTypes[0];
    if (weather === "☀️ Sunny" || weather === "🌤️ Partly Cloudy") {
      uvIndex = uvIndexTypes[dataGenerator.getNextValue(0, uvIndexTypes.length - 1)];
    }

    let windSpeed = windSpeedTypes[0];
    if (dataGenerator.getNextValue(0, 100) < 10 || weather === "💨 Windy") {
      windSpeed = windSpeedTypes[dataGenerator.getNextValue(0, windSpeedTypes.length - 1)];
    }

    let windSpeedData = {};
    const tempWindSpeed = windSpeedRange[windSpeed];
    windSpeedData = {
      min: `${tempWindSpeed.min} km/h`,
      max: `${tempWindSpeed.max} km/h`,
      actual: dataGenerator.getNextValue(tempWindSpeed.min, tempWindSpeed.max),
    };

    let pollutants = ["CO", "NO2", "O3", "PM2.5", "PM10", "SO2"];
    let pollutantsData = {};
    pollutants.forEach((pollutant) => {
      pollutantsData[pollutant] = `${dataGenerator.getNextValue(0, 10)} μg/m³`;
      if (airQualityIndex.index === 0) {
        pollutantsData[pollutant] = `${dataGenerator.getNextValue(0, 10)} μg/m³`;
      } else if (airQualityIndex.index === 1) {
        pollutantsData[pollutant] = `${dataGenerator.getNextValue(0, 50)} μg/m³`;
      } else if (airQualityIndex.index === 2) {
        pollutantsData[pollutant] = `${dataGenerator.getNextValue(0, 100)} μg/m³`;
      } else if (airQualityIndex.index === 3) {
        pollutantsData[pollutant] = `${dataGenerator.getNextValue(0, 150)} μg/m³`;
      } else if (airQualityIndex.index === 4) {
        pollutantsData[pollutant] = `${dataGenerator.getNextValue(0, 200)} μg/m³`;
      } else if (airQualityIndex.index === 5) {
        pollutantsData[pollutant] = `${dataGenerator.getNextValue(0, 300)} μg/m³`;
      }
    });

    let visibility = `${dataGenerator.getNextValue(23, 50)} km`;
    if (weather === "🌫️ Foggy") {
      visibility = `${dataGenerator.getNextValue(0, 1)} km`;
    } else if (weather === "💨 Windy") {
      visibility = `${dataGenerator.getNextValue(0, 5)} km`;
    } else if (weather === "❄️ Snowy") {
      visibility = `${dataGenerator.getNextValue(0, 5)} km`;
    } else if (weather === "🌧️ Rainy" || weather === "🌦️ Showers") {
      visibility = `${dataGenerator.getNextValue(0, 5)} km`;
    } else if (weather === "🌩️ Thunderstorms") {
      visibility = `${dataGenerator.getNextValue(0, 3)} km`;
    } else if (weather === "☀️ Sunny" || weather === "🌤️ Partly Cloudy") {
      visibility = `${dataGenerator.getNextValue(23, 50)} km`;
    } else if (weather === "⛅ Cloudy") {
      visibility = `${dataGenerator.getNextValue(23, 50)} km`;
    }

    let cloudCover = `${dataGenerator.getNextValue(0, 10)}%`;
    if (weather === "🌫️ Foggy") {
      cloudCover = `${dataGenerator.getNextValue(90, 100)}%`;
    } else if (weather === "💨 Windy") {
      cloudCover = `${dataGenerator.getNextValue(80, 90)}%`;
    } else if (weather === "❄️ Snowy") {
      cloudCover = `${dataGenerator.getNextValue(80, 90)}%`;
    } else if (weather === "🌧️ Rainy" || weather === "🌦️ Showers") {
      cloudCover = `${dataGenerator.getNextValue(80, 90)}%`;
    } else if (weather === "🌩️ Thunderstorms") {
      cloudCover = `${dataGenerator.getNextValue(80, 90)}%`;
    } else if (weather === "☀️ Sunny" || weather === "🌤️ Partly Cloudy") {
      cloudCover = `${dataGenerator.getNextValue(0, 10)}%`;
    } else if (weather === "⛅ Cloudy") {
      cloudCover = `${dataGenerator.getNextValue(50, 80)}%`;
    }

    let fireRisk = dataGenerator.getNextValue(0, 10);
    if (weather === "🌧️ Rainy" || weather === "🌦️ Showers") {
      fireRisk = dataGenerator.getNextValue(0, 10);
    } else if (weather === "🌩️ Thunderstorms") {
      fireRisk = dataGenerator.getNextValue(0, 20);
    } else if (weather === "❄️ Snowy") {
      fireRisk = dataGenerator.getNextValue(0, 10);
    } else if (weather === "💨 Windy") {
      fireRisk = dataGenerator.getNextValue(0, 10);
    } else if (weather === "🌫️ Foggy") {
      fireRisk = dataGenerator.getNextValue(0, 10);
    } else if (weather === "☀️ Sunny" || weather === "🌤️ Partly Cloudy") {
      fireRisk = dataGenerator.getNextValue(20, 100);
    } else if (weather === "⛅ Cloudy") {
      fireRisk = dataGenerator.getNextValue(0, 40);
    }

    fireRisk = fireRiskTypes.find((risk) => fireRisk >= risk.value.min && fireRisk <= risk.value.max);

    let floodRisk = dataGenerator.getNextValue(0, 10);
    if (weather === "🌧️ Rainy" || weather === "🌦️ Showers") {
      floodRisk = dataGenerator.getNextValue(30, 100);
    } else if (weather === "🌩️ Thunderstorms") {
      floodRisk = dataGenerator.getNextValue(30, 100);
    } else if (weather === "❄️ Snowy") {
      floodRisk = dataGenerator.getNextValue(0, 10);
    } else if (weather === "💨 Windy") {
      floodRisk = dataGenerator.getNextValue(0, 10);
    } else if (weather === "🌫️ Foggy") {
      floodRisk = dataGenerator.getNextValue(0, 10);
    } else if (weather === "☀️ Sunny" || weather === "🌤️ Partly Cloudy") {
      floodRisk = dataGenerator.getNextValue(0, 10);
    } else if (weather === "⛅ Cloudy") {
      floodRisk = dataGenerator.getNextValue(0, 10);
    }

    floodRisk = floodRiskTypes.find((risk) => floodRisk >= risk.value.min && floodRisk <= risk.value.max);

    let lightningActivity = lightningActivityTypes[0];
    if (weather === "🌩️ Thunderstorms") {
      lightningActivity = lightningActivityTypes[dataGenerator.getNextValue(0, lightningActivityTypes.length - 1)];
    } else if (weather === "🌧️ Rainy" || weather === "🌦️ Showers" || weather === "⛅ Cloudy") {
      lightningActivity = lightningActivityTypes[dataGenerator.getNextValue(0, 2)];
    }

    weatherData.push({
      date,
      weather,
      cloudCover,
      temperature,
      temperatureRaw,
      highLowTemperature,
      sunriseSunset,
      dayLength,
      humidity,
      windSpeed,
      windSpeedData,
      windDirection,
      moonPhase,
      airQualityIndex,
      weatherAlert,
      uvIndex,
      pollenCount,
      pressure,
      precipitation,
      visibility,
      fireRisk,
      floodRisk,
      lightningActivity,
    });
  }

  return weatherData;
}

function generateWeatherResponse(
  date,
  days,
  city,
  limitedDays,
  limitedFutureDays,
  simplified = false,
  totalRandom = false
) {
  logDebug(`Requested weather data for:`, { days, limitedDays, limitedFutureDays, date });

  let weatherData = [];
  if (date === null || date === undefined || date === "") {
    weatherData = generateWeatherDataForNPastDays(limitedDays, totalRandom);
  } else {
    weatherData = generateWeatherDataForNPastDaysFromDate(date, limitedDays, totalRandom);
  }

  if (limitedFutureDays > 0) {
    limitedFutureDays += 1; // Add one more day because 1 is today
    let weatherDataFuture = [];

    if (date === null || date === undefined || date === "") {
      weatherDataFuture = generateWeatherDataForNFutureDays(limitedFutureDays, totalRandom);
    } else {
      weatherDataFuture = generateWeatherDataForNFutureDaysFromDate(date, limitedFutureDays, totalRandom);
    }

    if (weatherDataFuture.length > 1) {
      for (let i = 1; i < limitedFutureDays; i++) {
        weatherData.unshift(weatherDataFuture[i]);
      }
    }
  }

  if (city !== null && city !== undefined && city !== "") {
    weatherData = weatherData.map((weather) => {
      weather.city = city;
      return weather;
    });
  }

  if (simplified) {
    weatherData = weatherData.map((weather) => {
      return {
        date: weather.date,
        city: weather.city ?? undefined,
        temperature: weather.temperatureRaw,
        temperatureMin: weather.highLowTemperature.temperatureLow,
        temperatureMax: weather.highLowTemperature.temperatureHigh,
        humidity: weather.humidity,
        dayLength: weather.dayLength,
        windSpeed: weather.windSpeedData.actual,
        windSpeedRange: weather.windSpeed,
      };
    });
  }

  return weatherData;
}

function simpleWeatherGeneratorV2ForOneDay(date, location) {
  const dataGenerator = new RandomValueGeneratorWithSeed(date + location);

  const conditions = [
    { name: "Sunny", icon: "fa-sun" },
    { name: "Partly Cloudy", icon: "fa-cloud-sun" },
    { name: "Cloudy", icon: "fa-cloud" },
    { name: "Rainy", icon: "fa-cloud-rain" },
    { name: "Thunderstorm", icon: "fa-bolt" },
  ];

  const baseTemp = dataGenerator.getNextValue(15, 35);
  const condition = conditions[dataGenerator.getNextValue(0, conditions.length - 1)];
  const humidity = dataGenerator.getNextValue(50, 90);
  const wind = dataGenerator.getNextValue(0, 90);

  // randomize humidity from 40 to 90% of the base humidity
  const humidityRandom = Math.random() * (humidity - humidity / 2) + humidity / 2;
  const humidityRandomFormatted = Math.round(humidityRandom * 100) / 100;

  const windRandom = Math.random() * wind - wind / 6;
  const windRandomFormatted = Math.round(windRandom * 100) / 100;

  const feelsLike = baseTemp + dataGenerator.getNextValue(-5, 5);
  return {
    date,
    location,
    temperature: baseTemp,
    condition: condition.name,
    icon: condition.icon,
    humidity: humidityRandomFormatted,
    wind: windRandomFormatted > 0 ? windRandomFormatted : 0,
    feelsLike,
  };
}

const defaultWeatherV2Options = {
  daysBefore: 3,
  daysAfter: 3,
  city: "Warsaw",
  date: new Date().toISOString().split("T")[0],
};

function generateWeatherV2Response(options) {
  const newOptions = options || defaultWeatherV2Options;
  const params = { ...defaultWeatherV2Options, ...newOptions };
  logDebug(`Requested weather V2 data for:`, { params });

  const dates = generatePastAndFutureDateStringsFromDate(params.date, params.daysBefore, params.daysAfter);

  const weatherData = [];
  for (let i = 0; i < dates.length; i++) {
    const currentDate = dates[i];
    const weather = simpleWeatherGeneratorV2ForOneDay(currentDate, params.location);
    weatherData.push(weather);
  }

  return { weatherData, params };
}

module.exports = {
  generateWeatherResponse,
  generateWeatherV2Response,
  defaultWeatherV2Options,
  generateWeatherDataForNPastDays,
  generateWeatherDataForNFutureDays,
  generateWeatherDataForNPastDaysFromDate,
  generateWeatherDataForNFutureDaysFromDate,
};
