/**
 * Behavior Registry - Central registry for all AI behaviors
 *
 * This module is the core of the behavior system, allowing behaviors to register
 * themselves and providing a way to find the appropriate behavior for a message.
 */

/**
 * Registry of all available behaviors
 */
class BehaviorRegistry {
  constructor() {
    this.behaviors = [];
    this.initialized = false;
  }

  /**
   * Register a behavior with the registry
   * @param {object} behavior - The behavior to register
   * @returns {BehaviorRegistry} - Returns self for chaining
   */
  register(behavior) {
    if (!behavior.id || typeof behavior.canHandle !== "function" || typeof behavior.handle !== "function") {
      throw new Error("Invalid behavior: must have id, canHandle, and handle properties");
    }

    // Check if a behavior with the same ID already exists
    const existingIndex = this.behaviors.findIndex((b) => b.id === behavior.id);

    if (existingIndex >= 0) {
      // Replace existing behavior
      this.behaviors[existingIndex] = behavior;
    } else {
      // Add new behavior
      this.behaviors.push(behavior);
    }

    // Sort behaviors by priority (highest first)
    this.behaviors.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return this;
  }

  /**
   * Get the appropriate behavior to handle a message
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {object|null} - The behavior to use, or null if none found
   */
  getBehaviorForMessage(message, context) {
    for (const behavior of this.behaviors) {
      if (behavior.canHandle(message, context)) {
        return behavior;
      }
    }
    return null;
  }

  /**
   * Process a message using the registered behaviors
   * @param {string} message - The message to process
   * @param {object} context - Context for message processing
   * @returns {string} - The response
   */
  processMessage(message, context) {
    const behavior = this.getBehaviorForMessage(message, context);

    if (behavior) {
      return behavior.handle(message, context);
    }

    // If no behavior can handle the message, return a default response
    return "I'm not sure how to respond to that. Could you try a different question?";
  }

  /**
   * Get all registered behaviors
   * @returns {Array} - Array of registered behaviors
   */
  getAllBehaviors() {
    return [...this.behaviors];
  }
}

// Create a singleton instance
const registry = new BehaviorRegistry();

module.exports = registry;
