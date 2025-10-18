const { logError } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");
const { HTTP_OK, HTTP_INTERNAL_SERVER_ERROR, HTTP_FORBIDDEN } = require("../../helpers/response.helpers");
const { initializeDatabases, resetDatabase, getDatabaseStatus } = require("./services/database.service");

// ==================== ADMIN HANDLERS ====================

/**
 * Handle database initialization
 * POST /api/bug-hatch/admin/init-db
 */
async function handleInitDb(req, res) {
  try {
    // Call database service
    const result = await initializeDatabases();

    if (!result.success) {
      res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse(result.error));
      return;
    }

    // Get current stats
    const statsResult = await getDatabaseStatus();

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        message: result.message,
        stats: statsResult.stats,
      },
    });
  } catch (error) {
    logError("BugHatch init-db error:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse(error.message || "Database initialization failed"));
  }
}

/**
 * Handle database reset with demo data
 * POST /api/bug-hatch/admin/reset-db
 */
async function handleResetDb(req, res) {
  try {
    const { force } = req.body;

    // Call database service
    const result = await resetDatabase(force);

    if (!result.success) {
      const statusCode =
        result.error && result.error.includes("Force reset flag") ? HTTP_FORBIDDEN : HTTP_INTERNAL_SERVER_ERROR;
      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        message: result.message,
        stats: result.stats,
      },
    });
  } catch (error) {
    logError("BugHatch reset-db error:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse(error.message || "Database reset failed"));
  }
}

/**
 * Handle database status check
 * GET /api/bug-hatch/admin/db-status
 */
async function handleDbStatus(req, res) {
  try {
    // Call database service
    const result = await getDatabaseStatus();

    if (!result.success) {
      res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: result.stats,
    });
  } catch (error) {
    logError("BugHatch db-status error:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse(error.message || "Failed to get database status"));
  }
}

/**
 * Main handler for BugHatch admin endpoints
 */
function handleBugHatchAdmin(req, res) {
  const urlEnds = req.url.split("?")[0];

  // Initialize database
  if (req.method === "POST" && urlEnds.includes("/api/bug-hatch/admin/init-db")) {
    handleInitDb(req, res);
    return;
  }

  // Reset database
  if (req.method === "POST" && urlEnds.includes("/api/bug-hatch/admin/reset-db")) {
    handleResetDb(req, res);
    return;
  }

  // Database status
  if (req.method === "GET" && urlEnds.includes("/api/bug-hatch/admin/db-status")) {
    handleDbStatus(req, res);
    return;
  }

  // If no route matched
  res.status(404).send(formatErrorResponse("Admin endpoint not found"));
}

module.exports = {
  handleBugHatchAdmin,
};
