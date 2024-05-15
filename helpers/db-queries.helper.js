const { logDebug } = require("./logger-api");

function setEntitiesInactive(db, tableName, query) {
  const callback = (item) => (item._inactive = true);
  const resultsCallback = (r) => {
    logDebug("SOFT_DELETE: soft deleted (set inactive):", { commentsCount: r.length, query });
  };

  invokeQuery(db, tableName, query, callback, resultsCallback);
}

function replaceRelatedContactsInDb(db, targetResourceId, resource) {
  logDebug("UPDATE: updating related contacts in db:", { targetResourceId, resource });
  const query = { id: targetResourceId };
  const resultsCallback = (r) => {
    logDebug("UPDATE: related contacts:", { query });
  };

  invokeOverwriteQuery(db, "contacts", query, resource, resultsCallback);
}

function invokeQuery(db, tableName, query, callback, resultsCallback) {
  logDebug("INVOKE_QUERY: invoking query:", { tableName, query });
  db.get(tableName).filter(query).each(callback).write().then(resultsCallback);
}

function invokeOverwriteQuery(db, tableName, query, obj, resultsCallback) {
  logDebug("INVOKE_QUERY: invoking query:", { tableName, query, obj });
  db.get(tableName).remove(query).write().then(resultsCallback);
  db.get(tableName).push(obj).write().then(resultsCallback);
}

module.exports = {
  setEntitiesInactive,
  replaceRelatedContactsInDb,
};
