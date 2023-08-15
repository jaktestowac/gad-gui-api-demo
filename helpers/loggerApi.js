function logDebug(msg, obj) {
  if (obj === undefined) {
    console.log(`[debug] ${msg}`);
  } else {
    console.log(`[debug] ${msg}`, JSON.stringify(obj));
  }
}

function logError(msg, obj) {
  if (obj === undefined) {
    console.log(`[error] ${msg}`);
  } else {
    console.log(`[error] ${msg}`, JSON.stringify(obj));
  }
}

function logWarn(msg, obj) {
  if (obj === undefined) {
    console.log(`[warning] ${msg}`);
  } else {
    console.log(`[warning] ${msg}`, JSON.stringify(obj));
  }
}

module.exports = {
  logDebug,
  logError,
  logWarn,
};
