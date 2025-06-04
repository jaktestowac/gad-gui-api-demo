const { isUndefined } = require("../helpers/compare.helpers");
const { formatErrorResponse } = require("../helpers/helpers");
const { logDebug } = require("../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_OK, HTTP_UNAUTHORIZED, HTTP_BAD_REQUEST } = require("../helpers/response.helpers");
const { sessionV1, sessionV2 } = require("./practice/session-handlers");
const { todoV1, todoV2, todoV3, todoV4, todoV5, todoV6 } = require("./practice/todo-handlers");
const { expenseV1, expenseV2, expenseV3 } = require("./practice/expense-handlers");
const { employeeV1 } = require("./practice/employee-management-system/employee-handlers");
const { departmentV1 } = require("./practice/employee-management-system/department-handlers");
const { roleV1 } = require("./practice/employee-management-system/role-handlers");
const { attendanceV1 } = require("./practice/employee-management-system/attendance-handlers");
const { authV1 } = require("./practice/employee-management-system/auth-handlers");
const { authV2 } = require("./practice/chat-auth-handlers");
const { verifyToken, hasPermission } = require("./practice/employee-management-system/auth-middleware");
const twoFactor = require("./practice/2fa-handlers");
const twoFactorV2 = require("./practice/2fa-handlers-v2");
const weatherAppV1 = require("./practice/weather-app-handlers-v1");
const { handleGraphQLRequest } = require("./practice/weather-graphql-handlers");
const { handleBooksGraphQLRequest } = require("./practice/books-graphql-handlers");
const aiChat = require("./practice/nova/nova-chat-handlers");
const testagram = require("./practice/testagram/testagram-handlers");
const chirper = require("./practice/chirper/chirper-handlers");
const {
  getDirectoryContents,
  getFileDetails,
  createItem,
  updateFile,
  deleteItem,
} = require("./practice/file-system-handlers");
const hotelHandlers = require("./practice/hotel-handlers");

function isIdValid(id) {
  return id !== undefined && id !== "";
}

// Helper to chain middleware
function applyMiddleware(middlewares, handler) {
  return (req, res, ...args) => {
    let index = 0;

    function next(req, res) {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        return middleware(req, res, next);
      } else {
        return handler(req, res, ...args);
      }
    }

    return next(req, res);
  };
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

    // Employee management system endpoints
    if (req.url.includes("/api/practice/v1/employees")) {
      const url = req.url;
      const id = url.split("/api/practice/v1/employees")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("VIEW")], employeeV1.getAll)(req, res);
        case req.method === "GET" && isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("VIEW")], employeeV1.getOne)(req, res, id);
        case req.method === "POST" && !isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("CREATE")], employeeV1.create)(req, res);
        case req.method === "PUT" && isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("UPDATE")], employeeV1.update)(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("DELETE")], employeeV1.delete)(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Department endpoints
    if (req.url.includes("/api/practice/v1/departments")) {
      const url = req.url;
      const id = url.split("/api/practice/v1/departments")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("VIEW")], departmentV1.getAll)(req, res);
        case req.method === "GET" && isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("VIEW")], departmentV1.getOne)(req, res, id);
        case req.method === "POST" && !isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("CREATE")], departmentV1.create)(req, res);
        case req.method === "PUT" && isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("UPDATE")], departmentV1.update)(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("DELETE")], departmentV1.delete)(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Role/permission endpoints
    if (req.url.includes("/api/practice/v1/roles")) {
      const url = req.url;
      const id = url.split("/api/practice/v1/roles")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("VIEW")], roleV1.getAll)(req, res);
        case req.method === "POST" && !isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("CREATE")], roleV1.create)(req, res);
        case req.method === "PUT" && isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("UPDATE")], roleV1.update)(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("DELETE")], roleV1.delete)(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Attendance endpoints
    if (req.url.includes("/api/practice/v1/attendance")) {
      const url = req.url;
      const id = url.split("/api/practice/v1/attendance")[1]?.split("/")[1];

      switch (true) {
        case req.method === "GET" && !isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("VIEW")], attendanceV1.getAll)(req, res);
        case req.method === "POST" && !isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("CREATE")], attendanceV1.create)(req, res);
        case req.method === "PUT" && isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("UPDATE")], attendanceV1.update)(req, res, id);
        case req.method === "DELETE" && isIdValid(id):
          return applyMiddleware([verifyToken, hasPermission("DELETE")], attendanceV1.delete)(req, res, id);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Auth endpoints
    if (req.url.includes("/api/practice/v1/auth")) {
      const endpoint = req.url.split("/api/practice/v1/auth/")[1];

      switch (true) {
        case req.method === "POST" && endpoint === "login":
          return authV1.login(req, res);
        case req.method === "POST" && endpoint === "logout":
          return authV1.logout(req, res);
        case req.method === "GET" && endpoint === "permissions":
          return applyMiddleware([verifyToken], authV1.getPermissions)(req, res);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    // Chat Auth endpoints v2
    if (req.url.includes("/api/practice/v2/auth")) {
      const endpoint = req.url.split("/api/practice/v2/auth/")[1];

      switch (true) {
        case req.method === "POST" && endpoint === "register":
          return authV2.register(req, res);
        case req.method === "POST" && endpoint === "login":
          return authV2.login(req, res);
        case req.method === "POST" && endpoint === "logout":
          return authV2.logout(req, res);
        case req.method === "GET" && endpoint === "check":
          return authV2.checkAuth(req, res);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    if (req.url.includes("/api/practice/v1/2fa")) {
      const endpoint = req.url.split("/api/practice/v1/2fa/")[1];

      switch (true) {
        case req.method === "POST" && endpoint === "register":
          return twoFactor.registerUser(req, res);
        case req.method === "POST" && endpoint === "login":
          return twoFactor.loginUser(req, res);
        case req.method === "POST" && endpoint === "logout":
          return twoFactor.logout(req, res);
        case req.method === "POST" && endpoint === "enable-2fa":
          return twoFactor.enableTwoFA(req, res);
        case req.method === "POST" && endpoint === "verify-2fa":
          return twoFactor.verifyTwoFA(req, res);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    if (req.url.includes("/api/practice/v2/2fa")) {
      const endpoint = req.url.split("/api/practice/v2/2fa/")[1];

      switch (true) {
        case req.method === "POST" && endpoint === "register":
          return twoFactorV2.registerUser(req, res);
        case req.method === "POST" && endpoint === "login":
          return twoFactorV2.loginUser(req, res);
        case req.method === "POST" && endpoint === "logout":
          return twoFactorV2.logout(req, res);
        case req.method === "POST" && endpoint === "enable-2fa":
          return twoFactorV2.enableTwoFA(req, res);
        case req.method === "POST" && endpoint === "verify-2fa":
          return twoFactorV2.verifyTwoFA(req, res);
        case req.method === "POST" && endpoint === "disable-2fa":
          return twoFactorV2.disable2FA(req, res);
        case req.method === "POST" && endpoint === "extend-session":
          return twoFactorV2.extendSession(req, res);
        case req.method === "GET" && endpoint === "check":
          return twoFactorV2.checkAuth(req, res);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    }

    if (req.url.includes("/api/practice/v1/file-system")) {
      let endpoint = req.url.split("/api/practice/v1/file-system/")[1];
      if (endpoint && endpoint.includes("?")) {
        endpoint = endpoint.split("?")[0];
      }
      switch (true) {
        case req.method === "GET" && endpoint === "directory":
          return getDirectoryContents(req, res);
        case req.method === "GET" && endpoint === "file":
          return getFileDetails(req, res);
        case req.method === "POST" && endpoint === "create":
          return createItem(req, res);
        case req.method === "PUT" && endpoint === "update":
          return updateFile(req, res);
        case req.method === "DELETE" && endpoint === "delete":
          return deleteItem(req, res);
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
      }
    } // AI Chat endpoints
    if (req.url.includes("/api/practice/v1/ai-chat")) {
      let endpoint = req.url.split("/api/practice/v1/ai-chat/")[1];

      // endpoint can have query params
      if (endpoint && endpoint.includes("?")) {
        endpoint = endpoint.split("?")[0];
      }
      logDebug("--- --- handlePractice:aiChat", { endpoint, method: req.method });
      switch (true) {
        case req.method === "POST" && endpoint === "message":
          return aiChat.handleMessage(req, res);
        case req.method === "GET" && endpoint === "history":
          return aiChat.getConversationHistory(req, res);
        case req.method === "POST" && endpoint === "clear":
          return aiChat.clearConversation(req, res);
        case req.method === "POST" && endpoint === "rename":
          return aiChat.renameConversation(req, res);
        case req.method === "GET" && endpoint === "list":
          return aiChat.listConversations(req, res);
        case req.method === "GET" && endpoint === "stats":
          return aiChat.getStatistics(req, res);
        case req.method === "GET" && endpoint === "session":
          return aiChat.initSession(req, res);
        case req.method === "POST" && endpoint === "clear-memory":
          return aiChat.clearUserMemory(req, res);
        case req.method === "POST" && endpoint === "clear-all": {
          const userId = req.body && req.body.userId;
          if (!userId) {
            return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing userId"));
          }
          const result = aiChat.clearAllConversations(userId);
          if (result) {
            return res.status(HTTP_OK).json({ success: true });
          } else {
            return res.status(HTTP_OK).json({ success: false, message: "No conversations found for user" });
          }
        }
        default:
          return res.status(HTTP_NOT_FOUND).send(formatErrorResponse(`Not Found! ${req.url}`));
      }
    }

    // Weather App v1 endpoints
    if (req.url.includes("/api/practice/v1/weather")) {
      const url = req.url; // Weather data endpoints
      if (req.method === "GET" && url.endsWith("/api/practice/v1/weather/current")) {
        return weatherAppV1.getCurrentWeather(req, res, 1); // Use scope 1
      }

      if (req.method === "POST" && url.endsWith("/api/practice/v1/weather/day")) {
        return weatherAppV1.getWeatherByDay(req, res, 1); // Use scope 1
      }

      // Weather events endpoints
      if (req.method === "POST" && url.endsWith("/api/practice/v1/weather/event")) {
        return applyMiddleware([weatherAppV1.authenticate], weatherAppV1.createWeatherEvent)(req, res);
      }

      if (req.method === "GET" && url.includes("/api/practice/v1/weather/event")) {
        // Check if this is the get single event by ID endpoint
        const eventIdMatch = url.match(/\/api\/practice\/v1\/weather\/event\/([^\/]+)$/);
        if (eventIdMatch) {
          const id = eventIdMatch[1];
          req.params = { id };
          return applyMiddleware([weatherAppV1.authenticate], weatherAppV1.getWeatherEventById)(req, res);
        } else {
          // This is the get all events endpoint
          return applyMiddleware([weatherAppV1.authenticate], weatherAppV1.getWeatherEvents)(req, res);
        }
      }

      // Fixed PUT endpoint to extract ID from URL instead of body
      const updateEventIdMatch = url.match(/\/api\/practice\/v1\/weather\/event\/([^\/]+)$/);
      if (req.method === "PUT" && updateEventIdMatch) {
        const id = updateEventIdMatch[1];
        req.params = { id };
        // Make sure ID is also available in the body
        if (!req.body) {
          req.body = {};
        }
        req.body.id = parseInt(id, 10);
        return applyMiddleware([weatherAppV1.authenticate], weatherAppV1.updateWeatherEvent)(req, res);
      }

      const deleteEventIdMatch = url.match(/\/api\/practice\/v1\/weather\/event\/([^\/]+)$/);
      if (req.method === "DELETE" && deleteEventIdMatch) {
        const id = deleteEventIdMatch[1];
        req.params = { id };
        return applyMiddleware([weatherAppV1.authenticate], weatherAppV1.deleteWeatherEvent)(req, res);
      }

      // Weather auth endpoints
      if (req.method === "POST" && url.endsWith("/api/practice/v1/weather/auth/register")) {
        return weatherAppV1.register(req, res);
      }

      if (req.method === "POST" && url.endsWith("/api/practice/v1/weather/auth/login")) {
        return weatherAppV1.login(req, res);
      }

      if (req.method === "POST" && url.endsWith("/api/practice/v1/weather/auth/logout")) {
        return weatherAppV1.logout(req, res);
      }

      if (req.method === "GET" && url.endsWith("/api/practice/v1/weather/auth/current-user")) {
        return applyMiddleware([weatherAppV1.authenticate], weatherAppV1.getCurrentUser)(req, res);
      }

      // Admin endpoints
      if (req.method === "GET" && url.endsWith("/api/practice/v1/weather/admin/data")) {
        return applyMiddleware([weatherAppV1.authenticate, weatherAppV1.adminOnly], weatherAppV1.getAllData)(req, res);
      }
    } // Hotel Reservation API endpoints
    if (req.url.includes("/api/practice/v1/hotels")) {
      const url = req.url;

      const hotelId = url.match(/\/api\/practice\/v1\/hotels\/([^/]+)\/?/)?.[1];
      const configurationMatch = url.match(/\/api\/practice\/v1\/hotels\/([^/]+)\/configuration/);

      logDebug("handlePractice:hotel", { url, hotelId, configurationMatch });

      switch (true) {
        // Get specific hotel configuration by hotel ID
        case req.method === "GET" && configurationMatch?.length > 0: {
          const configHotelId = configurationMatch[1];
          req.params = { id: configHotelId };
          return hotelHandlers.getHotelConfigurationById(req, res);
        }

        // Get all hotels
        case req.method === "GET" && url.endsWith("/api/practice/v1/hotels"):
          return hotelHandlers.getHotelsData(req, res);

        // Get specific hotel by ID
        case req.method === "GET" && hotelId && !url.includes("/configuration"):
          req.params = { id: hotelId };
          return hotelHandlers.getHotelById(req, res);

        // Get all hotel configurations
        case req.method === "GET" && url.endsWith("/api/practice/v1/hotels/configurations"):
          return hotelHandlers.getHotelConfigurations(req, res);

        // Get default hotel configuration
        case req.method === "GET" && url.endsWith("/api/practice/v1/hotels/configuration/default"):
          return hotelHandlers.getDefaultHotelConfiguration(req, res);
      }
    }

    if (req.url === "/api/practice/lang/v1/languages" && req.method === "GET") {
      // Return available languages
      return res.status(HTTP_OK).json({
        en: "English",
        pl: "Polski",
        de: "Deutsch",
      });
    }
    if (req.url === "/api/practice/lang/v1/translations" && req.method === "GET") {
      // Return translations JSON
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(__dirname, "../data/translations/practice-lang.json");
      try {
        const data = fs.readFileSync(filePath, "utf8");
        return res.status(HTTP_OK).json(JSON.parse(data));
      } catch (e) {
        logDebug("handlePractice:translations", { error: e.message });
        return res.status(HTTP_NOT_FOUND).json({ error: "Translations not found" });
      }
    }
    if (req.url.includes("/api/practice/weather/v1/graphql")) {
      // Handle Weather GraphQL requests
      return handleGraphQLRequest(req, res);
    }
    if (req.url.includes("/api/practice/books/v1/graphql")) {
      // Handle Books GraphQL requests
      return handleBooksGraphQLRequest(req, res);
    }

    // Testagram routes
    if (req.url.includes("/api/practice/v1/testagram")) {
      const url = req.url;

      // Auth routes
      if (url.includes("/api/practice/v1/testagram/auth")) {
        const endpoint = url.split("/api/practice/v1/testagram/auth/")[1];

        switch (true) {
          case req.method === "POST" && endpoint === "register":
            return testagram.register(req, res);
          case req.method === "POST" && endpoint === "login":
            return testagram.login(req, res);
          case req.method === "POST" && endpoint === "logout":
            return testagram.logout(req, res);
          case req.method === "GET" && endpoint === "check":
            return applyMiddleware([testagram.verifyToken], testagram.checkAuth)(req, res);
          default:
            return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Auth endpoint not found"));
        }
      }

      // Posts routes
      if (url.includes("/api/practice/v1/testagram/posts")) {
        const parts = url.split("/api/practice/v1/testagram/posts")[1]?.split("/");
        const id = parts?.[1];
        const action = parts?.[2];
        switch (true) {
          case req.method === "GET" && !isIdValid(id):
            // Skip authentication middleware for GET requests to posts endpoint
            return testagram.getPosts(req, res);
          case req.method === "POST" && !isIdValid(id):
            return applyMiddleware([testagram.verifyToken], testagram.createPost)(req, res);
          case req.method === "GET" && isIdValid(id):
            req.params = { id };
            return applyMiddleware([testagram.verifyToken], testagram.getPostById)(req, res);
          case req.method === "DELETE" && isIdValid(id):
            req.params = { id };
            return applyMiddleware([testagram.verifyToken], testagram.deletePost)(req, res);
          case req.method === "POST" && isIdValid(id) && action === "like":
            req.params = { id };
            return applyMiddleware([testagram.verifyToken], testagram.toggleLike)(req, res);
          case req.method === "POST" && isIdValid(id) && action === "comment":
            req.params = { id };
            return applyMiddleware([testagram.verifyToken], testagram.addComment)(req, res);
          default:
            return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Posts endpoint not found"));
        }
      }

      // User profile routes
      if (url.includes("/api/practice/v1/testagram/users")) {
        const parts = url.split("/api/practice/v1/testagram/users")[1]?.split("/");
        const username = parts?.[1];
        const action = parts?.[2];

        logDebug("handlePractice:testagram", { username, action, method: req.method });

        switch (true) {
          case req.method === "GET" && username !== undefined:
            req.params = { username };
            return applyMiddleware([testagram.verifyToken], testagram.getUserProfile)(req, res);
          case req.method === "PUT":
            return applyMiddleware([testagram.verifyToken], testagram.updateProfile)(req, res);
          case req.method === "POST" && username && action === "follow":
            req.params = { username };
            return applyMiddleware([testagram.verifyToken], testagram.toggleFollow)(req, res);
          default:
            return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Users endpoint not found"));
        }
      }

      // Search users
      if (url.includes("/api/practice/v1/testagram/search") && req.method === "GET") {
        return applyMiddleware([testagram.verifyToken], testagram.searchUsers)(req, res);
      }

      // Debug endpoint - get all data (only for development)
      if (url.endsWith("/api/practice/v1/testagram/_debug/data") && req.method === "GET") {
        return testagram._getAllData(req, res);
      }

      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Testagram endpoint not found"));
    }

    // Chirper routes
    if (req.url.includes("/api/practice/v1/chirper")) {
      const url = req.url;

      // Auth routes
      if (url.includes("/api/practice/v1/chirper/auth")) {
        const endpoint = url.split("/api/practice/v1/chirper/auth/")[1];

        switch (true) {
          case req.method === "POST" && endpoint === "register":
            return chirper.register(req, res);
          case req.method === "POST" && endpoint === "login":
            return chirper.login(req, res);
          case req.method === "POST" && endpoint === "logout":
            return chirper.logout(req, res);
          case req.method === "GET" && endpoint === "check":
            return applyMiddleware([chirper.verifyToken], chirper.checkAuth)(req, res);
          default:
            return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Auth endpoint not found"));
        }
      }

      // Chirps routes
      if (url.includes("/api/practice/v1/chirper/chirps")) {
        const parts = url.split("/api/practice/v1/chirper/chirps")[1]?.split("/");
        const id = parts?.[1];
        const action = parts?.[2];
        switch (true) {
          case req.method === "GET" && !isIdValid(id):
            // Skip authentication middleware for GET requests to chirps endpoint to allow public view
            return chirper.getChirps(req, res);
          case req.method === "POST" && !isIdValid(id):
            return applyMiddleware([chirper.verifyToken], chirper.createChirp)(req, res);
          case req.method === "GET" && isIdValid(id):
            req.params = { id };
            return chirper.getChirpById(req, res);
          case req.method === "DELETE" && isIdValid(id):
            req.params = { id };
            return applyMiddleware([chirper.verifyToken], chirper.deleteChirp)(req, res);
          case req.method === "POST" && isIdValid(id) && action === "like":
            req.params = { id };
            return applyMiddleware([chirper.verifyToken], chirper.toggleLike)(req, res);
          case req.method === "POST" && isIdValid(id) && action === "reply":
            req.params = { id };
            return applyMiddleware([chirper.verifyToken], chirper.addReply)(req, res);
          default:
            return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Chirps endpoint not found"));
        }
      }

      // User profile routes
      if (url.includes("/api/practice/v1/chirper/users")) {
        const parts = url.split("/api/practice/v1/chirper/users")[1]?.split("/");
        const username = parts?.[1]?.split("?")[0]; // Extract username before any query params
        const action = parts?.[2]?.split("?")[0]; // Extract action before any query params

        logDebug("handlePractice:chirper", { username, action, method: req.method });

        switch (true) {
          case req.method === "GET" && username !== undefined:
            req.params = { username };
            return chirper.getUserProfile(req, res);
          case req.method === "PUT":
            return applyMiddleware([chirper.verifyToken], chirper.updateProfile)(req, res);
          case req.method === "POST" && username && action === "follow":
            req.params = { username };
            return applyMiddleware([chirper.verifyToken], chirper.toggleFollow)(req, res);
          default:
            return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Users endpoint not found"));
        }
      }

      // Search users
      if (url.includes("/api/practice/v1/chirper/search") && req.method === "GET") {
        return applyMiddleware([chirper.verifyToken], chirper.searchUsers)(req, res);
      }

      // Debug endpoint - get all data (only for development)
      if (url.endsWith("/api/practice/v1/chirper/_debug/data") && req.method === "GET") {
        return chirper._getAllData(req, res);
      }

      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Chirper endpoint not found"));
    }

    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
  }
}

module.exports = {
  handlePractice,
};
