const { isUndefined } = require("lodash");
const { searchForUserWithOnlyToken } = require("../../helpers/db-operation.helpers");
const { formatErrorResponse, formatInvalidTokenErrorResponse } = require("../../helpers/helpers");
const { logDebug, logTrace } = require("../../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED, HTTP_OK } = require("../../helpers/response.helpers");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { isStringOnTheList } = require("../../helpers/compare.helpers");
const { bookShopOrdersDb, bookShopItemsDb } = require("../../helpers/db.helpers");
const {
  searchForBookShopAccountWithUserId,
  searchForBookShopActions,
} = require("../../helpers/db-operations/db-book-shop.operations");

function handleBookShopOrdersStats(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.includes("/api/book-shop-stats")) {
    /*
    Provides comprehensive shop statistics
    - Calculates sales metrics and trends
    - Aggregates order and customer data
    - Tracks inventory movements
    - Generates performance reports
    - Analyzes user purchasing patterns
    - Monitors financial indicators
    */
    // validate account
    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logTrace("handleBookShopOrdersStats: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (booksShopAccount === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
      return false;
    }

    // validate role
    const action = searchForBookShopActions("view-stats");
    logDebug("handleBookShopOrdersStats: possibleRoleIds", { user_role_id: booksShopAccount.role_id, action });

    if (isStringOnTheList(booksShopAccount.role_id, action.role_ids) === false) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User does not have a permission"));
      return false;
    }

    const orders = bookShopOrdersDb();

    // prepare different statistics: total orders, total items, total amount, total partial costs
    const totalOrders = orders.length;
    let totalBooks = 0;
    let totalBooksSold = 0;
    let totalCost = 0;
    let totalItems = 0;
    let totalPartialCosts = {};
    let totalBooksPerType = {};
    let totalStatusesPerType = {};
    let costsPerUser = {};
    let booksPerUser = {};
    let booksPerUserPerOrderStatus = {};
    let totalItemsPerPrice = {};
    let totalItemsPerQuantity = {};

    orders.forEach((order) => {
      totalBooks += order.book_ids.length;

      if (parseInt(order.status_id) >= 40) {
        totalBooksSold += order.book_ids.length;
      }

      totalCost += order.total_cost;

      Object.keys(order.partial_costs).forEach((item) => {
        if (totalPartialCosts[item] === undefined) {
          totalPartialCosts[item] = 0;
        }
        totalPartialCosts[item] += Math.abs(order.partial_costs[item]);
      });

      order.book_ids.forEach((bookId) => {
        if (totalBooksPerType[bookId] === undefined) {
          totalBooksPerType[bookId] = 0;
        }
        totalBooksPerType[bookId]++;
      });

      if (totalStatusesPerType[order.status_id] === undefined) {
        totalStatusesPerType[order.status_id] = 0;
      }
      totalStatusesPerType[order.status_id]++;

      if (costsPerUser[order.user_id] === undefined) {
        costsPerUser[order.user_id] = 0;
      }
      costsPerUser[order.user_id] += order.total_cost;

      if (booksPerUser[order.user_id] === undefined) {
        booksPerUser[order.user_id] = 0;
      }
      booksPerUser[order.user_id] += order.book_ids.length;

      // items Per User Per OrderStatus
      if (booksPerUserPerOrderStatus[order.user_id] === undefined) {
        booksPerUserPerOrderStatus[order.user_id] = {};
      }
      if (booksPerUserPerOrderStatus[order.user_id][order.status_id] === undefined) {
        booksPerUserPerOrderStatus[order.user_id][order.status_id] = 0;
      }
      booksPerUserPerOrderStatus[order.user_id][order.status_id] += order.book_ids.length;
    });

    const items = bookShopItemsDb();

    items.forEach((item) => {
      if (totalItemsPerPrice[item.price] === undefined) {
        totalItemsPerPrice[item.price] = 0;
      }
      totalItemsPerPrice[item.price]++;
      totalItems++;

      if (totalItemsPerQuantity[item.quantity] === undefined) {
        totalItemsPerQuantity[item.quantity] = 0;
      }
      totalItemsPerQuantity[item.quantity]++;
    });

    if (req.url.includes("/api/book-shop-stats/orders")) {
      const responseBody = {
        totalOrders,
        totalBooks,
        totalBooksSold,
        totalCost,
        totalPartialCosts,
        totalBooksPerType,
        totalStatusesPerType,
      };

      res.status(HTTP_OK).send(responseBody);
      return true;
    } else if (req.url.includes("/api/book-shop-stats/users")) {
      const responseBody = {
        totalOrders,
        totalBooks,
        totalBooksSold,
        totalCost,
        totalItems,
        costsPerUser,
        booksPerUser,
        booksPerUserPerOrderStatus,
      };

      res.status(HTTP_OK).send(responseBody);
      return true;
    } else if (req.url.includes("/api/book-shop-stats/items")) {
      const responseBody = {
        totalOrders,
        totalBooks,
        totalBooksSold,
        totalCost,
        totalItems,
        totalItemsPerPrice,
        totalItemsPerQuantity,
      };

      res.status(HTTP_OK).send(responseBody);
      return true;
    } else if (req.url.includes("/api/book-shop-stats/all")) {
      const responseBody = {
        totalOrders,
        totalBooks,
        totalBooksSold,
        totalCost,
        totalItems,
        totalPartialCosts,
        totalBooksPerType,
        totalStatusesPerType,
        costsPerUser,
        booksPerUser,
        booksPerUserPerOrderStatus,
        totalItemsPerPrice,
        totalItemsPerQuantity,
      };

      res.status(HTTP_OK).send(responseBody);
      return true;
    } else {
      logDebug("handleBookShopOrdersStats: Not Found", { url: req.url, urlEnds });
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
    }
  } else {
    logDebug("handleBookShopOrdersStats: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
  }
  return;
}

module.exports = {
  handleBookShopOrdersStats,
};
