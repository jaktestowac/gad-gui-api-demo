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
    } // Get topic-based response
    return this._getTopicResponse(context.currentTopic, message, context);
  }

  /**
   * Get topic-based response for default cases
   * @private
   * @param {string} topic - The detected topic
   * @param {string} message - The user's message
   * @param {object} context - Message context
   * @returns {string} - Response message
   */
  _getTopicResponse(topic, message, context) {
    const defaultResponses = {
      programming: [
        "That's an interesting programming topic. Do you have a specific language you prefer? Perhaps JavaScript, Python, or something else?",
        "Programming is fascinating! Are you working on a specific project at the moment? What are you trying to build?",
        "I'm always interested in talking about code. Any particular challenges you're facing with your development work?",
        "Let's talk more about programming. Are you more interested in frontend, backend, or full-stack development?",
      ],
      web: [
        "Web development has evolved so much! Do you prefer working with frontend frameworks like React or Vue, or backend technologies?",
        "The web is constantly changing. Are you working on a website currently? What kind of site is it?",
        "Web technologies are powerful tools. Which framework are you using? React, Angular, Vue, or something else?",
        "When it comes to web development, are you more interested in UI/UX design or the underlying architecture?",
      ],
      database: [
        "Databases are essential for most applications. Do you prefer SQL or NoSQL solutions? Or perhaps a mix of both?",
        "Data management is crucial for scalable applications. Are you working on a specific database challenge? I'd love to hear about it.",
        "I find data modeling quite interesting. Which database systems do you work with? MySQL, PostgreSQL, MongoDB, or something else?",
        "When it comes to databases, what's more important to you: scalability, consistency, or query flexibility?",
      ],
      wellbeing: [
        "I'm just a simple AI, but I'm functioning well! How has your day been going so far?",
        "I'm doing well, thanks for asking! How can I make your day better today?",
        "All systems operational! What brings you here today? Anything specific you're working on?",
        "I'm here and ready to help! How are you doing? Is there something specific on your mind?",
      ],
      general: [
        "That's interesting. Can you tell me more about what you're trying to achieve?",
        "I'm not sure I fully understand. Could you rephrase that or provide some more details?",
        "I'd like to understand better. Could you share a bit more context about what you're working on?",
        "Interesting point! Would you like to elaborate on that? I'm curious to learn more.",
        "I'm eager to help, but could use a bit more information. What specifically are you looking for?",
      ], // Enhanced reactions for when Nova doesn't understand
      confused: [
        "I'm sorry, but I didn't quite understand what you meant. Could you please rephrase that? Or are you asking about programming, testing, or something else?",
        "I'm having trouble following. Could you try again with different wording? Maybe tell me if this is about web development, databases, or another topic?",
        "Hmm, I'm not sure what you're asking for. Can you be more specific? Are you looking for information, help with a problem, or just wanting to chat?",
        "I didn't quite catch that. Could you explain in a different way? Would it help if I suggested some topics we could discuss, like API testing or UI automation?",
        "Sorry, I'm not understanding your request fully. Could you try breaking it down for me? Or would you prefer to discuss one of our practice applications?",
      ],
      ambiguous: [
        "Your message could be interpreted in several ways. Are you interested in programming, testing, or using our practice applications?",
        "I'm not entirely sure what you're looking for. Could you clarify if you're asking about web development, databases, or something else?",
        "There are a few ways I could help with that. Would you prefer information about UI testing, API testing, or perhaps our Todo application?",
        "I'd love to help, but I need a bit more direction. Are you interested in frontend development, backend technologies, or testing methodologies?",
        "I want to make sure I address your needs correctly. Could you specify if you're looking for coding examples, testing strategies, or something entirely different?",
      ],
    }; // Handle ambiguous topic detection with improved topic suggestions
    if (topic === "ambiguous") {
      // Get the top matching topics
      const message_length = message.length;
      const words_count = message.split(" ").length;

      // Check if we have potential topics from context
      if (context && context.potentialTopics && context.potentialTopics.length > 0) {
        const topics = context.potentialTopics.slice(0, 3).join(", ");
        return `I'm not entirely sure what you're asking about. Could it be related to ${topics}, or something else? I'd love to understand better.`;
      }
      // Check if message is very short or potentially ambiguous
      else if (message_length < 5 || words_count < 2) {
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
      // Default response for ambiguous topics with choices
      else {
        return "I'm not quite sure what topic you're interested in. Would you like to discuss programming, web development, databases, or something else? I'm here to help!";
      }
    }

    // Check if the message might be a misspelled command
    const commandSuggestion = this.textProcessingUtils.suggestCommandCorrection(message);

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
