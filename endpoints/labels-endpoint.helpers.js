const { getFeatureFlagConfigValue } = require("../config/config-manager");
const { FeatureFlagConfigKeys } = require("../config/enums");
const {
  searchForUserWithToken,
  searchForArticleWithUserId,
  searchForArticleLabels,
} = require("../helpers/db-operation.helpers");
const {
  formatMissingFieldErrorResponse,
  formatInvalidTokenErrorResponse,
  formatInvalidFieldErrorResponse,
  getUniqueValues,
  formatTooManyValuesErrorResponse,
} = require("../helpers/helpers");
const { logTrace, logDebug } = require("../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_UNAUTHORIZED,
  HTTP_METHOD_NOT_ALLOWED,
  HTTP_OK,
} = require("../helpers/response.helpers");
const {
  are_mandatory_fields_present,
  mandatory_non_empty_fields_labels,
  mandatory_non_empty_fields_article_labels,
  are_all_fields_present,
  verifyAccessToken,
} = require("../helpers/validation.helpers");

function handleLabels(req, res, isAdmin) {
  const isFeatureEnabled = getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_LABELS);
  if (!isFeatureEnabled) {
    res.status(HTTP_NOT_FOUND).json({});
    return false;
  }
  const verifyTokenResult = verifyAccessToken(req, res, "labels", req.url);

  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method === "DELETE" && urlEnds.endsWith("/api/labels") && !isAdmin) {
    res.status(HTTP_METHOD_NOT_ALLOWED).send({});
    return false;
  }

  // get labels
  if (req.method === "GET" && urlEnds.endsWith("/api/labels")) {
    return true;
  }

  // get article labels
  if (req.method === "GET" && urlEnds.includes("/api/article-labels/articles/")) {
    const articleId = urlEnds.split("/").slice(-1)[0];
    const foundArticle = searchForArticleLabels(articleId);
    logDebug("article-labels/articles:", articleId, foundArticle);
    if (foundArticle === undefined) {
      res.status(HTTP_NOT_FOUND).send({});
      return false;
    }
    res.status(HTTP_OK).send(foundArticle);
    return true;
  }

  // get article labels via query
  if (req.method === "GET" && urlEnds.includes("/api/article-labels/articles?id=")) {
    const articleIdsRaw = urlEnds.split("?id=").slice(-1)[0];
    const user_id = req.headers["userid"];
    if (articleIdsRaw === undefined) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const articleIds = articleIdsRaw.split("&id=");

    const labels = {};
    for (let index = 0; index < articleIds.length; index++) {
      const articleId = articleIds[index];
      const foundLabels = searchForArticleLabels(articleId);
      if (foundLabels !== undefined) {
        labels[articleId] = foundLabels;
      }
    }
    logTrace("handleLabels: labels articles", { articleIds, user_id, labels });
    res.status(HTTP_OK).json({ labels });
    return true;
  }

  if (
    (req.method === "PATCH" || req.method === "DELETE" || req.method === "POST") &&
    urlEnds.endsWith("/api/article-labels")
  ) {
    res.status(HTTP_METHOD_NOT_ALLOWED).send({});
    return false;
  }

  // create or remove labels for articles
  if (req.method === "PUT" && urlEnds.includes("/api/article-labels")) {
    let userId = req.body["user_id"];
    let articleId = req.body["article_id"];
    const foundUser = searchForUserWithToken(userId, verifyTokenResult);
    logTrace("handleArticleLabels: foundUser:", { method: req.method, urlEnds, foundUser, userId });

    if (foundUser === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const foundArticle = searchForArticleWithUserId(articleId, userId);
    logTrace("handleArticleLabels: foundArticle:", { articleId, userId, foundArticle });

    if (foundArticle === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    if (!are_mandatory_fields_present(req.body, mandatory_non_empty_fields_article_labels)) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_article_labels));
      return false;
    }
    if (!are_all_fields_present(req.body, mandatory_non_empty_fields_article_labels)) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .send(formatInvalidFieldErrorResponse(mandatory_non_empty_fields_article_labels));
      return false;
    }

    const foundLabels = searchForArticleLabels(articleId);

    if (foundLabels !== undefined) {
      const labelIds = req.body.label_ids ?? [];

      req.body.label_ids = getUniqueValues(foundLabels.label_ids.concat(labelIds));
    }

    if (req.body.label_ids.length > 3) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatTooManyValuesErrorResponse("labels"));
      return false;
    }

    return true;
  }

  if (req.method === "POST" && urlEnds.endsWith("/api/labels")) {
    if (!are_mandatory_fields_present(req.body, mandatory_non_empty_fields_labels)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_labels));
      return false;
    }

    if (req.body?.name?.length > 12) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(mandatory_non_empty_fields_labels));
      return false;
    }

    let userId = req.body["user_id"];
    const foundUser = searchForUserWithToken(userId, verifyTokenResult);
    logTrace("handleLabels:", { method: req.method, urlEnds, foundUser, userId });

    if (foundUser === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    return true;
  }

  return true;
}

module.exports = {
  handleLabels,
};
