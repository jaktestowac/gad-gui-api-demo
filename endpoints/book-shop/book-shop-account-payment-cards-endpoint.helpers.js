const { isUndefined } = require("lodash");
const { searchForUserWithOnlyToken } = require("../../helpers/db-operation.helpers");
const {
  formatErrorResponse,
  formatInvalidTokenErrorResponse,
  validateCardNumber,
  validateDate,
  isValidNumber,
  sleep,
  isStringValidNumberInRange,
} = require("../../helpers/helpers");
const { logDebug, logTrace } = require("../../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_OK,
} = require("../../helpers/response.helpers");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { areIdsEqual } = require("../../helpers/compare.helpers");
const DatabaseManager = require("../../helpers/db.manager");
const { changeUserFunds, addCardToDataBase } = require("../../helpers/db-queries.helper");
const { getConfigValue } = require("../../config/config-manager");
const { ConfigKeys } = require("../../config/enums");
const { getRandomInt } = require("../../helpers/generators/random-data.generator");
const {
  searchForBookShopAccountPaymentCardByAccountId,
  searchForBookShopAccountWithUserId,
  searchForBookShopAccountPaymentCardByCardNumber,
} = require("../../helpers/db-operations/db-book-shop.operations");

function handleBookShopAccountPaymentCards(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method === "POST" && req.url.includes("/api/book-shop-account-payment-cards/topup")) {
    logDebug("handleBookShopAccountPaymentCards: Do top up", { url: req.url, urlEnds });

    const verifyTokenResult = verifyAccessToken(req, res, "POST book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const foundAccount = searchForBookShopAccountWithUserId(foundUser.id);

    logDebug("handleBookShopAccountPaymentCards: Found Account", { id: foundAccount?.id, userId: foundUser.id });

    if (isUndefined(foundAccount)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Account not found"));
      return false;
    }

    const foundCard = searchForBookShopAccountPaymentCardByAccountId(foundAccount.id);

    logDebug("handleBookShopAccountPaymentCards: Found Card", { foundCard });

    if (isUndefined(foundCard)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Card not found"));
      return false;
    }

    const cardCvv = foundCard.cvv;
    logDebug("handleBookShopAccountPaymentCards: Card Number", { cardCvv });

    if (areIdsEqual(cardCvv, req.body.cvv) === false) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid CVV"));
      return false;
    }

    const topUpAmount = req.body.amount;
    logDebug("handleBookShopAccountPaymentCards: Top up Amount", { topUpAmount });

    if (isValidNumber(topUpAmount) === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid amount"));
      return false;
    }

    if (isStringValidNumberInRange(topUpAmount, 100, 100000) === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid amount range"));
      return false;
    }

    const topUpAmountInt = parseInt(topUpAmount);

    if (topUpAmountInt < 0) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid amount"));
      return false;
    }

    const foundCardBalance = foundCard.balance;
    logDebug("handleBookShopAccountPaymentCards: Account Balance", { foundCardBalance });

    if (foundCardBalance < topUpAmountInt) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Not enough balance"));
      return false;
    }

    const newBalance = foundCardBalance - topUpAmountInt;

    req.url = `/api/book-shop-account-payment-cards/${foundCard.id}`;
    req.method = "PATCH";
    req.body = { balance: newBalance };

    const newFundsValue = foundAccount.funds + topUpAmountInt;
    logDebug("handleBookShopAccountPaymentCards: Update Funds", {
      url: req.url,
      body: req.body,
      method: req.method,
      foundCard,
    });
    logDebug("handleBookShopAccountPaymentCards: New Balance data", {
      newBalance,
      oldFunds: foundAccount.funds,
      topUpAmountInt,
      newFundsValue,
    });

    const timeout = getRandomInt(
      getConfigValue(ConfigKeys.SLEEP_TIME_FOR_SHOP_ACCOUNT_TOP_UP_MIN),
      getConfigValue(ConfigKeys.SLEEP_TIME_FOR_SHOP_ACCOUNT_TOP_UP_MAX)
    );
    logDebug(`[DELAY] Waiting for ${timeout} [ms] for changing User Funds`);
    logDebug(`Change funds on card is instant, but funds on user account will be changed after ${timeout} [ms]`);

    sleep(timeout).then(() => {
      const foundAccount = searchForBookShopAccountWithUserId(foundUser.id);
      const newFundsValue = foundAccount.funds + topUpAmountInt;
      logDebug(`Changing User Funds ${foundAccount.funds} -> ${newFundsValue}`);

      changeUserFunds(DatabaseManager.getInstance().getDb(), foundAccount.id, newFundsValue);
      logDebug(`User Funds changed to ${newFundsValue}`);
    });

    return;
  } else if (req.method === "GET" && req.url.includes("/api/book-shop-account-payment-cards")) {
    logDebug("handleBookShopAccountPaymentCards: Get user card", { url: req.url, urlEnds });

    const verifyTokenResult = verifyAccessToken(req, res, "PUT book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const foundAccount = searchForBookShopAccountWithUserId(foundUser.id);
    logDebug("handleBookShopAccountPaymentCards: Found Account", { id: foundAccount?.id, userId: foundUser.id });

    if (isUndefined(foundAccount)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Account not found"));
      return false;
    }

    const foundCard = searchForBookShopAccountPaymentCardByAccountId(foundAccount.id);
    logDebug("handleBookShopAccountPaymentCards: Found Card", { foundCard });

    if (isUndefined(foundCard)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Card not found"));
      return false;
    }

    req.url = `/api/book-shop-account-payment-cards/${foundCard.id}`;
    return true;
  } else if (req.method === "PUT" && req.url.includes("/api/book-shop-account-payment-cards")) {
    logDebug("handleBookShopAccountPaymentCards: update payment card", { url: req.url, urlEnds });

    const verifyTokenResult = verifyAccessToken(req, res, "PUT book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const foundAccount = searchForBookShopAccountWithUserId(foundUser.id);

    logTrace("handleBookShopAccountPaymentCards: Found Account", { id: foundAccount?.id });

    if (isUndefined(foundAccount) || areIdsEqual(foundAccount.user_id, foundUser.id) === false) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Account not found"));
      return false;
    }

    const isCardValid = validateCardNumber(req.body.card_number, 20);
    const isCardValidationNumberValid = validateCardNumber(req.body.cvv, 5);
    const isExpirationDateValid = validateDate(req.body.expiration_date);

    logTrace("handleBookShopAccountPaymentCards: Found Account", {
      isCardValid,
      isCardValidationNumberValid,
      isExpirationDateValid,
      cardNumber: req.body.card_number,
      cvv: req.body.cvv,
      expiration_date: req.body.expiration_date,
    });

    if (isCardValid === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid card number"));
      return false;
    }

    if (isCardValidationNumberValid === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid CVV"));
      return false;
    }

    if (isExpirationDateValid === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid expiration date"));
      return false;
    }

    const foundCard = searchForBookShopAccountPaymentCardByAccountId(foundAccount.id);
    logDebug("handleBookShopAccountPaymentCards: Found Card (will be overwritten):", {
      foundCard: foundCard ?? "Card Not Found",
      foundAccountId: foundAccount?.id,
    });

    if (foundCard?.card_number === req.body.card_number) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Card already in use"));
      return false;
    }

    const foundCard2 = searchForBookShopAccountPaymentCardByCardNumber(req.body.card_number);
    logDebug("handleBookShopAccountPaymentCards: Found Card on different account:", {
      foundAccountId: foundAccount?.id,
      foundCard2,
    });

    const newCard = {
      account_id: foundAccount.id,
      card_number: req.body.card_number,
      expiration_date: req.body.expiration_date,
      cvv: req.body.cvv,
      balance: 50000,
    };

    sleep(0).then(() => {
      // TODO: add delay in adding new card - simulate card verification, but return response instantly
      addCardToDataBase(DatabaseManager.getInstance().getDb(), foundAccount.id, newCard);
    });

    // req.url = "/api/book-shop-account-payment-cards/";
    // if (foundCard !== undefined) {
    //   req.url += foundCard.id;
    // } else {
    //   // create new card
    //   req.method = "POST";
    // }

    // req.body = {
    //   account_id: foundAccount.id,
    //   card_number: req.body.card_number,
    //   expiration_date: req.body.expiration_date,
    //   cvv: req.body.cvv,
    //   balance: 50000,
    // };
    logDebug("handleBookShopAccountPaymentCards: Update Card", { url: req.url, body: req.body, method: req.method });
    res.status(HTTP_OK).send(newCard);
    return;
  } else if (req.method === "DELETE" && req.url.includes("/api/book-shop-account-payment-cards")) {
    logDebug("handleBookShopAccountPaymentCards: Delete payment card", { url: req.url, urlEnds });

    const verifyTokenResult = verifyAccessToken(req, res, "DELETE book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const foundAccount = searchForBookShopAccountWithUserId(foundUser.id);

    logDebug("handleBookShopAccountPaymentCards: Found Account", { id: foundAccount?.id, userId: foundUser.id });

    if (isUndefined(foundAccount)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Account not found"));
      return false;
    }

    const foundCard = searchForBookShopAccountPaymentCardByAccountId(foundAccount.id);

    logDebug("handleBookShopAccountPaymentCards: Found Card", { foundCard });

    if (isUndefined(foundCard)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Card not found"));
      return false;
    }

    req.url = `/api/book-shop-account-payment-cards/${foundCard.id}`;
    req.method = "DELETE";
    return true;
  } else {
    logDebug("handleBookShopAccountPaymentCards: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
    return;
  }
}

module.exports = {
  handleBookShopAccountPaymentCards,
};
