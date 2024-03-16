const { areStringsEqualIgnoringCase, areIdsEqual, isUndefined } = require("./compare.helpers");
const {
  userDb,
  articlesDb,
  commentsDb,
  likesDb,
  articleLabelsDb,
  gamesDb,
  scoresDb,
  bookmarksDb,
  surveyResponsesDb,
} = require("./db.helpers");

function searchForUserWithToken(userId, verifyTokenResult) {
  const foundUser = userDb().find((user) => {
    if (areIdsEqual(user["id"], userId) && areStringsEqualIgnoringCase(user["email"], verifyTokenResult?.email)) {
      return user;
    }
  });
  return foundUser;
}

function searchForUserWithOnlyToken(verifyTokenResult) {
  const foundUser = userDb().find((user) => {
    if (areStringsEqualIgnoringCase(user["email"], verifyTokenResult?.email)) {
      return user;
    }
  });
  return foundUser;
}

function searchForUser(userId) {
  const foundUser = userDb().find((user) => {
    if (areIdsEqual(user["id"], userId)) {
      return user;
    }
  });
  return foundUser;
}

function searchForUserWithEmail(email) {
  const foundUser = userDb().find((user) => {
    if (areStringsEqualIgnoringCase(user["email"], email)) {
      return user;
    }
  });
  return foundUser;
}

function searchForArticle(articleId) {
  const foundArticle = articlesDb().find((article) => {
    if (areIdsEqual(article["id"], articleId)) {
      return article;
    }
  });
  return foundArticle;
}

function searchForArticleWithUserId(articleId, userId) {
  const foundArticle = articlesDb().find((article) => {
    if (areIdsEqual(article["id"], articleId) && areIdsEqual(article["user_id"], userId)) {
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
    if (areIdsEqual(comment["id"], commentId)) {
      return comment;
    }
  });
  return foundComment;
}

function searchForArticleLabels(articleId) {
  const foundLabels = articleLabelsDb().find((label) => {
    if (areIdsEqual(label["article_id"], articleId)) {
      return label;
    }
  });
  return foundLabels;
}

function filterArticlesByLabel(articleIds, labelId) {
  const foundArticlesIds = articleIds.find((articleId) => {
    const foundLabels = articleLabelsDb().find((label) => {
      const ids = label["label_ids"].map((id) => id.toString());

      return areIdsEqual(label["article_id"], articleId) && ids.includes(labelId.toString());
    });
    return foundLabels.length > 0;
  });
  return foundArticlesIds;
}

function countLikesForAllArticles() {
  const foundLikes = {};
  likesDb().filter((like) => {
    const id = like["article_id"]?.toString();
    if (!isUndefined(id)) {
      if (isUndefined(foundLikes[id])) {
        foundLikes[id] = 0;
      }
      foundLikes[id] += 1;
    }
  });
  return foundLikes;
}

function searchForLike(likeId) {
  const foundLike = commentsDb().find((like) => {
    if (areIdsEqual(like["id"], likeId)) {
      return like;
    }
  });
  return foundLike;
}

function countLikesForArticle(articleId) {
  const foundLikes = likesDb().filter((like) => {
    return areIdsEqual(like["article_id"], articleId);
  });
  return foundLikes.length;
}

function findAllLikes(articleId, commentId, userId) {
  const foundLikes = likesDb().find((like) => {
    return (
      ((areIdsEqual(like["article_id"], articleId) && !isUndefined(articleId)) ||
        (isUndefined(like["article_id"]) && isUndefined(articleId))) &&
      ((areIdsEqual(like["comment_id"], commentId) && !isUndefined(commentId)) ||
        (isUndefined(like["comment_id"]) && isUndefined(commentId))) &&
      areIdsEqual(like["user_id"], userId)
    );
  });
  return foundLikes;
}

function checkIfAlreadyLiked(articleId, commentId, userId) {
  const foundLikes = findAllLikes(articleId, commentId, userId);
  return !isUndefined(foundLikes);
}

function countLikesForComment(commentId) {
  const foundLikes = likesDb().filter((like) => {
    return areIdsEqual(like["comment_id"], commentId);
  });
  return foundLikes.length;
}

function getGameByName(name) {
  const foundGame = gamesDb().find((game) => {
    if (areStringsEqualIgnoringCase(game["name"], name)) {
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
    if (areIdsEqual(game["id"], id)) {
      return game;
    }
  });
  return foundGame["name"];
}

function getUserScore(userId, gameId) {
  const foundScore = scoresDb().find(
    (score) => areIdsEqual(score.game_id, gameId) && areIdsEqual(score.user_id, userId)
  );
  return foundScore;
}

function getGameScores(gameId) {
  const foundScores = scoresDb().filter((score) => areIdsEqual(score.game_id, gameId)) || [];
  return foundScores;
}

function checkIfArticlesAlreadyInBookmarks(articleId, userId) {
  const foundBookmarks = findUserBookmarks(userId);
  if (foundBookmarks.length === 0) {
    return false;
  }
  const foundBookmark = foundBookmarks[0];
  const ids = foundBookmark["article_ids"].map((id) => id.toString());
  return ids.includes(articleId?.toString());
}

function findUserBookmarks(userId) {
  const foundBookmark = bookmarksDb().filter((bookmark) => {
    return areIdsEqual(bookmark["user_id"], userId);
  });
  return foundBookmark;
}

function findUserSurveyResponse(userId, responseId) {
  const foundSurveyResponses = surveyResponsesDb().filter((surveyResponse) => {
    return areIdsEqual(surveyResponse["user_id"], userId) && areIdsEqual(surveyResponse["id"], responseId);
  });
  return foundSurveyResponses;
}

function findUserSurveyResponses(userId) {
  const foundSurveyResponses = surveyResponsesDb().filter((surveyResponse) => {
    return areIdsEqual(surveyResponse["user_id"], userId);
  });
  return foundSurveyResponses;
}

function findUserSurveyTypeResponses(userId, type) {
  const foundSurveyResponses = surveyResponsesDb().filter((surveyResponse) => {
    return areIdsEqual(surveyResponse["user_id"], userId) && areIdsEqual(surveyResponse["type"], type);
  });
  return foundSurveyResponses;
}

function aggregateSurveyAnswers(responses, surveyType, keysToSkip = ["Open-Ended Questions"]) {
  const aggregated = {};

  responses.forEach((response) => {
    const answers = response.answers;
    const type = response.type;

    if (areIdsEqual(type, surveyType)) {
      Object.keys(answers).forEach((response) => {
        const responseValues = answers[response];

        if (Array.isArray(responseValues) && !keysToSkip.includes(response)) {
          responseValues.forEach((value) => {
            const responseKey = response.toLowerCase();

            if (!aggregated[responseKey]) {
              aggregated[responseKey] = {};
            }

            const valueKey = value.toLowerCase();

            if (!aggregated[responseKey][valueKey]) {
              aggregated[responseKey][valueKey] = 0;
            }

            aggregated[responseKey][valueKey]++;
          });
        }
      });
    }
  });

  return aggregated;
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
  checkIfArticlesAlreadyInBookmarks,
  findUserBookmarks,
  findUserSurveyResponses,
  findUserSurveyTypeResponses,
  aggregateSurveyAnswers,
  findUserSurveyResponse,
};
