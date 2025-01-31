const { logDebug, logError } = require("../../helpers/logger-api");

class DocumentEditorContext {
  constructor(wss) {
    this.wss = wss;
    this.documents = new Map(); // documentId -> content
    this.activeUsers = new Map(); // documentId -> Set of users
    this.userConnections = new Map(); // userId -> ws

    this.validDocuments = new Map([
      ["doc1", { password: "pass1", title: "Document 1" }],
      ["doc2", { password: "pass2", title: "Document 2" }],
    ]);

    this.documentHistory = new Map(); // documentId -> { lastModified, userHistory[] }
    this.userActivities = new Map(); // userId -> { documentId, activity, position }
    this.usernames = new Set(); // Add this to track taken usernames
  }

  verifyDocument(documentId, password) {
    const doc = this.validDocuments.get(documentId);
    if (!doc) {
      throw new Error("Document not found");
    }
    if (doc.password !== password) {
      throw new Error("Invalid password");
    }
    return true;
  }

  createDocument(documentId, password, title) {
    if (this.validDocuments.has(documentId)) {
      throw new Error("Document ID already exists");
    }
    this.validDocuments.set(documentId, {
      password,
      title: title || `Document ${documentId}`,
      createdAt: new Date().toISOString(),
    });
    this.documents.set(documentId, "");
    return this.validDocuments.get(documentId);
  }

  addUserToHistory(documentId, userId) {
    if (!this.documentHistory.has(documentId)) {
      this.documentHistory.set(documentId, {
        lastModified: new Date(),
        userHistory: [],
      });
    }
    const history = this.documentHistory.get(documentId);
    if (!history.userHistory.includes(userId)) {
      history.userHistory.push(userId);
    }
  }

  getDocumentStats(documentId) {
    return {
      activeUsers: Array.from(this.activeUsers.get(documentId) || []),
      history: this.documentHistory.get(documentId) || { lastModified: new Date(), userHistory: [] },
    };
  }

  broadcastUserStatus(documentId) {
    const stats = this.getDocumentStats(documentId);
    const message = JSON.stringify({
      type: "docUserStatus",
      users: stats.activeUsers,
      historicalUsers: stats.history.userHistory,
    });

    this.activeUsers.get(documentId)?.forEach((userId) => {
      const userWs = this.userConnections.get(userId);
      if (userWs) {
        userWs.send(message);
      }
    });
  }

  updateUserActivity(documentId, userId, activity, position = null) {
    this.userActivities.set(userId, { documentId, activity, position });
    this.broadcastUserActivity(documentId);
  }

  broadcastUserActivity(documentId) {
    const activities = Array.from(this.userActivities.entries())
      .filter(([_, data]) => data.documentId === documentId)
      .map(([userId, data]) => ({
        userId,
        activity: data.activity,
        position: data.position,
      }));

    const message = JSON.stringify({
      type: "docUserActivity",
      activities,
    });

    this.activeUsers.get(documentId)?.forEach((userId) => {
      const userWs = this.userConnections.get(userId);
      if (userWs) {
        userWs.send(message);
      }
    });
  }

  removeUser(userId) {
    this.removeUsername(userId);
    this.activeUsers.forEach((users, documentId) => {
      if (users.has(userId)) {
        users.delete(userId);
        this.broadcastUserStatus(documentId);
      }
    });
    this.userConnections.delete(userId);
    this.userActivities.delete(userId);
  }

  isUsernameAvailable(username) {
    for (const users of this.activeUsers.values()) {
      if (users.has(username)) {
        return false;
      }
    }
    return true;
  }

  registerUsername(username) {
    if (!this.isUsernameAvailable(username)) {
      throw new Error("Username is already in use");
    }
    this.usernames.add(username);
  }

  removeUsername(username) {
    this.usernames.delete(username);
  }

  broadcast(documentId, message, excludeWs = null) {
    const users = this.activeUsers.get(documentId);
    if (!users) return;

    const messageStr = typeof message === "string" ? message : JSON.stringify(message);

    users.forEach((userId) => {
      const userWs = this.userConnections.get(userId);
      if (userWs && userWs !== excludeWs && userWs.readyState === 1) {
        userWs.send(messageStr);
      }
    });
  }
}

const documentHandlers = {
  docConnect: (context, ws, data) => {
    const { userId, documentId, password } = data;

    try {
      if (!context.isUsernameAvailable(userId)) {
        throw new Error("Username is already in use");
      }

      context.verifyDocument(documentId, password);
      context.registerUsername(userId);
      context.removeUser(userId);

      context.userConnections.set(userId, ws);
      context.addUserToHistory(documentId, userId);

      if (!context.activeUsers.has(documentId)) {
        context.activeUsers.set(documentId, new Set());
        context.documents.set(documentId, "");
      }
      context.activeUsers.get(documentId).add(userId);

      const stats = context.getDocumentStats(documentId);

      ws.send(
        JSON.stringify({
          type: "docInitial",
          content: context.documents.get(documentId),
          users: stats.activeUsers,
          historicalUsers: stats.history.userHistory,
          lastModified: stats.history.lastModified,
          title: context.validDocuments.get(documentId).title,
        })
      );

      context.broadcastUserStatus(documentId);

      ws.documentId = documentId;
      ws.userId = userId;
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "docError",
          error: error.message,
        })
      );
    }
  },

  docUpdate: (context, ws, data) => {
    const { documentId, content, userId } = data;
    context.documents.set(documentId, content);

    if (context.documentHistory.has(documentId)) {
      context.documentHistory.get(documentId).lastModified = new Date();
    }

    context.activeUsers.get(documentId).forEach((uid) => {
      if (uid !== userId) {
        const userWs = context.userConnections.get(uid);
        if (userWs) {
          userWs.send(
            JSON.stringify({
              type: "docUpdate",
              content,
              userId,
            })
          );
        }
      }
    });
  },

  docCreate: (context, ws, data) => {
    const { documentId, password, title } = data;
    try {
      const newDoc = context.createDocument(documentId, password, title);
      ws.send(
        JSON.stringify({
          type: "docCreated",
          documentId,
          title: newDoc.title,
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "docError",
          error: error.message,
        })
      );
    }
  },

  docUpdateTitle: (context, ws, data) => {
    const { documentId, title, userId } = data;
    const doc = context.validDocuments.get(documentId);
    if (doc) {
      doc.title = title;

      context.activeUsers.get(documentId).forEach((uid) => {
        const userWs = context.userConnections.get(uid);
        if (userWs) {
          userWs.send(
            JSON.stringify({
              type: "docTitleUpdate",
              title,
              userId,
            })
          );
        }
      });
    }
  },

  docUserActivity: (context, ws, data) => {
    const { documentId, userId, activity, position } = data;
    context.updateUserActivity(documentId, userId, activity, position);
  },

  docDisconnect: (context, ws) => {
    if (ws.userId) {
      context.removeUser(ws.userId);
    }
  },

  docCheckUsername: (context, ws, data) => {
    const { username } = data;
    try {
      const available = context.isUsernameAvailable(username);
      ws.send(
        JSON.stringify({
          type: "docUsernameStatus",
          available,
          username,
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "docError",
          error: "Failed to check username availability",
        })
      );
    }
  },

  docCursorUpdate: (context, ws, data) => {
    if (!ws.userId || !ws.documentId) return;

    context.broadcast(
      ws.documentId,
      {
        type: "docCursorUpdate",
        userId: ws.userId,
        position: data.position,
      },
      ws
    );
  },
};

module.exports = {
  DocumentEditorContext,
  documentHandlers,
};
