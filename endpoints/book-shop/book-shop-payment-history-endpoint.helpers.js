const { searchForPaymentHistory } = require("../../helpers/db-operations/db-book-shop.operations");
const { formatErrorResponse } = require("../../helpers/helpers");
const { logDebug } = require("../../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_OK, HTTP_UNAUTHORIZED } = require("../../helpers/response.helpers");
const { isUndefined } = require("lodash");
const { searchForUserWithOnlyToken } = require("../../helpers/db-operation.helpers");
const { formatInvalidTokenErrorResponse } = require("../../helpers/helpers");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { searchForBookShopAccountWithUserId } = require("../../helpers/db-operations/db-book-shop.operations");

function handleBookShopPaymentHistory(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.includes("/api/book-shop-payment-history")) {
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

    const paymentHistory = searchForPaymentHistory(booksShopAccount.id);

    res.status(HTTP_OK).send(paymentHistory);
  } else if (req.method === "GET" && req.url.includes("/api/book-shop-payment-history/mock")) {
    const samplePaymentHistory = [
      {
        id: 1,
        account_id: 1,
        date: "2025-01-01T00:00:00.000Z",
        activityType: "payment",
        balanceBefore: 100.0,
        balanceAfter: 74.01,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 25.99,
          currency: "PLN",
          status: "completed",
          order_id: 1,
        },
      },
      {
        id: 2,
        account_id: 1,
        date: "2025-01-02T00:00:00.000Z",
        activityType: "payment",
        balanceBefore: 74.01,
        balanceAfter: 50.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 24.01,
          currency: "PLN",
          status: "completed",
          order_id: 2,
        },
      },
      {
        id: 3,
        account_id: 1,
        date: "2025-01-03T00:00:00.000Z",
        activityType: "payment",
        balanceBefore: 50.0,
        balanceAfter: 0.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 50.0,
          currency: "PLN",
          status: "completed",
          order_id: 3,
        },
      },
      {
        id: 4,
        account_id: 1,
        date: "2025-01-03T00:11:00.000Z",
        activityType: "payment",
        balanceBefore: 0.0,
        balanceAfter: 0.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 0.0,
          currency: "PLN",
          status: "rejected",
          order_id: 4,
        },
      },
      {
        id: 5,
        account_id: 1,
        date: "2025-01-03T00:13:00.000Z",
        activityType: "payment",
        balanceBefore: 0.0,
        balanceAfter: 0.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 0.0,
          currency: "PLN",
          status: "pending",
          order_id: 4,
        },
      },
      {
        id: 6,
        account_id: 1,
        date: "2025-01-04T00:00:00.000Z",
        activityType: "refund",
        balanceBefore: 0.0,
        balanceAfter: 50.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 50.0,
          currency: "PLN",
          status: "completed",
          order_id: 4,
        },
      },
      {
        id: 7,
        account_id: 1,
        date: "2025-01-05T00:00:00.000Z",
        activityType: "payment",
        balanceBefore: 50.0,
        balanceAfter: 0.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 50.0,
          currency: "PLN",
          status: "completed",
          order_id: 5,
        },
      },
    ];

    res.status(HTTP_OK).send(samplePaymentHistory);
  } else {
    logDebug("handleBookShopPaymentHistory: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
  }
  return;
}

module.exports = {
  handleBookShopPaymentHistory,
};
