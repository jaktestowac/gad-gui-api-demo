// simple log levels
const LogLevels = {
  ERROR: 0,
  CONSOLE: 1,
  WARNING: 2,
  DEBUG: 4,
  TRACE: 5,
};

const ConfigKeys = {
  ADMIN_USER_EMAIL: "adminUserEmail",
  ADMIN_USER_PASS: "adminUserPass",
  BEARER_TOKEN: "bearerToken",
  BASIC_AUTH: "basicAuth",
  CHARACTERS: "characters",
  JWT_SECRET_KEY: "JWT_SECRET_KEY",
  TOKEN_EXPIRATION_MINUTES: "tokenExpirationInMinutes",
  SUPER_ADMIN_TOKEN_EXPIRATION_MINUTES: "superAdminTokenExpirationInMinutes",
  COOKIE_MAX_AGE: "cookieMaxAge",
  SUPER_ADMIN_COOKIE_MAX_AGE: "superAdminCookieMaxAge",
  KEEP_SIGNIN_COOKIE_MAX_AGE: "keepSignInCookieMaxAge",
  TOKEN_EXPIRES_IN: "tokenExpiresIn",
  SUPER_ADMIN_TOKEN_EXPIRES_IN: "superAdminTokenExpiresIn",
  KEEP_SIGNIN_TOKEN_EXPIRES_IN: "keepSignInTokenExpiresIn",
  AUTH_USER_DB: "authUserDb",
  DB_PATH: "dbPath",
  DB_RESTORE_PATH: "dbRestorePath",
  DB_EMPTY_RESTORE_PATH: "dbEmptyRestorePath",
  QUIZ_DATA_PATH: "quizDataPath",
  HANGMAN_DATA_PATH: "hangmanDataPath",
  DEFAULT_PORT: "defaultPort",
  SUPER_ADMIN_USER_EMAIL: "superAdminUserEmail",
  SUPER_ADMIN_USER_PASS: "superAdminUserPass",
  DATE_REGEXP: "dateRegexp",
  EMAIL_REGEXP: "emailRegexp",
  UPLOAD_SIZE_LIMIT_BYTES: "uploadSizeLimitBytes",
  CURRENT_LOG_LEVEL: "currentLogLevel",
  SLEEP_TIME_PER_ONE_GET_COMMENT: "sleepTimePerOneGetComment",
  SLEEP_TIME_PER_ONE_GET_COMMENT_MIN: "sleepTimePerOneGetCommentMin",
  SLEEP_TIME_PER_ONE_GET_COMMENT_MAX: "sleepTimePerOneGetCommentMax",
};

module.exports = {
  LogLevels,
  ConfigKeys,
};
