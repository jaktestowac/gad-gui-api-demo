const { isUndefined } = require("lodash");
const {
  searchForUserWithOnlyToken,
  searchForContactsByUserId,
  searchForUserWithEmail,
} = require("../helpers/db-operation.helpers");
const { logTrace, logDebug } = require("../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED, HTTP_NOT_IMPLEMENTED } = require("../helpers/response.helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");
const { formatInvalidTokenErrorResponse, formatErrorResponse } = require("../helpers/helpers");
const { areIdsEqual } = require("../helpers/compare.helpers");

function handleMessenger(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.url.includes("/api/contacts") || req.url.includes("/api/messages") || req.url.endsWith("/api/messenger")) {
    res.status(HTTP_NOT_FOUND).json({});
  }
  let foundUser = undefined;

  if (req.method === "GET" && req.url.endsWith("/api/messenger/messages")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }
  if (req.method === "POST" && req.url.endsWith("/api/messenger/messages")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }
  if (req.method === "PUT" && req.url.endsWith("/api/messenger/messages")) {
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

    if (isUndefined(contacts.contacts) || contacts.contacts.length === 0) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const ids = contacts.contacts.map((id) => {
      return `${id}`;
    });
    const queryUrl = contacts.contacts
      .map((id) => {
        return `id=${id}`;
      })
      .join("&");

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
  if (req.method === "POST" && req.url.endsWith("/api/messenger/contacts")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
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
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("You can not add Yourself!"));
      return;
    }

    const contacts = searchForContactsByUserId(foundUser.id);

    if (contacts.contacts.includes(userToAdd.id)) {
      res.status(HTTP_NOT_FOUND).json(formatErrorResponse("User already in contacts!"));
      return;
    }

    if (isUndefined(contacts.contacts)) {
      contacts.contacts = [];
    }

    contacts.contacts.push(userToAdd.id);

    req.method = "PUT";
    req.url = `/api/contacts/${contacts.id}`;
    req.body = contacts;
    logTrace("handleMessengerContacts: PUT -> PUT:", {
      method: req.method,
      url: req.url,
      body: req.body,
    });
    return;
  }

  return;
}

module.exports = {
  handleMessenger,
};
