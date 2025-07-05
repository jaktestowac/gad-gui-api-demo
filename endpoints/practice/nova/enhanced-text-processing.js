/**
 * Enhanced Text Processing - Advanced text analysis and processing capabilities
 *
 * This module provides sophisticated text analysis including intent detection,
 * topic classification, sentiment analysis, and context understanding.
 */

const { logDebug } = require("../../../helpers/logger-api");

class EnhancedTextProcessing {
  constructor() {
    // Intent categories
    this.intents = {
      QUESTION: "question",
      STATEMENT: "statement",
      COMMAND: "command",
      GREETING: "greeting",
      FAREWELL: "farewell",
      THANK: "thank",
      APOLOGY: "apology",
      COMPLIMENT: "compliment",
      COMPLAINT: "complaint",
      REQUEST: "request",
      CLARIFICATION: "clarification",
      AGREEMENT: "agreement",
      DISAGREEMENT: "disagreement"
    };

    // Intent patterns
    this.intentPatterns = {
      question: [
        /^(what|who|where|when|why|how|which|whose|whom)\b/i,
        /^(can|could|would|will|should|may|might|do|does|did|is|are|was|were|have|has|had)\s+\w+/i,
        /\?$/,
        /^(tell me|explain|describe|show me|help me|guide me)/i
      ],
      command: [
        /^(help|show|tell|explain|define|calculate|convert|play|start|stop|quit|exit)/i,
        /^(remember|forget|clear|reset|save|load|export|import)/i
      ],
      greeting: [
        /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|yo|hiya|heya)/i
      ],
      farewell: [
        /^(bye|goodbye|see you|farewell|take care|until next time|later|ciao)/i
      ],
      thank: [
        /^(thanks|thank you|thx|appreciate it|grateful)/i
      ],
      apology: [
        /^(sorry|apologize|excuse me|my bad|my mistake|oops)/i
      ],
      compliment: [
        /^(great|awesome|amazing|wonderful|fantastic|excellent|brilliant|outstanding|superb|incredible)/i,
        /^(good job|well done|nice work|you're great|you're amazing)/i
      ],
      complaint: [
        /^(bad|terrible|awful|horrible|worst|hate|dislike|problem|issue|broken|doesn't work)/i
      ],
      request: [
        /^(please|could you|would you|can you|i need|i want|i'd like)/i
      ],
      clarification: [
        /^(what do you mean|i don't understand|unclear|not sure|confused|huh)/i
      ],
      agreement: [
        /^(yes|yeah|yep|sure|okay|ok|alright|right|exactly|absolutely|definitely)/i
      ],
      disagreement: [
        /^(no|nope|nah|not really|i don't think so|disagree|wrong|incorrect)/i
      ]
    };

    // Topic categories with keywords
    this.topicCategories = {
      programming: [
        "javascript", "python", "java", "c++", "c#", "php", "ruby", "go", "rust", "swift",
        "code", "programming", "development", "coding", "script", "function", "class",
        "variable", "loop", "condition", "algorithm", "data structure", "framework"
      ],
      testing: [
        "test", "testing", "automation", "qa", "quality assurance", "selenium", "cypress",
        "jest", "mocha", "unit test", "integration test", "e2e", "end to end",
        "test case", "bug", "defect", "regression", "coverage"
      ],
      web: [
        "web", "website", "webpage", "html", "css", "react", "vue", "angular", "node",
        "frontend", "backend", "api", "rest", "http", "https", "server", "client",
        "browser", "dom", "ajax", "fetch"
      ],
      database: [
        "database", "sql", "mysql", "postgresql", "mongodb", "redis", "query",
        "table", "record", "field", "index", "schema", "migration", "orm"
      ],
      devops: [
        "devops", "ci/cd", "pipeline", "docker", "kubernetes", "aws", "azure", "gcp",
        "deployment", "server", "infrastructure", "monitoring", "logging"
      ],
      games: [
        "game", "play", "rock paper scissors", "hangman", "number guessing",
        "puzzle", "challenge", "score", "win", "lose", "fun"
      ],
      learning: [
        "learn", "study", "tutorial", "course", "lesson", "practice", "exercise",
        "example", "demonstration", "guide", "documentation", "reference"
      ],
      general: [
        "general", "random", "interesting", "fact", "joke", "weather", "time",
        "date", "news", "current events"
      ]
    };

    // Sentiment patterns
    this.sentimentPatterns = {
      positive: [
        "great", "awesome", "amazing", "wonderful", "fantastic", "excellent", "brilliant",
        "outstanding", "superb", "incredible", "love", "like", "enjoy", "happy", "excited",
        "thrilled", "perfect", "wow", "cool", "nice", "good", "fine", "okay", "alright"
      ],
      negative: [
        "bad", "terrible", "awful", "horrible", "worst", "hate", "dislike", "sad",
        "angry", "frustrated", "annoyed", "upset", "disappointed", "confused", "lost",
        "stuck", "problem", "issue", "difficult", "hard", "tough", "challenging"
      ],
      neutral: [
        "okay", "fine", "alright", "normal", "usual", "standard", "typical", "regular"
      ]
    };

    // Context indicators
    this.contextIndicators = {
      continuation: [
        "and", "also", "plus", "furthermore", "moreover", "additionally", "besides",
        "what about", "how about", "can you also", "another thing"
      ],
      transition: [
        "by the way", "speaking of", "on another note", "changing the subject",
        "getting back to", "anyway", "so", "well", "actually", "in fact"
      ],
      conclusion: [
        "that's all", "that's it", "end of story", "in conclusion", "finally",
        "to sum up", "in summary", "that's everything"
      ]
    };
  }

  /**
   * Detect the primary intent of a message
   * @param {string} message - The message to analyze
   * @returns {object} - Intent detection results
   */
  detectIntent(message) {
    const lowerMessage = message.toLowerCase().trim();
    const detectedIntents = [];
    let primaryIntent = this.intents.STATEMENT;
    let confidence = 0.5;

    // Check each intent pattern
    for (const [intentType, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(lowerMessage)) {
          detectedIntents.push({
            type: intentType,
            confidence: this._calculateIntentConfidence(lowerMessage, pattern)
          });
        }
      }
    }

    // Sort by confidence and select primary intent
    if (detectedIntents.length > 0) {
      detectedIntents.sort((a, b) => b.confidence - a.confidence);
      primaryIntent = detectedIntents[0].type;
      confidence = detectedIntents[0].confidence;
    }

    // Special handling for questions
    if (lowerMessage.includes('?')) {
      primaryIntent = this.intents.QUESTION;
      confidence = Math.max(confidence, 0.8);
    }

    return {
      primary: primaryIntent,
      confidence: confidence,
      all: detectedIntents
    };
  }

  /**
   * Classify the topic of a message
   * @param {string} message - The message to analyze
   * @returns {object} - Topic classification results
   */
  classifyTopic(message) {
    const lowerMessage = message.toLowerCase();
    const topicScores = {};
    let primaryTopic = "general";
    let confidence = 0.3;

    // Score each topic category
    for (const [topic, keywords] of Object.entries(this.topicCategories)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      topicScores[topic] = score;
    }

    // Find the topic with the highest score
    const maxScore = Math.max(...Object.values(topicScores));
    if (maxScore > 0) {
      for (const [topic, score] of Object.entries(topicScores)) {
        if (score === maxScore) {
          primaryTopic = topic;
          confidence = Math.min(1.0, score / 3); // Normalize confidence
          break;
        }
      }
    }

    return {
      primary: primaryTopic,
      confidence: confidence,
      scores: topicScores
    };
  }

  /**
   * Analyze sentiment of a message
   * @param {string} message - The message to analyze
   * @returns {object} - Sentiment analysis results
   */
  analyzeSentiment(message) {
    const lowerMessage = message.toLowerCase();
    const sentimentScores = {
      positive: 0,
      negative: 0,
      neutral: 0
    };

    // Count sentiment indicators
    for (const [sentiment, words] of Object.entries(this.sentimentPatterns)) {
      for (const word of words) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerMessage.match(regex);
        if (matches) {
          sentimentScores[sentiment] += matches.length;
        }
      }
    }

    // Determine primary sentiment
    const maxScore = Math.max(...Object.values(sentimentScores));
    let primarySentiment = "neutral";
    let intensity = 0.5;

    if (maxScore > 0) {
      for (const [sentiment, score] of Object.entries(sentimentScores)) {
        if (score === maxScore) {
          primarySentiment = sentiment;
          intensity = Math.min(1.0, score / 3); // Normalize intensity
          break;
        }
      }
    }

    return {
      primary: primarySentiment,
      intensity: intensity,
      scores: sentimentScores
    };
  }

  /**
   * Analyze context and conversation flow
   * @param {string} message - The current message
   * @param {Array} conversationHistory - Previous messages
   * @returns {object} - Context analysis results
   */
  analyzeContext(message, conversationHistory = []) {
    const lowerMessage = message.toLowerCase();
    const contextAnalysis = {
      isContinuation: false,
      isTransition: false,
      isConclusion: false,
      contextType: "new",
      topicContinuity: 0.0,
      flowIndicator: null
    };

    // Check for context indicators
    for (const [indicatorType, indicators] of Object.entries(this.contextIndicators)) {
      for (const indicator of indicators) {
        if (lowerMessage.includes(indicator.toLowerCase())) {
          contextAnalysis.flowIndicator = indicatorType;
          contextAnalysis[`is${indicatorType.charAt(0).toUpperCase() + indicatorType.slice(1)}`] = true;
          break;
        }
      }
    }

    // Analyze topic continuity with previous messages
    if (conversationHistory.length > 0) {
      const recentMessages = conversationHistory.slice(-3);
      const currentTopic = this.classifyTopic(message);
      
      let topicMatches = 0;
      for (const msg of recentMessages) {
        const msgTopic = this.classifyTopic(msg.content || msg);
        if (msgTopic.primary === currentTopic.primary) {
          topicMatches++;
        }
      }
      
      contextAnalysis.topicContinuity = topicMatches / recentMessages.length;
      
      if (contextAnalysis.topicContinuity > 0.5) {
        contextAnalysis.contextType = "continuation";
      } else if (contextAnalysis.isTransition) {
        contextAnalysis.contextType = "transition";
      } else if (contextAnalysis.isConclusion) {
        contextAnalysis.contextType = "conclusion";
      }
    }

    return contextAnalysis;
  }

  /**
   * Extract entities and key information from a message
   * @param {string} message - The message to analyze
   * @returns {object} - Entity extraction results
   */
  extractEntities(message) {
    const entities = {
      names: [],
      numbers: [],
      urls: [],
      emails: [],
      dates: [],
      times: [],
      commands: [],
      terms: []
    };

    // Extract names (simple pattern matching)
    const namePatterns = [
      /(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)/g
    ];
    
    for (const pattern of namePatterns) {
      const matches = message.match(pattern);
      if (matches) {
        entities.names.push(...matches.map(m => m.replace(/^(my name is|i'm|i am|call me)\s+/i, '')));
      }
    }

    // Extract numbers
    const numberMatches = message.match(/\d+(?:\.\d+)?/g);
    if (numberMatches) {
      entities.numbers.push(...numberMatches);
    }

    // Extract URLs
    const urlMatches = message.match(/https?:\/\/[^\s]+/gi);
    if (urlMatches) {
      entities.urls.push(...urlMatches);
    }

    // Extract emails
    const emailMatches = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi);
    if (emailMatches) {
      entities.emails.push(...emailMatches);
    }

    // Extract dates
    const dateMatches = message.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/g);
    if (dateMatches) {
      entities.dates.push(...dateMatches);
    }

    // Extract times
    const timeMatches = message.match(/\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?/gi);
    if (timeMatches) {
      entities.times.push(...timeMatches);
    }

    // Extract potential commands
    const commandMatches = message.match(/\b(help|show|tell|explain|define|calculate|convert|play|start|stop|quit|exit)\b/gi);
    if (commandMatches) {
      entities.commands.push(...commandMatches);
    }

    // Extract potential terms (words that might be technical terms)
    const words = message.toLowerCase().split(/\s+/);
    const commonWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
      "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
      "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those",
      "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them"
    ]);
    
    const potentialTerms = words.filter(word => 
      word.length > 3 && 
      !commonWords.has(word) && 
      /^[a-zA-Z]+$/.test(word)
    );
    
    entities.terms.push(...potentialTerms);

    return entities;
  }

  /**
   * Calculate intent confidence based on pattern match
   * @private
   * @param {string} message - The message
   * @param {RegExp} pattern - The pattern that matched
   * @returns {number} - Confidence score (0-1)
   */
  _calculateIntentConfidence(message, pattern) {
    // Base confidence on pattern type and position
    let confidence = 0.5;
    
    // Higher confidence for patterns at the beginning
    if (pattern.test(message) && message.match(pattern)[0].length === message.length) {
      confidence = 0.9;
    } else if (pattern.test(message) && message.indexOf(message.match(pattern)[0]) === 0) {
      confidence = 0.8;
    } else if (pattern.test(message)) {
      confidence = 0.6;
    }
    
    return confidence;
  }

  /**
   * Get comprehensive text analysis
   * @param {string} message - The message to analyze
   * @param {Array} conversationHistory - Previous messages
   * @returns {object} - Complete text analysis
   */
  analyzeText(message, conversationHistory = []) {
    return {
      intent: this.detectIntent(message),
      topic: this.classifyTopic(message),
      sentiment: this.analyzeSentiment(message),
      context: this.analyzeContext(message, conversationHistory),
      entities: this.extractEntities(message),
      originalMessage: message
    };
  }
}

module.exports = EnhancedTextProcessing; 