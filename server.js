const jsonServer = require("./json-server");
const { validationsRoutes } = require("./routes/validations.route");
const { getConfigValue, getFeatureFlagConfigValue, isBugEnabled } = require("./config/config-manager");
const { ConfigKeys, FeatureFlagConfigKeys, BugConfigKeys } = require("./config/enums");
const fs = require("fs");
const path = require("path");

const cookieparser = require("cookie-parser");
const helmet = require("helmet");
const express = require("express");
const { getDbPath, countEntities, visitsData, initVisits } = require("./helpers/db.helpers");

const { formatErrorResponse, sleep } = require("./helpers/helpers");
const { logDebug, logError, logTrace } = require("./helpers/logger-api");
const {
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_CREATED,
  HTTP_BAD_REQUEST,
  HTTP_NOT_FOUND,
} = require("./helpers/response.helpers");
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
const { calcRoutes } = require("./routes/calc.route");

const bodyParser = require("body-parser");
const { randomErrorsRoutes } = require("./routes/error.route");
const { checkDatabase } = require("./helpers/sanity.check");
const { copyDefaultDbIfNotExists } = require("./helpers/setup");
const { getOriginMethod, getTracingInfo, getWasAuthorized } = require("./helpers/tracing-info.helper");
const { setEntitiesInactive, replaceRelatedContactsInDb } = require("./helpers/db-queries.helper");
const { diagnosticRoutes } = require("./routes/diagnostic.route");
const app = require("./app.json");
const DatabaseManager = require("./helpers/db.manager");

const middlewares = jsonServer.defaults();

const port = process.env.PORT || getConfigValue(ConfigKeys.DEFAULT_PORT);

copyDefaultDbIfNotExists();
checkDatabase();

initVisits();

const server = jsonServer.create();
const router = jsonServer.router(getDbPath(getConfigValue(ConfigKeys.DB_PATH)));

const dbManager = DatabaseManager.getInstance();
dbManager.setDb(router.db);

server.use(diagnosticRoutes);

const clearDbRoutes = (req, res, next) => {
  try {
    const restoreDb = (dbPath, successMessage) => {
      const db = JSON.parse(fs.readFileSync(path.join(__dirname, getConfigValue(dbPath)), "utf8"));
      router.db.setState(db);
      const entities = countEntities(db);
      logDebug(successMessage, entities);
      visitsData.generateVisits();
      res.status(HTTP_CREATED).send({ message: successMessage, entities });
    };

    if (req.method === "GET" && req.url.includes("restore")) {
      const url = req.url.replace(/\?.*$/, "").replace(/\/$/, "");
      const urlLastPart = url.split("/").pop();
      switch (urlLastPart) {
        case "restoreDB":
          restoreDb(ConfigKeys.DB_RESTORE_PATH, "Database successfully restored");
          break;
        case "restoreBigDB":
          restoreDb(ConfigKeys.DB_BIG_RESTORE_PATH, "Big Database successfully restored");
          break;
        case "restoreDB2":
          restoreDb(ConfigKeys.DB2_RESTORE_PATH, "Database successfully restored");
          break;
        case "restoreTinyDB":
          restoreDb(ConfigKeys.DB_TINY_RESTORE_PATH, "Tiny Database successfully restored");
          break;
        case "restoreEmptyDB":
          restoreDb(ConfigKeys.DB_EMPTY_RESTORE_PATH, "Empty Database successfully restored");
          break;
        case "restoreTestDB":
          restoreDb(ConfigKeys.DB_TEST_RESTORE_PATH, "Test Database successfully restored");
          break;
        default:
          logDebug("No action for restore", { url, req_url: req.url, urlLastPart });
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse("No action for restore", { parameter: urlLastPart }));
          break;
      }
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

// actions invoked just before returning response
server.use((req, res, next) => {
  res.on("finish", function () {
    // TODO: add your custom logic here
  });
  next();
});

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
server.use(calcRoutes);

server.use(function (req, res, next) {
  // soft delete articles:
  if (getOriginMethod(req) === "DELETE" && getWasAuthorized(req) === true && req.url.includes("articles")) {
    const tracingInfo = getTracingInfo(req);
    logTrace("SOFT_DELETE: articles -> soft deleting comments", { url: req.url, tracingInfo });

    const bugEnabled = isBugEnabled(BugConfigKeys.BUG_DELAY_SOFT_DELETE_COMMENTS);

    let timeout = 0;
    if (bugEnabled) {
      timeout = getConfigValue(ConfigKeys.COMMENTS_SOFT_DELETE_DELAY_IN_SECONDS_BUG) * 1000;
    }

    sleep(timeout, bugEnabled ?? "Bug for SOFT_DELETE was enabled").then(() => {
      setEntitiesInactive(router.db, "comments", { article_id: parseInt(tracingInfo.resourceId) });
      setEntitiesInactive(router.db, "comments", { article_id: tracingInfo.resourceId });
    });
  }
  // soft delete users:
  if (getOriginMethod(req) === "DELETE" && getWasAuthorized(req) === true && req.url.includes("users")) {
    const isFeatureEnabled = getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_SOFT_DELETE_USERS);

    if (isFeatureEnabled === true) {
      const tracingInfo = getTracingInfo(req);
      logTrace("SOFT_DELETE: users -> soft deleting articles", { url: req.url, tracingInfo });

      const query = { user_id: tracingInfo.resourceId };

      setEntitiesInactive(router.db, "articles", query);
      setEntitiesInactive(router.db, "comments", query);
    }
  }
  // add contacts:
  if (
    getOriginMethod(req) === "PUT" &&
    getWasAuthorized(req) === true &&
    req.url.includes("contacts") &&
    (res.statusCode === 200 || res.statusCode === 201)
  ) {
    const tracingInfo = getTracingInfo(req);
    logDebug("UPDATE: /messenger/contacts", { url: req.url, tracingInfo });
    replaceRelatedContactsInDb(router.db, parseInt(tracingInfo.targetResourceId), tracingInfo.targetResource);
  }

  next();
});

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
