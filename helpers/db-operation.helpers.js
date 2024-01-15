const { userDb, articlesDb, commentsDb, likesDb, articleLabelsDb, gamesDb, scoresDb } = require("./db.helpers");

function searchForUserWithToken(userId, verifyTokenResult) {
  const foundUser = userDb().find((user) => {
    if (user["id"]?.toString() === userId?.toString() && user["email"] === verifyTokenResult?.email) {
      return user;
    }
  });
  return foundUser;
}

function searchForUserWithOnlyToken(verifyTokenResult) {
  const foundUser = userDb().find((user) => {
    if (user["email"] === verifyTokenResult?.email) {
      return user;
    }
  });
  return foundUser;
}

function searchForUser(userId) {
  const foundUser = userDb().find((user) => {
    if (user["id"]?.toString() === userId?.toString()) {
      return user;
    }
  });
  return foundUser;
}

function searchForUserWithEmail(email) {
  const foundUser = userDb().find((user) => {
    if (user["email"]?.toString() === email?.toString()) {
      return user;
    }
  });
  return foundUser;
}

function searchForArticle(articleId) {
  const foundArticle = articlesDb().find((article) => {
    if (article["id"]?.toString() === articleId?.toString()) {
      return article;
    }
  });
  return foundArticle;
}

function searchForArticleWithUserId(articleId, userId) {
  const foundArticle = articlesDb().find((article) => {
    if (article["id"]?.toString() === articleId?.toString() && article["user_id"]?.toString() === userId?.toString()) {
      return article;
    }
  });
  return foundArticle;
}

function searchForArticles(articleIds) {
  const articleIdsStr = articleIds.filter((id) => id.toString());

  const foundArticles = articlesDb().filter((article) => articleIdsStr.includes(article["id"]?.toString()));
  return foundArticles;
}

function searchForComment(commentId) {
  const foundComment = commentsDb().find((comment) => {
    if (comment["id"]?.toString() === commentId?.toString()) {
      return comment;
    }
  });
  return foundComment;
}

function searchForArticleLabels(articleId) {
  const foundLabels = articleLabelsDb().find((label) => {
    if (label["article_id"]?.toString() === articleId?.toString()) {
      return label;
    }
  });
  return foundLabels;
}

function filterArticlesByLabel(articleIds, labelId) {
  const foundArticlesIds = articleIds.find((articleId) => {
    const foundLabels = articleLabelsDb().find((label) => {
      const ids = label["label_ids"].map((id) => id.toString());

      return label["article_id"]?.toString() === articleId?.toString() && ids.includes(labelId.toString());
    });
    return foundLabels.length > 0;
  });
  return foundArticlesIds;
}

function countLikesForAllArticles() {
  const foundLikes = {};
  likesDb().filter((like) => {
    const id = like["article_id"]?.toString();
    if (id !== undefined) {
      if (foundLikes[id] === undefined) {
        foundLikes[id] = 0;
      }
      foundLikes[id] += 1;
    }
  });
  return foundLikes;
}

function searchForLike(likeId) {
  const foundLike = commentsDb().find((like) => {
    if (like["id"]?.toString() === likeId?.toString()) {
      return like;
    }
  });
  return foundLike;
}

function countLikesForArticle(articleId) {
  const foundLikes = likesDb().filter((like) => {
    return like["article_id"]?.toString() === articleId?.toString();
  });
  return foundLikes.length;
}

function findAllLikes(articleId, commentId, userId) {
  const foundLikes = likesDb().find((like) => {
    return (
      ((like["article_id"]?.toString() === articleId?.toString() && articleId !== undefined) ||
        (like["article_id"] === undefined && articleId === undefined)) &&
      ((like["comment_id"]?.toString() === commentId?.toString() && commentId !== undefined) ||
        (like["comment_id"] === undefined && commentId === undefined)) &&
      like["user_id"]?.toString() === userId?.toString()
    );
  });
  return foundLikes;
}

function checkIfAlreadyLiked(articleId, commentId, userId) {
  const foundLikes = findAllLikes(articleId, commentId, userId);
  return foundLikes !== undefined;
}

function countLikesForComment(commentId) {
  const foundLikes = likesDb().filter((like) => {
    return like["comment_id"]?.toString() === commentId?.toString();
  });
  return foundLikes.length;
}

function getGameByName(name) {
  const foundGame = gamesDb().find((game) => {
    if (game["name"]?.toString().toLowerCase() === name.toLowerCase()) {
      return game;
    }
  });
  return foundGame;
}

function getGameIdByName(name) {
  const foundGame = getGameByName(name);
  return foundGame["id"];
}

function getGameNameById(id) {
  const foundGame = gamesDb().find((game) => {
    if (game["id"]?.toString() === id.toString()) {
      return game;
    }
  });
  return foundGame["name"];
}

function getUserScore(userId, gameId) {
  const foundScore = scoresDb().filter(
    (score) => score.game_id.toString() === gameId.toString() && score.user_id.toString() === userId.toString()
  );
  return foundScore;
}

function getGameScores(gameId) {
  const foundScores = scoresDb().filter((score) => score.game_id.toString() === gameId.toString()) || [];
  return foundScores;
}

module.exports = {
  searchForUserWithToken,
  searchForUserWithEmail,
  searchForUser,
  searchForArticle,
  searchForArticleWithUserId,
  searchForArticles,
  searchForComment,
  getGameIdByName,
  getUserScore,
  countLikesForArticle,
  countLikesForComment,
  checkIfAlreadyLiked,
  findAllLikes,
  countLikesForAllArticles,
  searchForLike,
  searchForArticleLabels,
  searchForUserWithOnlyToken,
  filterArticlesByLabel,
  getGameNameById,
  getGameScores,
};
