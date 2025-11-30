const { logError, logDebug } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED, HTTP_FORBIDDEN } = require("../../helpers/response.helpers");
const {
  resetGadTalkDatabaseWithDemoData,
  getGadTalkDbStatus,
  initializeAllGadTalkDatabases,
  getGadTalkAuditLogs,
} = require("./db-gad-talk.operations");
const { getAuthenticatedUser } = require("./users-endpoint.helpers");
const gadTalkConfig = require("./gad-talk-config");

// ==================== HELPERS ====================

/**
 * Check if user is admin
 * @param {object} req - Express request
 * @returns {object} { isAdmin: boolean, user?: object, error?: string }
 */
function checkAdminAuth(req) {
  if (!gadTalkConfig.admin.requireAuth) {
    return { isAdmin: true };
  }

  const user = getAuthenticatedUser(req);
  if (!user) {
    return { isAdmin: false, error: "Authentication required" };
  }

  if (!gadTalkConfig.admin.adminRoles.includes(user.role)) {
    return { isAdmin: false, error: "Admin access required", user };
  }

  return { isAdmin: true, user };
}

// ==================== ADMIN HANDLERS ====================

/**
 * Reset database with demo data
 * POST /api/gad-talk/admin/reset-db
 */
async function handleResetDb(req, res) {
  try {
    // Check admin auth
    const authCheck = checkAdminAuth(req);
    if (!authCheck.isAdmin) {
      const statusCode = authCheck.error.includes("Authentication") ? HTTP_UNAUTHORIZED : HTTP_FORBIDDEN;
      res.status(statusCode).send(formatErrorResponse(authCheck.error));
      return;
    }

    const result = await resetGadTalkDatabaseWithDemoData();

    logDebug("GadTalk: Database reset by admin:", { userId: authCheck.user?.id });

    res.status(HTTP_OK).send({
      ok: true,
      data: result,
    });
  } catch (error) {
    logError("GadTalk admin reset-db error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to reset database"));
  }
}

/**
 * Get database status
 * GET /api/gad-talk/admin/db-status
 */
async function handleGetDbStatus(req, res) {
  try {
    // Check admin auth
    const authCheck = checkAdminAuth(req);
    if (!authCheck.isAdmin) {
      const statusCode = authCheck.error.includes("Authentication") ? HTTP_UNAUTHORIZED : HTTP_FORBIDDEN;
      res.status(statusCode).send(formatErrorResponse(authCheck.error));
      return;
    }

    const status = getGadTalkDbStatus();

    res.status(HTTP_OK).send({
      ok: true,
      data: status,
    });
  } catch (error) {
    logError("GadTalk admin db-status error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get database status"));
  }
}

/**
 * Seed demo data
 * POST /api/gad-talk/admin/seed-demo-data
 */
async function handleSeedDemoData(req, res) {
  try {
    // Check admin auth
    const authCheck = checkAdminAuth(req);
    if (!authCheck.isAdmin) {
      const statusCode = authCheck.error.includes("Authentication") ? HTTP_UNAUTHORIZED : HTTP_FORBIDDEN;
      res.status(statusCode).send(formatErrorResponse(authCheck.error));
      return;
    }

    const result = await resetGadTalkDatabaseWithDemoData();

    logDebug("GadTalk: Demo data seeded by admin:", { userId: authCheck.user?.id });

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        message: "Demo data seeded successfully",
        ...result,
      },
    });
  } catch (error) {
    logError("GadTalk admin seed-demo-data error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to seed demo data"));
  }
}

/**
 * Initialize databases
 * POST /api/gad-talk/admin/init-db
 */
async function handleInitDb(req, res) {
  try {
    // Check admin auth
    const authCheck = checkAdminAuth(req);
    if (!authCheck.isAdmin) {
      const statusCode = authCheck.error.includes("Authentication") ? HTTP_UNAUTHORIZED : HTTP_FORBIDDEN;
      res.status(statusCode).send(formatErrorResponse(authCheck.error));
      return;
    }

    await initializeAllGadTalkDatabases();

    const status = getGadTalkDbStatus();

    logDebug("GadTalk: Databases initialized by admin:", { userId: authCheck.user?.id });

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        message: "Databases initialized successfully",
        status,
      },
    });
  } catch (error) {
    logError("GadTalk admin init-db error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to initialize databases"));
  }
}

/**
 * Get audit logs
 * GET /api/gad-talk/admin/logs
 */
async function handleGetLogs(req, res) {
  try {
    // Check admin auth
    const authCheck = checkAdminAuth(req);
    if (!authCheck.isAdmin) {
      const statusCode = authCheck.error.includes("Authentication") ? HTTP_UNAUTHORIZED : HTTP_FORBIDDEN;
      res.status(statusCode).send(formatErrorResponse(authCheck.error));
      return;
    }

    const { actorUserId, eventType, limit = 100 } = req.query;

    let logs = getGadTalkAuditLogs({
      actorUserId,
      eventType,
    });

    // Sort by createdAt desc
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply limit
    logs = logs.slice(0, parseInt(limit, 10));

    res.status(HTTP_OK).send({
      ok: true,
      data: logs,
    });
  } catch (error) {
    logError("GadTalk admin logs error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get logs"));
  }
}

/**
 * Get metrics (placeholder)
 * GET /api/gad-talk/admin/metrics
 */
async function handleGetMetrics(req, res) {
  try {
    // Check admin auth
    const authCheck = checkAdminAuth(req);
    if (!authCheck.isAdmin) {
      const statusCode = authCheck.error.includes("Authentication") ? HTTP_UNAUTHORIZED : HTTP_FORBIDDEN;
      res.status(statusCode).send(formatErrorResponse(authCheck.error));
      return;
    }

    const dbStatus = getGadTalkDbStatus();

    // Basic metrics
    const metrics = {
      database: dbStatus.collections,
      requests: {
        total: 0, // Would be tracked in a real implementation
        perEndpoint: {},
      },
      errors: {
        total: 0,
        rate: 0,
      },
      responseTimes: {
        avg: 0,
        p95: 0,
        p99: 0,
      },
      websocket: {
        activeConnections: 0,
      },
      queues: {
        outbox: dbStatus.collections.outbox,
        notifications: 0,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(HTTP_OK).send({
      ok: true,
      data: metrics,
    });
  } catch (error) {
    logError("GadTalk admin metrics error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get metrics"));
  }
}

/**
 * Get chaos configuration
 * GET /api/gad-talk/admin/chaos/config
 */
async function handleGetChaosConfig(req, res) {
  try {
    // Check admin auth
    const authCheck = checkAdminAuth(req);
    if (!authCheck.isAdmin) {
      const statusCode = authCheck.error.includes("Authentication") ? HTTP_UNAUTHORIZED : HTTP_FORBIDDEN;
      res.status(statusCode).send(formatErrorResponse(authCheck.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: gadTalkConfig.chaos,
    });
  } catch (error) {
    logError("GadTalk admin chaos config error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get chaos config"));
  }
}

/**
 * Update chaos configuration
 * PUT /api/gad-talk/admin/chaos/config
 */
async function handleUpdateChaosConfig(req, res) {
  try {
    // Check admin auth
    const authCheck = checkAdminAuth(req);
    if (!authCheck.isAdmin) {
      const statusCode = authCheck.error.includes("Authentication") ? HTTP_UNAUTHORIZED : HTTP_FORBIDDEN;
      res.status(statusCode).send(formatErrorResponse(authCheck.error));
      return;
    }

    const updates = req.body;

    // Update chaos config (in-memory only)
    if (updates.enabled !== undefined) {
      gadTalkConfig.chaos.enabled = updates.enabled;
    }
    if (updates.features) {
      Object.assign(gadTalkConfig.chaos.features, updates.features);
    }

    logDebug("GadTalk: Chaos config updated by admin:", { userId: authCheck.user?.id, updates });

    res.status(HTTP_OK).send({
      ok: true,
      data: gadTalkConfig.chaos,
    });
  } catch (error) {
    logError("GadTalk admin chaos config update error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to update chaos config"));
  }
}

/**
 * Enable chaos mode
 * POST /api/gad-talk/admin/chaos/enable
 */
async function handleEnableChaos(req, res) {
  try {
    // Check admin auth
    const authCheck = checkAdminAuth(req);
    if (!authCheck.isAdmin) {
      const statusCode = authCheck.error.includes("Authentication") ? HTTP_UNAUTHORIZED : HTTP_FORBIDDEN;
      res.status(statusCode).send(formatErrorResponse(authCheck.error));
      return;
    }

    gadTalkConfig.chaos.enabled = true;

    logDebug("GadTalk: Chaos mode enabled by admin:", { userId: authCheck.user?.id });

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        message: "Chaos mode enabled",
        chaos: gadTalkConfig.chaos,
      },
    });
  } catch (error) {
    logError("GadTalk admin enable chaos error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to enable chaos"));
  }
}

/**
 * Disable chaos mode
 * POST /api/gad-talk/admin/chaos/disable
 */
async function handleDisableChaos(req, res) {
  try {
    // Check admin auth
    const authCheck = checkAdminAuth(req);
    if (!authCheck.isAdmin) {
      const statusCode = authCheck.error.includes("Authentication") ? HTTP_UNAUTHORIZED : HTTP_FORBIDDEN;
      res.status(statusCode).send(formatErrorResponse(authCheck.error));
      return;
    }

    gadTalkConfig.chaos.enabled = false;

    logDebug("GadTalk: Chaos mode disabled by admin:", { userId: authCheck.user?.id });

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        message: "Chaos mode disabled",
        chaos: gadTalkConfig.chaos,
      },
    });
  } catch (error) {
    logError("GadTalk admin disable chaos error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to disable chaos"));
  }
}

// ==================== EXPORTS ====================

module.exports = {
  // Admin handlers
  handleResetDb,
  handleGetDbStatus,
  handleSeedDemoData,
  handleInitDb,
  handleGetLogs,
  handleGetMetrics,
  handleGetChaosConfig,
  handleUpdateChaosConfig,
  handleEnableChaos,
  handleDisableChaos,

  // Helpers
  checkAdminAuth,
};
