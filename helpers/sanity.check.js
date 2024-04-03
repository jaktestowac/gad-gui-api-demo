const { compareDbObjects } = require("./compare.helpers");
const { fullDb, fullBaseDb } = require("./db.helpers");
const { logDebug, logError } = require("./logger-api");

function checkDatabase() {
  const dbData = fullDb();
  const dbBaseData = fullBaseDb();

  const result = compareDbObjects(dbBaseData, dbData);

  if (result.areEqual) {
    logDebug("> Database is correct");
  } else {
    logError("> DATABASE IS INCORRECT!", result);
  }
}

module.exports = { checkDatabase };
