const { isUndefined } = require("../helpers/compare.helpers");
const { formatErrorResponse } = require("../helpers/helpers");
const { logDebug } = require("../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_OK, HTTP_UNAUTHORIZED } = require("../helpers/response.helpers");
const { sessionV1, sessionV2 } = require("./practice/session-handlers");

function handlePractice(req, res) {
  if (req.url.includes("/api/practice")) {
    // Basic modal login endpoint
    if (req.method === "POST" && req.url.endsWith("/api/practice/modals/login")) {
      const body = req.body;
      if (isUndefined(body) || isUndefined(body.username) || isUndefined(body.password)) {
        return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Unauthorized!"));
      }
      if (body.username === "user" && body.password === "pass") {
        return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid credentials!"));
      }
      logDebug("handlePractice:login", { body });
      return res.status(HTTP_OK).json({});
    }

    // Session v1 endpoints
    if (req.url.includes("/api/practice/session/v1/")) {
      const endpoint = req.url.split("/api/practice/session/v1/")[1];

      switch (true) {
        case req.method === "POST" && endpoint === "login":
          return sessionV1.handleLogin(req, res);
        case req.method === "GET" && endpoint === "check":
          return sessionV1.handleCheck(req, res);
        case req.method === "POST" && endpoint === "logout":
          return sessionV1.handleLogout(req, res);
      }
    }

    // Session v2 endpoints
    if (req.url.includes("/api/practice/session/v2/")) {
      const endpoint = req.url.split("/api/practice/session/v2/")[1];

      switch (true) {
        case req.method === "POST" && endpoint === "login":
          return sessionV2.handleLogin(req, res);
        case req.method === "GET" && endpoint === "check":
          return sessionV2.handleCheck(req, res);
        case req.method === "POST" && endpoint === "logout":
          return sessionV2.handleLogout(req, res);
      }
    }

    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
  }
}

module.exports = {
  handlePractice,
};
