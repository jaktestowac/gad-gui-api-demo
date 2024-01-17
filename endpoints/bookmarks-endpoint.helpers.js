const { getFeatureFlagConfigValue } = require("../config/config-manager");
const { FeatureFlagConfigKeys } = require("../config/enums");
const {
  searchForUserWithOnlyToken,
  checkIfArticlesAlreadyInBookmarks,
  findUserBookmarks,
} = require("../helpers/db-operation.helpers");
const { formatInvalidTokenErrorResponse } = require("../helpers/helpers");
const { logTrace } = require("../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED, HTTP_OK } = require("../helpers/response.helpers");
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

    const articleId = req.body["article_id"];
    const bookmarked = checkIfArticlesAlreadyInBookmarks(articleId, foundUser.id);
    const bookmarks = findUserBookmarks(foundUser.id);

    let bookmark = bookmarks[0];

    if (bookmark === undefined && bookmarked === false) {
      req.url = `/api/bookmarks`;
      req.method = "POST";
      bookmark = {
        user_id: foundUser.id,
        article_ids: [articleId],
      };
      req.body = bookmark;
      logTrace("handleBookmark: create a bookmark via POST:", {
        method: req.method,
        url: req.url,
        body: bookmark,
      });
      return;
    }

    req.method = "PUT";
    req.url = `/api/bookmarks/${bookmark.id}`;
    if (bookmarked === true) {
      // already bookmarked -> remove bookmark
      let index = bookmark.article_ids.indexOf(articleId);
      bookmark.article_ids.splice(index, 1);
      req.body = bookmark;
    } else {
      // if not - add bookmark
      bookmark.article_ids.push(articleId);
      req.body = bookmark;
    }
    logTrace("handleBookmark: add bookmark - POST -> PUT:", {
      method: req.method,
      url: req.url,
      body: bookmarks,
    });
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/bookmarks/articles")) {
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleArticleLabels: foundUser:", { method: req.method, urlEnds, foundUser });

    if (foundUser === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }
    const bookmarks = findUserBookmarks(foundUser.id);
    const bookmark = bookmarks[0];
    res.status(HTTP_OK).json({ article_ids: bookmark?.article_ids });
    return;
  }

  if (req.url.includes("/api/bookmarks")) {
    res.status(HTTP_NOT_FOUND).json({});
  }

  return;
}

module.exports = {
  handleBookmarks,
};
