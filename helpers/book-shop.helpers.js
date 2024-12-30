const { searchForBookShopItemByBookId } = require("./db-operations/db-book-shop.operations");
const { changeBookShopStockItems, changeUserFunds, addBooksToAccount } = require("./db-queries.helper");
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
  changeUserFunds(DatabaseManager.getInstance().getDb(), booksShopAccount.id, newValue);

  logDebug("registerSentOrder: Changing items in stock");
  orderBase.book_ids.forEach((bookId) => {
    const itemBase = searchForBookShopItemByBookId(bookId);
    logTrace("registerSentOrder: Changing items in stock", { bookId, itemBase, newQuantity: itemBase.quantity - 1 });
    changeBookShopStockItems(DatabaseManager.getInstance().getDb(), itemBase.id, itemBase.quantity - 1);
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

module.exports = {
  registerSentOrder,
  registerBookOnAccount,
};
