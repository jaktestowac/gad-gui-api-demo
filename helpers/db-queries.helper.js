const { logDebug } = require("./logger-api");

function setEntitiesInactive(db, tableName, query) {
  const callback = (item) => (item._inactive = true);
  const resultsCallback = (r) => {
    logDebug("SOFT_DELETE: soft deleted (set inactive):", { commentsCount: r.length, query });
  };

  invokeQuery(db, tableName, query, callback, resultsCallback);
}

function invokeQuery(db, tableName, query, callback, resultsCallback) {
  logDebug("INVOKE_QUERY: invoking query:", { tableName, query });
  db.get(tableName).filter(query).each(callback).write().then(resultsCallback);
}

module.exports = {
  setEntitiesInactive,
};
