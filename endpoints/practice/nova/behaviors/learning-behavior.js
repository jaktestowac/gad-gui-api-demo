/**
 * Learning Behavior - Enhances Nova's ability to adapt to user learning patterns
 *
 * This behavior tracks user learning preferences, adapts responses based on their
 * knowledge level, and provides personalized learning suggestions.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class LearningBehavior extends BaseBehavior {
  constructor() {
    // Medium-high priority to ensure learning adaptation
    super("learning", 650);

    // Learning levels
    this.learningLevels = {
      BEGINNER: "beginner",
      INTERMEDIATE: "intermediate",
      ADVANCED: "advanced",
      EXPERT: "expert"
    };

    // Learning styles
    this.learningStyles = {
      VISUAL: "visual",
      AUDITORY: "auditory",
      KINESTHETIC: "kinesthetic",
      READING: "reading",
      PRACTICAL: "practical"
    };

    // Topic complexity mapping
    this.topicComplexity = {
      "javascript": { beginner: 1, intermediate: 2, advanced: 3, expert: 4 },
      "python": { beginner: 1, intermediate: 2, advanced: 3, expert: 4 },
      "testing": { beginner: 1, intermediate: 2, advanced: 3, expert: 4 },
      "automation": { beginner: 2, intermediate: 3, advanced: 4, expert: 5 },
      "api": { beginner: 2, intermediate: 3, advanced: 4, expert: 5 },
      "database": { beginner: 2, intermediate: 3, advanced: 4, expert: 5 },
      "web development": { beginner: 1, intermediate: 2, advanced: 3, expert: 4 },
      "machine learning": { beginner: 3, intermediate: 4, advanced: 5, expert: 5 },
      "devops": { beginner: 3, intermediate: 4, advanced: 5, expert: 5 }
    };
  }

  /**
   * Check if this behavior should adapt learning responses
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior should adapt learning
   */
  canHandle(message, context) {
    // Always update learning profile, but only adapt responses when needed
    this._updateLearningProfile(message, context);
    
    // Check if we need to provide learning adaptations
    return this._needsLearningAdaptation(message, context);
  }

  /**
   * Handle learning adaptation
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - Adapted response with learning considerations
   */
  handle(message, context) {
    // If another behavior has already generated a response, adapt it
    if (context.generatedResponse) {
      return this._adaptResponseForLearning(context.generatedResponse, context);
    }

    // Generate learning-focused response directly
    return this._generateLearningResponse(message, context);
  }

  /**
   * Update the user's learning profile
   * @private
   * @param {string} message - The current message
   * @param {object} context - Message context
   */
  _updateLearningProfile(message, context) {
    const userId = context.userId || context.conversationId?.split("_")[0];
    if (!userId) return;

    // Initialize learning profile if not present
    if (!context.userMemory.learningProfile) {
      context.userMemory.learningProfile = {
        currentLevel: this.learningLevels.BEGINNER,
        preferredStyle: this.learningStyles.PRACTICAL,
        topicProgress: {},
        learningHistory: [],
        confidenceLevel: 0.5,
        preferredComplexity: "medium",
        lastAssessment: null
      };
    }

    const profile = context.userMemory.learningProfile;

    // Update topic progress
    if (context.currentTopic) {
      this._updateTopicProgress(context.currentTopic, profile);
    }

    // Detect learning style preferences
    this._detectLearningStyle(message, profile);

    // Assess confidence level
    this._assessConfidence(message, profile);

    // Update learning history
    this._updateLearningHistory(message, context, profile);

    // Periodically reassess learning level
    this._reassessLearningLevel(profile);
  }

  /**
   * Update progress for a specific topic
   * @private
   * @param {string} topic - The topic being discussed
   * @param {object} profile - Learning profile
   */
  _updateTopicProgress(topic, profile) {
    if (!profile.topicProgress[topic]) {
      profile.topicProgress[topic] = {
        interactions: 0,
        lastInteraction: null,
        confidence: 0.5,
        complexity: "medium"
      };
    }

    const topicProgress = profile.topicProgress[topic];
    topicProgress.interactions++;
    topicProgress.lastInteraction = Date.now();

    // Adjust confidence based on interaction patterns
    if (topicProgress.interactions > 5) {
      topicProgress.confidence = Math.min(1.0, topicProgress.confidence + 0.1);
    }
  }

  /**
   * Detect user's preferred learning style
   * @private
   * @param {string} message - The message to analyze
   * @param {object} profile - Learning profile
   */
  _detectLearningStyle(message, profile) {
    const lowerMessage = message.toLowerCase();

    // Visual learning indicators
    const visualIndicators = [
      "show me",
      "can you show",
      "visual",
      "picture",
      "diagram",
      "chart",
      "see",
      "look at"
    ];

    // Auditory learning indicators
    const auditoryIndicators = [
      "tell me",
      "explain",
      "describe",
      "talk about",
      "walk me through",
      "step by step"
    ];

    // Practical learning indicators
    const practicalIndicators = [
      "example",
      "practice",
      "try",
      "hands-on",
      "real-world",
      "actual",
      "demonstrate"
    ];

    // Reading learning indicators
    const readingIndicators = [
      "documentation",
      "read",
      "text",
      "written",
      "reference",
      "manual"
    ];

    // Count indicators for each style
    const styleCounts = {
      [this.learningStyles.VISUAL]: visualIndicators.filter(indicator => lowerMessage.includes(indicator)).length,
      [this.learningStyles.AUDITORY]: auditoryIndicators.filter(indicator => lowerMessage.includes(indicator)).length,
      [this.learningStyles.PRACTICAL]: practicalIndicators.filter(indicator => lowerMessage.includes(indicator)).length,
      [this.learningStyles.READING]: readingIndicators.filter(indicator => lowerMessage.includes(indicator)).length
    };

    // Find the most preferred style
    const maxCount = Math.max(...Object.values(styleCounts));
    if (maxCount > 0) {
      const preferredStyle = Object.keys(styleCounts).find(style => styleCounts[style] === maxCount);
      profile.preferredStyle = preferredStyle;
    }
  }

  /**
   * Assess user's confidence level
   * @private
   * @param {string} message - The message to analyze
   * @param {object} profile - Learning profile
   */
  _assessConfidence(message, profile) {
    const lowerMessage = message.toLowerCase();

    // High confidence indicators
    const highConfidenceIndicators = [
      "i know",
      "i understand",
      "i can",
      "i'm familiar",
      "i've used",
      "i've worked with",
      "definitely",
      "certainly",
      "absolutely"
    ];

    // Low confidence indicators
    const lowConfidenceIndicators = [
      "i don't know",
      "i'm not sure",
      "maybe",
      "i think",
      "possibly",
      "i guess",
      "confused",
      "unclear",
      "not sure"
    ];

    const highCount = highConfidenceIndicators.filter(indicator => lowerMessage.includes(indicator)).length;
    const lowCount = lowConfidenceIndicators.filter(indicator => lowerMessage.includes(indicator)).length;

    if (highCount > lowCount) {
      profile.confidenceLevel = Math.min(1.0, profile.confidenceLevel + 0.1);
    } else if (lowCount > highCount) {
      profile.confidenceLevel = Math.max(0.0, profile.confidenceLevel - 0.1);
    }
  }

  /**
   * Update learning history
   * @private
   * @param {string} message - The current message
   * @param {object} context - Message context
   * @param {object} profile - Learning profile
   */
  _updateLearningHistory(message, context, profile) {
    const historyEntry = {
      timestamp: Date.now(),
      topic: context.currentTopic || "general",
      messageLength: message.length,
      hasQuestion: message.includes("?"),
      complexity: this._assessMessageComplexity(message),
      topic: context.currentTopic
    };

    profile.learningHistory.push(historyEntry);

    // Keep only recent history (last 50 interactions)
    if (profile.learningHistory.length > 50) {
      profile.learningHistory = profile.learningHistory.slice(-50);
    }
  }

  /**
   * Reassess learning level based on recent interactions
   * @private
   * @param {object} profile - Learning profile
   */
  _reassessLearningLevel(profile) {
    // Only reassess every 10 interactions
    if (profile.learningHistory.length % 10 !== 0) {
      return;
    }

    const recentHistory = profile.learningHistory.slice(-10);
    const avgComplexity = recentHistory.reduce((sum, entry) => sum + entry.complexity, 0) / recentHistory.length;
    const avgConfidence = profile.confidenceLevel;

    // Determine new level based on complexity and confidence
    if (avgComplexity > 4 && avgConfidence > 0.8) {
      profile.currentLevel = this.learningLevels.EXPERT;
    } else if (avgComplexity > 3 && avgConfidence > 0.6) {
      profile.currentLevel = this.learningLevels.ADVANCED;
    } else if (avgComplexity > 2 && avgConfidence > 0.4) {
      profile.currentLevel = this.learningLevels.INTERMEDIATE;
    } else {
      profile.currentLevel = this.learningLevels.BEGINNER;
    }

    profile.lastAssessment = Date.now();
  }

  /**
   * Assess message complexity
   * @private
   * @param {string} message - The message to assess
   * @returns {number} - Complexity score (1-5)
   */
  _assessMessageComplexity(message) {
    const words = message.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const hasTechnicalTerms = /(api|database|algorithm|framework|architecture|deployment|integration)/i.test(message);
    const hasQuestions = message.includes("?");
    const hasCodeReferences = /(function|class|method|variable|loop|condition)/i.test(message);

    let complexity = 1;
    if (avgWordLength > 6) complexity++;
    if (hasTechnicalTerms) complexity++;
    if (hasQuestions) complexity++;
    if (hasCodeReferences) complexity++;
    if (message.length > 100) complexity++;

    return Math.min(5, complexity);
  }

  /**
   * Check if learning adaptation is needed
   * @private
   * @param {string} message - The message to check
   * @param {object} context - Message context
   * @returns {boolean} - True if adaptation needed
   */
  _needsLearningAdaptation(message, context) {
    if (!context.userMemory.learningProfile) {
      return false;
    }

    const profile = context.userMemory.learningProfile;

    // Adapt for beginners
    if (profile.currentLevel === this.learningLevels.BEGINNER) {
      return true;
    }

    // Adapt for low confidence
    if (profile.confidenceLevel < 0.3) {
      return true;
    }

    // Adapt for specific learning style requests
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("explain") || lowerMessage.includes("show me") || lowerMessage.includes("example")) {
      return true;
    }

    return false;
  }

  /**
   * Adapt response for learning preferences
   * @private
   * @param {string} response - The original response
   * @param {object} context - Message context
   * @returns {string} - Adapted response
   */
  _adaptResponseForLearning(response, context) {
    const profile = context.userMemory.learningProfile;
    if (!profile) {
      return response;
    }

    let adaptedResponse = response;

    // Add complexity indicators for beginners
    if (profile.currentLevel === this.learningLevels.BEGINNER) {
      adaptedResponse = `${response}\n\n💡 Beginner Tip: Take your time with this concept. Feel free to ask for more examples or clarification!`;
    }

    // Add confidence building for low confidence users
    if (profile.confidenceLevel < 0.3) {
      adaptedResponse = `${response}\n\n🌟 Remember: Learning takes time, and it's perfectly normal to have questions. You're doing great!`;
    }

    // Adapt for learning style
    switch (profile.preferredStyle) {
      case this.learningStyles.VISUAL:
        adaptedResponse = `${response}\n\n👁️ Visual Learner Tip: Try drawing out this concept or looking for diagrams to help visualize it.`;
        break;
      case this.learningStyles.PRACTICAL:
        adaptedResponse = `${response}\n\n🔧 Hands-on Tip: Try practicing this concept with a small example or project.`;
        break;
      case this.learningStyles.AUDITORY:
        adaptedResponse = `${response}\n\n🎧 Audio Learner Tip: Try explaining this concept to someone else or record yourself explaining it.`;
        break;
    }

    return adaptedResponse;
  }

  /**
   * Generate a learning-focused response directly
   * @private
   * @param {string} message - The message to respond to
   * @param {object} context - Message context
   * @returns {string} - Learning-focused response
   */
  _generateLearningResponse(message, context) {
    const profile = context.userMemory.learningProfile;
    if (!profile) {
      return "I'm here to help you learn! What would you like to explore?";
    }

    // Provide learning suggestions based on profile
    if (profile.currentLevel === this.learningLevels.BEGINNER) {
      return "I'd be happy to help you learn! Since you're just starting out, I can provide simple explanations and lots of examples. What topic would you like to explore?";
    }

    if (profile.confidenceLevel < 0.3) {
      return "I understand learning can be challenging sometimes. Let's take this step by step, and I'll make sure to explain things clearly. What would you like to work on?";
    }

    return "I'm here to support your learning journey! What would you like to explore or practice today?";
  }
}

module.exports = LearningBehavior; 