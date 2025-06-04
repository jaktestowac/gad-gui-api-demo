/**
 * Personality Behavior - Adds consistent personality traits to responses
 *
 * This behavior adds consistent personality traits to responses, making Nova
 * feel more like a character than a tool. It ensures Nova maintains a
 * consistent personality across interactions.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class PersonalityBehavior extends BaseBehavior {
  constructor() {
    // Low priority as it modifies responses from other behaviors
    super("personality", 150);

    // Define personality traits and their expressions
    this.traits = {
      // Helpful and supportive personality
      supportive: {
        chance: 0.7,
        expressions: [
          "I'm here to help with that.",
          "I'm happy to assist you with this.",
          "Let me know if you need any clarification.",
          "Don't hesitate to ask if you have more questions.",
          "I'm glad we're working through this together.",
          "That's a great question, let me help you with it.",
        ],
      },
      // Curious about the user and their needs
      curious: {
        chance: 0.5,
        expressions: [
          "I'd be interested to hear more about your project.",
          "What are you hoping to achieve with this?",
          "Have you considered looking at it from another perspective?",
          "What's your experience been with this so far?",
          "I'm curious about how you're planning to use this information.",
        ],
      },
      // Enthusiastic about technology and learning
      enthusiastic: {
        chance: 0.4,
        expressions: [
          "That's actually a fascinating topic!",
          "I'm really excited about the possibilities here.",
          "There's so much potential in what you're working on.",
          "This is such an interesting area to explore.",
          "I really enjoy discussing these kinds of topics!",
        ],
      },
    };
  }

  /**
   * Check if this behavior should add personality to a response
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior should add personality
   */
  canHandle(message, context) {
    // This behavior can handle any message but only activates sometimes
    // to add occasional personality touches
    return Math.random() < 0.3;
  }

  /**
   * Add personality to the response
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - The response with personality added
   */
  handle(message, context) {
    // If another behavior has already generated a response, add personality
    if (context.generatedResponse) {
      return this._addPersonalityToResponse(context.generatedResponse, context);
    }

    // If this is handling the message directly (unlikely but possible),
    // generate a personality-driven response
    return this._generatePersonalityResponse(message, context);
  }

  /**
   * Add personality expressions to an existing response
   * @private
   */
  _addPersonalityToResponse(response, context) {
    // Select a random trait to express
    const traitNames = Object.keys(this.traits);
    const traitName = traitNames[Math.floor(Math.random() * traitNames.length)];
    const trait = this.traits[traitName];

    // Check if this trait should be expressed (based on chance)
    if (Math.random() > trait.chance) {
      return response;
    }

    // Select an expression for the trait
    const expression = trait.expressions[Math.floor(Math.random() * trait.expressions.length)];

    // Determine where to add the personality expression
    if (Math.random() < 0.5) {
      // Add at the beginning
      return `${expression} ${response}`;
    } else {
      // Add at the end
      return `${response} ${expression}`;
    }
  }

  /**
   * Generate a personality-driven response directly
   * @private
   */
  _generatePersonalityResponse(message, context) {
    const lowerMessage = context.lowerCaseMessage;

    // If the message is a greeting, respond with a personality-driven greeting
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! I'm Nova, your helpful assistant. How can I brighten your day today?";
    }

    // If it's a question about Nova
    if (lowerMessage.includes("who are you") || lowerMessage.includes("what are you")) {
      return "I'm Nova, an assistant designed to be helpful, friendly, and adaptable to your needs. I really enjoy solving problems and learning new things!";
    }

    // Default personality response for other cases
    return "I'm here and ready to help! What would you like to talk about today?";
  }
}

module.exports = PersonalityBehavior;
