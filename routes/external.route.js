const { formatErrorResponse } = require("../helpers/helpers");
const { logError, logDebug } = require("../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_SERVICE_UNAVAILABLE } = require("../helpers/response.helpers");
const express = require("express");
const http = require("http");
const https = require("https");

const router = express.Router();

// Service configuration - easily extensible via environment variables
const getServiceUrl = (serviceName) => {
  // Convert service name to environment variable format
  const envVar = `EXTERNAL_SERVICE_${serviceName.toUpperCase()}_URL`;

  // Check for service-specific URL
  const serviceUrl = process.env[envVar];

  if (serviceUrl) {
    return serviceUrl;
  }

  // Default services - always available (use lowercase keys for lookups)
  const defaultServices = {
    templateservice: "http://localhost:3111",
    minitemplate: process.env.MINI_TEMPLATE_URL || "http://localhost:3113",
    hasher: "http://localhost:3112",
  };

  const key = String(serviceName || "").toLowerCase();

  // Check for default service
  if (defaultServices[key]) {
    return defaultServices[key];
  }

  // Fallback for backward compatibility
  if (key === "default") {
    return process.env.MINI_TEMPLATE_URL || "http://localhost:3111";
  }

  return null;
};

// Check if a service needs /api prefix in the target path
const serviceNeedsApiPrefix = (serviceName) => {
  const key = String(serviceName || "").toLowerCase();
  const servicesNeedingApi = ["templateservice", "minitemplate", "hasher", "default"]; // treat default (MiniTemplate) as needing /api
  return servicesNeedingApi.includes(key);
};

// Get all available services from environment variables and defaults
const getAvailableServices = () => {
  const services = {};

  // Default services - always available
  const defaultServices = {
    templateservice: {
      url: "http://localhost:3111",
      name: "TemplateService",
      description: "External service template with standard endpoints",
      default: true,
    },
    miniTemplate: {
      url: "http://localhost:3113",
      name: "MiniTemplate",
      description: "Template rendering and job processing service",
      default: true,
    },
    hasher: {
      url: "http://localhost:3112",
      name: "Hasher",
      description: "Data hashing service",
      default: true,
    },
    uuidGenerator: {
      url: "http://localhost:3114",
      name: "UUID Generator",
      description: "Generates unique identifiers (UUIDs) in various formats",
      default: true,
    },
  };

  // Add default services
  Object.entries(defaultServices).forEach(([name, config]) => {
    services[name] = {
      ...config,
      configured: true,
      type: "default",
    };
  });

  return services;
};

// Proxy function to forward requests to external services
const proxyToService = (serviceUrl, targetPath, req, res) => {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(serviceUrl);
      // Prepare headers, avoid forwarding problematic ones and recompute content-length if we send our own body
      const headers = { ...req.headers };
      // Let Node set Host header automatically for the target
      delete headers.host;
      delete headers["content-length"]; // will be set later if we provide a payload

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: targetPath,
        method: req.method,
        headers,
      };

      // Choose http or https based on the URL
      const client = url.protocol === "https:" ? https : http;

      const proxyReq = client.request(options, (proxyRes) => {
        // Copy status code and headers
        res.status(proxyRes.statusCode);

        // Copy headers
        Object.keys(proxyRes.headers).forEach((key) => {
          res.setHeader(key, proxyRes.headers[key]);
        });

        // Pipe the response body
        proxyRes.pipe(res);

        // Resolve when response is complete
        proxyRes.on("end", () => resolve());
      });

      proxyReq.on("error", (err) => {
        reject(err);
      });

      proxyReq.on("timeout", () => {
        proxyReq.destroy();
        reject(new Error("Request timeout"));
      });

      // Set timeout
      proxyReq.setTimeout(30000); // 30 second timeout

      // Forward body correctly even when body-parser has already consumed the stream
      const method = (req.method || "GET").toUpperCase();
      const canHaveBody = !["GET", "HEAD"].includes(method);

      if (canHaveBody) {
        let payload = null;

        // If body-parser populated req.body, prefer that
        if (req.body !== undefined) {
          const contentType = (req.headers["content-type"] || "").toLowerCase();
          if (typeof req.body === "string") {
            payload = req.body;
          } else if (contentType.includes("application/x-www-form-urlencoded")) {
            payload = new URLSearchParams(req.body).toString();
          } else {
            // default to JSON
            payload = JSON.stringify(req.body);
            options.headers["content-type"] = options.headers["content-type"] || "application/json";
          }
        }

        // If we couldn't build payload from req.body, try to pipe the raw stream
        if (payload === null) {
          req.pipe(proxyReq);
        } else {
          options.headers["content-length"] = Buffer.byteLength(payload).toString();
          proxyReq.setHeader("content-length", options.headers["content-length"]);
          proxyReq.write(payload);
          proxyReq.end();
        }
      } else {
        proxyReq.end();
      }
    } catch (error) {
      reject(error);
    }
  });
};

// List available services: /api/external/list
router.get("/list", (req, res) => {
  try {
    const services = getAvailableServices();
    const serviceList = Object.entries(services).map(([name, config]) => ({
      name,
      displayName: config.name,
      url: config.url,
      description: config.description,
      type: config.type || "custom",
      configured: config.configured,
      default: config.default || false,
    }));

    // Group services by type
    const defaultServices = serviceList.filter((s) => s.default);
    const customServices = serviceList.filter((s) => !s.default);

    res.json({
      services: serviceList,
      defaultServices,
      customServices,
      totalServices: serviceList.length,
      message: "Available external services",
      instructions: {
        usage: "Use /api/external/{serviceName}/{endpoint} to access services",
        examples: ["/api/external/miniTemplate/jobs", "/api/external/hasher/hash"],
        addService: "Set EXTERNAL_SERVICE_{NAME}_URL=https://api.example.com",
      },
    });
  } catch (error) {
    logError("Error listing external services", { error: error.message });
    res.status(HTTP_SERVICE_UNAVAILABLE).json(formatErrorResponse("Failed to list external services"));
  }
});

// Route to specific service: /api/external/{serviceName}/{endpoint}
router.use("/:serviceName/:endpoint(*)", async (req, res) => {
  let requestedService = "";
  try {
    const { serviceName, endpoint } = req.params;
    let targetPath = "/" + endpoint;
    requestedService = serviceName;

    // Add /api prefix for services that need it
    if (serviceNeedsApiPrefix(serviceName) && !targetPath.startsWith("/api")) {
      targetPath = "/api" + targetPath;
    }

    logDebug("External service request", {
      serviceName,
      endpoint,
      targetPath,
      method: req.method,
      originalUrl: req.originalUrl,
    });

    // Get service URL
    const serviceUrl = getServiceUrl(serviceName);

    if (!serviceUrl) {
      return res
        .status(HTTP_NOT_FOUND)
        .json(
          formatErrorResponse(
            `External service '${serviceName}' not configured. Set EXTERNAL_SERVICE_${serviceName.toUpperCase()}_URL environment variable.`
          )
        );
    }

    // Proxy the request
    await proxyToService(serviceUrl, targetPath, req, res);
  } catch (error) {
    logError("Error in external service proxy", {
      error: error.message,
      stack: error.stack,
      serviceName: req.params.serviceName,
      endpoint: req.params.endpoint,
    });

    // If headers already sent, can't send error response
    if (res.headersSent) {
      return;
    }

    res
      .status(HTTP_SERVICE_UNAVAILABLE)
      .json(formatErrorResponse(`Failed to proxy request to external service ${requestedService}`));
  }
});

// Route to default service: /api/external/{endpoint}
router.use("/:endpoint(*)", async (req, res) => {
  try {
    const { endpoint } = req.params;
    let targetPath = "/" + endpoint;

    // Add /api prefix for default service (miniTemplate)
    if (serviceNeedsApiPrefix("default") && !targetPath.startsWith("/api")) {
      targetPath = "/api" + targetPath;
    }

    logDebug("Default external service request", {
      endpoint,
      targetPath,
      method: req.method,
      originalUrl: req.originalUrl,
    });

    // Get default service URL (miniTemplate)
    const serviceUrl = getServiceUrl("default");

    if (!serviceUrl) {
      return res
        .status(HTTP_NOT_FOUND)
        .json(
          formatErrorResponse(
            "No default external service configured. Set MINI_TEMPLATE_URL or EXTERNAL_SERVICE_MINITEMPLATE_URL environment variable."
          )
        );
    }

    // Proxy the request
    await proxyToService(serviceUrl, targetPath, req, res);
  } catch (error) {
    logError("Error in default external service proxy", {
      error: error.message,
      stack: error.stack,
      endpoint: req.params.endpoint,
    });

    // If headers already sent, can't send error response
    if (res.headersSent) {
      return;
    }

    res
      .status(HTTP_SERVICE_UNAVAILABLE)
      .json(formatErrorResponse("Failed to proxy request to default external service"));
  }
});

exports.externalRoutes = router;
