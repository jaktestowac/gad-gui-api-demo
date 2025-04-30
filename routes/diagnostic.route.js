const { getConfigValue, setConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const { getLogs } = require("../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST } = require("../helpers/response.helpers");
const { TimeHistogramReporterJson, TimeHistogramReporterHtml } = require("../helpers/time-histogram/time-histogram");
const { TimeHistogramManager } = require("../helpers/time-histogram/time-histogram.manager");
const { logDebug } = require("../helpers/logger-api");

const diagnosticRoutes = (req, res, next) => {
  function afterFinishResponse() {
    const timeHistogramManager = TimeHistogramManager.getInstance();
    timeHistogramManager.stopAction(`${req.method} ${req.url}`);
  }
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && urlEnds.includes("api/diagnostic/toggle-diagnostics")) {
    const diagnosticsEnabled = setConfigValue(
      ConfigKeys.DIAGNOSTICS_ENABLED,
      !getConfigValue(ConfigKeys.DIAGNOSTICS_ENABLED)
    );
    const logsEnabled = setConfigValue(ConfigKeys.PUBLIC_LOGS_ENABLED, !getConfigValue(ConfigKeys.PUBLIC_LOGS_ENABLED));
    logDebug("Changing diagnostic logs", { diagnosticsEnabled, logsEnabled });
    res.status(HTTP_OK).json({ diagnosticsEnabled, logsEnabled });
    return;
  }
  if (req.method === "GET" && urlEnds.includes("api/diagnostic/toggle-logs")) {
    const logsEnabled = setConfigValue(ConfigKeys.PUBLIC_LOGS_ENABLED, !getConfigValue(ConfigKeys.PUBLIC_LOGS_ENABLED));
    res.status(HTTP_OK).json({ logsEnabled });
    return;
  }
  if (req.method === "GET" && urlEnds.includes("api/diagnostic/log-level")) {
    const logLevel = getConfigValue(ConfigKeys.CURRENT_LOG_LEVEL);
    res.status(HTTP_OK).json({ logLevel });
    return;
  }
  if (req.method === "POST" && urlEnds.includes("api/diagnostic/log-level")) {
    const level = req.body?.level;
    logDebug("Changing log level", { level });
    if (level) {
      setConfigValue(ConfigKeys.CURRENT_LOG_LEVEL, level);
      res.status(HTTP_OK).json({ level });
    } else {
      res.status(HTTP_BAD_REQUEST).json({ error: "Level not provided" });
    }
    return;
  }
  if (req.method === "GET" && urlEnds.includes("api/logs")) {
    if (getConfigValue(ConfigKeys.PUBLIC_LOGS_ENABLED)) {
      res.status(HTTP_OK).json({ logs: getLogs() });
    } else {
      res.status(HTTP_OK).json({});
    }
    return;
  }
  if (getConfigValue(ConfigKeys.DIAGNOSTICS_ENABLED) === true) {
    if (req.method === "GET" && urlEnds.includes("api/diagnostic/request/histogram")) {
      const timeHistogramManager = TimeHistogramManager.getInstance();
      const timeHistogram = timeHistogramManager.getActionsTimeHistogram();
      const histogram = new TimeHistogramReporterJson(timeHistogram).getReport();
      res.status(HTTP_OK).json(histogram);
      return;
    } else if (req.method === "GET" && urlEnds.includes("diagnostic/request/histogram")) {
      const timeHistogramManager = TimeHistogramManager.getInstance();
      const timeHistogram = timeHistogramManager.getActionsTimeHistogram();
      const histogram = new TimeHistogramReporterHtml(timeHistogram).getReport();
      res.send(histogram);
      return;
    }
    const timeHistogramManager = TimeHistogramManager.getInstance();
    timeHistogramManager.startAction(`${req.method} ${req.url}`);

    res.on("finish", afterFinishResponse);
  }

  if (res.headersSent !== true) {
    next();
  }
};

exports.diagnosticRoutes = diagnosticRoutes;
