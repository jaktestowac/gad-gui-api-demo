const OTPAuth = require("otpauth");
const QRCode = require("qrcode");
const { randomBytes } = require("node:crypto");
const base32 = require("../../helpers/base32");
const { logDebug, logTrace } = require("../../helpers/logger-api");

const USERS = {
  1: { id: 1, username: "demo", password: "pass" },
  2: { id: 2, username: "user3", password: "password789" },
};

const USER_2FA_DATA = {
  1: { secret: "base32_secret", twoFAEnabled: true },
  2: { secret: "base32_secret", twoFAEnabled: false },
};

const OTP_SECRET_LENGTH = 16;
const ISSUER = "GAD by jaktestowac.pl (v1)";
const LABEL = "GAD app";

function generateSecret() {
  const buffer = randomBytes(OTP_SECRET_LENGTH);
  return base32.encode(buffer).replace(/=/g, "");
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
    logTrace("[2FA_V1] Token validation result:", { token, delta });
    return delta !== null;
  } catch (error) {
    logDebug("[2FA_V1] Error validating token:", error);
    return false;
  }
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

  res.status(201).json({ success: true, userId, message: "User registered successfully" });
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

  const userTwoFAData = USER_2FA_DATA[user.id];
  if (userTwoFAData && userTwoFAData.twoFAEnabled) {
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

  res.status(200).json({
    success: true,
    userId: user.id,
    requireTwoFA: userTwoFAData ? userTwoFAData.twoFAEnabled : false,
    twoFAEnabled: userTwoFAData ? userTwoFAData.twoFAEnabled : false,
    message: "Login successful",
  });
}

async function enableTwoFA(req, res) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  const user = USERS[userId];
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (USER_2FA_DATA[userId]) {
    return res.status(400).json({ success: false, message: "2FA already enabled" });
  }

  if (!USER_2FA_DATA[userId]) {
    const secret = generateSecret();
    USER_2FA_DATA[userId] = { secret, twoFAEnabled: false };
  }

  const qrCode = await generateQRCode(USER_2FA_DATA[userId].secret, user.email);

  res.status(200).json({
    success: true,
    secret: USER_2FA_DATA[userId].secret,
    qrCode,
    message: "Scan this QR code with your authenticator app and verify a token to enable 2FA",
  });
}

function verifyTwoFA(req, res) {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ success: false, message: "User ID and token are required" });
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

  res.status(200).json({
    success: true,
    message: "2FA enabled successfully",
  });
}

function logout(req, res) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  if (!USERS[userId]) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

module.exports = {
  registerUser,
  loginUser,
  enableTwoFA,
  verifyTwoFA,
  logout,
};
