/**
 * Conversation Flow Behavior - Manages conversation coherence and flow
 *
 * This behavior ensures smooth conversation transitions, handles interruptions,
 * maintains topic coherence, and provides natural conversation flow.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class ConversationFlowBehavior extends BaseBehavior {
  constructor() {
    // Medium-high priority to ensure flow management
    super("conversation-flow", 600);

    // Conversation states
    this.conversationStates = {
      FLOWING: "flowing",
      INTERRUPTED: "interrupted",
      TRANSITIONING: "transitioning",
      CONCLUDING: "concluding",
      EXPLORING: "exploring"
    };

    // Flow indicators
    this.flowIndicators = {
      continuation: [
        "and", "also", "plus", "furthermore", "moreover", "additionally",
        "besides", "what about", "how about", "can you also", "another thing"
      ],
      transition: [
        "by the way", "speaking of", "on another note", "changing the subject",
        "getting back to", "anyway", "so", "well", "actually", "in fact"
      ],
      conclusion: [
        "that's all", "that's it", "end of story", "in conclusion", "finally",
        "to sum up", "in summary", "that's everything"
      ],
      interruption: [
        "wait", "hold on", "stop", "interrupt", "excuse me", "sorry to interrupt"
      ]
    };

    // Transition phrases
    this.transitionPhrases = {
      topicChange: [
        "Speaking of which...",
        "That reminds me...",
        "On a related note...",
        "By the way...",
        "While we're on the subject..."
      ],
      continuation: [
        "Continuing with that...",
        "To add to that...",
        "Furthermore...",
        "Additionally...",
        "What's more..."
      ],
      conclusion: [
        "To wrap this up...",
        "In summary...",
        "To conclude...",
        "Finally...",
        "That covers it..."
      ]
    };
  }

  /**
   * Check if this behavior should manage conversation flow
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior should manage flow
   */
  canHandle(message, context) {
    // Always update flow state, but only enhance responses when needed
    this._updateFlowState(message, context);
    
    // Check if we need to provide flow management
    return this._needsFlowManagement(message, context);
  }

  /**
   * Handle conversation flow management
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - Enhanced response with flow management
   */
  handle(message, context) {
    // If another behavior has already generated a response, enhance it
    if (context.generatedResponse) {
      return this._enhanceResponseWithFlow(context.generatedResponse, context);
    }

    // Generate flow-aware response directly
    return this._generateFlowAwareResponse(message, context);
  }

  /**
   * Update the conversation flow state
   * @private
   * @param {string} message - The current message
   * @param {object} context - Message context
   */
  _updateFlowState(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Initialize flow state if not present
    if (!context.conversationFlow) {
      context.conversationFlow = {
        currentState: this.conversationStates.EXPLORING,
        topicHistory: [],
        interruptionCount: 0,
        lastTopicChange: null,
        flowCoherence: 1.0,
        transitionNeeded: false
      };
    }

    const flow = context.conversationFlow;

    // Detect interruptions
    if (this._detectInterruption(lowerMessage)) {
      flow.currentState = this.conversationStates.INTERRUPTED;
      flow.interruptionCount++;
      
      logDebug("[Nova] ConversationFlowBehavior: Interruption detected", {
        message: message.substring(0, 50),
        interruptionCount: flow.interruptionCount
      });
    }

    // Detect topic changes
    if (this._detectTopicChange(message, context)) {
      flow.currentState = this.conversationStates.TRANSITIONING;
      flow.lastTopicChange = Date.now();
      
      // Update topic history
      if (context.currentTopic) {
        flow.topicHistory.push({
          topic: context.currentTopic,
          timestamp: Date.now(),
          duration: flow.lastTopicChange ? Date.now() - flow.lastTopicChange : 0
        });
      }
      
      logDebug("[Nova] ConversationFlowBehavior: Topic change detected", {
        newTopic: context.currentTopic,
        topicHistory: flow.topicHistory.length
      });
    }

    // Detect conclusions
    if (this._detectConclusion(lowerMessage)) {
      flow.currentState = this.conversationStates.CONCLUDING;
    }

    // Calculate flow coherence
    flow.flowCoherence = this._calculateFlowCoherence(context);

    // Determine if transition is needed
    flow.transitionNeeded = this._needsTransition(message, context);
  }

  /**
   * Detect if the message indicates an interruption
   * @private
   * @param {string} message - The message to analyze
   * @returns {boolean} - True if interruption detected
   */
  _detectInterruption(message) {
    for (const indicator of this.flowIndicators.interruption) {
      if (message.includes(indicator)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detect if the message indicates a topic change
   * @private
   * @param {string} message - The message to analyze
   * @param {object} context - Message context
   * @returns {boolean} - True if topic change detected
   */
  _detectTopicChange(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Check for explicit transition indicators
    for (const indicator of this.flowIndicators.transition) {
      if (lowerMessage.includes(indicator)) {
        return true;
      }
    }

    // Check if topic has changed from previous context
    if (context.conversationFlow && context.conversationFlow.topicHistory.length > 0) {
      const lastTopic = context.conversationFlow.topicHistory[context.conversationFlow.topicHistory.length - 1];
      if (context.currentTopic && lastTopic.topic !== context.currentTopic) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect if the message indicates a conclusion
   * @private
   * @param {string} message - The message to analyze
   * @returns {boolean} - True if conclusion detected
   */
  _detectConclusion(message) {
    for (const indicator of this.flowIndicators.conclusion) {
      if (message.includes(indicator)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate flow coherence based on conversation context
   * @private
   * @param {object} context - Message context
   * @returns {number} - Coherence score (0-1)
   */
  _calculateFlowCoherence(context) {
    if (!context.conversationFlow || !context.conversationFlow.topicHistory) {
      return 1.0;
    }

    const topicHistory = context.conversationFlow.topicHistory;
    if (topicHistory.length < 2) {
      return 1.0;
    }

    // Calculate topic consistency
    let topicChanges = 0;
    for (let i = 1; i < topicHistory.length; i++) {
      if (topicHistory[i].topic !== topicHistory[i-1].topic) {
        topicChanges++;
      }
    }

    const coherence = 1.0 - (topicChanges / (topicHistory.length - 1));
    return Math.max(0.0, coherence);
  }

  /**
   * Determine if a transition phrase is needed
   * @private
   * @param {string} message - The current message
   * @param {object} context - Message context
   * @returns {boolean} - True if transition needed
   */
  _needsTransition(message, context) {
    if (!context.conversationFlow) {
      return false;
    }

    const flow = context.conversationFlow;

    // Need transition after interruption
    if (flow.currentState === this.conversationStates.INTERRUPTED) {
      return true;
    }

    // Need transition for topic change
    if (flow.currentState === this.conversationStates.TRANSITIONING) {
      return true;
    }

    // Need transition if flow coherence is low
    if (flow.flowCoherence < 0.5) {
      return true;
    }

    return false;
  }

  /**
   * Check if flow management is needed
   * @private
   * @param {string} message - The message to analyze
   * @param {object} context - Message context
   * @returns {boolean} - True if flow management needed
   */
  _needsFlowManagement(message, context) {
    if (!context.conversationFlow) {
      return false;
    }

    const flow = context.conversationFlow;

    // Manage flow after interruptions
    if (flow.currentState === this.conversationStates.INTERRUPTED) {
      return true;
    }

    // Manage flow during transitions
    if (flow.currentState === this.conversationStates.TRANSITIONING) {
      return true;
    }

    // Manage flow when coherence is low
    if (flow.flowCoherence < 0.6) {
      return true;
    }

    // Manage flow when transition is needed
    if (flow.transitionNeeded) {
      return true;
    }

    return false;
  }

  /**
   * Enhance response with flow management
   * @private
   * @param {string} response - The response to enhance
   * @param {object} context - Message context
   * @returns {string} - Enhanced response
   */
  _enhanceResponseWithFlow(response, context) {
    if (!context.conversationFlow) {
      return response;
    }

    const flow = context.conversationFlow;

    // Add transition phrase if needed
    if (flow.transitionNeeded) {
      const transitionPhrase = this._getAppropriateTransitionPhrase(flow.currentState);
      if (transitionPhrase) {
        return `${transitionPhrase} ${response}`;
      }
    }

    // Add flow acknowledgment for interruptions
    if (flow.currentState === this.conversationStates.INTERRUPTED) {
      return `No problem! ${response}`;
    }

    // Add coherence improvement for low coherence
    if (flow.flowCoherence < 0.5) {
      return `To stay on track, ${response}`;
    }

    return response;
  }

  /**
   * Generate flow-aware response
   * @private
   * @param {string} message - The message to respond to
   * @param {object} context - Message context
   * @returns {string} - Flow-aware response
   */
  _generateFlowAwareResponse(message, context) {
    if (!context.conversationFlow) {
      return "I'm here to help! What would you like to discuss?";
    }

    const flow = context.conversationFlow;

    // Handle interruptions
    if (flow.currentState === this.conversationStates.INTERRUPTED) {
      return "I understand you want to change topics. What would you like to discuss instead?";
    }

    // Handle transitions
    if (flow.currentState === this.conversationStates.TRANSITIONING) {
      return "I see we're moving to a new topic. How can I help you with that?";
    }

    // Handle conclusions
    if (flow.currentState === this.conversationStates.CONCLUDING) {
      return "I'm glad I could help! Is there anything else you'd like to discuss?";
    }

    // Handle low coherence
    if (flow.flowCoherence < 0.5) {
      return "Let me help you stay focused. What's the main topic you'd like to discuss?";
    }

    return "I'm here to help! What would you like to know?";
  }

  /**
   * Get appropriate transition phrase based on state
   * @private
   * @param {string} state - Current conversation state
   * @returns {string|null} - Transition phrase or null
   */
  _getAppropriateTransitionPhrase(state) {
    switch (state) {
      case this.conversationStates.TRANSITIONING:
        return this.transitionPhrases.topicChange[
          Math.floor(Math.random() * this.transitionPhrases.topicChange.length)
        ];
      case this.conversationStates.CONCLUDING:
        return this.transitionPhrases.conclusion[
          Math.floor(Math.random() * this.transitionPhrases.conclusion.length)
        ];
      default:
        return this.transitionPhrases.continuation[
          Math.floor(Math.random() * this.transitionPhrases.continuation.length)
        ];
    }
  }
}

module.exports = ConversationFlowBehavior; 