const fs = require("fs");
const path = require("path");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const { logDebug } = require("./logger-api");

function copyDefaultDbIfNotExists() {
  const currentDbPath = path.join(__dirname, "..", getConfigValue(ConfigKeys.DB_PATH));
  const baseDbPath = path.join(__dirname, "..", getConfigValue(ConfigKeys.DB_RESTORE_PATH));

  logDebug(`> Checking if DataBase exists at "${getConfigValue(ConfigKeys.DB_PATH)}"...`);
  if (!fs.existsSync(currentDbPath)) {
    logDebug(`> DataBase does not exist at "${getConfigValue(ConfigKeys.DB_PATH)}" -> Creating...`);
    const data = JSON.parse(fs.readFileSync(baseDbPath, "utf8"));
    fs.writeFileSync(currentDbPath, JSON.stringify(data, null, 2));
    logDebug(
      `Copied default DB from ${getConfigValue(ConfigKeys.DB_RESTORE_PATH)} to ${getConfigValue(ConfigKeys.DB_PATH)}`
    );
  }
  logDebug(`> DataBase is ready at "${getConfigValue(ConfigKeys.DB_PATH)}"`);
}

module.exports = { copyDefaultDbIfNotExists };
