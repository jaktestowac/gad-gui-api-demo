/**
 * Contextual Memory Behavior - Remembers and references previous conversations
 *
 * This behavior enhances Nova's ability to recall and reference previous conversations
 * in a natural way, making interactions feel more connected and personalized.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class ContextualMemoryBehavior extends BaseBehavior {
  constructor() {
    // Medium priority to recall context at appropriate times
    super("contextual-memory", 600);
  }

  /**
   * Check if this behavior can recall something relevant to the current message
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior can handle the message
   */
  canHandle(message, context) {
    // This behavior activates when it can recall something relevant
    const userMem = context.userMemory;
    if (!userMem) return false;

    // Check if the current message relates to something we've discussed before
    const lowerMessage = context.lowerCaseMessage;
    let hasRelevantMemory = false;

    // Check if the message relates to any stored topics
    if (userMem.topics && userMem.topics.length > 0) {
      for (const topic of userMem.topics) {
        if (lowerMessage.includes(topic.toLowerCase())) {
          context.relevantMemoryTopic = topic;
          hasRelevantMemory = true;
          logDebug(`ContextualMemoryBehavior: Found relevant topic '${topic}'`);
          break;
        }
      }
    }

    // Check if it relates to user preferences
    if (userMem.preferences) {
      for (const pref in userMem.preferences) {
        if (lowerMessage.includes(pref.toLowerCase())) {
          context.relevantMemoryPreference = {
            topic: pref,
            sentiment: userMem.preferences[pref],
          };
          hasRelevantMemory = true;
          logDebug(`ContextualMemoryBehavior: Found relevant preference '${pref}'`);
          break;
        }
      }
    }

    // Don't activate every time, only occasionally to seem natural
    return hasRelevantMemory && Math.random() < 0.6;
  }

  /**
   * Generate a response that references previous conversations
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - The response
   */
  handle(message, context) {
    const userMem = context.userMemory;

    // If we found a relevant topic
    if (context.relevantMemoryTopic) {
      const topic = context.relevantMemoryTopic;

      // Create a natural reference to the previous conversation
      const references = [
        `I remember we talked about ${topic} before. `,
        `We've discussed ${topic} previously, if I recall correctly. `,
        `Coming back to ${topic} that we talked about earlier, `,
        `Ah, ${topic} - we've touched on this before. `,
        `You've mentioned ${topic} in our previous conversation. `,
      ];

      const reference = references[Math.floor(Math.random() * references.length)];

      // Let the conversation continue with this context established
      return reference + "Would you like me to elaborate on that topic?";
    }

    // If we found a relevant preference
    if (context.relevantMemoryPreference) {
      const { topic, sentiment } = context.relevantMemoryPreference;

      if (sentiment === "like") {
        const responses = [
          `You mentioned before that you like ${topic}. Is that still the case?`,
          `If I remember correctly, you're a fan of ${topic}. Did you have a specific question about it?`,
          `Since you like ${topic}, you might be interested in some related resources I can recommend.`,
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else {
        const responses = [
          `I recall you weren't too fond of ${topic}. Has your opinion changed?`,
          `You mentioned previously that you didn't like ${topic}. Would you like me to suggest alternatives?`,
          `Since ${topic} isn't your favorite, perhaps you'd prefer to discuss something else?`,
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    return "I seem to remember we've talked about this before. How can I help with it today?";
  }
}

module.exports = ContextualMemoryBehavior;
