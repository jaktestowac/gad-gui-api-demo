/**
 * Behavior Registry - Central registry for all AI behaviors
 *
 * This module is the core of the behavior system, allowing behaviors to register
 * themselves and providing a way to find the appropriate behavior for a message.
 */

const { logDebug } = require("../../../../helpers/logger-api");

/**
 * Registry of all available behaviors
 */
class BehaviorRegistry {
  constructor() {
    this.behaviors = [];
    this.initialized = false;
  }

  /**
   * Register a behavior with the registry
   * @param {object} behavior - The behavior to register
   * @returns {BehaviorRegistry} - Returns self for chaining
   */
  register(behavior) {
    if (!behavior.id || typeof behavior.canHandle !== "function" || typeof behavior.handle !== "function") {
      throw new Error("Invalid behavior: must have id, canHandle, and handle properties");
    }

    // Check if a behavior with the same ID already exists
    const existingIndex = this.behaviors.findIndex((b) => b.id === behavior.id);

    if (existingIndex >= 0) {
      // Replace existing behavior
      this.behaviors[existingIndex] = behavior;
    } else {
      // Add new behavior
      this.behaviors.push(behavior);
    }

    // Sort behaviors by priority (highest first)
    this.behaviors.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return this;
  }
  /**
   * Get the appropriate behavior to handle a message
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {object|null} - The behavior to use, or null if none found
   */
  getBehaviorForMessage(message, context) {
    // First attempt to find all behaviors that can handle the message
    const matchingBehaviors = [];
    for (const behavior of this.behaviors) {
      if (behavior.canHandle(message, context)) {
        matchingBehaviors.push(behavior);
      }
    }
    // Log all matching behaviors (for debugging)
    if (matchingBehaviors.length > 0) {
      logDebug("BehaviorRegistry:getBehaviorForMessage", {
        count: matchingBehaviors.length,
        behaviors: matchingBehaviors.map((b) => b.id).join(", "),
      });
    } else {
      logDebug("BehaviorRegistry:getBehaviorForMessage", {
        count: 0,
        message: "No behaviors can handle this message",
      });
    }

    // Return the first matching behavior (highest priority) for backward compatibility
    return matchingBehaviors.length > 0 ? matchingBehaviors[0] : null;
  }
  /**
   * Process a message using the registered behaviors
   * @param {string} message - The message to process
   * @param {object} context - Context for message processing
   * @returns {string} - The response
   */
  processMessage(message, context) {
    // Collect all behaviors that can handle this message
    const matchingBehaviors = [];
    for (const behavior of this.behaviors) {
      if (behavior.canHandle(message, context)) {
        matchingBehaviors.push(behavior);
      }
    }

    console.log("Matching Behaviors:", matchingBehaviors.map((b) => b.id));

    // If no behaviors can handle the message, return a default response
    if (matchingBehaviors.length === 0) {
      return "I'm not sure how to respond to that. Could you try a different question?";
    }

    // If only one behavior can handle it, use that one
    if (matchingBehaviors.length === 1) {
      return matchingBehaviors[0].handle(message, context);
    }

    // Multiple behaviors can handle this message - pick the best one
    // Generate responses from all matching behaviors
    const responses = matchingBehaviors.map((behavior) => ({
      behavior: behavior,
      response: behavior.handle(message, context),
      score: this._calculateResponseScore(message, behavior.id, context),
    })); // Sort by score (highest first)
    responses.sort((a, b) => b.score - a.score);

    // Log matching behaviors and their scores
    logDebug("BehaviorRegistry:processMessage:MatchScores", {
      matchCount: responses.length,
      scores: responses.map((r) => ({
        behaviorId: r.behavior.id,
        score: r.score,
      })),
    });

    // Return the highest-scoring response
    return responses[0].response;
  }

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

    // Base score from behavior priority
    const behavior = this.behaviors.find((b) => b.id === behaviorId);
    score += behavior ? behavior.priority : 0;

    // Specific behavior scoring adjustments
    switch (behaviorId) {
      case "knowledge-base":
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
      case "default-response":
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

  /**
   * Get all registered behaviors
   * @returns {Array} - Array of registered behaviors
   */
  getAllBehaviors() {
    return [...this.behaviors];
  }
}

// Create a singleton instance
const registry = new BehaviorRegistry();

module.exports = registry;
