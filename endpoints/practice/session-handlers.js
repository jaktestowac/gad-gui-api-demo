const { isUndefined } = require("../../helpers/compare.helpers");
const { formatErrorResponse } = require("../../helpers/helpers");
const { logDebug } = require("../../helpers/logger-api");
const { HTTP_OK, HTTP_UNAUTHORIZED } = require("../../helpers/response.helpers");

const tokenStore = {};

function generateToken(username, timeoutInMs, version, scope = "session") {
  const str = `${username}-${scope}-${version}-${Date.now()}`;
  const token = Buffer.from(str).toString("base64");
  tokenStore[token] = { username, time: Date.now(), timeoutInMs, version };
  return token;
}

function verifyToken(token) {
  const session = tokenStore[token];
  logDebug("Verify token", { token, session });

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

class BaseSessionHandler {
  constructor(users, version) {
    this.users = users;
    this.version = version;
  }

  findUser(username) {
    return this.users.find((user) => user.username === username);
  }

  validateCredentials(username, password) {
    return this.users.some((user) => user.username === username && user.password === password);
  }

  async handleLogout(req, res) {
    const token = req.cookies?.[`${this.version}_sessionToken`];
    if (token) removeToken(token);
    res.clearCookie(`${this.version}_sessionToken`, { path: "/" });
    return res.status(HTTP_OK).json({ message: "Logged out" });
  }

  setCookies(res, token, user) {
    res.cookie(`${this.version}_sessionToken`, token, {
      maxAge: user.sessionTimeout,
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
  }

  async handleLoginBase(req, res, version) {
    const { username, password } = req.body;

    if (isUndefined(username) || isUndefined(password)) {
      return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Missing credentials!"));
    }

    if (!this.validateCredentials(username, password)) {
      return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid credentials!"));
    }

    const user = this.findUser(username);
    const token = generateToken(username, user.sessionTimeout, version);

    logDebug(`Login successful ${version}`, { token, username, role: user.role });

    return { token, user };
  }
}

class SessionHandlerV1 extends BaseSessionHandler {
  constructor(users) {
    super(users, "v1");
  }

  async handleLogin(req, res) {
    const response = await this.handleLoginBase(req, res, "v1");

    const { token, user } = response;

    if (!token || !user) {
      return response;
    }

    this.setCookies(res, token, user);
    res.cookie("v1_maxAge", user.sessionTimeout);
    res.cookie("v1_username", user.username);

    return res.status(HTTP_OK).json({
      message: "Login successful",
      username: user.username,
      token,
      maxAge: user.sessionTimeout,
    });
  }

  async handleCheck(req, res) {
    const token = req.cookies?.v1_sessionToken;
    const session = token ? verifyToken(token) : null;

    if (session?.username) {
      return res.status(HTTP_OK).json({ username: session.username });
    }

    res.clearCookie("v1_sessionToken", { path: "/" });
    return res.status(HTTP_UNAUTHORIZED).json({});
  }
}

class SessionHandlerV2 extends BaseSessionHandler {
  constructor(users) {
    super(users, "v2");
  }

  async handleLogin(req, res) {
    const response = await this.handleLoginBase(req, res, "v2");

    const { token, user } = response;

    if (!token || !user) {
      return response;
    }

    this.setCookies(res, token, user);

    return res.status(HTTP_OK).json({
      message: "Login successful",
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      token,
      maxAge: user.sessionTimeout,
    });
  }

  async handleCheck(req, res) {
    const token = req.cookies?.v2_sessionToken;
    const session = token ? verifyToken(token) : null;

    if (session?.username) {
      const user = this.findUser(session.username);
      return res.status(HTTP_OK).json({
        username: session.username,
        displayName: user.displayName,
        role: user.role,
      });
    }

    res.clearCookie("v2_sessionToken", { path: "/" });
    return res.status(HTTP_UNAUTHORIZED).json({});
  }
}

const sessionV1 = new SessionHandlerV1([
  { username: "user", password: "demo", sessionTimeout: 1 * 60 * 1000 },
  { username: "1", password: "1", sessionTimeout: 1 * 60 * 1000 },
  { username: "2", password: "2", sessionTimeout: 1 * 60 * 1000 },
  { username: "5", password: "5", sessionTimeout: 1 * 60 * 1000 },
  { username: "user2", password: "demo2", sessionTimeout: 2 * 60 * 1000 },
  { username: "admin", password: "pass", sessionTimeout: 5 * 60 * 1000 },
]);

const sessionV2 = new SessionHandlerV2([
  { username: "1", password: "1", sessionTimeout: 1 * 60 * 1000, role: "user", displayName: "Basic User" },
  {
    username: "user",
    password: "demo",
    sessionTimeout: 1 * 60 * 1000,
    role: "user",
    displayName: "Basic User",
  },
  {
    username: "manager",
    password: "demo",
    sessionTimeout: 2 * 60 * 1000,
    role: "manager",
    displayName: "System Manager",
  },
  {
    username: "admin",
    password: "pass",
    sessionTimeout: 5 * 60 * 1000,
    role: "admin",
    displayName: "Administrator",
  },
]);

module.exports = {
  sessionV1,
  sessionV2,
};
