const { isBugDisabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { searchForUserWithToken, searchForArticle, searchForArticles } = require("../helpers/db-operation.helpers");
const { randomDbEntry, articlesDb } = require("../helpers/db.helpers");
const {
  formatInvalidTokenErrorResponse,
  getIdFromUrl,
  formatMissingFieldErrorResponse,
  formatInvalidFieldErrorResponse,
} = require("../helpers/helpers");
const { logTrace, logWarn, logDebug } = require("../helpers/logger-api");
const { HTTP_UNAUTHORIZED, HTTP_UNPROCESSABLE_ENTITY } = require("../helpers/response.helpers");
const {
  verifyAccessToken,
  are_mandatory_fields_present,
  mandatory_non_empty_fields_article,
  all_fields_article,
  are_all_fields_valid,
} = require("../helpers/validation.helpers");

function handleArticles(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (urlEnds?.includes("/api/files/articles/upload") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "files/articles/upload", req.url);
    const foundUser = searchForUserWithToken(req.headers["userid"], verifyTokenResult);

    logTrace("handleArticles:", { method: req.method, urlEnds, foundUser });
    if (foundUser === undefined || verifyTokenResult === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return;
    }

    return;
  }

  if (req.method === "GET" && urlEnds?.includes("/api/random/article")) {
    const randomArticle = randomDbEntry(articlesDb());

    req.method = "GET";
    req.url = `/api/articles/${randomArticle.id}`;
    logTrace("handleArticles:GET -> GET:", {
      method: req.method,
      url: req.url,
      body: req.body,
    });

    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD" && urlEnds?.includes("/api/articles") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "articles", req.url);

    if (req.method !== "POST") {
      let articleId = req.body["id"];
      if (articleId === undefined) {
        articleId = getIdFromUrl(urlEnds);
      }

      logTrace("handleArticles:", { method: req.method, urlEnds, articleId });

      const foundArticle = searchForArticle(articleId);
      const foundUser = searchForUserWithToken(foundArticle?.user_id, verifyTokenResult);

      logTrace("handleArticles: foundUser and user_id:", { foundUser, user_id: foundArticle?.user_id });

      if (foundUser === undefined && foundArticle !== undefined) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
      if (foundUser === undefined && foundArticle === undefined && req.method === "DELETE") {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
    } else {
      let userId = req.body["user_id"];

      if (userId === undefined) {
        logWarn("User ID is not defined", { method: req.method, url: req.url, userIdInHeader: req.headers["userid"] });
        userId = req.headers["userid"];
      }

      const foundUser = searchForUserWithToken(userId, verifyTokenResult);

      logTrace("handleArticles:", { method: req.method, urlEnds, foundUser, userId });

      if (foundUser === undefined) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
    }
  }

  // if (req.method === "GET" && urlEnds.includes("/api/articles?ids=")) {
  //   const articleIdsRaw = urlEnds.split("?ids=").slice(-1)[0];
  //   if (articleIdsRaw === undefined) {
  //     res.status(HTTP_NOT_FOUND).json({});
  //     return;
  //   }

  //   const articleIds = articleIdsRaw.split(",");
  //   const foundArticles = searchForArticles(articleIds);
  //   res.status(HTTP_OK).json(foundArticles);
  //   return;
  // }

  if (req.method === "POST" && urlEnds.includes("/api/articles") && !urlEnds.includes("/upload") && !isAdmin) {
    // validate mandatory fields:
    if (!are_mandatory_fields_present(req.body, mandatory_non_empty_fields_article)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_article));
      return;
    }
    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_article, mandatory_non_empty_fields_article);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
      return;
    }

    if (isBugDisabled(BugConfigKeys.BUG_VALIDATION_003)) {
      // remove id - otherwise - 500: Error: Insert failed, duplicate id
      req.body.id = undefined;
    }
    logTrace("handleArticles:POST:", { method: req.method, urlEnds, articleId: req.body.id });
  }

  if (req.method === "PATCH" && urlEnds.includes("/api/articles") && !isAdmin) {
    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_article, mandatory_non_empty_fields_article);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
      return;
    }
  }

  if (req.method === "PUT" && urlEnds.includes("/api/articles") && !isAdmin) {
    // validate mandatory fields:
    if (!are_mandatory_fields_present(req.body, mandatory_non_empty_fields_article)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_article));
      return;
    }
    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_article, mandatory_non_empty_fields_article);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
      return;
    }

    let articleId = getIdFromUrl(urlEnds);
    const foundArticle = searchForArticle(articleId);

    if (articleId === "articles") {
      articleId = "";
    }

    logTrace("handleArticles:PUT:", { method: req.method, articleId });

    if (foundArticle === undefined) {
      req.method = "POST";
      req.url = "/api/articles";
      req.body.id = undefined;
      logTrace("handleArticles:PUT -> POST:", {
        method: req.method,
        url: req.url,
        body: req.body,
      });
    }
  }

  return;
}

module.exports = {
  handleArticles,
};
