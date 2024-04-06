const {
  fullDb,
  getUserAvatars,
  getImagesForArticles,
  getVisitsPerArticle,
  getVisitsPerComment,
  getVisitsPerUsers,
  getApiCalls,
  getApiRequestsDetails,
  getNonApiCalls,
  getNonApiRequestsDetails,
  translationsDb,
  getLanguages,
} = require("../helpers/db.helpers");
const {
  formatErrorResponse,
  getIdFromUrl,
  parsePublishStats,
  parseArticleStats,
  parseUserStats,
  findMaxValues,
} = require("../helpers/helpers");
const { logError, logDebug, getLogs, logTrace } = require("../helpers/logger-api");
const { HTTP_INTERNAL_SERVER_ERROR, HTTP_OK, HTTP_NOT_FOUND } = require("../helpers/response.helpers");
const { getConfigValue, getFeatureFlagConfigValue } = require("../config/config-manager");
const { ConfigKeys, FeatureFlagConfigKeys } = require("../config/enums");
const { isUndefined } = require("../helpers/compare.helpers");

const statsRoutes = (req, res, next) => {
  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    if (req.method === "GET" && urlEnds.includes("api/stats/users")) {
      const dataType = urlEnds.split("?chartType=");
      const stats = parseUserStats(fullDb(), dataType[1] ?? "");
      res.status(HTTP_OK).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/stats/articles")) {
      const dataType = urlEnds.split("?chartType=");
      const stats = parseArticleStats(fullDb(), dataType[1] ?? "");
      res.status(HTTP_OK).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/stats/publish/articles")) {
      const stats = parsePublishStats(fullDb(), "articles");
      res.status(HTTP_OK).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/stats/publish/comments")) {
      const stats = parsePublishStats(fullDb(), "comments");
      res.status(HTTP_OK).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.endsWith("api/stats/api")) {
      const stats = getApiCalls();
      res.status(HTTP_OK).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.endsWith("api/stats/nonapi")) {
      const stats = getNonApiCalls();
      res.status(HTTP_OK).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.endsWith("api/stats/api/details")) {
      const stats = getApiRequestsDetails();
      res.status(HTTP_OK).json(stats);
      return;
    } else if (req.method === "GET" && urlEnds.endsWith("api/stats/nonapi/details")) {
      const stats = getNonApiRequestsDetails();
      res.status(HTTP_OK).json(stats);
      return;
    }

    if (res.headersSent !== true) {
      next();
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      route: "statsRoutes",
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

const visitsRoutes = (req, res, next) => {
  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    if (req.method === "GET" && req.url.includes("/api/visits/")) {
      let data = {};
      let id = undefined;
      let ids = undefined;
      let visits = {};

      if (req.url.includes("/articles")) {
        data = getVisitsPerArticle();
      } else if (req.url.includes("/comments")) {
        data = getVisitsPerComment();
      } else if (req.url.includes("/users")) {
        data = getVisitsPerUsers();
      }

      if (req.url.includes("/articles/") || req.url.includes("/comments/") || req.url.includes("/users/")) {
        id = getIdFromUrl(urlEnds);
      }

      if (req.url.includes("?ids=")) {
        let idsRaw = urlEnds.split("?ids=").slice(-1)[0];
        if (isUndefined(idsRaw)) {
          res.status(HTTP_NOT_FOUND).json({});
          return;
        }
        idsRaw = idsRaw.replaceAll("%2C", ",");
        ids = idsRaw.split(",");
      }

      logDebug("handleVisits: GET /api/visits/:", { id, ids });
      if (!isUndefined(id)) {
        visits[id] = data[id];
      } else if (!isUndefined(ids)) {
        ids.forEach((id) => {
          visits[id] = getVisitsPerArticle()[id];
        });
      } else {
        visits = data;
      }

      if (req.url.includes("/top/")) {
        let numberOfTopVisitedArticles = getConfigValue(ConfigKeys.NUMBER_OF_TOP_VISITED_ARTICLES);

        const maxValues = findMaxValues(visits, numberOfTopVisitedArticles);
        logDebug("handleVisits: top 10 visited articles", { maxValues });
        visits = maxValues;
      }

      res.status(HTTP_OK).json(visits);
    }

    if (res.headersSent !== true) {
      next();
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      route: "visitsRoutes",
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

const queryRoutes = (req, res, next) => {
  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");

    if (req.url.includes("/api/")) {
      if (getApiCalls()["/api/"] === undefined) {
        getApiCalls()["/api/"] = 0;
      }
      getApiCalls()["/api/"]++;

      const apiEndpoint = urlEnds.split("?")[0];
      if (getApiCalls()[apiEndpoint] === undefined) {
        getApiCalls()[apiEndpoint] = 0;
      }
      getApiCalls()[apiEndpoint]++;

      const call = `${req.method} ${apiEndpoint} -> ${res.statusCode}`;
      if (getApiRequestsDetails()[call] === undefined) {
        getApiRequestsDetails()[call] = 0;
      }
      getApiRequestsDetails()[call]++;
    } else {
      if (getNonApiCalls()["$non-api-call"] === undefined) {
        getNonApiCalls()["$non-api-call"] = 0;
      }
      getNonApiCalls()["$non-api-call"]++;

      const endpointUrl = req.url;
      if (getNonApiCalls()[endpointUrl] === undefined) {
        getNonApiCalls()[endpointUrl] = 0;
      }
      getNonApiCalls()[endpointUrl]++;

      const call = `${req.method} ${endpointUrl} -> ${res.statusCode}`;
      if (getNonApiRequestsDetails()[call] === undefined) {
        getNonApiRequestsDetails()[call] = 0;
      }
      getNonApiRequestsDetails()[call]++;
    }

    if (req.url.includes("/api/articles") && req.method === "GET") {
      let articleId = getIdFromUrl(urlEnds);

      if (!articleId?.includes("&_") && !articleId?.includes("?") && !isUndefined(articleId) && articleId.length > 0) {
        if (getVisitsPerArticle()[articleId] === undefined) {
          getVisitsPerArticle()[articleId] = 0;
        }

        getVisitsPerArticle()[articleId]++;
        logTrace(`[visits] articleId: "${articleId}" with visits:${getVisitsPerArticle()[articleId]}`);
      }
    } else if (req.url.includes("/api/comments") && req.method === "GET") {
      let commentId = getIdFromUrl(urlEnds);

      if (!commentId?.includes("&_") && !commentId?.includes("?") && !isUndefined(commentId) && commentId.length > 0) {
        if (getVisitsPerComment()[commentId] === undefined) {
          getVisitsPerComment()[commentId] = 0;
        }

        getVisitsPerComment()[commentId]++;
        logTrace(`[visits] commentId: "${commentId}" with visits:${getVisitsPerComment()[commentId]}`);
      }
    } else if (req.url.includes("/api/users") && req.method === "GET") {
      let userId = getIdFromUrl(urlEnds);

      if (!userId?.includes("&_") && !userId?.includes("?") && !isUndefined(userId) && userId.length > 0) {
        if (getVisitsPerUsers()[userId] === undefined) {
          getVisitsPerUsers()[userId] = 0;
        }

        getVisitsPerUsers()[userId]++;
        logTrace(`[visits] userId: "${userId}" with visits:${getVisitsPerUsers()[userId]}`);
      }
    }
    if (res.headersSent !== true) {
      next();
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      route: "queryRoutes",
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

const customRoutes = (req, res, next) => {
  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    if (req.method === "GET" && urlEnds.includes("api/logs")) {
      if (getConfigValue(ConfigKeys.PUBLIC_LOGS_ENABLED)) {
        res.status(HTTP_OK).json({ logs: getLogs() });
      } else {
        res.status(HTTP_OK).json({});
      }
      return;
    }
    if (req.method === "GET" && req.url.endsWith("/db")) {
      const dbData = fullDb();
      res.json(dbData);
      req.body = dbData;
    } else if (req.method === "GET" && req.url.endsWith("/images/user")) {
      const files = getUserAvatars();
      res.json(files);
      req.body = files;
    } else if (req.method === "GET" && req.url.endsWith("/images/posts")) {
      const files = getImagesForArticles();
      res.json(files);
      req.body = files;
    } else if (req.method === "GET" && req.url.endsWith("/languages/translations")) {
      const dbData = translationsDb();
      res.json(dbData);
      req.body = dbData;
    } else if (req.method === "GET" && req.url.includes("/languages/translations/")) {
      let language = getIdFromUrl(urlEnds);
      const dbData = translationsDb();
      const translations = dbData[language] ?? {};
      res.json(translations);
      req.body = translations;
    } else if (req.method === "GET" && req.url.endsWith("/languages")) {
      const languages = getLanguages();
      res.json(languages);
      req.body = languages;
    } else if (req.method === "GET" && req.url.includes("/languages")) {
      res.status(HTTP_NOT_FOUND).json({});
    }
    if (res.headersSent !== true) {
      next();
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      route: "customRoutes",
      error,
      stack: error.stack,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Fatal error. Please contact administrator."));
  }
};

const onlyBackendRoutes = (req, res, next) => {
  if (!getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_ONLY_BACKEND)) {
    next();
  } else if (!req.url.includes("swagger") && !req.url.includes("/tools/") && !req.url.includes("/api/")) {
    return res.redirect("/tools/swagger.html");
  } else {
    next();
  }
};

const homeRoutes = (req, res) => {
  // check if user is logged in, by checking cookie
  let username = req.cookies.username;

  // render the home page
  return res.render("welcome", {
    username,
  });
};

exports.customRoutes = customRoutes;
exports.statsRoutes = statsRoutes;
exports.visitsRoutes = visitsRoutes;
exports.queryRoutes = queryRoutes;
exports.onlyBackendRoutes = onlyBackendRoutes;
exports.homeRoutes = homeRoutes;
