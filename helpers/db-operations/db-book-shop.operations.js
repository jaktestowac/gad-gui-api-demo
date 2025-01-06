const { areIdsEqual, isStringOnTheList, areStringsEqualIgnoringCase } = require("../compare.helpers");
const { insertPaymentEntryToPaymentHistory } = require("../db-queries.helper");
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
} = require("../db.helpers");
const DatabaseManager = require("../db.manager");

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

const defaultPaymentDetails = {
  paymentMethod: "credit_card",
  amount: 50.0,
  currency: "PLN",
  status: "completed",
};

const defaultPaymentHistoryEntry = {
  id: 6,
  account_id: 1,
  date: "2025-01-01T00:00:00.000Z",
  activityType: "payment",
  balanceBefore: NaN,
  balanceAfter: NaN,
  paymentDetails: { ...defaultPaymentDetails, order_id: null },
};

function registerPaymentInBookShopPaymentHistory(
  accountId,
  activityType,
  balanceBefore,
  balanceAfter,
  orderId,
  paymentMethod,
  amount,
  currency,
  status
) {
  const paymentDetails = {
    paymentMethod: paymentMethod || defaultPaymentDetails.paymentMethod,
    amount: amount || defaultPaymentDetails.amount,
    currency: currency || defaultPaymentDetails.currency,
    status: status || defaultPaymentDetails.status,
    order_id: orderId || null,
  };

  const paymentHistory = {
    account_id: accountId,
    date: Date.now(),
    activityType: activityType || defaultPaymentHistoryEntry.activityType,
    balanceBefore: balanceBefore || defaultPaymentHistoryEntry.balanceBefore,
    balanceAfter: balanceAfter || defaultPaymentHistoryEntry.balanceAfter,
    paymentDetails,
  };

  insertPaymentEntryToPaymentHistory(DatabaseManager.getInstance().getDb(), paymentHistory);
  return paymentHistory;
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
  registerPaymentInBookShopPaymentHistory,
};
