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
      userFeelings: [
        // Explicitly detect negated positive feelings
        /\bI('|'|)m not (good|great|happy|excited|fine|ok|okay|alright|better|fantastic|amazing|wonderful|excellent)\b/i,
        /\bI am not (good|great|happy|excited|fine|ok|okay|alright|better|fantastic|amazing|wonderful|excellent)\b/i,
        /\bI('|'|)m not feeling (good|great|happy|excited|fine|ok|okay|alright|better|fantastic|amazing|wonderful|excellent)\b/i,
        /\bI don('|'|)t feel (good|great|happy|excited|fine|ok|okay|alright|better|fantastic|amazing|wonderful|excellent)\b/i,

        // Positive feelings ensuring no negation
        /\bI('|'|)m feeling (?!not )(?!not-)(good|great|happy|excited|fine|ok|okay|alright|better|fantastic|amazing|wonderful|excellent|not bad)\b/i,
        /\bI('|'|)m (?!not )(?!not-)(good|great|happy|excited|fine|ok|okay|alright|better|fantastic|amazing|wonderful|excellent)\b/i,
        /\bI am (?!not )(?!not-)(good|great|happy|excited|fine|ok|okay|alright|better|fantastic|amazing|wonderful|excellent)\b/i,

        // Negative feelings
        /\bI('|'|)m feeling (bad|sad|upset|depressed|tired|exhausted|sick|terrible|awful|down|angry|mad|frustrated)\b/i,
        /\bI('|'|)m (bad|sad|upset|depressed|tired|exhausted|sick|terrible|awful|down|angry|mad|frustrated)\b/i,
        /\bI am (bad|sad|upset|depressed|tired|exhausted|sick|terrible|awful|down|angry|mad|frustrated)\b/i,

        // Doing/feeling patterns
        /\bI('|'|)m (doing|feeling) (good|great|fine|ok|okay|bad|sad|angry|tired)\b/i,
        /\bI am (doing|feeling) (good|great|fine|ok|okay|bad|sad|angry|tired)\b/i,
        /\bI('|'|)m not (doing|feeling) (good|great|fine|ok|okay)\b/i,
        /\bI am not (doing|feeling) (good|great|fine|ok|okay)\b/i,
        /\bI don('|'|)t (feel|feeling) (good|great|fine|ok|okay)\b/i,

        // Generic feeling expressions
        /\bI feel\b/i,
        /\bfeeling (good|bad|great|terrible|sad|happy|angry|tired|exhausted)\b/i,
        /\bnot feeling (good|great|well|fine|ok|okay)\b/i,
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
      laughter: [
        /\b(haha|hahaha|hehe|lol|lmao|rofl|lolz|😂|🤣)\b/i,
        /\b(funny|amusing|hilarious)\b/i,
        /\bthat('s| is| was) (funny|hilarious|amusing)\b/i,
        /\b(laugh|laughing|laughed)\b/i,
        /\byou('re| are) (funny|hilarious|amusing)\b/i,
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
   */
  handle(message, context) {
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
      case "userFeelings":
        return this._handleUserFeelings(message);
      case "opinions":
        return this._handleOpinions(message);
      case "compliments":
        return this._handleCompliments();
      case "time":
        return this._handleTime();
      case "laughter":
        return this._handleLaughter(message);
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
   */
  _handlePersonal(message) {
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
   */
  _handleOpinions(message) {
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
   * Handle laughter and humor expressions
   * @private
   * @param {string} message - The user's message
   * @returns {string} - Response to laughter
   */
  _handleLaughter(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Helper function to get random element from an array
    const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Check if this is a direct expression of laughter (haha, lol, etc)
    if (/\b(haha|hahaha|hehe|lol|lmao|rofl|lolz|😂|🤣)\b/i.test(lowerMessage)) {
      const laughterResponses = [
        "Glad you found that amusing! 😊",
        "I'm happy I could make you laugh!",
        "It's always good to share a laugh!",
        "Laughter is the best medicine, they say!",
        "Great to see you're having fun!",
        "😊 Humor makes conversations better, doesn't it?",
        "Haha! It's nice to keep things light-hearted.",
      ];
      return randomElement(laughterResponses);
    }
    // Check if user is saying something is funny
    else if (
      /\b(funny|amusing|hilarious)\b/i.test(lowerMessage) ||
      /\bthat('s| is| was) (funny|hilarious|amusing)\b/i.test(lowerMessage)
    ) {
      const funnyResponses = [
        "I'm glad you found that entertaining!",
        "Humor makes interactions more enjoyable, doesn't it?",
        "It's good to have a sense of humor about things!",
        "I try to keep things interesting! What else would you like to talk about?",
        "Happy to provide a bit of amusement! Anything else on your mind?",
      ];
      return randomElement(funnyResponses);
    }
    // Check if user is saying Nova is funny
    else if (/\byou('re| are) (funny|hilarious|amusing)\b/i.test(lowerMessage)) {
      const complimentResponses = [
        "Thank you! I do try to keep our conversations engaging.",
        "I appreciate that! I find a touch of humor makes conversations better.",
        "That's kind of you to say! What would you like to chat about next?",
        "Glad I could amuse you! What else would you like to discuss?",
        "Thanks for the compliment! I enjoy our interactions too.",
      ];
      return randomElement(complimentResponses);
    }
    // Generic humor-related response
    else {
      const genericResponses = [
        "Humor is such an interesting aspect of communication! What else is on your mind?",
        "A good laugh can really brighten the day. What would you like to talk about?",
        "I find humor fascinating! Is there something specific you'd like to discuss?",
        "It's nice to keep things light! What can I help you with today?",
      ];
      return randomElement(genericResponses);
    }
  }

  /**
   * Handle statements about user's feelings
   * @private
   * @param {string} message - The user's message
   * @returns {string} - Response to the user's feeling
   */ _handleUserFeelings(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Improved check for negated positive emotions - highest priority
    if (
      /\b(not|isn't|isnt|ain't|aint|don't feel|dont feel) (good|great|happy|excited|fine|ok|okay|alright|better|fantastic|amazing|wonderful|excellent)\b/i.test(
        lowerMessage
      ) ||
      /\bnot (good|great|happy|excited|fine|ok|okay|alright|well|wonderful|excellent)\b/i.test(lowerMessage) ||
      /\bnot feeling (good|great|happy|excited|fine|ok|okay|alright|well|wonderful|excellent)\b/i.test(lowerMessage)
    ) {
      const negativeResponses = [
        "I'm sorry to hear that. Is there anything I can do to help?",
        "I hope things get better for you soon. Would you like to talk about what's bothering you?",
        "That's tough. Sometimes talking about things can help - is there something specific on your mind?",
        "I'm here for you. Would you like some suggestions that might help you feel better?",
        "I'm sorry you're feeling that way. Would it help to talk about something to take your mind off it?",
      ];
      return negativeResponses[Math.floor(Math.random() * negativeResponses.length)];
    }
    // Check if the user is expressing positive emotions - ensuring no negations first
    else if (
      /\b(good|great|happy|excited|fine|ok|okay|alright|better|fantastic|amazing|wonderful|excellent|not bad)\b/i.test(
        lowerMessage
      ) &&
      !/(not|isn't|isnt|ain't|aint|don't|dont)\b.*\b(good|great|happy|excited|fine|ok|okay|alright|better|fantastic|amazing|wonderful|excellent)/i.test(
        lowerMessage
      )
    ) {
      const positiveResponses = [
        "I'm glad to hear you're feeling good! Is there anything specific making your day great?",
        "That's wonderful to hear! It's always nice to be in a good mood.",
        "I'm happy that you're feeling well! Anything exciting happening?",
        "Great to hear you're doing well! What's been going well for you lately?",
        "That's fantastic! Positive emotions are so important. Is there anything I can help you with today?",
      ];
      return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
    }
    // Check if the user is expressing negative emotions
    else if (
      /\b(bad|sad|upset|depressed|tired|exhausted|sick|terrible|awful|down|angry|mad|frustrated)\b/i.test(lowerMessage)
    ) {
      const negativeResponses = [
        "I'm sorry to hear that. Is there anything I can do to help?",
        "I hope things get better for you soon. Would you like to talk about what's bothering you?",
        "That's tough. Sometimes talking about things can help - is there something specific on your mind?",
        "I'm here for you. Would you like some suggestions that might help you feel better?",
        "I'm sorry you're feeling that way. Would it help to talk about something to take your mind off it?",
      ];
      return negativeResponses[Math.floor(Math.random() * negativeResponses.length)];
    }
    // Generic response for other feeling expressions
    else {
      const genericResponses = [
        "Thank you for sharing how you feel. How can I assist you today?",
        "I appreciate you letting me know. Is there anything you'd like to talk about?",
        "It's good to express how you're feeling. What's on your mind today?",
        "Thanks for sharing that with me. What would you like to discuss?",
        "I'm here to listen. What would you like to talk about next?",
      ];
      return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
  }
  /**
   * Handle very short messages
   * @private
   */ _handleShortMessage(message) {
    const lowerMessage = message.toLowerCase();

    // Helper function to get random element from an array
    const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Common expressions with randomized components throughout
    const openers = [
      "Great",
      "Fantastic",
      "Excellent",
      "Wonderful",
      "Perfect",
      "Awesome",
      "Brilliant",
      "Splendid",
      "Terrific",
    ];
    const acknowledgments = ["I see", "Got it", "I understand", "Understood", "Noted", "Fair enough", "All right"];
    const continuations = ["Would you like to", "Are you interested in", "Do you want to", "How about we", "Should we"];
    const activities = [
      "discuss",
      "talk about",
      "explore",
      "dive into",
      "learn about",
      "look at",
      "examine",
      "investigate",
    ];
    const timeframes = ["today", "right now", "at this moment", "at present", "currently"];
    const topics = ["topic", "subject", "matter", "idea", "concept", "project", "question", "issue", "challenge"];
    const emotions = ["glad", "happy", "pleased", "delighted", "thrilled"];
    const thankYouResponses = ["You're welcome", "My pleasure", "Happy to help", "Glad to assist", "No problem at all"];

    // Common short responses with multiple options for each
    if (/^(yes|yep|yeah|yup|sure)$/i.test(lowerMessage)) {
      // Create responses with multiple randomized components
      const responses = [
        `${randomElement(openers)}! Is there something specific you'd like to talk about or ask me?`,
        `${randomElement(openers)}! What can I ${randomElement(["help", "assist", "support"])} you with ${randomElement(
          timeframes
        )}?`,
        `${randomElement(openers)}! What would you like to ${randomElement(activities)}?`,
        `${randomElement(openers)}! I'm ${randomElement([
          "ready",
          "here",
          "available",
          "eager",
        ])} to assist. What's on your mind?`,
        `That's the ${randomElement(["spirit", "attitude", "approach"])}! ${randomElement(
          continuations
        )} ${randomElement(activities)} something ${randomElement(timeframes)}?`,
      ];
      return randomElement(responses);
    } else if (/^(no|nope|nah)$/i.test(lowerMessage)) {
      const closures = [
        "let me know if you need anything",
        "I'm here if you need assistance",
        "feel free to ask anytime",
        "don't hesitate to reach out",
      ];
      const responses = [
        `${randomElement(acknowledgments)}. ${randomElement([
          "Feel free to",
          "Please",
          "Don't hesitate to",
        ])} ${randomElement(closures)}!`,
        `${randomElement(["No problem", "That's fine", "Not an issue"])} at all. I'm here ${randomElement([
          "whenever",
          "if",
          "should",
        ])} you need ${randomElement(["assistance", "help", "support"])}.`,
        `${randomElement(["That's okay", "No worries", "All good"])}! Let me know if you ${randomElement([
          "change your mind",
          "need anything later",
          "have questions later",
        ])}.`,
        `${randomElement(acknowledgments)}! I'm here if you ${randomElement([
          "need",
          "require",
          "want",
        ])} ${randomElement(["anything else", "something different", "other assistance"])}.`,
        `${randomElement(acknowledgments)}. Is there ${randomElement([
          "something else",
          "another topic",
          "a different subject",
        ])} you'd ${randomElement(["prefer to talk about", "like to discuss", "be interested in exploring"])}?`,
      ];
      return randomElement(responses);
    } else if (/^(ok|okay|k|cool|nice|great|awesome)$/i.test(lowerMessage)) {
      // Create dynamic responses for acknowledgments
      const positiveFeedback = ["Glad to hear that", "Great to know", "Sounds good", "That's good", "Perfect"];
      const questions = [
        "Anything else on your mind?",
        "What else can I help with?",
        "Any other questions?",
        "What would you like to discuss next?",
        "What else are you curious about?",
      ];

      const responses = [
        `${randomElement(["Is there", "Are there", "Do you have"])} ${randomElement([
          "anything",
          "something",
          "any topics",
          "any questions",
        ])} ${randomElement(["else", "additional", "more"])} I can ${randomElement([
          "help with",
          "assist with",
          "address",
        ])} ${randomElement(timeframes)}?`,
        `${randomElement(positiveFeedback)}! ${randomElement(questions)}`,
        `${randomElement(openers)}! Do you have any other ${randomElement(topics)} you'd like to ${randomElement(
          activities
        )}?`,
        `${randomElement(openers)}! What ${randomElement([
          "else",
          "other things",
          "other topics",
        ])} would you like to ${randomElement(["know", "learn about", "discuss"])}?`,
        `${randomElement(openers)}! I'm ${randomElement([
          "ready",
          "prepared",
          "here",
          "available",
        ])} to help with ${randomElement(["anything", "whatever", "any questions"])} else you might ${randomElement([
          "need",
          "have",
          "want to discuss",
        ])}.`,
      ];
      return randomElement(responses);
    } else if (/^(thanks|thank you|thx)$/i.test(lowerMessage)) {
      // Create highly randomized thank you responses
      const welcomePhrases = ["You're welcome", "My pleasure", "Happy to help", "Anytime", "No problem"];
      const offerMore = [
        "Let me know if you need anything else",
        "Feel free to ask more questions",
        "I'm here if you need more assistance",
        "Don't hesitate to ask for more help",
      ];

      const responses = [
        `${randomElement(welcomePhrases)}! ${randomElement([
          "Happy to help",
          "Glad to assist",
          "Pleased to be of service",
        ])} ${randomElement(["anytime", "always", "whenever you need"])}.`,
        `${randomElement(["My", "It's my", "It was my"])} ${randomElement([
          "pleasure",
          "joy",
          "delight",
          "honor",
        ])}! ${randomElement(offerMore)}.`,
        `${randomElement(["Anytime", "Of course", "Certainly", "Absolutely"])}! That's ${randomElement([
          "what I'm here for",
          "why I'm here",
          "my purpose",
          "what I do",
        ])}.`,
        `You're ${randomElement(["very", "most", "so", "quite"])} welcome! ${randomElement([
          "Need",
          "Would you like",
          "Do you need",
          "Can I offer",
        ])} ${randomElement(["help", "assistance", "guidance"])} with anything else?`,
        `${randomElement(["Glad", "Happy", "Pleased"])} I could ${randomElement([
          "help",
          "assist",
          "be of service",
        ])}! Feel free to ${randomElement(["ask", "reach out", "inquire"])} if you have ${randomElement([
          "more",
          "additional",
          "other",
          "any more",
        ])} questions.`,
      ];
      return randomElement(responses);
    } else if (/^(wow|amazing|impressive)$/i.test(lowerMessage)) {
      // Create more varied responses for expressions of amazement
      const gratitude = [
        "Thank you",
        "I appreciate that",
        "Thanks for saying so",
        "That's kind of you",
        "I'm flattered",
      ];
      const offers = [
        "What else can I help with?",
        "How else can I assist?",
        "What other questions do you have?",
        "What else would you like to explore?",
        "What other topics interest you?",
      ];

      const responses = [
        `I'm ${randomElement(emotions)} you ${randomElement([
          "think so",
          "feel that way",
          "believe so",
          "have that impression",
        ])}! ${randomElement(["Anything", "What", "Is there anything"])} else you'd like to ${randomElement([
          "know",
          "discuss",
          "talk about",
          "explore",
        ])}?`,
        `${randomElement(gratitude)}! ${randomElement(offers)}`,
        `That's ${randomElement(["kind", "nice", "thoughtful", "generous"])} of you to say! ${randomElement([
          "Would you like to",
          "Should we",
          "Are you interested to",
        ])} ${randomElement(["explore", "discuss", "dive into", "learn about"])} ${randomElement([
          "more",
          "something else",
          "other topics",
          "another subject",
        ])}?`,
        `I ${randomElement(["aim", "strive", "try", "work"])} to ${randomElement([
          "impress",
          "excel",
          "be helpful",
          "provide good assistance",
        ])}! What other ${randomElement(topics)} ${randomElement([
          "interest",
          "intrigue",
          "fascinate",
          "appeal to",
        ])} you?`,
        `${randomElement(["Thanks", "Thank you", "I appreciate"])} for the ${randomElement([
          "enthusiasm",
          "positivity",
          "kind words",
          "encouragement",
        ])}! Is there ${randomElement(["something", "anything", "a topic", "a subject"])} ${randomElement([
          "specific",
          "particular",
          "certain",
        ])} you're ${randomElement(["curious", "wondering", "interested"])} about?`,
      ];
      return randomElement(responses);
    } else if (/^(why|what|how|who|when|where)$/i.test(lowerMessage)) {
      // Create more elaborate responses for one-word questions
      const askForMore = [
        "Could you elaborate",
        "Would you mind expanding",
        "Can you provide more information",
        "Would you share more details",
        "Could you tell me more",
      ];
      const questionTypes = ["question", "inquiry", "query", "topic", "subject"];
      const helpResponses = [
        "I'd be happy to help",
        "I can provide a better response",
        "I can give you a thorough answer",
        "I'll be able to assist properly",
        "I can offer useful information",
      ];

      const responses = [
        `${randomElement(askForMore)} on your ${randomElement(questionTypes)}? ${randomElement(
          helpResponses
        )} with ${randomElement(["more details", "additional context", "more information", "a complete picture"])}.`,
        `I'd ${randomElement(["need", "require", "benefit from"])} a bit more ${randomElement([
          "information",
          "context",
          "details",
          "specifics",
        ])} to ${randomElement(["answer", "respond", "address this"])} ${randomElement([
          "properly",
          "appropriately",
          "thoroughly",
          "completely",
        ])}. Can you be more ${randomElement(["specific", "precise", "detailed", "clear"])}?`,
        `That's a ${randomElement([
          "great",
          "good",
          "excellent",
          "solid",
        ])} starting point! Could you add some ${randomElement([
          "context",
          "details",
          "specifics",
          "background",
          "information",
        ])}?`,
        `${randomElement(["Interesting", "Thought-provoking", "Good", "Great"])} ${randomElement(
          questionTypes
        )}! Could you ${randomElement(["provide", "share", "give me"])} more ${randomElement([
          "details",
          "specifics",
          "information",
        ])} so I can ${randomElement(["give", "provide", "offer"])} you a ${randomElement([
          "helpful",
          "useful",
          "informative",
          "valuable",
        ])} answer?`,
        `I'd ${randomElement(["love", "be happy", "be delighted"])} to ${randomElement([
          "answer",
          "address",
          "respond to",
        ])} that. Could you ${randomElement([
          "expand on",
          "elaborate on",
          "tell me more about",
          "provide more context about",
        ])} what you're ${randomElement(["asking about", "interested in", "curious about", "wondering about"])}?`,
      ];
      return randomElement(responses);
    }

    // Check for simple feeling expressions with randomized components
    else if (/^(good|great|fine|happy|excellent)$/i.test(lowerMessage)) {
      // More varied responses for positive feelings
      const positiveReactions = ["glad to hear", "happy to know", "pleased that", "delighted that", "thrilled that"];
      const positiveStates = ["feeling good", "in a good mood", "feeling positive", "doing well", "feeling happy"];
      const positiveEffects = [
        "makes for great conversations",
        "leads to productive discussions",
        "is wonderful to hear",
        "brightens the day",
        "creates good energy",
      ];
      const nextActions = [
        "help you with",
        "assist you with",
        "support you on",
        "chat with you about",
        "explore with you",
      ];

      const responses = [
        `I'm ${randomElement(positiveReactions)} you're ${randomElement(
          positiveStates
        )}! Is there anything I can ${randomElement(nextActions)} ${randomElement(timeframes)}?`,
        `That's ${randomElement([
          "wonderful",
          "fantastic",
          "great",
          "excellent",
          "splendid",
        ])} to hear! What are you interested in ${randomElement(activities)} ${randomElement(timeframes)}?`,
        `${randomElement(openers)}! ${randomElement([
          "Happy people",
          "Positive energy",
          "Good moods",
          "Positive attitudes",
        ])} ${randomElement(positiveEffects)}. What's on your mind?`,
        `${randomElement(emotions)} to ${randomElement([
          "hear that",
          "know that",
          "learn that",
        ])}! What would you like to ${randomElement(["talk about", "discuss", "explore", "dive into"])}?`,
        `${randomElement([
          "Fantastic",
          "Wonderful",
          "Marvelous",
          "Terrific",
          "Excellent",
        ])}! A positive mood is the ${randomElement(["perfect", "ideal", "best", "right"])} time to ${randomElement([
          "explore new ideas",
          "have great conversations",
          "discuss interesting topics",
          "learn something new",
        ])}. Anything ${randomElement(["specific", "particular", "special"])} you'd like to ${randomElement([
          "discuss",
          "talk about",
          "explore",
        ])}?`,
      ];
      return randomElement(responses);
    } else if (/^(bad|sad|tired|exhausted|upset|angry)$/i.test(lowerMessage)) {
      // More varied responses for negative feelings
      const sympathyPhrases = [
        "I'm sorry to hear that",
        "That sounds difficult",
        "I understand that's tough",
        "I sympathize with you",
        "That must be challenging",
      ];
      const supportTypes = [
        "chat about something else",
        "help with a problem",
        "find a solution",
        "talk through things",
        "discuss something more pleasant",
        "take your mind off things",
        "focus on something positive",
        "explore ways to feel better",
      ];
      const presencePhrases = [
        "I'm here for you",
        "I'm listening",
        "I'm with you",
        "I'm ready to help",
        "I'm present for you",
      ];
      const offerPhrases = [
        "Would it help to",
        "Maybe we could",
        "Perhaps you'd like to",
        "Would you prefer to",
        "We could try to",
      ];

      const responses = [
        `${randomElement(sympathyPhrases)}. ${randomElement([
          "Is there anything",
          "Is there something",
          "What can I do",
          "How can I help",
        ])} I can ${randomElement(["do to help", "help with", "assist with", "do for you"])}?`,
        `${randomElement(["I understand", "I know", "I recognize", "I see"])}, ${randomElement([
          "those feelings",
          "such emotions",
          "feeling that way",
          "that mood",
        ])} can be ${randomElement(["tough", "difficult", "challenging", "hard"])}. ${randomElement(
          offerPhrases
        )} ${randomElement(supportTypes)}?`,
        `${randomElement(presencePhrases)}. Would you like to ${randomElement([
          "talk about",
          "discuss",
          "share",
        ])} what's ${randomElement(["bothering you", "troubling you", "on your mind", "causing those feelings"])}?`,
        `${randomElement([
          "That's not great",
          "That's unfortunate",
          "I'm sorry to hear that",
          "That sounds difficult",
        ])}. ${randomElement(offerPhrases)} ${randomElement([
          "talk about something",
          "discuss topics",
          "focus on things",
        ])} to ${randomElement([
          "take your mind off things",
          "help you feel better",
          "lift your spirits",
          "shift your focus",
        ])}?`,
        `${randomElement(sympathyPhrases)}. ${randomElement(offerPhrases)} ${randomElement([
          "chat about",
          "discuss",
          "explore",
          "talk through",
        ])} something ${randomElement(["more pleasant", "more positive", "more uplifting", "different", "else"])}?`,
      ];
      return randomElement(responses);
    } // Generic response for other short messages with maximum randomization
    const genericIntros = [
      "I see",
      "Got it",
      "Understood",
      "Noted",
      "I understand",
      "Interesting",
      "Hmm",
      "Alright",
      "Okay",
      "Sure",
    ];
    const genericTransitions = [
      "is there anything",
      "would you like",
      "do you have something",
      "are you interested in",
      "would you prefer",
      "are there topics",
    ];
    const genericActions = [
      "discuss",
      "talk about",
      "explore",
      "know about",
      "learn about",
      "dive into",
      "address",
      "investigate",
      "examine",
    ];
    const genericQualities = [
      "specific",
      "particular",
      "certain",
      "special",
      "additional",
      "interesting",
      "important",
      "relevant",
    ];
    const genericEndings = [
      "you'd like to discuss?",
      "on your mind?",
      "you're curious about?",
      "you'd like to know?",
      "you're wondering about?",
      "you'd like help with?",
    ];

    // Create highly randomized responses with multiple variable components
    const genericOptions = [
      `${randomElement(genericIntros)}. ${randomElement(["Is there anything", "Is there something"])} ${randomElement(
        genericQualities
      )} you'd like to ${randomElement(genericActions)} or ask about?`,
      `${randomElement(genericIntros)}. What's ${randomElement([
        "on your mind",
        "in your thoughts",
        "of interest to you",
        "something you're curious about",
      ])} ${randomElement(timeframes)}?`,
      `${randomElement(genericIntros)}. What would you like to ${randomElement(genericActions)} ${randomElement([
        "next",
        "now",
        "going forward",
        "from here",
      ])}?`,
      `I'm ${randomElement(["here", "available", "ready", "prepared", "available"])} and ${randomElement([
        "ready",
        "eager",
        "happy",
        "pleased",
      ])} to ${randomElement(["help", "assist", "support", "guide"])}. What would you like to ${randomElement([
        "know",
        "learn",
        "discuss",
        "talk about",
      ])}?`,
      `${randomElement(genericIntros)}! ${randomElement(genericTransitions)} a ${randomElement(
        topics
      )} you'd like to ${randomElement(genericActions)} ${randomElement([
        "further",
        "more",
        "in detail",
        "specifically",
      ])}?`,
      `${randomElement(genericIntros)}. ${randomElement([
        "I'm curious",
        "I'm interested",
        "I'd like to know",
        "I'm wondering",
      ])} - ${randomElement(genericEndings)}`,
      `${randomElement(genericIntros)}. ${randomElement(["Perhaps", "Maybe", "Possibly"])} there's ${randomElement([
        "a topic",
        "a subject",
        "something",
        "an area",
      ])} ${randomElement(genericQualities)} ${randomElement(genericEndings)}`,
      `${randomElement(genericIntros)}. ${randomElement([
        "Feel free to",
        "Don't hesitate to",
        "Please",
      ])} ${randomElement(["share", "tell me", "let me know"])} if there's ${randomElement([
        "anything",
        "something",
        "any topic",
      ])} ${randomElement(genericQualities)} ${randomElement(genericEndings)}`,
    ];

    return randomElement(genericOptions);
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
