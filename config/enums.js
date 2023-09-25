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
  QUIZ_QUESTIONS_PATH: "quizQuestionsPath",
  QUIZ_DB_PATH: "quizDbPath",
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
  PUBLIC_LOGS_ENABLED: "publicLogsEnabled",
};

const BugConfigKeys = {
  BUG_CHARTS_001: "bug_charts_001",
  BUG_CHARTS_002: "bug_charts_002",
  BUG_CHARTS_003: "bug_charts_003",
  BUG_VALIDATION_001: "bug_validation_001",
  BUG_VALIDATION_002: "bug_validation_002",
  BUG_VALIDATION_003: "bug_validation_003",
  BUG_VALIDATION_004: "bug_validation_004",
  BUG_VALIDATION_005: "bug_validation_005",
  BUG_QUIZ_001: "bug_quiz_001",
  BUG_QUIZ_002: "bug_quiz_002",
  BUG_QUIZ_003: "bug_quiz_003",
  BUG_QUIZ_004: "bug_quiz_004",
};

module.exports = {
  LogLevels,
  ConfigKeys,
  BugConfigKeys,
};
