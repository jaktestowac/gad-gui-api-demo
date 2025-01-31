const { logDebug, logTrace, logError } = require("../helpers/logger-api");
const {
  WebSocketPracticeChatContext,
  messageHandlers,
  handleDisconnect,
  sendError,
  handleConnection,
} = require("./controllers/practice-chat.controller");
const { WeatherContext, weatherHandlers } = require("./controllers/weather.controller");
const { DocumentEditorContext, documentHandlers } = require("./controllers/document-editor.controller");
const { CinemaContext, cinemaHandlers } = require("./controllers/cinema.controller");
const { DroneSimulatorContext, droneHandlers } = require("./controllers/drone-simulator.controller");
const { CodeEditorContext, codeEditorHandlers } = require("./controllers/code-editor.controller");
const app = require("../app.json");

const websocketRoute = (wss) => {
  const chatContext = new WebSocketPracticeChatContext(wss);
  const weatherContext = new WeatherContext(wss);
  const documentContext = new DocumentEditorContext(wss);
  const cinemaContext = new CinemaContext(wss);
  const droneContext = new DroneSimulatorContext(wss);
  const codeEditorContext = new CodeEditorContext(wss);

  wss.on("connection", (ws) => {
    logDebug("[websocketRoute] New client connected", { client: ws._socket?.remoteAddress });

    const userId = Math.random().toString(36).substring(7);
    ws.userId = userId;

    ws.on("practiceChatJoin", (message) => {
      handleConnection(chatContext, ws);
    });

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        let handler;

        logTrace("[websocketRoute] Received message:", { type: data.type, data: data });

        if (data.type === "practiceDroneJoin") {
          droneContext.connectedUsers.set(userId, ws);
          logDebug("[websocketRoute] Drone client joined", { userId });
          return;
        }

        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", data: { time: new Date().toISOString(), version: app.version } }));
        } else if (data.type === "status") {
          ws.send(JSON.stringify({ type: "status", data: { time: new Date().toISOString(), version: app.version } }));
        } else if (data.type === "getWeather") {
          handler = weatherHandlers.getWeather;
          handler(weatherContext, ws, data);
        } else if (data.type === "getFullWeather") {
          handler = weatherHandlers.getFullWeather;
          handler(weatherContext, ws, data);
        } else if (data.type?.toLowerCase().includes("cinema")) {
          handler = cinemaHandlers[data.type];
          if (!handler) {
            throw new Error(`No handler found for message type: ${data.type}`);
          }
          handler(cinemaContext, ws, data);
        } else if (data.type?.toLowerCase().includes("practicechat")) {
          handler = messageHandlers[data.type] || messageHandlers.practiceChatDefault;
          handler(chatContext, ws, data);
        } else if (data.type?.toLowerCase().includes("doc")) {
          handler = documentHandlers[data.type];
          if (!handler) {
            throw new Error(`No handler found for message type: ${data.type}`);
          }
          handler(documentContext, ws, data);
        } else if (data.type?.toLowerCase().includes("practicedrone")) {
          handler = droneHandlers[data.type];
          if (!handler) {
            throw new Error(`No handler found for message type: ${data.type}`);
          }
          handler(droneContext, ws, data);
        } else if (data.type?.toLowerCase().includes("codeeditor")) {
          handler = codeEditorHandlers[data.type];
          if (!handler) {
            throw new Error(`No handler found for message type: ${data.type}`);
          }
          handler(codeEditorContext, ws, data);
        } else {
          throw new Error(`Invalid message type received: ${data.type}`);
        }
      } catch (error) {
        logError("[websocketRoute] Error processing message:", error.message);
        sendError(ws, error.message || "Invalid message format");
      }
    });

    ws.on("close", () => {
      logDebug("[websocketRoute] Client disconnected", { client: ws._socket?.remoteAddress, userId });
      droneContext.connectedUsers.delete(ws.userId);
      handleDisconnect(chatContext, ws);
      if (ws.userId) {
        documentHandlers.docDisconnect(documentContext, ws);
        codeEditorHandlers.codeEditorDisconnect(codeEditorContext, ws);
      }
    });

    ws.on("error", (error) => {
      logError("[websocketRoute] Error:", error);
    });
  });
};

module.exports = { websocketRoute };
