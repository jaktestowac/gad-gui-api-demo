const jwt = require("jsonwebtoken");
const { logDebug, logError } = require("./loggerApi");
const { userDb } = require("./db.helpers");
const { getConfigValue } = require("../config/configSingleton");
const { ConfigKeys } = require("../config/enums");

// Create a token from a payload
function createToken(payload, isSuperAdmin = false, keepSignIn = false) {
  if (isSuperAdmin) {
    return jwt.sign(payload, getConfigValue(ConfigKeys.JWT_SECRET_KEY), {
      expiresIn: getConfigValue(ConfigKeys.SUPER_ADMIN_TOKEN_EXPIRES_IN),
    });
  } else {
    let expires = getConfigValue(ConfigKeys.TOKEN_EXPIRES_IN);
    if (keepSignIn) {
      expires = getConfigValue(ConfigKeys.KEEP_SIGNIN_TOKEN_EXPIRES_IN);
    }
    logDebug("createToken:", { expires });
    return jwt.sign(payload, getConfigValue(ConfigKeys.JWT_SECRET_KEY), { expiresIn: expires });
  }
}

function prepareCookieMaxAge(isSuperAdmin = false, keepSignIn = false) {
  if (keepSignIn === "true" || keepSignIn === true) {
    return getConfigValue(ConfigKeys.KEEP_SIGNIN_COOKIE_MAX_AGE);
  }

  if (isSuperAdmin) {
    return getConfigValue(ConfigKeys.SUPER_ADMIN_COOKIE_MAX_AGE);
  } else {
    return getConfigValue(ConfigKeys.COOKIE_MAX_AGE);
  }
}

// Verify the token
function verifyToken(token) {
  return jwt.verify(token, getConfigValue(ConfigKeys.JWT_SECRET_KEY), (err, decode) =>
    decode !== undefined ? decode : err
  );
}

// Check if the user exists in database
function isAuthenticated({ email, password }) {
  return userDb().findIndex((user) => user.email === email && user.password === password) !== -1;
}

function getJwtExpiryDate(seconds) {
  try {
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
    startDate.setUTCSeconds(seconds);
    return startDate;
  } catch (error) {
    logError("getJwtExpiryDate: error:", error);
    return "[error]";
  }
}

module.exports = {
  isAuthenticated,
  verifyToken,
  createToken,
  prepareCookieMaxAge,
  getJwtExpiryDate,
};
