const { logDebug } = require("../../helpers/logger-api");
const { generateWeatherDataForNPastDays } = require("../../helpers/generators/weather.generator");

class RandomWeatherContext {
  constructor(wss) {
    this.wss = wss;
  }

  generateWeatherData(days = 1, city = "Current Location", random = true) {
    const limitedDays = Math.min(days || 7, 90);
    let weatherData = generateWeatherDataForNPastDays(limitedDays, random, city);

    if (city) {
      weatherData = weatherData.map((weather) => ({
        ...weather,
        city: city,
      }));
    }

    return weatherData.map((weather) => ({
      date: weather.date,
      city: weather.city,
      temperature: weather.temperatureRaw,
      temperatureMin: weather.highLowTemperature.temperatureLow,
      temperatureMax: weather.highLowTemperature.temperatureHigh,
      humidity: weather.humidity,
      windSpeed: weather.windSpeedData.actual,
    }));
  }
}

const handleGetWeather = (context, ws, data) => {
  const weatherData = context.generateWeatherData(data.days, data.city, data.random || true);
  ws.send(
    JSON.stringify({
      type: "weatherData",
      weather: weatherData,
    })
  );
  logDebug(`Sent weather data for ${data.days} days${data.city ? ` in ${data.city}` : ""}`);
};

const weatherHandlers = {
  getWeather: handleGetWeather,
};

module.exports = {
  RandomWeatherContext,
  weatherHandlers,
};
