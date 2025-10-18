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
const { signupUser, loginUser, loginDemoUser, logoutUser, getCurrentUser } = require("./services/auth.service");

// ==================== AUTH HANDLERS ====================

/**
 * Handle user signup
 * POST /api/bug-hatch/auth/signup
 */
async function handleSignup(req, res) {
  try {
    const { email, name, password } = req.body;

    // Call auth service
    const result = await signupUser({ email, name, password });

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

    res.status(HTTP_CREATED).send({
      ok: true,
      data: result.user,
    });
  } catch (error) {
    logError("BugHatch signup error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Signup failed"));
  }
}

/**
 * Handle user login
 * POST /api/bug-hatch/auth/login
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
    res.cookie("bug-hatch-token", result.token, {
      httpOnly: true,
      maxAge: result.maxAge,
      sameSite: "lax",
    });

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    logError("BugHatch login error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Login failed"));
  }
}

/**
 * Handle user logout
 * POST /api/bug-hatch/auth/logout
 */
async function handleLogout(req, res) {
  try {
    // Get user from token
    const token = req.cookies["bug-hatch-token"];

    // Call auth service
    const result = await logoutUser(token);

    // Clear cookies
    res.clearCookie("bug-hatch-token");

    res.status(HTTP_OK).send({
      ok: true,
      data: { message: result.message || "Logged out successfully" },
    });
  } catch (error) {
    logError("BugHatch logout error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Logout failed"));
  }
}

/**
 * Handle demo login (automatic login to demo account)
 * POST /api/bug-hatch/auth/demo-login
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
    res.cookie("bug-hatch-token", result.token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: result.maxAge,
    });

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    logError("Error in demo login:", error);
    res.status(500).send(formatErrorResponse("Internal server error during demo login"));
  }
}

/**
 * Handle get current user (me)
 * GET /api/bug-hatch/auth/me
 */
function handleGetMe(req, res) {
  try {
    // Get user from token
    const token = req.cookies["bug-hatch-token"];

    // Call auth service
    const result = getCurrentUser(token);

    if (!result.success) {
      const statusCode = result.errorType === "unauthorized" ? HTTP_UNAUTHORIZED : HTTP_BAD_REQUEST;
      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: result.user,
    });
  } catch (error) {
    logError("BugHatch get me error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get current user"));
  }
}

/**
 * Main handler for BugHatch auth endpoints
 */
function handleBugHatchAuth(req, res) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  // Signup
  if (req.method === "POST" && urlEnds.includes("/api/bug-hatch/auth/signup")) {
    handleSignup(req, res);
    return;
  }

  // Login
  if (req.method === "POST" && urlEnds.includes("/api/bug-hatch/auth/login")) {
    handleLogin(req, res);
    return;
  }

  // Demo Login
  if (req.method === "POST" && urlEnds.includes("/api/bug-hatch/auth/demo-login")) {
    handleDemoLogin(req, res);
    return;
  }

  // Logout
  if (req.method === "POST" && urlEnds.includes("/api/bug-hatch/auth/logout")) {
    handleLogout(req, res);
    return;
  }

  // Get current user
  if (req.method === "GET" && urlEnds.includes("/api/bug-hatch/auth/me")) {
    handleGetMe(req, res);
    return;
  }

  // If no route matched
  res.status(404).send(formatErrorResponse("Endpoint not found"));
}

module.exports = {
  handleBugHatchAuth,
};
