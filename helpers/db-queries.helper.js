const { getCurrentDateTimeISO } = require("./datetime.helpers");
const { logTrace, logDebug } = require("./logger-api");

function setEntitiesInactive(db, tableName, query) {
  const callback = (item) => (item._inactive = true);
  const resultsCallback = (r) => {
    logTrace("SOFT_DELETE: soft deleted (set inactive):", { itemsCount: r.length, tableName, query });
  };

  invokeQuery(db, tableName, query, callback, resultsCallback);
}

function replaceRelatedContactsInDb(db, targetResourceId, resource) {
  logTrace("UPDATE: updating related contacts in db:", { targetResourceId, resource });
  const query = { id: targetResourceId };
  const resultsCallback = (r) => {
    logTrace("UPDATE: related contacts:", { query });
  };

  invokeOverwriteQuery(db, "contacts", query, resource, resultsCallback);
}

async function changeUserFunds(db, accountId, newValue) {
  const query = { id: accountId };
  const callback = (item) => (item.funds = newValue);
  const resultsCallback = (r) => {
    logTrace("UPDATE: book-shop-accounts:", { query, newValue });
  };

  return invokeQuery(db, "book-shop-accounts", query, callback, resultsCallback);
}

async function addBooksToAccount(db, accountId, nameOfList, bookId) {
  const query = { id: accountId };
  const callback = (item) => (item[nameOfList].push(bookId), (item[nameOfList] = [...new Set(item[nameOfList])]));
  const resultsCallback = (r) => {
    logTrace("UPDATE: book-shop-accounts:", { query, accountId, nameOfList, bookId });
  };

  return invokeQuery(db, "book-shop-accounts", query, callback, resultsCallback);
}

async function changeBookShopStockItems(db, itemId, newValue) {
  const query = { id: itemId };
  const callback = (item) => (item.quantity = newValue);
  const resultsCallback = (r) => {
    logTrace("UPDATE: book-shop-items:", { query, newValue });
  };

  return invokeQuery(db, "book-shop-items", query, callback, resultsCallback);
}

function updateMessageCheckTimeInDb(db, userId, resource, contactId) {
  logTrace("UPDATE: updating MessageCheckTime in db:", { userId, resource });
  const query = { user_id: userId };

  invokeGetQuery(db, "message-check", query).then((results) => {
    if (results.length > 0) {
      const callback = (item) => (
        (item.last_check = getCurrentDateTimeISO()),
        item.last_checks === undefined ? (item.last_checks = {}) : (item.last_checks = item.last_checks),
        (item.last_checks[contactId] = getCurrentDateTimeISO())
      );
      invokeQuery(db, "message-check", query, callback);
    } else {
      invokeInsertQuery(db, "message-check", query, resource);
    }
  });
}

async function addCardToDataBase(db, accountId, cardData) {
  const query = { account_id: accountId };

  invokeGetQuery(db, "book-shop-account-payment-cards", query).then((results) => {
    logTrace("Found cards:", { query, results });
    if (results.length > 0) {
      cardData.id = results[0].id;
      invokeDelQuery(db, "book-shop-account-payment-cards", query).then(() => {
        invokeInsertQuery(db, "book-shop-account-payment-cards", query, cardData);
      });
    } else {
      getElementWithMaxId(db, "book-shop-account-payment-cards").then((element) => {
        cardData.id = element.id + 1;
        invokeInsertQuery(db, "book-shop-account-payment-cards", query, cardData);
      });
    }
  });
}

async function invokeInsertQuery(db, tableName, query, obj, resultsCallback = (r) => {}) {
  logTrace("INVOKE_QUERY: invoking Insert query:", { tableName, query, obj });
  return db.get(tableName).push(obj).write().then(resultsCallback);
}

async function invokeDelQuery(db, tableName, query) {
  logTrace("INVOKE_QUERY: invoking DEL query:", { tableName, query });
  return db.get(tableName).remove(query).value();
}

async function invokeGetQuery(db, tableName, query) {
  logTrace("INVOKE_QUERY: invoking GET query:", { tableName, query });
  return db.get(tableName).filter(query).value();
}

async function invokeQuery(db, tableName, query, callback, resultsCallback = (r) => {}) {
  logTrace("INVOKE_QUERY: invoking query:", { tableName, query });
  return db.get(tableName).filter(query).each(callback).write().then(resultsCallback);
}

async function getElementWithMaxId(db, tableName) {
  const getMax = (accumulator, currentValue) => (accumulator.id < currentValue.id ? currentValue : accumulator);
  logTrace("INVOKE_QUERY: getMaxId:", { tableName, getMax });
  return db.get(tableName).reduce(getMax).value();
}

function invokeOverwriteQuery(db, tableName, query, obj, resultsCallback = (r) => {}) {
  logTrace("INVOKE_QUERY: invoking Overwrite query:", { tableName, query, obj });
  db.get(tableName).remove(query).write().then(resultsCallback);
  db.get(tableName).push(obj).write().then(resultsCallback);
}

module.exports = {
  setEntitiesInactive,
  replaceRelatedContactsInDb,
  updateMessageCheckTimeInDb,
  invokeGetQuery,
  changeUserFunds,
  changeBookShopStockItems,
  addBooksToAccount,
  getElementWithMaxId,
  addCardToDataBase,
};
