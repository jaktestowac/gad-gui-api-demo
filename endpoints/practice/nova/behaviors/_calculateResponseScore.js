/**
 * Calculate a score for a response based on relevance to the message
 * @private
 * @param {string} message - User message
 * @param {string} behaviorId - ID of the behavior
 * @param {object} context - Message context
 * @returns {number} - Score indicating how well this behavior matches the message
 */ 
_calculateResponseScore(message, behaviorId, context) {
  const lowerMessage = message.toLowerCase();
  let score = 0;

  // Extract userId from context for use in diagnostics
  const userId = context.userId || context.conversationId?.split("_")[0];

  // Base score from behavior priority
  const behavior = this.behaviors.find((b) => b.id === behaviorId);
  score += behavior ? behavior.priority : 0;

  // Boost score for proactive behavior when handling responses to proactive questions
  if (behaviorId === "proactive" && context.isResponseToProactiveQuestion) {
    score += 500; // Significant boost to ensure ProactiveBehavior handles responses to its questions
    return score; // Early return - no need for further scoring
  } 
  
  // If this is a response to a proactive question about games, boost game behavior
  if (context.proactiveResponseCategory === "games" && behaviorId === "game") {
    score += 300;
    return score;
  }

  // Specific behavior scoring adjustments
  switch (behaviorId) {    case "curiosity":
      // Boost curiosity behavior significantly when terms (known or unknown) are detected
      if (context.unknownTerm || context.previousUnknownTerm || context.isDefiningUnknownTerm || context.knownTerm) {
        score += 800; // Higher priority than any other behavior to ensure it handles terms

        // Log that we're boosting the curiosity behavior score due to terms
        logDebug("[Nova] BehaviorRegistry:boostCuriosityScore", {
          message: "Boosting curiosity behavior score for term handling",
          unknownTerm: context.unknownTerm || context.previousUnknownTerm,
          knownTerm: context.knownTerm || null,
          newScore: score,
          userId: userId,
          originalMessage: message,
        });

        // If the message starts with "what is" or similar patterns, prioritize curiosity even more
        if (/^what(?:'s| is)/i.test(message) || /^do you know/i.test(message) || /^tell me about/i.test(message)) {
          score += 300; // Extra boost for direct questions about terms
        }
            // Special case for single-word queries that might be a term lookup
      if (message.trim().split(/\s+/).length === 1) {
        // For single-word queries that might be term lookups, make this behavior dominant
        score += 1000; // Much higher than any other behavior to absolutely ensure it handles terms
        
        // Log that we're giving maximum priority to the curiosity behavior for single-word queries
        logDebug("[Nova] BehaviorRegistry:boostCuriosityScore:singleWordQueryMaxPriority", {
          message: "Giving maximum priority to curiosity behavior for single-word query",
          originalMessage: message,
          newScore: score,
          userId: userId
        });
        
        // Return early to ensure this takes precedence
        return score;
      }
      }
      break;
    case "knowledge-base":
      // If a term is detected (known or unknown), heavily penalize the knowledge base behavior
      if (context.unknownTerm || context.knownTerm) {
        score -= 300;
        break;
      }

      // Boost knowledge base for factual questions
      if (
        context.currentTopic === "programming" ||
        context.currentTopic === "web" ||
        context.currentTopic === "database"
      ) {
        score += 50;
      }

      // Penalize knowledge base for wellbeing questions
      if (
        lowerMessage.includes("how are you") ||
        lowerMessage.includes("how do you feel") ||
        lowerMessage.includes("how's it going") ||
        lowerMessage.includes("how is it going") ||
        lowerMessage.includes("how have you been") ||
        context.currentTopic === "wellbeing"
      ) {
        score -= 500; // Significant penalty to ensure DefaultResponseBehavior handles these
      }
      break;
    case "small-talk":
      // If a term is detected, penalize small-talk behavior
      if (context.unknownTerm || context.knownTerm) {
        score -= 300;
        break;
      }
      break;

    case "default-response":
      // If a term is detected, penalize default-response behavior
      if (context.unknownTerm || context.knownTerm) {
        score -= 300;
        break;
      }
      // Boost default response for wellbeing questions
      if (
        lowerMessage.includes("how are you") ||
        lowerMessage.includes("how do you feel") ||
        lowerMessage.includes("how's it going") ||
        lowerMessage.includes("how is it going") ||
        lowerMessage.includes("how have you been") ||
        context.currentTopic === "wellbeing"
      ) {
        score += 300; // Higher boost to ensure it handles wellbeing questions
      }
      break;

    case "utility":
      // Boost utility for calculations and definitions
      if (lowerMessage.includes("calculate") || lowerMessage.includes("define") || lowerMessage.includes("convert")) {
        score += 100;
      }
      break;
  }

  return score;
}
