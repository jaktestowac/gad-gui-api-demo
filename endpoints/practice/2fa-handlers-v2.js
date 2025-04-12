const OTPAuth = require("otpauth");
const QRCode = require("qrcode");
const { randomBytes } = require("node:crypto");
const base32 = require("../../helpers/base32");

const USERS = {
  1: { id: 1, username: "user1", password: "test" },
  2: { id: 2, username: "user2", password: "1234" },
};

// 2FA configuration data for each user
const USER_2FA_DATA = {
  1: { secret: "base32Secret", twoFAEnabled: true },
  2: { secret: "base32Secret", twoFAEnabled: false },
};

// Session storage
const SESSIONS = {};

// Session configuration
const SESSION_EXPIRY = 120_000; // 2 minutes in milliseconds
const SESSION_COOKIE_NAME = "gad_2fa_v2_session_id";

const OTP_SECRET_LENGTH = 16; // Length of the secret key in bytes

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

    // Verify the token (with a small window to account for time drift)
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

function getSessionFromCookie(req) {
  // Extract session ID from cookies
  const cookies = req.headers.cookie
    ? req.headers.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {})
    : {};

  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (!sessionId) return null;

  // Check if session exists and is not expired
  const session = SESSIONS[sessionId];
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    // Session expired
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
  return QRCode.toDataURL(otpUrl);
}

function registerUser(req, res) {
  const { username, password, email } = req.body;

  // Simple validation
  if (!username || !password || !email) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // Check if username is already taken
  const userExists = Object.values(USERS).some((user) => user.username === username);
  if (userExists) {
    return res.status(409).json({ success: false, message: "Username already exists" });
  }

  // Generate new user ID
  const userId = Object.keys(USERS).length + 1;

  // Create user
  USERS[userId] = { id: userId, username, password, email };

  // Initialize 2FA data for user (disabled by default)
  const secret = generateSecret();
  USER_2FA_DATA[userId] = { secret, twoFAEnabled: false };

  res.status(201).json({ success: true, userId, message: "User registered successfully" });
}

function loginUser(req, res) {
  const { username, password, token } = req.body;

  // Simple validation
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // Find user
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

    // Verify token
    const isValid = verifyToken(token, userTwoFAData.secret);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid 2FA token" });
    }
  }

  // Create a new session
  const sessionId = generateSessionId();
  SESSIONS[sessionId] = {
    userId: user.id,
    username: user.username,
    expiresAt: Date.now() + SESSION_EXPIRY,
  };

  // Set session cookie
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/; Max-Age=${SESSION_EXPIRY / 1000}`
  );

  // Login successful
  res.status(200).json({
    success: true,
    userId: user.id,
    requireTwoFA: userTwoFAData ? userTwoFAData.twoFAEnabled : false,
    twoFAEnabled: userTwoFAData ? userTwoFAData.twoFAEnabled : false,
    message: "Login successful",
  });
}

async function enableTwoFA(req, res) {
  // Check if user is authenticated via session
  const session = getSessionFromCookie(req);
  const userId = session ? session.userId : req.body.userId;

  // Simple validation
  if (!userId) {
    return res.status(400).json({ success: false, message: "Authentication required" });
  }

  // Check if user exists
  const user = USERS[userId];
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Check if user has 2FA data
  if (USER_2FA_DATA[userId] && USER_2FA_DATA[userId].twoFAEnabled) {
    return res.status(400).json({ success: false, message: "2FA already enabled" });
  }

  // generate new secret for 2FA
  const secret = generateSecret();
  USER_2FA_DATA[userId] = { secret, twoFAEnabled: false };

  // Generate QR code
  const qrCode = await generateQRCode(USER_2FA_DATA[userId].secret, user.email);

  res.status(200).json({
    success: true,
    secret: USER_2FA_DATA[userId].secret,
    qrCode,
    message: "Scan this QR code with your authenticator app and verify a token to enable 2FA",
  });
}

function verifyTwoFA(req, res) {
  // Check if user is authenticated via session
  const session = getSessionFromCookie(req);
  const userId = session ? session.userId : req.body.userId;
  const { token } = req.body;

  // Simple validation
  if (!userId || !token) {
    return res.status(400).json({ success: false, message: "Authentication and token are required" });
  }

  // Check if user exists
  if (!USERS[userId]) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Check if user has 2FA data
  if (!USER_2FA_DATA[userId]) {
    return res.status(400).json({ success: false, message: "2FA setup not initiated" });
  }

  // Verify token
  const isValid = verifyToken(token, USER_2FA_DATA[userId].secret);
  if (!isValid) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }

  // Enable 2FA
  USER_2FA_DATA[userId].twoFAEnabled = true;

  res.status(200).json({
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

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

function disable2FA(req, res) {
  // Check if user is authenticated via session
  const session = getSessionFromCookie(req);
  const userId = session ? session.userId : req.body.userId;
  const { token } = req.body;

  // Simple validation
  if (!userId) {
    return res.status(400).json({ success: false, message: "Authentication required" });
  }

  // Check if user exists
  if (!USERS[userId]) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Check if user has 2FA enabled
  if (!USER_2FA_DATA[userId] || !USER_2FA_DATA[userId].twoFAEnabled) {
    return res.status(400).json({ success: false, message: "2FA is not enabled for this user" });
  }

  // Verify token for security
  if (!token) {
    return res.status(400).json({ success: false, message: "2FA token required to disable 2FA" });
  }

  // Verify token
  const isValid = verifyToken(token, USER_2FA_DATA[userId].secret);
  if (!isValid) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }

  // Disable 2FA
  USER_2FA_DATA[userId].twoFAEnabled = false;

  res.status(200).json({
    success: true,
    message: "2FA disabled successfully",
  });
}

function extendSession(req, res) {
  // Check if user is authenticated via session
  const session = getSessionFromCookie(req);

  if (!session) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  const userId = session.userId;
  const { duration } = req.body;

  // Validate the requested extension duration,
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

  // Get session ID from cookie
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

  // Extend the session
  const newExpiryTime = Date.now() + extensionTime;
  SESSIONS[sessionId].expiresAt = newExpiryTime;

  // Set updated session cookie
  res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/; Max-Age=${extensionTime / 1000}`);

  // Return success with new expiry time
  res.status(200).json({
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

  // Return user information
  const user = USERS[session.userId];
  const twoFAData = USER_2FA_DATA[session.userId];

  res.status(200).json({
    success: true,
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      twoFAEnabled: twoFAData ? twoFAData.twoFAEnabled : false,
    },
  });
}

// Export endpoints for use in router
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
