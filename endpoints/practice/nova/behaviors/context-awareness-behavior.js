/**
 * Context Awareness Behavior - Enhances Nova's understanding of conversation context
 *
 * This behavior improves Nova's ability to maintain context across conversation turns,
 * detect when users are switching topics, and provide more coherent responses.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class ContextAwarenessBehavior extends BaseBehavior {
  constructor() {
    // High priority to ensure context is properly maintained
    super("context-awareness", 700);

    // Context tracking
    this.contextStates = {
      EXPLORING: "exploring",
      FOCUSED: "focused",
      CLARIFYING: "clarifying",
      TRANSITIONING: "transitioning",
      CONCLUDING: "concluding"
    };

    // Context switch indicators
    this.contextSwitchIndicators = [
      "by the way",
      "speaking of",
      "on another note",
      "changing the subject",
      "getting back to",
      "anyway",
      "so",
      "well",
      "actually",
      "in fact",
      "meanwhile",
      "as for",
      "regarding",
      "concerning"
    ];

    // Topic continuity patterns
    this.topicContinuityPatterns = [
      /^and\s+/i,
      /^also\s+/i,
      /^plus\s+/i,
      /^furthermore\s+/i,
      /^moreover\s+/i,
      /^additionally\s+/i,
      /^besides\s+/i,
      /^what about\s+/i,
      /^how about\s+/i,
      /^can you also\s+/i,
      /^another thing\s+/i
    ];
  }

  /**
   * Check if this behavior should enhance context awareness
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior should enhance context
   */
  canHandle(message, context) {
    // Always process context, but only enhance responses when needed
    this._updateContextState(message, context);
    
    // Check if we need to provide context-aware enhancements
    return this._needsContextEnhancement(message, context);
  }

  /**
   * Handle context awareness enhancement
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - Enhanced response with context awareness
   */
  handle(message, context) {
    // If another behavior has already generated a response, enhance it
    if (context.generatedResponse) {
      return this._enhanceResponseWithContext(context.generatedResponse, context);
    }

    // Generate context-aware response directly
    return this._generateContextAwareResponse(message, context);
  }

  /**
   * Update the conversation context state
   * @private
   * @param {string} message - The current message
   * @param {object} context - Message context
   */
  _updateContextState(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Initialize context state if not present
    if (!context.conversationContext) {
      context.conversationContext = {
        currentState: this.contextStates.EXPLORING,
        currentTopic: null,
        topicHistory: [],
        contextSwitches: 0,
        lastTopicChange: null,
        conversationDepth: 0,
        userEngagement: "neutral"
      };
    }

    const convContext = context.conversationContext;

    // Detect context switches
    const isContextSwitch = this._detectContextSwitch(message);
    if (isContextSwitch) {
      convContext.contextSwitches++;
      convContext.lastTopicChange = Date.now();
      convContext.currentState = this.contextStates.TRANSITIONING;
      
      logDebug("[Nova] ContextAwarenessBehavior: Context switch detected", {
        message: message.substring(0, 50),
        contextSwitches: convContext.contextSwitches
      });
    }

    // Detect topic continuity
    const isTopicContinuation = this._detectTopicContinuation(message);
    if (isTopicContinuation && convContext.currentTopic) {
      convContext.conversationDepth++;
      convContext.currentState = this.contextStates.FOCUSED;
    }

    // Update current topic
    if (context.currentTopic && context.currentTopic !== convContext.currentTopic) {
      if (convContext.currentTopic) {
        convContext.topicHistory.push({
          topic: convContext.currentTopic,
          duration: Date.now() - (convContext.lastTopicChange || Date.now()),
          depth: convContext.conversationDepth
        });
      }
      convContext.currentTopic = context.currentTopic;
      convContext.conversationDepth = 1;
      convContext.lastTopicChange = Date.now();
    }

    // Detect conversation conclusion
    if (this._detectConversationConclusion(message)) {
      convContext.currentState = this.contextStates.CONCLUDING;
    }

    // Update user engagement level
    convContext.userEngagement = this._assessUserEngagement(message, context);
  }

  /**
   * Detect if the message indicates a context switch
   * @private
   * @param {string} message - The message to analyze
   * @returns {boolean} - True if context switch detected
   */
  _detectContextSwitch(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for explicit context switch indicators
    for (const indicator of this.contextSwitchIndicators) {
      if (lowerMessage.includes(indicator)) {
        return true;
      }
    }

    // Check for abrupt topic changes (short messages after long conversation)
    if (message.length < 20 && this._hasRecentConversationDepth()) {
      return true;
    }

    return false;
  }

  /**
   * Detect if the message continues the current topic
   * @private
   * @param {string} message - The message to analyze
   * @returns {boolean} - True if topic continuation detected
   */
  _detectTopicContinuation(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for topic continuity patterns
    for (const pattern of this.topicContinuityPatterns) {
      if (pattern.test(lowerMessage)) {
        return true;
      }
    }

    // Check for follow-up questions
    if (lowerMessage.includes("what about") || lowerMessage.includes("how about")) {
      return true;
    }

    return false;
  }

  /**
   * Detect if the conversation is concluding
   * @private
   * @param {string} message - The message to analyze
   * @returns {boolean} - True if conclusion detected
   */
  _detectConversationConclusion(message) {
    const lowerMessage = message.toLowerCase();
    
    const conclusionIndicators = [
      "thanks",
      "thank you",
      "bye",
      "goodbye",
      "see you",
      "that's all",
      "that's it",
      "okay",
      "ok",
      "got it",
      "understood"
    ];

    return conclusionIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Assess user engagement level
   * @private
   * @param {string} message - The message to analyze
   * @param {object} context - Message context
   * @returns {string} - Engagement level
   */
  _assessUserEngagement(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // High engagement indicators
    const highEngagement = [
      "tell me more",
      "explain",
      "how does",
      "why does",
      "what if",
      "can you show",
      "give me an example"
    ];

    // Low engagement indicators
    const lowEngagement = [
      "ok",
      "sure",
      "fine",
      "whatever",
      "i guess",
      "maybe"
    ];

    if (highEngagement.some(indicator => lowerMessage.includes(indicator))) {
      return "high";
    }

    if (lowEngagement.some(indicator => lowerMessage.includes(indicator))) {
      return "low";
    }

    // Check message length and complexity
    if (message.length > 50 && message.includes("?")) {
      return "high";
    }

    if (message.length < 10) {
      return "low";
    }

    return "neutral";
  }

  /**
   * Check if context enhancement is needed
   * @private
   * @param {string} message - The message to check
   * @param {object} context - Message context
   * @returns {boolean} - True if enhancement needed
   */
  _needsContextEnhancement(message, context) {
    if (!context.conversationContext) {
      return false;
    }

    const convContext = context.conversationContext;

    // Enhance responses for context switches
    if (convContext.currentState === this.contextStates.TRANSITIONING) {
      return true;
    }

    // Enhance responses for deep conversations
    if (convContext.conversationDepth > 3) {
      return true;
    }

    // Enhance responses for low engagement
    if (convContext.userEngagement === "low") {
      return true;
    }

    return false;
  }

  /**
   * Enhance an existing response with context awareness
   * @private
   * @param {string} response - The original response
   * @param {object} context - Message context
   * @returns {string} - Enhanced response
   */
  _enhanceResponseWithContext(response, context) {
    const convContext = context.conversationContext;
    if (!convContext) {
      return response;
    }

    let enhancedResponse = response;

    // Add context switch acknowledgment
    if (convContext.currentState === this.contextStates.TRANSITIONING) {
      enhancedResponse = `I see we're moving to a different topic. ${response}`;
    }

    // Add engagement encouragement for low engagement
    if (convContext.userEngagement === "low") {
      enhancedResponse = `${response}\n\nIs there anything specific about this topic you'd like to explore further?`;
    }

    // Add depth acknowledgment for deep conversations
    if (convContext.conversationDepth > 3) {
      enhancedResponse = `${response}\n\nI appreciate your interest in diving deep into this topic. Is there a particular aspect you'd like to focus on?`;
    }

    return enhancedResponse;
  }

  /**
   * Generate a context-aware response directly
   * @private
   * @param {string} message - The message to respond to
   * @param {object} context - Message context
   * @returns {string} - Context-aware response
   */
  _generateContextAwareResponse(message, context) {
    const convContext = context.conversationContext;
    if (!convContext) {
      return "I'm here to help! What would you like to discuss?";
    }

    // Handle context switches
    if (convContext.currentState === this.contextStates.TRANSITIONING) {
      return "I understand you're changing topics. I'm ready to help with whatever you'd like to discuss next.";
    }

    // Handle low engagement
    if (convContext.userEngagement === "low") {
      return "I want to make sure I'm being helpful. Is there a different way I can assist you, or would you like to explore a different topic?";
    }

    // Handle conversation conclusion
    if (convContext.currentState === this.contextStates.CONCLUDING) {
      return "I'm glad I could help! Feel free to reach out if you have more questions later.";
    }

    return "I'm here to help! What would you like to discuss?";
  }

  /**
   * Check if there's been recent conversation depth
   * @private
   * @returns {boolean} - True if recent depth detected
   */
  _hasRecentConversationDepth() {
    // This would typically check conversation history
    // For now, return false as a placeholder
    return false;
  }
}

module.exports = ContextAwarenessBehavior; 