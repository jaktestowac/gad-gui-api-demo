const { logDebug, logError } = require("../../helpers/logger-api");

class LearningWorkspaceContext {
  constructor(wss) {
    this.wss = wss;
    this.instructors = new Set();
    this.students = new Set();
    this.currentContent = "";
    this.annotations = [];
    this.comments = [];
  }

  broadcast(message, excludeWs = null) {
    this.wss.clients.forEach((client) => {
      if (client !== excludeWs && client.workspace) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

const learningHandlers = {
  practiceLearningWorkspaceJoin: (context, ws, data) => {
    ws.workspace = true;
    ws.role = data.role;
    ws.userId = data.userId;

    if (data.role === "instructor") {
      context.instructors.add(ws);
    } else {
      context.students.add(ws);
    }

    ws.send(
      JSON.stringify({
        type: "workspaceState",
        data: {
          content: context.currentContent,
          annotations: context.annotations,
          comments: context.comments,
        },
      })
    );
  },

  practiceLearningWorkspaceUpdate: (context, ws, data) => {
    if (ws.role !== "instructor") return;
    context.currentContent = data.content;
    context.broadcast(
      {
        type: "workspaceContent",
        data: { content: data.content },
      },
      ws
    );
  },

  practiceLearningWorkspaceAnnotate: (context, ws, data) => {
    const annotation = {
      id: Date.now(),
      userId: ws.userId,
      role: ws.role,
      ...data.annotation,
    };
    context.annotations.push(annotation);
    context.broadcast({
      type: "workspaceAnnotation",
      data: { annotation },
    });
  },

  practiceLearningWorkspaceComment: (context, ws, data) => {
    const comment = {
      id: Date.now(),
      userId: ws.userId,
      role: ws.role,
      ...data.comment,
    };
    context.comments.push(comment);
    context.broadcast({
      type: "workspaceComment",
      data: { comment },
    });
  },

  practiceLearningWorkspaceSync: (context, ws, data) => {
    ws.send(
      JSON.stringify({
        type: "workspaceSync",
        data: {
          matched: data.content === context.currentContent,
        },
      })
    );
  },
};

module.exports = {
  LearningWorkspaceContext,
  learningHandlers,
};
