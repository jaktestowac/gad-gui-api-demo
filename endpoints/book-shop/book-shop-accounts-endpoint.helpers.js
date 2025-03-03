const { isUndefined } = require("lodash");
const { searchForUserWithOnlyToken } = require("../../helpers/db-operation.helpers");
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
const {
  searchForBookShopAccountWithUserId,
  searchForBookShopAccount,
} = require("../../helpers/db-operations/db-book-shop.operations");

function handleBookShopAccount(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.endsWith("/api/book-shop-accounts")) {
    /*
    Retrieves user's book shop account
    - Validates user authentication
    - Handles bug flag checks
    - Verifies account ownership
    - Returns account details for authorized user
    */
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
    /*
    Retrieves user's book collections
    - Returns all book list types (wishlist, read, owned, purchased, favorites)
    - Requires valid user authentication
    - Verifies book shop account existence
    - Provides organized collection data
    */
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
    /*
    Retrieves specific account details
    - Validates user authentication and access rights
    - Gets account by ID
    - Verifies account ownership
    - Ensures secure access to account data
    */
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
    /*
    Authorizes user for book shop access
    - Validates user credentials
    - Checks book shop account existence
    - Verifies role permissions
    - Returns authorization status with account details
    */
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
    /*
    Creates new book shop account
    - Validates user authentication
    - Prevents duplicate accounts
    - Sets up default account settings and collections
    - Initializes with bonus funds
    - Creates empty book lists
    */
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
    /*
    Updates account information
    - Validates user and account ownership
    - Updates shipping/billing details
    - Validates field lengths and types
    - Prevents invalid field updates
    - Maintains data integrity
    */
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
