/**
 * Debug Term Learning - Debug utility for the term learning system
 *
 * This is a debugging utility that helps diagnose and fix issues with the term learning
 * system in Nova. It forces the priority of the curiosity behavior to ensure term
 * definitions are properly processed.
 */

const { logDebug } = require("../../../helpers/logger-api");

/**
 * Higher-priority debugging wrapper for term definition handling
 * This can be imported by behavior-registry.js to ensure term learning works properly
 *
 * @param {string} message - The user message
 * @param {object} context - The message context
 * @param {object} behaviors - All available behaviors
 * @returns {string|null} - A response if this handler processed the message, otherwise null
 */
function prioritizeTermDefinition(message, context, behaviors) {
  const userId = context.userId || context.conversationId?.split("_")[0];
  // First check if this is a question about a term in Nova's memory
  if (
    userId &&
    (message.toLowerCase().includes("what is") ||
      message.toLowerCase().includes("what's") ||
      message.toLowerCase().includes("do you know") ||
      message.toLowerCase().includes("tell me about"))
  ) {
    // Try to extract the term from different question patterns - support more variations
    const whatIsMatch = message.match(/what(?:'?s|\s*is)(?: a| an| the)? ([a-zA-Z0-9_-]+)(?:\??|$)/i);
    const doYouKnowMatch = message.match(/do you know(?: what| about)? ([a-zA-Z0-9_-]+)(?:\??|$)/i);
    const tellMeMatch = message.match(/tell me about(?: the)? ([a-zA-Z0-9_-]+)(?:\??|$)/i); // Try to extract multi-word terms in quotes
    const quotedTermMatch =
      message.match(/what(?:'?s|\s*is)(?: a| an| the)? "([^"]+)"(?:\??|$)/i) ||
      message.match(/do you know(?: what| about)? "([^"]+)"(?:\??|$)/i) ||
      message.match(/tell me about(?: the)? "([^"]+)"(?:\??|$)/i); // Try to extract multi-word terms without quotes (end of sentence)
    const endOfSentenceMatch =
      message.match(/what(?:'?s|\s*is)(?: a| an| the)? (.+?)(?:\?|$)/i) ||
      message.match(/do you know(?: what| about)? (.+?)(?:\?|$)/i) ||
      message.match(/tell me about(?: the)? (.+?)(?:\?|$)/i);

    // Find the first matching term from any of the patterns
    let termToCheck = null;
    if (quotedTermMatch) termToCheck = quotedTermMatch[1].toLowerCase().trim();
    else if (whatIsMatch) termToCheck = whatIsMatch[1].toLowerCase().trim();
    else if (doYouKnowMatch) termToCheck = doYouKnowMatch[1].toLowerCase().trim();
    else if (tellMeMatch) termToCheck = tellMeMatch[1].toLowerCase().trim();
    else if (endOfSentenceMatch) {
      termToCheck = endOfSentenceMatch[1].toLowerCase().trim();
      // For multi-word matches without quotes, we need to be careful about extra words
      // Remove common filler words at the end if they exist
      termToCheck = termToCheck.replace(/\s+(is|means|refers to|definition).*$/, "");
    }

    if (termToCheck) {
      // Import function to check if Nova knows this term
      const { knowsTerm } = require("./user-memory");

      // Check if Nova has learned this term
      if (knowsTerm(termToCheck, userId)) {
        logDebug("[Nova] DEBUG_TERM_LEARNING: Found known term in memory", {
          term: termToCheck,
          userId: userId,
          message: message,
        });

        // Set context so the curiosity behavior knows to return the definition
        context.knownTerm = termToCheck;

        // Force curiosity behavior to handle this
        const curiosityBehavior = behaviors.find((b) => b.id === "curiosity");
        if (curiosityBehavior) {
          logDebug("[Nova] DEBUG_TERM_LEARNING: Forcing curiosity behavior for known term", {
            behaviorId: curiosityBehavior.id,
            termName: termToCheck,
          });

          // Set context to indicate this was handled by curiosity behavior
          context.handledBy = "curiosity";

          // Let the curiosity behavior handle the learned term
          const response = curiosityBehavior.handle(message, context);

          // Return the response
          return response;
        }
      }
    }
  }

  // Check if this is a term definition scenario
  if (context.isDefiningUnknownTerm && context.previousUnknownTerm) {
    logDebug("[Nova] DEBUG_TERM_LEARNING: Detected term definition scenario", {
      previousUnknownTerm: context.previousUnknownTerm,
      message: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
      isDefiningUnknownTerm: context.isDefiningUnknownTerm,
      timeSinceLastMessage: context.conversationAnalytics?.timeSinceLastMessage || "unknown",
    });

    // Force curiosity behavior to handle this
    const curiosityBehavior = behaviors.find((b) => b.id === "curiosity");
    if (curiosityBehavior) {
      logDebug("[Nova] DEBUG_TERM_LEARNING: Forcing curiosity behavior", {
        behaviorId: curiosityBehavior.id,
        termName: context.previousUnknownTerm,
      });

      // Set context to indicate this was handled by curiosity behavior
      context.handledBy = "curiosity";

      // Let the curiosity behavior handle the definition
      const response = curiosityBehavior.handle(message, context);

      // Return the response
      return response;
    } else {
      logDebug("[Nova] DEBUG_TERM_LEARNING: Curiosity behavior not found!");
    }
  }

  // No term definition scenario detected, let normal processing continue
  return null;
}

/**
 * Test if the term learning system is working
 * @param {string} userId - The user ID to test with
 * @returns {object} - Diagnostic information
 */
function testTermLearning(userId) {
  const { learnNewTerm, knowsTerm, getLearnedTermDefinition } = require("../user-memory");

  const testTerm = "testterm" + Date.now().toString().slice(-4);
  const testDefinition = "This is a test definition created at " + new Date().toISOString();

  logDebug("[Nova] DEBUG_TERM_LEARNING: Running test for user", { userId, testTerm });

  // Try to learn the term
  const learnResult = learnNewTerm(testTerm, testDefinition, userId);

  // Check if the term was learned
  const knownResult = knowsTerm(testTerm, userId);

  // Try to retrieve the definition
  const definition = getLearnedTermDefinition(testTerm, userId);

  return {
    success: learnResult && knownResult && definition === testDefinition,
    learnResult,
    knownResult,
    retrievedDefinition: definition,
    expectedDefinition: testDefinition,
    testTerm,
  };
}

module.exports = {
  prioritizeTermDefinition,
  testTermLearning,
};
