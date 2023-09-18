const { fullDb, articlesDb, commentsDb, userDb } = require("../helpers/db.helpers");
const { formatErrorResponse, getIdFromUrl, pluginStatuses } = require("../helpers/helpers");
const { logError, logDebug } = require("../helpers/logger-api");
const { HTTP_INTERNAL_SERVER_ERROR } = require("../helpers/response.helpers");
const fs = require("fs");
const path = require("path");
const { getRandomVisitsForEntities } = require("../helpers/random-data.generator");

const visitsPerArticle = getRandomVisitsForEntities(articlesDb());
const visitsPerComment = getRandomVisitsForEntities(commentsDb());
const visitsPerUsers = getRandomVisitsForEntities(userDb());

const customRoutes = (req, res, next) => {
  try {
    const urlEnds = req.url.replace(/\/\/+/g, "/");
    if (req.method === "GET" && req.url.endsWith("/db")) {
      const dbData = fullDb();
      res.json(dbData);
      req.body = dbData;
    } else if (req.method === "GET" && req.url.endsWith("/images/user")) {
      let files = fs.readdirSync(path.join(__dirname, "../public/data/users"));
      files = files.filter((file) => !file.startsWith("face_"));
      res.json(files);
      req.body = files;
    } else if (req.method === "GET" && req.url.endsWith("/images/posts")) {
      const files = fs.readdirSync(path.join(__dirname, "../public/data/images/256"));
      res.json(files);
      req.body = files;
    } else if (req.method === "GET" && req.url.endsWith("/pluginstatuses")) {
      res.json(pluginStatuses);
      req.body = pluginStatuses;
    } else if (req.method === "GET" && req.url.endsWith("/api/visits/articles")) {
      res.json(visitsPerArticle);
      req.body = visitsPerArticle;
    } else if (req.method === "GET" && req.url.endsWith("/api/visits/comments")) {
      res.json(visitsPerComment);
      req.body = visitsPerComment;
    } else if (req.method === "GET" && req.url.endsWith("/api/visits/users")) {
      res.json(visitsPerUsers);
      req.body = visitsPerUsers;
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
