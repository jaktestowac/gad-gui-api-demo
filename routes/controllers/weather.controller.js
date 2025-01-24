const { logDebug, logError } = require("../../helpers/logger-api");
const WebSocket = require("ws");

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

  getWeatherData(days = 1, city = "Current Location") {
    const weather = [];
    for (let i = 0; i < days; i++) {
      weather.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        temperature: Math.floor(Math.random() * 30) + 10,
        humidity: Math.floor(Math.random() * 60) + 40,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        city: city,
        temperatureMin: Math.floor(Math.random() * 20) + 5,
        temperatureMax: Math.floor(Math.random() * 15) + 25,
      });
    }
    return weather;
  }

  handleWeatherRequest(ws, data) {
    const weather = this.getWeatherData(data.days, data.city);
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
};

module.exports = {
  WeatherContext,
  handleWeatherConnection,
  weatherHandlers,
};
