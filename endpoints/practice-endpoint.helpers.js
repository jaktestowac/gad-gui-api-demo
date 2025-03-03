const { isUndefined } = require("../helpers/compare.helpers");
const { formatErrorResponse } = require("../helpers/helpers");
const { logDebug } = require("../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_OK, HTTP_UNAUTHORIZED } = require("../helpers/response.helpers");
const { sessionV1, sessionV2 } = require("./practice/session-handlers");
const { todoV1, todoV2, todoV3, todoV4, todoV5, todoV6 } = require("./practice/todo-handlers");
const { expenseV1, expenseV2, expenseV3 } = require("./practice/expense-handlers");

function isIdValid(id) {
  return id !== undefined && id !== "";
}

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

    // Todo v1 endpoints
    if (req.url.includes("/api/practice/v1/todos")) {
      const url = req.url;
      const id = url.split("/api/practice/v1/todos")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return todoV1.getAll(req, res);
        case req.method === "POST" && !isIdValid(id):
          return todoV1.create(req, res);
        case req.method === "PUT" && isIdValid(id):
          return todoV1.update(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return todoV1.delete(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Todo v2 endpoints
    if (req.url.includes("/api/practice/v2/todos")) {
      const url = req.url;
      const id = url.split("/api/practice/v2/todos")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return todoV2.getAll(req, res);
        case req.method === "POST" && !isIdValid(id):
          return todoV2.create(req, res);
        case req.method === "PUT" && isIdValid(id):
          return todoV2.update(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return todoV2.delete(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Todo v3 endpoints
    if (req.url.includes("/api/practice/v3/todos")) {
      const url = req.url;
      const id = url.split("/api/practice/v3/todos")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return todoV3.getAll(req, res);
        case req.method === "POST" && !isIdValid(id):
          return todoV3.create(req, res);
        case req.method === "PUT" && isIdValid(id):
          return todoV3.update(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return todoV3.delete(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Todo v4 endpoints
    if (req.url.includes("/api/practice/v4/todos")) {
      const url = req.url;
      const id = url.split("/api/practice/v4/todos")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return todoV4.getAll(req, res);
        case req.method === "POST" && !isIdValid(id):
          return todoV4.create(req, res);
        case req.method === "PUT" && isIdValid(id):
          return todoV4.update(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return todoV4.delete(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Todo v5 endpoints
    if (req.url.includes("/api/practice/v5/todos")) {
      const url = req.url;
      const id = url.split("/api/practice/v5/todos")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return todoV5.getAll(req, res);
        case req.method === "POST" && !isIdValid(id):
          return todoV5.create(req, res);
        case req.method === "PUT" && isIdValid(id):
          return todoV5.update(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return todoV5.delete(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Todo v6 endpoints
    if (req.url.includes("/api/practice/v6/todos")) {
      const url = req.url;
      const parts = url.split("/api/practice/v6/todos")[1]?.split("/");
      const id = parts?.[1];
      const action = parts?.[2];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return todoV6.getAll(req, res);
        case req.method === "POST" && !isIdValid(id):
          return todoV6.create(req, res);
        case req.method === "PUT" && isIdValid(id):
          return todoV6.update(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return todoV6.delete(req, res, id);
        case req.method === "POST" && id && action === "start":
          return todoV6.startTimer(req, res, id);
        case req.method === "POST" && id && action === "stop":
          return todoV6.stopTimer(req, res, id);
        case req.method === "POST" && url.endsWith("/templates"):
          return todoV6.createTemplate(req, res);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Expense v1 endpoints
    if (req.url.includes("/api/practice/v1/expenses")) {
      const url = req.url;
      const id = url.split("/api/practice/v1/expenses")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return expenseV1.getAll(req, res);
        case req.method === "GET" && isIdValid(id):
          return expenseV1.getOne(req, res, id);
        case req.method === "POST" && !isIdValid(id):
          return expenseV1.create(req, res);
        case req.method === "PUT" && isIdValid(id):
          return expenseV1.update(req, res, id);
        case req.method === "PATCH" && isIdValid(id):
          return expenseV1.patch(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return expenseV1.delete(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Expense v2 endpoints
    if (req.url.includes("/api/practice/v2/expenses")) {
      const url = req.url;
      const id = url.split("/api/practice/v2/expenses")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return expenseV2.getAll(req, res);
        case req.method === "GET" && isIdValid(id):
          return expenseV2.getOne(req, res, id);
        case req.method === "POST" && !isIdValid(id):
          return expenseV2.create(req, res);
        case req.method === "PUT" && isIdValid(id):
          return expenseV2.update(req, res, id);
        case req.method === "PATCH" && isIdValid(id):
          return expenseV2.patch(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return expenseV2.delete(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Expense v3 endpoints
    if (req.url.includes("/api/practice/v3/expenses")) {
      const url = req.url;
      const id = url.split("/api/practice/v3/expenses")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return expenseV3.getAll(req, res);
        case req.method === "GET" && isIdValid(id):
          return expenseV3.getOne(req, res, id);
        case req.method === "POST" && !isIdValid(id):
          return expenseV3.create(req, res);
        case req.method === "PUT" && isIdValid(id):
          return expenseV3.update(req, res, id);
        case req.method === "PATCH" && isIdValid(id):
          return expenseV3.patch(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return expenseV3.delete(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
  }
}

module.exports = {
  handlePractice,
};
