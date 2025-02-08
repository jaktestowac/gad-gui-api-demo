const { logDebug, logError } = require("../../helpers/logger-api");
const WebSocket = require("ws");
const {
  generateWeatherDataForNPastDays,
  generateWeatherResponse,
} = require("../../helpers/generators/weather.generator");

class WeatherContext {
  constructor(wss) {
    this.wss = wss;
    this.weatherData = {
      temperature: 20,
      humidity: 65,
      windSpeed: 5,
    };
  }

  broadcast(data) {
    const message = JSON.stringify({
      type: "weather",
      ...data,
    });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  updateWeather() {
    this.weatherData.temperature += (Math.random() - 0.5) * 2;
    this.weatherData.humidity += (Math.random() - 0.5) * 5;
    this.weatherData.windSpeed += (Math.random() - 0.5) * 2;

    this.weatherData.temperature = Math.round(this.weatherData.temperature * 10) / 10;
    this.weatherData.humidity = Math.min(100, Math.max(0, Math.round(this.weatherData.humidity)));
    this.weatherData.windSpeed = Math.max(0, Math.round(this.weatherData.windSpeed * 10) / 10);

    this.broadcast(this.weatherData);
  }

  startWeatherUpdates() {
    setInterval(() => this.updateWeather(), 5000);
  }

  getFullWeatherData(date, days, city = "Current Location", futureDays = 0, simplified = false, totalRandom = false) {
    const limitedDays = Math.min(days || 31, 90);
    let limitedFutureDays = Math.min(futureDays || 0, 90);
    let weatherData = generateWeatherResponse(
      date,
      days,
      city,
      limitedDays,
      limitedFutureDays,
      simplified,
      totalRandom
    );

    return weatherData;
  }

  getWeatherData(days = 1, city = "Current Location", random = true) {
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

  handleWeatherRequest(ws, data) {
    const weather = this.getWeatherData(data.days, data.city, data.random ?? true);
    ws.send(
      JSON.stringify({
        type: "weatherData",
        weather: weather,
      })
    );
  }

  handleFullWeatherRequest(ws, data) {
    const date = data.date ?? new Date().toISOString().split("T")[0];
    const days = parseInt(data.days) || 7;
    const city = data.city || "Current Location";
    const futureDays = parseInt(data.futureDays) || 0;
    const simplified = data.simplified ?? false;
    const totalRandom = data.totalRandom ?? false;

    const weather = this.getFullWeatherData(date, days, city, futureDays, simplified, totalRandom);
    ws.send(
      JSON.stringify({
        type: "weatherData",
        weather: weather,
      })
    );
  }
}

const handleWeatherConnection = (context, ws) => {
  ws.send(
    JSON.stringify({
      type: "weather",
      ...context.weatherData,
    })
  );
};

const weatherHandlers = {
  getWeather: (context, ws, data) => context.handleWeatherRequest(ws, data),
  getFullWeather: (context, ws, data) => context.handleFullWeatherRequest(ws, data),
};

module.exports = {
  WeatherContext,
  handleWeatherConnection,
  weatherHandlers,
};
