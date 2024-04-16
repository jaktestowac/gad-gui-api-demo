const { isBugEnabled, getConfigValue, getFeatureFlagConfigValue } = require("../config/config-manager");
const { BugConfigKeys, ConfigKeys, FeatureFlagConfigKeys } = require("../config/enums");
const { isUndefined } = require("../helpers/compare.helpers");
const { getCurrentDateTimeISO } = require("../helpers/datetime.helpers");
const {
  searchForUserWithToken,
  countLikesForArticle,
  countLikesForComment,
  checkIfAlreadyLiked,
  findAllLikes,
  countLikesForAllArticles,
  searchForLike,
} = require("../helpers/db-operation.helpers");
const { getRandomInt } = require("../helpers/generators/random-data.generator");
const {
  formatInvalidTokenErrorResponse,
  formatOnlyOneFieldPossibleErrorResponse,
  findMaxValues,
} = require("../helpers/helpers");
const { logTrace } = require("../helpers/logger-api");
const {
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_METHOD_NOT_ALLOWED,
  HTTP_NOT_FOUND,
  HTTP_OK,
} = require("../helpers/response.helpers");
const { verifyAccessToken, isLikesDataValid } = require("../helpers/validation.helpers");

function handleLikes(req, res, isAdmin) {
  const isFeatureEnabled = getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_LIKES);
  if (!isFeatureEnabled) {
    res.status(HTTP_NOT_FOUND).json({});
    return;
  }

  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method !== "GET" && req.method !== "HEAD" && urlEnds?.includes("/api/likes") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "likes", req.url);
    const foundUser = searchForUserWithToken(req.headers["userid"], verifyTokenResult);

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }
  }

  // user clicked like button:
  if (req.method === "POST" && urlEnds.endsWith("/api/likes")) {
    if (!isLikesDataValid(req.body)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatOnlyOneFieldPossibleErrorResponse(["comment_id", "article_id"]));
      return;
    }

    const user_id = req.body["user_id"];
    const article_id = req.body["article_id"];
    const comment_id = req.body["comment_id"];

    let allLikes = findAllLikes(article_id, comment_id, user_id);
    logTrace("handleLikes: alreadyLiked?", { allLikes, user_id, body: req.body });

    if (isBugEnabled(BugConfigKeys.BUG_LIKES_001)) {
      allLikes = undefined;
    }

    // already liked -> dislike
    if (!isUndefined(allLikes)) {
      req.method = "DELETE";
      req.url = `/api/likes/${allLikes.id}`;

      logTrace("handleLikes: dislike - POST -> DELETE:", {
        method: req.method,
        url: req.url,
        body: req.body,
      });
    } else {
      // if not - like the resource
      req.body["user_id"] = user_id;
      req.body["date"] = getCurrentDateTimeISO();

      logTrace("handleLikes: New like for:", { body: req.body });
    }
    return;
  }

  // TODO: untested:
  if (req.method === "DELETE" && urlEnds.includes("/api/likes/")) {
    const likeId = urlEnds.split("/").slice(-1)[0];
    const like = searchForLike(likeId);

    logTrace("handleLikes: DELETE:", { likeId: like });
    if (isUndefined(like)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const verifyTokenResult = verifyAccessToken(req, res, "likes", req.url);
    const foundUser = searchForUserWithToken(like.user_id, verifyTokenResult);

    logTrace("handleLikes: DELETE: foundUser:", { foundUser });
    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }
  }

  if (req.method === "GET" && urlEnds.includes("/api/likes/article/mylikes")) {
    const articleIdsRaw = urlEnds.split("?id=").slice(-1)[0];
    const user_id = req.headers["userid"];
    if (isUndefined(articleIdsRaw)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const articleIds = articleIdsRaw.split("&id=");

    const likes = {};
    for (let index = 0; index < articleIds.length; index++) {
      const articleId = articleIds[index];
      const alreadyLiked = checkIfAlreadyLiked(articleId, undefined, user_id);
      likes[articleId] = alreadyLiked;
    }
    logTrace("handleLikes: mylikes articles", { articleIds, user_id, likes });
    res.status(HTTP_OK).json({ likes });
    return;
  }

  if (req.method === "GET" && urlEnds.includes("/api/likes/article/")) {
    const articleId = urlEnds.split("/").slice(-1)[0];
    if (isUndefined(articleId)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const likes = countLikesForArticle(articleId);
    logTrace("handleLikes: likes for article", { articleId, likes });
    res.status(HTTP_OK).json({ likes });
    return;
  }

  if (req.method === "GET" && urlEnds.includes("/api/likes/top/articles")) {
    const likes = countLikesForAllArticles();

    let numberOfTopLikedArticles = getConfigValue(ConfigKeys.NUMBER_OF_TOP_LIKED_ARTICLES);

    if (isBugEnabled(BugConfigKeys.BUG_LIKES_002)) {
      numberOfTopLikedArticles = getRandomInt(numberOfTopLikedArticles - 2, numberOfTopLikedArticles + 2);
    }

    const maxValues = findMaxValues(likes, numberOfTopLikedArticles);
    logTrace("handleLikes: top 10 liked articles", { maxValues });
    res.status(HTTP_OK).json({ likes: maxValues });
    return;
  }

  if (req.method === "GET" && urlEnds.includes("/api/likes/articles")) {
    const likes = countLikesForAllArticles();
    logTrace("handleLikes: likes for all articles", { likes });
    res.status(HTTP_OK).json({ likes });
    return;
  }

  if (req.method === "GET" && urlEnds.includes("/api/likes/article?id=")) {
    const articleIdsRaw = urlEnds.split("?id=").slice(-1)[0];
    if (isUndefined(articleIdsRaw)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const articleIds = articleIdsRaw.split("&id=");

    const likes = {};
    for (let index = 0; index < articleIds.length; index++) {
      const articleId = articleIds[index];
      const likesForArticle = countLikesForArticle(articleId);
      logTrace("handleLikes: likes for article", { articleId, likesForArticle });
      likes[articleId] = likesForArticle;
    }
    res.status(HTTP_OK).json({ likes });
    return;
  }

  if (req.method === "GET" && urlEnds.includes("/api/likes/comment/")) {
    const commentId = urlEnds.split("/").slice(-1)[0];
    if (isUndefined(commentId)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const likes = countLikesForComment(commentId);
    logTrace("handleLikes: likes for comment", { commentId, likes });
    res.status(HTTP_OK).send({ likes });
    return;
  }

  if (req.method === "PUT" && urlEnds.includes("/api/likes")) {
    res.status(HTTP_METHOD_NOT_ALLOWED).send({});
    return;
  }

  if (req.method === "PATCH" && urlEnds.includes("/api/likes")) {
    res.status(HTTP_METHOD_NOT_ALLOWED).send({});
    return;
  }

  if (req.method === "DELETE" && urlEnds.includes("/api/likes")) {
    res.status(HTTP_METHOD_NOT_ALLOWED).send({});
    return;
  }

  if (req.method === "GET" && urlEnds.endsWith("/api/likes")) {
    res.status(HTTP_METHOD_NOT_ALLOWED).send({});
    return;
  }

  if (
    req.method === "GET" &&
    urlEnds.includes("/api/likes/") &&
    !urlEnds.includes("/api/likes/comment/") &&
    !urlEnds.includes("/api/likes/article/")
  ) {
    res.status(HTTP_METHOD_NOT_ALLOWED).send({});
    return;
  }

  return;
}

module.exports = {
  handleLikes,
};
