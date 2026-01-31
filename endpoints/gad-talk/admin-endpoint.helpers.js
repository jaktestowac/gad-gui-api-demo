const { logError, logDebug } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED, HTTP_FORBIDDEN } = require("../../helpers/response.helpers");
const {
  resetGadTalkDatabaseWithDemoData,
  getGadTalkDbStatus,
  initializeAllGadTalkDatabases,
  getGadTalkAuditLogs,
  getFeatureFlags,
  setFeatureFlag,
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

function getActorUserId(req) {
  const user = getAuthenticatedUser(req);
  return user ? user.id : null;
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

/**
 * Get feature flags (public)
 * GET /api/gad-talk/admin/feature-flags
 */
async function handleGetFeatureFlags(req, res) {
  try {
    const flags = getFeatureFlags();
    res.status(HTTP_OK).send({
      ok: true,
      data: flags,
    });
  } catch (error) {
    logError("GadTalk admin feature-flags error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get feature flags"));
  }
}

/**
 * Update feature flag (public)
 * PUT /api/gad-talk/admin/feature-flags/:flag
 */
async function handleUpdateFeatureFlag(req, res) {
  try {
    const { flag } = req.params;
    const { enabled } = req.body || {};
    if (enabled === undefined) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Enabled value is required"));
      return;
    }

    const updated = await setFeatureFlag(flag, !!enabled, getActorUserId(req));

    res.status(HTTP_OK).send({
      ok: true,
      data: updated,
    });
  } catch (error) {
    logError("GadTalk admin feature-flag update error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to update feature flag"));
  }
}

/**
 * Enable feature flag (public)
 * POST /api/gad-talk/admin/feature-flags/:flag/enable
 */
async function handleEnableFeatureFlag(req, res) {
  try {
    const { flag } = req.params;
    const updated = await setFeatureFlag(flag, true, getActorUserId(req));
    res.status(HTTP_OK).send({
      ok: true,
      data: updated,
    });
  } catch (error) {
    logError("GadTalk admin feature-flag enable error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to enable feature flag"));
  }
}

/**
 * Disable feature flag (public)
 * POST /api/gad-talk/admin/feature-flags/:flag/disable
 */
async function handleDisableFeatureFlag(req, res) {
  try {
    const { flag } = req.params;
    const updated = await setFeatureFlag(flag, false, getActorUserId(req));
    res.status(HTTP_OK).send({
      ok: true,
      data: updated,
    });
  } catch (error) {
    logError("GadTalk admin feature-flag disable error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to disable feature flag"));
  }
}

/**
 * Feature flags UI page (public)
 * GET /api/gad-talk/admin/features
 */
async function handleFeatureFlagsPage(_req, res) {
  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GadTalk Feature Flags</title>
    <link rel="stylesheet" href="/gad-talk/css/gad-talk.css" />
    <style>${getAdminPageStyles()}</style>
  </head>
  <body>
    <!-- Header -->
    <div class="gt-admin-header">
      <div class="gt-admin-header-content">
        <div class="gt-header-brand">
          🚩 Feature Flags
        </div>
        <a href="/api/gad-talk/admin/backend" class="gt-header-back-link">← Backend</a>
      </div>
    </div>

    <!-- Main Content -->
    <div class="gt-admin-container">
      <h1 class="gt-admin-title">Feature Flags Management</h1>
      <p class="gt-admin-subtitle">View and manage feature flags. Toggle features on/off in real-time. Changes apply immediately.</p>
      <a href="/gadtalk" style="color: #1d9bf0; text-decoration: none; margin-bottom: 24px; display: inline-block;">← Home</a>
      <a href="/api/gad-talk/admin/backend" style="color: #1d9bf0; text-decoration: none; margin-bottom: 24px; display: inline-block;">← Backend</a>
      <div id="flags" style="background: linear-gradient(180deg, rgba(22, 24, 28, 0.92), rgba(14, 15, 18, 0.92)); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; padding: 20px; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px);"></div>
    </div>

    <!-- Footer -->
    ${getAdminPageFooter()}

    <script src="/gad-talk/js/feature-flags-admin.js"></script>
  </body>
  </html>`;

  res.status(HTTP_OK).send(html);
}

// ==================== ADMIN PAGE HELPERS ====================

/**
 * Generate shared admin pages CSS
 */
function getAdminPageStyles() {
  return `
    body {
      background-color: #000000;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .gt-admin-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background-color: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #2f3336;
      padding: 16px;
    }
    .gt-admin-header-content {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .gt-header-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.25rem;
      font-weight: 700;
      color: #e7e9ea;
    }
    .gt-header-back-link {
      color: #1d9bf0;
      text-decoration: none;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 9999px;
      transition: background-color 0.2s;
    }
    .gt-header-back-link:hover {
      background-color: rgba(29, 155, 240, 0.1);
    }
    .gt-admin-container {
      flex: 1;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
      padding: 24px 16px;
    }
    .gt-admin-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #e7e9ea;
    }
    .gt-admin-subtitle {
      font-size: 14px;
      color: #71767b;
      margin-bottom: 24px;
    }
    .gt-admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .gt-admin-item {
      background: linear-gradient(180deg, rgba(22, 24, 28, 0.92), rgba(14, 15, 18, 0.92));
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .gt-admin-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(29, 155, 240, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03);
    }
    .gt-admin-item-title {
      font-size: 16px;
      font-weight: 600;
      color: #e7e9ea;
      margin-bottom: 8px;
    }
    .gt-admin-item-desc {
      font-size: 13px;
      color: #71767b;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .gt-admin-item-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      background-color: #1d9bf0;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      border-radius: 9999px;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .gt-admin-item-link:hover {
      background-color: #1a8cd8;
    }
    .gt-admin-item-link.disabled {
      background-color: #2f3336;
      color: #71767b;
      pointer-events: none;
      opacity: 0.6;
    }
    .gt-coming-soon {
      background: linear-gradient(180deg, rgba(22, 24, 28, 0.92), rgba(14, 15, 18, 0.92));
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 40px 24px;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      max-width: 500px;
    }
    .gt-coming-soon-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .gt-coming-soon-title {
      font-size: 24px;
      font-weight: 700;
      color: #e7e9ea;
      margin-bottom: 12px;
    }
    .gt-coming-soon-text {
      font-size: 14px;
      color: #71767b;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .gt-back-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background-color: #1d9bf0;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      border-radius: 9999px;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .gt-back-button:hover {
      background-color: #1a8cd8;
    }
    .gt-admin-footer {
      margin-top: auto;
      border-top: 1px solid #2f3336;
      padding: 24px 16px;
      background-color: rgba(0, 0, 0, 0.5);
    }
    .gt-admin-footer-content {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .gt-footer-links {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .gt-footer-link {
      color: #71767b;
      text-decoration: none;
      font-size: 13px;
      transition: color 0.2s;
    }
    .gt-footer-link:hover {
      color: #1d9bf0;
    }
    .gt-footer-copyright {
      color: #536471;
      font-size: 13px;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 10px;
      border-bottom: 1px solid rgba(47, 51, 54, 0.35);
      border-radius: 8px;
      transition: background-color 0.15s, transform 0.12s;
      font-size: 13px;
      line-height: 1.2;
      min-height: 36px;
    }
    .row:hover {
      background-color: rgba(29, 155, 240, 0.04);
      transform: translateY(-1px);
    }
    .row:last-child {
      border-bottom: none;
    }
    .row button {
      background-color: #1d9bf0;
      color: #fff;
      border: none;
      border-radius: 9999px;
      padding: 3px 10px;
      font-weight: 600;
      font-size: 12px;
      height: 28px;
      cursor: pointer;
      transition: background-color 0.15s;
      white-space: nowrap;
    }
    .row button:hover {
      background-color: #1a8cd8;
    }
    .row button.off {
      background-color: #2f3336;
      color: #71767b;
    }
    .row button.off:hover {
      background-color: #38444d;
    }
  `;
}

/**
 * Generate admin page footer HTML
 */
function getAdminPageFooter() {
  return `
    <div class="gt-admin-footer">
      <div class="gt-admin-footer-content">
        <div class="gt-footer-links">
          <a href="/" class="gt-footer-link">Home</a>
          <a href="/gad-talk/about.html" class="gt-footer-link">About</a>
          <a href="/gad-talk/privacy.html" class="gt-footer-link">Privacy</a>
          <a href="/gad-talk/terms.html" class="gt-footer-link">Terms</a>
        </div>
        <div class="gt-footer-copyright">© 2025 GadTalk • Backend</div>
      </div>
    </div>
  `;
}

// Admin backend page (public)
// GET /api/gad-talk/admin/backend
async function handleAdminBackendPage(_req, res) {
  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GadTalk Backend</title>
    <link rel="stylesheet" href="/gad-talk/css/gad-talk.css" />
    <style>${getAdminPageStyles()}</style>
  </head>
  <body>
    <!-- Header -->
    <div class="gt-admin-header">
      <div class="gt-admin-header-content">
        <div class="gt-header-brand">
          ⚙️ GadTalk Backend
        </div>
        <a href="/" class="gt-header-back-link">← Back to GadTalk</a>
      </div>
    </div>

    <!-- Main Content -->
    <div class="gt-admin-container">
      <h1 class="gt-admin-title">Backend Management</h1>
      <p class="gt-admin-subtitle">Access internal tools and configurations for GadTalk platform administration</p>

      <div class="gt-admin-grid">
        <!-- Feature Flags -->
        <div class="gt-admin-item">
          <div class="gt-admin-item-title">🚩 Feature Flags</div>
          <div class="gt-admin-item-desc">View and manage feature flags. Toggle features on/off in real-time.</div>
          <a href="/api/gad-talk/admin/features" class="gt-admin-item-link">Open Feature Flags</a>
        </div>

        <!-- Swagger -->
        <div class="gt-admin-item">
          <div class="gt-admin-item-title">📚 API Documentation</div>
          <div class="gt-admin-item-desc">Interactive API documentation and testing with Swagger UI.</div>
          <a href="/api/gad-talk/admin/swagger" class="gt-admin-item-link disabled">Coming Soon</a>
        </div>

        <!-- Features Description -->
        <div class="gt-admin-item">
          <div class="gt-admin-item-title">📖 Features Guide</div>
          <div class="gt-admin-item-desc">Detailed description of all platform features and capabilities.</div>
          <a href="/api/gad-talk/admin/features-description" class="gt-admin-item-link disabled">Coming Soon</a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    ${getAdminPageFooter()}
  </body>
  </html>`;
  res.status(HTTP_OK).send(html);
}

// Swagger placeholder page (not implemented)
// GET /api/gad-talk/admin/swagger
async function handleSwaggerPlaceholder(_req, res) {
  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>API Documentation - Swagger</title>
    <link rel="stylesheet" href="/gad-talk/css/gad-talk.css" />
    <style>${getAdminPageStyles()}</style>
  </head>
  <body>
    <!-- Header -->
    <div class="gt-admin-header">
      <div class="gt-admin-header-content">
        <div class="gt-header-brand">
          📚 API Documentation
        </div>
        <a href="/api/gad-talk/admin/backend" class="gt-header-back-link">← Backend</a>
      </div>
    </div>

    <!-- Main Content -->
    <div class="gt-admin-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
      <div class="gt-coming-soon">
        <div class="gt-coming-soon-icon">📚</div>
        <h1 class="gt-coming-soon-title">Swagger UI</h1>
        <p class="gt-coming-soon-text">
          API documentation and interactive testing will be available here soon. 
          This endpoint will provide a comprehensive Swagger interface for exploring all GadTalk API endpoints.
        </p>
        <a href="/api/gad-talk/admin/backend" class="gt-back-button">← Back to Backend</a>
      </div>
    </div>

    <!-- Footer -->
    ${getAdminPageFooter()}
  </body>
  </html>`;
  res.status(HTTP_OK).send(html);
}

// Features description placeholder page (not implemented)
// GET /api/gad-talk/admin/features-description
async function handleFeaturesDescriptionPage(_req, res) {
  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Features Guide</title>
    <link rel="stylesheet" href="/gad-talk/css/gad-talk.css" />
    <style>${getAdminPageStyles()}</style>
  </head>
  <body>
    <!-- Header -->
    <div class="gt-admin-header">
      <div class="gt-admin-header-content">
        <div class="gt-header-brand">
          📖 Features Guide
        </div>
        <a href="/api/gad-talk/admin/backend" class="gt-header-back-link">← Backend</a>
      </div>
    </div>

    <!-- Main Content -->
    <div class="gt-admin-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
      <div class="gt-coming-soon">
        <div class="gt-coming-soon-icon">📖</div>
        <h1 class="gt-coming-soon-title">Features Description</h1>
        <p class="gt-coming-soon-text">
          A comprehensive guide describing all GadTalk platform features and their usage will be available here soon. 
          Learn about what makes GadTalk unique and how to make the most of each feature.
        </p>
        <a href="/api/gad-talk/admin/backend" class="gt-back-button">← Back to Backend</a>
      </div>
    </div>

    <!-- Footer -->
    ${getAdminPageFooter()}
  </body>
  </html>`;
  res.status(HTTP_OK).send(html);
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
  handleGetFeatureFlags,
  handleUpdateFeatureFlag,
  handleEnableFeatureFlag,
  handleDisableFeatureFlag,
  handleFeatureFlagsPage,
  handleAdminBackendPage,
  handleSwaggerPlaceholder,
  handleFeaturesDescriptionPage,

  // Helpers
  checkAdminAuth,
};
