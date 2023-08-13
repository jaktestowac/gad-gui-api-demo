const { userDb, articlesDb, commentsDb } = require("../db.helper");

function searchForUserWithToken(userId, verifyTokenResult) {
  const foundUser = userDb().find((user) => {
    if (user["id"]?.toString() === userId?.toString() && user["email"] === verifyTokenResult.email) {
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

function searchForComment(commentId) {
  const foundComment = commentsDb().find((comment) => {
    if (comment["id"]?.toString() === commentId?.toString()) {
      return comment;
    }
  });
  return foundComment;
}

module.exports = {
  searchForUserWithToken,
  searchForUserWithEmail,
  searchForUser,
  searchForArticle,
  searchForComment,
};
