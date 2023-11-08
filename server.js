const jsonServer = require("./json-server");
const { validations } = require("./routes/validations.route");
const { createToken, isAuthenticated, prepareCookieMaxAge } = require("./helpers/jwtauth");
const { getConfigValue } = require("./config/config-manager");
const { ConfigKeys } = require("./config/enums");
const fs = require("fs");
const path = require("path");

const cookieparser = require("cookie-parser");
const helmet = require("helmet");
const express = require("express");
const { userDb, getDbPath } = require("./helpers/db.helpers");

const server = jsonServer.create();
const router = jsonServer.router(getDbPath(getConfigValue(ConfigKeys.DB_PATH)));

const { formatErrorResponse, isAnyAdminUser, isSuperAdminUser, sleep } = require("./helpers/helpers");
const { logDebug, logError, logTrace } = require("./helpers/logger-api");
const { HTTP_INTERNAL_SERVER_ERROR, HTTP_CREATED, HTTP_OK, HTTP_UNAUTHORIZED } = require("./helpers/response.helpers");
const { customRoutes } = require("./routes/custom.route");
const { fileUpload } = require("./routes/file-upload.route");
const middlewares = jsonServer.defaults();

const port = process.env.PORT || getConfigValue(ConfigKeys.DEFAULT_PORT);

const clearDbRoutes = (req, res, next) => {
  try {
    if (req.method === "GET" && req.url.endsWith("/restoreDB")) {
      const db = JSON.parse(fs.readFileSync(path.join(__dirname, getConfigValue(ConfigKeys.DB_RESTORE_PATH)), "utf8"));
      router.db.setState(db);
      logDebug("Restore DB was successful");
      res.status(HTTP_CREATED).send({ message: "Database successfully restored" });
    } else if (req.method === "GET" && req.url.endsWith("/restoreEmptyDB")) {
      const db = JSON.parse(
        fs.readFileSync(path.join(__dirname, getConfigValue(ConfigKeys.DB_EMPTY_RESTORE_PATH)), "utf8")
      );
      router.db.setState(db);
      logDebug("Restore empty DB was successful");
      res.status(HTTP_CREATED).send({ message: "Empty Database successfully restored" });
    }
    if (res.headersSent !== true) {
      next();
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Login to one of the users from ./users.json
server.post("/api/login", (req, res) => {
  const { email, password, keepSignIn } = req.body;
  logTrace("login: endpoint called:", { email });
  logTrace("login: endpoint called:", { email, password, keepSignIn });

  let isAdmin = isAnyAdminUser(email, password);
  let isSuperAdmin = isSuperAdminUser(email, password);

  isAdmin = isAdmin || isSuperAdmin;

  if (isAuthenticated({ email, password }) === false && !isAdmin) {
    const message = "Incorrect email or password";
    res.status(HTTP_UNAUTHORIZED).json({ status: HTTP_UNAUTHORIZED, message });
    return;
  }
  const cookieMaxAge = prepareCookieMaxAge(isAdmin, keepSignIn);
  const access_token = createToken({ email, data: "TBD" }, isAdmin, keepSignIn);
  logDebug("login: access token:", { email, password, access_token, cookieMaxAge, isAdmin });
  res.status(HTTP_OK).json({ access_token });
});

server.use(helmet());
server.use(cookieparser());

// allow the express server to read and render the static css file
server.use(express.static(path.join(__dirname, "public", "login")));
server.set("view engine", "ejs");

// render the ejs views
server.set("views", path.join(__dirname, "public", "login"));

server.get("/home", (req, res) => {
  // check if user is logged in, by checking cookie
  let username = req.cookies.username;

  // render the home page
  return res.render("home", {
    username,
  });
});

server.get("/login", (req, res) => {
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
});

server.get("/welcome", (req, res) => {
  // get the username
  let username = req.cookies.username;
  if (username === undefined) {
    // redirect with a fail msg
    return res.redirect("/login");
  }
  logDebug("Welcome:", { username });
  // render welcome page
  return res.render("welcome", {
    username,
  });
});

server.post("/process_login", (req, res) => {
  let { username, password, keepSignIn } = req.body;
  logDebug("process_login: { email, password, keepSignIn }:", { username, password, keepSignIn });
  let isAdmin = isAnyAdminUser(username, password);
  let isSuperAdmin = isSuperAdminUser(username, password);

  isAdmin = isAdmin || isSuperAdmin;

  if (!isAdmin && isAuthenticated({ email: username, password }) === false) {
    // redirect with a fail msg
    return res.redirect("/login?msg=Invalid username or password");
  }
  const cookieMaxAge = prepareCookieMaxAge(isSuperAdmin, keepSignIn);
  const access_token = createToken({ email: username, data: "TBD" }, isSuperAdmin, keepSignIn);
  logDebug("process_login: { cookieMaxAge, isAdmin, isSuperAdmin }:", { cookieMaxAge, isAdmin, isSuperAdmin });

  let foundUser = undefined;
  if (!isAdmin) {
    foundUser = userDb().find((user) => {
      if (user["email"]?.toString() === username) {
        return user;
      }
    });
  } else {
    foundUser = {
      firstname: getConfigValue(ConfigKeys.ADMIN_USER_EMAIL),
      username: getConfigValue(ConfigKeys.ADMIN_USER_EMAIL),
      id: getConfigValue(ConfigKeys.ADMIN_USER_EMAIL),
      avatar: ".\\data\\users\\face_admin.png",
    };
  }
  logDebug("process_login: Access Token:", { email: username, password, access_token, cookieMaxAge, isAdmin });

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
});

server.get("/logout", (req, res) => {
  // clear the cookie
  res.clearCookie("firstname");
  res.clearCookie("username");
  res.clearCookie("email");
  res.clearCookie("token");
  res.clearCookie("id");
  res.clearCookie("avatar");
  // redirect to login
  logDebug("logout");
  return res.redirect("/login");
});

server.use(clearDbRoutes);
server.use(customRoutes);
server.use(validations);
server.use(fileUpload);
server.use("/api", router);

router.render = function (req, res) {
  if (req.method === "GET" && req.url.includes("users")) {
    const users = res.locals.data;
    let loggedUser = req.cookies.id;
    let usersMapped;
    logTrace("User anonymization:", { length: users.length, loggedUser });
    if (users?.length > 0) {
      usersMapped = users.map((user) => {
        if (!loggedUser) {
          user.lastname = "****";
        }
        if (loggedUser !== "admin") {
          user.email = "****";
        }
        user.password = "****";
        return user;
      });
    } else {
      // This is for single user
      usersMapped = users;
      if (loggedUser !== "admin") {
        usersMapped.email = "****";
      }
      if (!loggedUser) {
        usersMapped.lastname = "****";
      }
      usersMapped.password = "****";
    }
    res.jsonp(usersMapped);
  } else if (req.method === "POST" && req.url.includes("users")) {
    // add little wait  so that user is created in DB
    sleep(100).then((x) => {
      res.jsonp(res.locals.data);
    });
  } else {
    logTrace("router.render:", {
      statusCode: res.statusCode,
      headersSent: res.headersSent,
      url: req.url,
      method: req.method,
    });
    res.jsonp(res.locals.data);
  }
};

var serverApp = server.listen(port, () => {
  logDebug(`Test Custom Data API listening on ${port}!`);
  var address = serverApp.address().address;
  address = address == "::" ? "localhost" : "localhost";
  logDebug(`Visit it on -> http://${address}:${port}`);
  logDebug(`🎉 Your custom REST API service is up and running!!!`);
});

module.exports = {
  serverApp,
};
