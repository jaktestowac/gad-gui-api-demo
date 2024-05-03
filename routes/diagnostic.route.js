const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const { HTTP_OK } = require("../helpers/response.helpers");
const { TimeHistogramReporterJson, TimeHistogramReporterHtml } = require("../helpers/time-histogram/time-histogram");
const { TimeHistogramManager } = require("../helpers/time-histogram/time-histogram.manager");

const diagnosticRoutes = (req, res, next) => {
  function afterFinishResponse() {
    const timeHistogramManager = TimeHistogramManager.getInstance();
    timeHistogramManager.stopAction(`${req.method} ${req.url}`);
  }

  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && urlEnds.includes("api/diagnostic/request/histogram")) {
    const timeHistogramManager = TimeHistogramManager.getInstance();
    const histogram = new TimeHistogramReporterJson(timeHistogramManager.getActionsTimeHistogram()).getReport();
    res.status(HTTP_OK).json(histogram);
    return;
  } else if (req.method === "GET" && urlEnds.includes("diagnostic/request/histogram")) {
    const timeHistogramManager = TimeHistogramManager.getInstance();
    const histogram = new TimeHistogramReporterHtml(timeHistogramManager.getActionsTimeHistogram()).getReport();
    res.send(histogram);
    return;
  }
  if (getConfigValue(ConfigKeys.DIAGNOSTICS_ENABLED) === true) {
    const timeHistogramManager = TimeHistogramManager.getInstance();
    timeHistogramManager.startAction(`${req.method} ${req.url}`);

    res.on("finish", afterFinishResponse);
  }

  next();
};

exports.diagnosticRoutes = diagnosticRoutes;
