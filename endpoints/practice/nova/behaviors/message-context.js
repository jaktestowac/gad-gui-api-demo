/**
 * Message Context - Provides context for message processing
 *
 * This class contains all the contextual information needed for behaviors
 * to process messages, including user memory, conversation history, etc.
 */

class MessageContext {
  /**
   * Create a new message context
   * @param {string} userId - ID of the current user
   * @param {string} conversationId - ID of the current conversation
   * @param {Array} conversationHistory - History of the conversation
   * @param {object} userMemory - User memory object
   * @param {object} conversationAnalytics - Analytics for the conversation
   */
  constructor(userId, conversationId, conversationHistory = [], userMemory = {}, conversationAnalytics = {}) {
    this.userId = userId;
    this.conversationId = conversationId;
    this.conversationHistory = conversationHistory;
    this.userMemory = userMemory;
    this.conversationAnalytics = conversationAnalytics;
    this.lowerCaseMessage = ""; // Will be set with normalized message
    this.normalizedCommand = ""; // Will be set with normalized command
    this.currentTopic = ""; // Will be set with detected topic
    this.handled = false; // Whether message has been handled by a behavior
    this.response = ""; // Final response
  }

  /**
   * Add a message to the conversation history
   * @param {string} role - Role of the message sender (user or assistant)
   * @param {string} content - Content of the message
   */
  addToConversationHistory(role, content) {
    this.conversationHistory.push({ role, content });
  }

  /**
   * Get the latest messages from the conversation history
   * @param {number} count - Number of messages to return
   * @returns {Array} - Latest messages
   */
  getLatestMessages(count = 5) {
    return this.conversationHistory.slice(-count);
  }

  /**
   * Prepare a message for processing
   * @param {string} message - The message to prepare
   * @param {object} textProcessingUtils - Text processing utility functions
   */
  prepareMessage(message, textProcessingUtils) {
    this.lowerCaseMessage = message.toLowerCase();
    this.normalizedCommand = textProcessingUtils.getNormalizedCommand(message);
    this.currentTopic = textProcessingUtils.detectTopic(message);

    // Add user message to history
    this.addToConversationHistory("user", message);
  }
}

module.exports = MessageContext;
