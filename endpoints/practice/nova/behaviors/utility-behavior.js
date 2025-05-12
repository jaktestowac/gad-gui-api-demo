/**
 * Utility Behavior - Handles utility functions like calculations, definitions, etc.
 */

const BaseBehavior = require("./base-behavior");
const { getDefinition, convertUnits, getCodeExample, calculateExpression } = require("../utilities");

class UtilityBehavior extends BaseBehavior {
  constructor() {
    // Utilities have high priority, but lower than commands and games
    super("utility", 800);
  }

  /**
   * Check if this behavior can handle the message
   */
  canHandle(message, context) {
    const normalizedCommand = context.normalizedCommand;

    // Check for utility commands
    return (
      normalizedCommand.startsWith("define ") ||
      normalizedCommand.startsWith("convert ") ||
      normalizedCommand.startsWith("calculate ") ||
      normalizedCommand.startsWith("show example ")
    );
  }

  /**
   * Handle the message
   */
  handle(message, context) {
    const normalizedCommand = context.normalizedCommand;

    // Handle dictionary lookup
    if (normalizedCommand.startsWith("define ")) {
      const word = message
        .substring(normalizedCommand.startsWith("define ") ? 7 : message.indexOf("define ") + 7)
        .trim();
      return getDefinition(word);
    }

    // Handle unit conversion
    else if (normalizedCommand.startsWith("convert ")) {
      const query = message
        .substring(normalizedCommand.startsWith("convert ") ? 8 : message.indexOf("convert ") + 8)
        .trim();
      return convertUnits(query);
    }

    // Handle calculations
    else if (normalizedCommand.startsWith("calculate ")) {
      const expression = message
        .substring(normalizedCommand.startsWith("calculate ") ? 10 : message.indexOf("calculate ") + 10)
        .trim();
      return calculateExpression(expression);
    }

    // Handle code examples
    else if (normalizedCommand.startsWith("show example ")) {
      const topic = message
        .substring(normalizedCommand.startsWith("show example ") ? 13 : message.indexOf("show example ") + 13)
        .trim();
      return getCodeExample(topic);
    }

    // This shouldn't happen if canHandle is working correctly
    return "I couldn't process your utility request. Please try again.";
  }
}

module.exports = UtilityBehavior;
