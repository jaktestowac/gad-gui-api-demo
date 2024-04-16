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
  numberOfTopVisitedArticles: 10,
  logsLimit: 500,

  maxRandomVisitsForArticles: 1100,
  minRandomVisitsForArticles: 50,
  maxRandomVisitsForComments: 50,
  minRandomVisitsForComments: 0,
  maxRandomVisitsForUsers: 250,
  minRandomVisitsForUsers: 10,

  randomErrorResponseProbability: 0.05,
};

const config = {
  authUserDb: "./db/db.json",
  dbPath: "./db/db.json",
  dbRestorePath: "./db/db-base.json",
  db2RestorePath: "./db/db-base-v2.json",
  dbBigRestorePath: "./db/db-base-big.json",
  dbTinyRestorePath: "./db/db-base-tiny.json",
  dbEmptyRestorePath: "./db/db-empty.json",
  quizQuestionsPath: "./db/quiz-questions.json",
  gamesDbPath: "./db/games-db.json",
  hangmanDataPath: "./db/hangman-words.json",
  translationsDbPath: "./data/translations/translations.json",
  defaultPort: 3000,
  dateRegexp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, // e.g. 2016-01-19T15:21:32Z
  emailRegexp: /^\S+@\S+\.\S+$/,
  userAvatarPath: "../public/data/users",
  articleImagePath: "../public/data/images/256",
  uploadsPath: "../uploads",
  readOnly: `${process.env.READ_ONLY}`.trim() === "1" ? true : false,
};

module.exports = {
  configToModify,
  config,
};
