// UUID Generator Service
// Generate various types of unique identifiers with support for multiple formats
// Includes: UUID v1, v4, v7, custom formats, batch generation, and validation

const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3114;

// Middleware
app.use(express.json({ limit: "1mb" }));

// Serve static files (including our HTML page)
app.use(express.static(path.join(__dirname)));

// Service Configuration
const CONFIG = {
  serviceName: "UUIDGenerator",
  version: "1.0.0",
  enableDiagnostics: false,
  maxBatchSize: 1000,
  customFormats: {
    alphanumeric: { chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", defaultLength: 16 },
    hex: { chars: "0123456789ABCDEF", defaultLength: 32 },
    base32: { chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", defaultLength: 26 },
    numeric: { chars: "0123456789", defaultLength: 16 },
  },
};

// Service State
const STATE = {
  startTime: new Date(),
  requestCount: 0,
  errorCount: 0,
  lastError: null,
  generatedCount: 0,
  formatStats: {},
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

/* ===== UUID GENERATION FUNCTIONS ===== */

// Generate UUID v4 (random)
function generateUUIDv4() {
  return crypto.randomUUID();
}

// Generate UUID v1 (timestamp + MAC address simulation)
function generateUUIDv1() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(10);

  // Convert timestamp to UUID v1 format
  const timestampHex = timestamp.toString(16).padStart(12, "0");
  const timeLow = timestampHex.slice(-8);
  const timeMid = timestampHex.slice(-12, -8);
  const timeHigh = "1" + timestampHex.slice(-15, -12); // Version 1

  const clockSeq = random.slice(0, 2);
  clockSeq[0] = (clockSeq[0] & 0x3f) | 0x80; // Set variant bits

  const node = random.slice(2, 8);

  return [timeLow, timeMid, timeHigh, clockSeq.toString("hex"), node.toString("hex")].join("-");
}

// Generate UUID v7 (Unix timestamp + random)
function generateUUIDv7() {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(10);

  // 48-bit timestamp in milliseconds
  const timestampHex = timestamp.toString(16).padStart(12, "0");

  // 12-bit random
  const randA = randomBytes.slice(0, 2);
  randA[0] = (randA[0] & 0x0f) | 0x70; // Version 7

  // 62-bit random
  const randB = randomBytes.slice(2, 10);
  randB[0] = (randB[0] & 0x3f) | 0x80; // Set variant bits

  return [
    timestampHex.slice(0, 8),
    timestampHex.slice(8) + randA.toString("hex").slice(0, 4),
    "7" + randA.toString("hex").slice(1) + randB.toString("hex").slice(0, 3),
    randB.toString("hex").slice(3, 7),
    randB.toString("hex").slice(7),
  ].join("-");
}

// Generate custom format ID
function generateCustomId(format, length) {
  const formatConfig = CONFIG.customFormats[format];
  if (!formatConfig) {
    throw new Error(`Unsupported format: ${format}`);
  }

  const chars = formatConfig.chars;
  const idLength = length || formatConfig.defaultLength;
  let result = "";

  for (let i = 0; i < idLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

// Validate UUID format
function validateUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValid = uuidRegex.test(uuid);

  let version = null;
  let variant = null;

  if (isValid) {
    version = parseInt(uuid.charAt(14), 16);
    const variantChar = uuid.charAt(19);
    if ("89ab".includes(variantChar.toLowerCase())) {
      variant = "RFC 4122";
    } else if ("01".includes(variantChar.toLowerCase())) {
      variant = "NCS backward compatibility";
    } else if ("cd".includes(variantChar.toLowerCase())) {
      variant = "Microsoft Corporation";
    } else {
      variant = "Reserved for future definition";
    }
  }

  return {
    isValid,
    version,
    variant,
    format: isValid ? "UUID" : "Invalid",
  };
}

// Update statistics
function updateStats(format, count = 1) {
  STATE.generatedCount += count;
  STATE.formatStats[format] = (STATE.formatStats[format] || 0) + count;
}

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
      generatedCount: STATE.generatedCount,
      formatStats: STATE.formatStats,
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
      "uuid-generation",
      "multiple-uuid-versions",
      "custom-formats",
      "batch-generation",
      "uuid-validation",
      "format-detection",
    ],
    supportedFormats: {
      uuid: ["v1", "v4", "v7"],
      custom: Object.keys(CONFIG.customFormats),
    },
    limits: {
      maxBatchSize: CONFIG.maxBatchSize,
      customFormatMaxLength: 100,
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
  const allowedKeys = ["enableDiagnostics", "maxBatchSize"];
  const updated = [];
  const errors = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unknown config key: ${key}`);
      continue;
    }

    if (key === "maxBatchSize" && (typeof value !== "number" || value < 1 || value > 10000)) {
      errors.push("maxBatchSize must be a number between 1 and 10000");
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
      description: "UUID and unique identifier generation service with multiple formats and validation",
    },
    basePath: "/api",
    endpoints: endpoints,
    paths,
    timestamp: new Date().toISOString(),
  });
});

/* ===== UUID SERVICE ENDPOINTS ===== */

// Generate single UUID
app.post("/api/generate", (req, res) => {
  try {
    const { version = "v4", format = "uuid", length } = req.body || {};

    let result;
    let generatedFormat;

    if (format === "uuid") {
      switch (version) {
        case "v1":
          result = generateUUIDv1();
          generatedFormat = "uuid-v1";
          break;
        case "v4":
          result = generateUUIDv4();
          generatedFormat = "uuid-v4";
          break;
        case "v7":
          result = generateUUIDv7();
          generatedFormat = "uuid-v7";
          break;
        default:
          return res.status(400).json({
            error: "Invalid UUID version",
            supportedVersions: ["v1", "v4", "v7"],
          });
      }
    } else {
      result = generateCustomId(format, length);
      generatedFormat = `custom-${format}`;
    }

    updateStats(generatedFormat);

    res.json({
      id: result,
      format: generatedFormat,
      version: format === "uuid" ? version : null,
      length: result.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
      supportedFormats: Object.keys(CONFIG.customFormats).concat(["uuid"]),
    });
  }
});

// Generate batch UUIDs
app.post("/api/batch", (req, res) => {
  try {
    const { count = 10, version = "v4", format = "uuid", length } = req.body || {};

    if (typeof count !== "number" || count < 1 || count > CONFIG.maxBatchSize) {
      return res.status(400).json({
        error: `Count must be between 1 and ${CONFIG.maxBatchSize}`,
      });
    }

    const results = [];
    let generatedFormat;

    for (let i = 0; i < count; i++) {
      let id;

      if (format === "uuid") {
        switch (version) {
          case "v1":
            id = generateUUIDv1();
            generatedFormat = "uuid-v1";
            break;
          case "v4":
            id = generateUUIDv4();
            generatedFormat = "uuid-v4";
            break;
          case "v7":
            id = generateUUIDv7();
            generatedFormat = "uuid-v7";
            break;
          default:
            return res.status(400).json({
              error: "Invalid UUID version",
              supportedVersions: ["v1", "v4", "v7"],
            });
        }
      } else {
        id = generateCustomId(format, length);
        generatedFormat = `custom-${format}`;
      }

      results.push(id);
    }

    updateStats(generatedFormat, count);

    res.json({
      ids: results,
      count: results.length,
      format: generatedFormat,
      version: format === "uuid" ? version : null,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
      supportedFormats: Object.keys(CONFIG.customFormats).concat(["uuid"]),
    });
  }
});

// Validate UUID
app.post("/api/validate", (req, res) => {
  try {
    const { id } = req.body || {};

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        error: "Missing or invalid 'id' field",
      });
    }

    const validation = validateUUID(id);

    res.json({
      id,
      ...validation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// Generate single UUID via GET (convenience endpoint)
app.get("/api/generate", (req, res) => {
  try {
    const { version = "v4", format = "uuid", length } = req.query;

    let result;
    let generatedFormat;

    if (format === "uuid") {
      switch (version) {
        case "v1":
          result = generateUUIDv1();
          generatedFormat = "uuid-v1";
          break;
        case "v4":
          result = generateUUIDv4();
          generatedFormat = "uuid-v4";
          break;
        case "v7":
          result = generateUUIDv7();
          generatedFormat = "uuid-v7";
          break;
        default:
          return res.status(400).json({
            error: "Invalid UUID version",
            supportedVersions: ["v1", "v4", "v7"],
          });
      }
    } else {
      result = generateCustomId(format, parseInt(length) || undefined);
      generatedFormat = `custom-${format}`;
    }

    updateStats(generatedFormat);

    res.json({
      id: result,
      format: generatedFormat,
      version: format === "uuid" ? version : null,
      length: result.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
      supportedFormats: Object.keys(CONFIG.customFormats).concat(["uuid"]),
    });
  }
});

// Generate specific number of UUIDs (GET endpoint for convenience)
app.get("/api/generate/:count", (req, res) => {
  try {
    const count = parseInt(req.params.count);
    const { version = "v4", format = "uuid", length } = req.query;

    if (isNaN(count) || count < 1 || count > CONFIG.maxBatchSize) {
      return res.status(400).json({
        error: `Count must be a number between 1 and ${CONFIG.maxBatchSize}`,
      });
    }

    const results = [];
    let generatedFormat;

    for (let i = 0; i < count; i++) {
      let id;

      if (format === "uuid") {
        switch (version) {
          case "v1":
            id = generateUUIDv1();
            generatedFormat = "uuid-v1";
            break;
          case "v4":
            id = generateUUIDv4();
            generatedFormat = "uuid-v4";
            break;
          case "v7":
            id = generateUUIDv7();
            generatedFormat = "uuid-v7";
            break;
          default:
            return res.status(400).json({
              error: "Invalid UUID version",
              supportedVersions: ["v1", "v4", "v7"],
            });
        }
      } else {
        id = generateCustomId(format, parseInt(length) || undefined);
        generatedFormat = `custom-${format}`;
      }

      results.push(id);
    }

    updateStats(generatedFormat, count);

    res.json({
      ids: results,
      count: results.length,
      format: generatedFormat,
      version: format === "uuid" ? version : null,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
      supportedFormats: Object.keys(CONFIG.customFormats).concat(["uuid"]),
    });
  }
});

// Get custom format information
app.get("/api/formats", (req, res) => {
  res.json({
    uuid: {
      versions: ["v1", "v4", "v7"],
      description: "Standard UUID formats according to RFC 4122 and draft specifications",
      format: "xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx",
    },
    custom: Object.entries(CONFIG.customFormats).reduce((acc, [key, config]) => {
      acc[key] = {
        description: `Custom ${key} format`,
        characters: config.chars,
        defaultLength: config.defaultLength,
        maxLength: 100,
      };
      return acc;
    }, {}),
    timestamp: new Date().toISOString(),
  });
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

        // Add descriptions for specific endpoints
        if (path === "/api/generate" && method === "post") {
          description = "Generate single UUID or custom ID (POST)";
          exampleBody = { version: "v4", format: "uuid" };
        } else if (path === "/api/generate" && method === "get") {
          description = "Generate single UUID via GET with query params";
        } else if (path === "/api/generate/:count" && method === "get") {
          description = "Generate specified number of UUIDs via GET";
        } else if (path === "/api/batch" && method === "post") {
          description = "Generate multiple UUIDs or custom IDs";
          exampleBody = { count: 5, version: "v4", format: "uuid" };
        } else if (path === "/api/validate" && method === "post") {
          description = "Validate UUID format and extract info";
          exampleBody = { id: "550e8400-e29b-41d4-a716-446655440000" };
        } else if (path === "/api/formats" && method === "get") {
          description = "Get supported formats and their details";
        }

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

// Serve the HTML page as the default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 ${CONFIG.serviceName} v${CONFIG.version} running on port ${PORT}`);
  console.log(`📊 Visit http://localhost:${PORT}/api/status for service status`);
  console.log(`🏥 Visit http://localhost:${PORT}/api/health for health check`);
  console.log(`📖 Visit http://localhost:${PORT}/api/openapi for API documentation`);
  console.log(`🌐 Visit http://localhost:${PORT}/ for HTML interface`);
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
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(20)} - ${ep.description || "Standard endpoint"}`);
    });
    console.log("");
  }

  if (customEndpoints.length > 0) {
    console.log("UUID service endpoints:");
    customEndpoints.forEach((ep) => {
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(20)} - ${ep.description || "UUID service endpoint"}`);
    });
    console.log("");
  }

  console.log("Supported formats:");
  console.log("  - UUID: v1, v4, v7");
  Object.entries(CONFIG.customFormats).forEach(([format, config]) => {
    console.log(`  - Custom ${format}: ${config.chars.length} chars, default length ${config.defaultLength}`);
  });
  console.log("");

  console.log("🎯 Ready to generate UUIDs!");
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
