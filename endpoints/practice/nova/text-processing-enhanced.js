/**
 * Enhanced Text Processing - Advanced text analysis and processing for Nova
 *
 * This module provides enhanced text processing capabilities including:
 * - Advanced intent detection
 * - Context-aware message analysis
 * - Improved topic detection
 * - Sentiment analysis
 * - Response quality assessment
 */

const { sentimentPatterns, knowledgeBase } = require("./nova-base");
const { logDebug } = require("../../../helpers/logger-api");

/**
 * Enhanced message analysis with multiple dimensions
 * @param {string} message - The message to analyze
 * @param {object} context - Message context
 * @returns {object} - Comprehensive analysis results
 */
function analyzeMessage(message, context = {}) {
  const analysis = {
    intent: detectIntent(message),
    topics: detectTopics(message),
    sentiment: analyzeSentiment(message),
    complexity: assessComplexity(message),
    urgency: detectUrgency(message),
    formality: assessFormality(message),
    clarity: assessClarity(message),
    keywords: extractKeywords(message),
    entities: extractEntities(message),
    context: analyzeContext(message, context)
  };

  logDebug("[Nova] Enhanced text analysis", {
    message: message.substring(0, 50),
    intent: analysis.intent,
    topics: analysis.topics,
    sentiment: analysis.sentiment
  });

  return analysis;
}

/**
 * Detect user intent with improved accuracy
 * @param {string} message - The message to analyze
 * @returns {object} - Intent analysis
 */
function detectIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  const intents = {
    question: {
      score: 0,
      patterns: [
        /\?$/,
        /^(what|who|where|when|why|how|which|can|could|would|will|should|is|are|am|do|does|did)/i,
        /^(tell me|explain|describe|show me|help me)/i
      ]
    },
    command: {
      score: 0,
      patterns: [
        /^\/\w+/,
        /^(play|start|stop|reset|quit|exit|help|remember|forget)/i
      ]
    },
    statement: {
      score: 0,
      patterns: [
        /^(i am|i'm|my name is|i like|i love|i hate|i think|i believe)/i,
        /^(this is|that is|it is|they are)/i
      ]
    },
    greeting: {
      score: 0,
      patterns: [
        /^(hi|hello|hey|good morning|good afternoon|good evening|greetings)/i
      ]
    },
    farewell: {
      score: 0,
      patterns: [
        /^(bye|goodbye|see you|farewell|take care|have a good)/i
      ]
    },
    request: {
      score: 0,
      patterns: [
        /^(please|can you|could you|would you|will you)/i,
        /^(i need|i want|i would like|i'm looking for)/i
      ]
    },
    feedback: {
      score: 0,
      patterns: [
        /^(thanks|thank you|appreciate|great|good|bad|terrible|awesome)/i
      ]
    }
  };

  // Score each intent
  for (const [intentName, intent] of Object.entries(intents)) {
    for (const pattern of intent.patterns) {
      if (pattern.test(lowerMessage)) {
        intent.score += 1;
      }
    }
  }

  // Find the highest scoring intent
  let maxScore = 0;
  let detectedIntent = 'general';
  
  for (const [intentName, intent] of Object.entries(intents)) {
    if (intent.score > maxScore) {
      maxScore = intent.score;
      detectedIntent = intentName;
    }
  }

  return {
    primary: detectedIntent,
    confidence: maxScore / Math.max(...Object.values(intents).map(i => i.score || 1)),
    all: intents
  };
}

/**
 * Enhanced topic detection with context awareness
 * @param {string} message - The message to analyze
 * @returns {Array} - Array of detected topics with confidence scores
 */
function detectTopics(message) {
  const lowerMessage = message.toLowerCase();
  const topics = [];

  // Programming and technology topics
  const techTopics = {
    'javascript': ['javascript', 'js', 'node', 'react', 'vue', 'angular', 'es6', 'es2015'],
    'python': ['python', 'py', 'django', 'flask', 'pandas', 'numpy'],
    'java': ['java', 'spring', 'android', 'jvm'],
    'testing': ['test', 'testing', 'unit test', 'integration test', 'automation', 'selenium', 'cypress', 'playwright'],
    'database': ['database', 'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'query'],
    'api': ['api', 'rest', 'graphql', 'endpoint', 'http', 'json', 'xml'],
    'web development': ['web', 'html', 'css', 'frontend', 'backend', 'fullstack', 'responsive'],
    'devops': ['devops', 'docker', 'kubernetes', 'ci/cd', 'deployment', 'aws', 'azure'],
    'machine learning': ['ml', 'ai', 'machine learning', 'neural network', 'tensorflow', 'pytorch'],
    'security': ['security', 'authentication', 'authorization', 'encryption', 'oauth', 'jwt']
  };

  // GAD-specific topics
  const gadTopics = {
    'gad': ['gad', 'gui api demo', 'gecko', 'practice', 'sandbox'],
    'ui testing': ['ui test', 'frontend test', 'selenium', 'cypress', 'playwright'],
    'api testing': ['api test', 'postman', 'rest assured', 'supertest'],
    'automation': ['automation', 'test automation', 'ci/cd', 'pipeline']
  };

  // Combine all topics
  const allTopics = { ...techTopics, ...gadTopics };

  // Detect topics with confidence scoring
  for (const [topicName, keywords] of Object.entries(allTopics)) {
    let score = 0;
    let matches = 0;

    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        score += 1;
        matches += 1;
      }
    }

    if (matches > 0) {
      // Boost score for exact matches
      if (lowerMessage.includes(topicName)) {
        score += 2;
      }

      // Boost score for technical context
      if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('explain')) {
        score += 1;
      }

      topics.push({
        name: topicName,
        confidence: Math.min(1.0, score / (keywords.length + 2)),
        matches: matches
      });
    }
  }

  // Sort by confidence
  topics.sort((a, b) => b.confidence - a.confidence);

  return topics;
}

/**
 * Enhanced sentiment analysis
 * @param {string} message - The message to analyze
 * @returns {object} - Sentiment analysis results
 */
function analyzeSentiment(message) {
  const lowerMessage = message.toLowerCase();
  
  // Enhanced sentiment patterns
  const positiveWords = [
    'great', 'awesome', 'amazing', 'wonderful', 'fantastic', 'excellent',
    'love', 'like', 'enjoy', 'happy', 'excited', 'thrilled', 'perfect',
    'brilliant', 'outstanding', 'superb', 'incredible', 'wow', 'cool',
    'good', 'nice', 'fine', 'okay', 'alright', 'satisfied', 'pleased'
  ];

  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike',
    'sad', 'angry', 'frustrated', 'annoyed', 'upset', 'disappointed',
    'confused', 'lost', 'stuck', 'problem', 'issue', 'difficult',
    'wrong', 'broken', 'failed', 'error', 'bug', 'crash'
  ];

  const neutralWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
  ];

  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;

  const words = lowerMessage.split(/\s+/);

  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '');
    
    if (positiveWords.includes(cleanWord)) {
      positiveScore += 1;
    } else if (negativeWords.includes(cleanWord)) {
      negativeScore += 1;
    } else if (neutralWords.includes(cleanWord)) {
      neutralScore += 1;
    }
  }

  // Calculate sentiment score (-1 to 1)
  const totalWords = words.length;
  const sentimentScore = totalWords > 0 ? (positiveScore - negativeScore) / totalWords : 0;

  // Determine sentiment category
  let sentiment = 'neutral';
  if (sentimentScore > 0.1) {
    sentiment = 'positive';
  } else if (sentimentScore < -0.1) {
    sentiment = 'negative';
  }

  // Detect intensity
  const intensity = Math.abs(sentimentScore);
  let intensityLevel = 'low';
  if (intensity > 0.3) {
    intensityLevel = 'high';
  } else if (intensity > 0.1) {
    intensityLevel = 'medium';
  }

  return {
    sentiment: sentiment,
    score: sentimentScore,
    intensity: intensityLevel,
    positiveWords: positiveScore,
    negativeWords: negativeScore,
    neutralWords: neutralScore
  };
}

/**
 * Assess message complexity
 * @param {string} message - The message to analyze
 * @returns {object} - Complexity analysis
 */
function assessComplexity(message) {
  const words = message.split(/\s+/);
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const avgSentenceLength = sentences.reduce((sum, sentence) => sum + sentence.split(/\s+/).length, 0) / sentences.length;
  
  // Technical complexity indicators
  const technicalTerms = /(api|database|algorithm|framework|architecture|deployment|integration|function|class|method|variable|loop|condition|async|await|promise|callback)/gi;
  const technicalMatches = (message.match(technicalTerms) || []).length;
  
  // Code references
  const codeReferences = /(function|class|method|variable|loop|condition|if|else|for|while|try|catch)/gi;
  const codeMatches = (message.match(codeReferences) || []).length;
  
  // Calculate complexity score (1-10)
  let complexityScore = 1;
  
  if (avgWordLength > 6) complexityScore += 1;
  if (avgSentenceLength > 15) complexityScore += 1;
  if (technicalMatches > 0) complexityScore += Math.min(3, technicalMatches);
  if (codeMatches > 0) complexityScore += Math.min(2, codeMatches);
  if (message.length > 100) complexityScore += 1;
  if (message.includes('?')) complexityScore += 1;
  
  let complexityLevel = 'simple';
  if (complexityScore > 7) {
    complexityLevel = 'complex';
  } else if (complexityScore > 4) {
    complexityLevel = 'moderate';
  }

  return {
    score: Math.min(10, complexityScore),
    level: complexityLevel,
    avgWordLength: avgWordLength,
    avgSentenceLength: avgSentenceLength,
    technicalTerms: technicalMatches,
    codeReferences: codeMatches
  };
}

/**
 * Detect urgency in the message
 * @param {string} message - The message to analyze
 * @returns {object} - Urgency analysis
 */
function detectUrgency(message) {
  const lowerMessage = message.toLowerCase();
  
  const urgentWords = [
    'urgent', 'asap', 'immediately', 'now', 'quick', 'fast', 'hurry',
    'emergency', 'critical', 'important', 'deadline', 'due', 'time',
    'broken', 'error', 'crash', 'failed', 'not working'
  ];

  const urgentPatterns = [
    /asap/i,
    /urgent/i,
    /immediately/i,
    /right now/i,
    /this instant/i
  ];

  let urgencyScore = 0;
  
  // Check for urgent words
  for (const word of urgentWords) {
    if (lowerMessage.includes(word)) {
      urgencyScore += 1;
    }
  }

  // Check for urgent patterns
  for (const pattern of urgentPatterns) {
    if (pattern.test(message)) {
      urgencyScore += 2;
    }
  }

  // Check for exclamation marks
  const exclamationCount = (message.match(/!/g) || []).length;
  urgencyScore += exclamationCount * 0.5;

  // Check for capitalization (shouting)
  const capsCount = (message.match(/[A-Z]/g) || []).length;
  if (capsCount > message.length * 0.3) {
    urgencyScore += 1;
  }

  let urgencyLevel = 'low';
  if (urgencyScore > 3) {
    urgencyLevel = 'high';
  } else if (urgencyScore > 1) {
    urgencyLevel = 'medium';
  }

  return {
    score: urgencyScore,
    level: urgencyLevel,
    exclamationCount: exclamationCount,
    capsCount: capsCount
  };
}

/**
 * Assess formality level
 * @param {string} message - The message to analyze
 * @returns {object} - Formality analysis
 */
function assessFormality(message) {
  const lowerMessage = message.toLowerCase();
  
  const formalWords = [
    'please', 'thank you', 'appreciate', 'regarding', 'concerning',
    'furthermore', 'moreover', 'additionally', 'consequently', 'therefore'
  ];

  const informalWords = [
    'hey', 'yo', 'cool', 'awesome', 'dude', 'guy', 'stuff', 'thing',
    'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'yeah', 'nah'
  ];

  const contractions = (message.match(/'[a-z]/gi) || []).length;
  const formalCount = formalWords.filter(word => lowerMessage.includes(word)).length;
  const informalCount = informalWords.filter(word => lowerMessage.includes(word)).length;

  let formalityScore = 0;
  formalityScore += formalCount * 2;
  formalityScore -= informalCount * 2;
  formalityScore -= contractions * 0.5;

  let formalityLevel = 'neutral';
  if (formalityScore > 2) {
    formalityLevel = 'formal';
  } else if (formalityScore < -2) {
    formalityLevel = 'informal';
  }

  return {
    score: formalityScore,
    level: formalityLevel,
    formalWords: formalCount,
    informalWords: informalCount,
    contractions: contractions
  };
}

/**
 * Assess message clarity
 * @param {string} message - The message to analyze
 * @returns {object} - Clarity analysis
 */
function assessClarity(message) {
  const words = message.split(/\s+/);
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Clarity indicators
  const clarityIndicators = {
    hasQuestion: message.includes('?'),
    hasExclamation: message.includes('!'),
    hasPunctuation: /[.!?,;:]/.test(message),
    avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.reduce((sum, sentence) => sum + sentence.split(/\s+/).length, 0) / sentences.length
  };

  let clarityScore = 0;
  
  // Positive clarity indicators
  if (clarityIndicators.hasQuestion) clarityScore += 1;
  if (clarityIndicators.hasPunctuation) clarityScore += 1;
  if (clarityIndicators.avgWordLength < 8) clarityScore += 1;
  if (clarityIndicators.avgSentenceLength < 20) clarityScore += 1;
  
  // Negative clarity indicators
  if (clarityIndicators.avgWordLength > 12) clarityScore -= 1;
  if (clarityIndicators.avgSentenceLength > 30) clarityScore -= 1;
  if (message.length < 5) clarityScore -= 1;

  let clarityLevel = 'clear';
  if (clarityScore < 0) {
    clarityLevel = 'unclear';
  } else if (clarityScore < 2) {
    clarityLevel = 'moderate';
  }

  return {
    score: clarityScore,
    level: clarityLevel,
    indicators: clarityIndicators
  };
}

/**
 * Extract keywords from message
 * @param {string} message - The message to analyze
 * @returns {Array} - Array of keywords with importance scores
 */
function extractKeywords(message) {
  const lowerMessage = message.toLowerCase();
  const words = lowerMessage.split(/\s+/);
  
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);

  const keywords = [];
  const wordCount = {};

  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '');
    
    if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
      wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
    }
  }

  // Convert to array and sort by frequency
  for (const [word, count] of Object.entries(wordCount)) {
    keywords.push({
      word: word,
      frequency: count,
      importance: count / words.length
    });
  }

  keywords.sort((a, b) => b.importance - a.importance);
  return keywords.slice(0, 10); // Return top 10 keywords
}

/**
 * Extract entities from message
 * @param {string} message - The message to analyze
 * @returns {object} - Extracted entities
 */
function extractEntities(message) {
  const entities = {
    names: [],
    numbers: [],
    urls: [],
    emails: [],
    dates: [],
    times: []
  };

  // Extract names (capitalized words)
  const nameMatches = message.match(/\b[A-Z][a-z]+\b/g) || [];
  entities.names = nameMatches;

  // Extract numbers
  const numberMatches = message.match(/\b\d+(?:\.\d+)?\b/g) || [];
  entities.numbers = numberMatches;

  // Extract URLs
  const urlMatches = message.match(/https?:\/\/[^\s]+/g) || [];
  entities.urls = urlMatches;

  // Extract emails
  const emailMatches = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
  entities.emails = emailMatches;

  // Extract dates
  const dateMatches = message.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g) || [];
  entities.dates = dateMatches;

  // Extract times
  const timeMatches = message.match(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/gi) || [];
  entities.times = timeMatches;

  return entities;
}

/**
 * Analyze context of the message
 * @param {string} message - The message to analyze
 * @param {object} context - Message context
 * @returns {object} - Context analysis
 */
function analyzeContext(message, context) {
  const contextAnalysis = {
    isFollowUp: false,
    isClarification: false,
    isCorrection: false,
    isAcknowledgement: false,
    contextContinuity: 0.5
  };

  const lowerMessage = message.toLowerCase();

  // Check for follow-up indicators
  const followUpPatterns = [
    /^and\s+/i,
    /^also\s+/i,
    /^plus\s+/i,
    /^what about\s+/i,
    /^how about\s+/i,
    /^can you also\s+/i
  ];

  for (const pattern of followUpPatterns) {
    if (pattern.test(message)) {
      contextAnalysis.isFollowUp = true;
      contextAnalysis.contextContinuity += 0.3;
    }
  }

  // Check for clarification indicators
  const clarificationPatterns = [
    /^what do you mean/i,
    /^i don't understand/i,
    /^can you explain/i,
    /^clarify/i,
    /^i'm confused/i
  ];

  for (const pattern of clarificationPatterns) {
    if (pattern.test(message)) {
      contextAnalysis.isClarification = true;
    }
  }

  // Check for correction indicators
  const correctionPatterns = [
    /^actually/i,
    /^i mean/i,
    /^correction/i,
    /^that's not right/i,
    /^i made a mistake/i
  ];

  for (const pattern of correctionPatterns) {
    if (pattern.test(message)) {
      contextAnalysis.isCorrection = true;
    }
  }

  // Check for acknowledgement indicators
  const acknowledgementPatterns = [
    /^ok/i,
    /^okay/i,
    /^got it/i,
    /^understood/i,
    /^thanks/i,
    /^thank you/i
  ];

  for (const pattern of acknowledgementPatterns) {
    if (pattern.test(message)) {
      contextAnalysis.isAcknowledgement = true;
    }
  }

  return contextAnalysis;
}

/**
 * Generate response suggestions based on analysis
 * @param {object} analysis - Message analysis results
 * @returns {Array} - Array of response suggestions
 */
function generateResponseSuggestions(analysis) {
  const suggestions = [];

  // Intent-based suggestions
  switch (analysis.intent.primary) {
    case 'question':
      suggestions.push('Provide a clear, direct answer');
      suggestions.push('Ask for clarification if needed');
      break;
    case 'command':
      suggestions.push('Execute the command if possible');
      suggestions.push('Provide feedback on command execution');
      break;
    case 'greeting':
      suggestions.push('Respond with a friendly greeting');
      suggestions.push('Ask how you can help');
      break;
    case 'farewell':
      suggestions.push('Acknowledge the farewell');
      suggestions.push('Express willingness to help in the future');
      break;
  }

  // Sentiment-based suggestions
  if (analysis.sentiment.sentiment === 'negative') {
    suggestions.push('Show empathy and understanding');
    suggestions.push('Offer support and solutions');
  } else if (analysis.sentiment.sentiment === 'positive') {
    suggestions.push('Match the positive energy');
    suggestions.push('Encourage continued engagement');
  }

  // Complexity-based suggestions
  if (analysis.complexity.level === 'complex') {
    suggestions.push('Break down complex concepts');
    suggestions.push('Provide examples and analogies');
  } else if (analysis.complexity.level === 'simple') {
    suggestions.push('Keep response concise and direct');
    suggestions.push('Avoid unnecessary complexity');
  }

  // Urgency-based suggestions
  if (analysis.urgency.level === 'high') {
    suggestions.push('Prioritize quick, actionable responses');
    suggestions.push('Focus on immediate solutions');
  }

  return suggestions;
}

module.exports = {
  analyzeMessage,
  detectIntent,
  detectTopics,
  analyzeSentiment,
  assessComplexity,
  detectUrgency,
  assessFormality,
  assessClarity,
  extractKeywords,
  extractEntities,
  analyzeContext,
  generateResponseSuggestions
}; 