function logDebug(msg, obj) {
  if (obj === undefined) {
    console.log(`[debug] ${msg}`);
  } else {
    console.log(`[debug] ${msg}`, JSON.stringify(obj));
  }
}

module.exports = {
  logDebug,
};
