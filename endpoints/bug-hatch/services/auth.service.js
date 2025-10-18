const { getCurrentDateTimeISO } = require("../../../helpers/datetime.helpers");
const { logDebug, logTrace } = require("../../../helpers/logger-api");
const {
  findBugHatchUserByEmail,
  findBugHatchUserById,
  createBugHatchUser,
  updateBugHatchUserLastLogin,
  generateBugHatchId,
  createBugHatchAuditLog,
} = require("../db-bug-hatch.operations");
const { createToken, prepareCookieMaxAge, verifyToken } = require("../../../helpers/jwtauth");

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
 * Validate password
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, error?: string }
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 2) {
    return { valid: false, error: "Password must be at least 2 characters long" };
  }

  if (password.length > 100) {
    return { valid: false, error: "Password must not exceed 100 characters" };
  }

  return { valid: true };
}

/**
 * Validate signup data
 * @param {object} data - User data { email, name, password }
 * @returns {object} { valid: boolean, error?: string }
 */
function validateSignupData(data) {
  const { email, name, password } = data;

  if (!email || !name || !password) {
    return { valid: false, error: "Missing required fields: email, name, password" };
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return emailValidation;
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
 * @param {object} userData - User data { email, name, password }
 * @returns {Promise<object>} { success: boolean, user?: object, error?: string }
 */
async function signupUser(userData) {
  try {
    const { email, name, password } = userData;

    // Validate input
    const validation = validateSignupData(userData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check if user already exists
    const existingUser = findBugHatchUserByEmail(email);
    if (existingUser) {
      return { success: false, error: "User with this email already exists", errorType: "unique" };
    }

    // Create user
    const userId = generateBugHatchId("user");
    const newUserData = {
      id: userId,
      email: email.toLowerCase(),
      name,
      password, // Store plain text password (as per requirements)
      role: "member", // default role
      createdAt: getCurrentDateTimeISO(),
    };

    const newUser = await createBugHatchUser(newUserData);

    // Create audit log
    await createBugHatchAuditLog({
      actorUserId: newUser.id,
      eventType: "user.signup",
      payloadObject: { email: newUser.email, name: newUser.name },
    });

    logDebug("BugHatch: User signed up successfully:", { email: newUser.email });

    // Remove password from response
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...userResponse } = newUser;

    return { success: true, user: userResponse };
  } catch (error) {
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

    // Find user
    const user = findBugHatchUserByEmail(email);
    if (!user) {
      return { success: false, error: "Invalid email or password", errorType: "unauthorized" };
    }

    // Verify password (plain text comparison)
    if (password !== user.password) {
      return { success: false, error: "Invalid email or password", errorType: "unauthorized" };
    }

    // Update last login time
    await updateBugHatchUserLastLogin(user.id);

    // Create JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      app: "bug-hatch",
    };

    const token = createToken(payload, false, keepSignIn);
    const maxAge = prepareCookieMaxAge(false, keepSignIn);

    // Create audit log
    await createBugHatchAuditLog({
      actorUserId: user.id,
      eventType: "user.login",
      payloadObject: { email: user.email },
    });

    logDebug("BugHatch: User logged in successfully:", { email: user.email });

    // Remove password from response
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...userResponse } = user;

    return { success: true, user: userResponse, token, maxAge };
  } catch (error) {
    return { success: false, error: error.message || "Login failed" };
  }
}

/**
 * Log in as demo user
 * @returns {Promise<object>} { success: boolean, user?: object, token?: string, maxAge?: number, error?: string }
 */
async function loginDemoUser() {
  try {
    // Demo user credentials
    const demoEmail = "demo@bughatch.local";
    const demoUserId = "user-demo-001";

    // Create JWT token with demo flag
    const token = createToken({ userId: demoUserId, email: demoEmail, isDemo: true }, "30d");
    const maxAge = prepareCookieMaxAge("30d");

    // Create audit log for demo login
    await createBugHatchAuditLog({
      actorUserId: demoUserId,
      eventType: "user.demo-login",
      payloadObject: { email: demoEmail },
    });

    logTrace("Demo user logged in successfully");

    return {
      success: true,
      user: {
        id: demoUserId,
        email: demoEmail,
        name: "Demo User",
        role: "member",
        isDemo: true,
      },
      token,
      maxAge,
    };
  } catch (error) {
    return { success: false, error: error.message || "Demo login failed" };
  }
}

/**
 * Log out a user
 * @param {string} token - JWT token from cookie
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
async function logoutUser(token) {
  try {
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        // Create audit log
        await createBugHatchAuditLog({
          actorUserId: decoded.userId,
          eventType: "user.logout",
          payloadObject: { email: decoded.email },
        });
      }
    }

    logDebug("BugHatch: User logged out successfully");

    return { success: true, message: "Logged out successfully" };
  } catch (error) {
    return { success: false, error: error.message || "Logout failed" };
  }
}

/**
 * Get current authenticated user
 * @param {string} token - JWT token from cookie
 * @returns {object} { success: boolean, user?: object, error?: string, errorType?: string }
 */
function getCurrentUser(token) {
  try {
    if (!token) {
      return { success: false, error: "Not authenticated", errorType: "unauthorized" };
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded instanceof Error) {
      return { success: false, error: "Invalid or expired token", errorType: "unauthorized" };
    }

    // Check if this is a demo session
    if (decoded.isDemo) {
      logTrace("BugHatch: Get current user (demo mode)");
      return {
        success: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: "Demo User",
          role: "member",
          isDemo: true,
        },
      };
    }

    // Find user
    const user = findBugHatchUserById(decoded.userId);

    if (!user) {
      return { success: false, error: "User not found", errorType: "unauthorized" };
    }

    // Remove password from response
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...userResponse } = user;

    logTrace("BugHatch: Get current user:", { userId: user.id });

    return { success: true, user: { ...userResponse, isDemo: false } };
  } catch (error) {
    return { success: false, error: error.message || "Failed to get current user" };
  }
}

module.exports = {
  // Validation
  validateEmail,
  validatePassword,
  validateSignupData,
  validateLoginData,

  // Authentication
  signupUser,
  loginUser,
  loginDemoUser,
  logoutUser,
  getCurrentUser,
};
