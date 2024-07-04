const { generateWeatherDataForNDays } = require("../helpers/generators/weather.generator");
const { HTTP_OK } = require("../helpers/response.helpers");

function handleData(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method === "GET" && req.url.includes("/api/data/weather")) {
    const weatherData = generateWeatherDataForNDays(31);
    res.status(HTTP_OK).json(weatherData);
  }

  return;
}

module.exports = {
    handleData,
};
