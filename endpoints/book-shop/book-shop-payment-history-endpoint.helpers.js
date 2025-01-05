const { formatErrorResponse } = require("../../helpers/helpers");
const { logDebug } = require("../../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_OK } = require("../../helpers/response.helpers");

function handleBookShopPaymentHistory(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.includes("/api/book-shop-payment-history")) {
    const samplePaymentHistory = [
      {
        id: 1,
        date: "2025-01-01",
        activityType: "payment",
        balanceBefore: 100.0,
        balanceAfter: 74.01,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 25.99,
          currency: "PLN",
          status: "completed",
        },
      },
      {
        id: 2,
        date: "2025-01-02",
        activityType: "payment",
        balanceBefore: 74.01,
        balanceAfter: 50.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 24.01,
          currency: "PLN",
          status: "completed",
        },
      },
      {
        id: 3,
        date: "2025-01-03",
        activityType: "payment",
        balanceBefore: 50.0,
        balanceAfter: 0.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 50.0,
          currency: "PLN",
          status: "completed",
        },
      },
      {
        id: 4,
        date: "2025-01-03",
        activityType: "payment",
        balanceBefore: 0.0,
        balanceAfter: 0.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 0.0,
          currency: "PLN",
          status: "rejected",
        },
      },
      {
        id: 5,
        date: "2025-01-03",
        activityType: "payment",
        balanceBefore: 0.0,
        balanceAfter: 0.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 0.0,
          currency: "PLN",
          status: "pending",
        },
      },
      {
        id: 6,
        date: "2025-01-04",
        activityType: "refund",
        balanceBefore: 0.0,
        balanceAfter: 50.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 50.0,
          currency: "PLN",
          status: "completed",
        },
      },
      {
        id: 7,
        date: "2025-01-05",
        activityType: "payment",
        balanceBefore: 50.0,
        balanceAfter: 0.0,
        paymentDetails: {
          paymentMethod: "credit_card",
          amount: 50.0,
          currency: "PLN",
          status: "completed",
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
