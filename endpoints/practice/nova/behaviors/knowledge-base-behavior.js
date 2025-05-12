/**
 * Knowledge Base Behavior - Handles knowledge base lookups
 */

const BaseBehavior = require("./base-behavior");
const { knowledgeBase } = require("../nova-base");

class KnowledgeBaseBehavior extends BaseBehavior {
  constructor(textProcessingUtils) {
    // Knowledge base has medium-high priority
    super("knowledge-base", 700);
    this.textProcessingUtils = textProcessingUtils;
  }
  /**
   * Check if this behavior can handle the message
   */
  canHandle(message) {
    const normalizedQuery = this.textProcessingUtils.getNormalizedKnowledgeQuery(message);

    // Direct match in knowledge base
    if (normalizedQuery in knowledgeBase) {
      return true;
    }

    // Check for partial matches if it's a question
    if (this.textProcessingUtils.isQuestion(message)) {
      const potentialMatches = this._findPotentialMatches(message);
      return potentialMatches.length > 0;
    }

    return false;
  }
  /**
   * Handle the message
   */
  handle(message) {
    const normalizedQuery = this.textProcessingUtils.getNormalizedKnowledgeQuery(message);

    // Direct match in knowledge base
    if (normalizedQuery in knowledgeBase) {
      return knowledgeBase[normalizedQuery];
    }

    // Check for partial matches
    if (this.textProcessingUtils.isQuestion(message)) {
      const potentialMatches = this._findPotentialMatches(message);

      // If we have multiple good matches but none exact, ask for clarification
      if (potentialMatches.length >= 2 && potentialMatches.length <= 5 && potentialMatches[0].distance > 0.15) {
        let response = "I'm not sure which topic you're asking about. Did you mean one of these?\n\n";
        potentialMatches.slice(0, 5).forEach((match, index) => {
          const topic = match.key.replace(/what is /i, "").replace(/\?/g, "");
          response += `${index + 1}. ${topic}\n`;
        });
        response += "\nPlease specify which one you're interested in.";
        return response;
      }

      // Single good match, but not exact - use it anyway
      else if (potentialMatches.length > 0 && potentialMatches[0].distance <= 0.3) {
        return knowledgeBase[potentialMatches[0].key];
      }
    }

    // This shouldn't happen if canHandle is working correctly
    return "I'm not sure how to answer that question. Could you try rephrasing it?";
  }

  /**
   * Find potential matches in the knowledge base
   * @private
   */
  _findPotentialMatches(message) {
    const lowerCleanMessage = message.toLowerCase().trim().replace(/\?+$/, "");
    const potentialMatches = [];

    // Check for partial matches in knowledge base
    for (const key of Object.keys(knowledgeBase)) {
      const distance = this.textProcessingUtils.levenshteinDistance(lowerCleanMessage, key);
      const maxLength = Math.max(lowerCleanMessage.length, key.length);
      const normalizedDistance = distance / maxLength;

      // Use a forgiving threshold for collecting potential matches
      if (normalizedDistance <= 0.4) {
        potentialMatches.push({ key, distance: normalizedDistance });
      }
    }

    // Sort matches by relevance (lower distance is better)
    return potentialMatches.sort((a, b) => a.distance - b.distance);
  }
}

module.exports = KnowledgeBaseBehavior;
