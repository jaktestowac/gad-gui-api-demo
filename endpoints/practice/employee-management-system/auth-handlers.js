const { formatErrorResponse } = require("../../../helpers/helpers");
const { logDebug } = require("../../../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED } = require("../../../helpers/response.helpers");
const { tokens } = require("./auth-middleware");

const users = [
  {
    id: 1,
    username: "admin",
    password: "1234",
    permissions: ["CREATE", "UPDATE", "DELETE", "VIEW"],
  },
  {
    id: 2,
    username: "user",
    password: "user123",
    permissions: ["VIEW"],
  },
];

const generateToken = (userId) => {
  return `token-${userId}-${Date.now()}`;
};

const authHandlers = {
  login: (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username and password are required"));
    }

    const user = users.find((u) => u.username === username && u.password === password);

    if (!user) {
      return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid credentials"));
    }

    const token = generateToken(user.id);
    tokens.set(token, {
      userId: user.id,
      permissions: user.permissions,
      createdAt: Date.now(),
    });

    logDebug("authHandlers:login", { username, userId: user.id });
    return res.status(HTTP_OK).json({
      token,
      userId: user.id,
      username: user.username,
    });
  },

  logout: (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token || !tokens.has(token)) {
      return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid token"));
    }

    tokens.delete(token);

    logDebug("authHandlers:logout", { token });
    return res.status(HTTP_OK).json({ message: "Logged out successfully" });
  },

  getPermissions: (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token || !tokens.has(token)) {
      return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid token"));
    }

    const { userId, permissions } = tokens.get(token);
    const user = users.find((u) => u.id === userId);

    logDebug("authHandlers:getPermissions", { userId, permissions });
    return res.status(HTTP_OK).json({
      userId,
      username: user.username,
      permissions,
    });
  },
};

module.exports = {
  authV1: authHandlers,
};
