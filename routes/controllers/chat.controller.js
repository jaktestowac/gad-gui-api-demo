const { logDebug, logError, logInsane } = require("../../helpers/logger-api");
const WebSocket = require("ws");

class WebSocketContext {
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
    logDebug("Broadcasting user list:", userList);
    this.broadcast({
      type: "userList",
      users: userList,
    });
  }

  sendPrivateMessage(from, to, message) {
    const targetUser = this.connectedUsers.get(to);
    if (!targetUser) {
      throw new Error(`User ${to} is not connected`);
    }

    const messageData = {
      type: "private",
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

  ws.userName = userName;
  context.connectedUsers.set(userName, ws);
  logDebug(`User joined: ${userName}`);

  context.broadcast({
    type: "message",
    username: "System",
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
    type: "message",
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

const handleDisconnect = (context, ws) => {
  if (ws.userName) {
    context.connectedUsers.delete(ws.userName);
    context.broadcast({
      type: "message",
      username: "System",
      message: `${ws.userName} left the chat`,
    });
    logDebug(`User disconnected: ${ws.userName}`);

    context.broadcastUserList();
  }
};

const handleConnection = (context, ws) => {
  context.broadcastUserList();
};

const handleUnknownMessage = (context, ws, data) => {
  const errorMsg = `Unknown message type: ${data.type}`;
  logError("handleUnknownMessage", errorMsg);
  sendError(ws, errorMsg);
};

const messageHandlers = {
  join: handleJoinMessage,
  message: handleChatMessage,
  private: handlePrivateMessage,
  default: handleUnknownMessage,
};

module.exports = {
  WebSocketContext,
  messageHandlers,
  handleDisconnect,
  sendError,
  handleConnection,
};
