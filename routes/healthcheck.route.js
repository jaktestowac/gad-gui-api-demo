const { configInstance } = require("../config/config-manager");
const { formatErrorResponse } = require("../helpers/helpers");
const { logError, logTrace } = require("../helpers/logger-api");
const { HTTP_OK, HTTP_INTERNAL_SERVER_ERROR } = require("../helpers/response.helpers");
const app = require("../app.json");

function getMemoryUsage() {
  const memoryUsageMB = {};

  // https://nodejs.org/api/process.html#process_process_memoryusage
  const memoryUsageRaw = process.memoryUsage();
  for (const [key, value] of Object.entries(memoryUsageRaw)) {
    memoryUsageMB[key] = value / 1000000;
  }

  return memoryUsageMB;
}

const healthCheckRoutes = (req, res, next) => {
  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    if (req.method === "GET" && urlEnds.endsWith("api/about")) {
      logTrace("healthCheck:api/about response:", app);
      res.status(HTTP_OK).json({ app });
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/ping")) {
      const response = { status: "pong" };
      logTrace("healthCheck:api/ping response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health")) {
      configInstance.fullSelfCheck();

      const memoryUsageMB = getMemoryUsage();
      const health = {
        uptime: process.uptime(),
        processtime: process.hrtime(),
        timestamp: Date.now(),
        date: new Date(),
        memoryUsageMB,
      };
      const response = { status: "ok", health };
      logTrace("healthCheck:api/health response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/memory")) {
      const memoryUsageMB = getMemoryUsage();
      const response = { status: "ok", ...memoryUsageMB };
      logTrace("healthCheck:api/health/memory response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/uptime")) {
      const health = {
        uptime: process.uptime(),
        processtime: process.hrtime(),
      };

      const response = { status: "ok", ...health };
      logTrace("healthCheck:api/health/uptime response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }

    if (res.headersSent !== true) {
      next();
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      route: "healthCheckRoutes",
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

exports.healthCheckRoutes = healthCheckRoutes;
