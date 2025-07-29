/**
 * Command Behavior - Handles explicit commands
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class CommandBehavior extends BaseBehavior {
  constructor() {
    // Commands are highest priority
    super("command", 1000);

    // Map of commands and their handlers
    this.commands = {
      help: this._handleHelp.bind(this),
      topics: this._handleTopics.bind(this),
      remember: this._handleRemember.bind(this),
      forget: this._handleForget.bind(this),
      "tell me a joke": this._handleJoke.bind(this),
      "tell me a fact": this._handleFact.bind(this),
      "what do you know about me": this._handleKnowledgeAboutMe.bind(this),
    };
  }

  /**
   * Check if this behavior can handle the message
   */
  canHandle(message, context) {
    // Debug log for command normalization
    logDebug("[Nova] CommandBehavior:canHandle", {
      message,
      normalizedCommand: context.normalizedCommand,
    });
    // Check if the normalized command is one we can handle
    const command = context.normalizedCommand;

    // Check for exact commands
    if (this.commands[command]) {
      return true;
    }

    // Check for commands that start with a specific prefix
    for (const cmd of Object.keys(this.commands)) {
      if (command.startsWith(`${cmd} `)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handle the message
   */
  handle(message, context) {
    const command = context.normalizedCommand;

    // Check for exact commands
    if (this.commands[command]) {
      return this.commands[command](message, context);
    }

    // Check for commands that start with a specific prefix
    for (const cmd of Object.keys(this.commands)) {
      if (command.startsWith(`${cmd} `)) {
        // Extract the parameter after the command
        const param = message.substring(message.toLowerCase().indexOf(cmd) + cmd.length).trim();
        return this.commands[cmd](param, context);
      }
    }

    // This shouldn't happen if canHandle is working correctly
    return "I couldn't process that command. Please try again.";
  }

  /**
   * Handle the help command
   */
  _handleHelp(message, context) {
    // Import here to avoid circular dependency
    const { helpText } = require("../nova-base");
    return helpText;
  }

  /**
   * Handle the topics command
   */
  _handleTopics(message, context) {
    const topicsText = `
🎯 **Topics I Can Talk About:**

🤖 **Programming & Technology:**
• JavaScript, Node.js, React, Python, HTML, CSS
• APIs, REST, GraphQL, Web Development
• Database concepts, SQL, NoSQL
• Testing, Test Automation, QA practices
• DevOps, CI/CD, Docker, Cloud Computing
• Mobile Development, iOS, Android
• Machine Learning, AI, Data Science

🎮 **Games & Entertainment:**
• Rock Paper Scissors - Classic strategy game
• Number Guessing - Adaptive difficulty with hints
• Hangman - Word guessing with various categories
• Interactive challenges and puzzles

🧮 **Utilities & Calculations:**
• Mathematical expressions and calculations
• Unit conversions (temperature, distance, weight, etc.)
• Digital storage conversions (MB, GB, TB)
• Time conversions and calculations
• Currency conversions (when available)

📚 **Knowledge & Learning:**
• Programming concepts and definitions
• Code examples and tutorials
• Best practices and design patterns
• Technology trends and news
• Learning resources and recommendations

🗣️ **Conversation & Personality:**
• Small talk and casual conversation
• Personal questions about my capabilities
• Emotional support and encouragement
• Humor and jokes
• Interesting facts and trivia

🎯 **Special Features:**
• Memory management (remember/forget information)
• Contextual conversations (remembers past chats)
• Personalized recommendations
• Proactive conversation starters
• Multi-language support (basic)

🔧 **Commands & Tools:**
• /help - Show available commands
• /topics - Show this topics list
• /list-terms - Show learned terms
• /debug-terms - Debug term learning system
• clear - Clear conversation history
• remember/forget - Manage personal information

💡 **Ask me about anything!** I'm constantly learning and can discuss a wide range of topics. If I don't know something, I'll be honest about it and try to help you find the information you need.
`;
    return topicsText;
  }

  /**
   * Handle the remember command
   */
  _handleRemember(info, context) {
    if (!context.userMemory.facts) {
      context.userMemory.facts = [];
    }
    context.userMemory.facts.push(info);
    return `I'll remember that: ${info}`;
  }

  /**
   * Handle the forget command
   */
  _handleForget(info, context) {
    // Handle "forget all" command
    if (info === "all") {
      // Reset user memory including learned terms
      // We use the userId from the context

      // Clear all user memory including learned terms
      const userId = context.userId || context.conversationId?.split("_")[0];
      if (userId) {
        // Import the user memory module to clear learned terms
        const { userMemory } = require("../user-memory");
        delete userMemory[userId];
      }

      // Re-initialize user memory (shallow reset)
      Object.keys(context.userMemory).forEach((key) => {
        if (Array.isArray(context.userMemory[key])) {
          context.userMemory[key] = [];
        } else if (typeof context.userMemory[key] === "object") {
          context.userMemory[key] = {};
        }
      });

      return "I've forgotten all information about you, including any terms I learned from you.";
    } else {
      // Try to forget specific information
      let found = false;
      if (context.userMemory.facts) {
        const factIndex = context.userMemory.facts.findIndex((fact) => fact.toLowerCase().includes(info.toLowerCase()));

        if (factIndex !== -1) {
          const fact = context.userMemory.facts[factIndex];
          context.userMemory.facts.splice(factIndex, 1);
          return `I've forgotten that: ${fact}`;
        }
      }

      if (!found && context.userMemory.preferences && info in context.userMemory.preferences) {
        delete context.userMemory.preferences[info];
        return `I've forgotten your preference about: ${info}`;
      }

      return `I couldn't find any information about "${info}" to forget.`;
    }
  }

  /**
   * Handle the joke command
   */
  _handleJoke(message, context) {
    // Import here to avoid circular dependency
    const { jokes } = require("../nova-base");
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    return randomJoke;
  }

  /**
   * Handle the fact command
   */
  _handleFact(message, context) {
    // Import here to avoid circular dependency
    const { funFacts } = require("../nova-base");
    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
    return `Here's an interesting fact: ${randomFact}`;
  }

  /**
   * Handle the "what do you know about me" command
   */
  _handleKnowledgeAboutMe(message, context) {
    if (
      !context.userMemory.name &&
      Object.keys(context.userMemory.preferences || {}).length === 0 &&
      (context.userMemory.facts || []).length === 0
    ) {
      return "I don't know anything about you yet. You can share information with me using the 'remember' command.";
    } else {
      let knowledgeResponse = "Here's what I know about you:\n";

      if (context.userMemory.name) {
        knowledgeResponse += `- Your name is ${context.userMemory.name}\n`;
      }

      if (context.userMemory.preferences && Object.keys(context.userMemory.preferences).length > 0) {
        knowledgeResponse += "- Your preferences:\n";
        for (const [topic, preference] of Object.entries(context.userMemory.preferences)) {
          knowledgeResponse += `  • You ${preference} ${topic}\n`;
        }
      }

      if (context.userMemory.facts && context.userMemory.facts.length > 0) {
        knowledgeResponse += "- Other facts:\n";
        context.userMemory.facts.forEach((fact) => {
          knowledgeResponse += `  • ${fact}\n`;
        });
      }

      return knowledgeResponse;
    }
  }
}

module.exports = CommandBehavior;
