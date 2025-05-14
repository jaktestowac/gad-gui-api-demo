/**
 * Conversational Flow Behavior - Manages the natural flow of conversations
 *
 * This behavior helps manage the overall flow of conversation, including handling
 * interruptions, topic changes, and keeping track of the conversation's coherence.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class ConversationalFlowBehavior extends BaseBehavior {
  constructor() {
    // Medium priority to manage conversation flow
    super("conversational-flow", 500);

    this.currentTopic = null;
    this.previousTopic = null;
    this.topicChangeThreshold = 0.6; // Threshold to detect topic change
  }

  /**
   * Check if this behavior should handle interruptions or topic changes
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior can handle the message
   */
  canHandle(message, context) {
    const lowerMessage = context.lowerCaseMessage;

    // Track the previous topic if available
    if (context.currentTopic) {
      this.previousTopic = this.currentTopic;
      this.currentTopic = context.currentTopic;

      logDebug(
        `ConversationalFlowBehavior: Topic tracking: previous=${this.previousTopic}, current=${this.currentTopic}`
      );
    }

    // Detect if this is an interruption of the previous topic
    const isInterruption = this._detectInterruption(message, context);
    if (isInterruption) {
      context.isInterruption = true;
      logDebug(`ConversationalFlowBehavior: Detected interruption`);
      return true;
    }

    // Detect if this is a topic change
    const topicChangeDetected = this._detectTopicChange(message, context);
    if (topicChangeDetected) {
      context.isTopicChange = true;
      logDebug(
        `ConversationalFlowBehavior: Detected topic change from ${this.previousTopic} to ${context.currentTopic}`
      );
      return true;
    }

    return false;
  }

  /**
   * Handle interruptions and topic changes
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - The response
   */
  handle(message, context) {
    // Handle interruptions
    if (context.isInterruption) {
      return this._handleInterruption(message, context);
    }

    // Handle topic changes
    if (context.isTopicChange) {
      return this._handleTopicChange(message, context);
    }

    // This should not happen if canHandle works correctly
    return "I'm not sure I followed that. Could you rephrase?";
  }

  /**
   * Detect if the user's message interrupts the current conversation flow
   * @private
   */
  _detectInterruption(message, context) {
    // Check if we're in the middle of something that's being interrupted
    if (!context.conversationAnalytics || !context.conversationAnalytics.lastActivity) {
      return false;
    }

    const lastActivity = context.conversationAnalytics.lastActivity;
    const currentActivity = this._categorizeMessage(message);

    // If the last activity was a game or command and the current is unrelated
    if (
      (lastActivity === "game" && currentActivity !== "game") ||
      (lastActivity === "command" && !message.startsWith("/"))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Detect if the user has changed topics
   * @private
   */
  _detectTopicChange(message, context) {
    if (!this.previousTopic || !context.currentTopic || this.previousTopic === context.currentTopic) {
      return false;
    }

    // Calculate the degree of topic change
    const topicChangeScore = this._calculateTopicChangeScore(this.previousTopic, context.currentTopic);

    return topicChangeScore > this.topicChangeThreshold;
  }

  /**
   * Generate a response for when the user interrupts the current activity
   * @private
   */
  _handleInterruption(message, context) {
    const responses = [
      "I noticed we were in the middle of something else. Would you like to continue with that or switch to this new topic?",
      "We can put our previous discussion on hold if you'd like to focus on this instead.",
      "I see you've changed direction. No problem, let's discuss this new topic.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate a response that acknowledges a topic change
   * @private
   */
  _handleTopicChange(message, context) {
    const subtleTransitions = [
      `Shifting gears a bit, let's talk about ${context.currentTopic}.`,
      `Moving on to ${context.currentTopic}, then.`,
      `Alright, let's discuss ${context.currentTopic} now.`,
      `Changing topics to ${context.currentTopic}. `,
    ];

    return subtleTransitions[Math.floor(Math.random() * subtleTransitions.length)];
  }

  /**
   * Categorize the type of message
   * @private
   */
  _categorizeMessage(message) {
    // Simple categorization of message type
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("play ") || lowerMessage.includes("game")) {
      return "game";
    }
    if (message.startsWith("/") || lowerMessage.startsWith("command:")) {
      return "command";
    }
    if (lowerMessage.includes("?")) {
      return "question";
    }
    return "statement";
  }

  /**
   * Calculate how significant a topic change is
   * @private
   */
  _calculateTopicChangeScore(previousTopic, currentTopic) {
    // Simple string comparison to detect topic changes
    // In a real implementation, you might use embeddings or more sophisticated NLP
    if (previousTopic === currentTopic) {
      return 0;
    }

    // Check if the topics have any words in common
    const prevWords = previousTopic.toLowerCase().split(/\W+/);
    const currWords = currentTopic.toLowerCase().split(/\W+/);

    const commonWords = prevWords.filter((word) => word.length > 3 && currWords.includes(word));

    if (commonWords.length > 0) {
      return 0.5; // Partial topic change
    }

    return 0.8; // Complete topic change
  }
}

module.exports = ConversationalFlowBehavior;
