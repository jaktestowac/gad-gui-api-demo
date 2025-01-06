const { isUndefined } = require("lodash");
const { searchForUserWithOnlyToken } = require("../../helpers/db-operation.helpers");
const { formatErrorResponse, formatInvalidTokenErrorResponse } = require("../../helpers/helpers");
const { logDebug, logTrace } = require("../../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } = require("../../helpers/response.helpers");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { searchForBookShopAccountWithUserId } = require("../../helpers/db-operations/db-book-shop.operations");

function handleBookShopItems(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.includes("/api/book-shop-items")) {
    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logTrace("handleBookShopItems: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (booksShopAccount === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
      return false;
    }

    return true;
  } else {
    logDebug("handleBookShopItems: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
  }
  return;
}

module.exports = {
  handleBookShopItems,
};
