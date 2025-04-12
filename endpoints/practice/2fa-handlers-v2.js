const OTPAuth = require("otpauth");
const QRCode = require("qrcode");
const { randomBytes } = require("node:crypto");
const base32 = require("../../helpers/base32");
const { logDebug, logTrace } = require("../../helpers/logger-api");

const USERS = {
  1: { id: 1, username: "user1", password: "test" },
  2: { id: 2, username: "user2", password: "1234" },
};

const USER_2FA_DATA = {
  1: { secret: "base32Secret", twoFAEnabled: true },
  2: { secret: "base32Secret", twoFAEnabled: false },
};

const SESSIONS = {};

const SESSION_EXPIRY = 120_000; // 2 minutes in milliseconds
const SESSION_COOKIE_NAME = "gad_2fa_v2_session_id";

const OTP_SECRET_LENGTH = 16;

const ISSUER = "GAD by jaktestowac.pl (v2)";
const LABEL = "GAD app";

function generateSecret() {
  const buffer = randomBytes(OTP_SECRET_LENGTH);
  return base32.encode(buffer).replace(/=/g, "");
}

function generateSessionId() {
  return randomBytes(32).toString("hex");
}

function verifyToken(token, secret) {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: ISSUER,
      label: LABEL,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const delta = totp.validate({ token, window: 1 });
    logTrace("[2FA_V2] Token validation result:", { token, delta });
    return delta !== null;
  } catch (error) {
    logDebug("[2FA_V2] Error validating token:", error);
    return false;
  }
}

function getSessionFromCookie(req) {
  const cookies = req.headers.cookie
    ? req.headers.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {})
    : {};

  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (!sessionId) return null;

  const session = SESSIONS[sessionId];
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    delete SESSIONS[sessionId];
    return null;
  }

  return session;
}

async function generateQRCode(secret, email) {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  const otpUrl = totp.toString();
  logTrace("[2FA_V2] OTP URL:", { otpUrl });
  return QRCode.toDataURL(otpUrl);
}

function registerUser(req, res) {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const userExists = Object.values(USERS).some((user) => user.username === username);
  if (userExists) {
    return res.status(409).json({ success: false, message: "Username already exists" });
  }

  const userId = Object.keys(USERS).length + 1;

  USERS[userId] = { id: userId, username, password, email };

  const secret = generateSecret();
  USER_2FA_DATA[userId] = { secret, twoFAEnabled: false };

  logTrace("[2FA_V2] User registered", { userId, username });
  return res.status(201).json({ success: true, userId, message: "User registered successfully" });
}

function loginUser(req, res) {
  const { username, password, token } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const user = Object.values(USERS).find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  // Check if 2FA is enabled
  const userTwoFAData = USER_2FA_DATA[user.id];
  if (userTwoFAData && userTwoFAData.twoFAEnabled) {
    // If 2FA is enabled, token is required
    if (!token) {
      return res.status(200).json({
        success: true,
        requireTwoFA: true,
        message: "2FA token required",
      });
    }

    const isValid = verifyToken(token, userTwoFAData.secret);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid 2FA token" });
    }
  }

  const sessionId = generateSessionId();
  SESSIONS[sessionId] = {
    userId: user.id,
    username: user.username,
    expiresAt: Date.now() + SESSION_EXPIRY,
  };

  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/; Max-Age=${SESSION_EXPIRY / 1000}`
  );

  logTrace("[2FA_V2] User logged in", { sessionId, userId: user.id });
  return res.status(200).json({
    success: true,
    userId: user.id,
    requireTwoFA: userTwoFAData ? userTwoFAData.twoFAEnabled : false,
    twoFAEnabled: userTwoFAData ? userTwoFAData.twoFAEnabled : false,
    message: "Login successful",
  });
}

async function enableTwoFA(req, res) {
  const session = getSessionFromCookie(req);
  const userId = session ? session.userId : req.body.userId;

  if (!userId) {
    return res.status(400).json({ success: false, message: "Authentication required" });
  }

  const user = USERS[userId];
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (USER_2FA_DATA[userId] && USER_2FA_DATA[userId].twoFAEnabled) {
    return res.status(400).json({ success: false, message: "2FA already enabled" });
  }

  const secret = generateSecret();
  USER_2FA_DATA[userId] = { secret, twoFAEnabled: false };

  const qrCode = await generateQRCode(USER_2FA_DATA[userId].secret, user.email);

  logTrace("[2FA_V2] 2FA setup initiated for user:", { userId, secret: USER_2FA_DATA[userId].secret, qrCode });
  return res.status(200).json({
    success: true,
    secret: USER_2FA_DATA[userId].secret,
    qrCode,
    message: "Scan this QR code with your authenticator app and verify a token to enable 2FA",
  });
}

function verifyTwoFA(req, res) {
  const session = getSessionFromCookie(req);
  const userId = session ? session.userId : req.body.userId;
  const { token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ success: false, message: "Authentication and token are required" });
  }

  if (!USERS[userId]) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (!USER_2FA_DATA[userId]) {
    return res.status(400).json({ success: false, message: "2FA setup not initiated" });
  }

  const isValid = verifyToken(token, USER_2FA_DATA[userId].secret);
  if (!isValid) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }

  USER_2FA_DATA[userId].twoFAEnabled = true;

  logTrace("[2FA_V2] 2FA verification completed for user:", { userId });
  return res.status(200).json({
    success: true,
    message: "2FA enabled successfully",
  });
}

function logout(req, res) {
  // Get session from cookie
  const cookies = req.headers.cookie
    ? req.headers.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {})
    : {};

  const sessionId = cookies[SESSION_COOKIE_NAME];

  // Clear session if it exists
  if (sessionId && SESSIONS[sessionId]) {
    delete SESSIONS[sessionId];
  }

  // Clear cookie
  res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`);

  logTrace("[2FA_V2] User logged out", { sessionId });
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

function disable2FA(req, res) {
  const session = getSessionFromCookie(req);
  const userId = session ? session.userId : req.body.userId;
  const { token } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "Authentication required" });
  }

  if (!USERS[userId]) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (!USER_2FA_DATA[userId] || !USER_2FA_DATA[userId].twoFAEnabled) {
    return res.status(400).json({ success: false, message: "2FA is not enabled for this user" });
  }

  if (!token) {
    return res.status(400).json({ success: false, message: "2FA token required to disable 2FA" });
  }

  const isValid = verifyToken(token, USER_2FA_DATA[userId].secret);
  if (!isValid) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }

  USER_2FA_DATA[userId].twoFAEnabled = false;

  logTrace("[2FA_V2] 2FA disabled for user:", { userId });
  return res.status(200).json({
    success: true,
    message: "2FA disabled successfully",
  });
}

function extendSession(req, res) {
  const session = getSessionFromCookie(req);

  if (!session) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  const userId = session.userId;
  const { duration } = req.body;

  const maxExtension = 120_000; // 2 minutes in milliseconds
  const minExtension = 30_000; // 30 seconds in milliseconds

  let extensionTime = 60_000; // Default to 1 minute

  if (duration) {
    // Convert minutes to milliseconds
    const requestedTime = parseInt(duration) * 1_000;

    if (!isNaN(requestedTime)) {
      extensionTime = Math.min(maxExtension, Math.max(minExtension, requestedTime));
    }
  }

  const cookies = req.headers.cookie
    ? req.headers.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {})
    : {};

  const sessionId = cookies[SESSION_COOKIE_NAME];

  if (!sessionId || !SESSIONS[sessionId]) {
    return res.status(401).json({ success: false, message: "Invalid session" });
  }

  const newExpiryTime = Date.now() + extensionTime;
  SESSIONS[sessionId].expiresAt = newExpiryTime;

  res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/; Max-Age=${extensionTime / 1000}`);

  return res.status(200).json({
    success: true,
    message: "Session extended successfully",
    expiresAt: new Date(newExpiryTime).toISOString(),
    sessionLengthMinutes: extensionTime / 60000,
  });
}

function checkAuth(req, res) {
  const session = getSessionFromCookie(req);

  if (!session) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: "Not authenticated",
    });
  }

  const user = USERS[session.userId];
  const twoFAData = USER_2FA_DATA[session.userId];

  return res.status(200).json({
    success: true,
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      twoFAEnabled: twoFAData ? twoFAData.twoFAEnabled : false,
    },
  });
}

module.exports = {
  registerUser,
  loginUser,
  enableTwoFA,
  verifyTwoFA,
  disable2FA,
  extendSession,
  logout,
  checkAuth,
};
