const { formatErrorResponse } = require("../../helpers/helpers");
const { logDebug } = require("../../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_OK } = require("../../helpers/response.helpers");

function handleBookShopPaymentHistory(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.includes("/api/book-shop-payment-history")) {
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
