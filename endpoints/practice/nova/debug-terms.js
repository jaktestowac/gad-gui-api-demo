/**
 * Debug utility for Nova's term learning system
 *
 * This utility provides functions to help diagnose issues with Nova's term learning
 * and retrieval capabilities.
 */

const { userMemory } = require("./user-memory");
const { logDebug } = require("../../../helpers/logger-api");

/**
 * Dump all learned terms for a user to the console
 * @param {string} userId - The user ID to check
 * @returns {object} - Statistics about terms the user has taught Nova
 */
function dumpLearnedTerms(userId) {
  if (!userId || !userMemory[userId]) {
    logDebug(`[Nova] DEBUG: No memory found for user ${userId}`);
    return {
      found: false,
      userId: userId,
    };
  }

  if (!userMemory[userId].learnedTerms) {
    logDebug(`[Nova] DEBUG: No learned terms object found for user ${userId}`);
    return {
      found: false,
      userId: userId,
      memoryExists: true,
      hasLearnedTerms: false,
    };
  }

  const terms = userMemory[userId].learnedTerms;
  const termNames = Object.keys(terms);

  if (termNames.length === 0) {
    logDebug(`[Nova] DEBUG: User ${userId} has not taught Nova any terms yet`);
    return {
      found: true,
      userId: userId,
      count: 0,
      terms: [],
    };
  }

  // Log all terms and their definitions
  logDebug(`[Nova] DEBUG: Found ${termNames.length} learned terms for user ${userId}`, {
    terms: termNames,
  });

  const termDetails = termNames.map((term) => {
    const info = terms[term];
    return {
      term,
      definition: info.definition,
      learnedAt: info.learnedAt,
      usageCount: info.usageCount || 0,
      lastUsed: info.lastUsed || null,
    };
  });

  logDebug(`[Nova] DEBUG: Term details for user ${userId}`, { termDetails });

  return {
    found: true,
    userId: userId,
    count: termNames.length,
    terms: termDetails,
  };
}

/**
 * Check if a user has a specific term stored
 * @param {string} userId - The user ID to check
 * @param {string} term - The term to look for
 * @returns {object} - Information about the term if found
 */
function checkSpecificTerm(userId, term) {
  if (!userId || !userMemory[userId]) {
    logDebug(`[Nova] DEBUG: No memory found for user ${userId}`);
    return {
      found: false,
      userId: userId,
      term: term,
    };
  }

  if (!userMemory[userId].learnedTerms) {
    logDebug(`[Nova] DEBUG: No learned terms object found for user ${userId}`);
    return {
      found: false,
      userId: userId,
      term: term,
      memoryExists: true,
      hasLearnedTerms: false,
    };
  }

  const normalizedTerm = term.toLowerCase().trim();
  const termInfo = userMemory[userId].learnedTerms[normalizedTerm];

  if (!termInfo) {
    logDebug(`[Nova] DEBUG: Term "${normalizedTerm}" not found for user ${userId}`, {
      availableTerms: Object.keys(userMemory[userId].learnedTerms),
    });
    return {
      found: false,
      userId: userId,
      term: normalizedTerm,
      memoryExists: true,
      hasLearnedTerms: true,
      availableTerms: Object.keys(userMemory[userId].learnedTerms),
    };
  }

  logDebug(`[Nova] DEBUG: Found term "${normalizedTerm}" for user ${userId}`, {
    definition: termInfo.definition,
    learnedAt: termInfo.learnedAt,
    usageCount: termInfo.usageCount || 0,
    lastUsed: termInfo.lastUsed || null,
  });

  return {
    found: true,
    userId: userId,
    term: normalizedTerm,
    definition: termInfo.definition,
    learnedAt: termInfo.learnedAt,
    usageCount: termInfo.usageCount || 0,
    lastUsed: termInfo.lastUsed || null,
  };
}

/**
 * Force-add a term to a user's memory (for testing)
 * @param {string} userId - The user ID to add for
 * @param {string} term - The term to add
 * @param {string} definition - The definition of the term
 * @returns {boolean} - Whether the operation was successful
 */
function forceAddTerm(userId, term, definition) {
  if (!userId || !term || !definition) {
    logDebug(`[Nova] DEBUG: Missing parameters for force-adding term`, {
      userId,
      term,
      definition,
    });
    return false;
  }

  if (!userMemory[userId]) {
    userMemory[userId] = {
      learnedTerms: {},
    };
    logDebug(`[Nova] DEBUG: Created memory for user ${userId}`);
  }

  if (!userMemory[userId].learnedTerms) {
    userMemory[userId].learnedTerms = {};
    logDebug(`[Nova] DEBUG: Created learnedTerms object for user ${userId}`);
  }

  const normalizedTerm = term.toLowerCase().trim();

  // Add the term
  userMemory[userId].learnedTerms[normalizedTerm] = {
    definition: definition,
    learnedAt: new Date().toISOString(),
    usageCount: 0,
  };

  logDebug(`[Nova] DEBUG: Force-added term "${normalizedTerm}" for user ${userId}`, {
    definition,
    allTerms: Object.keys(userMemory[userId].learnedTerms),
  });

  return true;
}

/**
 * Force remove a term from a user's memory (for testing)
 * @param {string} userId - The user ID
 * @param {string} term - The term to remove
 * @returns {boolean} - Whether the operation was successful
 */
function forceRemoveTerm(userId, term) {
  if (!userId || !term) {
    logDebug(`[Nova] DEBUG: Missing parameters for force-removing term`, {
      userId,
      term,
    });
    return false;
  }

  if (!userMemory[userId] || !userMemory[userId].learnedTerms) {
    logDebug(`[Nova] DEBUG: No memory or learnedTerms found for user ${userId}`);
    return false;
  }

  const normalizedTerm = term.toLowerCase().trim();

  if (!userMemory[userId].learnedTerms[normalizedTerm]) {
    logDebug(`[Nova] DEBUG: Term "${normalizedTerm}" not found for user ${userId}`);
    return false;
  }

  // Remove the term
  delete userMemory[userId].learnedTerms[normalizedTerm];

  logDebug(`[Nova] DEBUG: Force-removed term "${normalizedTerm}" for user ${userId}`, {
    remainingTerms: Object.keys(userMemory[userId].learnedTerms),
    totalTermsLeft: Object.keys(userMemory[userId].learnedTerms).length,
  });

  return true;
}

// Export debugging functions
module.exports = {
  dumpLearnedTerms,
  checkSpecificTerm,
  forceAddTerm,
  forceRemoveTerm,
};
