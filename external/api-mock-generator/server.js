// API Mock Generator Service
// Generate mock API responses for testing with dynamic endpoint creation
// Features: Dynamic response generation, schema-based mocking, delay simulation, error simulation

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3120;

// Middleware
app.use(express.json({ limit: "10mb" }));

// Serve static files (including our HTML page)
app.use(express.static(path.join(__dirname)));

// Service Configuration
const CONFIG = {
  serviceName: "APIMockGenerator",
  version: "1.0.0",
  enableDiagnostics: true,
  maxEndpoints: 100,
  maxResponseSize: "5mb",
  defaultDelay: 0,
  maxDelay: 30000,
  enableCors: true,
  logRequests: true,
};

// File paths for persistence
const MOCK_DATA_FILE = path.join(__dirname, "mocks-data-tmp.json");
const REQUEST_LOG_FILE = path.join(__dirname, "request-logs-tmp.json");

// Service State
const STATE = {
  startTime: new Date(),
  requestCount: 0,
  errorCount: 0,
  lastError: null,
  mockEndpoints: new Map(),
  requestLog: [],
  maxLogSize: 1000,
};

// CORS middleware
if (CONFIG.enableCors) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}

// Request counter middleware
app.use((req, res, next) => {
  STATE.requestCount++;

  // Log request if enabled
  if (CONFIG.logRequests && !req.path.startsWith("/api/")) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.body,
      query: req.query,
      ip: req.ip || req.connection.remoteAddress,
    };

    STATE.requestLog.unshift(logEntry);
    if (STATE.requestLog.length > STATE.maxLogSize) {
      STATE.requestLog = STATE.requestLog.slice(0, STATE.maxLogSize);
    }

    // Save logs to file every 20 requests to avoid excessive I/O
    if (STATE.requestLog.length % 20 === 0) {
      saveRequestLogsToFile();
    }
  }

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
      mockEndpoints: STATE.mockEndpoints.size,
      requestLogSize: STATE.requestLog.length,
    },
    persistence: {
      mocksFile: MOCK_DATA_FILE,
      logsFile: REQUEST_LOG_FILE,
      mocksFileExists: fs.existsSync(MOCK_DATA_FILE),
      logsFileExists: fs.existsSync(REQUEST_LOG_FILE),
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
    features: [
      "dynamic-endpoint-creation",
      "schema-based-mocking",
      "response-delay-simulation",
      "error-simulation",
      "request-logging",
      "conditional-responses",
      "data-generation",
    ],
    capabilities: {
      maxEndpoints: CONFIG.maxEndpoints,
      maxResponseSize: CONFIG.maxResponseSize,
      maxDelay: CONFIG.maxDelay,
      supportedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      responseFormats: ["json", "text", "html", "xml"],
    },
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
  const allowedKeys = ["enableDiagnostics", "defaultDelay", "maxDelay", "enableCors", "logRequests"];
  const updated = [];
  const errors = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unknown config key: ${key}`);
      continue;
    }
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
    if (!acc[ep.path]) acc[ep.path] = {};
    acc[ep.path][ep.method.toLowerCase()] = {
      summary: ep.description || `${ep.method} ${ep.path}`,
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
      },
    };
    return acc;
  }, {});

  res.json({
    openapi: "3.0.0",
    info: {
      title: CONFIG.serviceName,
      version: CONFIG.version,
      description: "API Mock Generator - Create and manage mock API endpoints for testing",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    paths,
    timestamp: new Date().toISOString(),
  });
});

/* ===== MOCK API MANAGEMENT ENDPOINTS ===== */

// GET all mock endpoints
app.get("/api/mocks", (req, res) => {
  const mocks = Array.from(STATE.mockEndpoints.values()).map((mock) => ({
    id: mock.id,
    method: mock.method,
    path: mock.path,
    description: mock.description,
    enabled: mock.enabled,
    createdAt: mock.createdAt,
    requestCount: mock.requestCount || 0,
  }));

  res.json({
    mocks,
    total: mocks.length,
    enabled: mocks.filter((m) => m.enabled).length,
    timestamp: new Date().toISOString(),
  });
});

// GET specific mock endpoint
app.get("/api/mocks/:id", (req, res) => {
  const { id } = req.params;
  const mock = STATE.mockEndpoints.get(id);

  if (!mock) {
    return res.status(404).json({
      error: "Mock endpoint not found",
      id,
    });
  }

  res.json({
    mock,
    timestamp: new Date().toISOString(),
  });
});

// CREATE new mock endpoint
app.post("/api/mocks", (req, res) => {
  try {
    const mockData = req.body;
    const validation = validateMockEndpoint(mockData);

    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid mock endpoint configuration",
        details: validation.errors,
      });
    }

    if (STATE.mockEndpoints.size >= CONFIG.maxEndpoints) {
      return res.status(400).json({
        error: "Maximum number of mock endpoints reached",
        limit: CONFIG.maxEndpoints,
      });
    }

    const id = generateId();
    const mock = {
      id,
      method: mockData.method.toUpperCase(),
      path: mockData.path,
      description: mockData.description || "",
      enabled: mockData.enabled !== false,
      createdAt: new Date().toISOString(),
      requestCount: 0,
      responses: mockData.responses || [],
      conditions: mockData.conditions || [],
      delay: mockData.delay || CONFIG.defaultDelay,
      schema: mockData.schema || null,
    };

    STATE.mockEndpoints.set(id, mock);

    // Save to file
    saveMocksToFile();

    // Register the dynamic route
    registerDynamicRoute(mock);

    res.status(201).json({
      message: "Mock endpoint created successfully",
      mock,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    STATE.errorCount++;
    STATE.lastError = { message: error.message, timestamp: new Date(), path: req.path };
    res.status(500).json({ error: "Failed to create mock endpoint", details: error.message });
  }
});

// UPDATE mock endpoint
app.put("/api/mocks/:id", (req, res) => {
  try {
    const { id } = req.params;
    const mockData = req.body;

    if (!STATE.mockEndpoints.has(id)) {
      return res.status(404).json({
        error: "Mock endpoint not found",
        id,
      });
    }

    const validation = validateMockEndpoint(mockData);
    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid mock endpoint configuration",
        details: validation.errors,
      });
    }

    const existingMock = STATE.mockEndpoints.get(id);
    const updatedMock = {
      ...existingMock,
      method: mockData.method.toUpperCase(),
      path: mockData.path,
      description: mockData.description || "",
      enabled: mockData.enabled !== false,
      responses: mockData.responses || [],
      conditions: mockData.conditions || [],
      delay: mockData.delay || CONFIG.defaultDelay,
      schema: mockData.schema || null,
      updatedAt: new Date().toISOString(),
    };

    STATE.mockEndpoints.set(id, updatedMock);

    // Save to file
    saveMocksToFile();

    res.json({
      message: "Mock endpoint updated successfully",
      mock: updatedMock,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    STATE.errorCount++;
    STATE.lastError = { message: error.message, timestamp: new Date(), path: req.path };
    res.status(500).json({ error: "Failed to update mock endpoint", details: error.message });
  }
});

// DELETE mock endpoint
app.delete("/api/mocks/:id", (req, res) => {
  const { id } = req.params;

  if (!STATE.mockEndpoints.has(id)) {
    return res.status(404).json({
      error: "Mock endpoint not found",
      id,
    });
  }

  STATE.mockEndpoints.delete(id);

  // Save to file
  saveMocksToFile();

  res.json({
    message: "Mock endpoint deleted successfully",
    id,
    timestamp: new Date().toISOString(),
  });
});

// BULK operations
app.post("/api/mocks/bulk", (req, res) => {
  try {
    const { action, ids, mockData } = req.body;
    const results = [];
    const errors = [];

    if (action === "delete") {
      ids.forEach((id) => {
        if (STATE.mockEndpoints.has(id)) {
          STATE.mockEndpoints.delete(id);
          results.push({ id, action: "deleted" });
        } else {
          errors.push({ id, error: "Not found" });
        }
      });
    } else if (action === "enable" || action === "disable") {
      const enabled = action === "enable";
      ids.forEach((id) => {
        if (STATE.mockEndpoints.has(id)) {
          const mock = STATE.mockEndpoints.get(id);
          mock.enabled = enabled;
          STATE.mockEndpoints.set(id, mock);
          results.push({ id, action, enabled });
        } else {
          errors.push({ id, error: "Not found" });
        }
      });
    }

    // Save to file after bulk operations
    if (results.length > 0) {
      saveMocksToFile();
    }

    res.json({
      message: `Bulk ${action} completed`,
      results,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    STATE.errorCount++;
    STATE.lastError = { message: error.message, timestamp: new Date(), path: req.path };
    res.status(500).json({ error: "Bulk operation failed", details: error.message });
  }
});

/* ===== DATA GENERATION ENDPOINTS ===== */

// Generate mock data based on schema
app.post("/api/generate", (req, res) => {
  try {
    const { schema, count = 1 } = req.body;

    if (!schema) {
      return res.status(400).json({
        error: "Schema is required",
      });
    }

    if (count > 100) {
      return res.status(400).json({
        error: "Maximum count is 100",
      });
    }

    const data = [];
    for (let i = 0; i < count; i++) {
      data.push(generateDataFromSchema(schema));
    }

    res.json({
      data: count === 1 ? data[0] : data,
      count,
      schema,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    STATE.errorCount++;
    STATE.lastError = { message: error.message, timestamp: new Date(), path: req.path };
    res.status(500).json({ error: "Data generation failed", details: error.message });
  }
});

// Get request logs
app.get("/api/logs", (req, res) => {
  const { limit = 50, filter } = req.query;
  let logs = STATE.requestLog;

  if (filter) {
    logs = logs.filter(
      (log) => log.path.includes(filter) || log.method.includes(filter) || JSON.stringify(log.body).includes(filter)
    );
  }

  const limitNum = Math.min(parseInt(limit) || 50, 500);
  logs = logs.slice(0, limitNum);

  res.json({
    logs,
    total: STATE.requestLog.length,
    filtered: logs.length,
    timestamp: new Date().toISOString(),
  });
});

// Clear request logs
app.delete("/api/logs", (req, res) => {
  STATE.requestLog = [];

  // Save empty logs to file
  saveRequestLogsToFile();

  res.json({
    message: "Request logs cleared",
    timestamp: new Date().toISOString(),
  });
}); /* ===== BACKUP/RESTORE ENDPOINTS ===== */

// Export all mocks and logs
app.get("/api/export", (req, res) => {
  try {
    const exportData = {
      mocks: Array.from(STATE.mockEndpoints.values()),
      logs: STATE.requestLog,
      exportedAt: new Date().toISOString(),
      version: CONFIG.version,
    };

    res.setHeader("Content-Disposition", `attachment; filename="api-mocks-backup-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    STATE.errorCount++;
    STATE.lastError = { message: error.message, timestamp: new Date(), path: req.path };
    res.status(500).json({ error: "Failed to export data", details: error.message });
  }
});

// Import mocks and logs
app.post("/api/import", (req, res) => {
  try {
    const { mocks, logs, replaceExisting = false } = req.body;

    if (!mocks && !logs) {
      return res.status(400).json({
        error: "No data to import",
        message: "Provide 'mocks' and/or 'logs' arrays in the request body",
      });
    }

    let importedMocks = 0;
    let importedLogs = 0;

    // Import mocks
    if (mocks && Array.isArray(mocks)) {
      if (replaceExisting) {
        STATE.mockEndpoints.clear();
      }

      mocks.forEach((mock) => {
        if (mock.id && mock.method && mock.path) {
          STATE.mockEndpoints.set(mock.id, mock);
          importedMocks++;
        }
      });

      saveMocksToFile();
    }

    // Import logs
    if (logs && Array.isArray(logs)) {
      if (replaceExisting) {
        STATE.requestLog = [];
      }

      logs.forEach((log) => {
        if (log.timestamp && log.method && log.path) {
          STATE.requestLog.unshift(log);
          importedLogs++;
        }
      });

      // Keep within limits
      STATE.requestLog = STATE.requestLog.slice(0, STATE.maxLogSize);
      saveRequestLogsToFile();
    }

    res.json({
      message: "Import completed successfully",
      imported: {
        mocks: importedMocks,
        logs: importedLogs,
      },
      replaceExisting,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    STATE.errorCount++;
    STATE.lastError = { message: error.message, timestamp: new Date(), path: req.path };
    res.status(500).json({ error: "Failed to import data", details: error.message });
  }
});

// Force save all data to files
app.post("/api/save", (req, res) => {
  try {
    const mocksSaved = saveMocksToFile();
    const logsSaved = saveRequestLogsToFile();

    res.json({
      message: "Data saved to files",
      success: {
        mocks: mocksSaved,
        logs: logsSaved,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    STATE.errorCount++;
    STATE.lastError = { message: error.message, timestamp: new Date(), path: req.path };
    res.status(500).json({ error: "Failed to save data", details: error.message });
  }
});

/* ===== DYNAMIC MOCK HANDLER ===== */

// Catch-all handler for mock endpoints (must be last)
app.all("*", async (req, res) => {
  try {
    // Skip API endpoints
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }

    // Find matching mock endpoint
    const mock = findMatchingMock(req);

    if (!mock || !mock.enabled) {
      return res.status(404).json({
        error: "Mock endpoint not found",
        path: req.path,
        method: req.method,
      });
    }

    // Increment request count
    mock.requestCount = (mock.requestCount || 0) + 1;
    STATE.mockEndpoints.set(mock.id, mock);

    // Save to file every 10 requests to avoid excessive I/O
    if (mock.requestCount % 10 === 0) {
      saveMocksToFile();
    }

    // Apply delay if configured
    if (mock.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, mock.delay));
    }

    // Find appropriate response based on conditions
    const response = findMatchingResponse(mock, req);

    if (!response) {
      return res.status(500).json({
        error: "No matching response configured",
        mockId: mock.id,
      });
    }

    // Set response headers
    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
    }

    // Set status code
    const statusCode = response.statusCode || 200;
    res.status(statusCode);

    // Generate response body
    let responseBody = response.body;

    if (response.schema) {
      responseBody = generateDataFromSchema(response.schema);
    } else if (typeof responseBody === "string" && responseBody.includes("{{")) {
      responseBody = processTemplate(responseBody, req);
    }

    // Send response
    if (response.type === "json" || !response.type) {
      res.json(responseBody);
    } else if (response.type === "text") {
      res.send(responseBody);
    } else if (response.type === "html") {
      res.set("Content-Type", "text/html");
      res.send(responseBody);
    } else {
      res.send(responseBody);
    }
  } catch (error) {
    STATE.errorCount++;
    STATE.lastError = { message: error.message, timestamp: new Date(), path: req.path };
    console.error("Mock handler error:", error);
    res.status(500).json({ error: "Mock response generation failed", details: error.message });
  }
});

/* ===== UTILITY FUNCTIONS ===== */

function validateMockEndpoint(mockData) {
  const errors = [];

  if (!mockData.method) {
    errors.push("Method is required");
  }

  if (!mockData.path) {
    errors.push("Path is required");
  } else if (!mockData.path.startsWith("/")) {
    errors.push("Path must start with /");
  } else if (mockData.path.startsWith("/api/")) {
    errors.push("Path cannot start with /api/ (reserved)");
  }

  if (mockData.delay && (mockData.delay < 0 || mockData.delay > CONFIG.maxDelay)) {
    errors.push(`Delay must be between 0 and ${CONFIG.maxDelay}ms`);
  }

  if (!mockData.responses || !Array.isArray(mockData.responses) || mockData.responses.length === 0) {
    errors.push("At least one response configuration is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function registerDynamicRoute(mock) {
  // Note: Express doesn't support dynamic route registration after startup
  // This is handled by the catch-all handler instead
  console.log(`Registered mock endpoint: ${mock.method} ${mock.path}`);
}

function findMatchingMock(req) {
  for (const mock of STATE.mockEndpoints.values()) {
    if (mock.method === req.method && pathMatches(mock.path, req.path)) {
      return mock;
    }
  }
  return null;
}

function pathMatches(mockPath, requestPath) {
  // Simple path matching - could be enhanced with wildcards/params
  if (mockPath === requestPath) return true;

  // Support for path parameters like /users/:id
  const mockParts = mockPath.split("/");
  const requestParts = requestPath.split("/");

  if (mockParts.length !== requestParts.length) return false;

  for (let i = 0; i < mockParts.length; i++) {
    if (mockParts[i].startsWith(":")) continue; // Parameter
    if (mockParts[i] !== requestParts[i]) return false;
  }

  return true;
}

function findMatchingResponse(mock, req) {
  // Find response based on conditions
  for (const response of mock.responses) {
    if (conditionsMatch(response.conditions || [], req)) {
      return response;
    }
  }

  // Return first response if no conditions match
  return mock.responses[0];
}

function conditionsMatch(conditions, req) {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    switch (condition.type) {
      case "header":
        return req.headers[condition.key.toLowerCase()] === condition.value;
      case "query":
        return req.query[condition.key] === condition.value;
      case "body":
        return JSON.stringify(req.body).includes(condition.value);
      case "method":
        return req.method === condition.value;
      default:
        return true;
    }
  });
}

function generateDataFromSchema(schema) {
  if (!schema || typeof schema !== "object") return {};

  const result = {};

  for (const [key, definition] of Object.entries(schema)) {
    if (typeof definition === "string") {
      result[key] = generateValueByType(definition);
    } else if (definition.type) {
      result[key] = generateValueByType(definition.type, definition);
    }
  }

  return result;
}

function generateValueByType(type, options = {}) {
  switch (type) {
    case "string":
      return options.example || `sample_${Math.random().toString(36).substr(2, 8)}`;
    case "number":
      return options.example || Math.floor(Math.random() * 1000);
    case "boolean":
      return options.example !== undefined ? options.example : Math.random() > 0.5;
    case "email":
      return `user${Math.floor(Math.random() * 1000)}@example.com`;
    case "name":
      const names = ["John", "Jane", "Bob", "Alice", "Charlie"];
      return names[Math.floor(Math.random() * names.length)];
    case "uuid":
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    case "date":
      return new Date().toISOString();
    case "array":
      const length = options.length || 3;
      const itemType = options.items || "string";
      return Array.from({ length }, () => generateValueByType(itemType));
    default:
      return options.example || `sample_${type}`;
  }
}

function processTemplate(template, req) {
  return template
    .replace(/\{\{method\}\}/g, req.method)
    .replace(/\{\{path\}\}/g, req.path)
    .replace(/\{\{timestamp\}\}/g, new Date().toISOString())
    .replace(/\{\{random\}\}/g, Math.random().toString(36).substr(2))
    .replace(/\{\{body\}\}/g, JSON.stringify(req.body))
    .replace(/\{\{query\}\}/g, JSON.stringify(req.query));
}

/* ===== FILE PERSISTENCE FUNCTIONS ===== */

function loadMocksFromFile() {
  try {
    if (fs.existsSync(MOCK_DATA_FILE)) {
      const data = fs.readFileSync(MOCK_DATA_FILE, "utf8");
      const mocks = JSON.parse(data);

      // Convert array back to Map
      STATE.mockEndpoints.clear();
      mocks.forEach((mock) => {
        STATE.mockEndpoints.set(mock.id, mock);
      });

      console.log(`📁 Loaded ${mocks.length} mock endpoints from file`);
      return mocks.length;
    } else {
      console.log("📁 No existing mock data file found, starting fresh");
      return 0;
    }
  } catch (error) {
    console.error("❌ Failed to load mocks from file:", error.message);
    STATE.errorCount++;
    STATE.lastError = {
      message: `Failed to load mocks: ${error.message}`,
      timestamp: new Date(),
      path: "file-system",
    };
    return 0;
  }
}

function saveMocksToFile() {
  try {
    // Convert Map to array for JSON serialization
    const mocksArray = Array.from(STATE.mockEndpoints.values());
    const data = JSON.stringify(mocksArray, null, 2);

    fs.writeFileSync(MOCK_DATA_FILE, data, "utf8");
    console.log(`💾 Saved ${mocksArray.length} mock endpoints to file`);
    return true;
  } catch (error) {
    console.error("❌ Failed to save mocks to file:", error.message);
    STATE.errorCount++;
    STATE.lastError = {
      message: `Failed to save mocks: ${error.message}`,
      timestamp: new Date(),
      path: "file-system",
    };
    return false;
  }
}

function loadRequestLogsFromFile() {
  try {
    if (fs.existsSync(REQUEST_LOG_FILE)) {
      const data = fs.readFileSync(REQUEST_LOG_FILE, "utf8");
      const logs = JSON.parse(data);

      STATE.requestLog = logs.slice(0, STATE.maxLogSize); // Respect max log size
      console.log(`📁 Loaded ${STATE.requestLog.length} request logs from file`);
      return STATE.requestLog.length;
    } else {
      console.log("📁 No existing request log file found, starting fresh");
      return 0;
    }
  } catch (error) {
    console.error("❌ Failed to load request logs from file:", error.message);
    return 0;
  }
}

function saveRequestLogsToFile() {
  try {
    const data = JSON.stringify(STATE.requestLog, null, 2);
    fs.writeFileSync(REQUEST_LOG_FILE, data, "utf8");
    return true;
  } catch (error) {
    console.error("❌ Failed to save request logs to file:", error.message);
    return false;
  }
}

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

        // Add descriptions for known endpoints
        if (path === "/api/mocks" && upperMethod === "GET") {
          description = "List all mock endpoints";
        } else if (path === "/api/mocks" && upperMethod === "POST") {
          description = "Create new mock endpoint";
        } else if (path === "/api/generate" && upperMethod === "POST") {
          description = "Generate mock data from schema";
        } else if (path === "/api/logs" && upperMethod === "GET") {
          description = "Get request logs";
        }

        endpoints.push({
          method: upperMethod,
          path,
          description,
        });
      });
    }
  });

  return endpoints.filter((ep) => typeof ep.path === "string" && ep.path.startsWith("/api"));
}

/* ===== SERVER STARTUP ===== */

app.listen(PORT, () => {
  console.log(`🚀 ${CONFIG.serviceName} v${CONFIG.version} running on port ${PORT}`);
  console.log(`📊 Visit http://localhost:${PORT}/api/status for service status`);
  console.log(`🏥 Visit http://localhost:${PORT}/api/health for health check`);
  console.log(`📖 Visit http://localhost:${PORT}/api/openapi for API documentation`);
  console.log(`📜 Visit http://localhost:${PORT}/ for HTML interface`);
  console.log("");

  // Load mocks from file, or create examples if no file exists
  const loadedCount = loadMocksFromFile();
  loadRequestLogsFromFile();

  if (loadedCount === 0) {
    console.log("📝 No existing mocks found, loading examples...");
    loadExampleMocks();
  }

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
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(20)} - ${ep.description}`);
    });
    console.log("");
  }

  if (customEndpoints.length > 0) {
    console.log("Mock management endpoints:");
    customEndpoints.forEach((ep) => {
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(20)} - ${ep.description}`);
    });
    console.log("");
  }

  console.log("🎯 Ready to serve requests and create mock endpoints!");
});

function loadExampleMocks() {
  // Load some example mock endpoints
  const examples = [
    {
      method: "GET",
      path: "/users",
      description: "Get list of users",
      responses: [
        {
          statusCode: 200,
          body: [],
          schema: {
            users: { type: "array", items: "string" },
          },
        },
      ],
      delay: 100,
    },
    {
      method: "POST",
      path: "/users",
      description: "Create new user",
      responses: [
        {
          statusCode: 201,
          body: { message: "User created" },
        },
      ],
    },
  ];

  examples.forEach((example) => {
    const id = generateId();
    const mock = {
      id,
      ...example,
      enabled: true,
      createdAt: new Date().toISOString(),
      requestCount: 0,
      conditions: [],
    };
    STATE.mockEndpoints.set(id, mock);
  });

  // Save example mocks to file
  saveMocksToFile();

  console.log(`📝 Loaded ${examples.length} example mock endpoints`);
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  console.log("💾 Saving data before shutdown...");
  saveMocksToFile();
  saveRequestLogsToFile();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  console.log("💾 Saving data before shutdown...");
  saveMocksToFile();
  saveRequestLogsToFile();
  process.exit(0);
});

// Save data periodically (every 5 minutes) as a backup
setInterval(() => {
  saveMocksToFile();
  saveRequestLogsToFile();
}, 5 * 60 * 1000);
