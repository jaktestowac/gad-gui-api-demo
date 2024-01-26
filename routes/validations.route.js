const {
  formatErrorResponse,
  getIdFromUrl,
  formatInvalidTokenErrorResponse,
  getRandomInt,
  sleep,
} = require("../helpers/helpers");
const { logDebug, logError, logTrace } = require("../helpers/logger-api");
const { getConfigValue, isBugEnabled } = require("../config/config-manager");
const { ConfigKeys, BugConfigKeys } = require("../config/enums");

const { verifyAccessToken } = require("../helpers/validation.helpers");
const { searchForUserWithToken } = require("../helpers/db-operation.helpers");
const { HTTP_UNAUTHORIZED, HTTP_INTERNAL_SERVER_ERROR, HTTP_BAD_REQUEST } = require("../helpers/response.helpers");
const { handleHangman } = require("../endpoints/hangman-endpoint.helpers");
const { handleQuiz } = require("../endpoints/quiz-endpoint.helpers");
const { handleConfig } = require("../endpoints/config-endpoint.helpers");
const { handleUsers } = require("../endpoints/users-endpoint.helpers");
const { handleArticles } = require("../endpoints/articles-endpoint.helpers");
const { handleComments } = require("../endpoints/comments-endpoint.helpers");
const { handleLikes } = require("../endpoints/likes-endpoint.helpers");
const { handleLabels } = require("../endpoints/labels-endpoint.helpers");
const { handleGames } = require("../endpoints/games-endpoint.helpers");
const { handleScores } = require("../endpoints/scores-endpoint.helpers");
const { handleBookmarks } = require("../endpoints/bookmarks-endpoint.helpers");
const { handleMinesweeper } = require("../endpoints/minesweeper-endpoint.helpers");

const validationsRoutes = (req, res, next) => {
  let isAdmin = false;

  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");

    // check if JSON:
    if (
      (req.url.includes("/api/users") ||
        req.url.includes("/api/comments") ||
        req.url.includes("/api/articles") ||
        req.url.includes("/api/plugins")) &&
      req.body?.length > 0
    ) {
      try {
        JSON.parse(req.body);
      } catch (error) {
        logError(`Error: ${JSON.stringify(error)}`);
        res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Bad request - malformed JSON"));
        return;
      }
    }

    // check if admin:
    try {
      let verifyTokenResult = verifyAccessToken(req, res, "isAdmin", req.url);
      if (
        verifyTokenResult?.email === getConfigValue(ConfigKeys.ADMIN_USER_EMAIL) ||
        verifyTokenResult?.email === getConfigValue(ConfigKeys.SUPER_ADMIN_USER_EMAIL)
      ) {
        isAdmin = true;
        logDebug("validations: isAdmin:", isAdmin);
      }

      if (verifyTokenResult === undefined) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
        return;
      }
    } catch (error) {
      logError("Error: check if admin:", {
        error,
      });
    }

    if (isBugEnabled(BugConfigKeys.BUG_SORTING_001)) {
      req.query._limit = 11;
    }
    if (isBugEnabled(BugConfigKeys.BUG_SORTING_002)) {
      req.query._sort = "";
    }
    if (isBugEnabled(BugConfigKeys.BUG_SORTING_003)) {
      req.query._order = "";
    }

    if (req.url.includes("/api/config")) {
      handleConfig(req, res);
      return;
    }
    if (req.url.includes("/api/games")) {
      handleGames(req, res);
      return;
    }
    if (req.url.includes("/api/scores")) {
      handleScores(req, res);
      return;
    }
    if (req.url.includes("/api/quiz")) {
      handleQuiz(req, res);
    }
    if (req.url.includes("/api/hangman")) {
      handleHangman(req, res);
    }
    if (req.url.includes("/api/minesweeper")) {
      handleMinesweeper(req, res);
    }
    if (req.url.includes("/api/bookmarks")) {
      handleBookmarks(req, res);
    }

    if (
      req.method !== "GET" &&
      req.method !== "POST" &&
      req.method !== "HEAD" &&
      urlEnds.includes("/api/users") &&
      !isAdmin
    ) {
      logTrace("Validators: Check user auth", { url: urlEnds });
      let userId = getIdFromUrl(urlEnds);
      const verifyTokenResult = verifyAccessToken(req, res, "users", req.url);
      if (verifyTokenResult === undefined) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
        return;
      }

      const foundUser = searchForUserWithToken(userId, verifyTokenResult);

      if (foundUser === undefined) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
    }

    if (req.method !== "GET" && req.method !== "HEAD" && urlEnds?.includes("/api/articles") && !isAdmin) {
      const verifyTokenResult = verifyAccessToken(req, res, "articles", req.url);
      if (verifyTokenResult === undefined) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
        return;
      }
    }

    if (req.method !== "GET" && req.method !== "HEAD" && urlEnds.includes("/api/comments") && !isAdmin) {
      const verifyTokenResult = verifyAccessToken(req, res, "comments", req.url);
      if (verifyTokenResult === undefined) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
        return;
      }
    }

    if (req.url.includes("/api/users")) {
      handleUsers(req, res);
    }

    if (req.url.includes("/api/articles") || req.url.includes("/api/random/article")) {
      handleArticles(req, res, isAdmin);
    }

    if (req.url.includes("/api/comments")) {
      handleComments(req, res, isAdmin);
    }

    if (req.url.includes("/api/likes")) {
      handleLikes(req, res, isAdmin);
    }

    if (req.url.includes("/api/labels") || req.url.includes("/api/article-labels")) {
      handleLabels(req, res);
    }

    logTrace("Returning:", { statusCode: res.statusCode, headersSent: res.headersSent, urlEnds, method: req.method });

    if (res.headersSent !== true) {
      logTrace("validationsRoutes:processing with next()...");

      if (req.method === "GET" && urlEnds.includes("api/comments")) {
        let limit = urlEnds.split("_limit=")[1];
        limit = limit?.split("&")[0];
        let timeout = getConfigValue(ConfigKeys.SLEEP_TIME_PER_ONE_GET_COMMENT);
        logTrace(`[DELAY] Getting sleep time:`, { limit, timeout });
        if (limit !== undefined) {
          timeout =
            limit *
            getRandomInt(
              getConfigValue(ConfigKeys.SLEEP_TIME_PER_ONE_GET_COMMENT_MIN),
              getConfigValue(ConfigKeys.SLEEP_TIME_PER_ONE_GET_COMMENT_MAX)
            );
          logDebug(`[DELAY] Waiting for ${timeout} [ms] to load ${limit} comments`);
        }
        logDebug(`[DELAY] Waiting for ${timeout} [ms] for ${urlEnds}`);
        sleep(timeout).then(() => next());
      } else {
        next();
      }
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      route: "validationsRoutes",
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

exports.validationsRoutes = validationsRoutes;
