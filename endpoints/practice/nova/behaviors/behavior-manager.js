/**
 * Behavior Manager - Initialize and manage all Nova behaviors
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
const SmallTalkBehavior = require("./small-talk-behavior");
const RecommendationBehavior = require("./recommendation-behavior");
const DefaultResponseBehavior = require("./default-response-behavior");

// Import new behaviors for more realistic interactions
const ProactiveBehavior = require("./proactive-behavior");
const VariationBehavior = require("./variation-behavior");
const ContextualMemoryBehavior = require("./contextual-memory-behavior");
const PersonalityBehavior = require("./personality-behavior");
const ConversationalFlowBehavior = require("./conversational-flow-behavior");
const GADFeatureBehavior = require("./gad-feature-behavior");
const CuriosityBehavior = require("./curiosity-behavior");

// Import new enhanced behaviors
const ContextAwarenessBehavior = require("./context-awareness-behavior");
const LearningBehavior = require("./learning-behavior");
const EmotionAwarenessBehavior = require("./emotion-awareness-behavior");
const ResponseQualityBehavior = require("./response-quality-behavior");

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
    .register(new ProactiveBehavior()) // New behavior
    .register(new UtilityBehavior())
    .register(new SmallTalkBehavior())
    .register(new ResponseQualityBehavior()) // New response quality behavior
    .register(new ContextAwarenessBehavior()) // New enhanced behavior
    .register(new LearningBehavior()) // New enhanced behavior
    .register(new EmotionAwarenessBehavior()) // New enhanced behavior
    .register(new ConversationalFlowBehavior()) // New behavior
    .register(new ContextualMemoryBehavior()) // New behavior
    .register(new KnowledgeBaseBehavior(textProcessingUtils))
    .register(new GADFeatureBehavior()) // GAD features behavior
    .register(new RecommendationBehavior())
    .register(new PersonalityBehavior()) // New behavior
    .register(new CuriosityBehavior()) // New behavior for better understanding and questioning
    .register(new DefaultResponseBehavior(textProcessingUtils))
    .register(new VariationBehavior()); // New behavior (lowest priority as it modifies other responses)

  behaviorRegistry.initialized = true;
  return behaviorRegistry;
}

module.exports = {
  initializeBehaviors,
  behaviorRegistry,
};
