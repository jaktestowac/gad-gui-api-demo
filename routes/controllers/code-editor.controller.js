const { logDebug } = require("../../helpers/logger-api");

const RESTRICTED_USERNAMES = ["system", "admin", "root", "owner", "moderator", "bot"];

class CodeEditorContext {
  constructor(wss) {
    this.wss = wss;
    this.connectedUsers = new Map();
    this.currentCode = "";
    this.codeOutput = "";

    this.workspaces = new Map([
      [
        "Tutorial",
        {
          code: `// Welcome to the JavaScript Code Editor!
// Here are some examples to get you started:

// 1. Basic console output
console.log("Hello World!");

// 2. Working with variables
let name = "Coder";
console.log(\`Welcome, \${name}!\`);

// 3. Arrays and loops
const numbers = [1, 2, 3, 4, 5];
numbers.forEach(n => console.log(n * 2));

// 4. Objects
const person = {
  name: "John",
  age: 30,
  greet() {
    console.log(\`Hi, I'm \${this.name}\`);
  }
};

person.greet();

// Try running this code with Ctrl+Enter or Cmd+Enter!`,
          output: "",
          password: "",
          users: [],
          owner: "system",
        },
      ],
      [
        "Playground",
        {
          code: `// JavaScript Playground
// Try these cool examples!

// 1. Generate random colors
function randomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

console.log("Random color:", randomColor());

// 2. Fun with arrays
const fruits = ['apple', 'banana', 'orange'];
console.log("Original:", fruits);
console.log("Reversed:", [...fruits].reverse());

// 3. Time functions
console.log("Current time:", new Date().toLocaleTimeString());

// 4. Math experiments
console.log("Pi:", Math.PI);
console.log("Random number (1-100):", Math.floor(Math.random() * 100) + 1);

// Edit this code and have fun experimenting!`,
          output: "",
          password: "",
          users: [],
          owner: "system",
        },
      ],
    ]);
    this.workspaceSettings = new Map();
  }

  getWorkspace(workspaceId) {
    if (!this.workspaces.has(workspaceId)) {
      this.workspaces.set(workspaceId, {
        code: "",
        output: "",
        password: "",
        users: [],
        owner: null,
      });
    }
    return this.workspaces.get(workspaceId);
  }

  getWorkspaceSettings(workspaceId) {
    if (!this.workspaceSettings.has(workspaceId)) {
      this.workspaceSettings.set(workspaceId, {
        readonly: false,
        clearDisabled: false,
        runDisabled: false,
      });
    }
    return this.workspaceSettings.get(workspaceId);
  }

  isWorkspaceOwner(workspaceId, userId) {
    const workspace = this.getWorkspace(workspaceId);
    return workspace.owner === userId;
  }

  broadcast(message, excludeWs = null) {
    this.wss.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }

  broadcastToWorkspace(workspaceId, message, excludeWs = null) {
    const workspace = this.getWorkspace(workspaceId);
    if (message.type === "codeEditorUserList") {
      message.data.users = workspace.users
        .map((id) => ({
          username: this.connectedUsers.get(id)?.username,
          isOwner: workspace.owner === id,
        }))
        .filter((u) => u.username);
    }
    workspace.users.forEach((userId) => {
      const client = this.connectedUsers.get(userId);
      if (client && client !== excludeWs && client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }

  removeUserFromWorkspace(userId) {
    const user = this.connectedUsers.get(userId);
    if (user && user.workspace) {
      const workspace = this.getWorkspace(user.workspace);
      workspace.users = workspace.users.filter((id) => id !== userId);

      this.broadcastToWorkspace(user.workspace, {
        type: "codeEditorUserList",
        data: {
          users: workspace.users.map((id) => this.connectedUsers.get(id)?.username).filter(Boolean),
        },
      });
    }
    this.connectedUsers.delete(userId);
  }

  isUsernameAvailable(username, workspaceId) {
    const workspace = this.getWorkspace(workspaceId);
    const existingUsers = workspace.users.map((id) => this.connectedUsers.get(id)?.username).filter(Boolean);

    return !existingUsers.includes(username);
  }

  validateUsername(username) {
    if (RESTRICTED_USERNAMES.includes(username.toLowerCase())) {
      return { valid: false, message: "This username is restricted" };
    }
    return { valid: true };
  }
}

const codeEditorHandlers = {
  codeEditorJoin: (context, ws, data) => {
    const { username, workspace, password, isNewWorkspace } = data.data;

    const usernameValidation = context.validateUsername(username);
    if (!usernameValidation.valid) {
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: usernameValidation.message },
        })
      );
      return;
    }

    if (!context.isUsernameAvailable(username, workspace)) {
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: "Username already taken in this workspace" },
        })
      );
      return;
    }

    const workspaceExists = context.workspaces.has(workspace);
    const workspaceData = context.getWorkspace(workspace);

    if (workspaceExists && !isNewWorkspace) {
      if (workspaceData.password && workspaceData.password !== password) {
        ws.send(
          JSON.stringify({
            type: "codeEditorError",
            data: { message: "Invalid workspace password" },
          })
        );
        return;
      }
    } else if (!workspaceExists && isNewWorkspace) {
      workspaceData.password = password || "";
      workspaceData.owner = ws.userId;
    } else if (workspaceExists && !workspaceData.owner) {
      workspaceData.owner = ws.userId;
    } else if (!workspaceExists && !isNewWorkspace) {
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: "Workspace not found" },
        })
      );
      return;
    }

    context.connectedUsers.set(ws.userId, ws);
    workspaceData.users.push(ws.userId);
    ws.workspace = workspace;
    ws.username = username;

    ws.send(
      JSON.stringify({
        type: "codeEditorUpdate",
        data: {
          code: workspaceData.code,
          output: workspaceData.output,
          isOwner: workspaceData.owner === ws.userId,
        },
      })
    );

    ws.send(
      JSON.stringify({
        type: "codeEditorSettingsUpdate",
        data: { settings: context.getWorkspaceSettings(workspace) },
      })
    );

    context.broadcastToWorkspace(workspace, {
      type: "codeEditorUserList",
      data: { users: [] },
    });
  },

  codeEditorUpdate: (context, ws, data) => {
    if (data.data?.code !== undefined && ws.workspace) {
      if (data.data.code.length > 65536) {
        ws.send(
          JSON.stringify({
            type: "codeEditorError",
            data: { message: "Code exceeds maximum length of 65536 characters" },
          })
        );
        return;
      }

      const workspace = context.getWorkspace(ws.workspace);
      workspace.code = data.data.code;
      context.broadcastToWorkspace(
        ws.workspace,
        {
          type: "codeEditorUpdate",
          data: { code: workspace.code },
        },
        ws
      );
    }
  },

  codeEditorRun: (context, ws, data) => {
    if (data.data?.code !== undefined && ws.workspace) {
      const workspace = context.getWorkspace(ws.workspace);
      workspace.code = data.data.code;
      workspace.output = data.data.output || "";

      context.broadcastToWorkspace(ws.workspace, {
        type: "codeEditorRun",
        data: {
          code: workspace.code,
          output: workspace.output,
          triggeredBy: ws.username,
        },
      });
    }
  },

  codeEditorUpdateSettings: (context, ws, data) => {
    if (!ws.workspace || !ws.userId) return;

    const workspace = context.getWorkspace(ws.workspace);
    if (workspace.owner !== ws.userId) {
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: "Only workspace owner can change settings" },
        })
      );
      return;
    }

    const settings = data.data?.settings;
    if (!settings) return;

    context.workspaceSettings.set(ws.workspace, {
      readonly: Boolean(settings.readonly),
      clearDisabled: Boolean(settings.clearDisabled),
      runDisabled: Boolean(settings.runDisabled),
    });

    context.broadcastToWorkspace(ws.workspace, {
      type: "codeEditorSettingsUpdate",
      data: { settings: context.getWorkspaceSettings(ws.workspace) },
    });
  },

  codeEditorDisconnect: (context, ws) => {
    if (ws.userId) {
      context.removeUserFromWorkspace(ws.userId);
    }
  },

  codeEditorPurge: (context, ws) => {
    if (ws.userId) {
      const user = context.connectedUsers.get(ws.userId);
      const workspace = user?.workspace;
      context.removeUserFromWorkspace(ws.userId);
      if (workspace) {
        const workspaceData = context.getWorkspace(workspace);
        if (workspaceData.users.length === 0) {
          context.workspaces.delete(workspace);
        }
      }
    }
  },
};

module.exports = { CodeEditorContext, codeEditorHandlers };
