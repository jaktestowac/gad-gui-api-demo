const { isUndefined } = require("../helpers/compare.helpers");
const { formatErrorResponse } = require("../helpers/helpers");
const { logDebug } = require("../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_OK, HTTP_UNAUTHORIZED } = require("../helpers/response.helpers");

const tokenStore = {};

function generateToken(username, timeoutInMs) {
  const str = `${username}-${Date.now()}`;
  const token = Buffer.from(str).toString("base64");
  tokenStore[token] = { username, time: Date.now(), timeoutInMs };
  return token;
}

function verifyToken(token) {
  const session = tokenStore[token];
  if (session) {
    const now = Date.now();
    if (now - session.time > session.timeoutInMs) {
      delete tokenStore[token];
      return null;
    }
    return session;
  }
  return null;
}

function removeToken(token) {
  delete tokenStore[token];
}

const predefinedUsers = [
  {
    username: "user",
    password: "demo",
    sessionTimeout: 1 * 60 * 1000, // 1 minute
  },
  {
    username: "user2",
    password: "demo2",
    sessionTimeout: 2 * 60 * 1000, // 1 minute
  },
  {
    username: "1",
    password: "1",
    sessionTimeout: 1 * 60 * 1000, // 1 minute
  },
  {
    username: "2",
    password: "2",
    sessionTimeout: 2 * 60 * 1000, // 2 minutes
  },
  {
    username: "5",
    password: "5",
    sessionTimeout: 5 * 60 * 1000, // 5 minutes
  },
  {
    username: "admin",
    password: "pass",
    sessionTimeout: 5 * 60 * 1000, // 5 minutes
  },
];

function findUser(username) {
  return predefinedUsers.find((user) => user.username === username);
}

function isUserValid(username, password) {
  return predefinedUsers.some((user) => user.username === username && user.password === password);
}

function handlePractice(req, res) {
  if (req.url.includes("/api/practice")) {
    if (req.method === "POST" && req.url.endsWith("/api/practice/modals/login")) {
      const body = req.body;

      if (isUndefined(body) || isUndefined(body.username) || isUndefined(body.password)) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Unauthorized!"));
        return;
      }

      if (body.username === "user" && body.password === "pass") {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid credentials!"));
        return;
      }

      logDebug("handlePractice:login", { body });
      res.status(HTTP_OK).json({});
      return;
    }

    // Session login endpoint
    if (req.url.includes("/api/practice/session/v1/")) {
      if (req.method === "POST" && req.url.endsWith("/api/practice/session/v1/login")) {
        const body = req.body;

        if (isUndefined(body) || isUndefined(body.username) || isUndefined(body.password)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Missing credentials!"));
          return;
        }

        if (!isUserValid(body.username, body.password)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid credentials!"));
          return;
        }

        const user = findUser(body.username);

        const token = generateToken(body.username, user.sessionTimeout);
        const cookieOptions = {
          maxAge: user.sessionTimeout,
          httpOnly: true,
          sameSite: "strict",
          path: "/",
        };

        logDebug("Login successful", {
          token,
          username: body.username,
          cookieOptions,
        });

        res.header(
          "Set-Cookie",
          `sessionToken=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${user.sessionTimeout}`
        );
        res.cookie("sessionToken", cookieOptions);
        res.cookie("maxAge", user.sessionTimeout);
        res.cookie("username", body.username);
        res.status(HTTP_OK).json({
          message: "Login successful",
          username: body.username,
          token,
          maxAge: user.sessionTimeout,
        });
        return;
      }

      // Check session endpoint
      if (req.method === "GET" && req.url.endsWith("/api/practice/session/v1/check")) {
        const token = req.cookies?.sessionToken;
        logDebug("Checking session token", { token });

        const session = token ? verifyToken(token) : null;
        logDebug("Session check result", { session });

        if (session && session.username) {
          res.status(HTTP_OK).json({ username: session.username });
        } else {
          res.clearCookie("sessionToken", { path: "/" });
          res.status(HTTP_UNAUTHORIZED).json({});
        }
        return;
      }

      // Logout endpoint
      if (req.method === "POST" && req.url.endsWith("/api/practice/session/v1/logout")) {
        const token = req.cookies?.sessionToken;
        if (token) {
          removeToken(token);
          logDebug("Logging out, removing token", { token });
        }
        res.clearCookie("sessionToken", { path: "/" });
        res.status(HTTP_OK).json({ message: "Logged out" });
        return;
      }
    }

    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found!"));
    return;
  }
  return;
}

module.exports = {
  handlePractice,
};
