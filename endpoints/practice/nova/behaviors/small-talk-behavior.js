/**
 * Small Talk Behavior - Handles realistic conversational small talk
 *
 * This behavior manages natural conversational exchanges like greetings,
 * personal questions, opinions, weather talk, and farewells.
 */

const BaseBehavior = require("./base-behavior");

class SmallTalkBehavior extends BaseBehavior {
  constructor() {
    // Small talk has medium priority, between utility and knowledge base
    super("small-talk", 750);

    // Define patterns for various small talk categories
    this.patterns = {
      greetings: [
        /\b(hello|hi|hey|hi there|greetings|good morning|good afternoon|good evening|howdy|what's up|what is your name)\b/i,
        /\bhow are you\b/i,
        /\bnice to (meet|see) you\b/i,
      ],
      farewells: [
        /\b(goodbye|bye|see you( later)?|farewell|have a (good|nice) (day|evening|night)|take care)\b/i,
        /\bsee you (tomorrow|later|soon)\b/i,
      ],
      weather: [
        /\b(weather|temperature|forecast|rain|sunny|cloudy|snow|cold|hot|warm)\b/i,
        /\bhow(s|'s| is) the weather\b/i,
        /\b(beautiful|terrible|nice|bad) (day|weather)\b/i,
      ],
      personal: [
        /\bwhat(s|'s| is) your name\b/i,
        /\btell me about yourself\b/i,
        /\bwho are you\b/i,
        /\bwhat do you (like|enjoy|love)\b/i,
        /\bwhat(s|'s| is) your favorite\b/i,
        /\bhow (old|young) are you\b/i,
        /\bwhere are you from\b/i,
      ],
      feelings: [
        /\bhow are you( doing| feeling)?\b/i,
        /\bhow(s|'s| is) it going\b/i,
        /\bhow(s|'s| is) your day\b/i,
        /\bare you (ok|okay|alright|fine)\b/i,
      ],
      opinions: [
        /\bwhat do you think (about|of)\b/i,
        /\byour (thoughts|opinion) on\b/i,
        /\bdo you (like|enjoy|love|hate|prefer)\b/i,
      ],
      compliments: [
        /\b(you are|you're) (smart|intelligent|clever|nice|helpful|amazing|awesome|great)\b/i,
        /\bi (like|love|enjoy) talking (to|with) you\b/i,
        /\bthanks?\b/i,
        /\bthank you\b/i,
        /\byou('re| are) (the best|wonderful)\b/i,
      ],
      time: [
        /\bwhat time is it\b/i,
        /\bwhat(s|'s| is) the time\b/i,
        /\bwhat(s|'s| is) today(s|'s| is) date\b/i,
        /\bwhat day is (it|today)\b/i,
      ],
    };
  }

  /**
   * Check if this behavior can handle the message
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior can handle the message
   */
  canHandle(message, context) {
    const lowerMessage = context.lowerCaseMessage;

    // Check each category of patterns
    for (const category in this.patterns) {
      for (const pattern of this.patterns[category]) {
        if (pattern.test(lowerMessage)) {
          context.smallTalkCategory = category;
          return true;
        }
      }
    }

    // Check for very short messages (1-3 words) which are often small talk
    const wordCount = lowerMessage.split(/\s+/).length;
    if (wordCount <= 3 && wordCount > 0) {
      context.smallTalkCategory = "short";
      return true;
    }

    return false;
  }

  /**
   * Handle the small talk message
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - The response
   */ handle(message, context) {
    const category = context.smallTalkCategory;
    const userMem = context.userMemory || {};

    // Handle based on detected category
    switch (category) {
      case "greetings":
        return this._handleGreetings(message, userMem);
      case "farewells":
        return this._handleFarewells(userMem);
      case "weather":
        return this._handleWeather();
      case "personal":
        return this._handlePersonal(message);
      case "feelings":
        return this._handleFeelings();
      case "opinions":
        return this._handleOpinions(message);
      case "compliments":
        return this._handleCompliments();
      case "time":
        return this._handleTime();
      case "short":
        return this._handleShortMessage(message);
      default:
        return this._getDefaultSmallTalkResponse();
    }
  }

  /**
   * Handle greeting messages
   * @private
   */
  _handleGreetings(message, userMem) {
    const greetings = [
      "Hello there!",
      "Hi! How can I help you today?",
      "Hey! Nice to chat with you.",
      "Greetings! How are you doing?",
      "Hello! It's good to hear from you.",
    ];

    // Add name to greeting if we know it
    if (userMem && userMem.name) {
      const personalGreetings = [
        `Hi ${userMem.name}! How's your day going?`,
        `Hello ${userMem.name}! It's great to see you again.`,
        `Hey there ${userMem.name}! What can I help you with today?`,
      ];
      greetings.push(...personalGreetings);
    }

    // Check for time-based greetings
    if (/good morning/i.test(message)) {
      return "Good morning! How can I brighten your day?";
    } else if (/good afternoon/i.test(message)) {
      return "Good afternoon! How is your day going so far?";
    } else if (/good evening/i.test(message)) {
      return "Good evening! I hope you had a wonderful day.";
    } else if (/how are you/i.test(message)) {
      return this._handleFeelings();
    }

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Handle farewell messages
   * @private
   */
  _handleFarewells(userMem) {
    const farewells = [
      "Goodbye! Have a great day!",
      "See you later! Take care!",
      "Bye for now! Feel free to chat anytime.",
      "Farewell! It was nice talking with you.",
      "Take care! Looking forward to our next conversation.",
    ];

    // Add name to farewell if we know it
    if (userMem && userMem.name) {
      const personalFarewells = [
        `Goodbye ${userMem.name}! Have a wonderful day!`,
        `Take care ${userMem.name}! Chat with you soon!`,
      ];
      farewells.push(...personalFarewells);
    }

    return farewells[Math.floor(Math.random() * farewells.length)];
  }

  /**
   * Handle weather-related messages
   * @private
   */
  _handleWeather() {
    const weatherResponses = [
      "I'm not able to check the current weather, but I hope it's nice where you are!",
      "I don't have access to real-time weather data, but I'd love to hear about the weather in your area.",
      "Weather talk is always a good conversation starter! How's the weather where you are?",
      "I wish I could look out a window and tell you about the weather! How is it looking out there?",
      "Weather is fascinating, isn't it? I'd love to know what it's like where you are right now.",
    ];

    return weatherResponses[Math.floor(Math.random() * weatherResponses.length)];
  }

  /**
   * Handle personal questions about Nova
   * @private
   */ _handlePersonal(message) {
    if (/what(s|'s| is) your name/i.test(message) || /who are you/i.test(message)) {
      return "I'm Nova, an AI assistant designed to help with a variety of tasks and have pleasant conversations.";
    } else if (/how old are you/i.test(message)) {
      return "I don't have an age in the traditional sense. I was created recently but I'm constantly learning!";
    } else if (/where are you from/i.test(message)) {
      return "I exist in the digital realm - you could say I'm from the internet! I was created by a team of developers.";
    } else if (/what do you (like|enjoy|love)/i.test(message) || /what(s|'s| is) your favorite/i.test(message)) {
      const favorites = [
        "I enjoy helping people solve problems and having interesting conversations!",
        "I like learning new things and sharing information. What about you?",
        "I'm quite fond of interesting questions and thoughtful conversations.",
        "I enjoy analyzing data and helping people find the information they need.",
      ];
      return favorites[Math.floor(Math.random() * favorites.length)];
    } else {
      return "I'm Nova, an AI assistant. I'm here to help answer questions, have conversations, and assist with various tasks.";
    }
  }

  /**
   * Handle feeling-related questions
   * @private
   */
  _handleFeelings() {
    const feelingResponses = [
      "I'm doing well, thank you for asking! How are you today?",
      "I'm functioning optimally! How about yourself?",
      "I'm great! Always ready to help and chat. How are you doing?",
      "I'm doing fine! I appreciate you checking in. How's your day going?",
      "All systems operational and ready to assist! How are you feeling today?",
    ];

    return feelingResponses[Math.floor(Math.random() * feelingResponses.length)];
  }

  /**
   * Handle opinion questions
   * @private
   */ _handleOpinions(message) {
    // Extract what they're asking about
    let topic = "";
    // Normalize message for better matching (remove apostrophes)
    const normalizedMessage = message.replace(/[']/g, "");

    if (normalizedMessage.includes("think about") || normalizedMessage.includes("think of")) {
      topic = normalizedMessage.split(/think (about|of)/i)[1].trim();
    } else if (normalizedMessage.includes("opinion on")) {
      topic = normalizedMessage.split(/opinion on/i)[1].trim();
    } else if (normalizedMessage.includes("do you like") || normalizedMessage.includes("do you enjoy")) {
      const match = normalizedMessage.match(/do you (like|enjoy|love|hate|prefer) (.+)/i);
      if (match) topic = match[2].trim();
    }

    if (topic) {
      const opinions = [
        `That's an interesting topic! ${topic} is something I find fascinating to learn about.`,
        `I'm always interested in expanding my knowledge about topics like ${topic}.`,
        `${topic} is certainly an interesting subject! I'd love to hear your thoughts on it.`,
        `I don't have personal opinions in the way humans do, but I can say ${topic} is a topic worth exploring.`,
      ];
      return opinions[Math.floor(Math.random() * opinions.length)];
    } else {
      return "I don't have personal opinions in the same way humans do, but I'm always eager to learn and discuss different perspectives!";
    }
  }

  /**
   * Handle compliments
   * @private
   */
  _handleCompliments() {
    const complimentResponses = [
      "Thank you! That's very kind of you to say.",
      "I appreciate your kind words! I'm here to help.",
      "That's so nice of you! I'm just doing my best to be helpful.",
      "Thank you for the compliment! It's my pleasure to assist you.",
      "You're too kind! I'm glad I could be of help.",
    ];

    return complimentResponses[Math.floor(Math.random() * complimentResponses.length)];
  }

  /**
   * Handle time-related questions
   * @private
   */
  _handleTime() {
    const now = new Date();

    // Format the date and time
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

    return `Currently, it's ${timeString} on ${dayOfWeek}, ${dateString}. Keep in mind that this is based on the server's time zone.`;
  }

  /**
   * Handle very short messages
   * @private
   */
  _handleShortMessage(message) {
    const lowerMessage = message.toLowerCase();

    // Common short responses
    if (/^(yes|yep|yeah|yup|sure)$/i.test(lowerMessage)) {
      return "Great! Is there something specific you'd like to talk about or ask me?";
    } else if (/^(no|nope|nah)$/i.test(lowerMessage)) {
      return "Alright then. Feel free to let me know if you need anything!";
    } else if (/^(ok|okay|k|cool|nice|great|awesome)$/i.test(lowerMessage)) {
      return "Is there anything else I can help you with today?";
    } else if (/^(thanks|thank you|thx)$/i.test(lowerMessage)) {
      return "You're welcome! Happy to help anytime.";
    } else if (/^(wow|amazing|impressive)$/i.test(lowerMessage)) {
      return "I'm glad you think so! Anything else you'd like to know or discuss?";
    } else if (/^(why|what|how|who|when|where)$/i.test(lowerMessage)) {
      return "Could you elaborate on your question? I'd be happy to help with more details.";
    }

    // Generic response for other short messages
    return "I see. Is there anything specific you'd like to discuss or ask about?";
  }

  /**
   * Default small talk response
   * @private
   */
  _getDefaultSmallTalkResponse() {
    const defaultResponses = [
      "That's interesting! What would you like to talk about next?",
      "I see. Is there something specific you'd like to chat about?",
      "I'm here to chat about whatever's on your mind. What interests you today?",
      "I'd love to continue our conversation. What would you like to discuss?",
      "That's a good point. Is there anything else you'd like to talk about?",
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }
}

module.exports = SmallTalkBehavior;
