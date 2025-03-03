const { searchForUserWithOnlyToken, searchForUser } = require("../../helpers/db-operation.helpers");
const { formatErrorResponse, formatInvalidTokenErrorResponse, getIdFromUrl } = require("../../helpers/helpers");
const { logTrace, logDebug } = require("../../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_OK,
  HTTP_CONFLICT,
  HTTP_UNPROCESSABLE_ENTITY,
} = require("../../helpers/response.helpers");
const { verifyAccessToken } = require("../../helpers/validation.helpers");
const { isStringOnTheList, areIdsEqual } = require("../../helpers/compare.helpers");
const {
  bookShopOrdersDb,
  bookShopItemsDb,
  booksDb,
  bookShopRolesDb,
  bookShopAccountsDb,
} = require("../../helpers/db.helpers");
const { registerSentOrder, registerBookOnAccount, registerOrderReturn } = require("../../helpers/book-shop.helpers");
const { TracingInfoBuilder } = require("../../helpers/tracing-info.helper");
const {
  searchForBookShopAccountWithUserId,
  searchForBookShopActions,
  searchForBookShopAccountsWithRoles,
  searchForBookShopItemByBookId,
  searchForBookWithId,
  getAllActiveBookShopItems,
  searchForBookShopOrderStatuses,
  searchForBookShopOrder,
  searchForBookShopAccountRole,
  searchForBookShopAccount,
  searchForBookShopItem,
} = require("../../helpers/db-operations/db-book-shop.operations");
const { isUndefined } = require("../../helpers/compare.helpers");

const orderStatuses = {
  new: 1,
  sent: 5,
  pending: 10,
  cancelled: 20,
  returned: 30,
  delivered: 40,
  completed: 99,
};

function isValueInValidFormat(price, maxLength) {
  if (isUndefined(price) === true) {
    return false;
  }

  if (/^\d+$/.test(`${price}`) === false) {
    return false;
  }

  if (maxLength !== undefined && price.toString().length > maxLength) {
    return false;
  }

  return true;
}

function handleBookShopManage(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method === "GET" && req.url.includes("/api/book-shop-manage/team")) {
    /*
    Retrieves team member information
    - Gets staff members with specific roles
    - Formats user details (name, avatar)
    - Maps role assignments
    - Returns simplified team structure
    - Includes account creation timestamps
    */
    logDebug("handleBookShopManage: get the team");

    const roles = bookShopRolesDb();
    const accounts = searchForBookShopAccountsWithRoles([1, 4, 8, 16]);
    const simpleTeam = accounts.map((account) => {
      const foundUser = searchForUser(account.user_id);
      const userName = `${foundUser.firstname} ${foundUser.lastname}`;
      return {
        id: account.id,
        user_name: userName,
        avatar: foundUser.avatar,
        role_name: roles.find((role) => areIdsEqual(role.id, account.role_id))?.name || "Unknown",
        created_at: account.created_at,
      };
    });
    logDebug("handleBookShopManage: found team", { simpleTeam });

    res.status(HTTP_OK).send(simpleTeam);
    return true;
  }

  // validate account
  const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
  const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

  logTrace("handleBookShopManage: Found User", { id: foundUser?.id });

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
  if (req.url.includes("/api/book-shop-manage/orders")) {
    /*
    Manages order administration permissions
    - Validates management access rights
    - Checks role-based authorization
    - Controls order management capabilities
    - Enforces access restrictions
    */
    const action = searchForBookShopActions("manage-orders");
    logDebug("handleBookShopManage: possibleRoleIds", { user_role_id: booksShopAccount.role_id, action });

    if (isStringOnTheList(booksShopAccount.role_id, action.role_ids) === false) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User does not have a permission"));
      return false;
    }
  } else if (req.url.includes("/api/book-shop-manage/items")) {
    const action = searchForBookShopActions("manage-items");
    logDebug("handleBookShopManage: possibleRoleIds", { user_role_id: booksShopAccount.role_id, action });

    if (isStringOnTheList(booksShopAccount.role_id, action.role_ids) === false) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User does not have a permission"));
      return false;
    }
  } else if (req.method === "GET" && req.url.includes("/api/book-shop-manage/users")) {
    const action = searchForBookShopActions("read-users");
    logDebug("handleBookShopManage: possibleRoleIds", { user_role_id: booksShopAccount.role_id, action });

    if (isStringOnTheList(booksShopAccount.role_id, action.role_ids) === false) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User does not have a permission"));
      return false;
    }
  } else if (req.url.includes("/api/book-shop-manage/users")) {
    const action = searchForBookShopActions("manage-users");
    logDebug("handleBookShopManage: possibleRoleIds", { user_role_id: booksShopAccount.role_id, action });

    if (isStringOnTheList(booksShopAccount.role_id, action.role_ids) === false) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User does not have a permission"));
      return false;
    }
  } else if (req.url.includes("/api/book-shop-manage/accounts")) {
    const action = searchForBookShopActions("manage-accounts");
    logDebug("handleBookShopManage: possibleRoleIds", { user_role_id: booksShopAccount.role_id, action });

    if (isStringOnTheList(booksShopAccount.role_id, action.role_ids) === false) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User does not have a permission"));
      return false;
    }
  }

  logDebug("handleBookShopManage: Role validation passed", { booksShopAccount });

  if (req.method === "GET" && req.url.includes("/api/book-shop-manage/orders")) {
    const allOrders = bookShopOrdersDb();
    res.status(HTTP_OK).send(allOrders);
    return true;
  } else if (req.method === "PATCH" && req.url.includes("/api/book-shop-manage/orders")) {
    /*
    Updates order status
    - Validates order existence and access
    - Checks status transition validity
    - Processes inventory updates
    - Handles order state changes
    - Updates associated timestamps
    */
    const orderId = getIdFromUrl(urlEnds);
    logDebug("handleBookShopManageOrders: PATCH - change status of order", { orderId, urlEnds });

    if (isUndefined(orderId) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Order not found"));
      return false;
    }

    const newStatusId = req.body.status_id;
    const partialOrder = {
      status_id: parseInt(newStatusId),
    };

    if (isValueInValidFormat(partialOrder.status_id) === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Status is not in valid format"));
      return false;
    }

    if (isUndefined(newStatusId) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Status not found"));
      return false;
    }

    const orderBase = searchForBookShopOrder(orderId);

    if (isUndefined(orderBase) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Order not found"));
      return false;
    }

    const currentOrderStatus = searchForBookShopOrderStatuses(orderBase.status_id);
    const foundBookShopAccount = searchForBookShopAccountWithUserId(orderBase.user_id);

    if (isUndefined(currentOrderStatus) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Status not found"));
      return false;
    }

    if (isUndefined(foundBookShopAccount) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Account not found"));
      return false;
    }

    if (areIdsEqual(booksShopAccount.role_id, 1) === false) {
      logDebug("handleBookShopManageOrders: Checking next possible status for non admins", {
        currentOrderStatus,
        newStatusId,
        booksShopAccount,
      });

      if (isStringOnTheList(newStatusId, currentOrderStatus.possible_next_statuses) === false) {
        res
          .status(HTTP_CONFLICT)
          .send(formatErrorResponse(`Cannot change order status. Not allowed by current status`));
        return false;
      }
    }

    if (
      areIdsEqual(currentOrderStatus.id, orderStatuses.new) === true &&
      areIdsEqual(newStatusId, orderStatuses.sent) === true
    ) {
      // check if items are in stock
      orderBase.book_ids.forEach((bookId) => {
        const itemBase = searchForBookShopItemByBookId(bookId);
        if (isUndefined(itemBase) === true) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse(`Item for book "${bookId}" not found`));
          return false;
        }

        if (itemBase.quantity <= 0) {
          res.status(HTTP_CONFLICT).send(formatErrorResponse(`Item for book "${bookId}" out of stock`));
          return false;
        }
      });

      // check if account has enough funds
      logDebug("handleBookShopOrders: Checking funds", {
        funds: booksShopAccount.funds,
        total_cost: orderBase.total_cost,
        currentOrderStatus,
        newStatusId,
      });

      if (booksShopAccount.funds < orderBase.total_cost) {
        res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Not enough funds"));
        return false;
      }

      registerSentOrder(booksShopAccount, orderBase, currentOrderStatus, newStatusId);
    }

    if (
      areIdsEqual(newStatusId, orderStatuses.returned) === true ||
      areIdsEqual(newStatusId, orderStatuses.cancelled) === true
    ) {
      registerOrderReturn(booksShopAccount, orderBase, currentOrderStatus, newStatusId);
    }

    // if status is delivered then add books to user account
    if (areIdsEqual(newStatusId, orderStatuses.delivered) === true) {
      orderBase.book_ids.forEach((bookId) => {
        const itemBase = searchForBookShopItemByBookId(bookId);
        if (isUndefined(itemBase) === true) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse(`Item for book "${bookId}" not found`));
          return false;
        }

        const foundBook = searchForBookWithId(bookId);

        if (isUndefined(foundBook) === true) {
          res.status(HTTP_NOT_FOUND).send(formatErrorResponse(`Book "${bookId}" not found`));
          return false;
        }

        registerBookOnAccount(booksShopAccount, bookId);
      });
    }

    req.body = partialOrder;
    req.url = `/api/book-shop-orders/${orderId}`;
    logDebug("handleBookShopManageOrders -> PATCH/PATCH:", {
      method: "PATCH",
      url: req.url,
      body: req.body,
    });

    return true;
  } else if (req.method === "GET" && req.url.includes("/api/book-shop-manage/items?book_id=")) {
    /*
    Retrieves specific item details
    - Gets item by book ID
    - Validates item existence
    - Returns detailed item information
    - Provides stock and pricing data
    */
    const bookId = req.query.book_id;
    logDebug("handleBookShopManageItems: GET bookId", { bookId });

    const itemBase = searchForBookShopItemByBookId(bookId);

    if (isUndefined(itemBase) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found"));
      return false;
    }

    res.status(HTTP_OK).send(itemBase);
    return;
  } else if (req.method === "GET" && req.url.includes("/api/book-shop-manage/books-without-items")) {
    /*
    Lists books without shop items
    - Identifies books not in inventory
    - Compares book and item databases
    - Returns available books for item creation
    - Helps inventory management
    */
    const allItems = bookShopItemsDb();
    const allBooks = booksDb();

    const allItemsBookIds = allItems.map((item) => item.book_id);
    const booksWithoutItems = allBooks.filter((book) => !isStringOnTheList(book.id, allItemsBookIds));

    res.status(HTTP_OK).send(booksWithoutItems);
    return false;
  } else if (req.method === "GET" && req.url.includes("/api/book-shop-manage/items")) {
    const allItems = getAllActiveBookShopItems();
    res.status(HTTP_OK).send(allItems);
    return false;
  } else if (req.method === "POST" && req.url.endsWith("/api/book-shop-manage/items")) {
    /*
    Creates new shop items
    - Validates book existence
    - Checks for duplicate items
    - Validates price and quantity
    - Creates inventory entries
    - Sets initial item state
    */
    const bookId = req.body.book_id;
    const quantity = req.body.quantity;
    const price = req.body.price;

    logDebug("handleBookShopManageItems: POST - create new item", { bookId, quantity, price });

    if (isUndefined(bookId) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Book not found"));
      return false;
    }

    const foundBook = searchForBookWithId(bookId);

    if (isUndefined(foundBook) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Book not found"));
      return false;
    }

    const itemBase = searchForBookShopItemByBookId(bookId);

    if (isUndefined(itemBase) === false) {
      res.status(HTTP_CONFLICT).send(formatErrorResponse("Item already exists"));
      return false;
    }

    if (isValueInValidFormat(price, 10) === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Price is not in valid format"));
      return false;
    }

    if (isValueInValidFormat(quantity, 5) === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Quantity is not in valid format"));
      return false;
    }

    const body = {
      book_id: bookId,
      quantity: parseInt(quantity),
      price: parseInt(price),
      created_at: new Date().toISOString(),
    };

    req.body = body;
    req.url = "/api/book-shop-items";
    logDebug("handleBookShopManageItems -> POST/POST:", {
      method: "POST",
      url: req.url,
      body: req.body,
    });

    return true;
  } else if (req.method === "PATCH" && req.url.includes("/api/book-shop-manage/items")) {
    /*
    Updates existing items
    - Validates item existence
    - Updates price and quantity
    - Ensures valid data formats
    - Maintains inventory accuracy
    */
    const itemId = getIdFromUrl(urlEnds);
    logDebug("handleBookShopManageItems: PATCH itemId", { itemId, urlEnds });

    if (isUndefined(itemId) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found"));
      return false;
    }

    if (isValueInValidFormat(req.body.price, 10) === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Price is not in valid format"));
      return false;
    }

    if (isValueInValidFormat(req.body.quantity, 5) === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Quantity is not in valid format"));
      return false;
    }

    const partialItem = {
      quantity: parseInt(req.body.quantity),
      price: parseInt(req.body.price),
    };

    const itemBase = searchForBookShopItem(itemId);

    if (isUndefined(itemBase) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found"));
      return false;
    }

    req.body = partialItem;
    req.url = `/api/book-shop-items/${itemId}`;
    logDebug("handleBookShopManageItems -> PATCH/PATCH:", {
      method: "PATCH",
      url: req.url,
      body: req.body,
    });

    return true;
  } else if (req.method === "DELETE" && req.url.includes("/api/book-shop-manage/items")) {
    /*
    Handles item removal (soft delete)
    - Validates item existence
    - Performs soft delete
    - Updates item status
    - Maintains referential integrity
    */
    const itemId = getIdFromUrl(urlEnds);
    logDebug("handleBookShopManageItems: (soft) DELETE itemId", { itemId, urlEnds });

    if (isUndefined(itemId) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found"));
      return false;
    }

    const itemBase = searchForBookShopItem(itemId);

    if (isUndefined(itemBase) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found"));
      return false;
    }

    req = new TracingInfoBuilder(req).setOriginMethod("DELETE").setWasAuthorized(true).setResourceId(itemId).build();

    req.method = "PUT";
    req.url = `/api/book-shop-items/${itemId}`;
    const newItemBody = itemBase;
    newItemBody._inactive = true;
    req.body = newItemBody;
    logTrace("handleBookShopManageItems: SOFT DELETE: overwrite DELETE -> PUT:", {
      method: req.method,
      url: req.url,
      body: req.body,
    });
  } else if (req.method === "GET" && req.url.includes("/api/book-shop-manage/users")) {
    /*
    Retrieves user information
    - Gets user details by ID
    - Formats user names
    - Returns user data
    - Handles multiple user lookups
    */
    let userIds = req.query.id;

    if (isUndefined(userIds) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
      return false;
    }

    if (Array.isArray(userIds) === false) {
      userIds = [userIds];
    }

    logDebug("handleBookShopManageUsers: GET userIds", { userIds });
    const userData = {};
    userIds.forEach((userId) => {
      const foundUser = searchForUser(userId);
      if (isUndefined(foundUser) !== true) {
        userData[userId] = { name: `${foundUser.firstname} ${foundUser.lastname}` };
      }
    });

    res.status(HTTP_OK).send(userData);
    return false;
  } else if (req.method === "GET" && req.url.includes("/api/book-shop-manage/accounts")) {
    /*
    Lists account information
    - Retrieves all shop accounts
    - Includes user and role details
    - Formats account data
    - Provides complete account overview
    */
    logDebug("handleBookShopManageAccounts: GET accounts");
    const accountsDataRaw = bookShopAccountsDb();

    const accountsData = accountsDataRaw.map((account) => {
      const foundUser = searchForUser(account.user_id);
      const foundRole = searchForBookShopAccountRole(account.role_id);
      const userName = `${foundUser.firstname} ${foundUser.lastname}`;
      return {
        id: account.id,
        user_id: account.user_id,
        user_name: userName,
        avatar: foundUser.avatar,
        role_id: account.role_id,
        role_name: foundRole?.name,
        created_at: account.created_at,
      };
    });

    res.status(HTTP_OK).send(accountsData);
    return false;
  } else if (req.method === "PATCH" && req.url.includes("/api/book-shop-manage/accounts/")) {
    /*
    Updates account settings
    - Validates account existence
    - Updates role assignments
    - Verifies role validity
    - Maintains account permissions
    */
    const accountId = getIdFromUrl(urlEnds);
    logDebug("handleBookShopManageAccounts: PATCH account - change role", { accountId, urlEnds });

    if (isUndefined(accountId) === true) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Account not found"));
      return false;
    }

    const foundAccount = searchForBookShopAccount(accountId);

    logTrace("handleBookShopManageAccounts: Found Account", { id: foundAccount?.id, accountIdFromUrl: accountId });

    if (isUndefined(foundAccount)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Account not found"));
      return false;
    }

    const foundRole = searchForBookShopAccountRole(req.body.role_id);

    logTrace("handleBookShopManageAccounts: Found Role", { roleId: req.body.role_id, foundRole });

    if (isUndefined(foundRole)) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Role not found"));
      return false;
    }

    req.body = {
      role_id: req.body.role_id,
    };

    req.url = `/api/book-shop-accounts/${accountId}`;
    logDebug("handleBookShopManageItems -> PATCH/PATCH:", {
      method: "PATCH",
      url: req.url,
      body: req.body,
    });

    return true;
  } else {
    res.status(HTTP_NOT_FOUND).send({});
    return false;
  }
}

module.exports = {
  handleBookShopManage,
};
