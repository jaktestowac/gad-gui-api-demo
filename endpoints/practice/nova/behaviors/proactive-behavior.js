/**
 * Proactive Behavior - Enables Nova to initiate conversations
 *
 * This behavior allows Nova to occasionally start new topics or ask questions
 * rather than always being reactive. It makes conversations feel more natural
 * by simulating how humans proactively engage in dialogue.
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

    // Define conversation starters by category
    this.conversationStarters = {
      general: [
        "By the way, I was wondering if you've heard about our new feature that was just released?",
        "While we're talking, I should mention that there's a helpful tutorial on this topic you might find interesting.",
        "I'm curious - have you tried the interactive examples in our documentation?",
        "Just wondering, what brings you here today?",
        "I'm here to help with whatever you need. Is there a specific area you'd like to explore?",
      ],

      programming: [
        "I noticed we've been discussing programming. Do you have a favorite language?",
        "Have you been working on any interesting coding projects lately?",
        "What development environment do you prefer to use?",
        "Are you more into frontend or backend development?",
        "Have you tried any new programming tools recently?",
      ],

      web: [
        "Have you been exploring any new web frameworks lately?",
        "What's your approach to responsive design?",
        "Do you prefer working with CSS frameworks or writing custom styles?",
        "What are your thoughts on the latest web standards?",
        "Have you implemented any interesting web APIs in your projects?",
      ],

      database: [
        "Do you typically work with SQL or NoSQL databases?",
        "Have you tried any of the newer database technologies?",
        "What's your approach to database optimization?",
        "How do you handle data migration in your projects?",
        "What database features do you find most useful for your work?",
      ],

      games: [
        "Would you be interested in playing a quick game?",
        "Have you tried any of our interactive games? I know hangman and number guessing.",
        "Games can be a good mental break. Want to play one?",
        "I can challenge you to a number guessing game if you'd like a quick distraction.",
        "Would a quick game of hangman help refresh your mind?",
      ],

      continuation: [
        "Going back to what we were discussing earlier...",
        "To continue our previous conversation...",
        "On the subject we were exploring before...",
        "Circling back to our earlier topic...",
        "Following up on what we discussed...",
      ],
    };

    // Idle time conversation starters (when user hasn't responded in a while)
    this.idleTimeStarters = [
      "Are you still there? I'm here if you have more questions.",
      "Just checking in - is there anything else you'd like to discuss?",
      "Is there anything specific you're looking for help with?",
      "I'm still here if you need assistance with anything.",
      "Feel free to ask questions whenever you're ready.",
    ];
  }

  /**
   * Check if this behavior should initiate a proactive response
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior should be proactive now
   */
  canHandle(message, context) {
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
   * Generate a proactive conversation starter
   * @param {string} message - The user's message
   * @param {object} context - Context for message processing
   * @returns {string} - The proactive response
   */
  handle(message, context) {
    const userMem = context.userMemory;
    this.lastProactiveTime = context.conversationAnalytics.messageCount || 0;

    // Handle idle time differently
    if (context.isIdleTimePrompt) {
      return this.idleTimeStarters[Math.floor(Math.random() * this.idleTimeStarters.length)];
    }

    // Determine if we should continue the current topic or introduce a new one
    const shouldContinueTopic = Math.random() < 0.3 && context.currentTopic;

    let starterPool = [];

    // Choose starter category based on context
    if (shouldContinueTopic && context.currentTopic && this.conversationStarters[context.currentTopic]) {
      // Continue with the current topic if it exists in our starters
      starterPool = [...this.conversationStarters[context.currentTopic]];

      // Add some continuation phrases
      const continuationPrefix =
        this.conversationStarters.continuation[
          Math.floor(Math.random() * this.conversationStarters.continuation.length)
        ];
      starterPool = starterPool.map((starter) => `${continuationPrefix} ${starter.toLowerCase()}`);
    } else {
      // Choose a new topic
      starterPool = [...this.conversationStarters.general];

      // Add topic-based starters if we know their interests
      if (userMem && userMem.topics && userMem.topics.length > 0) {
        const userTopic = userMem.topics[Math.floor(Math.random() * userMem.topics.length)];
        if (this.conversationStarters[userTopic]) {
          starterPool = starterPool.concat(this.conversationStarters[userTopic]);
        }

        // Add personalized topic references
        starterPool.push(
          `I noticed you were interested in ${userTopic} earlier. Would you like to explore that further?`,
          `Earlier you mentioned ${userTopic}. Have you been working with that for long?`
        );
      }

      // Add game suggestions occasionally
      if (Math.random() < 0.2) {
        starterPool = starterPool.concat(this.conversationStarters.games);
      }
    }

    // Add personalized starters if we have user information
    if (userMem && userMem.name) {
      // Add some starters with the user's name
      starterPool.push(
        `${userMem.name}, I was thinking about something that might interest you based on our conversation.`,
        `${userMem.name}, I'm curious about your experience with this topic.`,
        `By the way ${userMem.name}, is there a specific area you'd like to learn more about?`
      );
    }

    // Select a starter
    const selected = starterPool[Math.floor(Math.random() * starterPool.length)];
    logDebug(`ProactiveBehavior selected starter: ${selected}`);
    return selected;
  }
}

module.exports = ProactiveBehavior;
