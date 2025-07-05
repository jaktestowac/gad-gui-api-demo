/**
 * Response Quality Behavior - Assesses and improves response quality
 *
 * This behavior evaluates responses based on multiple quality metrics and
 * suggests improvements to make responses more effective and engaging.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class ResponseQualityBehavior extends BaseBehavior {
  constructor() {
    // High priority to ensure quality assessment happens early
    super("response-quality", 750);

    // Quality metrics
    this.qualityMetrics = {
      RELEVANCE: "relevance",
      COMPLETENESS: "completeness", 
      CLARITY: "clarity",
      HELPFULNESS: "helpfulness",
      ENGAGEMENT: "engagement"
    };

    // Quality thresholds
    this.qualityThresholds = {
      EXCELLENT: 0.9,
      GOOD: 0.7,
      ACCEPTABLE: 0.5,
      NEEDS_IMPROVEMENT: 0.3
    };

    // Response improvement templates
    this.improvementTemplates = {
      tooShort: [
        "Let me provide more detail about that.",
        "I should elaborate on this point.",
        "Let me give you a more complete answer.",
        "I'll expand on that for you."
      ],
      unclear: [
        "Let me explain that more clearly.",
        "I should rephrase that to be more understandable.",
        "Let me break this down better.",
        "I'll make that clearer for you."
      ],
      notHelpful: [
        "Let me provide more practical information.",
        "I should give you actionable advice.",
        "Let me offer more specific guidance.",
        "I'll provide more useful details."
      ],
      notEngaging: [
        "This is actually quite interesting because...",
        "What's fascinating about this is...",
        "You might find this helpful because...",
        "This is worth noting because..."
      ]
    };
  }

  /**
   * Check if this behavior should assess response quality
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior should assess quality
   */
  canHandle(message, context) {
    // Always assess quality when a response has been generated
    return context.generatedResponse && context.generatedResponse.length > 0;
  }

  /**
   * Handle response quality assessment and improvement
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - Improved response
   */
  handle(message, context) {
    const originalResponse = context.generatedResponse;
    
    // Assess the quality of the current response
    const qualityScore = this._assessResponseQuality(originalResponse, message, context);
    
    // Store quality metrics in context for other behaviors
    context.responseQuality = qualityScore;
    
    // If quality is good enough, return as is
    if (qualityScore.overall >= this.qualityThresholds.GOOD) {
      logDebug("[Nova] ResponseQualityBehavior: Response quality is good", {
        overall: qualityScore.overall,
        metrics: qualityScore.metrics
      });
      return originalResponse;
    }
    
    // Improve the response based on quality assessment
    const improvedResponse = this._improveResponse(originalResponse, qualityScore, context);
    
    logDebug("[Nova] ResponseQualityBehavior: Improved response quality", {
      originalScore: qualityScore.overall,
      improvements: qualityScore.improvements
    });
    
    return improvedResponse;
  }

  /**
   * Assess the quality of a response
   * @private
   * @param {string} response - The response to assess
   * @param {string} message - The original user message
   * @param {object} context - Message context
   * @returns {object} - Quality assessment results
   */
  _assessResponseQuality(response, message, context) {
    const metrics = {};
    const improvements = [];
    
    // Assess relevance
    metrics.relevance = this._assessRelevance(response, message, context);
    if (metrics.relevance < this.qualityThresholds.GOOD) {
      improvements.push("relevance");
    }
    
    // Assess completeness
    metrics.completeness = this._assessCompleteness(response, message, context);
    if (metrics.completeness < this.qualityThresholds.GOOD) {
      improvements.push("completeness");
    }
    
    // Assess clarity
    metrics.clarity = this._assessClarity(response);
    if (metrics.clarity < this.qualityThresholds.GOOD) {
      improvements.push("clarity");
    }
    
    // Assess helpfulness
    metrics.helpfulness = this._assessHelpfulness(response, message, context);
    if (metrics.helpfulness < this.qualityThresholds.GOOD) {
      improvements.push("helpfulness");
    }
    
    // Assess engagement
    metrics.engagement = this._assessEngagement(response, context);
    if (metrics.engagement < this.qualityThresholds.GOOD) {
      improvements.push("engagement");
    }
    
    // Calculate overall score
    const overall = Object.values(metrics).reduce((sum, score) => sum + score, 0) / Object.keys(metrics).length;
    
    return {
      overall,
      metrics,
      improvements
    };
  }

  /**
   * Assess response relevance to the user's message
   * @private
   * @param {string} response - The response to assess
   * @param {string} message - The original user message
   * @param {object} context - Message context
   * @returns {number} - Relevance score (0-1)
   */
  _assessRelevance(response, message, context) {
    const lowerResponse = response.toLowerCase();
    const lowerMessage = message.toLowerCase();
    
    // Extract key terms from the message
    const messageTerms = this._extractKeyTerms(lowerMessage);
    const responseTerms = this._extractKeyTerms(lowerResponse);
    
    // Count matching terms
    let matches = 0;
    for (const term of messageTerms) {
      if (responseTerms.includes(term)) {
        matches++;
      }
    }
    
    // Calculate relevance score
    const relevanceScore = messageTerms.length > 0 ? matches / messageTerms.length : 0.5;
    
    // Boost score if response addresses the detected topic
    if (context.currentTopic && lowerResponse.includes(context.currentTopic.toLowerCase())) {
      return Math.min(1.0, relevanceScore + 0.2);
    }
    
    return relevanceScore;
  }

  /**
   * Assess response completeness
   * @private
   * @param {string} response - The response to assess
   * @param {string} message - The original user message
   * @param {object} context - Message context
   * @returns {number} - Completeness score (0-1)
   */
  _assessCompleteness(response, message, context) {
    const lowerMessage = message.toLowerCase();
    const lowerResponse = response.toLowerCase();
    
    // Check if it's a question that needs a complete answer
    const isQuestion = /^(what|how|why|when|where|who|can|could|would|will|should|is|are|do|does|did)/i.test(message);
    
    if (isQuestion) {
      // For questions, check if response provides a substantive answer
      const hasSubstantiveContent = response.length > 20 && 
        !lowerResponse.includes("i don't know") && 
        !lowerResponse.includes("i'm not sure") &&
        !lowerResponse.includes("i can't help");
      
      if (!hasSubstantiveContent) {
        return 0.3;
      }
    }
    
    // Check response length appropriateness
    const messageLength = message.length;
    const responseLength = response.length;
    
    // Short responses to long questions might be incomplete
    if (messageLength > 50 && responseLength < 30) {
      return 0.4;
    }
    
    // Very short responses are often incomplete
    if (responseLength < 10) {
      return 0.2;
    }
    
    // Check if response ends with a question (might indicate incompleteness)
    if (response.endsWith('?')) {
      return 0.7;
    }
    
    return 0.9;
  }

  /**
   * Assess response clarity
   * @private
   * @param {string} response - The response to assess
   * @returns {number} - Clarity score (0-1)
   */
  _assessClarity(response) {
    const lowerResponse = response.toLowerCase();
    
    // Check for unclear phrases
    const unclearPhrases = [
      "i don't know",
      "i'm not sure",
      "i can't help",
      "i don't understand",
      "that's unclear",
      "i'm confused"
    ];
    
    for (const phrase of unclearPhrases) {
      if (lowerResponse.includes(phrase)) {
        return 0.3;
      }
    }
    
    // Check sentence structure
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    // Very long sentences might be unclear
    if (avgSentenceLength > 100) {
      return 0.6;
    }
    
    // Check for technical jargon without explanation
    const technicalTerms = [
      "api", "endpoint", "framework", "algorithm", "protocol", "interface",
      "methodology", "paradigm", "architecture", "infrastructure"
    ];
    
    let unexplainedTerms = 0;
    for (const term of technicalTerms) {
      if (lowerResponse.includes(term) && !lowerResponse.includes("is a") && !lowerResponse.includes("refers to")) {
        unexplainedTerms++;
      }
    }
    
    if (unexplainedTerms > 2) {
      return 0.5;
    }
    
    return 0.9;
  }

  /**
   * Assess response helpfulness
   * @private
   * @param {string} response - The response to assess
   * @param {string} message - The original user message
   * @param {object} context - Message context
   * @returns {number} - Helpfulness score (0-1)
   */
  _assessHelpfulness(response, message, context) {
    const lowerResponse = response.toLowerCase();
    const lowerMessage = message.toLowerCase();
    
    // Check if response provides actionable information
    const actionablePhrases = [
      "you can", "you should", "try", "use", "follow", "check", "look at",
      "here's how", "steps", "example", "demonstration", "tutorial"
    ];
    
    let hasActionableContent = false;
    for (const phrase of actionablePhrases) {
      if (lowerResponse.includes(phrase)) {
        hasActionableContent = true;
        break;
      }
    }
    
    // Check if response provides examples
    const hasExamples = lowerResponse.includes("example") || lowerResponse.includes("for instance");
    
    // Check if response provides resources
    const hasResources = lowerResponse.includes("resource") || lowerResponse.includes("link") || 
                        lowerResponse.includes("documentation") || lowerResponse.includes("guide");
    
    // Calculate helpfulness score
    let score = 0.5; // Base score
    
    if (hasActionableContent) score += 0.2;
    if (hasExamples) score += 0.15;
    if (hasResources) score += 0.15;
    
    // Penalize unhelpful responses
    if (lowerResponse.includes("i can't help") || lowerResponse.includes("i don't know")) {
      score = Math.max(0.1, score - 0.3);
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Assess response engagement
   * @private
   * @param {string} response - The response to assess
   * @param {object} context - Message context
   * @returns {number} - Engagement score (0-1)
   */
  _assessEngagement(response, context) {
    const lowerResponse = response.toLowerCase();
    
    // Check for engaging elements
    const engagingElements = [
      "interesting", "fascinating", "exciting", "amazing", "wonderful",
      "great", "awesome", "excellent", "fantastic", "brilliant",
      "!", "😊", "🌟", "✨", "🚀", "💡"
    ];
    
    let engagementScore = 0.5; // Base score
    
    // Check for engaging words
    for (const element of engagingElements) {
      if (lowerResponse.includes(element.toLowerCase()) || response.includes(element)) {
        engagementScore += 0.1;
      }
    }
    
    // Check for questions (encourages interaction)
    if (response.includes('?')) {
      engagementScore += 0.2;
    }
    
    // Check for personalization
    if (context.userMemory && context.userMemory.name && response.includes(context.userMemory.name)) {
      engagementScore += 0.15;
    }
    
    // Check for follow-up suggestions
    if (lowerResponse.includes("would you like") || lowerResponse.includes("you might also")) {
      engagementScore += 0.1;
    }
    
    return Math.min(1.0, engagementScore);
  }

  /**
   * Improve a response based on quality assessment
   * @private
   * @param {string} response - The original response
   * @param {object} qualityScore - Quality assessment results
   * @param {object} context - Message context
   * @returns {string} - Improved response
   */
  _improveResponse(response, qualityScore, context) {
    let improvedResponse = response;
    
    // Apply improvements based on identified issues
    for (const improvement of qualityScore.improvements) {
      switch (improvement) {
        case "completeness":
          improvedResponse = this._improveCompleteness(improvedResponse, context);
          break;
        case "clarity":
          improvedResponse = this._improveClarity(improvedResponse, context);
          break;
        case "helpfulness":
          improvedResponse = this._improveHelpfulness(improvedResponse, context);
          break;
        case "engagement":
          improvedResponse = this._improveEngagement(improvedResponse, context);
          break;
      }
    }
    
    return improvedResponse;
  }

  /**
   * Improve response completeness
   * @private
   * @param {string} response - The response to improve
   * @param {object} context - Message context
   * @returns {string} - More complete response
   */
  _improveCompleteness(response, context) {
    const template = this.improvementTemplates.tooShort[
      Math.floor(Math.random() * this.improvementTemplates.tooShort.length)
    ];
    
    // Add more detail if response is too short
    if (response.length < 30) {
      return `${response} ${template}`;
    }
    
    return response;
  }

  /**
   * Improve response clarity
   * @private
   * @param {string} response - The response to improve
   * @param {object} context - Message context
   * @returns {string} - Clearer response
   */
  _improveClarity(response, context) {
    const template = this.improvementTemplates.unclear[
      Math.floor(Math.random() * this.improvementTemplates.unclear.length)
    ];
    
    // Add clarification if response is unclear
    if (response.includes("I don't know") || response.includes("I'm not sure")) {
      return `${response} ${template}`;
    }
    
    return response;
  }

  /**
   * Improve response helpfulness
   * @private
   * @param {string} response - The response to improve
   * @param {object} context - Message context
   * @returns {string} - More helpful response
   */
  _improveHelpfulness(response, context) {
    const template = this.improvementTemplates.notHelpful[
      Math.floor(Math.random() * this.improvementTemplates.notHelpful.length)
    ];
    
    // Add helpful content if response lacks it
    if (!response.includes("you can") && !response.includes("try") && !response.includes("example")) {
      return `${response} ${template}`;
    }
    
    return response;
  }

  /**
   * Improve response engagement
   * @private
   * @param {string} response - The response to improve
   * @param {object} context - Message context
   * @returns {string} - More engaging response
   */
  _improveEngagement(response, context) {
    const template = this.improvementTemplates.notEngaging[
      Math.floor(Math.random() * this.improvementTemplates.notEngaging.length)
    ];
    
    // Add engagement if response is too dry
    if (!response.includes('!') && !response.includes('😊') && !response.includes('🌟')) {
      return `${response} ${template}`;
    }
    
    return response;
  }

  /**
   * Extract key terms from text
   * @private
   * @param {string} text - The text to analyze
   * @returns {Array} - Array of key terms
   */
  _extractKeyTerms(text) {
    // Simple term extraction - split by spaces and filter out common words
    const commonWords = [
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
      "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
      "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those",
      "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them"
    ];
    
    return text.split(/\s+/)
      .map(word => word.toLowerCase().replace(/[^\w]/g, ''))
      .filter(word => word.length > 2 && !commonWords.includes(word));
  }
}

module.exports = ResponseQualityBehavior; 