// QR Code Generator Service
// Generate QR codes for text, URLs, and data with multiple formats and customization options
// Features: PNG/SVG/ASCII formats, size customization, error correction, batch generation, validation

const express = require("express");
const crypto = require("crypto");
const path = require("path");
const QRCode = require("qrcode");
const app = express();
const PORT = process.env.PORT || 3116;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname)));

// Service Configuration
const CONFIG = {
  serviceName: "QRGeneratorService",
  version: "1.0.0",
  enableDiagnostics: false,
  maxDataLength: 2953, // QR code maximum data capacity
  defaultSize: 200,
  maxSize: 1000,
  minSize: 50,
  maxBatchSize: 100,
  supportedFormats: ["png", "svg", "ascii"],
  errorCorrectionLevels: ["L", "M", "Q", "H"], // Low, Medium, Quartile, High
};

// Service State
const STATE = {
  startTime: new Date(),
  requestCount: 0,
  errorCount: 0,
  lastError: null,
  generatedQRCodes: 0,
  batchJobs: new Map(),
  formatStats: {
    png: 0,
    svg: 0,
    ascii: 0,
  },
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

/* ===== QR CODE GENERATION LOGIC ===== */

// QR Code Generator using the real 'qrcode' library
class QRCodeGenerator {
  static async generatePNG(data, options = {}) {
    const {
      size = 200,
      errorCorrectionLevel = "M",
      margin = 4,
      color = { dark: "#000000", light: "#FFFFFF" },
    } = options;

    try {
      const qrOptions = {
        errorCorrectionLevel,
        type: "image/png",
        quality: 0.92,
        margin,
        color,
        width: size,
      };

      const dataUrl = await QRCode.toDataURL(data, qrOptions);

      return {
        format: "png",
        size: size,
        data: dataUrl,
        options: qrOptions,
      };
    } catch (error) {
      throw new Error(`PNG generation failed: ${error.message}`);
    }
  }

  static async generateSVG(data, options = {}) {
    const {
      size = 200,
      errorCorrectionLevel = "M",
      margin = 4,
      color = { dark: "#000000", light: "#FFFFFF" },
    } = options;

    try {
      const qrOptions = {
        errorCorrectionLevel,
        type: "svg",
        margin,
        color,
        width: size,
      };

      const svgString = await QRCode.toString(data, qrOptions);

      return {
        format: "svg",
        size: size,
        data: svgString,
        options: qrOptions,
      };
    } catch (error) {
      throw new Error(`SVG generation failed: ${error.message}`);
    }
  }

  static async generateASCII(data, options = {}) {
    const { errorCorrectionLevel = "M", margin = 2 } = options;

    try {
      const qrOptions = {
        errorCorrectionLevel,
        type: "terminal",
        margin,
        small: true,
      };

      const asciiString = await QRCode.toString(data, qrOptions);

      // Get actual size from the ASCII output
      const lines = asciiString.split("\n").filter((line) => line.trim() !== "");
      const size = lines.length;

      return {
        format: "ascii",
        size: size,
        data: asciiString,
        options: qrOptions,
      };
    } catch (error) {
      throw new Error(`ASCII generation failed: ${error.message}`);
    }
  }

  static async generateQRCode(data, format, options = {}) {
    switch (format.toLowerCase()) {
      case "png":
        return await this.generatePNG(data, options);
      case "svg":
        return await this.generateSVG(data, options);
      case "ascii":
        return await this.generateASCII(data, options);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  static validateQRData(data) {
    if (!data || typeof data !== "string") {
      return { valid: false, error: "Data must be a non-empty string" };
    }

    if (data.length > CONFIG.maxDataLength) {
      return {
        valid: false,
        error: `Data too long. Maximum length is ${CONFIG.maxDataLength} characters`,
      };
    }

    // Additional validations for QR code compatibility
    try {
      // Check if data contains only valid characters for QR codes
      const encoder = new TextEncoder();
      const bytes = encoder.encode(data);

      if (bytes.length > CONFIG.maxDataLength) {
        return {
          valid: false,
          error: `Data too long when encoded. Maximum is ${CONFIG.maxDataLength} bytes`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid data encoding: ${error.message}`,
      };
    }
  }

  static analyzeData(data) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);

    const analysis = {
      length: data.length,
      byteLength: bytes.length,
      type: "text",
      encoding: "UTF-8",
      estimatedModules: this.estimateQRSize(data),
      dataCapacity: this.getDataCapacity(data.length),
    };

    // Detect data type
    if (/^https?:\/\//.test(data)) {
      analysis.type = "url";
      analysis.category = "web";
    } else if (/^mailto:/.test(data)) {
      analysis.type = "email";
      analysis.category = "contact";
    } else if (/^tel:/.test(data)) {
      analysis.type = "phone";
      analysis.category = "contact";
    } else if (/^wifi:/i.test(data)) {
      analysis.type = "wifi";
      analysis.category = "network";
    } else if (data.includes("BEGIN:VCARD")) {
      analysis.type = "vcard";
      analysis.category = "contact";
    } else if (/^geo:/.test(data)) {
      analysis.type = "location";
      analysis.category = "location";
    } else if (/^sms:/.test(data)) {
      analysis.type = "sms";
      analysis.category = "communication";
    } else if (/^\d+$/.test(data)) {
      analysis.type = "numeric";
      analysis.category = "data";
    } else {
      analysis.category = "text";
    }

    return analysis;
  }

  static estimateQRSize(data) {
    // Rough estimation of QR code modules based on data length
    // Real calculation would depend on encoding mode and error correction
    const length = data.length;
    if (length <= 25) return 21; // Version 1
    if (length <= 47) return 25; // Version 2
    if (length <= 77) return 29; // Version 3
    if (length <= 114) return 33; // Version 4
    if (length <= 154) return 37; // Version 5
    if (length <= 195) return 41; // Version 6
    if (length <= 224) return 45; // Version 7
    if (length <= 279) return 49; // Version 8
    if (length <= 335) return 53; // Version 9
    if (length <= 395) return 57; // Version 10
    return Math.min(177, 21 + Math.ceil(length / 50) * 4); // Estimate for higher versions
  }

  static getDataCapacity(dataLength) {
    const percentage = (dataLength / CONFIG.maxDataLength) * 100;
    if (percentage < 25) return "low";
    if (percentage < 50) return "medium";
    if (percentage < 75) return "high";
    return "maximum";
  }
}

/* ===== STANDARD ENDPOINTS ===== */

// PING endpoint
app.get("/api/ping", (req, res) => {
  res.json({
    message: "pong",
    timestamp: new Date().toISOString(),
    service: CONFIG.serviceName,
  });
});

// HEALTH endpoint
app.get("/api/health", (req, res) => {
  const uptime = Date.now() - STATE.startTime.getTime();
  const status = STATE.errorCount > 10 ? "degraded" : "ok";

  res.json({
    status,
    uptime: Math.floor(uptime / 1000),
    timestamp: new Date().toISOString(),
    service: CONFIG.serviceName,
    version: CONFIG.version,
  });
});

// STATUS endpoint
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
      generatedQRCodes: STATE.generatedQRCodes,
      activeBatchJobs: STATE.batchJobs.size,
      formatStats: STATE.formatStats,
      errorRate: STATE.requestCount > 0 ? ((STATE.errorCount / STATE.requestCount) * 100).toFixed(2) + "%" : "0%",
    },
    lastError: STATE.lastError,
    timestamp: new Date().toISOString(),
  });
});

// CAPABILITIES endpoint
app.get("/api/capabilities", (req, res) => {
  const endpoints = listEndpoints(app);
  const endpointStrings = endpoints.map((ep) => `${ep.method} ${ep.path}`);

  res.json({
    service: CONFIG.serviceName,
    version: CONFIG.version,
    features: [
      "qr-code-generation",
      "multiple-formats",
      "size-customization",
      "error-correction",
      "batch-processing",
      "data-validation",
      "format-conversion",
    ],
    endpoints: endpointStrings,
    supportedFormats: CONFIG.supportedFormats,
    errorCorrectionLevels: CONFIG.errorCorrectionLevels,
    limits: {
      maxDataLength: CONFIG.maxDataLength,
      maxSize: CONFIG.maxSize,
      minSize: CONFIG.minSize,
      maxBatchSize: CONFIG.maxBatchSize,
    },
    timestamp: new Date().toISOString(),
  });
});

// CONFIG endpoints
app.get("/api/config", (req, res) => {
  res.json({
    config: CONFIG,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/config", (req, res) => {
  const updates = req.body || {};
  const allowedKeys = ["enableDiagnostics", "defaultSize", "maxBatchSize"];
  const updated = [];
  const errors = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unknown config key: ${key}`);
      continue;
    }

    // Validate specific configs
    if (key === "defaultSize" && (value < CONFIG.minSize || value > CONFIG.maxSize)) {
      errors.push(`defaultSize must be between ${CONFIG.minSize} and ${CONFIG.maxSize}`);
      continue;
    }

    if (key === "maxBatchSize" && (value < 1 || value > 1000)) {
      errors.push("maxBatchSize must be between 1 and 1000");
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

// OPENAPI endpoint
app.get("/api/openapi", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json({
    openapi: "3.0.0",
    info: {
      title: CONFIG.serviceName,
      version: CONFIG.version,
      description: "QR Code Generator Service with multiple formats and customization options",
    },
    basePath: "/api",
    endpoints: endpoints,
    timestamp: new Date().toISOString(),
  });
});

/* ===== QR CODE SERVICE ENDPOINTS ===== */

// GENERATE endpoint - Generate single QR code
app.post("/api/generate", async (req, res) => {
  try {
    const {
      data,
      format = "png",
      size = CONFIG.defaultSize,
      errorCorrection = "M",
      margin = 4,
      color = { dark: "#000000", light: "#FFFFFF" },
    } = req.body || {};

    // Validate input
    if (!data) {
      return res.status(400).json({
        error: "Missing required field: data",
        example: { data: "Hello World", format: "png", size: 200 },
      });
    }

    const validation = QRCodeGenerator.validateQRData(data);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (!CONFIG.supportedFormats.includes(format)) {
      return res.status(400).json({
        error: `Unsupported format: ${format}`,
        supportedFormats: CONFIG.supportedFormats,
      });
    }

    if (size < CONFIG.minSize || size > CONFIG.maxSize) {
      return res.status(400).json({
        error: `Size must be between ${CONFIG.minSize} and ${CONFIG.maxSize}`,
      });
    }

    if (!CONFIG.errorCorrectionLevels.includes(errorCorrection)) {
      return res.status(400).json({
        error: `Invalid error correction level: ${errorCorrection}`,
        supportedLevels: CONFIG.errorCorrectionLevels,
      });
    }

    // Generate QR code using the real qrcode library
    const options = {
      size,
      errorCorrectionLevel: errorCorrection,
      margin,
      color,
    };

    const qrCode = await QRCodeGenerator.generateQRCode(data, format, options);

    // Update stats
    STATE.generatedQRCodes++;
    STATE.formatStats[format]++;

    // Analyze data
    const analysis = QRCodeGenerator.analyzeData(data);

    res.json({
      qrCode,
      input: {
        data: data.length > 100 ? data.substring(0, 100) + "..." : data,
        format,
        size,
        errorCorrection,
        margin,
        color,
      },
      analysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("QR generation error:", error);
    res.status(500).json({
      error: "QR code generation failed",
      details: error.message,
    });
  }
});

// BATCH endpoint - Generate multiple QR codes
app.post("/api/batch", async (req, res) => {
  try {
    const {
      items = [],
      format = "png",
      size = CONFIG.defaultSize,
      errorCorrection = "M",
      margin = 4,
      color = { dark: "#000000", light: "#FFFFFF" },
    } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Missing required field: items (array)",
        example: {
          items: [
            { data: "Hello World", id: "qr1" },
            { data: "https://example.com", id: "qr2" },
          ],
        },
      });
    }

    if (items.length > CONFIG.maxBatchSize) {
      return res.status(400).json({
        error: `Batch size too large. Maximum is ${CONFIG.maxBatchSize} items`,
      });
    }

    // Create batch job
    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      status: "processing",
      items: items.length,
      completed: 0,
      results: [],
      errors: [],
      startTime: new Date(),
      format,
      size,
      errorCorrection,
      margin,
      color,
    };

    STATE.batchJobs.set(jobId, job);

    // Process items asynchronously
    const options = {
      size,
      errorCorrectionLevel: errorCorrection,
      margin,
      color,
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        const validation = QRCodeGenerator.validateQRData(item.data);
        if (!validation.valid) {
          job.errors.push({
            index: i,
            id: item.id,
            error: validation.error,
          });
          continue;
        }

        const qrCode = await QRCodeGenerator.generateQRCode(item.data, format, options);

        job.results.push({
          index: i,
          id: item.id,
          qrCode,
          analysis: QRCodeGenerator.analyzeData(item.data),
        });

        job.completed++;
        STATE.generatedQRCodes++;
        STATE.formatStats[format]++;
      } catch (error) {
        console.error(`Batch item ${i} error:`, error);
        job.errors.push({
          index: i,
          id: item.id,
          error: error.message,
        });
      }
    }

    job.status = "completed";
    job.endTime = new Date();
    job.duration = job.endTime - job.startTime;

    res.json({
      jobId,
      status: job.status,
      summary: {
        total: job.items,
        completed: job.completed,
        errors: job.errors.length,
        duration: job.duration + "ms",
      },
      results: job.results,
      errors: job.errors,
      completedAt: job.endTime.toISOString(),
    });
  } catch (error) {
    console.error("Batch generation error:", error);
    res.status(500).json({
      error: "Batch generation failed",
      details: error.message,
    });
  }
});

// BATCH STATUS endpoint - Check batch job status
app.get("/api/batch/:jobId", (req, res) => {
  const { jobId } = req.params;

  const job = STATE.batchJobs.get(jobId);
  if (!job) {
    return res.status(404).json({
      error: "Batch job not found",
      jobId,
    });
  }

  res.json({
    jobId,
    status: job.status,
    summary: {
      total: job.items,
      completed: job.completed,
      errors: job.errors.length,
      progress: ((job.completed / job.items) * 100).toFixed(1) + "%",
    },
    startTime: job.startTime.toISOString(),
    endTime: job.endTime ? job.endTime.toISOString() : null,
    duration: job.duration ? job.duration + "ms" : null,
  });
});

// VALIDATE endpoint - Validate QR code data and analyze
app.post("/api/validate", (req, res) => {
  try {
    const { data } = req.body || {};

    if (!data) {
      return res.status(400).json({
        error: "Missing required field: data",
      });
    }

    const validation = QRCodeGenerator.validateQRData(data);
    const analysis = QRCodeGenerator.analyzeData(data);

    res.json({
      validation,
      analysis,
      recommendations: {
        optimalErrorCorrection: data.length > 1000 ? "H" : "M",
        estimatedSizes: {
          small: Math.max(CONFIG.minSize, analysis.estimatedSize * 3),
          medium: Math.max(CONFIG.defaultSize, analysis.estimatedSize * 5),
          large: Math.min(CONFIG.maxSize, analysis.estimatedSize * 8),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Validation failed",
      details: error.message,
    });
  }
});

// FORMATS endpoint - Get supported formats and their capabilities
app.get("/api/formats", (req, res) => {
  res.json({
    supportedFormats: CONFIG.supportedFormats,
    formatDetails: {
      png: {
        description: "Portable Network Graphics - bitmap image format",
        features: ["transparency", "lossless", "web-compatible", "high-quality"],
        useCases: ["web", "print", "mobile apps", "documents"],
        outputType: "base64 data URL",
        library: "qrcode package",
        customizable: ["size", "margin", "colors", "error correction"],
      },
      svg: {
        description: "Scalable Vector Graphics - vector image format",
        features: ["scalable", "small-size", "xml-based", "infinite-resolution"],
        useCases: ["web", "print", "logos", "responsive design"],
        outputType: "SVG markup",
        library: "qrcode package",
        customizable: ["size", "margin", "colors", "error correction"],
      },
      ascii: {
        description: "ASCII art representation using Unicode characters",
        features: ["text-based", "terminal-friendly", "no-dependencies", "monospace"],
        useCases: ["console", "email", "documentation", "terminal apps"],
        outputType: "plain text",
        library: "qrcode package",
        customizable: ["margin", "error correction"],
      },
    },
    errorCorrectionLevels: {
      L: { description: "Low - ~7% error recovery", dataCapacity: "high" },
      M: { description: "Medium - ~15% error recovery", dataCapacity: "medium-high" },
      Q: { description: "Quartile - ~25% error recovery", dataCapacity: "medium" },
      H: { description: "High - ~30% error recovery", dataCapacity: "low" },
    },
    sizeConstraints: {
      minimum: CONFIG.minSize,
      maximum: CONFIG.maxSize,
      default: CONFIG.defaultSize,
      recommended: {
        mobile: 150,
        web: 200,
        print: 300,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// GENERATE with GET for simple cases
app.get("/api/generate", async (req, res) => {
  const { data, format = "svg", size = CONFIG.defaultSize, errorCorrection = "M", margin = "4" } = req.query;

  if (!data) {
    return res.status(400).json({
      error: "Missing required parameter: data",
      example: "/api/generate?data=Hello%20World&format=svg&size=200",
    });
  }

  try {
    // Convert query params to proper types
    const parsedSize = parseInt(size);
    const parsedMargin = parseInt(margin);

    // Validate parameters
    if (isNaN(parsedSize) || parsedSize < CONFIG.minSize || parsedSize > CONFIG.maxSize) {
      return res.status(400).json({
        error: `Size must be a number between ${CONFIG.minSize} and ${CONFIG.maxSize}`,
      });
    }

    if (!CONFIG.supportedFormats.includes(format)) {
      return res.status(400).json({
        error: `Unsupported format: ${format}`,
        supportedFormats: CONFIG.supportedFormats,
      });
    }

    const validation = QRCodeGenerator.validateQRData(data);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const options = {
      size: parsedSize,
      errorCorrectionLevel: errorCorrection,
      margin: parsedMargin,
      color: { dark: "#000000", light: "#FFFFFF" },
    };

    const qrCode = await QRCodeGenerator.generateQRCode(data, format, options);
    const analysis = QRCodeGenerator.analyzeData(data);

    // Update stats
    STATE.generatedQRCodes++;
    STATE.formatStats[format]++;

    res.json({
      qrCode,
      input: {
        data: data.length > 100 ? data.substring(0, 100) + "..." : data,
        format,
        size: parsedSize,
        errorCorrection,
        margin: parsedMargin,
      },
      analysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET QR generation error:", error);
    res.status(500).json({
      error: "QR code generation failed",
      details: error.message,
    });
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

        // Add descriptions for endpoints
        if (path === "/api/generate" && upperMethod === "POST") {
          description = "Generate single QR code";
        } else if (path === "/api/generate" && upperMethod === "GET") {
          description = "Generate QR code (simple)";
        } else if (path === "/api/batch" && upperMethod === "POST") {
          description = "Generate multiple QR codes";
        } else if (path === "/api/validate") {
          description = "Validate QR data";
        } else if (path === "/api/formats") {
          description = "Get format information";
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

// Cleanup old batch jobs periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [jobId, job] of STATE.batchJobs.entries()) {
    if (now - job.startTime.getTime() > maxAge) {
      STATE.batchJobs.delete(jobId);
    }
  }
}, 60 * 60 * 1000); // Check hourly

/* ===== SERVER STARTUP ===== */

app.listen(PORT, () => {
  console.log(`🚀 ${CONFIG.serviceName} v${CONFIG.version} running on port ${PORT}`);
  console.log(`📊 Visit http://localhost:${PORT}/api/status for service status`);
  console.log(`🏥 Visit http://localhost:${PORT}/api/health for health check`);
  console.log(`📖 Visit http://localhost:${PORT}/api/openapi for API documentation`);
  console.log(`📱 Visit http://localhost:${PORT}/ for HTML interface`);
  console.log("");

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
    console.log("QR Code endpoints:");
    customEndpoints.forEach((ep) => {
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(20)} - ${ep.description}`);
    });
    console.log("");
  }

  console.log("📱 QR Code formats:", CONFIG.supportedFormats.join(", "));
  console.log("🔧 Error correction levels:", CONFIG.errorCorrectionLevels.join(", "));
  console.log("📏 Size range:", `${CONFIG.minSize}px - ${CONFIG.maxSize}px`);
  console.log("📦 Using 'qrcode' library for professional QR generation");
  console.log("🎯 Ready to generate QR codes!");
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
