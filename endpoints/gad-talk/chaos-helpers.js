/**
 * GadTalk Chaos Engineering Helpers
 * Implements chaos effects based on configuration
 */

const { logDebug, logTrace, logError } = require("../../helpers/logger-api");
const gadTalkConfig = require("./gad-talk-config");
const { createGadTalkAuditLog, isFeatureEnabled } = require("./db-gad-talk.operations");

// ==================== CHAOS METRICS ====================

const chaosMetrics = {
  totals: {
    requestsEvaluated: 0,
    failuresInjected: 0,
    delaysInjected: 0,
    corruptionsInjected: 0,
  },
  byEndpoint: {},
  lastUpdatedAt: null,
};

function recordChaosMetric(url, type) {
  const key = url || "unknown";
  chaosMetrics.totals.requestsEvaluated += type === "evaluated" ? 1 : 0;
  if (type === "failure") chaosMetrics.totals.failuresInjected += 1;
  if (type === "delay") chaosMetrics.totals.delaysInjected += 1;
  if (type === "corruption") chaosMetrics.totals.corruptionsInjected += 1;

  if (!chaosMetrics.byEndpoint[key]) {
    chaosMetrics.byEndpoint[key] = {
      failuresInjected: 0,
      delaysInjected: 0,
      corruptionsInjected: 0,
    };
  }

  if (type === "failure") chaosMetrics.byEndpoint[key].failuresInjected += 1;
  if (type === "delay") chaosMetrics.byEndpoint[key].delaysInjected += 1;
  if (type === "corruption") chaosMetrics.byEndpoint[key].corruptionsInjected += 1;

  chaosMetrics.lastUpdatedAt = new Date().toISOString();
}

function getChaosMetrics() {
  return {
    ...chaosMetrics,
    totals: { ...chaosMetrics.totals },
    byEndpoint: { ...chaosMetrics.byEndpoint },
  };
}

// ==================== CHAOS HELPERS ====================

/**
 * Generate a random delay within the configured range
 * @param {object} config - Random delays configuration
 * @returns {number} Delay in milliseconds
 */
function getRandomDelay(config) {
  const min = config.minMs || 100;
  const max = config.maxMs || 3000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an event should occur based on probability
 * @param {number} probability - Probability between 0 and 1
 * @returns {boolean}
 */
function shouldTrigger(probability) {
  return Math.random() < probability;
}

/**
 * Check if the current URL matches any slow endpoint patterns
 * @param {string} url - Request URL
 * @param {string[]} endpoints - Array of endpoint patterns
 * @returns {boolean}
 */
function matchesSlowEndpoint(url, endpoints) {
  if (!endpoints || !Array.isArray(endpoints)) return false;

  return endpoints.some((endpoint) => {
    // Simple prefix matching
    return url.startsWith(endpoint) || url.includes(endpoint);
  });
}

function matchesScopePattern(url, patterns) {
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) return false;
  return patterns.some((pattern) => url.startsWith(pattern) || url.includes(pattern));
}

function isMethodAllowed(method, methods) {
  if (!methods || !Array.isArray(methods) || methods.length === 0) return true;
  return methods.includes(String(method || "").toUpperCase());
}

function shouldApplyScope(url, method, scope) {
  if (!scope) return true;

  if (!isMethodAllowed(method, scope.methods)) {
    return false;
  }

  if (Array.isArray(scope.allowlist) && scope.allowlist.length > 0) {
    if (!matchesScopePattern(url, scope.allowlist)) {
      return false;
    }
  }

  if (Array.isArray(scope.denylist) && scope.denylist.length > 0) {
    if (matchesScopePattern(url, scope.denylist)) {
      return false;
    }
  }

  return true;
}

function truncateStrings(value, maxLength, depth = 0) {
  if (depth > 4) return value;
  if (typeof value === "string") {
    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => truncateStrings(item, maxLength, depth + 1));
  }
  if (value && typeof value === "object") {
    const result = {};
    Object.entries(value).forEach(([key, val]) => {
      result[key] = truncateStrings(val, maxLength, depth + 1);
    });
    return result;
  }
  return value;
}

function dropRandomFields(value, maxFieldsToDrop) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const keys = Object.keys(value).filter((key) => !["ok", "error"].includes(key));
  if (keys.length === 0) return value;
  const dropCount = Math.min(maxFieldsToDrop, keys.length);
  const keysToDrop = new Set();
  while (keysToDrop.size < dropCount) {
    const idx = Math.floor(Math.random() * keys.length);
    keysToDrop.add(keys[idx]);
  }
  const result = { ...value };
  keysToDrop.forEach((key) => {
    delete result[key];
  });
  return result;
}

function scrambleArray(value) {
  if (!Array.isArray(value) || value.length < 2) return value;
  const copy = [...value];
  const idxA = Math.floor(Math.random() * copy.length);
  let idxB = Math.floor(Math.random() * copy.length);
  if (idxA === idxB) idxB = (idxB + 1) % copy.length;
  const temp = copy[idxA];
  copy[idxA] = copy[idxB];
  copy[idxB] = temp;
  return copy;
}

function applyResponseCorruption(payload, config) {
  const mode = config.mode || "dropFields";
  if (mode === "truncateStrings") {
    return truncateStrings(payload, config.truncateLength || 80);
  }
  if (mode === "scrambleArray") {
    return Array.isArray(payload) ? scrambleArray(payload) : payload;
  }
  return dropRandomFields(payload, config.maxFieldsToDrop || 2);
}

function wrapResponseForCorruption(res, config, chaosApplied, url) {
  if (res.__chaosCorruptionWrapped) return;
  res.__chaosCorruptionWrapped = true;

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (!chaosApplied.corruptResponse) {
      return originalJson(payload);
    }

    if (!payload || payload.error) {
      return originalJson(payload);
    }

    try {
      const corrupted = applyResponseCorruption(payload, config);
      res.set("X-Chaos-Corruption", config.mode || "dropFields");
      recordChaosMetric(url, "corruption");
      return originalJson(corrupted);
    } catch (error) {
      logError("Chaos: Failed to corrupt response", { error: error.message });
      return originalJson(payload);
    }
  };
}

/**
 * Apply chaos effects before processing a request
 * This is the main chaos middleware function
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @returns {Promise<{ shouldContinue: boolean, chaosApplied: object }>}
 */
async function applyChaosEffects(req, res) {
  const chaos = gadTalkConfig.chaos;
  const chaosApplied = {
    randomDelay: 0,
    slowEndpointDelay: 0,
    failure: false,
    failureStatus: null,
    corruptResponse: false,
    failureReason: null,
  };

  // If chaos mode is disabled, continue normally
  if (!chaos || !chaos.enabled) {
    return { shouldContinue: true, chaosApplied };
  }

  const url = req.url || req.originalUrl || "";
  const features = chaos.features || {};

  logTrace("Chaos: Evaluating effects for", { url });
  recordChaosMetric(url, "evaluated");

  // ==================== FEATURE-FLAG CHAOS ====================
  if (features.featureFlagChaos?.enabled) {
    const flagKey = features.featureFlagChaos.flagKey || "chaos_dashboard";
    const mode = features.featureFlagChaos.mode || "require-enabled";
    const probability = features.featureFlagChaos.probability ?? 0.2;
    const isEnabled = isFeatureEnabled(flagKey);
    const shouldTriggerByFlag = mode === "require-disabled" ? !isEnabled : isEnabled;

    if (shouldTriggerByFlag && shouldTrigger(probability)) {
      const httpStatus = features.featureFlagChaos.httpStatus || 503;
      chaosApplied.failure = true;
      chaosApplied.failureStatus = httpStatus;
      chaosApplied.failureReason = "featureFlagChaos";

      logDebug("Chaos: Triggering feature-flag failure", {
        url,
        httpStatus,
        probability,
        flagKey,
        flagEnabled: isEnabled,
      });

      recordChaosMetric(url, "failure");

      try {
        await createGadTalkAuditLog({
          actorUserId: req.gadTalkUserId || "anonymous",
          eventType: "chaos-effect",
          payloadObject: {
            type: "featureFlagChaos",
            url,
            httpStatus,
            flagKey,
            flagEnabled: isEnabled,
          },
        });
      } catch (error) {
        logError("Chaos: Failed to write audit log", { error: error.message });
      }

      res.status(httpStatus).json({
        ok: false,
        error: {
          message: `Feature flag chaos (${flagKey})`,
          code: "CHAOS_FEATURE_FLAG",
          chaosMode: true,
        },
      });

      return { shouldContinue: false, chaosApplied };
    }
  }

  // ==================== INTERMITTENT FAILURES ====================
  // Check this first - if we fail, we don't need to apply delays
  if (features.intermittentFailures?.enabled) {
    const probability = features.intermittentFailures.probability || 0.05;

    if (shouldTrigger(probability)) {
      const httpStatus = features.intermittentFailures.httpStatus || 503;
      chaosApplied.failure = true;
      chaosApplied.failureStatus = httpStatus;
      chaosApplied.failureReason = "intermittentFailures";

      logDebug("Chaos: Triggering intermittent failure", {
        url,
        httpStatus,
        probability,
      });

      recordChaosMetric(url, "failure");

      try {
        await createGadTalkAuditLog({
          actorUserId: req.gadTalkUserId || "anonymous",
          eventType: "chaos-effect",
          payloadObject: {
            type: "intermittentFailures",
            url,
            httpStatus,
            probability,
          },
        });
      } catch (error) {
        logError("Chaos: Failed to write audit log", { error: error.message });
      }

      // Send error response
      const errorMessages = {
        500: "Internal Server Error (Chaos Mode)",
        502: "Bad Gateway (Chaos Mode)",
        503: "Service Temporarily Unavailable (Chaos Mode)",
        504: "Gateway Timeout (Chaos Mode)",
        429: "Too Many Requests (Chaos Mode)",
      };

      res.status(httpStatus).json({
        ok: false,
        error: {
          message: errorMessages[httpStatus] || `Error ${httpStatus} (Chaos Mode)`,
          code: "CHAOS_FAILURE",
          chaosMode: true,
        },
      });

      return { shouldContinue: false, chaosApplied };
    }
  }

  // ==================== PARTIAL RESPONSE CORRUPTION ====================
  if (features.partialResponseCorruption?.enabled) {
    const probability = features.partialResponseCorruption.probability ?? 0.05;
    if (shouldTrigger(probability)) {
      chaosApplied.corruptResponse = true;
      wrapResponseForCorruption(res, features.partialResponseCorruption, chaosApplied, url);

      logDebug("Chaos: Response corruption armed", {
        url,
        mode: features.partialResponseCorruption.mode,
        probability,
      });

      try {
        await createGadTalkAuditLog({
          actorUserId: req.gadTalkUserId || "anonymous",
          eventType: "chaos-effect",
          payloadObject: {
            type: "partialResponseCorruption",
            url,
            mode: features.partialResponseCorruption.mode,
            probability,
          },
        });
      } catch (error) {
        logError("Chaos: Failed to write audit log", { error: error.message });
      }
    }
  }

  // ==================== SLOW ENDPOINTS ====================
  // Apply specific delays to configured endpoints
  if (features.slowEndpoints?.enabled) {
    const endpoints = features.slowEndpoints.endpoints || [];
    const delayMs = features.slowEndpoints.delayMs || 2000;

    if (matchesSlowEndpoint(url, endpoints)) {
      chaosApplied.slowEndpointDelay = delayMs;

      logDebug("Chaos: Applying slow endpoint delay", {
        url,
        delayMs,
      });

      recordChaosMetric(url, "delay");

      await sleep(delayMs);
    }
  }

  // ==================== RANDOM DELAYS ====================
  // Apply random delays based on probability
  if (features.randomDelays?.enabled) {
    const probability = features.randomDelays.probability || 0.3;

    if (shouldTrigger(probability)) {
      const delayMs = getRandomDelay(features.randomDelays);
      chaosApplied.randomDelay = delayMs;

      logDebug("Chaos: Applying random delay", {
        url,
        delayMs,
        probability,
      });

      recordChaosMetric(url, "delay");

      await sleep(delayMs);
    }
  }

  // Add chaos headers to response for visibility
  if (chaosApplied.randomDelay > 0 || chaosApplied.slowEndpointDelay > 0) {
    const totalDelay = chaosApplied.randomDelay + chaosApplied.slowEndpointDelay;
    res.set("X-Chaos-Delay-Ms", String(totalDelay));
    res.set("X-Chaos-Mode", "active");

    try {
      await createGadTalkAuditLog({
        actorUserId: req.gadTalkUserId || "anonymous",
        eventType: "chaos-effect",
        payloadObject: {
          type: "delay",
          url,
          randomDelay: chaosApplied.randomDelay,
          slowEndpointDelay: chaosApplied.slowEndpointDelay,
          totalDelay,
        },
      });
    } catch (error) {
      logError("Chaos: Failed to write audit log", { error: error.message });
    }
  }

  return { shouldContinue: true, chaosApplied };
}

/**
 * Get chaos statistics for monitoring
 * @returns {object} Current chaos configuration summary
 */
function getChaosStatus() {
  const chaos = gadTalkConfig.chaos;

  if (!chaos || !chaos.enabled) {
    return {
      enabled: false,
      activeFeatures: [],
    };
  }

  const activeFeatures = [];
  const features = chaos.features || {};

  if (features.randomDelays?.enabled) {
    activeFeatures.push({
      name: "randomDelays",
      config: {
        minMs: features.randomDelays.minMs,
        maxMs: features.randomDelays.maxMs,
        probability: features.randomDelays.probability,
      },
    });
  }

  if (features.intermittentFailures?.enabled) {
    activeFeatures.push({
      name: "intermittentFailures",
      config: {
        probability: features.intermittentFailures.probability,
        httpStatus: features.intermittentFailures.httpStatus,
      },
    });
  }

  if (features.slowEndpoints?.enabled) {
    activeFeatures.push({
      name: "slowEndpoints",
      config: {
        endpoints: features.slowEndpoints.endpoints,
        delayMs: features.slowEndpoints.delayMs,
      },
    });
  }

  if (features.flakyWebSocket?.enabled) {
    activeFeatures.push({
      name: "flakyWebSocket",
      config: {
        disconnectProbability: features.flakyWebSocket.disconnectProbability,
        reconnectDelayMs: features.flakyWebSocket.reconnectDelayMs,
      },
    });
  }

  if (features.partialResponseCorruption?.enabled) {
    activeFeatures.push({
      name: "partialResponseCorruption",
      config: {
        probability: features.partialResponseCorruption.probability,
        mode: features.partialResponseCorruption.mode,
        maxFieldsToDrop: features.partialResponseCorruption.maxFieldsToDrop,
        truncateLength: features.partialResponseCorruption.truncateLength,
      },
    });
  }

  if (features.featureFlagChaos?.enabled) {
    activeFeatures.push({
      name: "featureFlagChaos",
      config: {
        flagKey: features.featureFlagChaos.flagKey,
        mode: features.featureFlagChaos.mode,
        probability: features.featureFlagChaos.probability,
        httpStatus: features.featureFlagChaos.httpStatus,
      },
    });
  }

  return {
    enabled: true,
    activeFeatures,
  };
}

/**
 * Check if chaos mode should be applied to a request
 * Excludes admin routes to prevent locking yourself out
 * @param {string} url - Request URL
 * @returns {boolean}
 */
function shouldApplyChaos(req) {
  const chaos = gadTalkConfig.chaos;
  const url = req?.url || req?.originalUrl || "";
  const method = req?.method || "";

  if (!chaos || !chaos.enabled) return false;

  const scope = chaos.scope || {
    allowlist: ["/api/gad-talk"],
    denylist: ["/api/gad-talk/admin", "/api/gad-talk/auth"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  };

  return shouldApplyScope(url, method, scope);
}

module.exports = {
  applyChaosEffects,
  getChaosStatus,
  getChaosMetrics,
  shouldApplyChaos,
  sleep,
  shouldTrigger,
  getRandomDelay,
};
