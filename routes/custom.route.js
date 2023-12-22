const {
  fullDb,
  articlesDb,
  commentsDb,
  userDb,
  randomDbEntry,
  getUserAvatars,
  getImagesForArticles,
} = require("../helpers/db.helpers");
const {
  formatErrorResponse,
  getIdFromUrl,
  pluginStatuses,
  parsePublishStats,
  parseArticleStats,
  parseUserStats,
  findMaxValues,
} = require("../helpers/helpers");
const { logError, logDebug, getLogs, logTrace } = require("../helpers/logger-api");
const { HTTP_INTERNAL_SERVER_ERROR, HTTP_OK, HTTP_NOT_FOUND } = require("../helpers/response.helpers");
const { getRandomVisitsForEntities } = require("../helpers/random-data.generator");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");

const visitsPerArticle = getRandomVisitsForEntities(articlesDb(), 50, 500);
const visitsPerComment = getRandomVisitsForEntities(commentsDb(), 10, 50);
const visitsPerUsers = getRandomVisitsForEntities(userDb(), 10, 250);

const customRoutes = (req, res, next) => {
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
    } else if (req.method === "GET" && urlEnds.includes("api/random/article")) {
      const article = randomDbEntry(articlesDb());
      logDebug("Random article:", article);
      res.status(HTTP_OK).json(article);
      return;
    } else if (req.method === "GET" && urlEnds.includes("api/logs")) {
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
    } else if (req.method === "GET" && req.url.endsWith("/pluginstatuses")) {
      res.json(pluginStatuses);
      req.body = pluginStatuses;
    } else if (req.method === "GET" && req.url.includes("/api/visits/")) {
      let data = {};
      let id = undefined;
      let ids = undefined;
      let visits = {};

      if (req.url.includes("/articles")) {
        data = visitsPerArticle;
      } else if (req.url.includes("/comments")) {
        data = visitsPerComment;
      } else if (req.url.includes("/users")) {
        data = visitsPerUsers;
      }

      if (req.url.includes("/articles/") || req.url.includes("/comments/") || req.url.includes("/users/")) {
        id = getIdFromUrl(urlEnds);
      }

      if (req.url.includes("?ids=")) {
        const idsRaw = urlEnds.split("?ids=").slice(-1)[0];
        if (idsRaw === undefined) {
          res.status(HTTP_NOT_FOUND).json({});
          return;
        }
        ids = idsRaw.split(",");
      }

      logDebug("handleVisits: GET /api/visits/:", { id, ids });
      if (id !== undefined) {
        visits[id] = data[id];
      } else if (ids !== undefined) {
        ids.forEach((id) => {
          visits[id] = visitsPerArticle[id];
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
    } else if (req.url.includes("/api/articles") && req.method === "GET") {
      let articleId = getIdFromUrl(urlEnds);

      if (!articleId?.includes("&_") && !articleId?.includes("?") && articleId !== undefined && articleId.length > 0) {
        if (visitsPerArticle[articleId] === undefined) {
          visitsPerArticle[articleId] = 0;
        }

        visitsPerArticle[articleId]++;
        logDebug(`[visits] articleId: "${articleId}" with visits:${visitsPerArticle[articleId]}`);
      }
    } else if (req.url.includes("/api/comments") && req.method === "GET") {
      let commentId = getIdFromUrl(urlEnds);

      if (!commentId?.includes("&_") && !commentId?.includes("?") && commentId !== undefined && commentId.length > 0) {
        if (visitsPerComment[commentId] === undefined) {
          visitsPerComment[commentId] = 0;
        }

        visitsPerComment[commentId]++;
        logDebug(`[visits] commentId: "${commentId}" with visits:${visitsPerComment[commentId]}`);
      }
    } else if (req.url.includes("/api/users") && req.method === "GET") {
      let userId = getIdFromUrl(urlEnds);

      if (!userId?.includes("&_") && !userId?.includes("?") && userId !== undefined && userId.length > 0) {
        if (visitsPerUsers[userId] === undefined) {
          visitsPerUsers[userId] = 0;
        }

        visitsPerUsers[userId]++;
        logDebug(`[visits] userId: "${userId}" with visits:${visitsPerUsers[userId]}`);
      }
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

exports.customRoutes = customRoutes;
