const { logDebug, logError, logInsane } = require("../../helpers/logger-api");
const WebSocket = require("ws");

class WebSocketPracticeChatContext {
  constructor(wss) {
    this.wss = wss;
    this.connectedUsers = new Map();
  }

  broadcast(data, excludeWs = null) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  broadcastUserList() {
    const userList = Array.from(this.connectedUsers.keys());
    logDebug("[websocketRoute] Broadcasting user list:", userList);
    this.broadcast({
      type: "practiceChatUserList",
      users: userList,
    });
  }

  sendPrivateMessage(from, to, message) {
    const targetUser = this.connectedUsers.get(to);
    if (!targetUser) {
      throw new Error(`User ${to} is not connected`);
    }

    const messageData = {
      type: "practiceChatPrivate",
      username: from,
      recipient: to,
      message: message,
    };

    targetUser.send(JSON.stringify(messageData));
    this.connectedUsers.get(from).send(JSON.stringify(messageData));
  }
}

const sendError = (ws, message) => {
  ws.send(
    JSON.stringify({
      type: "error",
      message: message,
    })
  );
};

const handleJoinMessage = (context, ws, data) => {
  const userName = data.username?.trim();
  if (!userName) {
    throw new Error("Username is required");
  }
  if (context.connectedUsers.has(userName)) {
    throw new Error("Username already taken");
  }
  if (userName.toLowerCase() === "[system]") {
    throw new Error("Invalid username");
  }
  if (!/^[a-zA-Z0-9]+$/.test(userName)) {
    throw new Error("Invalid username");
  }
  if (userName.length < 3 || userName.length > 20) {
    throw new Error("Username already taken");
  }

  ws.userName = userName;
  context.connectedUsers.set(userName, ws);
  logDebug(`[websocketRoute] User joined:`, { userName, version: data.version });

  context.broadcast({
    type: "practiceChatMessage",
    username: "[System]",
    message: `${userName} joined the chat`,
  });

  context.broadcastUserList();
};

const handleChatMessage = (context, ws, data) => {
  if (!ws.userName) {
    throw new Error("Please join the chat first");
  }
  if (!data.message?.trim()) {
    throw new Error("Message cannot be empty");
  }
  if (data.username !== ws.userName) {
    throw new Error("Invalid username");
  }

  logInsane(`Message from ${ws.userName}: ${data.message}`);
  context.broadcast({
    type: "practiceChatMessage",
    username: ws.userName,
    message: data.message,
  });
};

const handlePrivateMessage = (context, ws, data) => {
  if (!ws.userName) {
    throw new Error("Please join the chat first");
  }
  if (!data.message?.trim()) {
    throw new Error("Message cannot be empty");
  }
  if (!data.recipient) {
    throw new Error("Recipient is required");
  }

  logInsane(`Private message from ${ws.userName} to ${data.recipient}: ${data.message}`);
  context.sendPrivateMessage(ws.userName, data.recipient, data.message);
};

const practiceChatLeave = (context, ws) => {
  handleDisconnect(context, ws);
};

const handleDisconnect = (context, ws) => {
  if (ws.userName) {
    context.connectedUsers.delete(ws.userName);
    context.broadcast({
      type: "practiceChatMessage",
      username: "[System]",
      message: `${ws.userName} left the chat`,
    });
    logDebug(`[websocketRoute] User disconnected: ${ws.userName}`);

    context.broadcastUserList();
  }
};

const handleConnection = (context, ws) => {
  context.broadcastUserList();
};

const handleUnknownMessage = (context, ws, data) => {
  const errorMsg = `Unknown message type: ${data.type}`;
  logError("[websocketRoute] handleUnknownMessage", errorMsg);
  sendError(ws, errorMsg);
};

const messageHandlers = {
  practiceChatJoin: handleJoinMessage,
  practiceChatLeave: practiceChatLeave,
  practiceChatMessage: handleChatMessage,
  practiceChatPrivate: handlePrivateMessage,
  practiceChatDefault: handleUnknownMessage,
};

module.exports = {
  WebSocketPracticeChatContext,
  messageHandlers,
  handleDisconnect,
  sendError,
  handleConnection,
};
