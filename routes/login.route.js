const { ADMIN_USER } = require("../config/admin-user.data");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const { isUndefined, areStringsEqualIgnoringCase } = require("../helpers/compare.helpers");
const { userDb } = require("../helpers/db.helpers");
const { isSuperAdminUser } = require("../helpers/helpers");
const { isAuthenticated, createToken, prepareCookieMaxAge } = require("../helpers/jwtauth");
const { logTrace, logDebug } = require("../helpers/logger-api");
const { HTTP_UNAUTHORIZED, HTTP_OK } = require("../helpers/response.helpers");

const loginApiRoutes = (req, res) => {
  const { email, password, keepSignIn } = req.body;
  logTrace("login: endpoint called:", { email });
  logTrace("login: endpoint called:", { email, password, keepSignIn });

  // TODO: DEPRECATED: Remove this code after the new admin / role system is implemented
  let isSuperAdmin = isSuperAdminUser(email, password);

  if (isAuthenticated({ email, password }) === false && !isSuperAdmin) {
    const message = "Incorrect email or password";
    res.status(HTTP_UNAUTHORIZED).json({ status: HTTP_UNAUTHORIZED, message });
    return;
  }
  const cookieMaxAge = prepareCookieMaxAge(isSuperAdmin, keepSignIn);
  const access_token = createToken({ email, data: "TBD" }, isSuperAdmin, keepSignIn);
  logDebug("login: access token:", { email, password, access_token, cookieMaxAge, isSuperAdmin });
  res.status(HTTP_OK).json({ access_token });
};

const loginRoutes = (req, res) => {
  // check if there is a msg query
  let bad_auth = req.query.msg ? true : false;

  // get the username
  let username = req.cookies.username;
  if (username) {
    // redirect to welcome
    return res.redirect("/welcome");
  }

  // if there exists, send the error.
  if (bad_auth) {
    return res.render("login", {
      error: "Invalid username or password",
    });
  } else {
    // else just render the login
    return res.render("login");
  }
};

const processLoginRoutes = (req, res) => {
  let { username, password, keepSignIn } = req.body;
  logDebug("process_login: { email, password, keepSignIn }:", { username, password, keepSignIn });

  // TODO: DEPRECATED: Remove this code after the new admin / role system is implemented
  let isSuperAdmin = isSuperAdminUser(username, password);

  const authenticated = isAuthenticated({ email: username, password });
  logDebug("process_login: { isSuperAdmin, authenticated }:", { isSuperAdmin, authenticated });

  if ((!isSuperAdmin && authenticated === false) || authenticated === undefined) {
    // redirect with a fail msg
    return res.redirect("/login?msg=Invalid username or password");
  }
  const cookieMaxAge = prepareCookieMaxAge(isSuperAdmin, keepSignIn);
  const access_token = createToken({ email: username, data: "TBD" }, isSuperAdmin, keepSignIn);
  logDebug("process_login: { cookieMaxAge, isSuperAdmin }:", { cookieMaxAge, isSuperAdmin });

  let foundUser = undefined;
  if (!isSuperAdmin) {
    foundUser = userDb().find((user) => {
      if (areStringsEqualIgnoringCase(user["email"], username)) {
        return user;
      }
    });
  } else {
    foundUser = ADMIN_USER;
  }
  logDebug("process_login: Access Token:", { email: username, password, access_token, cookieMaxAge, isSuperAdmin });

  // saving the data to the cookies
  res.cookie("firstname", foundUser.firstname, {
    maxAge: cookieMaxAge,
  });
  res.cookie("username", username, {
    maxAge: cookieMaxAge,
  });
  res.cookie("email", username, {
    maxAge: cookieMaxAge,
  });
  res.cookie("token", access_token, {
    maxAge: cookieMaxAge,
  });
  res.cookie("expires", Date.now() + cookieMaxAge, {
    maxAge: cookieMaxAge,
  });
  res.cookie("id", foundUser.id, {
    maxAge: cookieMaxAge,
  });
  res.cookie("avatar", foundUser.avatar, {
    maxAge: cookieMaxAge,
  });
  // redirect
  return res.redirect("/welcome");
};

const welcomeRoutes = (req, res) => {
  // get the username
  let username = req.cookies.username;
  if (isUndefined(username)) {
    // redirect with a fail msg
    return res.redirect("/login");
  }
  logDebug("Welcome:", { username });
  // render welcome page
  return res.render("welcome", {
    username,
  });
};

const logoutRoutes = (req, res) => {
  // clear the cookie
  res.clearCookie("firstname");
  res.clearCookie("username");
  res.clearCookie("email");
  res.clearCookie("token");
  res.clearCookie("id");
  res.clearCookie("avatar");
  res.clearCookie("expires");
  // redirect to login
  logDebug("Logout");
  return res.redirect("/login");
};

exports.processLoginRoutes = processLoginRoutes;
exports.welcomeRoutes = welcomeRoutes;
exports.loginApiRoutes = loginApiRoutes;
exports.loginRoutes = loginRoutes;
exports.logoutRoutes = logoutRoutes;
