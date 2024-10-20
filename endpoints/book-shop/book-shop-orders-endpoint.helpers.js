const { isUndefined } = require("lodash");
const {
  searchForUserWithOnlyToken,
  searchForBookShopAccountWithUserId,
  searchForBookShopOrdersForUser,
  searchForBookShopOrdersWithStatusForUser,
  searchForBookShopItemByBookId,
  searchForBookShopOrderStatusesDb,
} = require("../../helpers/db-operation.helpers");
const { formatErrorResponse, formatInvalidTokenErrorResponse } = require("../../helpers/helpers");
const { logDebug, logTrace } = require("../../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_OK,
  HTTP_CONFLICT,
  HTTP_UNPROCESSABLE_ENTITY,
} = require("../../helpers/response.helpers");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { getCurrentDateTimeISO } = require("../../helpers/datetime.helpers");
const { isStringOnTheList, areIdsEqual } = require("../../helpers/compare.helpers");
const DatabaseManager = require("../../helpers/db.manager");
const { changeUserFunds } = require("../../helpers/db-queries.helper");

function countCostsInOrder(order) {
  order.total_cost = 0;
  if (order.book_ids.length === 0) {
    order.additional_costs = {};
  }
  if (order.additional_costs.shipping === undefined || order.book_ids.length > 0) {
    order.additional_costs = { shipping: 500 };
  }
  if (order.book_ids.length > 5) {
    order.additional_costs = { shipping: 500 + 250 * Math.round(order.book_ids.length / 5) };
  }
  order.total_cost += Object.values(order.books_cost).reduce((a, b) => a + b, 0);
  order.total_cost += Object.values(order.additional_costs).reduce((a, b) => a + b, 0);

  return order;
}

function handleBookShopOrders(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.endsWith("/api/book-shop-orders")) {
    // get all user orders
    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logDebug("handleBookShopOrders: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (booksShopAccount === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
      return false;
    }

    const foundBookShopOrders = searchForBookShopOrdersForUser(foundUser.id);
    logTrace("handleBookShopOrders: Found Book Shop Account", { userId: foundUser.id, foundBookShopOrders });

    res.status(HTTP_OK).send(foundBookShopOrders);
    return true;
  } else if (req.method === "GET" && req.url.includes("/api/book-shop-orders/")) {
    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logDebug("handleBookShopOrders: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (booksShopAccount === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
      return false;
    }

    const foundBookShopOrders = searchForBookShopOrdersForUser(foundUser.id);
    logTrace("handleBookShopOrders: Found Book Shop Account", { userId: foundUser.id, foundBookShopOrders });

    return true;
  } else if (req.method === "POST" && req.url.endsWith("/api/book-shop-orders")) {
    logDebug("handleBookShopOrders: Creating a new order", { url: req.url, urlEnds });
    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logDebug("handleBookShopOrders: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (booksShopAccount === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
      return false;
    }

    const foundBookShopOrders = searchForBookShopOrdersWithStatusForUser(foundUser.id, 1);

    if (foundBookShopOrders.length > 0) {
      res
        .status(HTTP_CONFLICT)
        .send(formatErrorResponse("User already has an active order. Complete or cancel it first."));
      return false;
    }

    logDebug("handleBookShopOrders: Creating a new order", { userId: foundUser.id, foundBookShopOrders });

    const newOrder = {
      user_id: foundUser.id,
      status_id: 1, // new order
      book_ids: [],
      books_cost: {},
      additional_costs: {},
      total_cost: 0,
      created_at: getCurrentDateTimeISO(),
    };

    req.body = newOrder;
    return true;
    // } else if (req.method === "POST" && req.url.match(/\/api\/book-shop-orders\/\d+\/items/)) {
  } else if (req.method === "PATCH" && req.url.includes("/api/book-shop-orders/")) {
    logDebug("handleBookShopOrders: change order status", { url: req.url, urlEnds });

    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logDebug("handleBookShopOrders: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (booksShopAccount === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
      return false;
    }

    const foundBookShopOrders = searchForBookShopOrdersWithStatusForUser(foundUser.id, 1);

    logDebug("handleBookShopOrders: Found Orders", { foundBookShopOrders });

    if (foundBookShopOrders.length === 0) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Order not found"));
      return false;
    }

    const orderBase = foundBookShopOrders[0];

    const currentOrderStatus = searchForBookShopOrderStatusesDb(orderBase.status_id);
    const newStatus = req.body.status_id;

    logDebug("handleBookShopOrders: Checking next possible status", { currentOrderStatus, newStatus });
    if (isStringOnTheList(newStatus, currentOrderStatus.possible_next_statuses) === false) {
      res.status(HTTP_CONFLICT).send(formatErrorResponse("Cannot change order status to the requested one"));
      return false;
    }

    if (orderBase.book_ids.length === 0 && areIdsEqual(currentOrderStatus.id, 1) === true) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Order has no items"));
      return false;
    }

    logDebug("handleBookShopOrders: Checking funds", {
      fund: booksShopAccount.funds,
      total_cost: orderBase.total_cost,
      currentOrderStatus,
      newStatus,
    });

    if (
      areIdsEqual(currentOrderStatus.id, 1) === true &&
      areIdsEqual(newStatus, 20) !== true &&
      booksShopAccount.funds < orderBase.total_cost
    ) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Not enough funds"));
      return false;
    }

    const newValue = booksShopAccount.funds - orderBase.total_cost;

    const partialOrder = {
      status_id: newStatus,
    };

    req.body = partialOrder;
    logDebug("handleBookShopOrders -> PATCH/PATCH:", {
      method: req.method,
      url: req.url,
      body: req.body,
    });

    changeUserFunds(DatabaseManager.getInstance().getDb(), booksShopAccount.id, newValue);
  } else if (req.url.includes("/api/book-shop-orders/items")) {
    logDebug("handleBookShopOrders: Adding items to order", { url: req.url, urlEnds });
    // const numberFromUrl = req.url.match(/\/api\/book-shop-orders\/\d+\/items/);

    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-orders", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logDebug("handleBookShopOrders: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (booksShopAccount === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
      return false;
    }

    const foundBookShopOrders = searchForBookShopOrdersWithStatusForUser(foundUser.id, 1);

    logDebug("handleBookShopOrders: Found Orders", { foundBookShopOrders });

    // if (areIdsEqual(foundBookShopOrders[0].id, numberFromUrl[1]) === false) {
    //   res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Order not found"));
    //   return false;
    // }

    const bookId = req.body.book_id;

    const foundItem = searchForBookShopItemByBookId(bookId);

    logDebug("handleBookShopOrders: Found Item", { bookId, foundItem });

    if (foundItem.length === 0) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found"));
      return false;
    }
    if (foundItem.quantity === 0) {
      res.status(HTTP_CONFLICT).send(formatErrorResponse("Item is not in stock"));
      return false;
    }

    if (req.method === "POST") {
      if (foundBookShopOrders.length > 0) {
        logDebug("handleBookShopOrders: Adding items to existing order", { foundItem });

        const orderBase = foundBookShopOrders[0];
        const bookId = foundItem[0].book_id;
        const bookCost = foundItem[0].price;

        // check if book is already in order
        if (orderBase.book_ids.includes(bookId)) {
          res.status(HTTP_CONFLICT).send(formatErrorResponse("Item already in order"));
          return false;
        }

        let partialOrder = {
          book_ids: orderBase.book_ids,
          books_cost: orderBase.books_cost,
          additional_costs: orderBase.additional_costs,
          total_cost: orderBase.total_cost,
        };

        partialOrder.book_ids.push(bookId);
        partialOrder.books_cost[bookId] = bookCost;

        partialOrder = countCostsInOrder(partialOrder);

        req.body = partialOrder;
        req.method = "PATCH";
        req.url = `/api/book-shop-orders/${orderBase.id}`;

        logDebug("handleBookShopOrders -> POST/PATCH:", {
          method: req.method,
          url: req.url,
          body: req.body,
        });
      } else {
        logDebug("handleBookShopOrders: Creating a new order", { userId: foundUser.id });

        let newOrder = {
          user_id: foundUser.id,
          status_id: 1, // new order
          book_ids: [foundItem[0].book_id],
          books_cost: {},
          additional_costs: { shipping: 500 },
          total_cost: 0,
          created_at: getCurrentDateTimeISO(),
        };

        newOrder.books_cost[foundItem[0].book_id] = foundItem[0].price;

        newOrder = countCostsInOrder(newOrder);

        req.body = newOrder;
        req.method = "POST";
        req.url = "/api/book-shop-orders";
        logDebug("handleBookShopOrders -> POST/POST:", {
          method: req.method,
          url: req.url,
          body: req.body,
        });
      }
    } else if (req.method === "DELETE") {
      if (foundBookShopOrders.length === 0) {
        logDebug("handleBookShopOrders: Order not found", { url: req.url, urlEnds });
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Order not found"));
      }

      const orderBase = foundBookShopOrders[0];
      const bookId = foundItem[0].book_id;

      let partialOrder = {
        book_ids: orderBase.book_ids,
        books_cost: orderBase.books_cost,
        additional_costs: orderBase.additional_costs,
        total_cost: orderBase.total_cost,
      };

      const bookIndex = partialOrder.book_ids.indexOf(bookId);

      logDebug("handleBookShopOrders: Found Book Index", { bookIndex, bookId });

      if (bookIndex === -1) {
        logDebug("handleBookShopOrders: DELETE item - Item not found in order", { url: req.url, urlEnds });
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found in order"));
      }

      // remove bookIndex
      partialOrder.book_ids.splice(bookIndex, 1);
      delete partialOrder.books_cost[bookId];

      partialOrder = countCostsInOrder(partialOrder);

      req.body = partialOrder;
      req.method = "PATCH";
      req.url = `/api/book-shop-orders/${orderBase.id}`;
      logDebug("handleBookShopOrders -> DELETE/PATCH:", {
        method: req.method,
        url: req.url,
        body: req.body,
      });

      return true;
    } else {
      logDebug("handleBookShopOrders: Not Found", { url: req.url, urlEnds });
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
    }
    return;
  } else {
    logDebug("handleBookShopOrders: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
  }

  return;
}

module.exports = {
  handleBookShopOrders,
};
