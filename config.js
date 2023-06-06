const bearerToken = "Bearer SecretToken";
const basicAuth = "Basic dXNlcjpwYXNz"; // user:pass
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// https://github.com/techiediaries/fake-api-jwt-json-server
// JWT: based on https://github.com/techiediaries/fake-api-jwt-json-server/blob/master/server.js
// https://jwt.io/
const JWT_SECRET_KEY = "123456789";

const tokenExpirationInMinutes = 60; // minutes
const superAdminTokenExpirationInMinutes = 60; // minutes

// const expiresIn = "1h";
// const cookieMaxAge = 1 * 60 * 60 * 1000 // 1h
// const cookieMaxAge = 1 * 10 * 60 * 1000 // 10m
const cookieMaxAge = 1 * tokenExpirationInMinutes * 60 * 1000;
const superAdminCookieMaxAge = 1 * superAdminTokenExpirationInMinutes * 60 * 1000;
const keepSignInCookieMaxAge = 5 * 24 * superAdminTokenExpirationInMinutes * 60 * 1000;

const tokenExpiresIn = `${tokenExpirationInMinutes}m`;
const superAdminTokenExpiresIn = `${superAdminTokenExpirationInMinutes}m`;
const keepSignInTokenExpiresIn = `${5 * 24 * superAdminTokenExpirationInMinutes}m`;

const authUserDb = "./db.json";
const dbPath = "./db.json";
const dbRestorePath = "./db-base.json";
const dbEmptyRestorePath = "./db-empty.json";
const defaultPort = 3000;

const adminUserEmail = "admin";
const adminUserPass = "admin";

const superAdminUserEmail = "super";
const superAdminUserPass = "a";

const dateRegexp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/; // e.g. 2016-01-19T15:21:32Z
const emailRegexp = /^\S+@\S+\.\S+$/;

const sleepTime = {
  perOneGetComment: 30,
  perOneGetCommentMin: 25,
  perOneGetCommentMax: 50,
};

module.exports = {
  characters,
  bearerToken,
  basicAuth,
  JWT_SECRET_KEY,
  tokenExpiresIn,
  superAdminTokenExpiresIn,
  keepSignInTokenExpiresIn,
  cookieMaxAge,
  superAdminCookieMaxAge,
  keepSignInCookieMaxAge,
  authUserDb,
  defaultPort,
  dbPath,
  dbRestorePath,
  dbEmptyRestorePath,
  adminUserEmail,
  adminUserPass,
  superAdminUserEmail,
  superAdminUserPass,
  dateRegexp,
  emailRegexp,
  sleepTime,
};
