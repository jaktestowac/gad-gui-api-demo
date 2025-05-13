/**
 * Recommendation Behavior - Provides personalized recommendations based on user interests
 *
 * This behavior analyzes the user's topic history and provides tailored
 * recommendations for resources, activities, and topics.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class RecommendationBehavior extends BaseBehavior {
  constructor() {
    // Medium priority - above default but below knowledge base
    super("recommendation", 300);

    // Recommendation resources by topic
    this.recommendations = {
      javascript: [
        {
          type: "resource",
          name: "MDN JavaScript Documentation",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        },
        { type: "resource", name: "JavaScript.info", url: "https://javascript.info/" },
        { type: "activity", name: "Build a simple to-do app with JavaScript" },
        { type: "activity", name: "Create a small game using JavaScript Canvas API" },
        { type: "topic", name: "Learn about JavaScript promises and async/await" },
      ],
      python: [
        { type: "resource", name: "Official Python Documentation", url: "https://docs.python.org/" },
        { type: "resource", name: "Real Python Tutorials", url: "https://realpython.com/" },
        { type: "activity", name: "Build a data analysis project with pandas" },
        { type: "activity", name: "Create a web scraper with Beautiful Soup" },
        { type: "topic", name: "Explore Python's machine learning libraries like scikit-learn" },
      ],
      programming: [
        { type: "activity", name: "Contribute to an open-source project" },
        { type: "activity", name: "Implement a classic algorithm from scratch" },
        { type: "topic", name: "Learn about design patterns and when to apply them" },
      ],
      web: [
        { type: "resource", name: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web" },
        { type: "activity", name: "Create a simple API with Node.js and Express" },
        { type: "topic", name: "Learn about Progressive Web Apps (PWAs)" },
      ],
      frontend: [
        { type: "resource", name: "React Documentation", url: "https://reactjs.org/docs/getting-started.html" },
        { type: "activity", name: "Build a UI component library" },
        { type: "activity", name: "Create animations with CSS and JavaScript" },
        { type: "topic", name: "Explore modern CSS features like Custom Properties and Container Queries" },
      ],
      backend: [
        { type: "resource", name: "Node.js Documentation", url: "https://nodejs.org/en/docs/" },
        { type: "activity", name: "Build a RESTful API with authentication" },
        { type: "activity", name: "Implement a database with MongoDB or PostgreSQL" },
        { type: "topic", name: "Learn about serverless architecture and functions" },
      ],
      database: [
        { type: "resource", name: "SQL Tutorial on W3Schools", url: "https://www.w3schools.com/sql/" },
        { type: "activity", name: "Design a normalized database schema" },
        { type: "activity", name: "Build a data access layer for your application" },
        { type: "topic", name: "Compare SQL and NoSQL database approaches" },
      ],
      api: [
        { type: "resource", name: "OpenAPI Specification", url: "https://swagger.io/specification/" },
        { type: "resource", name: "Bruno API Documentation", url: "https://www.usebruno.com/" },
        { type: "resource", name: "RESTful API Design Guidelines", url: "https://restfulapi.net/" },
        { type: "activity", name: "Build an API that follows REST principles" },
        { type: "activity", name: "Create documentation for your API with Swagger" },
        { type: "topic", name: "Learn about GraphQL as an alternative to REST" },
      ],
      ai: [
        { type: "resource", name: "OpenAI API Documentation", url: "https://beta.openai.com/docs/" },
        { type: "resource", name: "OpenAI chatgpt", url: "https://openai.com/index/chatgpt/" },
        { type: "activity", name: "Build a chatbot using OpenAI's API" },
        { type: "activity", name: "Create a text summarization tool" },
        { type: "topic", name: "Explore ethical considerations in AI development" },
        { type: "topic", name: "Learn about bias in AI models" },
      ],
      "machine learning": [
        { type: "resource", name: "Scikit-learn Documentation", url: "https://scikit-learn.org/stable/" },
        { type: "activity", name: "Build a recommendation system" },
        { type: "activity", name: "Create a model to predict outcomes from tabular data" },
        { type: "topic", name: "Learn about feature engineering techniques" },
      ],
    };

    // Default recommendations for users with no topic history
    this.defaultRecommendations = [
      "If you're new to programming, I'd recommend starting with Python - it's beginner-friendly!",
      "Web development is a great place to start - you can quickly build visible results with HTML, CSS, and JavaScript.",
      "Consider exploring JavaScript - it's versatile for both frontend and backend development.",
      "Learning about databases is fundamental to many applications. SQL is a good starting point.",
      "If you're interested in data analysis, Python with libraries like pandas and matplotlib can be powerful.",
    ];

    // Trigger phrases that should activate this behavior
    this.triggerPhrases = [
      "recommend",
      "suggestion",
      "suggest",
      "what should i learn",
      "what should i read",
      "what should i study",
      "resources for",
      "materials for",
      "how to learn",
      "help me learn",
      "where to start with",
      "good resources",
    ];
  }
  /**
   * Check if this behavior can handle the message
   */
  canHandle(message, context) {
    const lowerMessage = context.lowerCaseMessage;

    // Check if this is a response to our topic question
    if (this._isResponseToTopicQuestion(context)) {
      return true;
    }

    // Check if message contains any trigger phrases
    for (const phrase of this.triggerPhrases) {
      if (lowerMessage.includes(phrase)) {
        return true;
      }
    }

    // Also handle explicit recommendation requests
    if (lowerMessage.startsWith("recommend") || lowerMessage.startsWith("suggest")) {
      return true;
    }

    // Check for direct topic mentions that we have in our recommendations
    const availableTopics = Object.keys(this.recommendations);
    for (const topic of availableTopics) {
      // Direct mention of a topic we have recommendations for
      if (
        lowerMessage === topic ||
        lowerMessage.includes(`about ${topic}`) ||
        lowerMessage.includes(`interested in ${topic}`)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handle the message with personalized recommendations
   */
  handle(message, context) {
    const lowerMessage = context.lowerCaseMessage;
    const userMem = context.userMemory;

    // Initialize topics array if needed
    if (!userMem.topics) {
      userMem.topics = [];
    }

    // Check if this is likely a response to our topic question
    const isDirectResponse = this._isResponseToTopicQuestion(context);

    // Try to extract specific topic from the message
    const requestedTopic = this._extractRequestedTopic(lowerMessage, context);

    if (requestedTopic && this.recommendations[requestedTopic]) {
      // User asked for a specific topic we have recommendations for
      return this._getTopicRecommendation(requestedTopic);
    } else if (isDirectResponse && lowerMessage.length > 0) {
      // Handle direct response to topic question
      const topicResponse = this._handleTopicResponse(message, context);
      if (topicResponse) {
        return topicResponse;
      }

      // If it seems like a response to our topic question, but we couldn't match it
      // to any known topic, provide a gentle response
      const unknownTopicResponses = [
        `I don't have specific recommendations for "${message.trim()}" yet, but I'm always learning! Would you like recommendations on a different topic like JavaScript, Python, or Web Development?`,
        `I'm not familiar with "${message.trim()}" yet. Would you be interested in recommendations for topics like Databases, APIs, or Machine Learning instead?`,
        `I don't have specialized content for "${message.trim()}" at the moment. May I suggest one of these topics instead: JavaScript, Python, Web Development, or Databases?`,
      ];

      return unknownTopicResponses[Math.floor(Math.random() * unknownTopicResponses.length)];
    } else if (userMem.topics && userMem.topics.length > 0) {
      // Use the user's topic history for personalized recommendations
      return this._getPersonalizedRecommendation(userMem.topics);
    } else {
      // Fallback to default recommendation
      return this._getDefaultRecommendation();
    }
  }

  /**
   * Extract requested topic from message
   * @private
   */
  _extractRequestedTopic(message, context) {
    // List of topics we have recommendations for
    const availableTopics = Object.keys(this.recommendations);

    // First check if it's a direct answer to "Do you have a specific topic you're interested in?"
    const isDirectResponse = this._isResponseToTopicQuestion(context);

    // If it's a direct response, treat the entire message as a potential topic
    if (isDirectResponse) {
      const cleanMessage = message
        .toLowerCase()
        .replace(/^(yes|yeah|yep|sure|i am interested in|i like|i love|i want to learn|i'd like to learn about)/i, "")
        .trim();

      // Check for exact topic match
      for (const topic of availableTopics) {
        if (cleanMessage === topic) {
          this._saveTopicToUserMemory(topic, context);
          return topic;
        }
      }

      // Check for topic contained within the cleaned message
      for (const topic of availableTopics) {
        if (cleanMessage.includes(topic)) {
          this._saveTopicToUserMemory(topic, context);
          return topic;
        }
      }

      // Try alternate matching for direct responses
      return this._findClosestTopicMatch(cleanMessage, availableTopics, context);
    }

    // Standard topic detection (existing logic plus improvements)
    for (const topic of availableTopics) {
      if (
        message.includes(` ${topic}`) ||
        message.includes(`${topic} `) ||
        message.includes(`about ${topic}`) ||
        message.includes(`for ${topic}`) ||
        message.includes(`in ${topic}`) ||
        message === topic // Added to match single-word responses
      ) {
        this._saveTopicToUserMemory(topic, context);
        return topic;
      }
    }

    return null;
  }

  /**
   * Check if the current message is likely a response to "Do you have a specific topic you're interested in?"
   * @private
   */
  _isResponseToTopicQuestion(context) {
    // Check if previous AI message asked for specific topic
    if (context.conversationHistory && context.conversationHistory.length > 1) {
      const recentMessages = context.getLatestMessages(2);

      // Check if last message was from AI and contained the topic question
      for (let i = recentMessages.length - 1; i >= 0; i--) {
        const msg = recentMessages[i];
        if (
          msg.role === "assistant" &&
          (msg.content.includes("Do you have a specific topic you're interested in?") ||
            msg.content.includes("Would you like more specific recommendations?") ||
            msg.content.includes("Would you like me to help you find resources for a different topic?"))
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Save detected topic to user memory
   * @private
   */
  _saveTopicToUserMemory(topic, context) {
    const userMem = context.userMemory;

    // Initialize topics array if it doesn't exist
    if (!userMem.topics) {
      userMem.topics = [];
    }

    // Only add if not already in the list
    if (!userMem.topics.includes(topic)) {
      userMem.topics.unshift(topic); // Add to front of array

      // Keep only the 5 most recent topics
      if (userMem.topics.length > 5) {
        userMem.topics = userMem.topics.slice(0, 5);
      }
    }
  }

  /**
   * Find the closest matching topic
   * @private
   */
  _findClosestTopicMatch(message, availableTopics, context) {
    // Import text processing utils from parent scope if available
    const textProcessingUtils = require("../text-processing");

    // Extract keywords from message
    const words = message.split(/\s+/);

    // Look for partial matches in topics
    for (const word of words) {
      if (word.length < 3) continue; // Skip short words

      for (const topic of availableTopics) {
        // Check if topic contains this word or word contains topic
        if (topic.includes(word) || word.includes(topic)) {
          this._saveTopicToUserMemory(topic, context);
          return topic;
        }
      }
    }

    // Try to match with Levenshtein distance if available
    if (textProcessingUtils && textProcessingUtils.normalizeMessage) {
      const normalizedTopic = textProcessingUtils.normalizeMessage(
        message,
        availableTopics,
        0.4 // More lenient threshold for topic matching
      );

      // If we got a normalized match from the available topics
      if (normalizedTopic && availableTopics.includes(normalizedTopic)) {
        this._saveTopicToUserMemory(normalizedTopic, context);
        return normalizedTopic;
      }
    }

    // Check topic keywords
    const topicKeywords = {
      javascript: ["js", "node", "react", "vue", "angular"],
      python: ["py", "django", "flask", "pandas", "numpy"],
      web: ["html", "css", "dom", "browser"],
      database: ["sql", "nosql", "mongodb", "postgres"],
      api: ["rest", "graphql", "endpoint", "request"],
      // Add more mappings as needed
    };

    // Check if any keyword matches a known topic
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          this._saveTopicToUserMemory(topic, context);
          return topic;
        }
      }
    }

    return null;
  }

  /**
   * Handle direct response to topic question
   * @private
   * @param {string} message - User message
   * @param {object} context - Message context
   * @returns {string|null} - Response or null if not applicable
   */
  _handleTopicResponse(message, context) {
    const lowerMessage = message.toLowerCase().trim();

    // Check if this is truly a response to our topic question
    if (!this._isResponseToTopicQuestion(context)) {
      return null;
    }

    // Check for non-specific positive response ("yes", etc)
    const positiveResponse = /^(yes|yeah|yep|sure|okay|ok|definitely|absolutely)$/i.test(lowerMessage);

    if (positiveResponse) {
      // User said yes but didn't specify a topic
      const suggestTopicsResponses = [
        "Great! Here are some topics I can recommend resources for: JavaScript, Python, Web Development, Databases, APIs, or Machine Learning. Which one interests you?",
        "Excellent! I can provide resources on topics like JavaScript, Python, Web Development, or AI. What are you most interested in?",
        "Perfect! I'd be happy to recommend resources. Would you prefer JavaScript, Python, Databases, or something else?",
      ];

      return suggestTopicsResponses[Math.floor(Math.random() * suggestTopicsResponses.length)];
    }

    // Check for negative response
    const negativeResponse = /^(no|nope|not really|not now|later)$/i.test(lowerMessage);

    if (negativeResponse) {
      // User is not interested in recommendations
      const acknowledgeResponses = [
        "No problem! Just let me know if you change your mind.",
        "That's fine! I'm here if you need any recommendations later.",
        "Sure thing! Feel free to ask me about something else.",
      ];

      return acknowledgeResponses[Math.floor(Math.random() * acknowledgeResponses.length)];
    }

    // For other responses, we'll use the standard topic extraction logic, which is handled in the main handle method
    return null;
  }

  /**
   * Get recommendations for a specific topic
   * @private
   */
  _getTopicRecommendation(topic) {
    const topicRecs = this.recommendations[topic];
    if (!topicRecs || topicRecs.length === 0) {
      return this._getDefaultRecommendation();
    }

    // Get one of each type of recommendation
    const resource = topicRecs.find((rec) => rec.type === "resource");
    const activity = topicRecs.find((rec) => rec.type === "activity");
    const topicSuggestion = topicRecs.find((rec) => rec.type === "topic");

    let response = `Here are my recommendations for ${topic}:\n\n`;

    if (resource) {
      response += `📚 Resource: ${resource.name}`;
      if (resource.url) {
        response += ` - ${resource.url}`;
      }
      response += "\n\n";
    }

    if (activity) {
      response += `🚀 Activity: ${activity.name}\n\n`;
    }

    if (topicSuggestion) {
      response += `💡 Explore this: ${topicSuggestion.name}\n\n`;
    }

    response += "Would you like more specific recommendations?";

    return response;
  }

  /**
   * Get personalized recommendations based on user's topic history
   * @private
   */
  _getPersonalizedRecommendation(userTopics) {
    // Find the first topic in user's history that we have recommendations for
    let matchedTopic = null;

    for (const topic of userTopics) {
      if (this.recommendations[topic]) {
        matchedTopic = topic;
        break;
      }
    }

    if (matchedTopic) {
      const intro = `Based on your interest in ${matchedTopic}, here's what I recommend:\n\n`;
      return intro + this._getTopicRecommendation(matchedTopic);
    } else {
      // If no match, use recent topic but with a general recommendation
      if (userTopics.length > 0) {
        const recentTopic = userTopics[userTopics.length - 1];

        return (
          `I noticed you're interested in ${recentTopic}. While I don't have specific recommendations for that yet, here are some general suggestions:\n\n` +
          "1. Look for official documentation for the technology\n" +
          "2. Find online tutorials or courses on platforms like Udemy, Coursera, or freeCodeCamp\n" +
          "3. Join communities like Stack Overflow or Reddit to connect with others\n" +
          "4. Build small projects to apply what you're learning\n\n" +
          "Would you like me to help you find resources for a different topic?"
        );
      } else {
        return this._getDefaultRecommendation();
      }
    }
  }

  /**
   * Get a default recommendation when no specific context is available
   * @private
   */
  _getDefaultRecommendation() {
    // Pick a random default recommendation
    const randomIndex = Math.floor(Math.random() * this.defaultRecommendations.length);
    return this.defaultRecommendations[randomIndex] + "\n\nDo you have a specific topic you're interested in?";
  }
}

module.exports = RecommendationBehavior;
