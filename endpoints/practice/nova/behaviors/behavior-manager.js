/**
 * Behavior Manager - Initialize and manage all AI behaviors
 *
 * This module initializes all behaviors and registers them with the registry.
 */

const behaviorRegistry = require("./behavior-registry");
const textProcessingUtils = require("../text-processing");

// Import behaviors
const CommandBehavior = require("./command-behavior");
const GameBehavior = require("./game-behavior");
const KnowledgeBaseBehavior = require("./knowledge-base-behavior");
const UtilityBehavior = require("./utility-behavior");
const DefaultResponseBehavior = require("./default-response-behavior");

/**
 * Initialize all behaviors
 */
function initializeBehaviors() {
  // Only initialize once
  if (behaviorRegistry.initialized) {
    return behaviorRegistry;
  }

  // Register behaviors in priority order
  behaviorRegistry
    .register(new CommandBehavior())
    .register(new GameBehavior())
    .register(new UtilityBehavior())
    .register(new KnowledgeBaseBehavior(textProcessingUtils))
    .register(new DefaultResponseBehavior(textProcessingUtils));

  behaviorRegistry.initialized = true;
  return behaviorRegistry;
}

module.exports = {
  initializeBehaviors,
  behaviorRegistry,
};
