const { isBugDisabled, isBugEnabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { areIdsEqual, isUndefined } = require("../helpers/compare.helpers");
const { searchForUserWithToken, searchForArticle, searchForUserWithEmail } = require("../helpers/db-operation.helpers");
const { randomDbEntry, articlesDb } = require("../helpers/db.helpers");
const {
  formatInvalidTokenErrorResponse,
  getIdFromUrl,
  formatMissingFieldErrorResponse,
  formatInvalidFieldErrorResponse,
  formatInvalidDateFieldErrorResponse,
  formatErrorResponse,
} = require("../helpers/helpers");
const { logTrace, logDebug } = require("../helpers/logger-api");
const { HTTP_UNAUTHORIZED, HTTP_UNPROCESSABLE_ENTITY, HTTP_NOT_FOUND } = require("../helpers/response.helpers");
const {
  verifyAccessToken,
  areMandatoryFieldsPresent,
  mandatory_non_empty_fields_article,
  all_fields_article,
  areAllFieldsValid,
  validateDateFields,
} = require("../helpers/validation.helpers");

function handleArticles(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (urlEnds?.includes("/api/files/articles/upload") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "files/articles/upload", req.url);
    const foundUser = searchForUserWithToken(req.headers["userid"], verifyTokenResult);

    logTrace("handleArticles:", { method: req.method, urlEnds, foundUser });
    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
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

    if (req.method !== "POST" && req.method !== "PUT") {
      let articleId = req.body["id"];
      if (isUndefined(articleId)) {
        articleId = getIdFromUrl(urlEnds);
      }

      logTrace("handleArticles:", { method: req.method, urlEnds, articleId });

      const foundArticle = searchForArticle(articleId);
      const foundUser = searchForUserWithToken(foundArticle?.user_id, verifyTokenResult);

      logTrace("handleArticles: foundUser and user_id:", { foundUser, user_id: foundArticle?.user_id });

      if (isUndefined(foundUser) && !isUndefined(foundArticle)) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
      if (isUndefined(foundUser) && isUndefined(foundArticle) && req.method === "DELETE") {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
    } else if (req.method === "POST") {
      // method POST:
      const foundUser = searchForUserWithEmail(verifyTokenResult?.email);

      logTrace("handleArticles:", { method: req.method, urlEnds, foundUser });

      if (isUndefined(foundUser)) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
      req.body["user_id"] = foundUser.id;
    } else if (req.method === "PUT") {
      // method PUT:
      const foundUser = searchForUserWithEmail(verifyTokenResult?.email);

      logTrace("handleArticles:", { method: req.method, urlEnds, foundUser });

      if (isUndefined(foundUser)) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
      req.body["user_id"] = foundUser.id;
    }
  }

  // if (req.method === "GET" && urlEnds.includes("/api/articles?ids=")) {
  //   const articleIdsRaw = urlEnds.split("?ids=").slice(-1)[0];
  //   if (articleIdsRaw)) {
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
    if (!areMandatoryFieldsPresent(req.body, mandatory_non_empty_fields_article)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_article));
      return;
    }
    // validate all fields:
    const isValid = areAllFieldsValid(req.body, all_fields_article, mandatory_non_empty_fields_article);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
      return;
    }

    // validate date field:
    const isDateValid = validateDateFields(req.body);
    if (!isDateValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidDateFieldErrorResponse(isDateValid));
      return;
    }

    if (isBugDisabled(BugConfigKeys.BUG_VALIDATION_003)) {
      // remove id - otherwise - 500: Error: Insert failed, duplicate id
      req.body.id = undefined;
    }
    logTrace("handleArticles:POST:", { method: req.method, urlEnds, articleId: req.body.id });
  }

  if (req.method === "PATCH" && urlEnds.includes("/api/articles") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "PATCH articles", req.url);
    let articleId = getIdFromUrl(urlEnds);

    // validate all fields:
    const isValid = areAllFieldsValid(req.body, all_fields_article, mandatory_non_empty_fields_article);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
      return;
    }

    // validate date field:
    const isDateValid = validateDateFields(req.body);
    if (!isDateValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidDateFieldErrorResponse(isDateValid));
      return;
    }

    const foundArticle = searchForArticle(articleId);
    const foundUser = searchForUserWithToken(foundArticle?.user_id, verifyTokenResult);

    logDebug("handleArticles: foundUser and user_id:", { foundUser, user_id: foundArticle?.user_id });

    const bug001Enabled = isBugEnabled(BugConfigKeys.BUG_ARTICLES_001);
    if (bug001Enabled === true) {
      return;
    }

    if (isUndefined(foundArticle)) {
      res.status(HTTP_NOT_FOUND).send({});
      return;
    }

    if (isUndefined(foundUser) && !areIdsEqual(foundUser?.id, foundArticle?.user_id)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return;
    }
  }

  // update or create:
  if (req.method === "PUT" && urlEnds.includes("/api/articles") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "PUT articles", req.url);

    // validate mandatory fields:
    if (!areMandatoryFieldsPresent(req.body, mandatory_non_empty_fields_article)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_article));
      return;
    }

    // validate all fields:
    const isValid = areAllFieldsValid(req.body, all_fields_article, mandatory_non_empty_fields_article);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_article));
      return;
    }

    // validate date field:
    const isDateValid = validateDateFields(req.body);
    if (!isDateValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidDateFieldErrorResponse(isDateValid));
      return;
    }

    let articleId = getIdFromUrl(urlEnds);
    const foundArticle = searchForArticle(articleId);

    const foundUser = searchForUserWithToken(foundArticle?.user_id, verifyTokenResult);

    logDebug("handleArticles: foundUser and user_id:", { articleId, foundUser, user_id: foundArticle?.user_id });

    const bug002Enabled = isBugEnabled(BugConfigKeys.BUG_ARTICLES_002);
    if (bug002Enabled && !isUndefined(foundUser)) {
      foundUser.id = req.body?.user_id;
    }

    if (
      isUndefined(foundUser) && !isUndefined(foundArticle) ||
      (!isUndefined(foundArticle?.user_id) && !isUndefined(foundUser) && !areIdsEqual(foundUser?.id, req.body?.user_id))
    ) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You can not edit articles if You are not an owner"));
      return;
    }

    if (articleId === "articles") {
      articleId = "";
    }

    logTrace("handleArticles:PUT:", { method: req.method, articleId });

    if (isUndefined(foundArticle)) {
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
