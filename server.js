const { assertPackageDependencies } = require("./helpers/package.checker");
assertPackageDependencies();

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
  loginValidateRoutes,
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
const { simpleMigrator, overwriteDbIfDefined } = require("./db/migrators/migrator");
const { exitRoutes, restartRoutes } = require("./routes/debug.route");
const { bookShopCoverUploadRoutes, multerUpload, multerErrorHandling } = require("./routes/file-upload-v2.route");
const WebSocket = require("ws");
const { websocketRoute } = require("./routes/websocket.route");
const { assertFreePorts } = require("./helpers/port.checker");
const { externalRoutes } = require("./routes/external.route");
const { initializeAllBugHatchDatabases } = require("./endpoints/bug-hatch/db-bug-hatch.operations");

const middlewares = jsonServer.defaults();

const port = process.env.PORT || getConfigValue(ConfigKeys.DEFAULT_PORT);
const webSocketPort = parseInt(port) + 10;

// TODO: test this check
// assertFreePorts([port, webSocketPort], false);

copyDefaultDbIfNotExists();
overwriteDbIfDefined();

simpleMigrator(getDbPath(getConfigValue(ConfigKeys.DB_PATH)), getDbPath(getConfigValue(ConfigKeys.DB_RESTORE_PATH)));
checkDatabase();
initVisits();

const isBugHatchEnabled = getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_BUG_HATCH_MODULE);
if (isBugHatchEnabled === true) {
  logDebug("> BugHatch Module is ENABLED");
  initializeAllBugHatchDatabases().catch((err) => {
    logError("Failed to initialize BugHatch Module databases:", err);
  });
}

const server = jsonServer.create();
const router = jsonServer.router(getDbPath(getConfigValue(ConfigKeys.DB_PATH)));

const dbManager = DatabaseManager.getInstance();
dbManager.setDb(router.db);

const clearDbRoutes = (req, res, next) => {
  try {
    const restoreDbWithKey = (dbPathKey, successMessage) => {
      const dbPath = path.join(__dirname, getConfigValue(dbPathKey));
      restoreDb(dbPath, successMessage);
    };
    const restoreDb = (dbPath, successMessage) => {
      const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      router.db.setState(db);
      const entities = countEntities(db);
      logDebug(successMessage, entities);
      visitsData.generateVisits();
      res.status(HTTP_CREATED).send({ message: successMessage, entities });
    };

    const dbRestorDict = {
      restoreDB: {
        dbPath: path.join(__dirname, getConfigValue(ConfigKeys.DB_RESTORE_PATH)),
        successMessage: "Database successfully restored",
      },
      restoreBigDB: {
        dbPath: path.join(__dirname, getConfigValue(ConfigKeys.DB_BIG_RESTORE_PATH)),
        successMessage: "Big Database successfully restored",
      },
      restoreDB2: {
        dbPath: path.join(__dirname, getConfigValue(ConfigKeys.DB2_RESTORE_PATH)),
        successMessage: "Database successfully restored",
      },
      restoreInterviewDB: {
        dbPath: path.join(__dirname, getConfigValue(ConfigKeys.GENERIC_DB_RESTORE_PATH), "db-base-interview.json"),
        successMessage: "Database successfully restored",
      },
      restoreTinyDB: {
        dbPath: path.join(__dirname, getConfigValue(ConfigKeys.DB_TINY_RESTORE_PATH)),
        successMessage: "Tiny Database successfully restored",
      },
      restoreEmptyDB: {
        dbPath: path.join(__dirname, getConfigValue(ConfigKeys.DB_EMPTY_RESTORE_PATH)),
        successMessage: "Empty Database successfully restored",
      },
      restoreTestDB: {
        dbPath: path.join(__dirname, getConfigValue(ConfigKeys.DB_TEST_RESTORE_PATH)),
        successMessage: "Test Database successfully restored",
      },
    };

    if (req.method === "GET" && req.url.includes("restore/list")) {
      const dbRestoreList = Object.keys(dbRestorDict).map((key) => {
        return { name: key, path: `/api/${key}` };
      });
      res.status(HTTP_CREATED).send({ message: "List of available endpoints for restore Articles DB", dbRestoreList });
    }
    if (req.method === "GET" && req.url.includes("restore") && req.url.includes("DB")) {
      const url = req.url.replace(/\?.*$/, "").replace(/\/$/, "");
      const urlLastPart = url.split("/").pop();

      const dbRestore = dbRestorDict[urlLastPart];
      if (dbRestore) {
        restoreDb(dbRestore.dbPath, dbRestore.successMessage);
      } else {
        logDebug("No action for restore", { url, req_url: req.url, urlLastPart });
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("No action for restore", { parameter: urlLastPart }));
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

server.use(healthCheckRoutes);
server.use(diagnosticRoutes);

// allow the express server to read and render the static css file
server.use(express.static(path.join(__dirname, "public", "login")));
server.set("view engine", "ejs");

// render the ejs views
server.set("views", path.join(__dirname, "public", "login"));

server.get("/home", homeRoutes);

// Login to one of the users from ./users.json
server.post("/api/login", loginApiRoutes);
server.get("/api/login", loginValidateRoutes);
server.post("/process_login", processLoginRoutes);
server.get("/login", loginRoutes);
server.get("/welcome", welcomeRoutes);
server.get("/logout", logoutRoutes);

server.get("/api/debug/restart", restartRoutes);
server.get("/api/debug/exit", exitRoutes);

server.post("/api/book-shop/upload/cover", multerUpload.single("file"), multerErrorHandling, bookShopCoverUploadRoutes);

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

      const query = { user_id: parseInt(tracingInfo.resourceId) };
      const query2 = { user_id: tracingInfo.resourceId };

      setEntitiesInactive(router.db, "articles", query);
      setEntitiesInactive(router.db, "comments", query);
      setEntitiesInactive(router.db, "articles", query2);
      setEntitiesInactive(router.db, "comments", query2);
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

server.use("/api/external", externalRoutes);

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

websocketRoute(new WebSocket.Server({ port: webSocketPort, "Access-Control-Allow-Origin": "*" }), webSocketPort);

const sslEnabled = getConfigValue(ConfigKeys.SSL_ENABLED);

if (sslEnabled !== true) {
  logDebug(`Starting 🦎 GAD on port ${port}...`);
  logDebug(`--------------------------------`);

  var serverApp = server.listen(port, () => {
    logDebug(`🦎 GAD listening on ${port}!`);
    var address = serverApp.address().address;
    address = address == "::" ? "localhost" : "localhost";
    logDebug(`Visit it on -> http://${address}:${port}`);
    logDebug(`🎉 Your custom 🦎 GAD (${app.version}) is up and running!!!`);
    logDebug(`--------------------------------`);
  });
} else {
  logDebug(`Starting 🔒 SSL 🦎 GAD on port ${port}...`);
  logDebug(`--------------------------------`);

  const options = {
    key: fs.readFileSync(path.join(__dirname, "./certs/ca-key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "./certs/ca-cert.pem")),
  };

  const https = require("https");

  const sslServer = https.createServer(options, server);
  sslServer.listen(port, () => {
    logDebug(`🔒 SSL 🦎 GAD listening on ${port}!`);
    let address = sslServer.address().address;
    address = address == "::" ? "localhost" : "localhost";
    logDebug(`Visit it on -> https://${address}:${port}`);
    logDebug(`🎉 Your custom 🔒 SSL 🦎 GAD (${app.version}) is up and running!!!`);
    logDebug(`--------------------------------`);
  });
}

const address = serverApp?.address()?.address == "::" ? "localhost" : "localhost";
const protocol = sslEnabled === true ? "https" : "http";
const serverAppAddress = `${protocol}://${address}:${port}`;
const serverWsAddress = `ws://${address}:${webSocketPort}`;

module.exports = {
  serverApp,
  wsPort: webSocketPort,
  port,
  serverAppAddress,
  serverWsAddress,
};
