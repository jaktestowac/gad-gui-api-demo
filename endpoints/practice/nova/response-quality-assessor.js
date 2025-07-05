/**
 * Response Quality Assessor - Evaluates and improves Nova's response quality
 *
 * This module provides comprehensive response quality assessment including:
 * - Relevance scoring
 * - Completeness evaluation
 * - Clarity assessment
 * - User satisfaction prediction
 * - Response improvement suggestions
 */

const { logDebug } = require("../../../helpers/logger-api");

/**
 * Assess the quality of a response
 * @param {string} response - The response to assess
 * @param {string} userMessage - The original user message
 * @param {object} context - Message context
 * @returns {object} - Quality assessment results
 */
function assessResponseQuality(response, userMessage, context = {}) {
  const assessment = {
    relevance: assessRelevance(response, userMessage, context),
    completeness: assessCompleteness(response, userMessage, context),
    clarity: assessClarity(response),
    helpfulness: assessHelpfulness(response, userMessage, context),
    engagement: assessEngagement(response),
    overall: 0
  };

  // Calculate overall score (weighted average)
  assessment.overall = (
    assessment.relevance.score * 0.3 +
    assessment.completeness.score * 0.25 +
    assessment.clarity.score * 0.2 +
    assessment.helpfulness.score * 0.15 +
    assessment.engagement.score * 0.1
  );

  // Generate improvement suggestions
  assessment.suggestions = generateImprovementSuggestions(assessment, response, userMessage, context);

  logDebug("[Nova] Response quality assessment", {
    overall: assessment.overall,
    relevance: assessment.relevance.score,
    completeness: assessment.completeness.score,
    clarity: assessment.clarity.score
  });

  return assessment;
}

/**
 * Assess response relevance to user message
 * @param {string} response - The response to assess
 * @param {string} userMessage - The original user message
 * @param {object} context - Message context
 * @returns {object} - Relevance assessment
 */
function assessRelevance(response, userMessage, context) {
  const lowerResponse = response.toLowerCase();
  const lowerUserMessage = userMessage.toLowerCase();
  
  let relevanceScore = 0.5; // Base score
  const issues = [];

  // Check for keyword overlap
  const userWords = lowerUserMessage.split(/\s+/).filter(word => word.length > 3);
  const responseWords = lowerResponse.split(/\s+/).filter(word => word.length > 3);
  
  const commonWords = userWords.filter(word => responseWords.includes(word));
  const keywordOverlap = commonWords.length / Math.max(userWords.length, 1);
  
  relevanceScore += keywordOverlap * 0.3;

  // Check for topic consistency
  if (context.currentTopic) {
    const topicInResponse = lowerResponse.includes(context.currentTopic.toLowerCase());
    if (topicInResponse) {
      relevanceScore += 0.2;
    } else {
      issues.push("Response doesn't address the current topic");
    }
  }

  // Check for intent matching
  const userIntent = detectUserIntent(userMessage);
  const responseIntent = detectResponseIntent(response);
  
  if (userIntent === responseIntent) {
    relevanceScore += 0.2;
  } else {
    issues.push("Response intent doesn't match user intent");
  }

  // Check for question answering
  if (userMessage.includes('?')) {
    const hasAnswer = lowerResponse.includes('answer') || 
                     lowerResponse.includes('explain') || 
                     lowerResponse.includes('here') ||
                     lowerResponse.includes('is') ||
                     lowerResponse.includes('are');
    
    if (hasAnswer) {
      relevanceScore += 0.1;
    } else {
      issues.push("User asked a question but response doesn't provide an answer");
    }
  }

  // Penalize generic responses
  const genericPhrases = [
    "i'm here to help",
    "how can i assist",
    "what would you like",
    "let me know if",
    "feel free to ask"
  ];

  const genericCount = genericPhrases.filter(phrase => lowerResponse.includes(phrase)).length;
  if (genericCount > 0) {
    relevanceScore -= genericCount * 0.1;
    issues.push("Response contains generic phrases");
  }

  return {
    score: Math.max(0, Math.min(1, relevanceScore)),
    keywordOverlap: keywordOverlap,
    commonWords: commonWords,
    issues: issues
  };
}

/**
 * Assess response completeness
 * @param {string} response - The response to assess
 * @param {string} userMessage - The original user message
 * @param {object} context - Message context
 * @returns {object} - Completeness assessment
 */
function assessCompleteness(response, userMessage, context) {
  let completenessScore = 0.5;
  const missingElements = [];

  // Check response length
  const responseLength = response.length;
  const userMessageLength = userMessage.length;
  
  if (responseLength < userMessageLength * 0.5) {
    completenessScore -= 0.2;
    missingElements.push("Response is too short");
  } else if (responseLength > userMessageLength * 3) {
    completenessScore -= 0.1;
    missingElements.push("Response might be too verbose");
  } else {
    completenessScore += 0.1;
  }

  // Check for specific elements based on user intent
  const userIntent = detectUserIntent(userMessage);
  
  switch (userIntent) {
    case 'question':
      if (!response.includes('?') && !response.includes('answer') && !response.includes('explain')) {
        completenessScore -= 0.2;
        missingElements.push("Question not properly answered");
      }
      break;
    case 'command':
      if (!response.includes('done') && !response.includes('executed') && !response.includes('completed')) {
        completenessScore -= 0.2;
        missingElements.push("Command execution not confirmed");
      }
      break;
    case 'request':
      if (!response.includes('here') && !response.includes('provide') && !response.includes('show')) {
        completenessScore -= 0.2;
        missingElements.push("Request not fulfilled");
      }
      break;
  }

  // Check for follow-up suggestions
  const hasFollowUp = response.includes('would you like') || 
                     response.includes('can i help') || 
                     response.includes('anything else') ||
                     response.includes('let me know');

  if (hasFollowUp) {
    completenessScore += 0.1;
  } else {
    missingElements.push("No follow-up offered");
  }

  return {
    score: Math.max(0, Math.min(1, completenessScore)),
    responseLength: responseLength,
    userMessageLength: userMessageLength,
    hasFollowUp: hasFollowUp,
    missingElements: missingElements
  };
}

/**
 * Assess response clarity
 * @param {string} response - The response to assess
 * @returns {object} - Clarity assessment
 */
function assessClarity(response) {
  let clarityScore = 0.5;
  const issues = [];

  // Check sentence structure
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, sentence) => sum + sentence.split(/\s+/).length, 0) / sentences.length;
  
  if (avgSentenceLength > 25) {
    clarityScore -= 0.2;
    issues.push("Sentences are too long");
  } else if (avgSentenceLength < 5) {
    clarityScore -= 0.1;
    issues.push("Sentences are too short");
  } else {
    clarityScore += 0.1;
  }

  // Check for technical jargon
  const technicalTerms = /(api|database|algorithm|framework|architecture|deployment|integration|function|class|method|variable|loop|condition|async|await|promise|callback)/gi;
  const technicalMatches = (response.match(technicalTerms) || []).length;
  
  if (technicalMatches > 3) {
    clarityScore -= 0.1;
    issues.push("Too much technical jargon");
  }

  // Check for proper punctuation
  const hasProperPunctuation = /[.!?]$/.test(response.trim());
  if (!hasProperPunctuation) {
    clarityScore -= 0.1;
    issues.push("Missing proper punctuation");
  }

  // Check for logical flow
  const hasLogicalFlow = response.includes('first') || 
                        response.includes('then') || 
                        response.includes('next') ||
                        response.includes('finally') ||
                        response.includes('also') ||
                        response.includes('additionally');

  if (hasLogicalFlow) {
    clarityScore += 0.1;
  } else {
    issues.push("Response lacks logical flow indicators");
  }

  return {
    score: Math.max(0, Math.min(1, clarityScore)),
    avgSentenceLength: avgSentenceLength,
    technicalTerms: technicalMatches,
    hasProperPunctuation: hasProperPunctuation,
    hasLogicalFlow: hasLogicalFlow,
    issues: issues
  };
}

/**
 * Assess response helpfulness
 * @param {string} response - The response to assess
 * @param {string} userMessage - The original user message
 * @param {object} context - Message context
 * @returns {object} - Helpfulness assessment
 */
function assessHelpfulness(response, userMessage, context) {
  let helpfulnessScore = 0.5;
  const helpfulElements = [];

  // Check for actionable information
  const hasActionableInfo = response.includes('you can') || 
                           response.includes('try') || 
                           response.includes('use') ||
                           response.includes('click') ||
                           response.includes('go to') ||
                           response.includes('visit');

  if (hasActionableInfo) {
    helpfulnessScore += 0.2;
    helpfulElements.push("Contains actionable information");
  }

  // Check for examples
  const hasExamples = response.includes('example') || 
                     response.includes('for instance') || 
                     response.includes('such as') ||
                     response.includes('like');

  if (hasExamples) {
    helpfulnessScore += 0.15;
    helpfulElements.push("Provides examples");
  }

  // Check for explanations
  const hasExplanations = response.includes('because') || 
                         response.includes('since') || 
                         response.includes('this means') ||
                         response.includes('explains') ||
                         response.includes('works by');

  if (hasExplanations) {
    helpfulnessScore += 0.15;
    helpfulElements.push("Provides explanations");
  }

  // Check for resources or links
  const hasResources = response.includes('http') || 
                      response.includes('link') || 
                      response.includes('resource') ||
                      response.includes('documentation');

  if (hasResources) {
    helpfulnessScore += 0.1;
    helpfulElements.push("Provides resources");
  }

  // Check for error handling
  if (userMessage.toLowerCase().includes('error') || userMessage.toLowerCase().includes('problem')) {
    const hasErrorHandling = response.includes('error') || 
                            response.includes('problem') || 
                            response.includes('issue') ||
                            response.includes('fix') ||
                            response.includes('solution');

    if (hasErrorHandling) {
      helpfulnessScore += 0.2;
      helpfulElements.push("Addresses error/problem");
    }
  }

  return {
    score: Math.max(0, Math.min(1, helpfulnessScore)),
    helpfulElements: helpfulElements
  };
}

/**
 * Assess response engagement
 * @param {string} response - The response to assess
 * @returns {object} - Engagement assessment
 */
function assessEngagement(response) {
  let engagementScore = 0.5;
  const engagementElements = [];

  // Check for personalization
  const hasPersonalization = response.includes('you') || 
                            response.includes('your') || 
                            response.includes('we') ||
                            response.includes('us');

  if (hasPersonalization) {
    engagementScore += 0.15;
    engagementElements.push("Uses personal pronouns");
  }

  // Check for enthusiasm
  const hasEnthusiasm = response.includes('!') || 
                       response.includes('great') || 
                       response.includes('awesome') ||
                       response.includes('wonderful') ||
                       response.includes('excellent');

  if (hasEnthusiasm) {
    engagementScore += 0.1;
    engagementElements.push("Shows enthusiasm");
  }

  // Check for questions
  const hasQuestions = response.includes('?');
  if (hasQuestions) {
    engagementScore += 0.1;
    engagementElements.push("Asks follow-up questions");
  }

  // Check for emojis or visual elements
  const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(response);
  if (hasEmojis) {
    engagementScore += 0.05;
    engagementElements.push("Uses emojis");
  }

  // Check for conversational tone
  const hasConversationalTone = response.includes('well') || 
                               response.includes('actually') || 
                               response.includes('you know') ||
                               response.includes('i think') ||
                               response.includes('let me');

  if (hasConversationalTone) {
    engagementScore += 0.1;
    engagementElements.push("Uses conversational tone");
  }

  return {
    score: Math.max(0, Math.min(1, engagementScore)),
    engagementElements: engagementElements
  };
}

/**
 * Detect user intent from message
 * @param {string} message - The user message
 * @returns {string} - Detected intent
 */
function detectUserIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('?')) return 'question';
  if (lowerMessage.startsWith('/') || lowerMessage.includes('play') || lowerMessage.includes('start')) return 'command';
  if (lowerMessage.includes('please') || lowerMessage.includes('can you') || lowerMessage.includes('could you')) return 'request';
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) return 'greeting';
  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) return 'farewell';
  if (lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) return 'feedback';
  
  return 'statement';
}

/**
 * Detect response intent
 * @param {string} response - The response
 * @returns {string} - Detected intent
 */
function detectResponseIntent(response) {
  const lowerResponse = response.toLowerCase();
  
  if (lowerResponse.includes('?') && lowerResponse.includes('you')) return 'question';
  if (lowerResponse.includes('done') || lowerResponse.includes('executed') || lowerResponse.includes('completed')) return 'command';
  if (lowerResponse.includes('here') || lowerResponse.includes('provide') || lowerResponse.includes('show')) return 'request';
  if (lowerResponse.includes('hi') || lowerResponse.includes('hello')) return 'greeting';
  if (lowerResponse.includes('bye') || lowerResponse.includes('goodbye')) return 'farewell';
  if (lowerResponse.includes('welcome') || lowerResponse.includes('glad')) return 'feedback';
  
  return 'statement';
}

/**
 * Generate improvement suggestions
 * @param {object} assessment - Quality assessment results
 * @param {string} response - The response
 * @param {string} userMessage - The original user message
 * @param {object} context - Message context
 * @returns {Array} - Array of improvement suggestions
 */
function generateImprovementSuggestions(assessment, response, userMessage, context) {
  const suggestions = [];

  // Relevance suggestions
  if (assessment.relevance.score < 0.7) {
    suggestions.push("Improve relevance by addressing the user's specific question or request");
    if (assessment.relevance.issues.includes("Response doesn't address the current topic")) {
      suggestions.push("Include information about the current topic in your response");
    }
  }

  // Completeness suggestions
  if (assessment.completeness.score < 0.7) {
    suggestions.push("Make the response more complete by providing additional details");
    if (assessment.completeness.missingElements.includes("Response is too short")) {
      suggestions.push("Expand the response with more detailed information");
    }
  }

  // Clarity suggestions
  if (assessment.clarity.score < 0.7) {
    suggestions.push("Improve clarity by using simpler language and shorter sentences");
    if (assessment.clarity.issues.includes("Too much technical jargon")) {
      suggestions.push("Reduce technical jargon and explain complex terms");
    }
  }

  // Helpfulness suggestions
  if (assessment.helpfulness.score < 0.7) {
    suggestions.push("Make the response more helpful by providing actionable information");
    if (!assessment.helpfulness.helpfulElements.includes("Contains actionable information")) {
      suggestions.push("Include specific steps or actions the user can take");
    }
  }

  // Engagement suggestions
  if (assessment.engagement.score < 0.7) {
    suggestions.push("Increase engagement by using a more conversational tone");
    if (!assessment.engagement.engagementElements.includes("Uses personal pronouns")) {
      suggestions.push("Use 'you' and 'your' to make the response more personal");
    }
  }

  return suggestions;
}

module.exports = {
  assessResponseQuality,
  assessRelevance,
  assessCompleteness,
  assessClarity,
  assessHelpfulness,
  assessEngagement,
  generateImprovementSuggestions
}; 