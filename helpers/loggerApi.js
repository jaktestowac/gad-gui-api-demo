const { getConfigValue } = require("../config/configSingleton");
const { ConfigKeys, LogLevels } = require("../config/enums");

function logDebug(msg, obj) {
  if (getConfigValue(ConfigKeys.CURRENT_LOG_LEVEL) < LogLevels.DEBUG) return;

  if (obj === undefined) {
    console.log(`[DEBUG] ${msg}`);
  } else {
    console.log(`[DEBUG] ${msg}`, JSON.stringify(obj));
  }
}

function logTrace(msg, obj) {
  if (getConfigValue(ConfigKeys.CURRENT_LOG_LEVEL) < LogLevels.TRACE) return;

  if (obj === undefined) {
    console.log(`[TRACE] ${msg}`);
  } else {
    console.log(`[TRACE] ${msg}`, JSON.stringify(obj));
  }
}

function logError(msg, obj) {
  if (getConfigValue(ConfigKeys.CURRENT_LOG_LEVEL) < LogLevels.ERROR) return;

  if (obj === undefined) {
    console.log(`[ERROR] ${msg}`);
  } else {
    console.log(`[ERROR] ${msg}`, JSON.stringify(obj));
  }
}

function logWarn(msg, obj) {
  if (getConfigValue(ConfigKeys.CURRENT_LOG_LEVEL) < LogLevels.WARNING) return;

  if (obj === undefined) {
    console.log(`[WARN] ${msg}`);
  } else {
    console.log(`[WARN] ${msg}`, JSON.stringify(obj));
  }
}

module.exports = {
  logDebug,
  logError,
  logWarn,
  logTrace,
};
