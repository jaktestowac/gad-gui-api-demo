/**
 * Default Response Behavior - Handles basic conversations and serves as a fallback
 */

const BaseBehavior = require("./base-behavior");

class DefaultResponseBehavior extends BaseBehavior {
  constructor(textProcessingUtils) {
    // Lowest priority as this is a fallback
    super("default-response", 100);
    this.textProcessingUtils = textProcessingUtils;
  }
  /**
   * This behavior can handle any message as a fallback
   */
  canHandle() {
    // This behavior can handle any message as a fallback
    return true;
  }

  /**
   * Handle the message with general conversation patterns
   */ handle(message, context) {
    const lowerMessage = context.lowerCaseMessage;
    const userMem = context.userMemory;

    // Reset the unrecognized counter when DefaultResponseBehavior successfully handles a message
    context.unrecognizedCount = 0;

    // Extract and remember user information from message
    const extractAndRememberUserInfo = require("../user-memory").extractAndRememberUserInfo;
    const infoExtracted = extractAndRememberUserInfo(message, context.conversationId);

    if (infoExtracted) {
      return "I've noted that information. Is there anything else you'd like to tell me?";
    }

    // Check for common greeting patterns
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      const greeting = userMem.name
        ? `Hello ${userMem.name}! How can I help you today?`
        : "Hello! How can I help you today?";
      return greeting;
    } // Handle status/feelings questions
    else if (
      lowerMessage.includes("how are you") ||
      lowerMessage.includes("how do you feel") ||
      lowerMessage.includes("how's it going") ||
      lowerMessage.includes("how is it going") ||
      lowerMessage.includes("how have you been")
    ) {
      return "I'm just a simple AI, but I'm functioning well! How can I assist you?";
    }

    // Handle weather questions
    else if (lowerMessage.includes("weather")) {
      return "I'm sorry, I don't have access to weather data. You might want to check a weather service for that information.";
    }

    // Handle time requests
    else if (lowerMessage.includes("time")) {
      const now = new Date();
      return `The current time is ${now.toLocaleTimeString()}.`;
    }

    // Handle date requests
    else if (lowerMessage.includes("date")) {
      const now = new Date();
      return `Today is ${now.toLocaleDateString()}.`;
    }

    // Handle day of week requests
    else if (lowerMessage.includes("day of the week")) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const now = new Date();
      return `Today is ${days[now.getDay()]}.`;
    }

    // Handle thank you messages
    else if (lowerMessage.includes("thank")) {
      return "You're welcome! Is there anything else I can help with?";
    }

    // Handle goodbyes
    else if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
      return "Goodbye! Have a great day!";
    }

    // Try to generate a personalized response based on user history
    const generatePersonalizedResponse = require("../user-memory").generatePersonalizedResponse;
    const personalizedResponse = generatePersonalizedResponse(context.userId);

    if (personalizedResponse) {
      // Occasionally insert a personalized message
      return personalizedResponse;
    }

    // Get topic-based response
    return this._getTopicResponse(context.currentTopic, message);
  }

  /**
   * Get topic-based response for default cases
   * @private
   */
  _getTopicResponse(topic, message) {
    const defaultResponses = {
      programming: [
        "That's an interesting programming topic. Do you have a specific language you prefer?",
        "Programming is fascinating! Are you working on a specific project?",
        "I'm always interested in talking about code. Any particular challenges you're facing?",
      ],
      web: [
        "Web development has evolved so much! Frontend or backend?",
        "The web is constantly changing. Are you working on a website currently?",
        "Web technologies are powerful tools. What framework do you prefer?",
      ],
      database: [
        "Databases are essential for most applications. SQL or NoSQL preference?",
        "Data management is crucial for scalable applications. Working on anything specific?",
        "I find data modeling quite interesting. What database systems do you work with?",
      ],
      wellbeing: [
        "I'm just a simple AI, but I'm functioning well! How can I assist you?",
        "I'm doing well, thanks for asking! How can I help you today?",
        "All systems operational! What can I do for you?",
        "I'm here and ready to help! What can I do for you today?",
      ],
      general: [
        "That's interesting. Can you tell me more?",
        "I'm not sure I understand. Could you rephrase that?",
        "I'm a simple AI assistant. I'm not sure how to respond to that.",
        "Interesting point! Would you like to elaborate on that?",
        "I'm still learning. Could you try asking something else?",
      ],
      // New predefined reactions for when AI doesn't understand
      confused: [
        "I'm sorry, but I didn't understand what you meant. Could you please rephrase that?",
        "I'm having trouble following. Could you try again with different wording?",
        "Hmm, I'm not sure what you're asking for. Can you be more specific?",
        "I didn't quite catch that. Could you explain in a different way?",
        "Sorry, I'm not understanding your request. Can you try breaking it down for me?",
      ],
      ambiguous: [
        "I'm not entirely sure what you're looking for. Could you provide more context?",
        "Your request could be interpreted in several ways. Can you clarify what you need?",
        "I'm having trouble determining your exact question. Could you be more specific?",
        "Your message is a bit unclear to me. Could you try being more precise?",
        "I'm not confident I understand your request correctly. Can you elaborate?",
      ],
    };

    // Handle ambiguous topic detection
    if (topic === "ambiguous") {
      // Get the top matching topics
      const message_length = message.length;
      const words_count = message.split(" ").length;

      // Check if message is very short or potentially ambiguous
      if (message_length < 5 || words_count < 2) {
        const confusedResponses = defaultResponses["confused"];
        const randomIndex = Math.floor(Math.random() * confusedResponses.length);
        return confusedResponses[randomIndex];
      }
      // Check if message is very long or complex (potentially confusing)
      else if (message_length > 150 || words_count > 30) {
        const ambiguousResponses = defaultResponses["ambiguous"];
        const randomIndex = Math.floor(Math.random() * ambiguousResponses.length);
        return ambiguousResponses[randomIndex];
      }
    }

    // Check if the message might be a misspelled command
    const suggestCommandCorrection = this.textProcessingUtils.suggestCommandCorrection;
    const commandSuggestion = suggestCommandCorrection(message);

    if (commandSuggestion) {
      return commandSuggestion;
    }

    // Default to topic responses
    const topicResponses = defaultResponses[topic] || defaultResponses["general"];
    const randomIndex = Math.floor(Math.random() * topicResponses.length);
    return topicResponses[randomIndex];
  }
}

module.exports = DefaultResponseBehavior;
