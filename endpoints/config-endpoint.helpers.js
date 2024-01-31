const {
  getConfigValue,
  resetConfig,
  setConfigValue,
  configInstance,
  getBugConfigValue,
  setBugConfigValue,
  getFeatureFlagConfigValue,
  setFeatureFlagConfigValue,
} = require("../config/config-manager");
const { isUndefined } = require("../helpers/compare.helpers");
const { visitsData } = require("../helpers/db.helpers");
const { logDebug, logTrace } = require("../helpers/logger-api");
const { HTTP_OK, HTTP_UNPROCESSABLE_ENTITY } = require("../helpers/response.helpers");

function handleConfig(req, res) {
  if (req.url.includes("api/config/bugs")) {
    handleGenericConfig(
      req,
      res,
      "api/config/bugs",
      getBugConfigValue,
      setBugConfigValue,
      configInstance.bugConfigCopy
    );
  } else if (req.url.includes("api/config/features")) {
    handleGenericConfig(
      req,
      res,
      "api/config/features",
      getFeatureFlagConfigValue,
      setFeatureFlagConfigValue,
      configInstance.featureFlagConfigCopy
    );
  } else if (req.url.includes("api/config/all")) {
    handleGenericConfig(req, res, "api/config/all", getConfigValue, setConfigValue, configInstance);
  } else if (req.method === "GET" && req.url.includes("api/config/reset")) {
    resetConfig();
    res.status(HTTP_OK).json({});
  } else if (req.method === "POST" && req.url.includes("api/config/checkfeature")) {
    const featureName = req.body.name;
    const featureEnabled = getFeatureFlagConfigValue(featureName) ?? false;
    res.status(HTTP_OK).json({ name: featureName, enabled: featureEnabled });
  }
  return;
}

function handleGenericConfig(req, res, endpoint, getConfigValue, setConfigValue, config) {
  if (req.method === "GET" && req.url.endsWith(endpoint)) {
    res.status(HTTP_OK).json({ config: config });
  } else if (req.method === "POST" && req.url.endsWith(endpoint)) {
    const invalidKeys = [];

    // check if key is correct:
    for (const key in req.body) {
      const currentValue = getConfigValue(key);
      if (isUndefined(currentValue)) {
        invalidKeys.push(key);
      }
    }

    // if all keys are correct - set values; otherwise - return error
    if (invalidKeys.length > 0) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json({ invalidKeys });
    } else {
      for (const key in req.body) {
        const currentValue = getConfigValue(key);
        logDebug(`Setting "${key}": from "${currentValue}" to "${req.body[key]}"`);
        setConfigValue(key, req.body[key]);

        if (key.toLowerCase().includes("randomvisitsfor")) {
          visitsData.generateVisits();
          logTrace("handleGenericConfig: regenerated random visits");
        }
      }
      res.status(HTTP_OK).json({});
    }
  }
  return;
}

module.exports = {
  handleConfig,
};
