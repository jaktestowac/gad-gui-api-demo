const { getFeatureFlagConfigValue } = require("../config/config-manager");
const { FeatureFlagConfigKeys } = require("../config/enums");
const { searchForUserWithToken, searchForArticleWithUserId } = require("../helpers/db-operation.helpers");
const { formatMissingFieldErrorResponse, formatInvalidTokenErrorResponse, formatInvalidFieldErrorResponse } = require("../helpers/helpers");
const { logTrace } = require("../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_UNPROCESSABLE_ENTITY, HTTP_UNAUTHORIZED, HTTP_METHOD_NOT_ALLOWED } = require("../helpers/response.helpers");
const { are_mandatory_fields_present, mandatory_non_empty_fields_labels, mandatory_non_empty_fields_article_labels, are_all_fields_present } = require("../helpers/validation.helpers");

function handleLabels(req, res, isAdmin) {
  const isFeatureEnabled = getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_LABELS);
  if (!isFeatureEnabled) {
    res.status(HTTP_NOT_FOUND).json({});
    return false;
  }

  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method === "DELETE" && urlEnds.endsWith("/api/labels")) {
    res.status(HTTP_METHOD_NOT_ALLOWED).send({});
    return true;
  }

  if (req.method === "GET" && urlEnds.endsWith("/api/labels")) {
    return true;
  }

  if ((req.method === "POST" || req.method === "DELETE" ) && urlEnds.includes("/api/article-labels")) {
    if (!are_mandatory_fields_present(req.body, mandatory_non_empty_fields_article_labels)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_article_labels));
      return false;
    }
    if (!are_all_fields_present(req.body, mandatory_non_empty_fields_article_labels)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(mandatory_non_empty_fields_article_labels));
      return false;
    }
    
    let userId = req.body["user_id"];
    let articleId = req.body["article_id"];
    const foundUser = searchForUserWithToken(userId, verifyTokenResult);
    logTrace("handleArticleLabels: foundUser:", { method: req.method, urlEnds, foundUser, userId });

    if (foundUser === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const foundArticle = searchForArticleWithUserId(articleId, userId)
    logTrace("handleArticleLabels: foundArticle:", { articleId, userId, foundArticle });

    if (foundArticle === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }
    
    return true;
  }

  if (req.method === "POST" && urlEnds.endsWith("/api/labels")) {
    if (!are_mandatory_fields_present(req.body, mandatory_non_empty_fields_labels)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_labels));
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
