// External Service Template
// A basic template for creating new external services with standard endpoints
// Includes: config, health, status, capabilities, openapi, and ping endpoints

const express = require("express");
const { buildSchema, graphql } = require("graphql");
const app = express();
const PORT = process.env.PORT || 3122;

// Middleware
app.use(express.json({ limit: "1mb" }));

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Service Configuration
const CONFIG = {
  serviceName: "SimpleToDoList",
  version: "1.0.0",
  enableDiagnostics: false,
  customSetting: "default-value",
};

// Service State
const STATE = {
  startTime: new Date(),
  requestCount: 0,
  errorCount: 0,
  lastError: null,
};

// Request counter middleware
app.use((req, res, next) => {
  STATE.requestCount++;
  next();
});

// Error handler middleware
app.use((err, req, res, next) => {
  STATE.errorCount++;
  STATE.lastError = {
    message: err.message,
    timestamp: new Date(),
    path: req.path,
  };
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

/* ===== STANDARD ENDPOINTS ===== */

// PING endpoint - simple connectivity test
app.get("/api/ping", (req, res) => {
  res.json({
    message: "pong",
    timestamp: new Date().toISOString(),
    service: CONFIG.serviceName,
  });
});

// HEALTH endpoint - service health status
app.get("/api/health", (req, res) => {
  const uptime = Date.now() - STATE.startTime.getTime();
  const status = STATE.errorCount > 10 ? "degraded" : "ok";

  res.json({
    status,
    uptime: Math.floor(uptime / 1000), // seconds
    timestamp: new Date().toISOString(),
    service: CONFIG.serviceName,
    version: CONFIG.version,
  });
});

// STATUS endpoint - detailed service status
app.get("/api/status", (req, res) => {
  const uptime = Date.now() - STATE.startTime.getTime();

  res.json({
    service: CONFIG.serviceName,
    version: CONFIG.version,
    status: "running",
    uptime: {
      seconds: Math.floor(uptime / 1000),
      human: formatUptime(uptime),
    },
    metrics: {
      requestCount: STATE.requestCount,
      errorCount: STATE.errorCount,
      errorRate: STATE.requestCount > 0 ? ((STATE.errorCount / STATE.requestCount) * 100).toFixed(2) + "%" : "0%",
    },
    lastError: STATE.lastError,
    timestamp: new Date().toISOString(),
  });
});

// CAPABILITIES endpoint - service capabilities and limits
app.get("/api/capabilities", (req, res) => {
  const endpoints = listEndpoints(app);
  const endpointStrings = endpoints.map((ep) => `${ep.method} ${ep.path}`);

  res.json({
    service: CONFIG.serviceName,
    version: CONFIG.version,
    features: ["ping", "health-check", "status-monitoring", "configuration-management", "openapi-documentation"],
    endpoints: endpointStrings,
    supportedFormats: ["json"],
    timestamp: new Date().toISOString(),
  });
});

// CONFIG endpoints - configuration management
app.get("/api/config", (req, res) => {
  res.json({
    config: CONFIG,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/config", (req, res) => {
  const updates = req.body || {};
  const allowedKeys = ["enableDiagnostics", "customSetting"];
  const updated = [];
  const errors = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unknown config key: ${key}`);
      continue;
    }
    // Update the config
    CONFIG[key] = value;
    updated.push(key);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Configuration validation failed",
      details: errors,
      updated,
    });
  }

  res.json({
    message: "Configuration updated successfully",
    updated,
    config: CONFIG,
    timestamp: new Date().toISOString(),
  });
});

// OPENAPI endpoint - API documentation
app.get("/api/openapi", (req, res) => {
  const endpoints = listEndpoints(app);

  const paths = endpoints.reduce((acc, ep) => {
    if (!acc[ep.path]) acc[ep.path] = [];
    if (!acc[ep.path].includes(ep.method)) acc[ep.path].push(ep.method);
    return acc;
  }, {});

  res.json({
    openapi: "3.0.0",
    info: {
      title: CONFIG.serviceName,
      version: CONFIG.version,
      description: "External service template with standard endpoints",
    },
    basePath: "/api",
    endpoints: endpoints,
    paths,
    timestamp: new Date().toISOString(),
  });
});

/* ===== CUSTOM SERVICE ENDPOINTS ===== */
// Add your custom service endpoints here
// Example:

app.get("/api/example", (req, res) => {
  res.json({
    message: "This is an example endpoint for your custom service",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/example", (req, res) => {
  const { data } = req.body || {};

  if (!data) {
    return res.status(400).json({
      error: "Missing required field: data",
    });
  }

  // Process the data here
  res.status(201).json({
    message: "Data processed successfully",
    receivedData: data,
    processedAt: new Date().toISOString(),
  });
});

/* ===== GRAPHQL API ===== */

// Define GraphQL schema
const schema = buildSchema(`
  type Task {
    id: ID!
    title: String!
    completed: Boolean!
  }

  type Query {
    getTasks: [Task]
  }

  type Mutation {
    addTask(title: String!): Task
    toggleTask(id: ID!): Task
    deleteTask(id: ID!): Task
  }
`);

// In-memory data store
const tasks = [];
let taskIdCounter = 1;

// Define resolvers
const root = {
  getTasks: () => tasks,

  addTask: ({ title }) => {
    const newTask = { id: taskIdCounter++, title, completed: false };
    tasks.push(newTask);
    return newTask;
  },

  toggleTask: ({ id }) => {
    const task = tasks.find((task) => task.id === parseInt(id));
    if (task) {
      task.completed = !task.completed;
    }
    return task;
  },

  deleteTask: ({ id }) => {
    const taskIndex = tasks.findIndex((task) => task.id === parseInt(id));
    if (taskIndex !== -1) {
      const [deletedTask] = tasks.splice(taskIndex, 1);
      return deletedTask;
    }
    return null;
  },
};

// GraphQL endpoint
app.post("/api/graphql", async (req, res) => {
  try {
    const { query, variables } = req.body;
    const result = await graphql({ schema, source: query, rootValue: root, variableValues: variables });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===== UTILITY FUNCTIONS ===== */

function formatUptime(uptimeMs) {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function listEndpoints(app) {
  const endpoints = [];

  if (!app || !app._router || !app._router.stack) return endpoints;

  app._router.stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods || {}).filter((m) => layer.route.methods[m]);

      methods.forEach((method) => {
        const upperMethod = method.toUpperCase();
        let description = "";
        let exampleBody = null;
        endpoints.push({
          method: upperMethod,
          path,
          description,
          exampleBody,
        });
      });
    }
  });

  // Filter to only include /api/* endpoints
  return endpoints.filter((ep) => typeof ep.path === "string" && ep.path.startsWith("/api"));
}

/* ===== SERVER STARTUP ===== */

app.listen(PORT, () => {
  console.log(`🚀 ${CONFIG.serviceName} v${CONFIG.version} running on port ${PORT}`);
  console.log(`📊 Visit http://localhost:${PORT}/api/status for service status`);
  console.log(`🏥 Visit http://localhost:${PORT}/api/health for health check`);
  console.log(`📖 Visit http://localhost:${PORT}/api/openapi for API documentation`);
  console.log(`📜 Visit http://localhost:${PORT}/ for HTML interface`);
  console.log(`📝 GraphQL API available at http://localhost:${PORT}/api/graphql`);
  console.log("");

  // Dynamically list all available endpoints
  const endpoints = listEndpoints(app);
  const standardEndpoints = endpoints.filter((ep) =>
    ["/api/ping", "/api/health", "/api/status", "/api/capabilities", "/api/config", "/api/openapi"].includes(ep.path)
  );
  const customEndpoints = endpoints.filter(
    (ep) =>
      !["/api/ping", "/api/health", "/api/status", "/api/capabilities", "/api/config", "/api/openapi"].includes(ep.path)
  );

  if (standardEndpoints.length > 0) {
    console.log("Standard endpoints:");
    standardEndpoints.forEach((ep) => {
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(15)} - ${ep.description}`);
    });
    console.log("");
  }

  if (customEndpoints.length > 0) {
    console.log("Custom endpoints:");
    customEndpoints.forEach((ep) => {
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(15)} - ${ep.description}`);
    });
    console.log("");
  }

  console.log("🎯 Ready to serve requests!");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  process.exit(0);
});
