/**
 * Curiosity Behavior - Enhances Nova's ability to express curiosity and ask follow-up questions
 *
 * This behavior makes Nova more inquisitive when it doesn't fully understand user inputs,
 * asking clarifying questions and showing curiosity about ambiguous topics instead of
 * giving generic responses.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");
const { knowsTerm, getLearnedTermDefinition, extractTermDefinition, userMemory } = require("../user-memory");
const termDebug = require("../debug-terms");

class CuriosityBehavior extends BaseBehavior {
  constructor() {
    // Priority between default response (100) and personality (150)
    super("curiosity", 120);

    // Curious responses for different levels of understanding
    this.clarificationQuestions = [
      "I'm curious about what you mean by that. Could you explain it differently?",
      "That's interesting, but I'm not sure I fully understand. Could you elaborate?",
      "I'd like to understand you better. Can you provide some more context?",
      "I'm eager to learn more about what you're discussing. Can you share some details?",
      "Your message caught my attention, but I'm not quite following. Could you tell me more?",
    ];

    // Open-ended questions to encourage elaboration
    this.openEndedQuestions = [
      "What aspects of this are most important to you?",
      "How did you become interested in this topic?",
      "What's your experience with this so far?",
      "What specifically would you like to know about this?",
      "How would you describe your goal in simpler terms?",
    ];

    // Multiple-choice questions for ambiguous queries
    this.multipleChoiceTemplates = [
      "I'm not entirely sure what you're asking about. Could it be about: {OPTIONS}?",
      "Let me make sure I understand. Are you interested in: {OPTIONS}?",
      "I'd like to help better! Are you referring to: {OPTIONS}?",
      "To better assist you, I need to know if you're asking about: {OPTIONS}?",
      "I have a few ideas about what you might be asking. Is it related to: {OPTIONS}?",
    ];

    // Templates for specific unknown terms
    this.unknownTermTemplates = [
      'I don\'t know what "{TERM}" is. Could you tell me more about it?',
      'I\'m not familiar with "{TERM}". What does that refer to?',
      'I don\'t understand what "{TERM}" means. Could you explain it?',
      'I haven\'t heard of "{TERM}" before. Would you mind telling me what it is?',
      "I'm curious about \"{TERM}\" since I don't recognize it. Could you elaborate?",
    ];

    // Topic categories to suggest when context is lacking
    this.topicCategories = [
      "programming languages",
      "web development",
      "software testing",
      "database management",
      "API testing",
      "UI automation",
      "GAD application features",
      "game development",
      "test automation frameworks",
      "performance testing",
    ];
  }

  /**
   * Check if this behavior should handle cases where Nova doesn't fully understand
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior should add curiosity
   */
  canHandle(message, context) {
    // Get the user ID from the conversation context
    const userId = context.userId || context.conversationId?.split("_")[0];

    // Debug check - see if there's a special debug command for terms
    if (message.startsWith("/debug-terms")) {
      const parts = message.split(" ");
      if (parts.length >= 2) {
        const cmd = parts[1];

        // Check command type
        if (cmd === "clear" && parts.length >= 3) {
          // Clear a specific term
          const term = parts[2];
          const removed = termDebug.forceRemoveTerm(userId, term);
          context.debugResult = removed
            ? `DEBUG: Successfully removed term "${term}" for user ${userId}`
            : `DEBUG: Failed to remove term "${term}" for user ${userId}`;
        } else if (cmd === "add" && parts.length >= 4) {
          // Add a term with definition
          const term = parts[2];
          const definition = parts.slice(3).join(" ");
          const added = termDebug.forceAddTerm(userId, term, definition);
          context.debugResult = added
            ? `DEBUG: Successfully added term "${term}" with definition: "${definition}" for user ${userId}`
            : `DEBUG: Failed to add term "${term}" for user ${userId}`;
        } else if (cmd === "check" && parts.length >= 3) {
          // Check a specific term
          const term = parts[2];
          const result = termDebug.checkSpecificTerm(userId, term);
          if (result.found) {
            context.debugResult = `DEBUG: Found term "${term}" with definition: "${result.definition}" (used ${result.usageCount} times)`;
          } else {
            context.debugResult = `DEBUG: Term "${term}" not found for user ${userId}`;
          }
        } else {
          // Invalid command
          context.debugResult = `DEBUG: Invalid command. Valid commands: /debug-terms check <term>, /debug-terms add <term> <definition>, /debug-terms clear <term>`;
        }
      } else {
        // Dump all terms
        const result = termDebug.dumpLearnedTerms(userId);
        context.debugResult = `DEBUG: User ${userId} has ${result.count || 0} learned terms: ${
          result.terms?.map((t) => t.term).join(", ") || "none"
        }`;
      }
      return true;
    } // Check if this is a direct question about a known term
    // Check special cases first for "do you know X" and "what is X" patterns
    if (
      /^do you know ([a-zA-Z0-9]+)\??$/i.test(message) ||
      /^what(?:'?s|\s*is) ([a-zA-Z0-9]+)\??$/i.test(message) ||
      /^tell me about ([a-zA-Z0-9]+)\??$/i.test(message)
    ) {
      // Extract the term from the message
      let term = null;
      const doYouKnowMatch = message.match(/^do you know ([a-zA-Z0-9]+)\??$/i);
      const whatIsMatch = message.match(/^what(?:'?s|\s*is) ([a-zA-Z0-9]+)\??$/i);
      const tellMeMatch = message.match(/^tell me about ([a-zA-Z0-9]+)\??$/i);

      if (doYouKnowMatch) term = doYouKnowMatch[1];
      else if (whatIsMatch) term = whatIsMatch[1];
      else if (tellMeMatch) term = tellMeMatch[1];

      if (term) {
        term = term.toLowerCase();

        // Check if we know this term specifically
        if (userId && knowsTerm(term, userId)) {
          context.knownTerm = term;
          logDebug("[Nova] CuriosityBehavior:canHandle:DirectKnownTerm", {
            term,
            userId,
            message,
          });
          return true;
        } else {
          // If not, mark as unknown
          context.unknownTerm = term;
          logDebug("[Nova] CuriosityBehavior:canHandle:DirectUnknownTerm", {
            term,
            userId,
            message,
          });
          return true;
        }
      }
    }

    // Check for questions about specific terms (whether known or unknown)
    let detectedTerm = null;

    // First try to handle special cases like "what is X?"
    const preprocessedTerm = this._preprocessMessage(message);
    if (preprocessedTerm) {
      detectedTerm = preprocessedTerm;
    } else {
      // Fall back to regular detection
      detectedTerm = this._detectUnknownTerm(message);
    }

    if (detectedTerm) {
      // Log the detected term for debugging
      logDebug("[Nova] CuriosityBehavior:canHandle:termDetected", {
        term: detectedTerm,
        message: message,
      });

      // Check if this is already a term we know
      if (userId && knowsTerm(detectedTerm, userId)) {
        // We know this term, so store it to use the definition
        context.knownTerm = detectedTerm;
        logDebug("[Nova] CuriosityBehavior:canHandle:knownTerm", {
          term: detectedTerm,
          message: message,
        });
        return true;
      }

      // Store the detected unknown term for later use in handle()
      context.unknownTerm = detectedTerm;
      return true;
    }

    // Only activate when Nova's understanding is limited
    // Check if no other behaviors matched (except default)
    const hasOnlyDefaultBehavior = context.matchingBehaviorCount <= 1;

    // Check if the unrecognized count is increasing
    const hasUnrecognizedMessages = context.unrecognizedCount > 0;

    // Check if message is very short (potential ambiguity)
    const isShortMessage = message.length < 10;

    // Check if message lacks clear topic
    const hasAmbiguousTopic = context.currentTopic === "ambiguous" || !context.currentTopic;

    // When there are multiple behaviors but they're low confidence
    const hasLowConfidenceMatches = context.hasLowConfidenceMatches || false;

    return (
      hasOnlyDefaultBehavior ||
      hasUnrecognizedMessages ||
      (isShortMessage && hasAmbiguousTopic) ||
      hasLowConfidenceMatches
    );
  }

  /**
   * Handle unclear or ambiguous messages with curiosity and follow-up questions
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - The response with added curiosity
   */
  handle(message, context) {
    const userId = context.userId || context.conversationId?.split("_")[0];

    // Save context reference for diagnostic purposes
    this.context = context;

    // Handle debug commands
    if (context.debugResult) {
      return context.debugResult;
    }

    // Log detailed debugging info
    logDebug(`[Nova] CuriosityBehavior:handle`, {
      userId,
      isDefiningUnknownTerm: context.isDefiningUnknownTerm,
      previousUnknownTerm: context.previousUnknownTerm,
      knownTerm: context.knownTerm,
      unknownTerm: context.unknownTerm,
      message: message,
    });

    // If the user is responding to a question about an unknown term
    if (context.isDefiningUnknownTerm && context.previousUnknownTerm) {
      // Try to extract and save the definition
      const termName = context.previousUnknownTerm;

      logDebug(`[Nova] CuriosityBehavior:handle:extractingDefinition for "${termName}"`, {
        message,
        userId,
        isDefiningUnknownTerm: context.isDefiningUnknownTerm,
        previousUnknownTerm: context.previousUnknownTerm,
        messageLength: message.length,
      });

      // Try to extract the definition
      const extracted = extractTermDefinition(message, termName, userId);

      // Log detailed result
      if (extracted) {
        // Clear the previous unknown term context
        context.previousUnknownTerm = null;
        context.isDefiningUnknownTerm = false; // Reset the definition flag

        logDebug(`[Nova] CuriosityBehavior:handle:definitionExtracted successfully`, {
          termName,
          userId,
          messageWords: message.split(" ").length,
        });

        // Thank the user for the definition
        return `Thank you for explaining what "${termName}" means! I'll remember that for future conversations. Is there anything else you'd like to know about?`;
      } else {
        logDebug(`[Nova] CuriosityBehavior:handle:definitionExtractionFailed`, {
          termName,
          userId,
          message,
        });

        // If extraction failed, kindly ask for a more detailed explanation
        return `I'm having trouble understanding your explanation of "${termName}". Could you provide a bit more detail?`;
      }
    } // If we have a known term, use the definition
    if (context.knownTerm && userId) {
      const termName = context.knownTerm;

      logDebug(`[Nova] CuriosityBehavior:handle:retrievingKnownTerm "${termName}"`, {
        userId,
        message,
        allAvailableTerms: Object.keys(userMemory[userId]?.learnedTerms || {}).join(", ") || "none",
        termName,
      });

      try {
        // Retrieve the definition
        const definition = getLearnedTermDefinition(termName, userId);

        if (definition) {
          // Track behavior for analytics
          context.responseType = "learned-term";

          logDebug(`[Nova] CuriosityBehavior:handle:foundKnownTermDefinition`, {
            termName,
            definition: definition.substring(0, 50) + (definition.length > 50 ? "..." : ""),
            userId,
          });

          // Format the response with the user-defined term
          const responses = [
            `${termName}: ${definition}`,
            `According to what you've taught me, ${termName} is ${definition}`,
            `Based on what I've learned from you, ${termName} means: ${definition}`,
            `You previously explained that ${termName} is ${definition}`,
            `From our previous conversation, I remember that ${termName} refers to ${definition}`,
          ];

          return responses[Math.floor(Math.random() * responses.length)];
        } else {
          logDebug(`[Nova] CuriosityBehavior:handle:knownTermButNoDefinition "${termName}"`, {
            userId,
            message,
          });

          // If for some reason we know the term exists but can't get the definition
          return `I know you taught me about "${termName}" but I'm having trouble recalling the definition. Could you remind me?`;
        }
      } catch (error) {
        logDebug(`[Nova] ERROR: CuriosityBehavior failed to retrieve term definition`, {
          termName,
          userId,
          error: error.message,
        });

        return `I remember you taught me about "${termName}", but I'm having trouble recalling the exact definition.`;
      }
    }

    // If we detected an unknown term, respond specifically about it
    if (context.unknownTerm) {
      // Store the term in the conversation context for the next message
      context.previousUnknownTerm = context.unknownTerm;
      context.isDefiningUnknownTerm = true; // Set the flag to indicate we're waiting for a definition

      logDebug(`[Nova] CuriosityBehavior:handle:askingAboutUnknownTerm "${context.unknownTerm}"`, {
        userId,
        message,
        unknownTerm: context.unknownTerm,
      });

      return this._generateUnknownTermResponse(context.unknownTerm);
    }

    // Use different strategies based on uncertainty level
    if (context.unrecognizedCount >= 2) {
      return this._generateMultipleChoiceQuestion(context);
    } else if (message.length < 10) {
      return this._generateClarificationQuestion() + " " + this._generateOpenEndedQuestion();
    } else {
      return this._generateCuriosityResponse(message, context);
    }
  }

  /**
   * Generate a clarification question
   * @private
   * @returns {string} - A clarification question
   */
  _generateClarificationQuestion() {
    const randomIndex = Math.floor(Math.random() * this.clarificationQuestions.length);
    return this.clarificationQuestions[randomIndex];
  }

  /**
   * Generate an open-ended follow-up question
   * @private
   * @returns {string} - An open-ended question
   */
  _generateOpenEndedQuestion() {
    const randomIndex = Math.floor(Math.random() * this.openEndedQuestions.length);
    return this.openEndedQuestions[randomIndex];
  }

  /**
   * Generate a multiple-choice question with relevant options
   * @private
   * @param {object} context - Message context
   * @returns {string} - A multiple-choice question
   */
  _generateMultipleChoiceQuestion(context) {
    // Get template
    const templateIndex = Math.floor(Math.random() * this.multipleChoiceTemplates.length);
    const template = this.multipleChoiceTemplates[templateIndex];

    // Determine appropriate options based on context
    let options = [];

    // If we have potentially matching topics, use those
    if (context.potentialTopics && context.potentialTopics.length > 0) {
      options = context.potentialTopics.slice(0, 3);
    }
    // Otherwise use some common categories that match the conversation history
    else {
      // Sample 3-4 categories randomly
      const allCategories = [...this.topicCategories];
      while (options.length < 3 && allCategories.length > 0) {
        const randomIndex = Math.floor(Math.random() * allCategories.length);
        options.push(allCategories[randomIndex]);
        allCategories.splice(randomIndex, 1);
      }
    }

    // Format the options
    const formattedOptions = options.join(", ") + ", or something else";

    // Return the formatted template
    return template.replace("{OPTIONS}", formattedOptions);
  }

  /**
   * Generate a curiosity-based response for unclear messages
   * @private
   * @param {string} message - User message
   * @param {object} context - Message context
   * @returns {string} - Curiosity-based response
   */
  _generateCuriosityResponse(message, context) {
    const userMem = context.userMemory || {};

    // Extract potential keywords from the message
    const words = message.toLowerCase().split(/\s+/);
    const keywords = words.filter((word) => word.length > 3);

    // If we have keywords, ask about one of them
    if (keywords.length > 0) {
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
      return `I notice you mentioned ${randomKeyword}. I'm curious to learn more about what you mean by that. Could you elaborate?`;
    }

    // If we have user's name or interests, use them
    if (userMem.name && userMem.interests && userMem.interests.length > 0) {
      const interest = userMem.interests[0];
      return `${userMem.name}, I'm not sure I understand. Is this related to your interest in ${interest}?`;
    }

    // Default to clarification + open-ended question
    return this._generateClarificationQuestion() + " " + this._generateOpenEndedQuestion();
  }

  /**
   * Detect potential unknown terms in the message
   * @private
   * @param {string} message - The message to analyze
   * @returns {string|null} - The detected unknown term or null
   */ _detectUnknownTerm(message) {
    const lowerMessage = message.toLowerCase();

    // Check for direct questions about terms - matches patterns like:
    // "do you know delfin?" or "do you know what delfin is?"
    const doYouKnowPatterns = [
      /\bdo you (know|understand|recognize)(?:\s+(?:what|who))?\s+([a-zA-Z0-9_-]+)\b/i,
      /\bdo you (know|understand|recognize)(?:\s+(?:about|of))?\s+([a-zA-Z0-9_-]+)\b/i,
      /\bhave you heard (?:of|about)\s+([a-zA-Z0-9_-]+)\b/i,
      /\bare you familiar with\s+([a-zA-Z0-9_-]+)\b/i,
      /\bdo you know what ([a-zA-Z0-9_-]+) is\??\b/i,
      /\bwhat is ([a-zA-Z0-9_-]+)\??\b/i,
      /\byou know ([a-zA-Z0-9_-]+)\??\b/i,
      // Support for quoted terms
      /\bdo you (?:know|understand) "(.*?)"\??\b/i,
      /\bwhat is "(.*?)"\??\b/i,
      /\bwhat's "(.*?)"\??\b/i,
    ];

    // First check for quoted multi-word terms as they have precedence
    const quotedTermPatterns = [
      /\bdo you (?:know|understand) "(.*?)"\??\b/i,
      /\bwhat is "(.*?)"\??\b/i,
      /\bwhat's "(.*?)"\??\b/i,
      /\btell me about "(.*?)"\??\b/i,
    ];

    for (const pattern of quotedTermPatterns) {
      const match = lowerMessage.match(pattern);
      if (match && match[1] && match[1].trim().length > 0) {
        const term = match[1].trim();
        logDebug("[Nova] CuriosityBehavior: Detected quoted term", {
          term: term,
          pattern: pattern.toString(),
          originalMessage: message,
        });
        return term;
      }
    }

    // Then check for standard patterns
    for (const pattern of doYouKnowPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        const term = match[match.length - 1];
        logDebug("[Nova] CuriosityBehavior: Detected term from 'do you know' question", {
          term: term,
          patternIndex: doYouKnowPatterns.indexOf(pattern),
          originalMessage: message,
        });
        return term;
      }
    } // Check for "what is X" type questions
    const whatIsPatterns = [
      /\bwhat(?:'s| is)(?: a| an)? ([a-zA-Z0-9_-]+)(?:\?|\b)/i,
      /\bwhat does ([a-zA-Z0-9_-]+) mean(?:\?|\b)/i,
      /\bwhat's the (meaning|definition) of ([a-zA-Z0-9_-]+)(?:\?|\b)/i,
      // Support for end-of-sentence without quotes
      /\bwhat(?:'s| is)(?: a| an| the)? (.+?)(?:\?|$)/i,
    ];

    for (const pattern of whatIsPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        // For the last pattern, the term is in position 2
        const termIndex = pattern.toString().includes("(meaning|definition)") ? 2 : 1;
        const potentialTerm = match[termIndex].toLowerCase().trim();

        // Skip common words that wouldn't be unknown terms
        const commonWords = ["the", "this", "that", "your", "these", "those", "their", "our", "your"];
        if (!commonWords.includes(potentialTerm) && potentialTerm.length > 2) {
          // For multi-word matches without quotes, clean up by removing common filler words
          let cleanTerm = potentialTerm;
          if (cleanTerm.includes(" ")) {
            cleanTerm = cleanTerm.replace(/\s+(is|means|refers to|definition).*$/, "");
          }

          logDebug("[Nova] CuriosityBehavior: Detected term from 'what is' question", {
            term: cleanTerm,
            patternIndex: whatIsPatterns.indexOf(pattern),
            originalMessage: message,
          });
          return cleanTerm;
        }
      }
    }

    // Check for "tell me about X" type questions
    const tellMePatterns = [
      /\btell me about(?: a| an| the)? ([a-zA-Z0-9_-]+)\b/i,
      /\bexplain(?: to me)?(?:(?: what| who)(?: a| an| the)?)? ([a-zA-Z0-9_-]+)(?:\s+is)?\b/i,
      /\bcan you explain(?: to me)?(?:(?: what| who)(?: a| an| the)?)? ([a-zA-Z0-9_-]+)(?:\s+is)?\b/i,
      /\bdefine(?: the word| the term)? ([a-zA-Z0-9_-]+)\b/i,
      // Support for end-of-sentence without quotes
      /\btell me about(?: a| an| the)? (.+?)(?:\?|$)/i,
    ];
    for (const pattern of tellMePatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        const term = match[1].toLowerCase().trim();

        // Skip common words and very short terms
        const commonWords = ["the", "this", "that", "your", "these", "those", "their", "our", "your"];
        if (!commonWords.includes(term) && term.length > 2) {
          // For multi-word matches without quotes, clean up by removing common filler words
          let cleanTerm = term;
          if (cleanTerm.includes(" ")) {
            cleanTerm = cleanTerm.replace(/\s+(is|means|refers to|definition).*$/, "");
          }

          logDebug("[Nova] CuriosityBehavior: Detected term from 'tell me about' question", {
            term: cleanTerm,
            patternIndex: tellMePatterns.indexOf(pattern),
            originalMessage: message,
          });
          return cleanTerm;
        }
      }
    }

    // For short messages with just a word or two, treat as potential unknown term
    if (message.trim().split(/\s+/).length <= 2 && message.length > 2) {
      // Remove punctuation and get the main word
      const cleanedMessage = message.replace(/[?!.,;]/g, "").trim();
      const words = cleanedMessage.split(/\s+/);

      // If it's just one word and not a common greeting or question word
      const commonWords = [
        "hi",
        "hello",
        "hey",
        "morning",
        "afternoon",
        "evening",
        "greetings",
        "what",
        "who",
        "where",
        "when",
        "why",
        "how",
        "which",
        "yes",
        "no",
        "ok",
        "okay",
        "thanks",
        "thank",
        "fine",
        "good",
        "great",
        "nice",
        "cool",
      ];
      if (words.length === 1 && !commonWords.includes(words[0].toLowerCase())) {
        return words[0];
      }

      if (words.length === 2) {
        const secondWord = words[1].toLowerCase();
        // Check if the first word is a preposition or question word
        const firstWordPreposition = ["about", "regarding", "concerning"].includes(words[0].toLowerCase());
        if (firstWordPreposition && !commonWords.includes(secondWord)) {
          return secondWord;
        }
      }
    }

    return null;
  }

  /**
   * Generate a response specifically about an unknown term
   * @private
   * @param {string} term - The unknown term
   * @returns {string} - Response about the unknown term
   */
  _generateUnknownTermResponse(term) {
    // Get template
    const templateIndex = Math.floor(Math.random() * this.unknownTermTemplates.length);
    const template = this.unknownTermTemplates[templateIndex];

    // Return the formatted template with the term inserted
    return template.replace("{TERM}", term);
  }

  /**
   * Preprocess messages before detecting unknown terms
   * @private
   * @param {string} message - The message to analyze
   * @returns {string|null} - The detected term or null
   */ _preprocessMessage(message) {
    // Handle specific known issues with term detection
    const directTermPatterns = [
      /^do you know ([a-zA-Z0-9_-]+)\??$/i,
      /^tell me about ([a-zA-Z0-9_-]+)\??$/i,
      /^what(?:'?s|\s*is) ([a-zA-Z0-9_-]+)\??$/i,
      // Support for quoted terms
      /^what(?:'?s|\s*is) "(.*?)"\??$/i,
      /^do you know "(.*?)"\??$/i,
      /^tell me about "(.*?)"\??$/i,
    ];

    for (const pattern of directTermPatterns) {
      const match = message.match(pattern);
      if (match) {
        const term = match[1].toLowerCase().trim();
        logDebug("[Nova] CuriosityBehavior:preprocessMessage:directPattern", {
          pattern: pattern.toString(),
          term: term,
          originalMessage: message,
        });
        return term;
      }
    }

    // Check for just a single word as a query
    const singleWordPattern = /^([a-zA-Z0-9_-]{3,})\??$/i;
    const singleWordMatch = message.match(singleWordPattern);
    if (singleWordMatch) {
      const term = singleWordMatch[1].toLowerCase().trim();
      // Skip common words that wouldn't be unknown terms
      const commonWords = [
        "hi",
        "hello",
        "hey",
        "thanks",
        "thank",
        "you",
        "yes",
        "no",
        "maybe",
        "the",
        "this",
        "that",
        "your",
        "these",
        "those",
        "their",
        "our",
        "your",
      ];
      if (!commonWords.includes(term)) {
        logDebug("[Nova] CuriosityBehavior:preprocessMessage:singleWord", {
          term: term,
          originalMessage: message,
        });
        return term;
      }
    }

    // If the message ends with a question mark, make sure we handle it properly
    if (message.endsWith("?")) {
      // For "what is X?" patterns, make sure we extract the term correctly
      if (/^what(?:'s| is)/i.test(message)) {
        // Log that we're preprocessing a "what is" question
        logDebug("[Nova] CuriosityBehavior:preprocessMessage", {
          message: "Preprocessing 'what is' question",
          originalMessage: message,
        });

        // Extract the term directly - more flexible to handle various forms
        const whatIsMatch =
          message.match(/^what(?:'s| is)(?: a| an)? ([a-zA-Z0-9]+)\??$/i) ||
          message.match(/^what(?:'s| is) (.+?)\??$/i);

        if (whatIsMatch) {
          const term = whatIsMatch[1];
          if (term && term.length > 2) {
            // Check against common words
            const commonWords = ["the", "this", "that", "your", "these", "those", "their", "our", "your"];
            if (!commonWords.includes(term.toLowerCase())) {
              logDebug("[Nova] CuriosityBehavior:preprocessMessage:found", { term: term });
              return term;
            }
          }
        }
      }
    }
    return null;
  }
}

module.exports = CuriosityBehavior;
