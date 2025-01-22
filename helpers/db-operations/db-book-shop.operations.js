const { areIdsEqual, isStringOnTheList, areStringsEqualIgnoringCase } = require("../compare.helpers");
const {
  booksDb,
  bookShopOrderCouponsDb,
  bookShopBookReviewsDb,
  bookShopAccountsDb,
  bookShopAccountPaymentCardDb,
  bookShopOrdersDb,
  bookShopRolesDb,
  bookShopActionsDb,
  bookShopItemsDb,
  bookShopOrderStatusesDb,
  bookShopAccountPaymentHistoryDb,
} = require("../db.helpers");

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

function searchForPaymentHistory(accountId) {
  const foundPaymentHistory = bookShopAccountPaymentHistoryDb().filter((payment) => {
    if (areIdsEqual(payment["account_id"], accountId)) {
      return payment;
    }
  });
  return foundPaymentHistory;
}

module.exports = {
  searchForBookShopAccount,
  searchForBookShopAccountPaymentCardByAccountId,
  searchForBookShopAccountPaymentCardByCardNumber,
  searchForBookShopAccountWithUserId,
  searchForBookShopOrdersForUser,
  searchForBookShopOrdersWithStatusForUser,
  searchForBookShopActions,
  searchForBookShopItem,
  searchForBookShopItemByBookId,
  searchForBookShopOrder,
  searchForBookShopOrderStatuses,
  searchForBookShopOrderCoupon,
  searchForBookWithId,
  getAllActiveBookShopItems,
  searchForBookShopBookReviews,
  searchForBookShopAccountRole,
  searchForBookShopAccountsWithRoles,
  searchForPaymentHistory,
};
