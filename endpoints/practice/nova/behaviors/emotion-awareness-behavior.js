/**
 * Emotion Awareness Behavior - Enhances Nova's emotional intelligence
 *
 * This behavior detects user emotions, adapts responses to match emotional context,
 * and provides empathetic and supportive interactions.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class EmotionAwarenessBehavior extends BaseBehavior {
  constructor() {
    // Medium priority to ensure emotional awareness without overriding core functionality
    super("emotion-awareness", 550);

    // Emotion categories
    this.emotions = {
      POSITIVE: "positive",
      NEGATIVE: "negative",
      NEUTRAL: "neutral",
      FRUSTRATED: "frustrated",
      CONFUSED: "confused",
      EXCITED: "excited",
      ANXIOUS: "anxious",
      SATISFIED: "satisfied"
    };

    // Emotion detection patterns
    this.emotionPatterns = {
      positive: [
        "great", "awesome", "amazing", "wonderful", "fantastic", "excellent",
        "love", "like", "enjoy", "happy", "excited", "thrilled", "perfect",
        "brilliant", "outstanding", "superb", "incredible", "wow", "cool"
      ],
      negative: [
        "bad", "terrible", "awful", "horrible", "worst", "hate", "dislike",
        "sad", "angry", "frustrated", "annoyed", "upset", "disappointed",
        "confused", "lost", "stuck", "problem", "issue", "difficult"
      ],
      frustrated: [
        "frustrated", "annoyed", "irritated", "angry", "mad", "upset",
        "fed up", "tired of", "sick of", "had enough", "can't stand",
        "not working", "broken", "doesn't work", "failed", "error"
      ],
      confused: [
        "confused", "lost", "don't understand", "unclear", "not sure",
        "what do you mean", "i don't get it", "huh", "?", "puzzled",
        "perplexed", "baffled", "mystified", "clueless"
      ],
      excited: [
        "excited", "thrilled", "can't wait", "looking forward", "eager",
        "enthusiastic", "pumped", "stoked", "awesome", "amazing",
        "incredible", "fantastic", "wonderful", "brilliant"
      ],
      anxious: [
        "worried", "concerned", "anxious", "nervous", "stressed",
        "afraid", "scared", "fear", "panic", "overwhelmed",
        "pressure", "deadline", "urgent", "important"
      ],
      satisfied: [
        "satisfied", "happy", "pleased", "content", "good", "fine",
        "okay", "alright", "works", "solved", "fixed", "resolved",
        "thank you", "thanks", "appreciate"
      ]
    };

    // Response templates for different emotions
    this.responseTemplates = {
      positive: [
        "I'm glad you're feeling positive about this! 😊",
        "That's wonderful to hear! 🌟",
        "Your enthusiasm is contagious! ✨",
        "I'm excited to help you with this! 🚀"
      ],
      negative: [
        "I understand this might be challenging. Let me help you work through it. 🤝",
        "I'm here to support you. Let's tackle this together. 💪",
        "It's okay to feel frustrated. Let's find a solution. 🛠️",
        "I want to make sure I'm being helpful. What can I do better? 🤔"
      ],
      frustrated: [
        "I can see you're frustrated, and that's completely understandable. Let's take a step back and work through this together. 🫂",
        "I hear your frustration. Let me try a different approach to help you. 🔄",
        "I want to help you resolve this. Can you tell me more about what's not working? 🎯",
        "Let's break this down into smaller, manageable steps. We'll get there! 📋"
      ],
      confused: [
        "I understand this might be confusing. Let me explain it more clearly. 📚",
        "It's totally normal to feel confused. Let's go through this step by step. 🚶‍♂️",
        "I want to make sure you understand. Can I explain this differently? 🤷‍♂️",
        "Let me break this down in simpler terms. Does this help? ✨"
      ],
      excited: [
        "Your excitement is amazing! I'm thrilled to help you with this! 🎉",
        "I love your enthusiasm! Let's make this happen! ⚡",
        "Your energy is fantastic! I'm here to support your journey! 🌈",
        "This is going to be great! I can't wait to see what we accomplish! 🚀"
      ],
      anxious: [
        "I understand this might be causing some anxiety. Let's take it one step at a time. 🫂",
        "It's okay to feel overwhelmed. We'll work through this together. 💙",
        "I'm here to help reduce any stress you might be feeling. Let's tackle this calmly. 🧘‍♀️",
        "You're not alone in this. I'm here to support you every step of the way. 🤝"
      ],
      satisfied: [
        "I'm so glad I could help! 😊",
        "That's wonderful! I'm happy we found a solution. ✨",
        "Great! I'm pleased we could work through this together. 🌟",
        "Excellent! I'm glad everything is working out. 🎉"
      ]
    };
  }

  /**
   * Check if this behavior should provide emotional awareness
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior should provide emotional awareness
   */
  canHandle(message, context) {
    // Always detect emotions, but only enhance responses when needed
    this._detectEmotion(message, context);
    
    // Check if we need to provide emotional support
    return this._needsEmotionalSupport(message, context);
  }

  /**
   * Handle emotional awareness enhancement
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - Enhanced response with emotional awareness
   */
  handle(message, context) {
    // If another behavior has already generated a response, enhance it
    if (context.generatedResponse) {
      return this._enhanceResponseWithEmotion(context.generatedResponse, context);
    }

    // Generate emotion-aware response directly
    return this._generateEmotionAwareResponse(message, context);
  }

  /**
   * Detect emotion in the user's message
   * @private
   * @param {string} message - The message to analyze
   * @param {object} context - Message context
   */
  _detectEmotion(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Initialize emotion tracking if not present
    if (!context.userMemory.emotionTracking) {
      context.userMemory.emotionTracking = {
        currentEmotion: this.emotions.NEUTRAL,
        emotionHistory: [],
        emotionalStability: 0.5,
        lastEmotionChange: null,
        emotionalIntensity: 0.5
      };
    }

    const emotionTrack = context.userMemory.emotionTracking;
    const detectedEmotion = this._analyzeEmotion(lowerMessage);
    
    // Update emotion history
    emotionTrack.emotionHistory.push({
      emotion: detectedEmotion,
      timestamp: Date.now(),
      message: message.substring(0, 50)
    });

    // Keep only recent emotion history (last 20 interactions)
    if (emotionTrack.emotionHistory.length > 20) {
      emotionTrack.emotionHistory = emotionTrack.emotionHistory.slice(-20);
    }

    // Update current emotion if it changed
    if (detectedEmotion !== emotionTrack.currentEmotion) {
      emotionTrack.lastEmotionChange = Date.now();
      emotionTrack.currentEmotion = detectedEmotion;
      
      logDebug("[Nova] EmotionAwarenessBehavior: Emotion change detected", {
        from: emotionTrack.currentEmotion,
        to: detectedEmotion,
        message: message.substring(0, 50)
      });
    }

    // Calculate emotional stability
    this._calculateEmotionalStability(emotionTrack);

    // Calculate emotional intensity
    emotionTrack.emotionalIntensity = this._calculateEmotionalIntensity(lowerMessage);

    // Store detected emotion in context for other behaviors
    context.detectedEmotion = detectedEmotion;
    context.emotionalIntensity = emotionTrack.emotionalIntensity;
  }

  /**
   * Analyze the emotion in a message
   * @private
   * @param {string} lowerMessage - Lowercase message to analyze
   * @returns {string} - Detected emotion
   */
  _analyzeEmotion(lowerMessage) {
    const emotionScores = {};

    // Score each emotion category
    for (const [emotion, patterns] of Object.entries(this.emotionPatterns)) {
      emotionScores[emotion] = 0;
      
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern)) {
          emotionScores[emotion]++;
        }
      }
    }

    // Find the emotion with the highest score
    let maxScore = 0;
    let detectedEmotion = this.emotions.NEUTRAL;

    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedEmotion = emotion;
      }
    }

    // Check for punctuation and capitalization as intensity indicators
    const exclamationCount = (lowerMessage.match(/!/g) || []).length;
    const questionCount = (lowerMessage.match(/\?/g) || []).length;
    const capsCount = (lowerMessage.match(/[A-Z]/g) || []).length;

    // Adjust emotion based on intensity indicators
    if (exclamationCount > 2 || capsCount > 5) {
      if (detectedEmotion === this.emotions.POSITIVE) {
        detectedEmotion = this.emotions.EXCITED;
      } else if (detectedEmotion === this.emotions.NEGATIVE) {
        detectedEmotion = this.emotions.FRUSTRATED;
      }
    }

    if (questionCount > 2) {
      if (detectedEmotion === this.emotions.NEUTRAL) {
        detectedEmotion = this.emotions.CONFUSED;
      }
    }

    return detectedEmotion;
  }

  /**
   * Calculate emotional stability based on emotion history
   * @private
   * @param {object} emotionTrack - Emotion tracking object
   */
  _calculateEmotionalStability(emotionTrack) {
    if (emotionTrack.emotionHistory.length < 3) {
      emotionTrack.emotionalStability = 0.5;
      return;
    }

    const recentEmotions = emotionTrack.emotionHistory.slice(-5);
    let emotionChanges = 0;

    for (let i = 1; i < recentEmotions.length; i++) {
      if (recentEmotions[i].emotion !== recentEmotions[i-1].emotion) {
        emotionChanges++;
      }
    }

    // Stability is inverse to changes (fewer changes = more stable)
    emotionTrack.emotionalStability = Math.max(0, 1 - (emotionChanges / recentEmotions.length));
  }

  /**
   * Calculate emotional intensity
   * @private
   * @param {string} lowerMessage - Lowercase message
   * @returns {number} - Intensity score (0-1)
   */
  _calculateEmotionalIntensity(lowerMessage) {
    let intensity = 0.5; // Base intensity

    // Exclamation marks increase intensity
    const exclamationCount = (lowerMessage.match(/!/g) || []).length;
    intensity += exclamationCount * 0.1;

    // Capital letters increase intensity
    const capsCount = (lowerMessage.match(/[A-Z]/g) || []).length;
    intensity += capsCount * 0.02;

    // Question marks can indicate confusion or intensity
    const questionCount = (lowerMessage.match(/\?/g) || []).length;
    intensity += questionCount * 0.05;

    // Strong words increase intensity
    const strongWords = ["very", "really", "extremely", "absolutely", "completely", "totally"];
    for (const word of strongWords) {
      if (lowerMessage.includes(word)) {
        intensity += 0.1;
      }
    }

    return Math.min(1.0, Math.max(0.0, intensity));
  }

  /**
   * Check if emotional support is needed
   * @private
   * @param {string} message - The message to check
   * @param {object} context - Message context
   * @returns {boolean} - True if emotional support needed
   */
  _needsEmotionalSupport(message, context) {
    if (!context.userMemory.emotionTracking) {
      return false;
    }

    const emotionTrack = context.userMemory.emotionTracking;

    // Provide support for negative emotions
    if ([this.emotions.NEGATIVE, this.emotions.FRUSTRATED, this.emotions.CONFUSED, this.emotions.ANXIOUS].includes(emotionTrack.currentEmotion)) {
      return true;
    }

    // Provide support for high emotional intensity
    if (emotionTrack.emotionalIntensity > 0.7) {
      return true;
    }

    // Provide support for low emotional stability
    if (emotionTrack.emotionalStability < 0.3) {
      return true;
    }

    // Provide support for emotion changes
    if (emotionTrack.lastEmotionChange && Date.now() - emotionTrack.lastEmotionChange < 60000) {
      return true;
    }

    return false;
  }

  /**
   * Enhance response with emotional awareness
   * @private
   * @param {string} response - The original response
   * @param {object} context - Message context
   * @returns {string} - Enhanced response
   */
  _enhanceResponseWithEmotion(response, context) {
    const emotionTrack = context.userMemory.emotionTracking;
    if (!emotionTrack) {
      return response;
    }

    let enhancedResponse = response;

    // Add emotional support based on detected emotion
    const emotion = emotionTrack.currentEmotion;
    const templates = this.responseTemplates[emotion] || this.responseTemplates.neutral;

    if (templates && templates.length > 0) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      // Add emotional support at the beginning or end based on emotion type
      if ([this.emotions.NEGATIVE, this.emotions.FRUSTRATED, this.emotions.CONFUSED, this.emotions.ANXIOUS].includes(emotion)) {
        enhancedResponse = `${template}\n\n${response}`;
      } else {
        enhancedResponse = `${response}\n\n${template}`;
      }
    }

    // Add intensity-specific support
    if (emotionTrack.emotionalIntensity > 0.8) {
      enhancedResponse = `${enhancedResponse}\n\nI can sense this is important to you. I'm here to help! 💪`;
    }

    // Add stability support for unstable emotions
    if (emotionTrack.emotionalStability < 0.3) {
      enhancedResponse = `${enhancedResponse}\n\nI want to make sure I'm being consistent and helpful. Let me know if you need anything! 🤝`;
    }

    return enhancedResponse;
  }

  /**
   * Generate an emotion-aware response directly
   * @private
   * @param {string} message - The message to respond to
   * @param {object} context - Message context
   * @returns {string} - Emotion-aware response
   */
  _generateEmotionAwareResponse(message, context) {
    const emotionTrack = context.userMemory.emotionTracking;
    if (!emotionTrack) {
      return "I'm here to help! How can I assist you today?";
    }

    const emotion = emotionTrack.currentEmotion;

    // Provide emotion-specific responses
    switch (emotion) {
      case this.emotions.FRUSTRATED:
        return "I can see you're feeling frustrated, and I completely understand. Let's work through this together. What specific issue are you facing? I'm here to help find a solution. 🫂";
      
      case this.emotions.CONFUSED:
        return "I understand this might be confusing. Let me help clarify things for you. What specifically would you like me to explain better? I'm here to make things clearer. 📚";
      
      case this.emotions.ANXIOUS:
        return "I can sense you might be feeling some anxiety about this. Let's take it step by step, and I'll be here to support you throughout. What's causing the most concern? 💙";
      
      case this.emotions.EXCITED:
        return "Your excitement is wonderful! I'm thrilled to help you with this. Let's channel that energy into something amazing! What would you like to work on? 🚀";
      
      case this.emotions.SATISFIED:
        return "I'm so glad you're feeling satisfied! It's wonderful when things work out well. Is there anything else I can help you with? 😊";
      
      default:
        return "I'm here to help! How can I assist you today?";
    }
  }
}

module.exports = EmotionAwarenessBehavior; 