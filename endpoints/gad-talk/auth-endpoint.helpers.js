const { logError } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");
const {
  HTTP_OK,
  HTTP_CREATED,
  HTTP_UNAUTHORIZED,
  HTTP_CONFLICT,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_BAD_REQUEST,
} = require("../../helpers/response.helpers");
const {
  signupUser,
  loginUser,
  loginDemoUser,
  logoutUser,
  getCurrentUser,
  refreshToken,
  requestPasswordReset,
  resetPasswordWithToken,
} = require("./services/auth.service");
const gadTalkConfig = require("./gad-talk-config");

// ==================== AUTH HANDLERS ====================

/**
 * Handle user signup
 * POST /api/gad-talk/auth/signup
 */
async function handleSignup(req, res) {
  try {
    const { email, username, password, displayName } = req.body;

    // Call auth service
    const result = await signupUser({ email, username, password, displayName });

    if (!result.success) {
      // Determine appropriate status code
      let statusCode = HTTP_BAD_REQUEST;
      if (result.errorType === "unique") {
        statusCode = HTTP_CONFLICT;
      } else if (
        result.error &&
        (result.error.includes("required") || result.error.includes("format") || result.error.includes("characters"))
      ) {
        statusCode = HTTP_UNPROCESSABLE_ENTITY;
      }

      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    // Set cookies
    res.cookie(gadTalkConfig.auth.tokenCookieName, result.token, {
      httpOnly: true,
      maxAge: result.maxAge,
      sameSite: "lax",
    });

    res.status(HTTP_CREATED).send({
      success: true,
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    logError("[GadTalk] Signup error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Signup failed"));
  }
}

/**
 * Handle user login
 * POST /api/gad-talk/auth/login
 */
async function handleLogin(req, res) {
  try {
    const { email, password, keepSignIn } = req.body;

    // Call auth service
    const result = await loginUser({ email, password, keepSignIn });

    if (!result.success) {
      // Determine appropriate status code
      let statusCode = HTTP_BAD_REQUEST;
      if (result.errorType === "unauthorized") {
        statusCode = HTTP_UNAUTHORIZED;
      } else if (result.error && result.error.includes("required")) {
        statusCode = HTTP_UNPROCESSABLE_ENTITY;
      }

      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    // Set cookies
    res.cookie(gadTalkConfig.auth.tokenCookieName, result.token, {
      httpOnly: true,
      maxAge: result.maxAge,
      sameSite: "lax",
    });

    res.status(HTTP_OK).send({
      success: true,
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    logError("[GadTalk] Login error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Login failed"));
  }
}

/**
 * Handle user logout
 * POST /api/gad-talk/auth/logout
 */
async function handleLogout(req, res) {
  try {
    // Get user from token
    const token = req.cookies[gadTalkConfig.auth.tokenCookieName];

    // Call auth service
    const result = await logoutUser(token);

    // Clear cookies
    res.clearCookie(gadTalkConfig.auth.tokenCookieName);

    res.status(HTTP_OK).send({
      ok: true,
      data: { message: result.message || "Logged out successfully" },
    });
  } catch (error) {
    logError("[GadTalk] Logout error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Logout failed"));
  }
}

/**
 * Handle demo login (automatic login to demo account)
 * POST /api/gad-talk/auth/demo-login
 */
async function handleDemoLogin(req, res) {
  try {
    // Call auth service
    const result = await loginDemoUser();

    if (!result.success) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(result.error));
      return;
    }

    // Set cookie
    res.cookie(gadTalkConfig.auth.tokenCookieName, result.token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: result.maxAge,
    });

    res.status(HTTP_OK).send({
      success: true,
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    logError("[GadTalk] Demo login error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Demo login failed"));
  }
}

/**
 * Handle get current user (me)
 * GET /api/gad-talk/auth/me
 */
async function handleGetMe(req, res) {
  try {
    // Get token from cookie or authorization header
    let token = req.cookies[gadTalkConfig.auth.tokenCookieName];

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // Call auth service
    const result = await getCurrentUser(token);

    if (!result.success) {
      let statusCode = HTTP_BAD_REQUEST;
      if (result.errorType === "unauthorized" || result.errorType === "not_found") {
        // Both unauthorized and user not found should return 401
        // If the user from the token doesn't exist, the token is effectively invalid
        statusCode = HTTP_UNAUTHORIZED;
      }

      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      success: true,
      user: result.user,
    });
  } catch (error) {
    logError("[GadTalk] Get me error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get current user"));
  }
}

/**
 * Handle token refresh
 * POST /api/gad-talk/auth/refresh
 */
async function handleRefresh(req, res) {
  try {
    // Get token from cookie or authorization header
    let token = req.cookies[gadTalkConfig.auth.tokenCookieName];

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // Call auth service
    const result = await refreshToken(token);

    if (!result.success) {
      let statusCode = HTTP_BAD_REQUEST;
      if (result.errorType === "unauthorized") {
        statusCode = HTTP_UNAUTHORIZED;
      }

      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    // Set new cookie
    res.cookie(gadTalkConfig.auth.tokenCookieName, result.token, {
      httpOnly: true,
      maxAge: result.maxAge,
      sameSite: "lax",
    });

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        token: result.token,
      },
    });
  } catch (error) {
    logError("[GadTalk] Refresh error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to refresh token"));
  }
}

/**
 * Handle forgot password request
 * POST /api/gad-talk/auth/forgot-password
 */
async function handleForgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Call auth service
    const result = await requestPasswordReset(email);

    if (!result.success) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        message: result.message,
        resetUrl: result.resetUrl,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    logError("[GadTalk] Forgot password error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to process request"));
  }
}

/**
 * Handle reset password (simulated)
 * POST /api/gad-talk/auth/reset-password
 */
async function handleResetPassword(req, res) {
  try {
    const { token, password } = req.body;

    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      let statusCode = HTTP_BAD_REQUEST;
      if (result.errorType === "validation") {
        statusCode = HTTP_UNPROCESSABLE_ENTITY;
      }
      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: { message: result.message || "Password reset successfully" },
    });
  } catch (error) {
    logError("[GadTalk] Reset password error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to reset password"));
  }
}

/**
 * Handle OAuth login (simulated)
 * POST /api/gad-talk/auth/oauth/google
 */
async function handleOAuthGoogle(req, res) {
  try {
    // Simulated OAuth - just return a mock response
    res.status(HTTP_OK).send({
      ok: true,
      data: {
        message: "OAuth login simulated - use regular login for actual authentication",
        hint: "This endpoint exists for testing OAuth flow handling",
      },
    });
  } catch (error) {
    logError("[GadTalk] OAuth error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "OAuth failed"));
  }
}

// ==================== EXPORTS ====================

module.exports = {
  handleSignup,
  handleLogin,
  handleLogout,
  handleDemoLogin,
  handleGetMe,
  handleRefresh,
  handleForgotPassword,
  handleResetPassword,
  handleOAuthGoogle,
};
