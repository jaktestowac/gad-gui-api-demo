const { isUndefined } = require("lodash");
const {
  searchForUserWithOnlyToken,
  searchForBookShopAccountWithUserId,
  searchForBookShopOrdersForUser,
  searchForBookShopOrdersWithStatusForUser,
} = require("../../helpers/db-operation.helpers");
const { formatErrorResponse, formatInvalidTokenErrorResponse } = require("../../helpers/helpers");
const { logDebug, logTrace } = require("../../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED, HTTP_OK, HTTP_CONFLICT } = require("../../helpers/response.helpers");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { getCurrentDateTimeISO } = require("../../helpers/datetime.helpers");

function handleBookShopOrders(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.includes("/api/book-shop-orders")) {
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
  } else if (req.method === "POST" && req.url.endsWith("/api/book-shop-orders")) {
    // create an order
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

    const newOrder = {
      user_id: foundUser.id,
      status_id: 1,
      book_ids: [],
      books_price: {},
      additional_price: {},
      total_price: 0,
      created_at: getCurrentDateTimeISO(),
    };

    req.body = newOrder;
    return true;
  } else {
    logDebug("handleBookShopOrders: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
  }
  return;
}

module.exports = {
  handleBookShopOrders,
};
