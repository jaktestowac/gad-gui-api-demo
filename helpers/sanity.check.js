const { compareDbObjects } = require("./compare.helpers");
const { fullDb, fullBaseDb } = require("./db.helpers");
const { logDebug, logError } = require("./logger-api");

function checkDatabase() {
  logDebug("> Checking database integrity...");

  try {
    const dbData = fullDb();
    const dbBaseData = fullBaseDb();

    const result = compareDbObjects(dbBaseData, dbData);

    result.isOk = result.areEqual === true || (result.areTablesEqual === true && result.isCurrentDbEmpty === true);
    if (result.isOk === true) {
      logDebug("> Database integrity is correct");
    } else {
      logError("> 🔥 DATABASE IS INCORRECT!", result);
    }

    return result;
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      route: "checkDatabase",
      error,
      stack: error.stack,
    });
    return { isOk: false, error: "DataBase is corrupted." };
  }
}

module.exports = { checkDatabase };
