const { isUndefined } = require("lodash");
const {
  searchForUserWithOnlyToken,
  searchForContactsByUserId,
  searchForUserWithEmail,
  searchForMessagesByUserId,
  searchForMessagesByBothUserIds,
  getMessagesWithIdGreaterThan,
  searchForMessageCheckByUserId,
  searchForMessageCheckById,
  searchForContactsById,
  searchForMessagesSentToUserId,
  getUnreadMessagesPerUser,
} = require("../helpers/db-operation.helpers");
const { logTrace } = require("../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_NOT_IMPLEMENTED,
  HTTP_CONFLICT,
  HTTP_OK,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_FORBIDDEN,
} = require("../helpers/response.helpers");
const {
  verifyAccessToken,
  areMandatoryFieldsPresent,
  mandatory_non_empty_fields_message,
  isFieldsLengthValid,
} = require("../helpers/validation.helpers");
const {
  formatInvalidTokenErrorResponse,
  formatErrorResponse,
  formatMissingFieldErrorResponse,
  listIncludes,
  formatInvalidFieldErrorResponse,
} = require("../helpers/helpers");
const { areIdsEqual } = require("../helpers/compare.helpers");
const { TracingInfoBuilder } = require("../helpers/tracing-info.helper");
const { getRandomInt } = require("../helpers/generators/random-data.generator");
const DatabaseManager = require("../helpers/db.manager");
const { updateMessageCheckTimeInDb } = require("../helpers/db-queries.helper");
const { getCurrentDateTimeISO } = require("../helpers/datetime.helpers");

function handleMessenger(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.url.includes("/api/contacts") || req.url.includes("/api/messages") || req.url.endsWith("/api/messenger")) {
    res.status(HTTP_NOT_FOUND).json({});
  }
  let foundUser = undefined;
  if (req.method === "GET" && req.url.endsWith("/api/messenger/unread")) {
    const verifyTokenResult = verifyAccessToken(req, res, "messenger/unread", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleMessengerUnread: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    const sentMessages = searchForMessagesSentToUserId(foundUser.id);
    const userLastCheck = searchForMessageCheckByUserId(foundUser.id);
    const unreadMessages = getUnreadMessagesPerUser(sentMessages, userLastCheck, foundUser.id);
    res.status(HTTP_OK).json(unreadMessages);
    return;
  }
  if (req.method === "GET" && req.url.endsWith("/api/messenger/messages")) {
    const verifyTokenResult = verifyAccessToken(req, res, "messenger/messages", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleMessengerMessages: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    const messages = searchForMessagesByUserId(foundUser.id);
    res.status(HTTP_OK).json(messages);
    req = new TracingInfoBuilder(req)
      .setOriginMethod("GET")
      .setTargetResourceId(foundUser.id)
      .setResourceId(undefined)
      .setWasAuthorized(true)
      .build();

    return;
  }
  if (req.method === "GET" && req.url.includes("/api/messenger/messages?")) {
    const verifyTokenResult = verifyAccessToken(req, res, "messenger/messages", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleMessengerMessages: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    const query = req.url.split("?")[1];
    const contactId = new URLSearchParams(query).get("userId");
    const idFrom = new URLSearchParams(query).get("idFrom");

    const messages = searchForMessagesByBothUserIds(foundUser.id, contactId);
    const filteredMessages = getMessagesWithIdGreaterThan(messages, idFrom);
    res.status(HTTP_OK).json({ messages: filteredMessages });

    let messageCheck = searchForMessageCheckByUserId(foundUser.id);
    if (isUndefined(messageCheck)) {
      let newId = 0;
      for (let i = 0; i < 100; i++) {
        newId = getRandomInt(1000, 999999);
        let otherMessageCheck = searchForMessageCheckById(newId);
        if (isUndefined(otherMessageCheck)) {
          break;
        }
      }

      messageCheck = {
        id: newId,
        user_id: foundUser.id,
        last_check: getCurrentDateTimeISO(),
        last_checks: {},
      };
      messageCheck.last_checks[contactId] = getCurrentDateTimeISO();
    }
    updateMessageCheckTimeInDb(DatabaseManager.getInstance().getDb(), foundUser.id, messageCheck, contactId);

    return;
  }
  if (req.method === "POST" && req.url.endsWith("/api/messenger/messages")) {
    const verifyTokenResult = verifyAccessToken(req, res, "messenger/messages", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleMessengerMessages: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    // validate mandatory fields:
    if (!areMandatoryFieldsPresent(req.body, mandatory_non_empty_fields_message)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatMissingFieldErrorResponse(mandatory_non_empty_fields_message));
      return;
    }

    const fieldsLengthValid = isFieldsLengthValid(req.body, 128);
    if (!fieldsLengthValid.status) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .json(formatInvalidFieldErrorResponse(fieldsLengthValid, mandatory_non_empty_fields_message));
      return;
    }

    // validate receiver:
    const senderContacts = searchForContactsByUserId(foundUser.id);
    if (!listIncludes(senderContacts.user_ids, req.body.to)) {
      res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Receiver is not in contacts!"));
      return;
    }

    req.body.from = foundUser.id;
    req.body.date = getCurrentDateTimeISO();
    req.url = `/api/messages`;
    return;
  }
  if (req.method === "PUT" && req.url.endsWith("/api/messenger/messages")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }
  if (req.method === "DELETE" && req.url.endsWith("/api/messenger/messages")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }
  if (req.method === "PATCH" && req.url.endsWith("/api/messenger/messages")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }

  if (req.method === "GET" && req.url.endsWith("/api/messenger/contacts")) {
    const verifyTokenResult = verifyAccessToken(req, res, "messenger/contacts", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleMessengerContacts: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    const contacts = searchForContactsByUserId(foundUser.id);

    if (isUndefined(contacts) || isUndefined(contacts.user_ids) || contacts.user_ids.length === 0) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const ids = contacts.user_ids.map((id) => {
      return `${id}`;
    });
    const queryUrl = contacts.user_ids
      .map((id) => {
        return `id=${id}`;
      })
      .join("&");

    req = new TracingInfoBuilder(req).setOriginMethod("GET").setWasAuthorized(true).build();
    req.method = "GET";
    req.url = `/api/users?${queryUrl}`;
    req.body = undefined;
    req.query = { id: ids };
    logTrace("handleMessengerContacts: GET -> GET:", {
      method: req.method,
      url: req.url,
    });
    return;
  }
  if (req.method === "PUT" && req.url.endsWith("/api/messenger/contacts")) {
    const verifyTokenResult = verifyAccessToken(req, res, "messenger/contacts", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleMessengerContacts: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    const userToAdd = searchForUserWithEmail(req.body.email);

    if (isUndefined(userToAdd)) {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("User not found!"));
      return;
    }

    if (areIdsEqual(foundUser.id, userToAdd.id)) {
      res.status(HTTP_CONFLICT).json(formatErrorResponse("You can not add Yourself!"));
      return;
    }

    let contacts = searchForContactsByUserId(foundUser.id);

    if (isUndefined(contacts)) {
      contacts = {
        user_id: foundUser.id,
        user_ids: [],
      };
    }

    if (contacts.user_ids.includes(userToAdd.id)) {
      res.status(HTTP_CONFLICT).json(formatErrorResponse("User already in contacts!"));
      return;
    }

    if (isUndefined(contacts.user_ids)) {
      contacts.user_ids = [];
    }

    contacts.user_ids.push(userToAdd.id);

    let otherContacts = searchForContactsByUserId(userToAdd.id);
    if (isUndefined(otherContacts)) {
      let newId = 0;
      for (let i = 0; i < 100; i++) {
        newId = getRandomInt(1000, 999999);
        otherContacts = searchForContactsById(newId);
        if (isUndefined(otherContacts)) {
          break;
        }
      }

      otherContacts = {
        id: newId,
        user_id: userToAdd.id,
        user_ids: [],
      };
    }
    otherContacts.user_ids.push(foundUser.id);

    req = new TracingInfoBuilder(req)
      .setOriginMethod("PUT")
      .setWasAuthorized(true)
      .setTargetResource(otherContacts)
      .setTargetResourceId(otherContacts.id)
      .build();

    if (contacts.id === undefined) {
      req.method = "POST";
      req.url = `/api/contacts/`;
    } else {
      req.method = "PUT";
      req.url = `/api/contacts/${contacts.id}`;
    }

    req.body = contacts;
    logTrace("handleMessengerContacts: PUT -> PUT:", {
      method: req.method,
      url: req.url,
      body: req.body,
    });
    return;
  }
  if (req.method === "POST" && req.url.endsWith("/api/messenger/contacts")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }
  if (req.method === "PATCH" && req.url.endsWith("/api/messenger/contacts")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }
  if (req.method === "DELETE" && req.url.endsWith("/api/messenger/contacts")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }

  return;
}

module.exports = {
  handleMessenger,
};
