const { isUndefined } = require("lodash");
const {
  searchForUserWithOnlyToken,
  searchForBookShopAccountWithUserId,
  searchForBookShopOrdersForUser,
  searchForBookShopOrdersWithStatusForUser,
  searchForBookShopItemByBookId,
  searchForBookShopOrderStatuses,
  searchForBookShopOrderCoupon,
  searchForBookWithId,
} = require("../../helpers/db-operation.helpers");
const { formatErrorResponse, formatInvalidTokenErrorResponse } = require("../../helpers/helpers");
const { logDebug, logTrace } = require("../../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_OK,
  HTTP_CONFLICT,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_INTERNAL_SERVER_ERROR,
} = require("../../helpers/response.helpers");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { getCurrentDateTimeISO } = require("../../helpers/datetime.helpers");
const { isStringOnTheList, areIdsEqual } = require("../../helpers/compare.helpers");
const { bookShopOrderStatusesDb } = require("../../helpers/db.helpers");
const { registerSentOrder } = require("../../helpers/book-shop.helpers");

function countCostsInOrder(order) {
  order.total_cost = 0;
  if (order.book_ids.length === 0 || order.books_cost === undefined) {
    order.partial_costs = {};
  }
  if (order.book_ids.length > 0) {
    order.partial_costs["shipping"] = 500;
  }

  // recalculate shipping costs
  if (order.book_ids.length >= 5) {
    order.partial_costs["shipping"] = 500 + 250 * Math.round(order.book_ids.length / 5);
  }

  order.partial_costs["books"] = Object.values(order.books_cost).reduce((a, b) => a + b, 0);

  // calculate total cost needed for applying coupons
  order.total_cost = order.partial_costs["books"];

  for (const couponCode in order.partial_costs) {
    const foundCoupon = searchForBookShopOrderCoupon(couponCode);
    if (foundCoupon !== undefined) {
      logDebug("countCostsInOrder: Found Coupon", { couponCode, foundCoupon });
      if (new Date(foundCoupon.valid_until) > new Date()) {
        if ((foundCoupon.usage_limit ?? 1) >= 0 && (foundCoupon.used ?? 0) <= (foundCoupon.usage_limit ?? 1)) {
          let couponValue = foundCoupon.discount;
          if (foundCoupon.type === "percentage") {
            couponValue = order.total_cost * (couponValue / 100);
          }

          order.partial_costs[couponCode] = -Math.abs(couponValue);
          logDebug("countCostsInOrder: Applied coupon", { couponCode, couponValue });
        } else {
          logDebug("countCostsInOrder: Coupon usage limit reached", { couponCode });
        }
      } else {
        logDebug("countCostsInOrder: Coupon is expired", { couponCode });
      }
    }
  }
  logDebug("countCostsInOrder: order.partial_costs:", { partial_costs: order.partial_costs });

  // recalculate total cost after applying coupons
  order.total_cost = Object.values(order.partial_costs).reduce((a, b) => a + b, 0);

  logDebug("countCostsInOrder: order.total_cost:", { total_cost: order.total_cost });

  if (order.total_cost < 0) {
    logDebug("countCostsInOrder: order.total_cost < 0 - setting to 0", { total_cost: order.total_cost });
    order.total_cost = 0;
  }
  return order;
}

const orderStatuses = {
  new: 1,
  sent: 5,
  pending: 10,
  cancelled: 20,
  returned: 30,
  delivered: 40,
  completed: 99,
};

let statusesVerified = false;

function handleBookShopOrders(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  const statusesInDb = bookShopOrderStatusesDb();

  if (statusesVerified === false) {
    for (const status in orderStatuses) {
      const foundStatus = statusesInDb.filter((item) => item.id === orderStatuses[status] && item.name === status);
      if (foundStatus.length === 0) {
        logDebug("handleBookShopOrders: Status not found in db", { status, orderStatuses });
        res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Status not found in db"));
        return false;
      }
    }
  }
  statusesVerified = true;

  if (req.method === "POST" && req.url.endsWith("/api/book-shop-orders/coupon")) {
    logDebug("handleBookShopOrders/coupon: apply coupon", { url: req.url, urlEnds, body: req.body });

    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logTrace("handleBookShopOrders/coupon: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (booksShopAccount === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
      return false;
    }

    const foundBookShopOrders = searchForBookShopOrdersWithStatusForUser(foundUser.id, orderStatuses.new);

    logDebug("handleBookShopOrders/coupon: Found Orders", { foundBookShopOrders });

    if (foundBookShopOrders.length === 0) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Order not found or is not in the 'new' status"));
      return false;
    }

    const orderBase = foundBookShopOrders[0];

    const currentOrderStatus = searchForBookShopOrderStatuses(orderBase.status_id);

    if (areIdsEqual(currentOrderStatus.id, orderStatuses.new) === false) {
      res.status(HTTP_CONFLICT).send(formatErrorResponse("Cannot apply coupon to the order in this status"));
      return false;
    }

    const couponCode = req.body.coupon_code;
    const foundCoupon = searchForBookShopOrderCoupon(couponCode);

    logDebug("handleBookShopOrders/coupon: Found Coupon", { couponCode, foundCoupon });

    if (isUndefined(foundCoupon)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Coupon not found or is invalid"));
      return false;
    }

    if (new Date(foundCoupon.valid_until) < new Date()) {
      res.status(HTTP_CONFLICT).send(formatErrorResponse("Coupon is expired"));
      return false;
    }

    if (foundCoupon !== undefined && foundCoupon.usage_limit > 0 && foundCoupon.used >= foundCoupon.usage_limit) {
      res.status(HTTP_CONFLICT).send(formatErrorResponse("Coupon usage limit reached"));
      return false;
    }

    // check if coupon is was already applied
    if (orderBase.partial_costs[couponCode] !== undefined) {
      res.status(HTTP_CONFLICT).send(formatErrorResponse("Coupon already applied"));
      return false;
    }

    // // coupon value
    // let couponValue = foundCoupon.discount;
    // if (foundCoupon.type === "percentage") {
    //   couponValue = orderBase.total_cost * (couponValue / 100);
    // }

    // orderBase.partial_costs[couponCode] = -Math.abs(couponValue);

    orderBase.partial_costs[couponCode] = 0;

    const newOrder = countCostsInOrder(orderBase);

    logDebug("handleBookShopOrders/coupon: Applied coupon", { couponCode, newOrder });

    req.body = newOrder;
    req.method = "PATCH";
    req.url = `/api/book-shop-orders/${orderBase.id}`;
    logDebug("handleBookShopOrders -> POST -> PATCH:", {
      method: req.method,
      url: req.url,
      body: req.body,
    });

    return true;
  } else if (req.method === "GET" && req.url.endsWith("/api/book-shop-orders")) {
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

    const foundBookShopOrders = searchForBookShopOrdersWithStatusForUser(foundUser.id, orderStatuses.new);

    if (foundBookShopOrders.length > 0) {
      res
        .status(HTTP_CONFLICT)
        .send(formatErrorResponse("User already has an active order. Complete or cancel it first."));
      return false;
    }

    logDebug("handleBookShopOrders: Creating a new order", { userId: foundUser.id, foundBookShopOrders });

    const newOrder = {
      user_id: foundUser.id,
      status_id: orderStatuses.new,
      book_ids: [],
      books_cost: {},
      partial_costs: {},
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

    const foundBookShopOrders = searchForBookShopOrdersWithStatusForUser(foundUser.id, orderStatuses.new);

    logDebug("handleBookShopOrders: Found Orders", { foundBookShopOrders });

    if (foundBookShopOrders.length === 0) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Order not found or is not in the 'new' status"));
      return false;
    }

    const orderBase = foundBookShopOrders[0];

    const currentOrderStatus = searchForBookShopOrderStatuses(orderBase.status_id);
    const newStatusId = req.body.status_id;

    logDebug("handleBookShopOrders: Checking next possible status", {
      currentOrderStatus,
      newStatusId,
    });

    if (isStringOnTheList(newStatusId, currentOrderStatus.possible_next_statuses) === false) {
      res.status(HTTP_CONFLICT).send(
        formatErrorResponse(`Cannot change order status to the requested one: "${newStatusId}"`, {
          currentOrderStatus,
          newStatusId,
        })
      );
      return false;
    }

    if (orderBase.book_ids.length === 0 && areIdsEqual(currentOrderStatus.id, orderStatuses.new) === true) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Order has no items"));
      return false;
    }

    if (
      areIdsEqual(currentOrderStatus.id, orderStatuses.new) === true &&
      areIdsEqual(newStatusId, orderStatuses.sent) === true
    ) {
      logDebug("handleBookShopOrders: Checking funds", {
        funds: booksShopAccount.funds,
        total_cost: orderBase.total_cost,
        currentOrderStatus,
        newStatusId,
      });

      if (booksShopAccount.funds < orderBase.total_cost) {
        res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Not enough funds"));
        return false;
      }

      logDebug("handleBookShopOrders: Checking items in stock", { orderBase });

      const invalidBooks = [];
      for (const bookId of orderBase.book_ids) {
        const itemBase = searchForBookShopItemByBookId(bookId);

        logDebug("handleBookShopOrders: Checking items in stock", { bookId, itemBase });

        if (itemBase === undefined || itemBase._inactive === true) {
          const book = searchForBookWithId(bookId);
          invalidBooks.push(book);
        }
      }

      if (invalidBooks.length > 0) {
        const bookList = invalidBooks.map((book) => book.title).join(", ");
        res.status(HTTP_CONFLICT).send(formatErrorResponse(`Item "${bookList}" is not in stock`));
        return false;
      }

      req.body.sent_at = getCurrentDateTimeISO();
    }

    if (areIdsEqual(newStatusId, orderStatuses.cancelled) === true) {
      req.body.cancelled_at = getCurrentDateTimeISO();
    }
    if (areIdsEqual(newStatusId, orderStatuses.returned) === true) {
      req.body.returned_at = getCurrentDateTimeISO();
    }
    if (areIdsEqual(newStatusId, orderStatuses.delivered) === true) {
      req.body.delivered_at = getCurrentDateTimeISO();
    }
    if (areIdsEqual(newStatusId, orderStatuses.completed) === true) {
      req.body.completed_at = getCurrentDateTimeISO();
    }

    const partialOrder = {
      status_id: parseInt(newStatusId),
    };

    req.body = partialOrder;
    logDebug("handleBookShopOrders -> PATCH/PATCH:", {
      method: req.method,
      url: req.url,
      body: req.body,
      currentOrderStatus,
      newStatusId,
    });

    if (
      areIdsEqual(currentOrderStatus.id, orderStatuses.new) === true &&
      areIdsEqual(newStatusId, orderStatuses.sent) === true
    ) {
      registerSentOrder(booksShopAccount, orderBase, currentOrderStatus, newStatusId);
    }
  } else if (req.url.includes("/api/book-shop-orders/items")) {
    logDebug("handleBookShopOrders: Add/delete items to/from order", { url: req.url, urlEnds });
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

    const foundBookShopOrders = searchForBookShopOrdersWithStatusForUser(foundUser.id, orderStatuses.new);

    logDebug("handleBookShopOrders: Found Orders", { foundBookShopOrders });

    // if (areIdsEqual(foundBookShopOrders[0].id, numberFromUrl[1]) === false) {
    //   res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Order not found"));
    //   return false;
    // }

    const bookId = req.body.book_id;

    const foundItem = searchForBookShopItemByBookId(bookId);

    logDebug("handleBookShopOrders: Found Item", { bookId, foundItem });

    if (req.method !== "DELETE") {
      if (foundItem === undefined) {
        res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found for the given book id"));
        return false;
      }

      if (foundItem.quantity === 0) {
        res.status(HTTP_CONFLICT).send(formatErrorResponse("Item is not in stock"));
        return false;
      }
    }

    if (req.method === "POST") {
      if (foundBookShopOrders.length > 0) {
        logDebug("handleBookShopOrders: Adding items to existing order", { foundItem });

        const orderBase = foundBookShopOrders[0];
        const bookId = foundItem.book_id;
        const bookCost = foundItem.price;

        // check if book is already in order
        if (orderBase.book_ids.includes(bookId)) {
          res.status(HTTP_CONFLICT).send(formatErrorResponse("Item already in order"));
          return false;
        }

        let partialOrder = {
          book_ids: orderBase.book_ids,
          books_cost: orderBase.books_cost,
          partial_costs: orderBase.partial_costs,
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
          book_ids: [foundItem.book_id],
          books_cost: {},
          partial_costs: { shipping: 500 },
          total_cost: 0,
          created_at: getCurrentDateTimeISO(),
        };

        newOrder.books_cost[foundItem.book_id] = foundItem.price;

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

      let partialOrder = {
        book_ids: orderBase.book_ids,
        books_cost: orderBase.books_cost,
        partial_costs: orderBase.partial_costs,
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
