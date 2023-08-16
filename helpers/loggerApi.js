const { currentLogLevel, logLevels } = require("../config");

function logDebug(msg, obj) {
  if (currentLogLevel < logLevels.DEBUG) return;

  if (obj === undefined) {
    console.log(`[DEBUG] ${msg}`);
  } else {
    console.log(`[DEBUG] ${msg}`, JSON.stringify(obj));
  }
}

function logTrace(msg, obj) {
  if (currentLogLevel < logLevels.TRACE) return;

  if (obj === undefined) {
    console.log(`[TRACE] ${msg}`);
  } else {
    console.log(`[TRACE] ${msg}`, JSON.stringify(obj));
  }
}

function logError(msg, obj) {
  if (currentLogLevel < logLevels.ERROR) return;

  if (obj === undefined) {
    console.log(`[ERROR] ${msg}`);
  } else {
    console.log(`[ERROR] ${msg}`, JSON.stringify(obj));
  }
}

function logWarn(msg, obj) {
  if (currentLogLevel < logLevels.WARNING) return;

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
