const fs = require("fs");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const path = require("path");

function getDbPath(dbPath) {
  return path.resolve(__dirname, "..", dbPath);
}

function fullDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.AUTH_USER_DB)), "UTF-8"));
  return db;
}

function userDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.AUTH_USER_DB)), "UTF-8"));
  return db["users"];
}

function articlesDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.AUTH_USER_DB)), "UTF-8"));
  return db["articles"];
}

function commentsDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.AUTH_USER_DB)), "UTF-8"));
  return db["comments"];
}

function quizQuestionsDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.QUIZ_QUESTIONS_PATH), "UTF-8")));
  return db;
}

function getQuizHighScoresDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.QUIZ_DB_PATH), "UTF-8")));
  return db;
}

function saveQuizHighScoresDb(data, gameId) {
  const db = getQuizHighScoresDb();
  db["scores"][gameId] = data;
  fs.writeFileSync(getDbPath(getConfigValue(ConfigKeys.QUIZ_DB_PATH)), JSON.stringify(db, null, 4));
}

function hangmanDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.HANGMAN_DATA_PATH), "UTF-8")));
  return db;
}

function randomDbEntry(db) {
  return db[Math.floor(Math.random() * db.length)];
}

module.exports = {
  userDb,
  articlesDb,
  commentsDb,
  quizQuestionsDb,
  hangmanDb,
  fullDb,
  randomDbEntry,
  getDbPath,
  getQuizHighScoresDb,
  saveQuizHighScoresDb,
};
