const {
  getConfigValue,
  resetConfig,
  setConfigValue,
  configInstance,
  getBugConfigValue,
  setBugConfigValue,
} = require("../config/configManager");
const { logDebug } = require("./loggerApi");
const { HTTP_OK, HTTP_UNPROCESSABLE_ENTITY } = require("./response.helpers");

function handleConfig(req, res) {
  if (req.url.includes("api/config/bugs")) {
    handleGenericConfig(req, res, "api/config/bugs", getBugConfigValue, setBugConfigValue);
  } else if (req.url.includes("api/config")) {
    handleGenericConfig(req, res, "api/config", getConfigValue, setConfigValue);
  }
  return;
}

function handleGenericConfig(req, res, endpoint, getConfigValue, setConfigValue) {
  if (req.method === "GET" && req.url.endsWith(endpoint)) {
    res.status(HTTP_OK).json(configInstance);
  } else if (req.method === "POST" && req.url.endsWith(endpoint)) {
    const invalidKeys = [];

    // check if key is correct:
    for (const key in req.body) {
      const currentValue = getConfigValue(key);
      if (currentValue === undefined) {
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
      }
      res.status(HTTP_OK).json({});
    }
  } else if (req.method === "GET" && req.url.includes(`${endpoint}/reset`)) {
    resetConfig();
    res.status(HTTP_OK).json({});
  }
  return;
}

module.exports = {
  handleConfig,
};
