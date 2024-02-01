const { getFeatureFlagConfigValue, isBugEnabled } = require("../config/config-manager");
const { FeatureFlagConfigKeys, BugConfigKeys } = require("../config/enums");
const { isUndefined } = require("../helpers/compare.helpers");
const {
  searchForUserWithOnlyToken,
  checkIfArticlesAlreadyInBookmarks,
  findUserBookmarks,
  searchForArticle,
} = require("../helpers/db-operation.helpers");
const { formatInvalidTokenErrorResponse, formatInvalidEntityErrorResponse } = require("../helpers/helpers");
const { logTrace } = require("../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_OK,
  HTTP_UNPROCESSABLE_ENTITY,
} = require("../helpers/response.helpers");
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

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const articleId = req.body["article_id"];

    let foundArticle = searchForArticle(articleId);

    const bug001Enabled = isBugEnabled(BugConfigKeys.BUG_BOOKMARKS_001);

    if (bug001Enabled === true) {
      // if bug enabled - then article check is disabled - article always exists:
      foundArticle = 1;
    }

    if (isUndefined(foundArticle)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidEntityErrorResponse("article_id"));
      return false;
    }

    let bookmarked = checkIfArticlesAlreadyInBookmarks(articleId, foundUser.id);
    let bookmarks = findUserBookmarks(foundUser.id);
    let bookmark = bookmarks[0];

    const bug002Enabled = isBugEnabled(BugConfigKeys.BUG_BOOKMARKS_002);
    if (bug002Enabled === true) {
      // if bug enabled - then article is never found as bookmarked:
      bookmarked = false;
    }

    const bug003Enabled = isBugEnabled(BugConfigKeys.BUG_BOOKMARKS_003);
    if (bug003Enabled === true) {
      // if bug enabled - then article bookmark is never found:
      bookmark = undefined;
    }

    if (isUndefined(bookmark) && bookmarked === false) {
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

    if (isUndefined(foundUser)) {
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
