const { isUndefined } = require("lodash");
const { searchForUserWithOnlyToken } = require("../../helpers/db-operation.helpers");
const { logDebug, logTrace } = require("../../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_BAD_REQUEST,
  HTTP_OK,
} = require("../../helpers/response.helpers");
const { areIdsEqual } = require("../../helpers/compare.helpers");
const {
  searchForBookShopAccountWithUserId,
  searchForBookWithId,
  searchForBookShopActions,
  searchForBookShopBookByBookId,
} = require("../../helpers/db-operations/db-book-shop.operations");
const { isStringOnTheList } = require("../../helpers/compare.helpers");
const {
  verifyAccessToken,
  areMandatoryFieldsPresent,
  areAllFieldsValid,
  validateDateFields,
  areAnyFieldsPresent,
  mandatory_non_empty_fields_body,
  areAnyAdditionalFieldsPresent,
} = require("../../helpers/validation.helpers");
const { TracingInfoBuilder } = require("../../helpers/tracing-info.helper");
const {
  formatInvalidTokenErrorResponse,
  getIdFromUrl,
  formatMissingFieldErrorResponse,
  formatInvalidDateFieldErrorResponse,
  formatErrorResponse,
} = require("../../helpers/helpers");
const { booksDb } = require("../../helpers/db.helpers");

function handleBooks(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.includes("/api/books")) {
    // pass through to the next middleware to get the books
    return true;
  }

  if (
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

    if (book_id === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Book not found in URL"));
      return false;
    }

    if (searchForBookWithId(book_id) === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Book not found"));
      return false;
    }

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
  }

  // validate account
  const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
  const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

  logTrace("handleBooks: Found User", { id: foundUser?.id });

  if (isUndefined(foundUser)) {
    res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
    return false;
  }

  const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

  if (booksShopAccount === undefined) {
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
    return false;
  }

  // validate role
  const action = searchForBookShopActions("manage-books");
  logDebug("handleBooks: possibleRoleIds", { user_role_id: booksShopAccount.role_id, action });

  if (isStringOnTheList(booksShopAccount.role_id, action.role_ids) === false) {
    res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User does not have a permission"));
    return false;
  }

  if (req.method === "POST" && req.url === "/api/books") {
    const areFieldsPresent = areMandatoryFieldsPresent(req.body, mandatory_non_empty_fields_body);
    if (!areFieldsPresent) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_body));
      return false;
    }

    const additionalFields = areAnyAdditionalFieldsPresent(req.body, mandatory_non_empty_fields_body);
    if (additionalFields) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Additional fields provided", additionalFields));
      return false;
    }

    // validate date field:
    const isDateValid = validateDateFields(req.body, ["published_at"]);
    if (!isDateValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidDateFieldErrorResponse(isDateValid));
      return false;
    }

    req.body = {
      title: req.body.title,
      author_ids: req.body.author_ids,
      published_at: req.body.published_at,
      genre_ids: req.body.genre_ids,
      language: req.body.language,
      pages: req.body.pages,
      cover: `..\\data\\books\\${req.body.cover}`,
      description: req.body.description,
    };
    logTrace("handleBooks:POST:", { method: req.method, urlEnds, bookId: req.body.id });
    return true;
  } else if (req.method === "PATCH" && req.url.includes("/api/books/")) {
    const bookId = getIdFromUrl(urlEnds);
    if (!bookId) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Book ID is required"));
      return;
    }

    // Get existing book
    const book = searchForBookShopBookByBookId(bookId);
    if (isUndefined(book)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Book not found"));
      return false;
    }

    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("No updates provided"));
      return false;
    }

    const additionalFields = areAnyAdditionalFieldsPresent(req.body, mandatory_non_empty_fields_body);
    if (additionalFields.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Additional fields provided", additionalFields));
      return false;
    }

    logTrace("handleBooks:PATCH:", { method: req.method, urlEnds, bookId: req.body.id });
    // pass through to the next middleware to update the book
    return true;
  } else if (req.method === "DELETE" && req.url.includes("/api/books/")) {
    const bookId = getIdFromUrl(urlEnds);
    if (!bookId) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Book ID is required"));
      return false;
    }

    // Get existing book
    const book = searchForBookShopBookByBookId(bookId);
    if (isUndefined(book)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Book not found"));
      return false;
    }

    req.method = "PUT";
    req = new TracingInfoBuilder(req).setOriginMethod("DELETE").setWasAuthorized(true).setResourceId(bookId).build();
    req.url = `/api/books/${bookId}`;
    req.body = book;
    req.body._inactive = true;
    logTrace("handleBooks: SOFT DELETE: overwrite DELETE -> PUT:", {
      method: req.method,
      url: req.url,
      body: req.body,
    });

    // pass through to the next middleware to update the book
    return true;
  } else {
    logDebug("handleBooks: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
  }

  return;
}

module.exports = {
  handleBooks,
};
