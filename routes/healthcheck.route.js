const { configInstance } = require("../config/config-manager");
const { formatErrorResponse } = require("../helpers/helpers");
const { logError, logTrace } = require("../helpers/logger-api");
const { HTTP_OK, HTTP_INTERNAL_SERVER_ERROR } = require("../helpers/response.helpers");
const app = require("../app.json");
const { fullDb, countEntities } = require("../helpers/db.helpers");
const { checkDatabase } = require("../helpers/sanity.check");

function getMemoryUsage() {
  const memoryUsageMB = {};

  // https://nodejs.org/api/process.html#process_process_memoryusage
  const memoryUsageRaw = process.memoryUsage();
  for (const [key, value] of Object.entries(memoryUsageRaw)) {
    memoryUsageMB[key] = value / 1000000;
  }

  return memoryUsageMB;
}

function convertUptime(uptimeInSeconds) {
  let totalMinutes = uptimeInSeconds / 60;
  let totalHours = totalMinutes / 60;
  let totalDays = totalHours / 24;

  return {
    days: totalDays,
    hours: totalHours,
    minutes: totalMinutes,
    seconds: uptimeInSeconds,
  };
}

function getUptime() {
  const uptime = process.uptime();
  const uptimeTotal = convertUptime(uptime);
  const data = {
    uptime,
    uptimeTotal,
    processtime: process.hrtime(),
  };

  return data;
}

const appStatuses = {
  0: "[OK]",
  1: "[Degraded]",
  9: "[Down]",
};

function getAppStatus(statusCode) {
  if (appStatuses[statusCode] === undefined) {
    return "Unknown";
  }

  return appStatuses[statusCode];
}

const healthCheckRoutes = (req, res, next) => {
  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    if (req.method === "GET" && urlEnds.endsWith("api/about")) {
      logTrace("healthCheck:api/about response:", app);
      res.status(HTTP_OK).json({ ...app });
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/ping")) {
      const response = { response: "pong" };
      logTrace("healthCheck:api/ping response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/configcheck")) {
      let statusCode = 0;
      try {
        configInstance.fullSelfCheck();
      } catch (error) {
        statusCode = 9;
      }

      const response = { status: getAppStatus(statusCode) };
      logTrace("healthCheck:api/health response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/dbcheck")) {
      const result = checkDatabase();

      const statusCode = result.isOk ? 0 : 1;

      const response = { status: getAppStatus(statusCode), result };
      logTrace("healthCheck:api/health dbcheck response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health")) {
      let statusCode = 0;

      const memoryUsageMB = getMemoryUsage();
      const health = {
        timestamp: Date.now(),
        date: new Date(),
        memoryUsageMB,
      };

      const result = checkDatabase();

      if (!result.isOk) {
        statusCode = 1;
      }

      const configProblems = [];
      try {
        configInstance.fullSelfCheck();
      } catch (error) {
        statusCode = 9;
        configProblems.push("Config check failed. See app logs for details." + error);
      }

      const response = {
        status: getAppStatus(statusCode),
        health: { ...getUptime(), ...health },
        dbProblems: result.isOk ? [] : result,
        configProblems: configProblems,
      };
      logTrace("healthCheck:api/health response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/memory")) {
      const memoryUsageMB = getMemoryUsage();

      const statusCode = 0;

      const response = { status: getAppStatus(statusCode), ...memoryUsageMB };
      logTrace("healthCheck:api/health/memory response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/uptime")) {
      const uptime = getUptime();

      const statusCode = 0;

      const response = { status: getAppStatus(statusCode), ...uptime };
      logTrace("healthCheck:api/health/uptime response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/db")) {
      const db = fullDb();

      const statusCode = 0;

      const response = { status: getAppStatus(statusCode), entities: countEntities(db) };
      logTrace("healthCheck:api/health/db response:", response);
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
