const fs = require("fs");
const path = require("path");
const { logDebug, logTrace } = require("../../helpers/logger-api");
const { getConfigValue } = require("../../config/config-manager");
const { ConfigKeys } = require("../../config/enums");

function simpleMigrator(currentDbPath, dbBasePath) {
  logDebug("> [simpleMigrator] Verification started");

  const currentDbData = require(currentDbPath);
  const dbBaseData = require(dbBasePath);

  const currentDbDataKeys = Object.keys(currentDbData);
  const dbBaseDataKeys = Object.keys(dbBaseData);

  const newTables = dbBaseDataKeys.filter((key) => !currentDbDataKeys.includes(key));
  const deletedTables = currentDbDataKeys.filter((key) => !dbBaseDataKeys.includes(key));

  const newDb = { ...currentDbData };

  logTrace("> [simpleMigrator] New tables: ", newTables);
  logTrace("> [simpleMigrator] Tables deleted in newer DB version: ", deletedTables);

  // TODO: for now we only add new tables and do not delete old ones
  if (newTables.length === 0) {
    logDebug("> [simpleMigrator] No changes detected");
    return;
  }

  if (newTables.length === 0 && deletedTables.length === 0) {
    logDebug("> [simpleMigrator] No changes detected");
    return;
  }

  logDebug("> [simpleMigrator] Changes detected. Starting migration...");
  logDebug("> [simpleMigrator] New tables: ", newTables);
  // logDebug("> [simpleMigrator] Deleted tables: ", deletedTables);

  newTables.forEach((table) => {
    newDb[table] = dbBaseData[table];
  });

  // deletedTables.forEach((table) => {
  //   delete newDb[table];
  // });

  fs.writeFileSync(currentDbPath, JSON.stringify(newDb, null, 2));

  logDebug("> [simpleMigrator] Migration finished");
}

function ifDbFileExists() {
  const currentDbPath = path.join(__dirname, "..", getConfigValue(ConfigKeys.DB_PATH));
  return fs.existsSync(currentDbPath);
}

function checkIfDbExists() {
  const dbExists = ifDbFileExists();
  logDebug(`> DataBase exists at "${getConfigValue(ConfigKeys.DB_PATH)}" -> ${dbExists}`);
  if (!dbExists) {
    throw new Error(`DataBase does not exist at "${getConfigValue(ConfigKeys.DB_PATH)}"`);
  }
}

function overwriteDbIfDefined() {
  if (getConfigValue(ConfigKeys.DB_CUSTOM_PATH) !== undefined && getConfigValue(ConfigKeys.DB_CUSTOM_PATH) !== "") {
    logDebug(`> Custom DataBase was defined`);
    overwriteDb();
  }
}

function overwriteDb() {
  if (getConfigValue(ConfigKeys.DB_CUSTOM_PATH) === undefined || getConfigValue(ConfigKeys.DB_CUSTOM_PATH) === "") {
    throw new Error(`DataBase does not exist at "${getConfigValue(ConfigKeys.DB_CUSTOM_PATH)}"`);
  }

  const customDBPath = `./db/${getConfigValue(ConfigKeys.DB_CUSTOM_PATH)}.json`;
  const currentDbPath = getConfigValue(ConfigKeys.DB_PATH);

  logDebug(`> Checking if DataBase exists at "${customDBPath}"...`);

  if (!fs.existsSync(customDBPath)) {
    throw new Error(`DataBase does not exist at "${customDBPath}"`);
  }
  logDebug(`> Overwriting DataBase at "${currentDbPath}" with "${customDBPath}"...`);
  fs.copyFileSync(customDBPath, currentDbPath);
}

module.exports = { simpleMigrator, checkIfDbExists, overwriteDb, overwriteDbIfDefined };
