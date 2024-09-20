const { generateIncomeOutcomeData } = require("../helpers/generators/income-outcome.generator");
const { generateWeatherDataForNDays } = require("../helpers/generators/weather.generator");
const { HTTP_OK } = require("../helpers/response.helpers");
const { logDebug } = require("../helpers/logger-api");

function handleData(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method === "GET" && req.url.includes("/api/v1/data/weather")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);

    const days = parseInt(queryParams.get("days"));
    const limitedDays = Math.min(days || 31, 90);
    logDebug(`Requested weather data for:`, { days, limitedDays });
    const weatherData = generateWeatherDataForNDays(limitedDays);

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
