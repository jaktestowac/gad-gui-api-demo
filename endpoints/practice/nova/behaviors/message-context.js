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
    this.smallTalkCategory = ""; // Category for small talk behavior
    this.handled = false; // Whether message has been handled by a behavior
    this.response = ""; // Final response    // Properties needed for new behaviors
    this.generatedResponse = ""; // Store generated response for variation behavior
    this.responseType = ""; // Type of response (fact, opinion, greeting, help)
    this.isInterruption = false; // Whether this is an interruption
    this.isTopicChange = false; // Whether this is a topic change
    this.relevantMemoryTopic = null; // Topic from memory relevant to current message
    this.relevantMemoryPreference = null; // Preference from memory relevant to current message

    // Properties for handling responses to proactive questions
    this.isResponseToProactiveQuestion = false; // Whether this message is a response to a proactive question
    this.proactiveResponseCategory = null; // Category of the proactive question this is responding to
    this.proactiveResponseType = null; // Type of response detected (yes/no, game, etc.)    // For idle time prompts
    this.isIdleTimePrompt = false; // Whether this response is for an idle time prompt

    // Track consecutive unrecognized messages
    this.unrecognizedCount = 0; // Count of consecutive unrecognized messages    // For handling unknown terms
    this.unknownTerm = null; // Current unknown term being asked about
    this.previousUnknownTerm = null; // Unknown term from the previous message
    this.isDefiningUnknownTerm = false; // Whether the user is currently defining an unknown term
    this.knownTerm = null; // A previously learned term recognized in the message

    // Debug flag
    this.debug = {
      termDetection: true, // Enable detailed term detection debugging
    };
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
    // Note: isDefiningUnknownTerm might already be set by nova-chat-handlers.js before this is called,
    // so we don't reset it here

    // EARLY TERM DETECTION - Do this before other processing
    this._detectTermsEarly(message, textProcessingUtils);

    // Process message - convert to lowercase and remove apostrophes to improve matching
    this.lowerCaseMessage = textProcessingUtils.normalizeText(message);

    // Get normalized command and topic without apostrophes
    const cleanMessage = textProcessingUtils.removeApostrophes(message);
    this.normalizedCommand = textProcessingUtils.getNormalizedCommand(cleanMessage);
    this.currentTopic = textProcessingUtils.detectTopic(cleanMessage);

    // Check for responses to previous proactive questions
    if (this.userMemory && this.userMemory.lastProactiveQuestion) {
      const lastProactiveTime = this.userMemory.lastProactiveQuestion.timestamp || 0;
      const messageCount = this.conversationAnalytics?.messageCount || 0;
      const lastProactiveMessageCount = this.userMemory.lastProactiveQuestion.messageCount || 0;

      // Consider a response if it's within 2 messages of a proactive question and less than 5 minutes old
      const isRecentProactive =
        messageCount - lastProactiveMessageCount <= 2 && Date.now() - lastProactiveTime < 5 * 60 * 1000;

      if (isRecentProactive) {
        // Flag as potential response to proactive question - will be confirmed by ProactiveBehavior.canHandle
        this.lastProactiveCategory = this.userMemory.lastProactiveQuestion.category;
        this.lastProactiveQuestion = this.userMemory.lastProactiveQuestion.text;
      }
    }

    // Check for topic interests in the message and add to user memory
    // We use the extracted topic for better context awareness
    if (this.currentTopic && this.currentTopic !== "general" && this.currentTopic !== "ambiguous") {
      this.addTopicInterest(this.currentTopic);
    }

    // Add user message to history
    this.addToConversationHistory("user", message);
  }

  /**
   * Detect terms early in the processing pipeline
   * @private
   * @param {string} message - The message to analyze
   * @param {object} textProcessingUtils - Text processing utilities
   */
  _detectTermsEarly(message, textProcessingUtils) {
    if (!this.userId) return;

    const lowerMessage = message.toLowerCase().trim();

    // Check for single-word queries first
    if (message.trim().split(/\s+/).length === 1) {
      const term = lowerMessage.replace(/[?!.,;]/g, "");
      
      // Import the knowsTerm function and knowledge base
      const { knowsTerm } = require("../user-memory");
      const { knowledgeBase } = require("../nova-base");
      
      // Check if this is a known term
      if (knowsTerm(term, this.userId)) {
        this.knownTerm = term;
        return;
      }
      
      // Check if this term exists in the knowledge base
      if (term in knowledgeBase) {
        // Don't mark as unknown if it exists in knowledge base
        return;
      }
      
      // Check if this could be an unknown term
      const commonWords = [
        "hi", "hello", "hey", "thanks", "thank", "you", "yes", "no", "maybe",
        "the", "this", "that", "your", "these", "those", "their", "our", "your",
        "ok", "okay", "help", "menu", "exit", "quit", "bye", "good", "great",
        "nice", "cool", "fine", "what", "who", "where", "when", "why", "how"
      ];
      
      if (!commonWords.includes(term) && term.length >= 2) {
        this.unknownTerm = term;
        return;
      }
    }

    // Check for direct term questions
    const termPatterns = [
      /^what(?:'s| is)(?: a| an| the)? ([a-zA-Z0-9_-]+)\??$/i,
      /^do you know ([a-zA-Z0-9_-]+)\??$/i,
      /^tell me about ([a-zA-Z0-9_-]+)\??$/i,
      /^what(?:'s| is) "(.*?)"\??$/i,
      /^do you know "(.*?)"\??$/i,
      /^tell me about "(.*?)"\??$/i,
    ];

    for (const pattern of termPatterns) {
      const match = message.match(pattern);
      if (match) {
        const term = match[1].toLowerCase().trim();
        
        // Import the knowsTerm function and knowledge base
        const { knowsTerm } = require("../user-memory");
        const { knowledgeBase } = require("../nova-base");
        
        if (knowsTerm(term, this.userId)) {
          this.knownTerm = term;
        } else if (term in knowledgeBase) {
          // Don't mark as unknown if it exists in knowledge base
          return;
        } else {
          this.unknownTerm = term;
        }
        return;
      }
    }
  }

  /**
   * Add user's topic interests to memory
   * @param {string} topic - The topic of interest
   */
  addTopicInterest(topic) {
    if (!this.userMemory.topics) {
      this.userMemory.topics = [];
    }

    // Only add if not already present
    if (!this.userMemory.topics.includes(topic)) {
      this.userMemory.topics.unshift(topic);

      // Keep the list manageable
      if (this.userMemory.topics.length > 5) {
        this.userMemory.topics = this.userMemory.topics.slice(0, 5);
      }
    }
  }
}

module.exports = MessageContext;
