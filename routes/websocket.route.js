const { logDebug, logError } = require("../helpers/logger-api");
const {
  WebSocketContext,
  messageHandlers,
  handleDisconnect,
  sendError,
  handleConnection,
} = require("./controllers/chat.controller");
const { WeatherContext, weatherHandlers } = require("./controllers/weather.controller");

const websocketRoute = (wss) => {
  const chatContext = new WebSocketContext(wss);
  const weatherContext = new WeatherContext(wss);

  wss.on("connection", (ws) => {
    logDebug("New client connected");

    handleConnection(chatContext, ws);

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        let handler;

        if (data.type === 'getWeather') {
          handler = weatherHandlers.getWeather;
          handler(weatherContext, ws, data);
        } else {
          handler = messageHandlers[data.type] || messageHandlers.default;
          handler(chatContext, ws, data);
        }
      } catch (error) {
        logError("Error processing message:", error.message);
        sendError(ws, error.message || "Invalid message format");
      }
    });

    ws.on("close", () => handleDisconnect(chatContext, ws));

    ws.on("error", (error) => {
      logError("WebSocket error:", error);
    });
  });
};

module.exports = { websocketRoute };
