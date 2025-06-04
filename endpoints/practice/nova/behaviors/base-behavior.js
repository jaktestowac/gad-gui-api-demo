/**
 * Base Behavior - Abstract base class for all Nova behaviors
 *
 * This class defines the interface that all behaviors must implement.
 * Each behavior is responsible for determining if it can handle a message
 * and then processing that message.
 */

class BaseBehavior {
  constructor(id, priority = 0) {
    this.id = id;
    this.priority = priority;
  }

  /**
   * Check if this behavior can handle the given message
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior can handle the message
   */
  canHandle(message, context) {
    // Abstract method to be implemented by subclasses
    throw new Error("canHandle method must be implemented by subclass");
  }

  /**
   * Handle the given message
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - The response
   */
  handle(message, context) {
    // Abstract method to be implemented by subclasses
    throw new Error("handle method must be implemented by subclass");
  }
}

module.exports = BaseBehavior;
