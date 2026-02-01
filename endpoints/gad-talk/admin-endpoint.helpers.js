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
const { getChaosMetrics } = require("./chaos-helpers");

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
 * Get chaos status (public - no auth required)
 * GET /api/gad-talk/admin/chaos/status
 * Returns whether chaos is active without requiring authentication
 */
async function handleGetChaosStatus(_req, res) {
  try {
    const chaos = gadTalkConfig.chaos;
    const isActive = chaos && chaos.enabled;

    // Count active features
    let activeFeatureCount = 0;
    if (isActive && chaos.features) {
      if (chaos.features.randomDelays?.enabled) activeFeatureCount++;
      if (chaos.features.intermittentFailures?.enabled) activeFeatureCount++;
      if (chaos.features.rateLimitChaos?.enabled) activeFeatureCount++;
      if (chaos.features.dependencyOutage?.enabled) activeFeatureCount++;
      if (chaos.features.partialResponseCorruption?.enabled) activeFeatureCount++;
      if (chaos.features.slowEndpoints?.enabled) activeFeatureCount++;
      if (chaos.features.flakyWebSocket?.enabled) activeFeatureCount++;
      if (chaos.features.featureFlagChaos?.enabled) activeFeatureCount++;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        enabled: isActive,
        activeFeatureCount,
        message: isActive
          ? `Chaos mode is ACTIVE with ${activeFeatureCount} feature(s) enabled`
          : "Chaos mode is disabled",
      },
    });
  } catch (error) {
    logError("GadTalk chaos status error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get chaos status"));
  }
}

/**
 * Get chaos configuration (public)
 * GET /api/gad-talk/admin/chaos/config
 */
async function handleGetChaosConfig(_req, res) {
  try {
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
 * Update chaos configuration (public)
 * PUT /api/gad-talk/admin/chaos/config
 */
async function handleUpdateChaosConfig(req, res) {
  try {
    const updates = req.body;

    // Update chaos config (in-memory only)
    if (updates.enabled !== undefined) {
      gadTalkConfig.chaos.enabled = updates.enabled;
    }
    if (updates.scope) {
      gadTalkConfig.chaos.scope = {
        ...gadTalkConfig.chaos.scope,
        ...updates.scope,
      };
    }
    if (updates.targeting) {
      gadTalkConfig.chaos.targeting = {
        ...gadTalkConfig.chaos.targeting,
        ...updates.targeting,
      };
    }
    if (updates.features) {
      Object.assign(gadTalkConfig.chaos.features, updates.features);
    }

    logDebug("GadTalk: Chaos config updated:", { updates });

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
 * Get chaos metrics (public)
 * GET /api/gad-talk/admin/chaos/metrics
 */
async function handleGetChaosMetrics(_req, res) {
  try {
    res.status(HTTP_OK).send({
      ok: true,
      data: getChaosMetrics(),
    });
  } catch (error) {
    logError("GadTalk chaos metrics error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get chaos metrics"));
  }
}

/**
 * Enable chaos mode (public)
 * POST /api/gad-talk/admin/chaos/enable
 */
async function handleEnableChaos(_req, res) {
  try {
    gadTalkConfig.chaos.enabled = true;

    logDebug("GadTalk: Chaos mode enabled");

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
 * Disable chaos mode (public)
 * POST /api/gad-talk/admin/chaos/disable
 */
async function handleDisableChaos(_req, res) {
  try {
    gadTalkConfig.chaos.enabled = false;

    logDebug("GadTalk: Chaos mode disabled");

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

// ==================== CHAOS PRESETS ====================

const CHAOS_PRESETS = {
  off: {
    name: "Off",
    description: "All chaos features disabled",
    icon: "✅",
    config: {
      enabled: false,
      targeting: {
        enabled: false,
        requireAuth: false,
        allowRoles: [],
        denyRoles: [],
        allowUsers: [],
        denyUsers: [],
        applyToAnonymous: true,
      },
      features: {
        randomDelays: { enabled: false },
        intermittentFailures: { enabled: false },
        rateLimitChaos: { enabled: false },
        dependencyOutage: { enabled: false },
        partialResponseCorruption: { enabled: false },
        slowEndpoints: { enabled: false },
        flakyWebSocket: { enabled: false },
        featureFlagChaos: { enabled: false },
        connectionTimeoutChaos: { enabled: false },
        partialResponseDelivery: { enabled: false },
        dataConsistencyViolations: { enabled: false },
      },
    },
  },
  mild: {
    name: "Mild",
    description: "Light delays, very rare failures",
    icon: "🌤️",
    config: {
      enabled: true,
      scope: {
        allowlist: ["/api/gad-talk"],
        denylist: ["/api/gad-talk/admin", "/api/gad-talk/auth"],
        methods: ["GET"],
      },
      features: {
        randomDelays: { enabled: true, minMs: 50, maxMs: 500, probability: 0.1 },
        intermittentFailures: { enabled: false },
        rateLimitChaos: { enabled: false },
        dependencyOutage: { enabled: false },
        partialResponseCorruption: { enabled: false },
        slowEndpoints: { enabled: false },
        flakyWebSocket: { enabled: false },
        featureFlagChaos: { enabled: false },
        connectionTimeoutChaos: { enabled: false },
        partialResponseDelivery: { enabled: false },
        dataConsistencyViolations: { enabled: false },
      },
    },
  },
  moderate: {
    name: "Moderate",
    description: "Noticeable delays, occasional failures",
    icon: "🌥️",
    config: {
      enabled: true,
      scope: {
        allowlist: ["/api/gad-talk"],
        denylist: ["/api/gad-talk/admin", "/api/gad-talk/auth"],
        methods: ["GET", "POST"],
      },
      features: {
        randomDelays: { enabled: true, minMs: 100, maxMs: 1500, probability: 0.25 },
        intermittentFailures: { enabled: true, probability: 0.03, httpStatus: 503 },
        rateLimitChaos: { enabled: false },
        dependencyOutage: { enabled: false },
        partialResponseCorruption: { enabled: false },
        slowEndpoints: { enabled: true, endpoints: ["/api/gad-talk/search"], delayMs: 1500 },
        flakyWebSocket: { enabled: false },
        featureFlagChaos: { enabled: false },
        connectionTimeoutChaos: { enabled: false },
        partialResponseDelivery: { enabled: false },
        dataConsistencyViolations: { enabled: false },
      },
    },
  },
  severe: {
    name: "Severe",
    description: "Heavy delays, frequent failures",
    icon: "⛈️",
    config: {
      enabled: true,
      scope: {
        allowlist: ["/api/gad-talk"],
        denylist: ["/api/gad-talk/admin", "/api/gad-talk/auth"],
        methods: ["GET", "POST", "PUT", "DELETE"],
      },
      features: {
        randomDelays: { enabled: true, minMs: 200, maxMs: 3000, probability: 0.4 },
        intermittentFailures: { enabled: true, probability: 0.1, httpStatus: 503 },
        rateLimitChaos: { enabled: false },
        dependencyOutage: { enabled: false },
        partialResponseCorruption: { enabled: true, probability: 0.05, mode: "dropFields", maxFieldsToDrop: 1 },
        slowEndpoints: {
          enabled: true,
          endpoints: ["/api/gad-talk/search", "/api/gad-talk/gads", "/api/gad-talk/users"],
          delayMs: 2500,
        },
        flakyWebSocket: { enabled: true, disconnectProbability: 0.05, reconnectDelayMs: 3000 },
        featureFlagChaos: { enabled: false },
        connectionTimeoutChaos: { enabled: false },
        partialResponseDelivery: { enabled: false },
        dataConsistencyViolations: { enabled: false },
      },
    },
  },
  nightmare: {
    name: "Nightmare",
    description: "Maximum chaos - expect failures everywhere",
    icon: "💀",
    config: {
      enabled: true,
      scope: {
        allowlist: ["/api/gad-talk"],
        denylist: ["/api/gad-talk/admin", "/api/gad-talk/auth"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      },
      features: {
        randomDelays: { enabled: true, minMs: 500, maxMs: 5000, probability: 0.6 },
        intermittentFailures: { enabled: true, probability: 0.2, httpStatus: 503 },
        rateLimitChaos: { enabled: false },
        dependencyOutage: { enabled: false },
        partialResponseCorruption: { enabled: true, probability: 0.15, mode: "truncateStrings", truncateLength: 40 },
        slowEndpoints: {
          enabled: true,
          endpoints: ["/api/gad-talk/search", "/api/gad-talk/gads", "/api/gad-talk/users", "/api/gad-talk/timeline"],
          delayMs: 4000,
        },
        flakyWebSocket: { enabled: true, disconnectProbability: 0.15, reconnectDelayMs: 8000 },
        featureFlagChaos: {
          enabled: true,
          flagKey: "chaos_dashboard",
          mode: "require-enabled",
          probability: 0.3,
          httpStatus: 503,
        },
        connectionTimeoutChaos: {
          enabled: true,
          probability: 0.15,
          timeoutMs: 5000,
          endpoints: ["/api/gad-talk/search", "/api/gad-talk/users"],
        },
        partialResponseDelivery: {
          enabled: true,
          probability: 0.08,
          endpoints: ["/api/gad-talk/gads", "/api/gad-talk/timeline"],
          truncateAtPercent: 50,
        },
        dataConsistencyViolations: {
          enabled: true,
          probability: 0.1,
          endpoints: ["/api/gad-talk/users", "/api/gad-talk/gads"],
          violationTypes: ["staleData", "conflictingVersions", "missingFields"],
        },
      },
    },
  },
  latencyOnly: {
    name: "Latency Only",
    description: "Delays without failures",
    icon: "🐢",
    config: {
      enabled: true,
      scope: {
        allowlist: ["/api/gad-talk"],
        denylist: ["/api/gad-talk/admin", "/api/gad-talk/auth"],
        methods: ["GET"],
      },
      features: {
        randomDelays: { enabled: true, minMs: 150, maxMs: 1200, probability: 0.4 },
        intermittentFailures: { enabled: false },
        rateLimitChaos: { enabled: false },
        dependencyOutage: { enabled: false },
        partialResponseCorruption: { enabled: false },
        slowEndpoints: { enabled: true, endpoints: ["/api/gad-talk/search", "/api/gad-talk/gads"], delayMs: 1200 },
        flakyWebSocket: { enabled: false },
        featureFlagChaos: { enabled: false },
        connectionTimeoutChaos: { enabled: false },
        partialResponseDelivery: { enabled: false },
        dataConsistencyViolations: { enabled: false },
      },
    },
  },
  corruptor: {
    name: "Corruptor",
    description: "Inject partial response corruption",
    icon: "🧪",
    config: {
      enabled: true,
      scope: {
        allowlist: ["/api/gad-talk"],
        denylist: ["/api/gad-talk/admin", "/api/gad-talk/auth"],
        methods: ["GET"],
      },
      features: {
        randomDelays: { enabled: false },
        intermittentFailures: { enabled: false },
        rateLimitChaos: { enabled: false },
        dependencyOutage: { enabled: false },
        partialResponseCorruption: { enabled: true, probability: 0.2, mode: "dropFields", maxFieldsToDrop: 2 },
        slowEndpoints: { enabled: false },
        flakyWebSocket: { enabled: false },
        featureFlagChaos: { enabled: false },
        connectionTimeoutChaos: { enabled: false },
        partialResponseDelivery: { enabled: false },
        dataConsistencyViolations: { enabled: false },
      },
    },
  },
  flagFlip: {
    name: "Flag-Gated",
    description: "Chaos depends on a feature flag",
    icon: "🚩",
    config: {
      enabled: true,
      scope: {
        allowlist: ["/api/gad-talk"],
        denylist: ["/api/gad-talk/admin", "/api/gad-talk/auth"],
        methods: ["GET", "POST"],
      },
      features: {
        randomDelays: { enabled: false },
        intermittentFailures: { enabled: false },
        rateLimitChaos: { enabled: false },
        dependencyOutage: { enabled: false },
        partialResponseCorruption: { enabled: false },
        slowEndpoints: { enabled: false },
        flakyWebSocket: { enabled: false },
        featureFlagChaos: {
          enabled: true,
          flagKey: "chaos_dashboard",
          mode: "require-enabled",
          probability: 0.5,
          httpStatus: 503,
        },
        connectionTimeoutChaos: { enabled: false },
        partialResponseDelivery: { enabled: false },
        dataConsistencyViolations: { enabled: false },
      },
    },
  },
};

/**
 * Get chaos presets (public)
 * GET /api/gad-talk/admin/chaos/presets
 */
async function handleGetChaosPresets(_req, res) {
  try {
    res.status(HTTP_OK).send({
      ok: true,
      data: {
        presets: CHAOS_PRESETS,
        currentConfig: gadTalkConfig.chaos,
      },
    });
  } catch (error) {
    logError("GadTalk admin chaos presets error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get chaos presets"));
  }
}

/**
 * Apply chaos preset (public)
 * POST /api/gad-talk/admin/chaos/presets/:preset
 */
async function handleApplyChaosPreset(req, res) {
  try {
    const { preset } = req.params;
    const presetConfig = CHAOS_PRESETS[preset];

    if (!presetConfig) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(`Unknown preset: ${preset}`));
      return;
    }

    // Apply preset config
    gadTalkConfig.chaos.enabled = presetConfig.config.enabled;
    if (presetConfig.config.scope) {
      gadTalkConfig.chaos.scope = {
        ...gadTalkConfig.chaos.scope,
        ...presetConfig.config.scope,
      };
    }
    if (presetConfig.config.targeting) {
      gadTalkConfig.chaos.targeting = {
        ...gadTalkConfig.chaos.targeting,
        ...presetConfig.config.targeting,
      };
    }
    Object.assign(gadTalkConfig.chaos.features, presetConfig.config.features);

    logDebug("GadTalk: Chaos preset applied:", { preset });

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        message: `Chaos preset '${presetConfig.name}' applied`,
        preset: preset,
        chaos: gadTalkConfig.chaos,
      },
    });
  } catch (error) {
    logError("GadTalk admin chaos preset apply error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to apply chaos preset"));
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
      margin-top: 0;
    }
    .gt-admin-subtitle {
      font-size: 14px;
      color: #71767b;
      margin-bottom: 14px;
      margin-top: 0;
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
        <div class="gt-footer-copyright">© ${new Date().getFullYear()} GadTalk • Backend</div>
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
          ⚙️ GadTalk Backend<br />
          <a href="/gad-talk" class="gt-header-back-link" style="font-size: 12px;">← Back to GadTalk</a> 
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="gt-admin-container">
      <p class="gt-admin-subtitle">Access internal tools and configurations for GadTalk platform administration. 
      <a href="/gad-talk" class="gt-header-back-link">← Back to GadTalk</a></p>
        

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
          <a href="/tools/swagger-gadtalk.html" class="gt-admin-item-link">Open Swagger</a>
        </div>

        <!-- Features Description -->
        <div class="gt-admin-item">
          <div class="gt-admin-item-title">📖 Features Guide</div>
          <div class="gt-admin-item-desc">Detailed description of all platform features and capabilities.</div>
          <a href="/api/gad-talk/admin/features-description" class="gt-admin-item-link disabled">Coming Soon</a>
        </div>

        <!-- Chaos Engineering -->
        <div class="gt-admin-item">
          <div class="gt-admin-item-title">🧩 Chaos Engineering</div>
          <div class="gt-admin-item-desc">Simulate failures and test system resilience with chaos engineering tools.</div>
          <a href="/api/gad-talk/admin/chaos" class="gt-admin-item-link">Open Chaos Dashboard</a>
        </div>
      </div>

      <!-- Health Summary -->
      <div style="margin-top: 22px;">
        <button id="load-health-btn" class="gt-back-button">🔍 Load Health Summary</button>
        <div id="health-summary" style="margin-top: 12px; max-width: 900px;
          background: linear-gradient(180deg, rgba(22,24,28,0.92), rgba(14,15,18,0.92));
          border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; color: #e7e9ea; display: none; white-space: pre-wrap; font-family: monospace; font-size: 13px;
        "></div>
      </div>
    </div>

    <!-- Footer -->
    ${getAdminPageFooter()}

    <script src="/gad-talk/js/admin-backend-health.js" defer></script>
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

/**
 * Chaos Dashboard page - Modern compact design
 * GET /api/gad-talk/admin/chaos
 */
async function handleChaosDashboardPage(_req, res) {
  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chaos Dashboard - GadTalk</title>
    <link rel="stylesheet" href="/gad-talk/css/gad-talk.css" />
    <style>
      ${getAdminPageStyles()}
      ${getChaosDashboardStyles()}
    </style>
  </head>
  <body>
    <!-- Compact Header -->
    <header class="chaos-header">
      <div class="chaos-header-inner">
        
        <h1 class="chaos-logo">🎲 Chaos Engine Dashboard<br /><a href="/api/gad-talk/admin/backend" class="chaos-back" style="font-size: 12px;">← Back to Backend</a></h1>
        <div class="chaos-master">
          <button id="apply-chaos-config" class="chaos-btn chaos-btn-primary">✓ Apply</button>
          <button id="reset-chaos-config" class="chaos-btn chaos-btn-ghost">Reset</button>
          <span class="chaos-master-label" id="chaos-status">OFF</span>
          <button id="chaos-master-btn" class="chaos-power-btn" title="Toggle Chaos">⚡</button>
        </div>
      </div>
    </header>

    <main class="chaos-main">
      <!-- Presets Row -->
      <section class="chaos-presets-bar" id="chaos-presets"></section>

      <!-- Compact Features Grid -->
      <section class="chaos-grid">
        <!-- Random Delays -->
        <div class="chaos-card" data-feature="randomDelays">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">⏱️</span>
            <span class="chaos-card-title">Delays</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-randomDelays" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Adds random latency to requests. Tests timeout handling, loading states, and slow network resilience.
          </div>
          <div class="chaos-card-body">
            <div class="chaos-row">
              <label>Min</label>
              <input type="number" id="randomDelays-minMs" min="0" max="10000" value="100" />
              <span class="chaos-unit">ms</span>
            </div>
            <div class="chaos-row">
              <label>Max</label>
              <input type="number" id="randomDelays-maxMs" min="0" max="10000" value="3000" />
              <span class="chaos-unit">ms</span>
            </div>
            <div class="chaos-row chaos-row-range">
              <label>Chance</label>
              <input type="range" id="randomDelays-probability" min="0" max="100" value="30" />
              <span class="chaos-range-val" id="randomDelays-probability-value">30%</span>
            </div>
          </div>
        </div>

        <!-- Intermittent Failures -->
        <div class="chaos-card" data-feature="intermittentFailures">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">💥</span>
            <span class="chaos-card-title">Failures</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-intermittentFailures" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Randomly fails requests with HTTP errors. Tests error handling, retry logic, and graceful degradation.
          </div>
          <div class="chaos-card-body">
            <div class="chaos-row chaos-row-range">
              <label>Rate</label>
              <input type="range" id="intermittentFailures-probability" min="0" max="50" value="5" />
              <span class="chaos-range-val" id="intermittentFailures-probability-value">5%</span>
            </div>
            <div class="chaos-row">
              <label>Code</label>
              <select id="intermittentFailures-httpStatus">
                <option value="500">500</option>
                <option value="502">502</option>
                <option value="503" selected>503</option>
                <option value="504">504</option>
                <option value="429">429</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Rate Limit Chaos -->
        <div class="chaos-card" data-feature="rateLimitChaos">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">🚦</span>
            <span class="chaos-card-title">Rate Limit</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-rateLimitChaos" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Enforces request limits per time window. Tests throttling behavior, backoff strategies, and queue management.
          </div>
          <div class="chaos-card-body">
            <div class="chaos-row">
              <label>Endpoints</label>
              <input type="text" id="rateLimitChaos-endpoints" placeholder="/api/gad-talk/search" />
            </div>
            <div class="chaos-row">
              <label>Window</label>
              <input type="number" id="rateLimitChaos-windowMs" min="1000" max="60000" value="15000" />
              <span class="chaos-unit">ms</span>
            </div>
            <div class="chaos-row">
              <label>Limit</label>
              <input type="number" id="rateLimitChaos-limit" min="1" max="50" value="5" />
            </div>
            <div class="chaos-row">
              <label>PerUser</label>
              <input type="checkbox" id="rateLimitChaos-perUser" checked />
            </div>
            <div class="chaos-row">
              <label>Code</label>
              <select id="rateLimitChaos-httpStatus">
                <option value="429" selected>429</option>
                <option value="503">503</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Dependency Outage -->
        <div class="chaos-card" data-feature="dependencyOutage">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">🔌</span>
            <span class="chaos-card-title">Dependency</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-dependencyOutage" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Simulates upstream service failures. Tests circuit breaker patterns, fallback mechanisms, and cascading failure prevention.
          </div>
          <div class="chaos-card-body">
            <div class="chaos-row chaos-row-range">
              <label>Rate</label>
              <input type="range" id="dependencyOutage-probability" min="0" max="100" value="20" />
              <span class="chaos-range-val" id="dependencyOutage-probability-value">20%</span>
            </div>
            <div class="chaos-row">
              <label>Name</label>
              <input type="text" id="dependencyOutage-name" placeholder="timeline-service" />
            </div>
            <div class="chaos-row">
              <label>Endpoints</label>
              <input type="text" id="dependencyOutage-endpoints" placeholder="/api/gad-talk/timeline" />
            </div>
            <div class="chaos-row">
              <label>Code</label>
              <select id="dependencyOutage-httpStatus">
                <option value="502">502</option>
                <option value="503" selected>503</option>
                <option value="504">504</option>
              </select>
            </div>
            <div class="chaos-row">
              <label>Msg</label>
              <input type="text" id="dependencyOutage-message" placeholder="Upstream dependency unavailable" />
            </div>
          </div>
        </div>

        <!-- Response Corruption -->
        <div class="chaos-card" data-feature="partialResponseCorruption">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">🧪</span>
            <span class="chaos-card-title">Corruption</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-partialResponseCorruption" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Corrupts response data by dropping fields, truncating strings, or scrambling arrays. Tests data validation and error recovery.
          </div>
          <div class="chaos-card-body">
            <div class="chaos-row chaos-row-range">
              <label>Rate</label>
              <input type="range" id="partialResponseCorruption-probability" min="0" max="50" value="5" />
              <span class="chaos-range-val" id="partialResponseCorruption-probability-value">5%</span>
            </div>
            <div class="chaos-row">
              <label>Mode</label>
              <select id="partialResponseCorruption-mode">
                <option value="dropFields">dropFields</option>
                <option value="truncateStrings">truncateStrings</option>
                <option value="scrambleArray">scrambleArray</option>
              </select>
            </div>
            <div class="chaos-row">
              <label>Drop</label>
              <input type="number" id="partialResponseCorruption-maxFieldsToDrop" min="0" max="5" value="2" />
              <span class="chaos-unit">fields</span>
            </div>
            <div class="chaos-row">
              <label>Trunc</label>
              <input type="number" id="partialResponseCorruption-truncateLength" min="10" max="200" value="80" />
              <span class="chaos-unit">chars</span>
            </div>
          </div>
        </div>

        <!-- Slow Endpoints -->
        <div class="chaos-card chaos-card-wide" data-feature="slowEndpoints">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">🐢</span>
            <span class="chaos-card-title">Slow Endpoints</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-slowEndpoints" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Adds consistent delays to specific endpoints. Tests endpoint-specific performance degradation and UI responsiveness.
          </div>
          <div class="chaos-card-body chaos-card-body-row">
            <div class="chaos-row">
              <label>Delay</label>
              <input type="number" id="slowEndpoints-delayMs" min="0" max="10000" value="2000" />
              <span class="chaos-unit">ms</span>
            </div>
            <div class="chaos-endpoints" id="slowEndpoints-list">
              <label class="chaos-chip"><input type="checkbox" value="/api/gad-talk/search" /><span>/search</span></label>
              <label class="chaos-chip"><input type="checkbox" value="/api/gad-talk/gads" /><span>/gads</span></label>
              <label class="chaos-chip"><input type="checkbox" value="/api/gad-talk/users" /><span>/users</span></label>
              <label class="chaos-chip"><input type="checkbox" value="/api/gad-talk/timeline" /><span>/timeline</span></label>
              <label class="chaos-chip"><input type="checkbox" value="/api/gad-talk/notifications" /><span>/notify</span></label>
            </div>
          </div>
        </div>

        <!-- Scope -->
        <div class="chaos-card chaos-card-wide" data-feature="scope">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">🎯</span>
            <span class="chaos-card-title">Scope Filters</span>
          </div>
          <div class="chaos-card-desc">
            Defines which requests are affected by chaos. Prevents chaos on critical paths like admin/auth endpoints.
          </div>
          <div class="chaos-card-body">
            <div class="chaos-row">
              <label>Allow</label>
              <input type="text" id="scope-allowlist" placeholder="/api/gad-talk" />
            </div>
            <div class="chaos-row">
              <label>Deny</label>
              <input type="text" id="scope-denylist" placeholder="/api/gad-talk/admin" />
            </div>
            <div class="chaos-row">
              <label>Methods</label>
              <input type="text" id="scope-methods" placeholder="GET,POST,PUT" />
            </div>
          </div>
        </div>

        <!-- Targeting -->
        <div class="chaos-card chaos-card-wide" data-feature="targeting">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">👤</span>
            <span class="chaos-card-title">Targeting</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-targeting" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Target chaos to specific users/roles. Allows selective testing for individual users, roles, or test groups without affecting all users.
          </div>
          <div class="chaos-card-body">
            <div class="chaos-row">
              <label>Require</label>
              <input type="checkbox" id="targeting-requireAuth" />
              <span class="chaos-unit">auth</span>
            </div>
            <div class="chaos-row">
              <label>Anon</label>
              <input type="checkbox" id="targeting-applyToAnonymous" checked />
              <span class="chaos-unit">allow</span>
            </div>
            <div class="chaos-row">
              <label>Allow Roles</label>
              <input type="text" id="targeting-allowRoles" placeholder="member, tester" />
            </div>
            <div class="chaos-row">
              <label>Deny Roles</label>
              <input type="text" id="targeting-denyRoles" placeholder="admin" />
            </div>
            <div class="chaos-row">
              <label>Allow Users</label>
              <input type="text" id="targeting-allowUsers" placeholder="user-123" />
            </div>
            <div class="chaos-row">
              <label>Deny Users</label>
              <input type="text" id="targeting-denyUsers" placeholder="user-456" />
            </div>
          </div>
        </div>

        <!-- Flaky WebSocket -->
        <div class="chaos-card" data-feature="flakyWebSocket">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">⚡</span>
            <span class="chaos-card-title">WebSocket</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-flakyWebSocket" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Randomly disconnects WebSocket connections. Tests reconnection logic, message queuing, and real-time resilience.
          </div>
          <div class="chaos-card-body">
            <div class="chaos-row chaos-row-range">
              <label>Drop</label>
              <input type="range" id="flakyWebSocket-disconnectProbability" min="0" max="50" value="10" />
              <span class="chaos-range-val" id="flakyWebSocket-disconnectProbability-value">10%</span>
            </div>
            <div class="chaos-row">
              <label>Reconn</label>
              <input type="number" id="flakyWebSocket-reconnectDelayMs" min="0" max="30000" value="5000" />
              <span class="chaos-unit">ms</span>
            </div>
          </div>
        </div>

        <!-- Feature-Flag Chaos -->
        <div class="chaos-card" data-feature="featureFlagChaos">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">🚩</span>
            <span class="chaos-card-title">Flag Chaos</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-featureFlagChaos" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Chaos triggered by feature flag state. Tests feature rollout scenarios, flag-based degradation, and safe deployment patterns.
          </div>
          <div class="chaos-card-body">
            <div class="chaos-row">
              <label>Flag</label>
              <input type="text" id="featureFlagChaos-flagKey" placeholder="chaos_dashboard" />
            </div>
            <div class="chaos-row">
              <label>Mode</label>
              <select id="featureFlagChaos-mode">
                <option value="require-enabled">require-enabled</option>
                <option value="require-disabled">require-disabled</option>
              </select>
            </div>
            <div class="chaos-row chaos-row-range">
              <label>Rate</label>
              <input type="range" id="featureFlagChaos-probability" min="0" max="100" value="20" />
              <span class="chaos-range-val" id="featureFlagChaos-probability-value">20%</span>
            </div>
            <div class="chaos-row">
              <label>Code</label>
              <select id="featureFlagChaos-httpStatus">
                <option value="500">500</option>
                <option value="503" selected>503</option>
                <option value="504">504</option>
                <option value="429">429</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Connection Timeout Chaos -->
        <div class="chaos-card chaos-card-0-5-wide" data-feature="connectionTimeoutChaos">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">⏱️</span>
            <span class="chaos-card-title">Timeout</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-connectionTimeoutChaos" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Simulates slow/hanging connections. Tests timeout handling, request cancellation, and timeout UI feedback.
          </div>
          <div class="chaos-card-body">
            <div class="chaos-row chaos-row-range">
              <label>Rate</label>
              <input type="range" id="connectionTimeoutChaos-probability" min="0" max="50" value="10" />
              <span class="chaos-range-val" id="connectionTimeoutChaos-probability-value">10%</span>
            </div>
            <div class="chaos-row">
              <label>Timeout</label>
              <input type="number" id="connectionTimeoutChaos-timeoutMs" min="1000" max="30000" value="5000" />
              <span class="chaos-unit">ms</span>
            </div>
            <div class="chaos-row">
              <label>Endpoints</label>
              <input type="text" id="connectionTimeoutChaos-endpoints" placeholder="/api/gad-talk/search" />
            </div>
          </div>
        </div>

        <!-- Partial Response Delivery -->
        <div class="chaos-card chaos-card-0-5-wide" data-feature="partialResponseDelivery">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">📦</span>
            <span class="chaos-card-title">Partial</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-partialResponseDelivery" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Truncates responses mid-stream. Tests partial failure handling, JSON parsing errors, and connection drop recovery.
          </div>
          <div class="chaos-card-body">
            <div class="chaos-row chaos-row-range">
              <label>Rate</label>
              <input type="range" id="partialResponseDelivery-probability" min="0" max="50" value="8" />
              <span class="chaos-range-val" id="partialResponseDelivery-probability-value">8%</span>
            </div>
            <div class="chaos-row">
              <label>Endpoints</label>
              <input type="text" id="partialResponseDelivery-endpoints" placeholder="/api/gad-talk/gads" />
            </div>
            <div class="chaos-row chaos-row-range">
              <label>Truncate</label>
              <input type="range" id="partialResponseDelivery-truncateAtPercent" min="10" max="90" value="50" />
              <span class="chaos-range-val" id="partialResponseDelivery-truncateAtPercent-value">50%</span>
            </div>
          </div>
        </div>

        <!-- Data Consistency Violations -->
        <div class="chaos-card chaos-card-wide" data-feature="dataConsistencyViolations">
          <div class="chaos-card-head">
            <span class="chaos-card-icon">🔄</span>
            <span class="chaos-card-title">Data Consistency</span>
            <label class="chaos-switch">
              <input type="checkbox" id="toggle-dataConsistencyViolations" />
              <span class="chaos-switch-track"></span>
            </label>
          </div>
          <div class="chaos-card-desc">
            Returns stale, conflicting, or incomplete data. Tests data validation, conflict resolution, and consistency recovery mechanisms.
          </div>
          <div class="chaos-card-body">
            <!-- Trigger Rate -->
            <div class="chaos-section">
              <div class="chaos-section-label">⚡ Trigger Rate</div>
              <div class="chaos-row chaos-row-range">
                <label>Probability</label>
                <input type="range" id="dataConsistencyViolations-probability" min="0" max="50" value="10" />
                <span class="chaos-range-val" id="dataConsistencyViolations-probability-value">10%</span>
              </div>
            </div>

            <!-- Target Endpoints -->
            <div class="chaos-section">
              <div class="chaos-section-label">🎯 Target Endpoints</div>
              <div class="chaos-row">
                <input type="text" id="dataConsistencyViolations-endpoints" placeholder="e.g. /api/gad-talk/users, /api/gad-talk/gads" />
              </div>
            </div>

            <!-- Violation Types -->
            <div class="chaos-section">
              <div class="chaos-section-label">⚠️ Violation Types</div>
              <div class="chaos-violations-types" id="dataConsistencyViolations-types">
                <label class="chaos-chip chaos-chip-desc">
                  <input type="checkbox" value="staleData" checked />
                  <span>
                    <strong>Stale Data</strong>
                    <em>Returns cached/outdated information</em>
                  </span>
                </label>
                <label class="chaos-chip chaos-chip-desc">
                  <input type="checkbox" value="conflictingVersions" checked />
                  <span>
                    <strong>Conflicting Versions</strong>
                    <em>Multiple incompatible data versions</em>
                  </span>
                </label>
                <label class="chaos-chip chaos-chip-desc">
                  <input type="checkbox" value="missingFields" checked />
                  <span>
                    <strong>Missing Fields</strong>
                    <em>Critical fields randomly removed</em>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Action Bar -->
      <div class="chaos-actions">
        <details class="chaos-details">
          <summary>📋 JSON</summary>
          <pre class="chaos-json" id="chaos-config-json">Loading...</pre>
        </details>
      </div>
    </main>

    <script src="/gad-talk/js/chaos-dashboard.js"></script>
  </body>
  </html>`;
  res.status(HTTP_OK).send(html);
}

/**
 * Get chaos dashboard specific styles - Modern compact design
 */
function getChaosDashboardStyles() {
  return `
    /* Reset and base */
    body { background: #0a0b0d; }
    
    /* Compact Header */
    .chaos-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: linear-gradient(180deg, rgba(10,11,13,0.98) 0%, rgba(10,11,13,0.95) 100%);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding: 8px 16px;
    }
    .chaos-header-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chaos-back {
      color: #71767b;
      text-decoration: none;
      font-size: 18px;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.15s;
    }
    .chaos-back:hover { background: rgba(255,255,255,0.05); color: #e7e9ea; }
    .chaos-logo {
      font-size: 16px;
      font-weight: 700;
      color: #e7e9ea;
      margin: 0;
      flex: 1;
    }
    .chaos-master {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chaos-master-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(239,68,68,0.15);
      color: #ef4444;
      transition: all 0.2s;
    }
    .chaos-master-label.active {
      background: rgba(34,197,94,0.15);
      color: #22c55e;
    }
    .chaos-power-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #1d9bf0 0%, #0c7abf 100%);
      color: white;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chaos-power-btn:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(29,155,240,0.3); }
    .chaos-power-btn:active { transform: scale(0.98); }

    /* Main */
    .chaos-main {
      max-width: 900px;
      margin: 0 auto;
      padding: 16px;
    }

    /* Presets Bar - Horizontal compact */
    .chaos-presets-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px 0 16px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .chaos-presets-bar::-webkit-scrollbar { height: 0; }
    .chaos-preset-pill {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.15s;
      font-size: 13px;
      color: #a1a1aa;
      white-space: nowrap;
    }
    .chaos-preset-pill:hover { 
      background: rgba(255,255,255,0.06); 
      border-color: rgba(255,255,255,0.12);
      color: #e7e9ea;
    }
    .chaos-preset-pill.active {
      background: rgba(29,155,240,0.12);
      border-color: rgba(29,155,240,0.4);
      color: #1d9bf0;
    }
    .chaos-preset-pill .icon { font-size: 14px; }

    /* Features Grid */
    .chaos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }
    .chaos-card {
      background: linear-gradient(180deg, rgba(22,24,28,0.9) 0%, rgba(14,15,18,0.9) 100%);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.15s;
    }
    .chaos-card:hover { border-color: rgba(255,255,255,0.1); }
    .chaos-card-wide { grid-column: 1 / -1; }
    .chaos-card-0-5-wide { grid-column: 1 / span 2; }
    
    .chaos-card-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      background: rgba(0,0,0,0.2);
    }
    .chaos-card-icon { font-size: 16px; }
    .chaos-card-title {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: #e7e9ea;
    }

    /* Card Description */
    .chaos-card-desc {
      padding: 6px 12px;
      font-size: 11px;
      color: #71767b;
      background: rgba(29,155,240,0.05);
      border-left: 2px solid rgba(29,155,240,0.2);
      line-height: 1.4;
      font-style: italic;
    }

    /* Compact Switch */
    .chaos-switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }
    .chaos-switch input { opacity: 0; width: 0; height: 0; }
    .chaos-switch-track {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: #333;
      border-radius: 20px;
      transition: 0.2s;
    }
    .chaos-switch-track::before {
      content: "";
      position: absolute;
      width: 16px;
      height: 16px;
      left: 2px;
      bottom: 2px;
      background: white;
      border-radius: 50%;
      transition: 0.2s;
    }
    .chaos-switch input:checked + .chaos-switch-track { background: #1d9bf0; }
    .chaos-switch input:checked + .chaos-switch-track::before { transform: translateX(16px); }

    /* Card Body */
    .chaos-card-body {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chaos-card-body-row {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 12px;
    }

    /* Compact Rows */
    .chaos-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chaos-row label {
      font-size: 11px;
      color: #71767b;
      min-width: 40px;
      font-weight: 500;
    }
    .chaos-row input[type="number"],
    .chaos-row input[type="text"],
    .chaos-row select {
      flex: 1;
      min-width: 60px;
      max-width: 500px;
      padding: 5px 8px;
      background: #1a1b1e;
      border: 1px solid #333;
      border-radius: 6px;
      color: #e7e9ea;
      font-size: 12px;
    }
    .chaos-row input:focus, .chaos-row select:focus {
      outline: none;
      border-color: #1d9bf0;
    }
    .chaos-unit {
      font-size: 10px;
      color: #52525b;
      min-width: 20px;
    }
    .chaos-row-range { flex-wrap: wrap; }
    .chaos-row-range input[type="range"] {
      flex: 1;
      min-width: 80px;
      height: 4px;
      accent-color: #1d9bf0;
    }
    .chaos-range-val {
      font-size: 11px;
      font-weight: 600;
      color: #1d9bf0;
      min-width: 32px;
      text-align: right;
    }

    /* Endpoint Chips */
    .chaos-endpoints {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      flex: 1;
    }
    .chaos-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      font-size: 11px;
      color: #a1a1aa;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chaos-chip:hover { background: rgba(255,255,255,0.06); }
    .chaos-chip:has(input:checked) {
      background: rgba(29,155,240,0.12);
      border-color: rgba(29,155,240,0.3);
      color: #1d9bf0;
    }
    .chaos-chip input { display: none; }

    /* Section Headers */
    .chaos-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .chaos-section:last-child { border-bottom: none; }
    .chaos-section-label {
      font-size: 11px;
      font-weight: 600;
      color: #52525b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Violation Types Container */
    .chaos-violations-types {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 2px;
    }

    /* Enhanced Chip with Description */
    .chaos-chip-desc {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      padding: 6px 8px;
      min-width: 140px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
    }
    .chaos-chip-desc:hover {
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.1);
    }
    .chaos-chip-desc:has(input:checked) {
      background: rgba(29,155,240,0.1);
      border-color: rgba(29,155,240,0.4);
    }
    .chaos-chip-desc strong {
      font-size: 11px;
      color: #e7e9ea;
      font-weight: 600;
    }
    .chaos-chip-desc em {
      font-size: 10px;
      color: #71767b;
      font-style: italic;
      font-weight: 400;
    }
    .chaos-chip-desc:has(input:checked) strong { color: #1d9bf0; }
    .chaos-chip-desc:has(input:checked) em { color: #1d9bf0; opacity: 0.8; }

    /* Actions */
    .chaos-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 0;
    }
    .chaos-btn {
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
    }
    .chaos-btn-primary {
      background: linear-gradient(135deg, #1d9bf0 0%, #0c7abf 100%);
      color: white;
    }
    .chaos-btn-primary:hover { box-shadow: 0 4px 12px rgba(29,155,240,0.25); }
    .chaos-btn-ghost {
      background: transparent;
      color: #71767b;
      border: 1px solid #333;
    }
    .chaos-btn-ghost:hover { background: rgba(255,255,255,0.03); color: #e7e9ea; }

    /* JSON Details */
    .chaos-details {
      position: relative;
    }
    .chaos-details summary {
      font-size: 12px;
      color: #71767b;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.15s;
      list-style: none;
    }
    .chaos-details summary::-webkit-details-marker {
      display: none;
    }
    .chaos-details summary:hover { background: rgba(255,255,255,0.03); }
    .chaos-json {
      display: none;
      width: min(460px, 90vw);
      max-height: 320px;
      overflow: auto;
      background: #16181c;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 12px;
      font-size: 10px;
      color: #71767b;
      white-space: pre-wrap;
      word-break: break-word;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
      z-index: 50;
    }
    .chaos-details[open] .chaos-json {
      display: block;
    }
  `;
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
  handleGetChaosStatus,
  handleGetChaosConfig,
  handleUpdateChaosConfig,
  handleGetChaosMetrics,
  handleEnableChaos,
  handleDisableChaos,
  handleGetChaosPresets,
  handleApplyChaosPreset,
  handleChaosDashboardPage,
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
