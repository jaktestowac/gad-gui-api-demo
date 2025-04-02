const { formatErrorResponse, generateUuid } = require("../../helpers/helpers");
const { logDebug, logError } = require("../../helpers/logger-api");
const { HTTP_BAD_REQUEST, HTTP_OK, HTTP_UNAUTHORIZED } = require("../../helpers/response.helpers");
const jwt = require("jsonwebtoken");

// In-memory user database (would be replaced by a real database in production)
const users = new Map();
// Active sessions
const sessions = new Map();

const JWT_SECRET = "chat-app-secret-key";
const TOKEN_EXPIRY = "24h";

const authV2 = {
  register: (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username and password are required"));
      }

      // Validate username
      if (username.length < 3 || username.length > 16) {
        return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username must be between 3 and 16 characters"));
      }

      if (!/^[a-zA-Z0-9_]*$/.test(username)) {
        return res
          .status(HTTP_BAD_REQUEST)
          .send(formatErrorResponse("Username can only contain letters, numbers, and underscores"));
      }

      // Check if username already exists
      if (Array.from(users.values()).find((user) => user.username.toLowerCase() === username.toLowerCase())) {
        return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username already exists"));
      }

      // Create user
      const userId = generateUuid();
      users.set(userId, {
        id: userId,
        username,
        password, // In a real app, this would be hashed
        createdAt: new Date(),
      });

      logDebug("User registered", { userId, username });

      return res.status(HTTP_OK).json({
        message: "Registration successful",
        userId,
        username,
      });
    } catch (error) {
      logError("Error in registration", error);
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Registration failed"));
    }
  },

  login: (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username and password are required"));
      }

      // Find user
      const user = Array.from(users.values()).find((user) => user.username.toLowerCase() === username.toLowerCase());

      if (!user || user.password !== password) {
        return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid username or password"));
      }

      // Create session
      const sessionId = generateUuid();
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          sessionId,
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      sessions.set(sessionId, {
        userId: user.id,
        token,
        createdAt: new Date(),
      });

      logDebug("User logged in", { userId: user.id, username });

      return res.status(HTTP_OK).json({
        message: "Login successful",
        token,
        userId: user.id,
        username: user.username,
      });
    } catch (error) {
      logError("Error in login", error);
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Login failed"));
    }
  },

  logout: (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(HTTP_OK).json({ message: "Already logged out" });
      }

      const token = authHeader.split(" ")[1];
      let decodedToken;

      try {
        decodedToken = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return res.status(HTTP_OK).json({ message: "Already logged out" });
      }

      // Remove session
      if (decodedToken.sessionId && sessions.has(decodedToken.sessionId)) {
        sessions.delete(decodedToken.sessionId);
        logDebug("User logged out", { userId: decodedToken.userId, username: decodedToken.username });
      }

      return res.status(HTTP_OK).json({ message: "Logout successful" });
    } catch (error) {
      logError("Error in logout", error);
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Logout failed"));
    }
  },

  checkAuth: (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Not authenticated"));
      }

      const token = authHeader.split(" ")[1];
      let decodedToken;

      try {
        decodedToken = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid token"));
      }

      // Check if session exists
      if (!decodedToken.sessionId || !sessions.has(decodedToken.sessionId)) {
        return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Session not found"));
      }

      return res.status(HTTP_OK).json({
        userId: decodedToken.userId,
        username: decodedToken.username,
      });
    } catch (error) {
      logError("Error in auth check", error);
      return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication check failed"));
    }
  },
};

module.exports = { authV2 };
