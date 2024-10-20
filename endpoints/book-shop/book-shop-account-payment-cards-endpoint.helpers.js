const { isUndefined } = require("lodash");
const {
  searchForUserWithOnlyToken,
  searchForBookShopAccount,
  searchForBookShopAccountPaymentCardByAccountId,
} = require("../../helpers/db-operation.helpers");
const { formatErrorResponse, formatInvalidTokenErrorResponse, getIdFromUrl } = require("../../helpers/helpers");
const { logDebug, logTrace } = require("../../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_OK,
} = require("../../helpers/response.helpers");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { areIdsEqual } = require("../../helpers/compare.helpers");

function validateCardNumber(cardNumber, length) {
  cardNumber = cardNumber.replace(/\s/g, "");

  if (cardNumber.length !== length) {
    return false;
  }

  if (!/^\d+$/.test(cardNumber)) {
    return false;
  }

  return true;
}

function validateDate(date) {
  const actualDate = date.replace(/[^0-9-]/g, "");
  const dateParts = actualDate.split("-");

  if (dateParts.length !== 3) {
    return false;
  }

  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]);
  const day = parseInt(dateParts[2]);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return false;
  }

  const currentDate = new Date();
  const expirationDateValue = new Date(year, month - 1, day);

  if (expirationDateValue < currentDate) {
    return false;
  }

  return true;
}

function formatCardNumber(cardNumber) {
  cardNumber = cardNumber.replace(/\s/g, "");
  // format from "12345678901234562121" to "1234 5678 9012 3456 2121"
  return cardNumber.replace(/(.{4})/g, "$1 ");
}

function handleBookShopAccountPaymentCards(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.includes("/api/book-shop-account-payment-cards")) {
    logDebug("handleBookShopAccountPaymentCards: GET", { url: req.url, urlEnds });

    const verifyTokenResult = verifyAccessToken(req, res, "PUT book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const foundAccount = searchForBookShopAccount(foundUser.id);

    if (isUndefined(foundAccount)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Account not found"));
      return false;
    }

    const foundCard = searchForBookShopAccountPaymentCardByAccountId(foundAccount.id);

    if (isUndefined(foundCard)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Card not found"));
      return false;
    }

    const cardNumber = foundCard.card_number;

    const cardNumberHidden = cardNumber.slice(0, 18).replace(/\d/g, "*") + cardNumber.slice(18);

    res.status(HTTP_OK).send({ card_number: cardNumberHidden });
    return true;
  } else if (req.method === "PUT" && req.url.includes("/api/book-shop-account-payment-cards/")) {
    logDebug("handleBookShopAccountPaymentCards: update payment card", { url: req.url, urlEnds });

    const verifyTokenResult = verifyAccessToken(req, res, "PUT book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    let accountId = getIdFromUrl(urlEnds);
    const foundAccount = searchForBookShopAccount(accountId);

    logTrace("handleBookShopAccountPaymentCards: Found Account", { id: foundAccount?.id, accountIdFromUrl: accountId });

    if (isUndefined(foundAccount) || areIdsEqual(foundAccount.user_id, foundUser.id) === false) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Account not found"));
      return false;
    }

    if (areIdsEqual(accountId, foundAccount.id) === false) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
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
      limit: 50000,
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

    const foundCard = searchForBookShopAccountPaymentCardByAccountId(accountId);

    req.url = "/api/book-shop-account-payment-cards/";
    if (foundCard !== undefined) {
      req.url += foundCard.id;
    }

    req.body = {
      account_id: foundAccount.id,
      card_number: req.body.card_number,
      expiration_date: req.body.expiration_date,
      cvv: req.body.cvv,
    };

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
