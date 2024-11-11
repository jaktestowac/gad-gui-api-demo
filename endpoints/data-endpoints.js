const { generateIncomeOutcomeData } = require("../helpers/generators/income-outcome.generator");
const {
  generateWeatherDataForNPastDays,
  generateWeatherDataForNFutureDays,
  generateWeatherDataForNPastDaysFromDate,
  generateWeatherDataForNFutureDaysFromDate,
} = require("../helpers/generators/weather.generator");
const { HTTP_OK } = require("../helpers/response.helpers");
const { logDebug } = require("../helpers/logger-api");

function handleData(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method === "GET" && req.url.includes("/api/v1/data/weather")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);

    const days = parseInt(queryParams.get("days"));
    const future = parseInt(queryParams.get("futuredays"));
    const date = queryParams.get("date");
    const limitedDays = Math.min(days || 31, 90);
    let limitedFutureDays = Math.min(future || 0, 90);
    logDebug(`Requested weather data for:`, { days, limitedDays, limitedFutureDays, date });

    let weatherData = [];
    if (date === null || date === undefined || date === "") {
      weatherData = generateWeatherDataForNPastDays(limitedDays);
    } else {
      weatherData = generateWeatherDataForNPastDaysFromDate(date, limitedDays);
    }

    if (limitedFutureDays > 0) {
      limitedFutureDays += 1; // Add one more day because 1 is today
      let weatherDataFuture = [];

      if (date === null || date === undefined || date === "") {
        weatherDataFuture = generateWeatherDataForNFutureDays(limitedFutureDays);
      } else {
        weatherDataFuture = generateWeatherDataForNFutureDaysFromDate(date, limitedFutureDays);
      }

      if (weatherDataFuture.length > 1) {
        for (let i = 1; i < limitedFutureDays; i++) {
          weatherData.unshift(weatherDataFuture[i]);
        }
      }
    }

    if (req.url.includes("/api/v1/data/weather-simple")) {
      weatherData = weatherData.map((weather) => {
        return {
          date: weather.date,
          temperature: weather.temperatureRaw,
          temperatureMin: weather.highLowTemperature.temperatureLow,
          temperatureMax: weather.highLowTemperature.temperatureHigh,
          humidity: weather.humidity,
          dayLength: weather.dayLength,
          windSpeed: weather.windSpeedData.actual,
        };
      });
    }

    res.status(HTTP_OK).json(weatherData);
  }

  if (req.method === "GET" && req.url.includes("/api/v1/data/costs")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);

    const days = parseInt(queryParams.get("days"));
    const limitedDays = Math.min(days || 31, 90);
    logDebug(`Requested costs data for:`, { days, limitedDays });

    const incomeOutcomeData = generateIncomeOutcomeData(limitedDays);
    res.status(HTTP_OK).json(incomeOutcomeData);
  }

  return;
}

module.exports = {
  handleData,
};
