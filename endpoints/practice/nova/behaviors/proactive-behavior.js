/**
 * Proactive Behavior - Enables Nova to initiate conversations
 *
 * This behavior allows Nova to occasionally start new topics or ask questions
 * rather than always being reactive. It makes conversations feel more natural
 * by simulating how humans proactively engage in dialogue.
 *
 * Enhanced to understand and process user responses to proactive questions.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class ProactiveBehavior extends BaseBehavior {
  constructor() {
    // Medium-high priority to ensure it can interrupt other behaviors
    super("proactive", 780);
    this.lastProactiveTime = 0;
    this.proactiveThreshold = 4; // Lower threshold for more frequent proactivity
    this.proactiveChance = 0.25; // Increased chance to be proactive

    // Feature descriptions to use when users ask about new features
    this.featureDescriptions = [
      {
        name: "Practice Pages",
        description:
          'Our Practice Pages at <a href="/practice/" target="_blank" rel="noopener">/practice/</a> provide a hands-on environment for exploring various features and functionalities to practice test automation. ',
        usage:
          'Visit <a href="/practice/" target="_blank" rel="noopener">/practice/</a> to explore the different practice pages. Each page has a unique feature, such as a Todo App, Data Grid with Pagination, or Session Management. You can interact with these features to see how they work and understand their capabilities.',
      },
      {
        name: "Todo App",
        description:
          "Our advanced Todo App helps you organize tasks with multiple priority levels, deadlines, and filtering options. With six different versions offering increasingly advanced capabilities, you can manage everything from simple to-do lists to complex project planning with time tracking.",
        usage:
          'Visit <a href="/practice/todoapp/" target="_blank" rel="noopener">/practice/todoapp/</a> to access the Todo App. Choose from versions v1 through v6 based on your needs. Add, edit, and delete tasks easily, use drag-and-drop in v4, try grid view in v5, or explore advanced time tracking in v6. Filter tasks by status, priority, or deadline to focus on what matters most.',
      },
      {
        name: "Websocket Chat",
        description:
          "Our Websocket Chat feature allows you to experience real-time communication in a chat application. You can send and receive messages instantly, making it perfect for testing chat functionalities in your applications. Want to know how?",
        usage:
          'Visit <a href="/practice/websocket-chat-v1.html" target="_blank" rel="noopener">/practice/websocket-chat-v1.html</a> to access the Websocket Chat feature. You can join chat rooms, send messages, and see real-time updates from other users. This is a great way to test your chat application\'s performance and responsiveness.',
      },
    ];

    // Topic mapping between conversation starters and related topics/behaviors
    this.topicBehaviorMapping = {
      programming: ["knowledge-base", "utility"],
      web: ["knowledge-base", "utility"],
      database: ["knowledge-base", "utility"],
      games: ["game"],
      general: ["default-response"],
    }; // Define enhanced conversation starters by category with improved question structure
    // and expected response patterns to better handle user responses
    this.conversationStarters = {
      general: [
        {
          text: "By the way, I was wondering if you've heard about our new feature that was just released? It might be helpful for what you're working on.",
          expectedResponseTypes: ["yes/no", "question", "information"],
        },
        {
          text: "While we're talking, I should mention that there's a helpful tutorial on this topic you might find interesting. Would you like to know more about it?",
          expectedResponseTypes: ["yes/no", "question"],
        },
        {
          text: "I'm curious - have you tried the interactive examples in our documentation? They can be really helpful for understanding how things work.",
          expectedResponseTypes: ["yes/no", "experience"],
        },
        {
          text: "Just wondering, what brings you here today? Is there a specific problem you're trying to solve or are you exploring our features?",
          expectedResponseTypes: ["purpose", "question"],
        },
        {
          text: "I'm here to help with whatever you need. Is there a specific area you'd like to explore? Perhaps testing APIs, automating UIs, or building web applications?",
          expectedResponseTypes: ["topic", "question", "preference"],
        },
      ],
      programming: [
        {
          text: "I noticed we've been discussing programming. Do you have a favorite language? I'm curious whether you prefer JavaScript, Python, Java, or something else entirely.",
          expectedResponseTypes: ["preference", "language"],
        },
        {
          text: "Have you been working on any interesting coding projects lately? I'd love to hear what kind of applications or systems you're building.",
          expectedResponseTypes: ["yes/no", "project", "description"],
        },
        {
          text: "What development environment do you prefer to use? Are you a VS Code fan, or do you prefer other IDEs like IntelliJ, WebStorm, or something else?",
          expectedResponseTypes: ["tool", "preference"],
        },
        {
          text: "Are you more into frontend or backend development? Or perhaps you enjoy full-stack work? Each has its own unique challenges and rewards.",
          expectedResponseTypes: ["preference", "explanation"],
        },
        {
          text: "Have you tried any new programming tools or frameworks recently? The landscape is always changing with exciting new technologies.",
          expectedResponseTypes: ["yes/no", "tool", "experience"],
        },
      ],

      web: [
        {
          text: "Have you been exploring any new web frameworks lately?",
          expectedResponseTypes: ["yes/no", "framework", "experience"],
        },
        {
          text: "What's your approach to responsive design?",
          expectedResponseTypes: ["approach", "methodology", "preference"],
        },
        {
          text: "Do you prefer working with CSS frameworks or writing custom styles?",
          expectedResponseTypes: ["preference", "explanation"],
        },
        {
          text: "What are your thoughts on the latest web standards?",
          expectedResponseTypes: ["opinion", "knowledge"],
        },
        {
          text: "Have you implemented any interesting web APIs in your projects?",
          expectedResponseTypes: ["yes/no", "example", "experience"],
        },
      ],

      database: [
        {
          text: "Do you typically work with SQL or NoSQL databases?",
          expectedResponseTypes: ["preference", "experience"],
        },
        {
          text: "Have you tried any of the newer database technologies?",
          expectedResponseTypes: ["yes/no", "technology", "experience"],
        },
        {
          text: "What's your approach to database optimization?",
          expectedResponseTypes: ["approach", "methodology", "technique"],
        },
        {
          text: "How do you handle data migration in your projects?",
          expectedResponseTypes: ["approach", "tool", "methodology"],
        },
        {
          text: "What database features do you find most useful for your work?",
          expectedResponseTypes: ["feature", "preference", "explanation"],
        },
      ],

      games: [
        {
          text: "Would you be interested in playing a quick game?",
          expectedResponseTypes: ["yes/no", "game", "preference"],
        },
        {
          text: "Have you tried any of our interactive games? I know hangman and number guessing.",
          expectedResponseTypes: ["yes/no", "game", "preference"],
        },
        {
          text: "Games can be a good mental break. Want to play one?",
          expectedResponseTypes: ["yes/no", "game", "preference"],
        },
        {
          text: "I can challenge you to a number guessing game if you'd like a quick distraction. Interested?",
          expectedResponseTypes: ["yes/no"],
        },
        {
          text: "Would a quick game of hangman help refresh your mind?",
          expectedResponseTypes: ["yes/no"],
        },
      ],

      continuation: [
        {
          text: "Going back to what we were discussing earlier...",
          expectedResponseTypes: ["acknowledgment", "question"],
        },
        {
          text: "To continue our previous conversation...",
          expectedResponseTypes: ["acknowledgment", "question"],
        },
        {
          text: "On the subject we were exploring before...",
          expectedResponseTypes: ["acknowledgment", "question"],
        },
        {
          text: "Circling back to our earlier topic...",
          expectedResponseTypes: ["acknowledgment", "question"],
        },
        {
          text: "Following up on what we discussed...",
          expectedResponseTypes: ["acknowledgment", "question"],
        },
      ],
    }; // Idle time conversation starters (when user hasn't responded in a while)
    this.idleTimeStarters = [
      {
        text: "Are you still there? I'm here if you have more questions.",
        expectedResponseTypes: ["yes/no", "acknowledgment"],
      },
      {
        text: "Just checking in - is there anything else you'd like to discuss?",
        expectedResponseTypes: ["yes/no", "topic"],
      },
      {
        text: "Is there anything specific you're looking for help with?",
        expectedResponseTypes: ["yes/no", "topic", "request"],
      },
      {
        text: "I'm still here if you need assistance with anything.",
        expectedResponseTypes: ["acknowledgment", "request"],
      },
      {
        text: "Feel free to ask questions whenever you're ready.",
        expectedResponseTypes: ["acknowledgment", "question"],
      },
    ]; // Response patterns for different types of expected responses
    this.responsePatterns = {
      "yes/no": {
        positivePatterns: [
          // Direct affirmatives
          "yes",
          "yeah",
          "sure",
          "ok",
          "okay",
          "definitely",
          "absolutely",
          "of course",
          "yep",
          "yup",
          "indeed",

          // Interest and curiosity indicators
          "please",
          "please do",
          "go ahead",
          "show me",
          "tell me",
          "would love to",
          "that would be great",
          "sounds good",

          // Indirect affirmatives
          "interested",
          "sounds interesting",
          "I'd like that",
          "why not",
          "continue",
          "proceed",
          "let's see it",
          "tell me more",
          "go on",
        ],
        negativePatterns: [
          "no",
          "nope",
          "nah",
          "not really",
          "not interested",
          "pass",
          "not now",
          "later",
          "negative",
          "not at this time",
          "don't bother",
          "skip it",
        ],
      },
      game: {
        gameTypes: ["hangman", "number guessing", "rock paper scissors", "game"],
      },
      acknowledgment: {
        patterns: ["ok", "okay", "sure", "got it", "understood", "alright", "i see", "thanks", "cool", "great"],
      },
      question: {
        questionWords: [
          "what",
          "how",
          "why",
          "when",
          "where",
          "who",
          "which",
          "can",
          "could",
          "would",
          "will",
          "is",
          "are",
          "do",
          "does",
        ],
      },
    };
  }
  /**
   * Check if this behavior should initiate a proactive response or handle a response to a previous proactive question
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior can handle the message
   */
  canHandle(message, context) {
    // First, check if this is a response to a previous proactive question
    if (this._isResponseToProactiveQuestion(message, context)) {
      logDebug("[Nova] ProactiveBehavior activated: Handling response to previous proactive question");
      context.isResponseToProactiveQuestion = true;
      return true;
    }

    // If not handling a response, check if we should be proactive now
    // Check if we've passed the threshold for messages without being proactive
    if (!context.conversationAnalytics) return false;

    const messageCount = context.conversationAnalytics.messageCount || 0;
    const timeSinceLastProactive = messageCount - this.lastProactiveTime;

    // Check if we're in an active game - be less proactive if so
    const inActiveGame =
      context.userMemory && context.userMemory.activeGames && Object.keys(context.userMemory.activeGames).length > 0;

    if (inActiveGame) {
      // Lower chance of interrupting during games
      if (timeSinceLastProactive > this.proactiveThreshold * 2 && Math.random() < this.proactiveChance / 2) {
        logDebug("[Nova] ProactiveBehavior activated during game: Brief proactive interaction");
        return true;
      }
      return false;
    }

    // Check for signs of topic conclusion in the user's message
    const messageIndicatesConclusion = this._isTopicConcluding(message);

    // Be more likely to be proactive if the user's message seems like an end to a topic
    if (messageIndicatesConclusion && timeSinceLastProactive > 2) {
      logDebug("[Nova] ProactiveBehavior activated: Topic appears to be concluding");
      return Math.random() < this.proactiveChance * 1.5; // Higher chance after topic conclusion
    }

    // Standard proactive behavior check
    if (timeSinceLastProactive > this.proactiveThreshold && Math.random() < this.proactiveChance) {
      logDebug("[Nova] ProactiveBehavior activated: Time for a proactive interaction");
      return true;
    }

    // Check for idle time - if the user hasn't sent a message in a while
    const lastActiveTime = context.conversationAnalytics.lastActiveTime || Date.now();
    const idleTimeMs = Date.now() - lastActiveTime;
    const idleTimeMinutes = idleTimeMs / (1000 * 60);

    if (idleTimeMinutes > 3 && Math.random() < 0.3) {
      // If idle for more than 3 minutes
      logDebug("[Nova] ProactiveBehavior activated: User has been idle");
      context.isIdleTimePrompt = true;
      return true;
    }

    return false;
  }
  /**
   * Check if the message is a response to a previous proactive question
   * @private
   * @param {string} message - The user's message
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if the message is a response to a proactive question
   */
  _isResponseToProactiveQuestion(message, context) {
    // Check if there was a previous proactive question in the context
    if (!context.userMemory || !context.userMemory.lastProactiveQuestion) {
      return false;
    }

    const lastProactiveInfo = context.userMemory.lastProactiveQuestion;
    const lowerMessage = message.toLowerCase();

    // If we have an active feature demo in progress, this is definitely a response
    if (context.userMemory.activeFeatureDemo) {
      context.proactiveResponseCategory = "general";
      return true;
    }

    // If the last message was very recent (within 2 messages), assume this is a response
    const messagesSinceProactive =
      (context.conversationAnalytics?.messageCount || 0) - (lastProactiveInfo.messageCount || 0);

    if (messagesSinceProactive <= 2) {
      // For game questions, check for direct game responses
      if (lastProactiveInfo.category === "games") {
        // If user mentions any game or says yes/no
        if (this._matchesResponseType(lowerMessage, "game") || this._matchesResponseType(lowerMessage, "yes/no")) {
          context.proactiveResponseCategory = "games";
          return true;
        }
      }

      // For programming, web, or database questions
      if (["programming", "web", "database"].includes(lastProactiveInfo.category)) {
        // If user provides a preference, opinion, or specific response
        const expectedResponseTypes = lastProactiveInfo.expectedResponseTypes || [];
        for (const responseType of expectedResponseTypes) {
          if (this._matchesResponseType(lowerMessage, responseType)) {
            context.proactiveResponseCategory = lastProactiveInfo.category;
            return true;
          }
        }
      }

      // For general questions, most direct replies should be handled
      if (lastProactiveInfo.category === "general") {
        // Simple responses or topic mentions should be handled
        if (
          this._matchesResponseType(lowerMessage, "yes/no") ||
          this._matchesResponseType(lowerMessage, "acknowledgment") ||
          this._matchesResponseType(lowerMessage, "question") ||
          this._isAskingForMoreInfo(lowerMessage)
        ) {
          context.proactiveResponseCategory = "general";
          return true;
        }
      }
    } else if (messagesSinceProactive <= 4) {
      // Extended window for feature-related follow-up questions
      if (
        context.userMemory.lastDiscussedFeatureTopic &&
        (this._isAskingForMoreInfo(lowerMessage) ||
          lowerMessage.includes("feature") ||
          lowerMessage.includes("how do I") ||
          lowerMessage.includes("how to"))
      ) {
        context.proactiveResponseCategory = "general";
        return true;
      }
    }

    return false;
  }
  /**
   * Check if a message matches a specific response type
   * @private
   * @param {string} message - The user's message
   * @param {string} responseType - The type of response to check for
   * @returns {boolean} - True if the message matches the response type
   */
  _matchesResponseType(message, responseType) {
    const lowerMessage = message.toLowerCase();

    switch (responseType) {
      case "yes/no": {
        return (
          this.responsePatterns["yes/no"].positivePatterns.some(
            (pattern) => lowerMessage.includes(pattern) || lowerMessage === pattern
          ) ||
          this.responsePatterns["yes/no"].negativePatterns.some(
            (pattern) => lowerMessage.includes(pattern) || lowerMessage === pattern
          )
        );
      }

      case "game": {
        return this.responsePatterns["game"].gameTypes.some((game) => lowerMessage.includes(game));
      }

      case "acknowledgment": {
        return this.responsePatterns["acknowledgment"].patterns.some(
          (pattern) => lowerMessage.includes(pattern) || lowerMessage === pattern
        );
      }

      case "question": {
        return (
          this.responsePatterns["question"].questionWords.some((word) => lowerMessage.startsWith(word + " ")) ||
          lowerMessage.includes("?")
        );
      }

      case "preference": {
        return (
          lowerMessage.includes("prefer") ||
          lowerMessage.includes("like") ||
          lowerMessage.includes("favorite") ||
          lowerMessage.includes("rather") ||
          lowerMessage.includes("better")
        );
      }

      case "experience": {
        return (
          lowerMessage.includes("tried") ||
          lowerMessage.includes("used") ||
          lowerMessage.includes("worked with") ||
          lowerMessage.includes("experience")
        );
      }

      case "approach": {
        return (
          lowerMessage.includes("approach") ||
          lowerMessage.includes("method") ||
          lowerMessage.includes("way") ||
          lowerMessage.includes("technique") ||
          lowerMessage.includes("strategy")
        );
      }

      case "topic": {
        // Check if message contains any programming, web, database, etc. related keywords
        const topics = [
          "programming",
          "coding",
          "development",
          "web",
          "frontend",
          "backend",
          "database",
          "data",
          "sql",
          "javascript",
          "python",
          "java",
          "react",
          "angular",
          "node",
          "html",
          "css",
        ];
        return topics.some((topic) => lowerMessage.includes(topic));
      }

      default: {
        return false;
      }
    }
  }

  /**
   * Check if the user message indicates a topic conclusion
   * @private
   * @param {string} message - The user's message
   * @returns {boolean} - True if the message indicates a topic conclusion
   */
  _isTopicConcluding(message) {
    const lowerMessage = message.toLowerCase();

    // Check for conclusion indicators
    const conclusionPhrases = [
      "thanks",
      "thank you",
      "got it",
      "i understand",
      "okay",
      "ok",
      "cool",
      "great",
      "awesome",
      "that's all",
      "that is all",
      "that's it",
      "that is it",
    ];

    // Check if message is short and contains conclusion phrases
    if (lowerMessage.split(" ").length <= 4) {
      return conclusionPhrases.some((phrase) => lowerMessage.includes(phrase));
    }

    return false;
  }
  /**
   * Generate a proactive conversation starter or handle a response to a previous proactive question
   * @param {string} message - The user's message
   * @param {object} context - Context for message processing
   * @returns {string} - The proactive response or reply to user's response
   */
  handle(message, context) {
    // If this is a response to a previous proactive question, handle it differently
    if (context.isResponseToProactiveQuestion) {
      return this._handleResponseToProactiveQuestion(message, context);
    }

    const userMem = context.userMemory;
    this.lastProactiveTime = context.conversationAnalytics.messageCount || 0;

    // Handle idle time differently
    if (context.isIdleTimePrompt) {
      const selectedStarter = this.idleTimeStarters[Math.floor(Math.random() * this.idleTimeStarters.length)];
      // Store this proactive question for context tracking
      this._storeProactiveQuestion(context, "idle", selectedStarter);
      return selectedStarter.text;
    }

    // Determine if we should continue the current topic or introduce a new one
    const shouldContinueTopic = Math.random() < 0.3 && context.currentTopic;

    let starterPool = [];
    let category = "general";

    // Choose starter category based on context
    if (shouldContinueTopic && context.currentTopic && this.conversationStarters[context.currentTopic]) {
      // Continue with the current topic if it exists in our starters
      starterPool = [...this.conversationStarters[context.currentTopic]];
      category = context.currentTopic;

      // Add some continuation phrases
      const continuationPrefix =
        this.conversationStarters.continuation[
          Math.floor(Math.random() * this.conversationStarters.continuation.length)
        ].text;
      starterPool = starterPool.map((starter) => {
        return {
          text: `${continuationPrefix} ${starter.text.toLowerCase()}`,
          expectedResponseTypes: starter.expectedResponseTypes,
        };
      });
    } else {
      // Choose a new topic
      starterPool = [...this.conversationStarters.general];

      // Add topic-based starters if we know their interests
      if (userMem && userMem.topics && userMem.topics.length > 0) {
        const userTopic = userMem.topics[Math.floor(Math.random() * userMem.topics.length)];
        if (this.conversationStarters[userTopic]) {
          starterPool = starterPool.concat(this.conversationStarters[userTopic]);
          // Update category if we're using a specific topic
          if (userTopic !== "continuation") {
            category = userTopic;
          }
        }

        // Add personalized topic references
        const personalizedQuestions = [
          {
            text: `I noticed you were interested in ${userTopic} earlier. Would you like to explore that further?`,
            expectedResponseTypes: ["yes/no", "question", "preference"],
          },
          {
            text: `Earlier you mentioned ${userTopic}. Have you been working with that for long?`,
            expectedResponseTypes: ["yes/no", "experience", "time"],
          },
        ];
        starterPool = starterPool.concat(personalizedQuestions);
      }

      // Add game suggestions occasionally
      if (Math.random() < 0.2) {
        starterPool = starterPool.concat(this.conversationStarters.games);
        category = "games"; // Update category if suggesting games
      }
    }

    // Add personalized starters if we have user information
    if (userMem && userMem.name) {
      // Add some starters with the user's name
      const personalizedStarters = [
        {
          text: `${userMem.name}, I was thinking about something that might interest you based on our conversation.`,
          expectedResponseTypes: ["acknowledgment", "question", "interest"],
        },
        {
          text: `${userMem.name}, I'm curious about your experience with this topic.`,
          expectedResponseTypes: ["experience", "question", "preference"],
        },
        {
          text: `By the way ${userMem.name}, is there a specific area you'd like to learn more about?`,
          expectedResponseTypes: ["yes/no", "topic", "preference"],
        },
      ];
      starterPool = starterPool.concat(personalizedStarters);
    }

    // Select a starter
    const selected = starterPool[Math.floor(Math.random() * starterPool.length)];
    logDebug(`ProactiveBehavior selected starter: ${selected.text} (category: ${category})`);

    // Store this proactive question for context tracking
    this._storeProactiveQuestion(context, category, selected);

    return selected.text;
  }
  /**
   * Store the current proactive question in user memory for context tracking
   * @private
   * @param {object} context - Context for message processing
   * @param {string} category - Category of the proactive question
   * @param {object} question - The question object with text and expectedResponseTypes
   */
  _storeProactiveQuestion(context, category, question) {
    if (!context.userMemory) {
      context.userMemory = {};
    }

    // Store the proactive question information
    context.userMemory.lastProactiveQuestion = {
      text: question.text,
      category: category,
      expectedResponseTypes: question.expectedResponseTypes,
      messageCount: context.conversationAnalytics?.messageCount || 0,
      timestamp: Date.now(),
    };

    // Initialize activeFeatureDemo if it doesn't exist
    if (context.userMemory.activeFeatureDemo === undefined) {
      context.userMemory.activeFeatureDemo = null;
    }

    // If this is a feature-related proactive question, store the last discussed feature
    if (question.text.includes("feature") && category === "general") {
      context.userMemory.lastDiscussedFeatureTopic = true;
    }
  }
  /**
   * Handle a response to a previous proactive question
   * @private
   * @param {string} message - The user's message
   * @param {object} context - Context for message processing
   * @returns {string} - Response to the user
   */
  _handleResponseToProactiveQuestion(message, context) {
    const userMem = context.userMemory;
    const lastProactiveInfo = userMem.lastProactiveQuestion;
    const lowerMessage = message.toLowerCase();

    if (!lastProactiveInfo) {
      return "I'm not sure I understand. Could you clarify what you mean?";
    }

    // Check if we're in a feature demonstration flow
    if (userMem.activeFeatureDemo) {
      const feature = userMem.activeFeatureDemo;

      if (this._isPositiveResponse(lowerMessage)) {
        // User wants more details about using the feature
        userMem.activeFeatureDemo = null; // End the feature demo flow
        return `${feature.usage} Is there anything specific about the ${feature.name} feature you'd like to know more about?`;
      } else if (this._isNegativeResponse(lowerMessage)) {
        // User doesn't want more details
        userMem.activeFeatureDemo = null; // End the feature demo flow
        return "No problem! If you have any other questions or want to learn about different features, just let me know.";
      } else {
        // User said something else - try to interpret as a question about the feature
        if (
          lowerMessage.includes("how") ||
          lowerMessage.includes("use") ||
          lowerMessage.includes("work") ||
          lowerMessage.includes("function") ||
          lowerMessage.includes("do")
        ) {
          userMem.activeFeatureDemo = null; // End the feature demo flow
          return `${feature.usage} I hope that helps! Let me know if you have any other questions.`;
        } else {
          userMem.activeFeatureDemo = null; // End the feature demo flow
          return `I'm not sure if you want to learn more about using the ${feature.name} feature. If you do, just ask "How do I use it?" or "Show me how it works."`;
        }
      }
    }

    // Handle responses based on the category of the proactive question
    switch (lastProactiveInfo.category) {
      case "games": {
        // Check if user wants to play a game
        if (this._isPositiveResponse(lowerMessage)) {
          if (lowerMessage.includes("hangman")) {
            return "Great! Let's play hangman. I'm thinking of a word related to programming. Try guessing a letter!";
          } else if (lowerMessage.includes("number") || lowerMessage.includes("guessing")) {
            return "Excellent! I'm thinking of a number between 1 and 100. You have 7 attempts to guess it. What's your first guess?";
          } else if (
            lowerMessage.includes("rock") ||
            lowerMessage.includes("paper") ||
            lowerMessage.includes("scissors")
          ) {
            return "Let's play Rock Paper Scissors! Just type 'rock', 'paper', or 'scissors' to make your move.";
          } else {
            return "I know hangman and number guessing games. Which one would you like to play?";
          }
        } else if (this._isNegativeResponse(lowerMessage)) {
          return "No problem! Let me know if you change your mind or if there's anything else I can help with.";
        } else {
          return "If you'd like to play a game, just let me know which one - hangman or number guessing. Or we can talk about something else if you prefer.";
        }
      }

      case "programming":
      case "web":
      case "database": {
        // For technical topics
        if (this._isPositiveResponse(lowerMessage)) {
          return `That's great to hear! Do you have any specific questions about ${lastProactiveInfo.category} that I can help with?`;
        } else if (this._isNegativeResponse(lowerMessage)) {
          return `No problem. Is there another tech topic you're interested in discussing?`;
        } else if (this._matchesResponseType(lowerMessage, "question")) {
          return `That's a good question about ${lastProactiveInfo.category}. Let me help you with that...`;
        } else if (
          this._matchesResponseType(lowerMessage, "experience") ||
          this._matchesResponseType(lowerMessage, "preference")
        ) {
          return `Thanks for sharing your experience! It's always interesting to hear different perspectives on ${lastProactiveInfo.category}.`;
        } else {
          return `I appreciate your thoughts on ${lastProactiveInfo.category}. Would you like to explore this topic further?`;
        }
      }
      case "general": {
        // For general questions
        if (this._isPositiveResponse(lowerMessage)) {
          // For the feature announcement question specifically
          if (lastProactiveInfo.text.includes("heard about our new feature")) {
            // Select a random feature from our list to talk about
            const feature = this.featureDescriptions[Math.floor(Math.random() * this.featureDescriptions.length)];
            userMem.activeFeatureDemo = feature; // Store the feature for follow-up
            return `That's great! We recently launched our new ${feature.name} feature. ${feature.description} Would you like me to show you how to use it?`;
          }
          return "Great! Feel free to ask me about any topic you're interested in, and I'll do my best to help.";
        } else if (this._isNegativeResponse(lowerMessage) || this._isAskingForMoreInfo(lowerMessage)) {
          // Special handling for feature-related questions
          if (lastProactiveInfo.text.includes("heard about our new feature")) {
            // Select a random feature from our list
            const feature = this.featureDescriptions[Math.floor(Math.random() * this.featureDescriptions.length)];

            // Store the current feature in context for follow-up questions
            userMem.activeFeatureDemo = feature;

            if (this._isAskingForMoreInfo(lowerMessage)) {
              return `I'd be happy to tell you more about our new ${feature.name} feature! ${feature.description} Would you like me to show you how to get started with it?`;
            } else {
              return `We recently launched our new ${feature.name} feature. ${feature.description} Would you like to learn how to use it?`;
            }
          }
          return "No problem. I'm here if you need any assistance later.";
        } else if (this._matchesResponseType(lowerMessage, "topic")) {
          return `That sounds interesting! I'd be happy to discuss ${lowerMessage} with you.`;
        } else {
          return "Thanks for letting me know. Is there anything specific you'd like to talk about?";
        }
      }

      case "idle": {
        // For idle time prompts
        if (this._matchesResponseType(lowerMessage, "acknowledgment")) {
          return "Great! I'm here to help whenever you need assistance.";
        } else if (this._matchesResponseType(lowerMessage, "question")) {
          return "I'd be happy to answer that for you! Let me see...";
        } else {
          return "I'm glad you're back. How can I assist you now?";
        }
      }

      default: {
        return "I appreciate your response. Is there anything specific I can help you with?";
      }
    }
  }

  /**
   * Check if message is a positive response (yes, sure, etc.)
   * @private
   * @param {string} message - The user's message
   * @returns {boolean} - True if the message is a positive response
   */
  _isPositiveResponse(message) {
    return this.responsePatterns["yes/no"].positivePatterns.some(
      (pattern) => message.includes(pattern) || message === pattern
    );
  }
  /**
   * Check if message is a negative response (no, nope, etc.)
   * @private
   * @param {string} message - The user's message
   * @returns {boolean} - True if the message is a negative response
   */
  _isNegativeResponse(message) {
    return this.responsePatterns["yes/no"].negativePatterns.some(
      (pattern) => message.includes(pattern) || message === pattern
    );
  }
  /**
   * Check if the user is asking for more information about a feature
   * @private
   * @param {string} message - The user's message
   * @returns {boolean} - True if the user wants to know more about a feature
   */
  _isAskingForMoreInfo(message) {
    const infoRequestPatterns = [
      // Direct requests for information
      "tell me more",
      "more info",
      "more information",
      "more details",
      "details",
      "elaborate",
      "explain",
      "learn more",

      // Questions about what's being discussed
      "what feature",
      "which feature",
      "what is it",
      "what's it",
      "what are you talking about",
      "what's that",
      "what is that",

      // Expressions of interest
      "interested",
      "sounds interesting",
      "tell me about",
      "want to know",
      "like to know",
      "could you explain",

      // Acknowledgments of not knowing
      "never heard",
      "don't know about",
      "do not know about",
      "haven't heard",
      "have not heard",
      "not familiar",

      // Questions about purpose or function
      "what does it do",
      "how does it work",
      "what is it for",
      "what's it for",
      "how do I use",
      "can you show",

      // General interest responses
      "sounds good",
      "tell me",
      "go on",
      "continue",
      "really",
      "intriguing",
      "curious",
    ];

    return infoRequestPatterns.some((pattern) => message.toLowerCase().includes(pattern));
  }
}

module.exports = ProactiveBehavior;
