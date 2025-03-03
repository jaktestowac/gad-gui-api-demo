const { configInstance } = require("../config/config-manager");
const { formatErrorResponse } = require("../helpers/helpers");
const { logError, logTrace } = require("../helpers/logger-api");
const { HTTP_OK, HTTP_INTERNAL_SERVER_ERROR } = require("../helpers/response.helpers");
const app = require("../app.json");
const { fullDb, countEntities } = require("../helpers/db.helpers");
const { checkDatabase } = require("../helpers/sanity.check");
const { getFeatureFlagConfigValue } = require("../config/config-manager");
const { FeatureFlagConfigKeys } = require("../config/enums");

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
  ok: { status: "OK", description: "Application is running normally.", code: 0 },
  limited: { status: "Limited", description: "Application is running with limited functionality.", code: 1 },
  degraded: { status: "Degraded", description: "Application is degraded but still functional.", code: 2 },
  maintenance: { status: "Maintenance", description: "Application is in maintenance mode.", code: 3 },
  critical: { status: "Critical", description: "Application is in critical condition.", code: 400 },
  down: { status: "Down", description: "Application is down.", code: 500 },
};

const healthCheckRoutes = (req, res, next) => {
  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    if (req.method === "GET" && urlEnds.endsWith("api/about")) {
      logTrace("healthCheck:api/about response:", app);
      res.status(HTTP_OK).json({ ...app });
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/ping")) {
      const response = { response: "pong", status: appStatuses.ok.status };
      logTrace("healthCheck:api/ping response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/configcheck")) {
      let statusObj = appStatuses.ok;
      try {
        configInstance.fullSelfCheck();
      } catch (error) {
        statusObj = appStatuses.down;
      }

      const response = { status: statusObj.status };
      logTrace("healthCheck:api/health response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/dbcheck")) {
      const result = checkDatabase();

      const statusObj = result.isOk ? appStatuses.ok : appStatuses.degraded;

      const response = { status: statusObj.status, result };
      logTrace("healthCheck:api/health dbcheck response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health")) {
      let statusObj = appStatuses.ok;

      const memoryUsageMB = getMemoryUsage();
      const health = {
        timestamp: Date.now(),
        date: new Date(),
        memoryUsageMB,
      };

      const result = checkDatabase();

      let dbStatusObj = appStatuses.ok;
      if (!result.isOk) {
        dbStatusObj = appStatuses.degraded;
      }

      const configProblems = [];
      let configStatusObj = appStatuses.ok;
      try {
        configInstance.fullSelfCheck();
      } catch (error) {
        configStatusObj = appStatuses.critical;
        configProblems.push({ error: "Config check failed. See app logs for details." });
      }

      let backendStatusObj = appStatuses.ok;
      let frontendStatusObj = appStatuses.ok;
      const backendProblems = [];

      if (getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_ONLY_BACKEND)) {
        frontendStatusObj = appStatuses.limited;
        backendProblems.push({ message: "Frontend is disabled by feature flag." });
      }

      const appModules = {
        config: configStatusObj,
        db: dbStatusObj,
        backend: backendStatusObj,
        frontend: frontendStatusObj,
        websocket: appStatuses.ok,
      };

      const response = {
        status: statusObj.status,
        health: { ...getUptime(), ...health },
        dbProblems: result.isOk ? [] : [result],
        configProblems: configProblems,
        backendProblems: backendProblems,
      };

      const highLevelStatus = Object.values(appModules).reduce((acc, curr) => (acc.code > curr.code ? acc : curr)).code;

      response.status = Object.values(appStatuses).find((status) => status.code === highLevelStatus).status;

      logTrace("healthCheck:api/health response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/memory")) {
      const memoryUsageMB = getMemoryUsage();

      const statusObj = appStatuses.ok;

      const response = { status: statusObj.status, ...memoryUsageMB };
      logTrace("healthCheck:api/health/memory response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/uptime")) {
      const uptime = getUptime();

      const statusObj = appStatuses.ok;

      const response = { status: statusObj.status, ...uptime };
      logTrace("healthCheck:api/health/uptime response:", response);
      res.status(HTTP_OK).json(response);
      return;
    }
    if (req.method === "GET" && urlEnds.endsWith("api/health/db")) {
      const db = fullDb();

      const statusObj = appStatuses.ok;

      const response = { status: statusObj.status, entities: countEntities(db) };
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
