const { getFeatureFlagConfigValue } = require("../config/config-manager");
const { FeatureFlagConfigKeys } = require("../config/enums");
const { searchForUserWithOnlyToken } = require("../helpers/db-operation.helpers");
const { formatInvalidTokenErrorResponse } = require("../helpers/helpers");
const { logTrace } = require("../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_NOT_IMPLEMENTED, HTTP_UNAUTHORIZED } = require("../helpers/response.helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");

function handleBookmarks(req, res, isAdmin) {
  const isFeatureEnabled = getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_USER_BOOKMARK_ARTICLES);
  if (!isFeatureEnabled) {
    res.status(HTTP_NOT_FOUND).json({});
    return;
  }

  const verifyTokenResult = verifyAccessToken(req, res, "bookmarks", req.url);

  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method === "POST" && req.url.includes("/api/bookmarks/articles")) {
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleArticleLabels: foundUser:", { method: req.method, urlEnds, foundUser });

    if (foundUser === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    // TODO: post articles bookmark
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/bookmarks/articles")) {
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleArticleLabels: foundUser:", { method: req.method, urlEnds, foundUser });

    if (foundUser === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    // TODO: get user articles bookmark
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }

  if (req.url.includes("/api/bookmarks")) {
    res.status(HTTP_NOT_IMPLEMENTED).json({});
  }

  return;
}

module.exports = {
  handleBookmarks,
};
