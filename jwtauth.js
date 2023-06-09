const jwt = require("jsonwebtoken");
const fs = require("fs");
const {
  JWT_SECRET_KEY,
  tokenExpiresIn,
  authUserDb,
  superAdminTokenExpiresIn,
  cookieMaxAge,
  superAdminCookieMaxAge,
  keepSignInCookieMaxAge,
  keepSignInTokenExpiresIn,
} = require("./config");
const {
  addSecondsToDate
} = require("./helpers");
const { logDebug } = require("./loggerApi");

function userDb() {
  return JSON.parse(fs.readFileSync(authUserDb, "UTF-8"));
}

// Create a token from a payload
function createToken(payload, isSuperAdmin = false, keepSignIn = false) {

  if (isSuperAdmin) {
    return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: superAdminTokenExpiresIn });
  } else {
    let expires = tokenExpiresIn;
      if (keepSignIn) {
        expires = keepSignInTokenExpiresIn;
      }
    console.log(expires)
    return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: expires });
  }
}

function prepareCookieMaxAge(isSuperAdmin = false, keepSignIn = false) {
  if (keepSignIn === "true" || keepSignIn === true) {
    return keepSignInCookieMaxAge;
  }

  if (isSuperAdmin) {
    return superAdminCookieMaxAge;
  } else {
    return cookieMaxAge;
  }
}

// Verify the token
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET_KEY, (err, decode) => (decode !== undefined ? decode : err));
}

// Check if the user exists in database
function isAuthenticated({ email, password }) {
  return userDb().users.findIndex((user) => user.email === email && user.password === password) !== -1;
}

function getJwtExpiryDate(seconds) {
    try {
          const startDate = new Date();
          startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset())
          startDate.setUTCSeconds(seconds);
          return startDate;
      } catch (error) {
          logDebug('getJwtExpiryDate: error:', error);
          return '[error]';
      }
}

module.exports = {
  isAuthenticated,
  verifyToken,
  createToken,
  prepareCookieMaxAge,
  getJwtExpiryDate,
};
