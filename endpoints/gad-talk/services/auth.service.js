const { getCurrentDateTimeISO } = require("../../../helpers/datetime.helpers");
const { logDebug, logTrace, logError } = require("../../../helpers/logger-api");
const {
  findGadTalkUserByEmail,
  findGadTalkUserByUsername,
  findGadTalkUserById,
  createGadTalkUser,
  updateGadTalkUserLastLogin,
  generateGadTalkId,
  createGadTalkAuditLog,
} = require("../db-gad-talk.operations");
const { createToken, prepareCookieMaxAge, verifyToken } = require("../../../helpers/jwtauth");
const gadTalkConfig = require("../gad-talk-config");

// ==================== VALIDATION ====================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} { valid: boolean, error?: string }
 */
function validateEmail(email) {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true };
}

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {object} { valid: boolean, error?: string }
 */
function validateUsername(username) {
  if (!username) {
    return { valid: false, error: "Username is required" };
  }

  const { usernameMinLength, usernameMaxLength, usernamePattern } = gadTalkConfig.auth;

  if (username.length < usernameMinLength) {
    return { valid: false, error: `Username must be at least ${usernameMinLength} characters long` };
  }

  if (username.length > usernameMaxLength) {
    return { valid: false, error: `Username must not exceed ${usernameMaxLength} characters` };
  }

  if (!usernamePattern.test(username)) {
    return { valid: false, error: "Username can only contain letters, numbers, and underscores" };
  }

  return { valid: true };
}

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, error?: string }
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  const { passwordMinLength, passwordMaxLength } = gadTalkConfig.auth;

  if (password.length < passwordMinLength) {
    return { valid: false, error: `Password must be at least ${passwordMinLength} characters long` };
  }

  if (password.length > passwordMaxLength) {
    return { valid: false, error: `Password must not exceed ${passwordMaxLength} characters` };
  }

  return { valid: true };
}

/**
 * Validate signup data
 * @param {object} data - User data { email, username, password, displayName }
 * @returns {object} { valid: boolean, error?: string }
 */
function validateSignupData(data) {
  const { email, username, password } = data;

  if (!email || !username || !password) {
    return { valid: false, error: "Missing required fields: email, username, password" };
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return emailValidation;
  }

  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return usernameValidation;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return passwordValidation;
  }

  return { valid: true };
}

/**
 * Validate login data
 * @param {object} data - Login data { email, password }
 * @returns {object} { valid: boolean, error?: string }
 */
function validateLoginData(data) {
  const { email, password } = data;

  if (!email || !password) {
    return { valid: false, error: "Missing required fields: email, password" };
  }

  return { valid: true };
}

// ==================== AUTHENTICATION SERVICES ====================

/**
 * Sign up a new user
 * @param {object} userData - User data { email, username, password, displayName }
 * @returns {Promise<object>} { success: boolean, user?: object, error?: string }
 */
async function signupUser(userData) {
  try {
    const { email, username, password, displayName } = userData;

    // Validate input
    const validation = validateSignupData(userData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check if user already exists by email
    const existingByEmail = findGadTalkUserByEmail(email);
    if (existingByEmail) {
      return { success: false, error: "User with this email already exists", errorType: "unique" };
    }

    // Check if username already exists
    const existingByUsername = findGadTalkUserByUsername(username);
    if (existingByUsername) {
      return { success: false, error: "Username already taken", errorType: "unique" };
    }

    // Create user
    const userId = generateGadTalkId("user");
    const newUserData = {
      id: userId,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName: displayName || username,
      password, // Store plain text password (as per requirements for educational testing)
      role: "member",
      createdAt: getCurrentDateTimeISO(),
    };

    const newUser = await createGadTalkUser(newUserData);

    // Create audit log
    await createGadTalkAuditLog({
      actorUserId: newUser.id,
      eventType: "user.signup",
      payloadObject: { email: newUser.email, username: newUser.username },
    });

    logDebug("GadTalk: User signed up successfully:", { email: newUser.email, username: newUser.username });

    // Create token for the new user (auto-login after signup)
    const payload = {
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      app: "gad-talk",
    };
    const token = createToken(payload, gadTalkConfig.auth.tokenExpiresIn);
    const maxAge = prepareCookieMaxAge(gadTalkConfig.auth.tokenExpiresIn);

    // Remove password from response
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...userResponse } = newUser;

    return { success: true, user: userResponse, token, maxAge };
  } catch (error) {
    logError("GadTalk signup error:", error);
    return { success: false, error: error.message || "Signup failed" };
  }
}

/**
 * Log in a user
 * @param {object} loginData - Login data { email, password, keepSignIn }
 * @returns {Promise<object>} { success: boolean, user?: object, token?: string, maxAge?: number, error?: string }
 */
async function loginUser(loginData) {
  try {
    const { email, password, keepSignIn } = loginData;

    // Validate input
    const validation = validateLoginData(loginData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Find user by email
    const user = findGadTalkUserByEmail(email);
    if (!user) {
      return { success: false, error: "Invalid email or password", errorType: "unauthorized" };
    }

    // Verify password (plain text comparison for educational purposes)
    if (password !== user.password) {
      return { success: false, error: "Invalid email or password", errorType: "unauthorized" };
    }

    // Update last login time
    await updateGadTalkUserLastLogin(user.id);

    // Create JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      app: "gad-talk",
    };

    const token = createToken(payload, false, keepSignIn);
    const maxAge = prepareCookieMaxAge(false, keepSignIn);

    // Create audit log
    await createGadTalkAuditLog({
      actorUserId: user.id,
      eventType: "user.login",
      payloadObject: { email: user.email },
    });

    logDebug("GadTalk: User logged in successfully:", { email: user.email });

    // Remove password from response
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...userResponse } = user;

    return { success: true, user: userResponse, token, maxAge };
  } catch (error) {
    logError("GadTalk login error:", error);
    return { success: false, error: error.message || "Login failed" };
  }
}

/**
 * Log in demo user
 * @returns {Promise<object>} { success: boolean, user?: object, token?: string, maxAge?: number, error?: string }
 */
async function loginDemoUser() {
  try {
    const { demoUserEmail, demoUserPassword } = gadTalkConfig.demo;

    return await loginUser({
      email: demoUserEmail,
      password: demoUserPassword,
      keepSignIn: false,
    });
  } catch (error) {
    logError("GadTalk demo login error:", error);
    return { success: false, error: error.message || "Demo login failed" };
  }
}

/**
 * Log out a user
 * @param {string} token - JWT token
 * @returns {Promise<object>} { success: boolean, message?: string }
 */
async function logoutUser(token) {
  try {
    // Verify token to get user info for audit
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        await createGadTalkAuditLog({
          actorUserId: decoded.userId,
          eventType: "user.logout",
          payloadObject: { email: decoded.email },
        });
      }
    }

    return { success: true, message: "Logged out successfully" };
  } catch (error) {
    logError("GadTalk logout error:", error);
    // Still return success for logout even if audit fails
    return { success: true, message: "Logged out successfully" };
  }
}

/**
 * Get current user from token
 * @param {string} token - JWT token
 * @returns {Promise<object>} { success: boolean, user?: object, error?: string }
 */
async function getCurrentUser(token) {
  try {
    if (!token) {
      return { success: false, error: "No token provided", errorType: "unauthorized" };
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded instanceof Error) {
      return { success: false, error: "Invalid or expired token", errorType: "unauthorized" };
    }

    if (decoded.app !== "gad-talk") {
      return { success: false, error: "Invalid token for this application", errorType: "unauthorized" };
    }

    const user = findGadTalkUserById(decoded.userId);
    if (!user) {
      return { success: false, error: "User not found", errorType: "not_found" };
    }

    // Remove password from response
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...userResponse } = user;

    return { success: true, user: userResponse };
  } catch (error) {
    logError("GadTalk get current user error:", error);
    return { success: false, error: error.message || "Failed to get current user" };
  }
}

/**
 * Refresh token
 * @param {string} token - Current JWT token
 * @returns {Promise<object>} { success: boolean, token?: string, maxAge?: number, error?: string }
 */
async function refreshToken(token) {
  try {
    if (!token) {
      return { success: false, error: "No token provided", errorType: "unauthorized" };
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded instanceof Error) {
      return { success: false, error: "Invalid or expired token", errorType: "unauthorized" };
    }

    if (decoded.app !== "gad-talk") {
      return { success: false, error: "Invalid token for this application", errorType: "unauthorized" };
    }

    // Verify user still exists
    const user = findGadTalkUserById(decoded.userId);
    if (!user) {
      return { success: false, error: "User not found", errorType: "not_found" };
    }

    // Create new token
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      app: "gad-talk",
    };

    const newToken = createToken(payload, false, false);
    const maxAge = prepareCookieMaxAge(false, false);

    logTrace("GadTalk: Token refreshed for user:", { email: user.email });

    return { success: true, token: newToken, maxAge };
  } catch (error) {
    logError("GadTalk refresh token error:", error);
    return { success: false, error: error.message || "Failed to refresh token" };
  }
}

/**
 * Request password reset (simulated - adds to outbox)
 * @param {string} email - User email
 * @returns {Promise<object>} { success: boolean, message?: string, error?: string }
 */
async function requestPasswordReset(email) {
  try {
    if (!email) {
      return { success: false, error: "Email is required" };
    }

    const user = findGadTalkUserByEmail(email);

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we pretend we sent the email
    if (user) {
      // Generate reset token
      const resetToken = generateGadTalkId("reset");

      // Create audit log
      await createGadTalkAuditLog({
        actorUserId: user.id,
        eventType: "user.password_reset_requested",
        payloadObject: { email: user.email, resetToken },
      });

      logDebug("GadTalk: Password reset requested for:", { email: user.email });
    }

    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    };
  } catch (error) {
    logError("GadTalk password reset request error:", error);
    return { success: false, error: error.message || "Failed to request password reset" };
  }
}

/**
 * Verify token and return decoded payload
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token payload or null
 */
function verifyGadTalkToken(token) {
  try {
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded || decoded instanceof Error) return null;
    if (decoded.app !== "gad-talk") return null;

    return decoded;
  } catch (error) {
    logError("GadTalk token verification error:", error);
    return null;
  }
}

// ==================== EXPORTS ====================

module.exports = {
  // Validation
  validateEmail,
  validateUsername,
  validatePassword,
  validateSignupData,
  validateLoginData,

  // Authentication
  signupUser,
  loginUser,
  loginDemoUser,
  logoutUser,
  getCurrentUser,
  refreshToken,
  requestPasswordReset,
  verifyGadTalkToken,
};
