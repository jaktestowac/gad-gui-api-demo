const { logDebug } = require("./logger-api");

function setEntitiesInactive(db, tableName, query) {
  db.get(tableName)
    .filter(query)
    .each((item) => (item._inactive = true))
    .write()
    .then((r) => {
      logDebug("SOFT_DELETE: soft deleted (set inactive):", { commentsCount: r.length, query });
    });
}

module.exports = {
  setEntitiesInactive,
};
