const { configInstance } = require("../config/config-manager");
const { formatErrorResponse } = require("../helpers/helpers");
const { logError } = require("../helpers/logger-api");
const { HTTP_OK, HTTP_INTERNAL_SERVER_ERROR } = require("../helpers/response.helpers");
const app = require("../app.json");

const healthCheckRoutes = (req, res, next) => {
  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    if (req.method === "GET" && urlEnds.includes("api/about")) {
      res.status(HTTP_OK).json({ app });
      return;
    }
    if (req.method === "GET" && urlEnds.includes("api/ping")) {
      res.status(HTTP_OK).json({ status: "pong" });
      return;
    }
    if (req.method === "GET" && urlEnds.includes("api/healthcheck")) {
      configInstance.fullSelfCheck();
      res.status(HTTP_OK).json({ status: "ok" });
      return;
    }

    if (res.headersSent !== true) {
      next();
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

exports.healthCheckRoutes = healthCheckRoutes;
