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

  if (getConfigValue(ConfigKeys.DIAGNOSTICS_ENABLED) === true) {
    const urlEnds = req.url.replace(/\/\/+/g, "/");

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

  next();
};

exports.diagnosticRoutes = diagnosticRoutes;
