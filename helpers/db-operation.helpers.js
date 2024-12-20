const { areStringsEqualIgnoringCase, areIdsEqual, isUndefined, isStringOnTheList } = require("./compare.helpers");
const { isDateStringGreaterThan } = require("./datetime.helpers");
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
  contactsDb,
  messagesDb,
  messageCheckDb,
  flashpostsDb,
  bookShopAccountsDb,
  bookShopOrdersDb,
  bookShopActionsDb,
  bookShopAccountPaymentCardDb,
  bookShopItemsDb,
  bookShopOrderStatusesDb,
  bookShopOrderCouponsDb,
  booksDb,
  bookShopBookReviewsDb,
  bookShopRolesDb,
} = require("./db.helpers");

// Users

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

// Articles

function searchForArticle(articleId) {
  const foundArticle = articlesDb().find((article) => {
    if (areIdsEqual(article["id"], articleId)) {
      return article;
    }
  });
  return foundArticle;
}

function searchForArticlesWithTitle(title) {
  const foundArticles = articlesDb().filter((article) => {
    if (areStringsEqualIgnoringCase(article["title"], title)) {
      return article;
    }
  });
  return foundArticles;
}

function searchForArticlesWithTitleWithoutId(title, id) {
  const foundArticles = articlesDb().filter((article) => {
    if (areStringsEqualIgnoringCase(article["title"], title) && !areIdsEqual(article["id"], id)) {
      return article;
    }
  });
  return foundArticles;
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

// Comments

function searchForComment(commentId) {
  const foundComment = commentsDb().find((comment) => {
    if (areIdsEqual(comment["id"], commentId)) {
      return comment;
    }
  });
  return foundComment;
}

function searchForCommentsByArticleId(articleId) {
  const foundComment = commentsDb().find((comment) => {
    if (areIdsEqual(comment["article_id"], articleId)) {
      return comment;
    }
  });
  return foundComment;
}

function softDeleteCommentsByArticleId(articleId) {
  let amount = 0;
  const comments = commentsDb().map((comment) => {
    if (areIdsEqual(comment["article_id"], articleId)) {
      comment["_inactive"] = true;
      amount++;
    }
  });
  return amount;
}

// Labels

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

// Likes

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

function searchForMessageCheckByUserId(userId) {
  const foundCheck = messageCheckDb().find((check) => {
    if (areIdsEqual(check["user_id"], userId)) {
      return check;
    }
  });
  return foundCheck;
}

function searchForMessageCheckById(id) {
  const foundCheck = messageCheckDb().find((check) => {
    if (areIdsEqual(check["id"], id)) {
      return check;
    }
  });
  return foundCheck;
}

function searchForContactsByUserId(userId) {
  const foundContacts = contactsDb().find((contact) => {
    if (areIdsEqual(contact["user_id"], userId)) {
      return contact;
    }
  });
  return foundContacts;
}

function searchForContactsById(id) {
  const foundContacts = contactsDb().find((contact) => {
    if (areIdsEqual(contact["id"], id)) {
      return contact;
    }
  });
  return foundContacts;
}

function searchForMessagesByUserId(userId) {
  const foundMessages = messagesDb().filter((message) => {
    if (areIdsEqual(message["from"], userId) || areIdsEqual(message["to"], userId)) {
      return message;
    }
  });
  return foundMessages;
}

function searchForMessagesSentToUserId(userId) {
  const foundMessages = messagesDb().filter((message) => {
    if (areIdsEqual(message["to"], userId)) {
      return message;
    }
  });
  return foundMessages;
}

function searchForMessagesByBothUserIds(userId1, userId2) {
  const foundMessages = messagesDb().filter((message) => {
    if (
      (areIdsEqual(message["from"], userId1) && areIdsEqual(message["to"], userId2)) ||
      (areIdsEqual(message["from"], userId2) && areIdsEqual(message["to"], userId1))
    ) {
      return message;
    }
  });
  return foundMessages;
}

function getMessagesWithIdGreaterThan(messages, id) {
  const foundMessages = messages.filter((message) => {
    return message["id"] > id;
  });
  return foundMessages ?? [];
}

function getMessagesWithDateGreaterThan(messages, date) {
  const foundMessages = messages.filter((message) => {
    return isDateStringGreaterThan(message["date"], date);
  });
  return foundMessages;
}

function getNumberOfUnreadIncomingMessages(messages, userId, date, datePerUserId) {
  const foundAllMessages = messages.filter((message) => {
    if (areIdsEqual(message["to"], userId) && isDateStringGreaterThan(message["date"], date)) {
      return message;
    }
  });
  return { foundAllMessages };
}

function getUnreadMessagesPerUser(messages, userLastCheck, userId) {
  const lastChecks = userLastCheck?.last_checks || {};

  const unreadMessages = messages.filter((message) => {
    const fromUserId = message.from.toString();
    const lastCheckDate = lastChecks[fromUserId];
    return !areIdsEqual(message["from"], userId) && (!lastCheckDate || message.date > lastCheckDate);
  });

  const unreadMessagesPerUser = {};

  unreadMessages.forEach((message) => {
    const recipientId = message.from.toString();
    if (!unreadMessagesPerUser[recipientId]) {
      unreadMessagesPerUser[recipientId] = 1;
    } else {
      unreadMessagesPerUser[recipientId]++;
    }
  });

  // const allUnreadMessages = messages.filter((message) => {
  //   if (areIdsEqual(message["to"], userId) && isDateStringGreaterThan(message["date"], userLastCheck.last_check)) {
  //     return message;
  //   }
  // });

  const totalSumFromValues = Object.values(unreadMessagesPerUser).reduce((acc, value) => acc + value, 0);

  return { allUnreadMessages: totalSumFromValues, unreadMessagesPerUser };
}

function getAllFlashposts() {
  return flashpostsDb();
}

function getAllPublicFlashposts() {
  return flashpostsDb().filter((flashpost) => flashpost["is_public"]);
}

function getFlashpostWithId(id) {
  return flashpostsDb().find((flashpost) => areIdsEqual(flashpost["id"], id));
}

function searchForBookShopAccount(profileId) {
  const foundBookShopAccount = bookShopAccountsDb().find((user) => {
    if (areIdsEqual(user["id"], profileId)) {
      return user;
    }
  });
  return foundBookShopAccount;
}

function searchForBookShopAccountRole(roleId) {
  const foundRole = bookShopRolesDb().find((role) => {
    if (areIdsEqual(role["id"], roleId)) {
      return role;
    }
  });
  return foundRole;
}

function searchForBookShopAccountPaymentCardByAccountId(accountId) {
  const foundCard = bookShopAccountPaymentCardDb().find((card) => {
    if (areIdsEqual(card["account_id"], accountId)) {
      return card;
    }
  });
  return foundCard;
}

function searchForBookShopAccountPaymentCardByCardNumber(cardNumber) {
  const foundCard = bookShopAccountPaymentCardDb().find((card) => {
    if (areStringsEqualIgnoringCase(card["card_number"], cardNumber)) {
      return card;
    }
  });

  return foundCard;
}

function searchForBookShopAccountWithUserId(userId) {
  const foundBookShopAccount = bookShopAccountsDb().find((user) => {
    if (areIdsEqual(user["user_id"], userId)) {
      return user;
    }
  });
  return foundBookShopAccount;
}

function searchForBookShopOrdersForUser(userId) {
  const foundBookShopOrders = bookShopOrdersDb().filter((order) => {
    if (areIdsEqual(order["user_id"], userId)) {
      return order;
    }
  });
  return foundBookShopOrders;
}

function searchForBookShopOrdersWithStatusForUser(userId, orderStatusId) {
  const foundBookShopOrders = bookShopOrdersDb().filter((order) => {
    if (areIdsEqual(order["user_id"], userId) && areIdsEqual(order["status_id"], orderStatusId)) {
      return order;
    }
  });
  return foundBookShopOrders;
}

function searchForBookShopActions(actionName) {
  const foundBookShopAction = bookShopActionsDb().find((action) => {
    if (areStringsEqualIgnoringCase(action?.name, actionName)) {
      return action;
    }
  });
  return foundBookShopAction;
}

function searchForBookShopItem(itemId) {
  const foundBookShopItem = bookShopItemsDb().find((item) => {
    if (areIdsEqual(item["id"], itemId) && item._inactive !== true) {
      return item;
    }
  });
  return foundBookShopItem;
}

function searchForBookShopItemByBookId(bookId) {
  const foundBookShopItem = bookShopItemsDb().find((item) => {
    if (areIdsEqual(item["book_id"], bookId) && item._inactive !== true) {
      return item;
    }
  });
  return foundBookShopItem;
}

function searchForBookShopOrder(orderId) {
  const foundBookShopOrder = bookShopOrdersDb().find((order) => {
    if (areIdsEqual(order["id"], orderId)) {
      return order;
    }
  });
  return foundBookShopOrder;
}

function searchForBookShopOrderStatuses(statusId) {
  const foundStatus = bookShopOrderStatusesDb().find((status) => {
    if (areIdsEqual(status["id"], statusId)) {
      return status;
    }
  });
  return foundStatus;
}

function searchForBookShopOrderCoupon(couponCode) {
  const foundCoupon = bookShopOrderCouponsDb().find((coupon) => {
    if (coupon["coupon_code"] === couponCode) {
      return coupon;
    }
  });
  return foundCoupon;
}

function searchForBookWithId(bookId) {
  const foundBook = booksDb().find((book) => {
    if (areIdsEqual(book["id"], bookId)) {
      return book;
    }
  });
  return foundBook;
}

function getAllActiveBookShopItems() {
  return bookShopItemsDb().filter((item) => item._inactive !== true);
}

function searchForBookShopBookReviews(bookId) {
  const foundReviews = bookShopBookReviewsDb().filter((review) => {
    if (areIdsEqual(review["book_id"], bookId)) {
      return review;
    }
  });
  return foundReviews;
}

function searchForBookShopAccountsWithRoles(roleIds) {
  const foundBookShopAccounts = bookShopAccountsDb().filter((account) => {
    if (isStringOnTheList(account["role_id"], roleIds)) {
      return account;
    }
  });
  return foundBookShopAccounts;
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
  searchForCommentsByArticleId,
  softDeleteCommentsByArticleId,
  searchForContactsByUserId,
  searchForMessagesByUserId,
  searchForMessagesByBothUserIds,
  getMessagesWithIdGreaterThan,
  getMessagesWithDateGreaterThan,
  searchForMessageCheckByUserId,
  searchForMessageCheckById,
  searchForContactsById,
  getUnreadMessagesPerUser,
  searchForMessagesSentToUserId,
  searchForArticlesWithTitle,
  searchForArticlesWithTitleWithoutId,
  getAllFlashposts,
  getAllPublicFlashposts,
  getFlashpostWithId,
  searchForBookShopAccount,
  searchForBookShopAccountWithUserId,
  searchForBookShopOrdersForUser,
  searchForBookShopOrdersWithStatusForUser,
  searchForBookShopActions,
  searchForBookShopAccountPaymentCardByAccountId,
  searchForBookShopItem,
  searchForBookShopItemByBookId,
  searchForBookShopOrderStatuses,
  searchForBookShopOrderCoupon,
  searchForBookWithId,
  searchForBookShopOrder,
  searchForBookShopAccountPaymentCardByCardNumber,
  getAllActiveBookShopItems,
  searchForBookShopBookReviews,
  searchForBookShopAccountsWithRoles,
  searchForBookShopAccountRole,
};
