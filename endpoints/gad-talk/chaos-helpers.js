/**
 * GadTalk Chaos Engineering Helpers
 * Implements chaos effects based on configuration
 */

const { logDebug, logTrace } = require("../../helpers/logger-api");
const gadTalkConfig = require("./gad-talk-config");

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
  };

  // If chaos mode is disabled, continue normally
  if (!chaos || !chaos.enabled) {
    return { shouldContinue: true, chaosApplied };
  }

  const url = req.url || req.originalUrl || "";
  const features = chaos.features || {};

  logTrace("Chaos: Evaluating effects for", { url });

  // ==================== INTERMITTENT FAILURES ====================
  // Check this first - if we fail, we don't need to apply delays
  if (features.intermittentFailures?.enabled) {
    const probability = features.intermittentFailures.probability || 0.05;

    if (shouldTrigger(probability)) {
      const httpStatus = features.intermittentFailures.httpStatus || 503;
      chaosApplied.failure = true;
      chaosApplied.failureStatus = httpStatus;

      logDebug("Chaos: Triggering intermittent failure", {
        url,
        httpStatus,
        probability,
      });

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

      await sleep(delayMs);
    }
  }

  // Add chaos headers to response for visibility
  if (chaosApplied.randomDelay > 0 || chaosApplied.slowEndpointDelay > 0) {
    const totalDelay = chaosApplied.randomDelay + chaosApplied.slowEndpointDelay;
    res.set("X-Chaos-Delay-Ms", String(totalDelay));
    res.set("X-Chaos-Mode", "active");
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
function shouldApplyChaos(url) {
  // Never apply chaos to admin routes - don't want to break the dashboard
  const excludedPaths = [
    "/api/gad-talk/admin",
    "/api/gad-talk/auth", // Don't break authentication
  ];

  return !excludedPaths.some((path) => url.startsWith(path));
}

module.exports = {
  applyChaosEffects,
  getChaosStatus,
  shouldApplyChaos,
  sleep,
  shouldTrigger,
  getRandomDelay,
};
