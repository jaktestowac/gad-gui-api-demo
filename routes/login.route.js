const { ADMIN_USER } = require("../config/admin-user.data");
const { isUndefined, areStringsEqualIgnoringCase } = require("../helpers/compare.helpers");
const { userDb } = require("../helpers/db.helpers");
const { isSuperAdminUser } = require("../helpers/helpers");
const { isAuthenticated, createToken, prepareCookieMaxAge } = require("../helpers/jwtauth");
const { logTrace, logDebug } = require("../helpers/logger-api");
const { HTTP_UNAUTHORIZED, HTTP_OK } = require("../helpers/response.helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");
const { formatErrorResponse, formatInvalidTokenErrorResponse } = require("../helpers/helpers");
const { searchForUserWithOnlyToken } = require("../helpers/db-operation.helpers");

const loginValidateRoutes = (req, res) => {
  const verifyTokenResult = verifyAccessToken(req, res, "users", req.url);
  const authorization = req.headers["authorization"];

  if (isUndefined(authorization)) {
    res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
    return;
  }

  if (isUndefined(verifyTokenResult)) {
    res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token is invalid!"));
    return;
  }

  const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

  if (isUndefined(foundUser)) {
    res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
    return;
  }

  logDebug("loginValidateRoutes: verifyTokenResult:", verifyTokenResult);
  const data = {};

  if (req.headers["verbose"] !== undefined) {
    data["iat"] = verifyTokenResult.iat;
    data["exp"] = verifyTokenResult.exp;
    data["iatDate"] = new Date(verifyTokenResult.iat * 1000).toUTCString();
    data["expDate"] = new Date(verifyTokenResult.exp * 1000).toUTCString();
  }

  res.status(HTTP_OK).send(data);
  return;
};

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
  let { username, password, keepSignIn, redirectURL } = req.body;
  logDebug("process_login: { email, password, keepSignIn }:", { username, password, keepSignIn, redirectURL });

  if (redirectURL && redirectURL.includes("http")) {
    redirectURL = redirectURL.split("/").slice(3).join("/");
  }
  if (redirectURL && redirectURL.charAt(0) === "/") {
    redirectURL = redirectURL.substring(1);
  }

  // TODO: DEPRECATED: Remove this code after the new admin / role system is implemented
  let isSuperAdmin = isSuperAdminUser(username, password);

  const authenticated = isAuthenticated({ email: username, password });
  logDebug("process_login: { isSuperAdmin, authenticated }:", { isSuperAdmin, authenticated });

  if ((!isSuperAdmin && authenticated === false) || authenticated === undefined) {
    return res.redirect("/login?msg=Invalid username or password" + (redirectURL ? "&redirectURL=" + redirectURL : ""));
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

  if (redirectURL && !redirectURL.includes("/login") && redirectURL !== "/") {
    logDebug("process_login: Redirect URL:", { redirectURL });
    return res.redirect(redirectURL);
  }

  return res.redirect("/welcome");
};

const welcomeRoutes = (req, res) => {
  // get the username
  let username = req.cookies.username;
  let token = req.cookies.token;
  if (isUndefined(username) || isUndefined(token)) {
    logDebug("welcomeRoutes: Redirect to login", { username, token });
    res.clearCookie("firstname");
    res.clearCookie("username");
    res.clearCookie("email");
    res.clearCookie("token");
    res.clearCookie("id");
    res.clearCookie("avatar");
    res.clearCookie("expires");
    res.clearCookie("username");
    return res.redirect("/login");
  }
  logDebug("welcomeRoutes:", { username });
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
exports.loginValidateRoutes = loginValidateRoutes;
