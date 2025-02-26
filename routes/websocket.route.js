const { logDebug, logTrace, logError, logInsane } = require("../helpers/logger-api");
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

const messageHandlerMap = {
  ping: (ws) => {
    logInsane("[websocketRoute] ping");
    ws.send(
      JSON.stringify({
        type: "pong",
        data: { time: new Date().toISOString(), version: app.version },
      })
    );
  },
  status: (ws) => {
    logInsane("[websocketRoute] status");
    ws.send(
      JSON.stringify({
        type: "status",
        data: { time: new Date().toISOString(), version: app.version },
      })
    );
  },
  getWeather: (context, ws, data) => weatherHandlers.getWeather(context, ws, data),
  getFullWeather: (context, ws, data) => weatherHandlers.getFullWeather(context, ws, data),
};

const handleDroneJoin = (context, userId, ws) => {
  context.connectedUsers.set(userId, ws);
  logDebug("[websocketRoute] Drone client joined", { userId });
};

const getMessageHandler = (type) => {
  logInsane(`[websocketRoute] getMessageHandler:`, { type });
  if (type?.toLowerCase().includes("cinema")) {
    return (context, ws, data) => cinemaHandlers[type]?.(context, ws, data);
  }
  if (type?.toLowerCase().includes("practicechat")) {
    return (context, ws, data) => (messageHandlers[type] || messageHandlers.practiceChatDefault)(context, ws, data);
  }
  if (type?.toLowerCase().includes("doc")) {
    return (context, ws, data) => documentHandlers[type]?.(context, ws, data);
  }
  if (type?.toLowerCase().includes("practicedrone")) {
    return (context, ws, data) => droneHandlers[type]?.(context, ws, data);
  }
  if (type?.toLowerCase().includes("codeeditor")) {
    return (context, ws, data) => codeEditorHandlers[type]?.(context, ws, data);
  }
  return messageHandlerMap[type];
};

const websocketRoute = (wss, webSocketPort) => {
  const contexts = {
    chat: new WebSocketPracticeChatContext(wss),
    weather: new WeatherContext(wss),
    document: new DocumentEditorContext(wss),
    cinema: new CinemaContext(wss),
    drone: new DroneSimulatorContext(wss),
    codeEditor: new CodeEditorContext(wss),
  };

  logDebug(`🦎 GAD WebSocket listening on ${webSocketPort}!`);

  wss.on("connection", (ws) => {
    logDebug("[websocketRoute] New client connected", { client: ws._socket?.remoteAddress });

    const userId = Math.random().toString(36).substring(7);
    ws.userId = `ws-user-${userId}`;

    ws.on("practiceChatJoin", (message) => {
      handleConnection(contexts.chat, ws);
    });

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        logTrace("[websocketRoute] Received message:", { type: data.type, data });

        if (data.type?.toLowerCase().includes("practicedronejoin")) {
          handleDroneJoin(contexts.drone, userId, ws);
          return;
        }

        const handler = getMessageHandler(data.type);
        if (!handler) {
          throw new Error(`Invalid message type received: ${data.type}`);
        }

        let context = undefined;
        if (data.type?.toLowerCase().includes("cinema")) context = contexts.cinema;
        if (data.type?.toLowerCase().includes("practicechat")) context = contexts.chat;
        if (data.type?.toLowerCase().includes("doc")) context = contexts.document;
        if (data.type?.toLowerCase().includes("practicedrone")) context = contexts.drone;
        if (data.type?.toLowerCase().includes("codeeditor")) context = contexts.codeEditor;
        if (data.type?.toLowerCase().includes("weather")) context = contexts.weather;

        if (context === undefined) {
          logError("[websocketRoute] Invalid context for message:", { type: data.type, data });
          throw new Error(`Invalid context for message: ${data.type}`);
        }

        logInsane("[websocketRoute] Using handler:", { type: data.type, data: data });
        handler(context, ws, data);
      } catch (error) {
        logError("[websocketRoute] Error processing message:", error.message);
        sendError(ws, error.message || "Invalid message format");
      }
    });

    ws.on("close", () => {
      logDebug("[websocketRoute] Client disconnected", { client: ws._socket?.remoteAddress, userId });
      contexts.drone.connectedUsers.delete(ws.userId);
      handleDisconnect(contexts.chat, ws);
      if (ws.userId) {
        documentHandlers.docDisconnect(contexts.document, ws);
        codeEditorHandlers.codeEditorDisconnect(contexts.codeEditor, ws);
      }
    });

    ws.on("error", (error) => {
      logError("[websocketRoute] Error:", error);
    });
  });
};

module.exports = { websocketRoute };
