const { isUndefined } = require("lodash");
const {
  searchForUserWithOnlyToken,
  searchForBookShopAccount,
  searchForBookShopAccountWithUserId,
  searchForBookShopActions,
} = require("../../helpers/db-operation.helpers");
const {
  formatErrorResponse,
  getIdFromUrl,
  formatInvalidTokenErrorResponse,
  formatInvalidFieldErrorResponse,
} = require("../../helpers/helpers");
const { logDebug, logTrace } = require("../../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_CONFLICT,
  HTTP_OK,
  HTTP_FORBIDDEN,
} = require("../../helpers/response.helpers");
const {
  verifyAccessToken,
  isFieldsLengthValid,
  areAnyAdditionalFieldsPresent,
  all_possible_fields_book_shop_account,
} = require("../../helpers/validation.helpers");
const { areIdsEqual } = require("../../helpers/compare.helpers");
const { isBugEnabled } = require("../../config/config-manager");
const { BugConfigKeys } = require("../../config/enums");
const { getCurrentDateTimeISO } = require("../../helpers/datetime.helpers");

function handleBookShopAccount(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.endsWith("/api/book-shop-accounts")) {
    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop/accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    if (!foundUser) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
      return false;
    }

    logTrace("handleBookShopAccount: Found User", { id: foundUser?.id });

    const bug001Enabled = isBugEnabled(BugConfigKeys.BUG_BOOK_SHOP_ACCOUNT_001);
    if (bug001Enabled === true) {
      return;
    }

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const foundAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (isUndefined(foundAccount) || areIdsEqual(foundAccount.user_id, foundUser.id) === false) {
      res.status(HTTP_NOT_FOUND).send(formatInvalidTokenErrorResponse());
      return false;
    }

    req.url = `/api/book-shop-accounts/${foundAccount.id}`;
    return true;
  } else if (req.method === "GET" && req.url.endsWith("/api/book-shop-accounts/my-books")) {
    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logTrace("handleBookShopAccount: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (booksShopAccount === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
      return false;
    }

    res.status(HTTP_OK).send({
      wishlist_books_ids: booksShopAccount.wishlist_books_ids,
      read_books_ids: booksShopAccount.read_books_ids,
      owned_books_ids: booksShopAccount.owned_books_ids,
      purchased_book_ids: booksShopAccount.purchased_book_ids,
      favorite_books_ids: booksShopAccount.favorite_books_ids,
    });

    return true;
  } else if (req.method === "GET" && req.url.includes("/api/book-shop-accounts/")) {
    const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts/{id}", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    let accountId = getIdFromUrl(urlEnds);
    const foundAccount = searchForBookShopAccount(accountId);

    logTrace("handleBookShopAccount: Found User", { id: foundUser?.id, accountId, foundAccount });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    if (isUndefined(foundAccount) || areIdsEqual(foundAccount.user_id, foundUser.id) === false) {
      res.status(HTTP_NOT_FOUND).send(formatInvalidTokenErrorResponse());
      return false;
    }

    return true;
  } else if (req.method === "POST" && req.url.endsWith("/api/book-shop-authorize")) {
    logDebug("handleBookShopAccount: User authorization");
    const verifyTokenResult = verifyAccessToken(req, res, "POST book-shop-authorize", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logTrace("handleBookShopAuthorize: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    logDebug("handleBookShopAuthorize: Found ShopAccount", { id: booksShopAccount?.id });

    if (booksShopAccount === undefined) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
      return false;
    }

    if (req.body.role_ids !== undefined) {
      logDebug("handleBookShopAuthorize: Check if account has one of roles:", { role_ids: req.body.role_ids });
      const roleAllowed = req.body.role_ids.includes(booksShopAccount.role_id);

      if (roleAllowed === false) {
        res.status(HTTP_FORBIDDEN).send(formatErrorResponse("User does not have the required role"));
        return false;
      }
    }

    res.status(HTTP_OK).send({
      user_id: booksShopAccount.user_id,
      role_id: booksShopAccount.role_id,
      id: booksShopAccount.id,
    });

    return true;
  } else if (req.method === "POST" && req.url.endsWith("/api/book-shop-accounts")) {
    logDebug("handleBookShopAccount: Creation of user account");
    const verifyTokenResult = verifyAccessToken(req, res, "POST book-shop-accounts", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    logTrace("handleBookShopAccount: Found User", { id: foundUser?.id });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

    if (booksShopAccount !== undefined) {
      res.status(HTTP_CONFLICT).send(formatErrorResponse("User already has a book shop account"));
      return false;
    }

    req.body = {
      user_id: foundUser.id,
      role_id: 2, // default role - reader
      wishlist_books_ids: [],
      read_books_ids: [],
      owned_books_ids: [],
      purchased_book_ids: [],
      favorite_books_ids: [],
      funds: 10000, // first bonus
      created_at: getCurrentDateTimeISO(),
      country: "",
      city: "",
      street: "",
      postal_code: "",
    };

    return true;
  } else if (req.method === "PATCH" && req.url.includes("/api/book-shop-accounts/")) {
    logDebug("handleBookShopAccount: Update account", { url: req.url, urlEnds });

    const verifyTokenResult = verifyAccessToken(req, res, "PATCH book-shop-accounts/{id}", req.url);
    const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    let accountId = getIdFromUrl(urlEnds);
    const foundAccount = searchForBookShopAccount(accountId);

    logTrace("handleBookShopAccount: Found Account", { id: foundAccount?.id, accountIdFromUrl: accountId });

    if (isUndefined(foundAccount) || areIdsEqual(foundAccount.user_id, foundUser.id) === false) {
      res.status(HTTP_NOT_FOUND).send(formatInvalidTokenErrorResponse());
      return false;
    }

    if (areIdsEqual(accountId, foundAccount.id) === false) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return false;
    }

    if (Object.keys(req.body).length === 0) {
      res.status(HTTP_FORBIDDEN).send(formatErrorResponse("No fields to update"));
      return false;
    }

    const fieldsLengthValid = isFieldsLengthValid(req.body, 256);
    const anyAdditionalFields = areAnyAdditionalFieldsPresent(req.body, all_possible_fields_book_shop_account);

    logTrace("handleBookShopAccount: Fields Length Valid", { status: fieldsLengthValid.status });
    logTrace("handleBookShopAccount: Additional Fields Present", { status: anyAdditionalFields.status });

    if (fieldsLengthValid.status === false || anyAdditionalFields.status === true) {
      res.status(HTTP_FORBIDDEN).send(formatInvalidFieldErrorResponse(anyAdditionalFields.error));
      return false;
    }

    req.body = {
      country: req.body.country,
      city: req.body.city,
      street: req.body.street,
      postal_code: req.body.postal_code,
    };

    return true;
  } else {
    logDebug("handleBookShopAccount: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
  }
  return;
}

module.exports = {
  handleBookShopAccount,
};
