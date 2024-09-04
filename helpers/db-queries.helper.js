const { getCurrentDateTimeISO } = require("./datetime.helpers");
const { logTrace } = require("./logger-api");

function setEntitiesInactive(db, tableName, query) {
  const callback = (item) => (item._inactive = true);
  const resultsCallback = (r) => {
    logTrace("SOFT_DELETE: soft deleted (set inactive):", { itemsCount: r.length, tableName, query });
  };

  invokeQuery(db, tableName, query, callback, resultsCallback);
}

function replaceRelatedContactsInDb(db, targetResourceId, resource) {
  logTrace("UPDATE: updating related contacts in db:", { targetResourceId, resource });
  const query = { id: targetResourceId };
  const resultsCallback = (r) => {
    logTrace("UPDATE: related contacts:", { query });
  };

  invokeOverwriteQuery(db, "contacts", query, resource, resultsCallback);
}

function updateMessageCheckTimeInDb(db, userId, resource, contactId) {
  logTrace("UPDATE: updating MessageCheckTime in db:", { userId, resource });
  const query = { user_id: userId };

  const results = invokeGetQuery(db, "message-check", query);

  if (results.length > 0) {
    const callback = (item) => (
      (item.last_check = getCurrentDateTimeISO()),
      item.last_checks === undefined ? (item.last_checks = {}) : (item.last_checks = item.last_checks),
      (item.last_checks[contactId] = getCurrentDateTimeISO())
    );
    invokeQuery(db, "message-check", query, callback);
  } else {
    invokeInsertQuery(db, "message-check", query, resource);
  }
}

function invokeGetQuery(db, tableName, query) {
  logTrace("INVOKE_QUERY: invoking GET query:", { tableName, query });
  return db.get(tableName).filter(query).value();
}

function invokeQuery(db, tableName, query, callback, resultsCallback = (r) => {}) {
  logTrace("INVOKE_QUERY: invoking query:", { tableName, query });
  db.get(tableName).filter(query).each(callback).write().then(resultsCallback);
}

function invokeOverwriteQuery(db, tableName, query, obj, resultsCallback = (r) => {}) {
  logTrace("INVOKE_QUERY: invoking Overwrite query:", { tableName, query, obj });
  db.get(tableName).remove(query).write().then(resultsCallback);
  db.get(tableName).push(obj).write().then(resultsCallback);
}

function invokeInsertQuery(db, tableName, query, obj, resultsCallback = (r) => {}) {
  logTrace("INVOKE_QUERY: invoking Insert query:", { tableName, query, obj });
  db.get(tableName).push(obj).write().then(resultsCallback);
}

module.exports = {
  setEntitiesInactive,
  replaceRelatedContactsInDb,
  updateMessageCheckTimeInDb,
  invokeGetQuery,
};
