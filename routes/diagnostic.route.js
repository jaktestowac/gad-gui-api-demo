const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const { TimeHistogramManager } = require("../helpers/time-histogram/time-histogram.manager");

const diagnosticRoutes = (req, res, next) => {
  function afterFinishResponse() {
    const timeHistogramManager = TimeHistogramManager.getInstance();
    timeHistogramManager.stopAction(`${req.method} ${req.url}`);
  }

  if (getConfigValue(ConfigKeys.DIAGNOSTICS_ENABLED) === true) {
    const timeHistogramManager = TimeHistogramManager.getInstance();
    timeHistogramManager.startAction(`${req.method} ${req.url}`);

    res.on("finish", afterFinishResponse);
  }

  next();
};

exports.diagnosticRoutes = diagnosticRoutes;
