const fs = require("fs");
const { authUserDb } = require("./config");

function fullDb() {
  const db = JSON.parse(fs.readFileSync(authUserDb, "UTF-8"));
  return db;
}

function userDb() {
  const db = JSON.parse(fs.readFileSync(authUserDb, "UTF-8"));
  return db["users"];
}

function articlesDb() {
  const db = JSON.parse(fs.readFileSync(authUserDb, "UTF-8"));
  return db["articles"];
}

function commentsDb() {
  const db = JSON.parse(fs.readFileSync(authUserDb, "UTF-8"));
  return db["comments"];
}

module.exports = {
  userDb,
  articlesDb,
  commentsDb,
  fullDb,
};
