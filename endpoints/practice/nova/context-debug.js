/**
 * Context Debug Tools - Utilities for debugging conversation context issues
 *
 * This module provides tools to help diagnose problems with conversation context
 * preservation, especially for complex scenarios like term learning.
 */

const { logDebug } = require("../../../helpers/logger-api");
const { userMemory } = require("./user-memory");

/**
 * Generate a snapshot of the current conversation context
 * @param {Object} context - MessageContext object
 * @param {string} message - Current user message
 * @returns {Object} - Object containing debug information
 */
function contextSnapshot(context, message) {
  // Extract key fields for debugging
  const snapshot = {
    userId: context.userId,
    conversationId: context.conversationId,
    message: message,
    timestamp: new Date().toISOString(),
    termContext: {
      unknownTerm: context.unknownTerm,
      previousUnknownTerm: context.previousUnknownTerm,
      isDefiningUnknownTerm: context.isDefiningUnknownTerm,
      knownTerm: context.knownTerm,
    },
    memoryState: {},
  };

  // Add memory state if available
  if (context.userId && userMemory[context.userId]) {
    const userMem = userMemory[context.userId];

    // Check for learned terms
    if (userMem.learnedTerms) {
      snapshot.memoryState.learnedTermsCount = Object.keys(userMem.learnedTerms).length;
      snapshot.memoryState.learnedTermsList = Object.keys(userMem.learnedTerms);
    }
  }

  // Log the snapshot
  logDebug(`[Nova] ContextDebug:snapshot`, snapshot);

  return snapshot;
}

/**
 * Logs a context event with detailed information
 * @param {string} eventType - Type of event (e.g., "term-detection", "term-learning")
 * @param {Object} context - MessageContext object
 * @param {Object} details - Additional event details
 */
function logContextEvent(eventType, context, details) {
  const event = {
    eventType,
    timestamp: new Date().toISOString(),
    userId: context.userId,
    conversationId: context.conversationId,
    details,
  };

  logDebug(`[Nova] ContextDebug:event:${eventType}`, event);
}

/**
 * Diagnose problems with known terms not being properly recognized
 * @param {string} userId - User ID to check
 * @param {string} term - Term to check
 * @returns {Object} - Diagnostic information
 */
function diagnoseTermRecognition(userId, term) {
  if (!userId || !term) {
    return { error: "Missing userId or term" };
  }

  const normalizedTerm = term.toLowerCase().trim();
  const diagnostics = {
    userId,
    term: normalizedTerm,
    timestamp: new Date().toISOString(),
    memoryExists: false,
    learnedTermsExists: false,
    termExists: false,
    definition: null,
    usageMetrics: null,
  };

  // Check if user memory exists
  if (!userMemory[userId]) {
    logDebug(`[Nova] ContextDebug:diagnoseTermRecognition:NoUserMemory`, { userId, term: normalizedTerm });
    return diagnostics;
  }

  diagnostics.memoryExists = true;

  // Check if learnedTerms exists
  if (!userMemory[userId].learnedTerms) {
    logDebug(`[Nova] ContextDebug:diagnoseTermRecognition:NoLearnedTerms`, { userId, term: normalizedTerm });
    return diagnostics;
  }

  diagnostics.learnedTermsExists = true;
  diagnostics.allTerms = Object.keys(userMemory[userId].learnedTerms);

  // Check if term exists
  if (!userMemory[userId].learnedTerms[normalizedTerm]) {
    logDebug(`[Nova] ContextDebug:diagnoseTermRecognition:TermNotFound`, {
      userId,
      term: normalizedTerm,
      availableTerms: diagnostics.allTerms,
    });
    return diagnostics;
  }

  diagnostics.termExists = true;
  const termInfo = userMemory[userId].learnedTerms[normalizedTerm];
  diagnostics.definition = termInfo.definition;
  diagnostics.usageMetrics = {
    learnedAt: termInfo.learnedAt,
    usageCount: termInfo.usageCount || 0,
    lastUsed: termInfo.lastUsed,
  };

  logDebug(`[Nova] ContextDebug:diagnoseTermRecognition:Success`, diagnostics);
  return diagnostics;
}

// Export debugging functions
module.exports = {
  contextSnapshot,
  logContextEvent,
  diagnoseTermRecognition,
};
