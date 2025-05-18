/**
 * Behavior Registry - Central registry for all AI behaviors
 *
 * This module is the core of the behavior system, allowing behaviors to register
 * themselves and providing a way to find the appropriate behavior for a message.
 */

const { logDebug } = require("../../../../helpers/logger-api");
const debugTermLearning = require("../debug-term-learning");

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

    // Store the count of matching behaviors in the context for other behaviors to use
    context.matchingBehaviorCount = matchingBehaviors.length;

    // Log all matching behaviors (for debugging)
    if (matchingBehaviors.length > 0) {
      logDebug("[Nova] BehaviorRegistry:getBehaviorForMessage", {
        count: matchingBehaviors.length,
        behaviors: matchingBehaviors.map((b) => b.id).join(", "),
      });
    } else {
      logDebug("[Nova] BehaviorRegistry:getBehaviorForMessage", {
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
   */ processMessage(message, context) {
    // Debug term learning: Check if this is a term definition that should be prioritized
    const termDefinitionResponse = debugTermLearning.prioritizeTermDefinition(message, context, this.behaviors);
    if (termDefinitionResponse) {
      logDebug("[Nova] BehaviorRegistry: Term definition prioritized by debug module", {
        term: context.previousUnknownTerm,
        responseLength: termDefinitionResponse.length,
      });
      return termDefinitionResponse;
    }

    // Collect all behaviors that can handle this message
    const matchingBehaviors = [];

    // Track potential topics for better questioning
    context.potentialTopics = [];

    for (const behavior of this.behaviors) {
      // Skip variation behavior for initial processing
      if (behavior.id === "variation") continue;

      if (behavior.canHandle(message, context)) {
        matchingBehaviors.push(behavior);

        // If this is a topic-related behavior, store the topic
        if (
          ["knowledge-base", "recommendation", "gad-feature"].includes(behavior.id) &&
          context.currentTopic &&
          context.currentTopic !== "ambiguous"
        ) {
          context.potentialTopics.push(context.currentTopic);
        }
      }
    } // Store the count of matching behaviors for curiosity behavior to use
    context.matchingBehaviorCount = matchingBehaviors.length; // Log detailed information when a 'what is X' question is detected
    if (/^what(?:'s| is)/i.test(message) || /^do you know/i.test(message) || /^tell me about/i.test(message)) {
      // Try to extract the term from different question patterns
      const whatIsMatch = message.match(/what(?:'s| is)(?: a| an| the)? ([a-zA-Z0-9_-]+)(?:\??|$)/i);
      const doYouKnowMatch = message.match(/do you know(?: what| about)? ([a-zA-Z0-9_-]+)(?:\??|$)/i);
      const tellMeMatch = message.match(/tell me about(?: the)? ([a-zA-Z0-9_-]+)(?:\??|$)/i);

      // Try to extract multi-word terms in quotes
      const quotedTermMatch =
        message.match(/what(?:'s| is)(?: a| an| the)? "([^"]+)"(?:\??|$)/i) ||
        message.match(/do you know(?: what| about)? "([^"]+)"(?:\??|$)/i) ||
        message.match(/tell me about(?: the)? "([^"]+)"(?:\??|$)/i);

      // Try to extract multi-word terms without quotes (end of sentence)
      const endOfSentenceMatch =
        message.match(/what(?:'s| is)(?: a| an| the)? (.+?)(?:\?|$)/i) ||
        message.match(/do you know(?: what| about)? (.+?)(?:\?|$)/i) ||
        message.match(/tell me about(?: the)? (.+?)(?:\?|$)/i); // Find the first matching term from any of the patterns
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

      const userId = context.userId || context.conversationId?.split("_")[0];

      logDebug("[Nova] BehaviorRegistry:processMessage:TermQuestion", {
        message: message,
        matchingBehaviorsCount: matchingBehaviors.length,
        behaviors: matchingBehaviors.map((b) => b.id).join(", "),
        unknownTerm: context.unknownTerm || null,
        extractedTerm: termToCheck,
        userId: userId,
      });

      // First, check if this is a user-defined term
      if (termToCheck && userId) {
        const { knowsTerm } = require("../user-memory");

        // If we know this term from user-taught definition, prioritize it
        if (knowsTerm(termToCheck, userId)) {
          logDebug("[Nova] BehaviorRegistry:processMessage:UserDefinedTermDetected", {
            term: termToCheck,
            userId: userId,
            message: message,
          });

          // Mark this as a known term to ensure the curiosity behavior handles it
          context.knownTerm = termToCheck;

          // Find the curiosity behavior to handle this
          const curiosityBehavior = this.behaviors.find((b) => b.id === "curiosity");
          if (curiosityBehavior) {
            // Force the curiosity behavior to handle the user-defined term
            context.handledBy = "curiosity";
            context.generatedResponse = curiosityBehavior.handle(message, context);
            this._setResponseType(context);

            // Log that we're prioritizing user-defined term
            logDebug("[Nova] BehaviorRegistry:processMessage:PrioritizingUserDefinedTerm", {
              knownTerm: termToCheck,
              userId: userId,
              message: message,
            });

            // Return the user-defined term response directly
            return context.generatedResponse;
          }
        }
      }

      // When "what is X?" is asked and X is an unknown term, ensure Curiosity behavior handles it
      // This special case overrides the normal behavior selection in some cases
      if (context.unknownTerm && matchingBehaviors.length > 0) {
        const curiosityBehavior = matchingBehaviors.find((b) => b.id === "curiosity");
        if (curiosityBehavior) {
          // Force the curiosity behavior to handle this
          context.handledBy = "curiosity";
          context.generatedResponse = curiosityBehavior.handle(message, context);
          this._setResponseType(context);

          // Log that we're forcing the curiosity behavior
          logDebug("[Nova] BehaviorRegistry:processMessage:ForcingCuriosityForWhatIs", {
            unknownTerm: context.unknownTerm,
            message: message,
          });

          // Return the response directly
          return context.generatedResponse;
        }
      }
    } // If this is a potential term definition response, make sure the CuriosityBehavior handles it
    if (context.isDefiningUnknownTerm && context.previousUnknownTerm) {
      logDebug("[Nova] BehaviorRegistry:processMessage:DefiningUnknownTerm", {
        previousUnknownTerm: context.previousUnknownTerm,
        message: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        matchingBehaviors: matchingBehaviors.map((b) => b.id).join(", "),
        isDefiningUnknownTerm: context.isDefiningUnknownTerm,
      });

      // Try to find the curiosity behavior
      const curiosityBehavior = this.behaviors.find((b) => b.id === "curiosity");
      if (curiosityBehavior) {
        // Force the curiosity behavior to handle this definition
        context.handledBy = "curiosity";
        context.generatedResponse = curiosityBehavior.handle(message, context);
        this._setResponseType(context);

        // Return the response directly
        return context.generatedResponse;
      }
    }

    // If this is a potential term definition response, make sure the CuriosityBehavior handles it
    if (context.isDefiningUnknownTerm && context.previousUnknownTerm) {
      logDebug("[Nova] BehaviorRegistry:processMessage:DefiningUnknownTerm", {
        previousUnknownTerm: context.previousUnknownTerm,
        message: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        matchingBehaviors: matchingBehaviors.map((b) => b.id).join(", "),
        isDefiningUnknownTerm: context.isDefiningUnknownTerm,
      });

      // Try to find the curiosity behavior
      const curiosityBehavior = this.behaviors.find((b) => b.id === "curiosity");
      if (curiosityBehavior) {
        // Force the curiosity behavior to handle this definition
        context.handledBy = "curiosity";
        context.generatedResponse = curiosityBehavior.handle(message, context);

        // Return the response directly
        return context.generatedResponse;
      }
    }

    // If no behaviors can handle the message, try curiosity behavior or provide help
    if (matchingBehaviors.length === 0) {
      // Increment the count of unrecognized messages
      context.unrecognizedCount = (context.unrecognizedCount || 0) + 1; // Check if curiosity behavior is available
      const curiosityBehavior = this.behaviors.find((b) => b.id === "curiosity");

      if (curiosityBehavior && curiosityBehavior.canHandle(message, context)) {
        // Track which behavior handled the message
        context.handledBy = "curiosity";
        context.generatedResponse = curiosityBehavior.handle(message, context);

        // Log that curiosity behavior is handling unknown term
        if (context.unknownTerm || context.previousUnknownTerm) {
          logDebug("[Nova] BehaviorRegistry:processMessage:UnknownTerm", {
            unknownTerm: context.unknownTerm || context.previousUnknownTerm,
            isDefining: !!context.isDefiningUnknownTerm,
            isPrevious: !!context.previousUnknownTerm,
          });
        }
      }
      // After multiple unrecognized messages, provide help suggestions
      else if (context.unrecognizedCount >= 4) {
        // Reset the counter to prevent showing this every time
        context.unrecognizedCount = 0;

        return `I'm having trouble understanding what you're looking for. Here are some things you can try:
- Use /help to see available commands
- Try asking a specific question
- Ask me about a topic like "JavaScript" or "databases"
- Start a game with "Let's play a game"
- Ask for recommendations with "What do you recommend for..."

How can I assist you today?`;
      } else {
        return "I'm not sure how to respond to that. Could you try a different question?";
      }
    } // If only one behavior can handle it, use that one
    if (matchingBehaviors.length === 1) {
      // Track which behavior handled the message
      context.handledBy = matchingBehaviors[0].id;
      context.generatedResponse = matchingBehaviors[0].handle(message, context);
    } else {
      // Multiple behaviors can handle this message - pick the best one
      // Generate responses from all matching behaviors
      const responses = matchingBehaviors.map((behavior) => ({
        behavior: behavior,
        response: behavior.handle(message, context),
        score: this._calculateResponseScore(message, behavior.id, context),
      }));

      // Sort by score (highest first)
      responses.sort((a, b) => b.score - a.score);

      // Determine if we have low confidence matches
      const topScore = responses[0].score;
      const secondScore = responses.length > 1 ? responses[1].score : 0;

      // If the top score is close to the second score, mark as low confidence
      if (responses.length > 1 && topScore - secondScore < 50) {
        context.hasLowConfidenceMatches = true;
      }

      // Log matching behaviors and their scores
      logDebug("[Nova] BehaviorRegistry:processMessage:MatchScores", {
        matchCount: responses.length,
        scores: responses.map((r) => ({
          behaviorId: r.behavior.id,
          score: r.score,
        })),
      });

      // Track which behavior handled the message
      context.handledBy = responses[0].behavior.id;
      context.generatedResponse = responses[0].response;
    }

    // Set the response type based on the behavior that handled it
    this._setResponseType(context);

    // Apply variation behavior if available
    const variationBehavior = this.behaviors.find((b) => b.id === "variation");
    if (variationBehavior && variationBehavior.canHandle(message, context)) {
      // Apply variation to the response
      const response = variationBehavior.handle(message, context);

      logDebug("[Nova] BehaviorRegistry:processMessage:FinalResponse Data", {
        id: variationBehavior.id,
        type: context.responseType,
        behaviorId: context.handledBy,
      });
      logDebug("[Nova] BehaviorRegistry:processMessage:FinalResponse", {
        response,
      });

      return response;
    }

    logDebug("[Nova] BehaviorRegistry:processMessage:FinalResponse", {
      behaviorId: context.handledBy,
      responseType: context.responseType,
      response: context.generatedResponse,
    });

    // Return the generated response if no variation was applied
    return context.generatedResponse;
  }
  /**
   * Calculate a score for a response based on relevance to the message
   * @private
   * @param {string} message - User message
   * @param {string} behaviorId - ID of the behavior
   * @param {object} context - Message context
   * @returns {number} - Score indicating how well this behavior matches the message
   */ _calculateResponseScore(message, behaviorId, context) {
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
    } // If this is a response to a proactive question about games, boost game behavior
    if (context.proactiveResponseCategory === "games" && behaviorId === "game") {
      score += 300;
      return score;
    }

    // Specific behavior scoring adjustments
    switch (behaviorId) {
      case "curiosity":
        // Boost curiosity behavior significantly when unknown terms are detected
        if (context.unknownTerm || context.previousUnknownTerm || context.isDefiningUnknownTerm || context.knownTerm) {
          score += 800; // Higher priority than any other behavior to ensure it handles unknown terms          // Log that we're boosting the curiosity behavior score due to terms
          logDebug("[Nova] BehaviorRegistry:boostCuriosityScore", {
            message: "Boosting curiosity behavior score for term handling",
            unknownTerm: context.unknownTerm || context.previousUnknownTerm || null,
            knownTerm: context.knownTerm || null,
            isDefiningTerm: context.isDefiningUnknownTerm || false,
            newScore: score,
            originalMessage: message,
          });

          // If the message starts with "what is" or similar patterns, prioritize curiosity even more
          if (/^what(?:'s| is)/i.test(message) || /^do you know/i.test(message) || /^tell me about/i.test(message)) {
            score += 300; // Extra boost for direct questions about terms
          }
        }
        break;
      case "knowledge-base": // If an unknown term or known term is detected, heavily penalize the knowledge base behavior
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
      case "small-talk": // If an unknown term or known term is detected, penalize small-talk behavior
        if (context.unknownTerm || context.knownTerm) {
          score -= 300;
          break;
        }
        break;

      case "default-response": // If an unknown term or known term is detected, penalize default-response behavior
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
  /**
   * Set the response type based on the behavior that handled it
   * @private
   * @param {object} context - Message context
   */
  _setResponseType(context) {
    const behaviorId = context.handledBy;

    switch (behaviorId) {
      case "knowledge-base":
        context.responseType = "fact";
        break;
      case "small-talk":
        if (context.smallTalkCategory === "greetings") {
          context.responseType = "greeting";
        } else if (context.smallTalkCategory === "opinions") {
          context.responseType = "opinion";
        } else {
          context.responseType = "small-talk";
        }
        break;
      case "utility":
        context.responseType = "help";
        break;
      case "command":
        context.responseType = "command";
        break;
      case "game":
        context.responseType = "game";
        break;
      case "recommendation":
        context.responseType = "recommendation";
        break;
      case "personality":
        context.responseType = "personal";
        break;
      case "proactive":
        if (context.isResponseToProactiveQuestion) {
          context.responseType = "follow-up";
        } else {
          context.responseType = "proactive";
        }
        break;
      default:
        context.responseType = "general";
    }
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
