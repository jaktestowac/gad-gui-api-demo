const { HTTP_FORBIDDEN } = require("../../helpers/response.helpers");
const { readBugHatchDemoDb } = require("./db-bug-hatch.operations");
const { logError, logTrace } = require("../../helpers/logger-api");
const { verifyToken } = require("../../helpers/jwtauth");
const { formatErrorResponse } = require("../../helpers/helpers");

/**
 * Middleware to check if the request is in demo mode
 * @param {Object} req - Express request object
 * @returns {boolean} - True if demo mode is active
 */
function isDemoMode(req) {
  const token = req.cookies["bug-hatch-token"];

  if (!token) {
    return false;
  }

  const decoded = verifyToken(token);

  if (!decoded || decoded instanceof Error) {
    return false;
  }

  return decoded.isDemo === true;
}

/**
 * Middleware to block mutations in demo mode
 * Place this before any mutation endpoints (POST, PUT, PATCH, DELETE)
 */
function blockDemoMutations(req, res, next) {
  // Only check for mutation methods
  const mutationMethods = ["POST", "PUT", "PATCH", "DELETE"];

  if (!mutationMethods.includes(req.method)) {
    next();
    return;
  }

  // Allow auth endpoints even in demo mode (login, logout, etc.)
  if (req.url.includes("/api/bug-hatch/auth/")) {
    next();
    return;
  }

  // Check if demo mode is active
  if (isDemoMode(req)) {
    logTrace("Demo mode: Blocking mutation attempt:", { method: req.method, url: req.url });
    res
      .status(HTTP_FORBIDDEN)
      .send(
        formatErrorResponse("Demo mode is read-only. Sign up for a free account to create, edit, or delete items.")
      );
    return;
  }

  next();
}

/**
 * Middleware to inject demo data context
 * This replaces the normal database read with demo database for demo users
 */
function injectDemoContext(req, res, next) {
  if (isDemoMode(req)) {
    // Add demo flag to request
    req.isDemo = true;
    req.demoDb = readBugHatchDemoDb();
    logTrace("Demo mode: Context injected");
  } else {
    req.isDemo = false;
  }
  next();
}

module.exports = {
  isDemoMode,
  blockDemoMutations,
  injectDemoContext,
};
