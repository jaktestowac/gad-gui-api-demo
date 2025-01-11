const { getCurrentDateTimeISO } = require("./datetime.helpers");
const { searchForBookShopItemByBookId } = require("./db-operations/db-book-shop.operations");
const {
  changeBookShopStockItems,
  changeUserFunds,
  addBooksToAccount,
  insertPaymentEntryToPaymentHistory,
} = require("./db-queries.helper");
const DatabaseManager = require("./db.manager");
const { logDebug, logTrace } = require("./logger-api");

function registerSentOrder(booksShopAccount, orderBase, currentOrderStatus, newStatusId) {
  const newValue = booksShopAccount.funds - orderBase.total_cost;
  logDebug("registerSentOrder: Changing funds", {
    funds: booksShopAccount.funds,
    newFunds: newValue,
    total_cost: orderBase.total_cost,
    currentOrderStatus,
    newStatusId,
  });
  changeUserFunds(DatabaseManager.getInstance().getDb(), booksShopAccount.id, newValue).then((r) => {
    registerPaymentInBookShopPaymentHistory({
      accountId: booksShopAccount.id,
      activityType: "payment",
      balanceBefore: booksShopAccount.funds,
      balanceAfter: newValue,
      orderId: orderBase.id,
      amount: orderBase.total_cost,
    });
  });

  logDebug("registerSentOrder: Changing items in stock");
  orderBase.book_ids.forEach((bookId) => {
    const itemBase = searchForBookShopItemByBookId(bookId);
    logTrace("registerSentOrder: Changing items in stock", { bookId, itemBase, newQuantity: itemBase.quantity - 1 });
    changeBookShopStockItems(DatabaseManager.getInstance().getDb(), itemBase.id, itemBase.quantity - 1);
  });
}

function registerOrderReturn(booksShopAccount, orderBase, currentOrderStatus, newStatusId) {
  const newValue = booksShopAccount.funds + orderBase.total_cost;
  logDebug("registerOrderReturn: Changing funds", {
    funds: booksShopAccount.funds,
    newFunds: newValue,
    total_cost: orderBase.total_cost,
    currentOrderStatus,
    newStatusId,
  });
  changeUserFunds(DatabaseManager.getInstance().getDb(), booksShopAccount.id, newValue).then((r) => {
    registerPaymentInBookShopPaymentHistory({
      accountId: booksShopAccount.id,
      activityType: "refund",
      balanceBefore: booksShopAccount.funds,
      balanceAfter: newValue,
      orderId: orderBase.id,
      amount: orderBase.total_cost,
    });
  });

  logDebug("registerOrderReturn: Changing items in stock");
  orderBase.book_ids.forEach((bookId) => {
    const itemBase = searchForBookShopItemByBookId(bookId);
    logTrace("registerOrderReturn: Changing items in stock", { bookId, itemBase, newQuantity: itemBase.quantity + 1 });
    changeBookShopStockItems(DatabaseManager.getInstance().getDb(), itemBase.id, itemBase.quantity + 1);
  });
}

function registerBookOnAccount(booksShopAccount, bookId, listName = "purchased_book_ids") {
  logDebug("registerBookOnAccount: Adding books", {
    account_id: booksShopAccount.id,
    bookId,
    listName,
  });
  addBooksToAccount(DatabaseManager.getInstance().getDb(), booksShopAccount.id, listName, bookId);
}

const defaultPaymentDetails = {
  paymentMethod: "credit_card",
  amount: 50.0,
  currency: "PLN",
  status: "completed",
};

const defaultPaymentHistoryEntry = {
  id: NaN,
  account_id: NaN,
  date: "2025-01-01T00:00:00.000Z",
  activityType: "payment",
  balanceBefore: NaN,
  balanceAfter: NaN,
  order_id: null,
  paymentDetails: { ...defaultPaymentDetails },
};

function registerPaymentInBookShopPaymentHistory({
  accountId,
  activityType,
  balanceBefore,
  balanceAfter,
  orderId,
  paymentMethod,
  amount,
  currency,
  status,
}) {
  if (!accountId) {
    throw new Error("registerPaymentInBookShopPaymentHistory: accountId is required");
  }

  const paymentDetails = {
    paymentMethod: paymentMethod || defaultPaymentDetails.paymentMethod,
    amount: amount || defaultPaymentDetails.amount,
    currency: currency || defaultPaymentDetails.currency,
    status: status || defaultPaymentDetails.status,
    order_id: orderId || null,
  };

  const paymentHistory = {
    account_id: accountId,
    date: getCurrentDateTimeISO(),
    activityType: activityType || defaultPaymentHistoryEntry.activityType,
    balanceBefore: balanceBefore || defaultPaymentHistoryEntry.balanceBefore,
    balanceAfter: balanceAfter || defaultPaymentHistoryEntry.balanceAfter,
    paymentDetails,
  };

  insertPaymentEntryToPaymentHistory(DatabaseManager.getInstance().getDb(), paymentHistory);
  return paymentHistory;
}

module.exports = {
  registerSentOrder,
  registerBookOnAccount,
  registerOrderReturn,
  registerPaymentInBookShopPaymentHistory,
};
