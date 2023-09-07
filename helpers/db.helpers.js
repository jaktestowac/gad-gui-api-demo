const fs = require("fs");
const { getConfigValue } = require("../config/configManager");
const { ConfigKeys } = require("../config/enums");

function fullDb() {
  const db = JSON.parse(fs.readFileSync(getConfigValue(ConfigKeys.AUTH_USER_DB), "UTF-8"));
  return db;
}

function userDb() {
  const db = JSON.parse(fs.readFileSync(getConfigValue(ConfigKeys.AUTH_USER_DB), "UTF-8"));
  return db["users"];
}

function articlesDb() {
  const db = JSON.parse(fs.readFileSync(getConfigValue(ConfigKeys.AUTH_USER_DB), "UTF-8"));
  return db["articles"];
}

function commentsDb() {
  const db = JSON.parse(fs.readFileSync(getConfigValue(ConfigKeys.AUTH_USER_DB), "UTF-8"));
  return db["comments"];
}

function randomDbEntry(db) {
  return db[Math.floor(Math.random() * db.length)];
}

module.exports = {
  userDb,
  articlesDb,
  commentsDb,
  fullDb,
  randomDbEntry,
};
