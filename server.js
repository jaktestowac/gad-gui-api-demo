const jsonServer = require("./json-server");
const { validationsRoutes } = require("./routes/validations.route");
const { getConfigValue, getFeatureFlagConfigValue } = require("./config/config-manager");
const { ConfigKeys, FeatureFlagConfigKeys } = require("./config/enums");
const fs = require("fs");
const path = require("path");

const cookieparser = require("cookie-parser");
const helmet = require("helmet");
const express = require("express");
const { getDbPath, countEntities, visitsData, initVisits } = require("./helpers/db.helpers");

const { formatErrorResponse } = require("./helpers/helpers");
const { logDebug, logError, logTrace } = require("./helpers/logger-api");
const { HTTP_INTERNAL_SERVER_ERROR, HTTP_CREATED, HTTP_BAD_REQUEST } = require("./helpers/response.helpers");
const {
  customRoutes,
  statsRoutes,
  visitsRoutes,
  queryRoutes,
  onlyBackendRoutes,
  homeRoutes,
} = require("./routes/custom.route");
const { fileUploadRoutes } = require("./routes/file-upload.route");
const { renderResponse } = require("./renders/custom.render");
const { healthCheckRoutes } = require("./routes/healthcheck.route");
const {
  loginApiRoutes,
  processLoginRoutes,
  loginRoutes,
  welcomeRoutes,
  logoutRoutes,
} = require("./routes/login.route");

const bodyParser = require("body-parser");
const { randomErrorsRoutes } = require("./routes/error.route");
const { checkDatabase } = require("./helpers/sanity.check");
const { copyDefaultDbIfNotExists } = require("./helpers/setup");
const { log } = require("console");

const middlewares = jsonServer.defaults();

const port = process.env.PORT || getConfigValue(ConfigKeys.DEFAULT_PORT);

copyDefaultDbIfNotExists();
checkDatabase();

initVisits();

const server = jsonServer.create();
const router = jsonServer.router(getDbPath(getConfigValue(ConfigKeys.DB_PATH)));

const clearDbRoutes = (req, res, next) => {
  try {
    if (req.method === "GET" && req.url.endsWith("/restoreDB")) {
      const db = JSON.parse(fs.readFileSync(path.join(__dirname, getConfigValue(ConfigKeys.DB_RESTORE_PATH)), "utf8"));
      router.db.setState(db);
      const entities = countEntities(db);
      logDebug("Restore DB was successful", entities);
      visitsData.generateVisits();
      res.status(HTTP_CREATED).send({ message: "Database successfully restored", entities });
    } else if (req.method === "GET" && req.url.endsWith("/restoreBigDB")) {
      const db = JSON.parse(
        fs.readFileSync(path.join(__dirname, getConfigValue(ConfigKeys.DB_BIG_RESTORE_PATH)), "utf8")
      );
      router.db.setState(db);
      const entities = countEntities(db);
      logDebug("Restore DB was successful", entities);
      visitsData.generateVisits();
      res.status(HTTP_CREATED).send({ message: "Big Database successfully restored", entities });
    } else if (req.method === "GET" && req.url.endsWith("/restoreDB2")) {
      const db = JSON.parse(fs.readFileSync(path.join(__dirname, getConfigValue(ConfigKeys.DB2_RESTORE_PATH)), "utf8"));
      router.db.setState(db);
      const entities = countEntities(db);
      logDebug("Restore DB was successful", entities);
      visitsData.generateVisits();
      res.status(HTTP_CREATED).send({ message: "Database successfully restored", entities });
    } else if (req.method === "GET" && req.url.endsWith("/restoreTinyDB")) {
      const db = JSON.parse(
        fs.readFileSync(path.join(__dirname, getConfigValue(ConfigKeys.DB_TINY_RESTORE_PATH)), "utf8")
      );
      router.db.setState(db);
      const entities = countEntities(db);
      logDebug("Restore DB was successful", entities);
      visitsData.generateVisits();
      res.status(HTTP_CREATED).send({ message: "Big Database successfully restored", entities });
    } else if (req.method === "GET" && req.url.endsWith("/restoreEmptyDB")) {
      const db = JSON.parse(
        fs.readFileSync(path.join(__dirname, getConfigValue(ConfigKeys.DB_EMPTY_RESTORE_PATH)), "utf8")
      );
      router.db.setState(db);
      const entities = countEntities(db);
      logDebug("Restore empty DB was successful", entities);
      visitsData.generateVisits();
      res.status(HTTP_CREATED).send({ message: "Empty Database successfully restored", entities });
    }
    if (res.headersSent !== true) {
      next();
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      route: "clearDbRoutes",
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

server.get(/.*/, onlyBackendRoutes);

server.use((req, res, next) => {
  if (getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_CACHE_CONTROL_NO_STORE)) {
    res.header("Cache-Control", "no-store");
  }
  next();
});

server.use(healthCheckRoutes);
server.use(middlewares);

server.use((req, res, next) => {
  bodyParser.json()(req, res, (err) => {
    if (err) {
      logError("SyntaxError: Unexpected data in JSON - Please check Your JSON.", { err: JSON.stringify(err) });
      return res
        .status(HTTP_BAD_REQUEST)
        .json({ error: "SyntaxError: Unexpected data in JSON. Please check Your JSON.", details: err?.body });
    }

    next();
  });
});
server.use(jsonServer.bodyParser);

server.use(helmet());
server.use(cookieparser());

// allow the express server to read and render the static css file
server.use(express.static(path.join(__dirname, "public", "login")));
server.set("view engine", "ejs");

// render the ejs views
server.set("views", path.join(__dirname, "public", "login"));

server.get("/home", homeRoutes);

// Login to one of the users from ./users.json
server.post("/api/login", loginApiRoutes);
server.post("/process_login", processLoginRoutes);
server.get("/login", loginRoutes);
server.get("/welcome", welcomeRoutes);
server.get("/logout", logoutRoutes);

server.use(clearDbRoutes);
server.use(statsRoutes);
server.use(visitsRoutes);
server.use(queryRoutes);
server.use(customRoutes);
server.use(randomErrorsRoutes);
server.use(validationsRoutes);
server.use(fileUploadRoutes);
server.use("/api", router);

router.render = renderResponse;

server.use(function (req, res, next) {
  logTrace("Hit 404:", { url: req.url });

  res.status(404);

  // respond with html page
  if (req.accepts("html")) {
    res.render("404", { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts("json")) {
    res.json({ error: "Not found" });
    return;
  }

  // default to plain-text. send()
  res.type("txt").send("Not found");
});

logDebug(`Starting 🦎 GAD on port ${port}...`);
logDebug(`--------------------------------`);
const app = require("./app.json");

var serverApp = server.listen(port, () => {
  logDebug(`🦎 GAD listening on ${port}!`);
  var address = serverApp.address().address;
  address = address == "::" ? "localhost" : "localhost";
  logDebug(`Visit it on -> http://${address}:${port}`);
  logDebug(`🎉 Your custom 🦎 GAD (${app.version}) is up and running!!!`);
});

module.exports = {
  serverApp,
};
