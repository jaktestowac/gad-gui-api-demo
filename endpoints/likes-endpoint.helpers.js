const { getCurrentDateTimeISO } = require("../helpers/datetime.helpers");
const {
  searchForUserWithToken,
  countLikesForArticle,
  countLikesForComment,
  checkIfAlreadyLiked,
} = require("../helpers/db-operation.helpers");
const { formatInvalidTokenErrorResponse, formatOnlyOneFieldPossibleErrorResponse } = require("../helpers/helpers");
const { logTrace } = require("../helpers/logger-api");
const {
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_METHOD_NOT_ALLOWED,
  HTTP_NOT_FOUND,
  HTTP_OK,
} = require("../helpers/response.helpers");
const { verifyAccessToken, is_likes_data_valid } = require("../helpers/validation.helpers");

function handleLikes(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method !== "GET" && req.method !== "HEAD" && urlEnds?.includes("/api/likes") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "likes", req.url);
    const foundUser = searchForUserWithToken(req.headers["userid"], verifyTokenResult);

    if (foundUser === undefined || verifyTokenResult === undefined) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }
  }

  // user clicked like button:
  if (req.method === "POST" && urlEnds.endsWith("/api/likes")) {
    if (!is_likes_data_valid(req.body)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatOnlyOneFieldPossibleErrorResponse(["comment_id", "article_id"]));
      return;
    }

    const user_id = req.headers["userid"];
    const article_id = req.body["article_id"];
    const comment_id = req.body["comment_id"];

    const alreadyLiked = checkIfAlreadyLiked(article_id, comment_id, user_id);
    logTrace("handleLikes: alreadyLiked?", { alreadyLiked, user_id, body: req.body });

    if (alreadyLiked === true) {
      // TODO: unlike
      res.status(HTTP_OK).json({});
      return;
    } else {
      req.body["user_id"] = user_id;
      req.body["date"] = getCurrentDateTimeISO();

      logTrace("handleLikes: New like for:", { body: req.body });
    }

    return;
  }

  if (req.method === "GET" && urlEnds.includes("/api/likes/article/mylikes")) {
    const articleIdsRaw = urlEnds.split("?ids=").slice(-1)[0];
    const user_id = req.headers["userid"];
    if (articleIdsRaw === undefined) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const articleIds = articleIdsRaw.split(",");

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
    if (articleId === undefined) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const likes = countLikesForArticle(articleId);
    logTrace("handleLikes: likes for article", { articleId, likes });
    res.status(HTTP_OK).json({ likes });
    return;
  }

  if (req.method === "GET" && urlEnds.includes("/api/likes/article?ids=")) {
    const articleIdsRaw = urlEnds.split("?ids=").slice(-1)[0];
    if (articleIdsRaw === undefined) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const articleIds = articleIdsRaw.split(",");

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
    if (commentId === undefined) {
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
