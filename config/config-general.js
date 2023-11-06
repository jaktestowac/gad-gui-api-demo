const { LogLevels } = require("./enums");

const configToModify = {
  adminUserEmail: "admin",
  adminUserPass: "admin",
  superAdminUserEmail: "super",
  superAdminUserPass: "a",

  bearerToken: "Bearer SecretToken",
  basicAuth: "Basic dXNlcjpwYXNz", // user:pass
  characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",

  // https://github.com/techiediaries/fake-api-jwt-json-server
  // JWT: based on https://github.com/techiediaries/fake-api-jwt-json-server/blob/master/server.js
  // https://jwt.io/
  JWT_SECRET_KEY: "123456789",

  tokenExpirationInMinutes: 60, // minutes
  superAdminTokenExpirationInMinutes: 60, // minutes

  cookieMaxAge: 1 * 60 * 60 * 1000, // 1 hour
  superAdminCookieMaxAge: 1 * 60 * 60 * 1000, // 1 hour
  keepSignInCookieMaxAge: 5 * 24 * 60 * 60 * 1000, // 5 days

  tokenExpiresIn: `60m`, // 1 hour
  superAdminTokenExpiresIn: `60m`, // 1 hour
  keepSignInTokenExpiresIn: `7200m`, // 5 * 24 * 60m // 5 days

  uploadSizeLimitBytes: 1000,
  currentLogLevel: LogLevels.DEBUG,
  publicLogsEnabled: false,
  sleepTimePerOneGetComment: 30,
  sleepTimePerOneGetCommentMin: 25,
  sleepTimePerOneGetCommentMax: 50,

  numberOfTopLikedArticles: 10,
  logsLimit: 500,
};

const config = {
  authUserDb: "./db/db.json",
  dbPath: "./db/db.json",
  dbRestorePath: "./db/db-base.json",
  dbEmptyRestorePath: "./db/db-empty.json",
  quizQuestionsPath: "./db/quiz-questions.json",
  quizDbPath: "./db/games-db.json",
  hangmanDataPath: "./db/hangman-words.json",
  defaultPort: 3000,
  dateRegexp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, // e.g. 2016-01-19T15:21:32Z
  emailRegexp: /^\S+@\S+\.\S+$/,
  userAvatarPath: "../public/data/users",
  articleImagePath: "../public/data/images/256",
  uploadsPath: "../uploads",
};

module.exports = {
  configToModify,
  config,
};
