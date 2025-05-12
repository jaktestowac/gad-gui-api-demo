/**
 * Command Behavior - Handles explicit commands
 */

const BaseBehavior = require("./base-behavior");

class CommandBehavior extends BaseBehavior {
  constructor() {
    // Commands are highest priority
    super("command", 1000);

    // Map of commands and their handlers
    this.commands = {
      help: this._handleHelp.bind(this),
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
      // Reset user memory
      // We use the userId from the context
      // Note: This doesn't actually delete the memory completely,
      // it just clears the current instance

      // Re-initialize user memory (shallow reset)
      Object.keys(context.userMemory).forEach((key) => {
        if (Array.isArray(context.userMemory[key])) {
          context.userMemory[key] = [];
        } else if (typeof context.userMemory[key] === "object") {
          context.userMemory[key] = {};
        }
      });

      return "I've forgotten all information about you.";
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
