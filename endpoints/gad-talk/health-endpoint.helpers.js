const { logError } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");
const { HTTP_OK, HTTP_SERVICE_UNAVAILABLE } = require("../../helpers/response.helpers");
const { getGadTalkDbStatus, getFeatureFlags } = require("./db-gad-talk.operations");
const gadTalkConfig = require("./gad-talk-config");

/**
 * Counts the number of enabled chaos features
 * @param {Object} chaos - Chaos configuration object
 * @returns {number} Number of active chaos features
 */
function countActiveChaosFeaturesCount(chaos) {
  if (!chaos?.features) return 0;

  return [
    "randomDelays",
    "intermittentFailures",
    "rateLimitChaos",
    "dependencyOutage",
    "partialResponseCorruption",
    "slowEndpoints",
    "flakyWebSocket",
    "featureFlagChaos",
  ].filter((feature) => chaos.features[feature]?.enabled).length;
}

/**
 * Gets system resource metrics
 * @returns {Object} System metrics including memory and CPU usage
 */
function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    memory: {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      externalMB: Math.round(memUsage.external / 1024 / 1024),
      rssMemoryMB: Math.round(memUsage.rss / 1024 / 1024),
    },
    cpu: {
      userMs: cpuUsage.user,
      systemMs: cpuUsage.system,
    },
  };
}

/**
 * Public health endpoint
 * GET /api/gad-talk/health
 * Returns important info about the GadTalk module (db status, chaos, features, metrics, module version, uptime)
 */
async function handleGetHealth(_req, res) {
  try {
    const dbStatus = getGadTalkDbStatus();
    const featureFlags = getFeatureFlags();
    const chaos = gadTalkConfig.chaos || {};
    const isActive = chaos?.enabled ?? false;

    const timestamp = new Date().toISOString();
    const uptimeSeconds = Math.floor(process.uptime());
    const systemMetrics = getSystemMetrics();

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        module: {
          name: gadTalkConfig.moduleName,
          version: gadTalkConfig.moduleVersion,
        },
        environment: {
          nodeVersion: process.version,
          nodeEnv: process.env.NODE_ENV || "development",
        },
        initialized: !!dbStatus,
        uptimeSeconds,
        timestamp,
        dbStatus,
        chaos: {
          enabled: isActive,
          activeFeatureCount: isActive ? countActiveChaosFeaturesCount(chaos) : 0,
        },
        featureFlags,
        metrics: {
          database: dbStatus?.collections || {},
          timestamp,
          uptimeSeconds,
          system: systemMetrics,
        },
      },
    });
  } catch (error) {
    logError("[GadTalk] health endpoint error:", error);
    res.status(HTTP_SERVICE_UNAVAILABLE).send(formatErrorResponse(error.message || "GadTalk health check failed"));
  }
}

module.exports = {
  handleGetHealth,
};
