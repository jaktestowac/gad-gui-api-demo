const { isUndefined } = require("lodash");
const {
  searchForUserWithOnlyToken,
  searchForBookShopAccountWithUserId,
} = require("../../helpers/db-operation.helpers");
const { formatErrorResponse, formatInvalidTokenErrorResponse, getIdFromUrl } = require("../../helpers/helpers");
const { logDebug } = require("../../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } = require("../../helpers/response.helpers");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { areIdsEqual } = require("../../helpers/compare.helpers");

function handleBooks(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.includes("/api/books")) {
    return true;
  } else if (
    req.method === "POST" &&
    (req.url.includes("/api/books/owned/") ||
      req.url.includes("/api/books/wishlist/") ||
      req.url.includes("/api/books/read/") ||
      req.url.includes("/api/books/favorites/"))
  ) {
    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logDebug("handleBookShopAccount: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (booksShopAccount === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
      return false;
    }
    const book_id = getIdFromUrl(urlEnds);

    const fieldNames = {
      owned: "owned_books_ids",
      wishlist: "wishlist_books_ids",
      read: "read_books_ids",
      favorites: "favorite_books_ids",
    };

    const fieldNameKey = Object.keys(fieldNames).find((key) => req.url.includes(key));
    const fieldName = fieldNames[fieldNameKey];
    logDebug("handleBooks: Found Book Shop Account", { url: req.url, fieldNameKey, fieldName });
    if (booksShopAccount[fieldName].includes(book_id)) {
      booksShopAccount[fieldName] = booksShopAccount[fieldName].filter((id) => areIdsEqual(id, book_id) === false);
    } else {
      booksShopAccount[fieldName].push(book_id);
    }

    req.url = `/api/book-shop-accounts/${booksShopAccount.id}`;
    req.method = "PATCH";
    req.body = {};
    req.body[fieldName] = booksShopAccount[fieldName];

    return true;
  } else {
    logDebug("handleBooks: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
  }
  // TODO:
  return;
}

module.exports = {
  handleBooks,
};
