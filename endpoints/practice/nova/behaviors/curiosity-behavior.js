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
const { processListTermsCommand } = require("../debug-term-commands");
const { knowledgeBase } = require("../nova-base");

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
   */ canHandle(message, context) {
    // Validate input parameters
    if (!message || typeof message !== "string") {
      return false;
    }

    if (!context || typeof context !== "object") {
      return false;
    }

    // Get the user ID from the conversation context
    const userId = context.userId || context.conversationId?.split("_")[0];

    // PRIORITY 0: Handle commands - this must come BEFORE any term detection
    // This prevents commands like /topics, /help, etc. from being treated as unknown terms
    if (message.trim().startsWith("/")) {
      // Only handle /list-terms command, let other behaviors handle other commands
      if (message.trim() === "/list-terms") {
        logDebug("[Nova] CuriosityBehavior:canHandle: /list-terms command detected", {
          message: message,
        });
        return true;
      }
      logDebug("[Nova] CuriosityBehavior:canHandle: Command detected (not handling)", {
        message: message,
        command: message.trim(),
      });
      return false; // Don't include curiosity behavior for other commands
    }

    // PRIORITY 1: Handle term definition scenarios
    if (context.isDefiningUnknownTerm && context.previousUnknownTerm) {
      return true;
    }

    // PRIORITY 2: Handle known terms
    if (context.knownTerm && userId) {
      return true;
    }

    // PRIORITY 3: Handle unknown terms
    if (context.unknownTerm) {
      return true;
    }

    // PRIORITY 4: Handle single-word queries that might be terms
    if (message.trim().split(/\s+/).length === 1 && message.length > 1) {
      const term = message
        .trim()
        .toLowerCase()
        .replace(/[?!.,;]/g, "");

      // Skip commands that start with /
      if (message.trim().startsWith("/")) {
        return false;
      }

      // Skip if this looks like a question or knowledge base query
      const questionPatterns = [
        /^(what|who|where|when|why|how|can|could|would|will|should|is|are|am|do|does|did)/i,
        /^(tell|explain|describe|define|show|give|provide)/i,
      ];

      for (const pattern of questionPatterns) {
        if (pattern.test(message.trim())) {
          logDebug("[Nova] CuriosityBehavior:canHandle:skippingQuestionPattern", {
            message: message,
            pattern: pattern.toString(),
          });
          return false; // Let knowledge base handle questions
        }
      }

      // Skip if this is a knowledge base term (let knowledge base handle it)
      const trimmed = message.trim().replace(/\?+$/, "").toLowerCase();
      if (trimmed in knowledgeBase) {
        logDebug("[Nova] CuriosityBehavior:canHandle:skippingKnowledgeBaseTerm", {
          message: message,
          term: trimmed,
        });
        return false; // Let knowledge base handle it
      }

      // Check if this is a known term (case-insensitive)
      if (userId && knowsTerm(term, userId)) {
        context.knownTerm = term;
        logDebug("[Nova] CuriosityBehavior:canHandle:foundKnownTerm", {
          term: term,
          message: message,
          userId: userId,
        });
        return true;
      }

      // Also check the original message case for known terms
      const originalTerm = message.trim().replace(/[?!.,;]/g, "");
      if (userId && knowsTerm(originalTerm, userId)) {
        context.knownTerm = originalTerm;
        logDebug("[Nova] CuriosityBehavior:canHandle:foundKnownTermOriginalCase", {
          term: originalTerm,
          message: message,
          userId: userId,
        });
        return true;
      }

      // Check if this could be an unknown term (not a common word)
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
        "ok",
        "okay",
        "help",
        "menu",
        "exit",
        "quit",
        "bye",
        "good",
        "great",
        "nice",
        "cool",
        "fine",
        "what",
        "who",
        "where",
        "when",
        "why",
        "how",
        "gad", // Add GAD to common words since it's a known topic
      ];

      if (!commonWords.includes(term) && term.length >= 2) {
        // Double-check that this isn't actually a known term before marking as unknown
        if (userId && knowsTerm(term, userId)) {
          context.knownTerm = term;
          logDebug("[Nova] CuriosityBehavior:canHandle:foundKnownTermInUnknownCheck", {
            term: term,
            message: message,
            userId: userId,
          });
          return true;
        }

        context.unknownTerm = term;
        return true;
      }
    }
    // PRIORITY 5: Handle direct term questions with better pattern matching
    const directTermPatterns = [
      /^what(?:'s| is)(?: a| an| the)? ([a-zA-Z0-9_-]+)\??$/i,
      /^do you know ([a-zA-Z0-9_-]+)\??$/i,
      /^tell me about ([a-zA-Z0-9_-]+)\??$/i,
      /^what(?:'s| is) "(.*?)"\??$/i,
      /^do you know "(.*?)"\??$/i,
      /^tell me about "(.*?)"\??$/i,
      // Add more flexible patterns for knowledge base queries
      /^(?:can you )?tell me about ([a-zA-Z0-9_-]+)\??$/i,
      /^(?:can you )?explain ([a-zA-Z0-9_-]+)\??$/i,
      /^(?:can you )?describe ([a-zA-Z0-9_-]+)\??$/i,
    ];

    for (const pattern of directTermPatterns) {
      const match = message.match(pattern);
      if (match) {
        const term = match[1].toLowerCase().trim();

        // Check if this is a known term
        if (userId && knowsTerm(term, userId)) {
          context.knownTerm = term;
          return true;
        } else {
          // Mark as unknown term
          context.unknownTerm = term;
          return true;
        }
      }
    }

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
    }

    // PRIORITY 6: Handle ambiguous or unclear messages that need clarification
    const isShortMessage = message.trim().split(/\s+/).length <= 3;
    const isQuestion =
      message.includes("?") ||
      /^(what|who|where|when|why|how|can|could|would|will|should|is|are|am|do|does|did)/i.test(message);
    const hasTooManyOrNoMatches = context.matchingBehaviorCount === 0 || context.matchingBehaviorCount > 3;

    // If it's a short question or unclear message, let curiosity handle it
    if ((isShortMessage && isQuestion) || hasTooManyOrNoMatches) {
      return true;
    }

    // PRIORITY 7: Handle ambiguous or unclear messages that need clarification
    // Only activate when Nova's understanding is limited
    // Check if no other behaviors matched (except default)
    const hasOnlyDefaultBehavior = context.matchingBehaviorCount <= 1;

    // Check if the unrecognized count is increasing
    const hasUnrecognizedMessages = context.unrecognizedCount > 0;

    // Check if message is very short (potential ambiguity)
    const isVeryShortMessage = message.length < 10;

    // Check if message lacks clear topic
    const hasAmbiguousTopic = context.currentTopic === "ambiguous" || !context.currentTopic;

    // When there are multiple behaviors but they're low confidence
    const hasLowConfidenceMatches = context.hasLowConfidenceMatches || false;

    return (
      hasOnlyDefaultBehavior ||
      hasUnrecognizedMessages ||
      (isVeryShortMessage && hasAmbiguousTopic) ||
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
    const userId = context.userId || context.conversationId?.split("_")[0]; // Save context reference for diagnostic purposes
    this.context = context; // Handle debug commands
    if (context.debugResult) {
      return context.debugResult;
    }

    // Prevent term learning/definition for commands
    if (
      (context.previousUnknownTerm && context.previousUnknownTerm.startsWith("/")) ||
      (context.unknownTerm && context.unknownTerm.startsWith("/"))
    ) {
      logDebug("[Nova] CuriosityBehavior: Skipping term learning for command", {
        previousUnknownTerm: context.previousUnknownTerm,
        unknownTerm: context.unknownTerm,
        message,
      });
      context.previousUnknownTerm = null;
      context.unknownTerm = null;
      context.isDefiningUnknownTerm = false;
      return null;
    }

    // Handle specific commands that are related to term learning
    if (message.trim().startsWith("/list-terms")) {
      return processListTermsCommand(userId);
    }

    // Log detailed debugging info
    logDebug(`[Nova] CuriosityBehavior:handle`, {
      userId,
      isDefiningUnknownTerm: context.isDefiningUnknownTerm,
      previousUnknownTerm: context.previousUnknownTerm,
      knownTerm: context.knownTerm,
      unknownTerm: context.unknownTerm,
      message: message,
      messageLength: message.length,
      wordCount: message.trim().split(/\s+/).length,
      matchingBehaviorCount: context.matchingBehaviorCount || 0,
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
      }); // Check for dismissive phrases that indicate the user doesn't want to define the term
      const dismissivePhrases = [
        /^forget\s*it$/i,
        /^never\s*mind$/i,
        /^doesn'?t\s*matter$/i,
        /^don'?t\s*(?:worry|bother)(?:\s*about\s*it)?$/i,
        /^skip\s*(?:it|this)$/i,
        /^i\s*don'?t\s*(?:know|care)$/i,
        /^not\s*important$/i,
        /^no\s*(?:thanks|thank\s*you)?$/i,
        /^no$/i,
        /^nope$/i,
        /^nah$/i,
        /^i\s*don'?t\s*want\s*to\s*define\s*it$/i,
        /^i\s*don'?t\s*feel\s*like\s*explaining$/i,
        /^i\s*don'?t\s*have\s*time$/i,
        /^i\s*don'?t\s*want\s*to\s*talk\s*about\s*it$/i,
        /^i\s*don'?t\s*feel\s*like\s*it$/i,
      ];

      // Check if the message matches any dismissive phrase
      let isDismissive = false;
      for (const pattern of dismissivePhrases) {
        if (pattern.test(message.trim())) {
          isDismissive = true;
          break;
        }
      }

      if (isDismissive) {
        // Clear the previous unknown term context
        context.previousUnknownTerm = null;
        context.isDefiningUnknownTerm = false; // Reset the definition flag

        logDebug(`[Nova] CuriosityBehavior:handle:userDismissedDefinition`, {
          termName,
          userId,
          message,
        });

        // Acknowledge the dismissal
        return `No problem! We can talk about something else. What would you like to discuss?`;
      }

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
        }); // Thank the user for the definition
        return `Thank you for explaining what "${termName}" means! I'll remember that for future conversations. You can use /list-terms to see all terms I've learned. Is there anything else you'd like to know about?`;
      } else {
        // Special case for very short messages that might be the user repeating the term
        if (message.trim().toLowerCase() === termName.toLowerCase()) {
          logDebug(`[Nova] CuriosityBehavior:handle:userRepeatedTerm`, {
            termName,
            userId,
            message,
          });

          // If the user just repeats the term, prompt them more directly
          return `I'd like to learn what "${termName}" means. Could you explain it in a few words?`;
        }

        // Handle very short messages that are likely incomplete definitions
        if (message.trim().length <= 5) {
          logDebug(`[Nova] CuriosityBehavior:handle:veryShortDefinition`, {
            termName,
            userId,
            message,
          });

          // For very short potential definitions, ask for a bit more detail
          return `Thanks! Could you tell me a bit more about what "${termName}" means?`;
        }

        logDebug(`[Nova] CuriosityBehavior:handle:definitionExtractionFailed`, {
          termName,
          userId,
          message,
        }); // If extraction failed, kindly ask for a more detailed explanation
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
          }); // Format the response with the user-defined term
          const responses = [
            `${termName}: ${definition}`,
            `According to what you've taught me, ${termName} is ${definition}`,
            `Based on what I've learned from you, ${termName} means: ${definition}`,
            `You previously explained that ${termName} is ${definition}`,
            `From our previous conversation, I remember that ${termName} refers to ${definition}`,
          ];

          // For single-word queries, use a more direct response format
          if (message.trim().split(/\s+/).length === 1 && message.trim().toLowerCase() === termName.toLowerCase()) {
            return `${termName}: ${definition}`;
          }

          return responses[Math.floor(Math.random() * responses.length)];
        } else {
          logDebug(`[Nova] CuriosityBehavior:handle:knownTermButNoDefinition "${termName}"`, {
            userId,
            message,
            allAvailableTerms: userMemory[userId]?.learnedTerms ? Object.keys(userMemory[userId].learnedTerms) : [],
            storageState: userMemory[userId]?.learnedTerms ? "exists" : "missing",
            memory: userMemory[userId] ? "exists" : "missing",
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
   */
  _detectUnknownTerm(message) {
    // Check if the term exists in knowledge base before treating as unknown
    const lowerMessage = message.toLowerCase();

    // IMPORTANT: Skip processing if this is a command (starts with "/")
    // This prevents commands like /help, /status, /debug, etc. from being treated as unknown terms
    if (message.trim().startsWith("/")) {
      logDebug("[Nova] CuriosityBehavior: Skipping unknown term detection for command", {
        message: message,
        reason: "Command detected (starts with '/')",
      });
      return null;
    }

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
        // Skip if term exists in knowledge base
        if (term.toLowerCase() in knowledgeBase) {
          logDebug("[Nova] CuriosityBehavior: Skipping quoted term (exists in knowledge base)", {
            term: term,
            pattern: pattern.toString(),
            originalMessage: message,
          });
          continue;
        }
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
        // Skip if term exists in knowledge base
        if (term.toLowerCase() in knowledgeBase) {
          logDebug("[Nova] CuriosityBehavior: Skipping 'do you know' term (exists in knowledge base)", {
            term: term,
            patternIndex: doYouKnowPatterns.indexOf(pattern),
            originalMessage: message,
          });
          continue;
        }
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

          // Skip if term exists in knowledge base
          if (cleanTerm.toLowerCase() in knowledgeBase) {
            logDebug("[Nova] CuriosityBehavior: Skipping 'what is' term (exists in knowledge base)", {
              term: cleanTerm,
              patternIndex: whatIsPatterns.indexOf(pattern),
              originalMessage: message,
            });
            continue;
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

          // Skip if term exists in knowledge base
          if (cleanTerm.toLowerCase() in knowledgeBase) {
            logDebug("[Nova] CuriosityBehavior: Skipping 'tell me about' term (exists in knowledge base)", {
              term: cleanTerm,
              patternIndex: tellMePatterns.indexOf(pattern),
              originalMessage: message,
            });
            continue;
          }

          logDebug("[Nova] CuriosityBehavior: Detected term from 'tell me about' question", {
            term: cleanTerm,
            patternIndex: tellMePatterns.indexOf(pattern),
            originalMessage: message,
          });
          return cleanTerm;
        }
      }
    } // For short messages with just a word or two, treat as potential unknown term
    if (message.trim().split(/\s+/).length <= 2 && message.length > 2) {
      // Remove punctuation and get the main word
      const cleanedMessage = message.replace(/[?!.,;]/g, "").trim();
      const words = cleanedMessage.split(/\s+/); // If it's just one word and not a common greeting or question word
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
        "bye",
        "help",
        "menu",
        "exit",
        "quit",
      ];
      if (words.length === 1 && !commonWords.includes(words[0].toLowerCase())) {
        // Very important: single-word inputs could be previously defined terms
        // Detect them and let the caller determine if they're known or unknown
        const potentialTerm = words[0].toLowerCase();

        // Skip if term exists in knowledge base
        if (potentialTerm in knowledgeBase) {
          logDebug("[Nova] CuriosityBehavior: Skipping single-word term (exists in knowledge base)", {
            term: potentialTerm,
            originalMessage: message,
            wordLength: potentialTerm.length,
          });
          return null;
        }

        logDebug("[Nova] CuriosityBehavior: Detected single-word potential term", {
          term: potentialTerm,
          originalMessage: message,
          wordLength: potentialTerm.length,
        });

        // Minimum length check - avoid very short terms that might be typos
        if (potentialTerm.length >= 2) {
          return potentialTerm;
        }
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
   * @param {string} [userId] - Optional user ID for checking known terms
   * @returns {string|null} - The detected term or null
   */
  _preprocessMessage(message, userId) {
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

    // Check for just a single word as a query (minimum 2 chars)
    const singleWordPattern = /^([a-zA-Z0-9_-]{2,})\??$/i;
    const singleWordMatch = message.match(singleWordPattern);
    if (singleWordMatch) {
      const term = singleWordMatch[1].toLowerCase().trim();

      // Check if the term is known (for direct recall)
      // Only do this if userId is provided
      if (userId && typeof knowsTerm === "function") {
        try {
          const isKnownTerm = knowsTerm(term, userId);
          if (isKnownTerm) {
            logDebug("[Nova] CuriosityBehavior:preprocessMessage:singleWordKnownTerm", {
              term: term,
              originalMessage: message,
              isKnown: true,
            });
            return term;
          }
        } catch (error) {
          // Safely handle any errors in term checking
          logDebug("[Nova] ERROR: Failed to check if term is known", {
            term,
            error: error.message,
          });
        }
      }

      // Otherwise, check against common words
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
        "ok",
        "okay",
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
