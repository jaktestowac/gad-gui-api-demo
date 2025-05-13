const { sentimentPatterns, knowledgeBase } = require("./nova-base");

/**
 * Remove apostrophes from a string
 * @param {string} text - Text to process
 * @returns {string} - Text without apostrophes
 */
function removeApostrophes(text) {
  return text ? text.replace(/[']/g, "") : text;
}

/**
 * Normalize text for better matching by removing apostrophes and converting to lowercase
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  if (!text) return "";
  // Convert to lowercase and remove apostrophes
  return removeApostrophes(text.toLowerCase());
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Distance (number of edits required to transform a into b)
 */
function levenshteinDistance(a, b) {
  // Create a matrix of size (a.length+1) x (b.length+1)
  const matrix = Array(a.length + 1)
    .fill()
    .map(() => Array(b.length + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  // Fill the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Normalize user message using Levenshtein distance
 * @param {string} message - The user's message
 * @param {string[]} validTerms - Array of valid terms/commands to match against
 * @param {number} threshold - Maximum allowed distance (relative to string length)
 * @returns {string} - The normalized message or original if no match found
 */
function normalizeMessage(message, validTerms, threshold = 0.3) {
  if (!message || !validTerms || validTerms.length === 0) return message;

  const lowerMessage = normalizeText(message.trim());

  // First check for exact match
  if (validTerms.includes(lowerMessage)) return lowerMessage;

  // For prefix commands (like "show example" or "define"), try to match the prefix
  for (const term of validTerms) {
    if (term.includes(" ") && lowerMessage.startsWith(term.split(" ")[0])) {
      const prefix = term.split(" ")[0];
      if (lowerMessage.startsWith(prefix)) {
        // Check if the rest after the prefix is reasonably close to the expected format
        const restMessage = lowerMessage.substring(prefix.length).trim();
        const restExpected = term.substring(prefix.length).trim();

        if (restExpected && restMessage) {
          const distance = levenshteinDistance(restMessage, restExpected);
          const maxLength = Math.max(restMessage.length, restExpected.length);
          const normalizedDistance = distance / maxLength;

          if (normalizedDistance <= threshold) {
            return term + lowerMessage.substring(prefix.length + restExpected.length);
          }
        }
      }
    }
  }

  // For full message commands, find closest match
  let bestMatch = null;
  let bestDistance = Infinity;
  let bestNormalizedDistance = Infinity;

  for (const term of validTerms) {
    const distance = levenshteinDistance(lowerMessage, term);
    const maxLength = Math.max(lowerMessage.length, term.length);
    const normalizedDistance = distance / maxLength;

    // Use normalized distance to adjust for string length
    if (normalizedDistance < bestNormalizedDistance && normalizedDistance <= threshold) {
      bestNormalizedDistance = normalizedDistance;
      bestDistance = distance;
      bestMatch = term;
    }
  }

  // If valid match found within threshold, replace it
  if (bestMatch !== null) {
    if (bestDistance <= 2) {
      // For very close matches, just return the valid term
      return bestMatch;
    }
    // For words that might be part of a longer message, only normalize if they're very close
    if (lowerMessage.length > bestMatch.length * 1.5 && bestDistance > 1) {
      return message;
    }
    return bestMatch;
  }

  // No good match found, return original
  return message;
}

/**
 * Check if the user's message is close to a recognized command and suggest corrections
 * @param {string} message - User message
 * @returns {string|null} - Correction suggestion or null if no close matches
 */
function suggestCommandCorrection(message) {
  if (!message) return null;

  const lowerMessage = normalizeText(message.trim());

  // Special handling for prefix commands - don't suggest corrections for valid command patterns
  if (
    lowerMessage.startsWith("show example ") ||
    lowerMessage.startsWith("define ") ||
    lowerMessage.startsWith("convert ")
  ) {
    return null;
  }

  // List of common commands to check against
  const commonCommands = [
    "help",
    "tell me a joke",
    "tell me a fact",
    "play rock paper scissors",
    "play number guessing",
    "play hangman",
    "define",
    "convert",
    "show example",
    "calculate",
    "what do you know about me",
    "forget all",
  ]; // Find the closest command
  let bestMatch = null;
  let bestNormalizedDistance = Infinity;

  for (const command of commonCommands) {
    // For prefix commands, check if the user's message starts with something close
    if (command.includes(" ") && lowerMessage.length > command.split(" ")[0].length) {
      const prefix = command.split(" ")[0];
      const userPrefix = lowerMessage.split(" ")[0];

      const prefixDistance = levenshteinDistance(userPrefix, prefix);
      const prefixNormalizedDistance = prefixDistance / Math.max(userPrefix.length, prefix.length);

      // If prefix is close, this might be a command
      if (prefixNormalizedDistance <= 0.4) {
        const distance = levenshteinDistance(lowerMessage, command);
        const normalizedDistance = distance / Math.max(lowerMessage.length, command.length);

        if (normalizedDistance < bestNormalizedDistance) {
          bestNormalizedDistance = normalizedDistance;
          bestMatch = command;
        }
      }
    } else {
      // For full commands
      const distance = levenshteinDistance(lowerMessage, command);
      const normalizedDistance = distance / Math.max(lowerMessage.length, command.length);

      if (normalizedDistance < bestNormalizedDistance) {
        bestNormalizedDistance = normalizedDistance;
        bestMatch = command;
      }
    }
  }

  // If we found a reasonably close match
  if (bestMatch && bestNormalizedDistance <= 0.4) {
    return `Did you mean "${bestMatch}"? Try typing that instead with more details.`;
  }

  return null;
}

/**
 * Get normalized command from a message, checking against common commands
 * @param {string} message - User message
 * @returns {string} - Normalized command or original message
 */
function getNormalizedCommand(message) {
  if (!message) return message;

  const lowerMessage = normalizeText(message.trim());

  // Special handling for prefix commands that take parameters
  if (lowerMessage.startsWith("show example ")) {
    return "show example " + lowerMessage.substring(13).trim();
  }
  if (lowerMessage.startsWith("define ")) {
    return "define " + lowerMessage.substring(7).trim();
  }
  if (lowerMessage.startsWith("convert ")) {
    return "convert " + lowerMessage.substring(8).trim();
  }

  // Define common commands and their variations
  const commonCommands = [
    "help",
    "tell me a joke",
    "tell me a fact",
    "play rock paper scissors",
    "play number guessing",
    "play hangman",
    "rock",
    "paper",
    "scissors",
    "define",
    "convert",
    "show example",
    "calculate",
    "what do you know about me",
    "forget all",
  ];

  // Check for command-style messages (usually short and specific)
  const normalizedCommand = normalizeMessage(lowerMessage, commonCommands, 0.3);

  return normalizedCommand;
}

/**
 * Get normalized knowledge base query
 * @param {string} message - User message
 * @returns {string} - Normalized query or original message
 */
function getNormalizedKnowledgeQuery(message) {
  if (!message) return message;

  // Convert to lowercase, trim whitespace and remove trailing question marks
  const lowerMessage = normalizeText(message.trim().replace(/\?+$/, ""));

  // All knowledge base keys to match against
  const knowledgeBaseKeys = Object.keys(knowledgeBase);

  // Normalize against knowledge base keys
  const normalizedQuery = normalizeMessage(lowerMessage, knowledgeBaseKeys, 0.2);

  return normalizedQuery;
}

/**
 * Detect sentiment/emotion from user message
 * @param {string} message - User message
 * @returns {string|null} - Detected sentiment or null if none detected
 */
function detectSentiment(message) {
  for (const item of sentimentPatterns) {
    if (item.pattern.test(message)) {
      return item.sentiment;
    }
  }
  return null;
}

/**
 * Detect if a message is a question
 * @param {string} message - The message to check
 * @returns {boolean} - True if the message is a question
 */
function isQuestion(message) {
  // Check for question marks
  if (message.includes("?")) return true;

  // Check for question words
  const questionStartWords = [
    "what",
    "who",
    "where",
    "when",
    "why",
    "how",
    "can",
    "could",
    "would",
    "will",
    "should",
    "is",
    "are",
    "am",
    "do",
    "does",
    "did",
  ];

  const lowerMessage = normalizeText(message.trim());
  for (const word of questionStartWords) {
    if (lowerMessage.startsWith(word + " ")) {
      return true;
    }
  }

  return false;
}

/**
 * Analyze the message for its topic/intent
 * @param {string} message - User message
 * @returns {string} - Detected topic
 */
function detectTopic(message) {
  const lowerMessage = normalizeText(message);
  // Define topic patterns
  const topics = {
    programming: ["code", "program", "develop", "script", "function", "variable", "class", "method"],
    web: ["html", "css", "javascript", "web", "frontend", "backend", "website", "browser"],
    database: ["database", "sql", "query", "mongodb", "nosql", "table", "schema", "data"],
    tools: ["git", "docker", "kubernetes", "tool", "editor", "ide", "vs code", "command"],
    learning: ["learn", "tutorial", "course", "study", "education", "teach", "example"],
    career: ["job", "career", "interview", "work", "company", "hire", "resume", "salary"],
    personal: ["name", "feel", "think", "believe", "opinion", "favorite", "like", "hate"],
    greeting: ["hello", "hi", "hey", "morning", "afternoon", "evening", "greet"],
    farewell: ["bye", "goodbye", "see you", "later", "farewell", "exit"],
    wellbeing: [
      "how are you",
      "how do you feel",
      "how are things",
      "how is it going",
      "how's it going",
      "how've you been",
      "how have you been",
      "how's your day",
      "feeling today",
    ],
  };

  // Find matching topics
  const matchedTopics = {};
  for (const [topic, keywords] of Object.entries(topics)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        // Count number of matches for this topic
        matchedTopics[topic] = (matchedTopics[topic] || 0) + 1;
      }
    }
  }

  // If multiple topics with similar match counts, we have ambiguity
  const matchedTopicEntries = Object.entries(matchedTopics);

  // If no topics matched, return general
  if (matchedTopicEntries.length === 0) {
    return "general";
  }

  // Sort by number of matches (descending)
  matchedTopicEntries.sort((a, b) => b[1] - a[1]);

  // If we have a clear winner (significantly more matches), return it
  if (matchedTopicEntries.length === 1 || matchedTopicEntries[0][1] > matchedTopicEntries[1][1] * 1.5) {
    return matchedTopicEntries[0][0];
  }

  // If the top topics have similar matches, it's ambiguous
  if (matchedTopicEntries.length >= 2 && matchedTopicEntries[0][1] / matchedTopicEntries[1][1] < 1.5) {
    return "ambiguous";
  }

  // Default to the topic with most matches
  return matchedTopicEntries[0][0];
}

module.exports = {
  levenshteinDistance,
  normalizeMessage,
  suggestCommandCorrection,
  getNormalizedCommand,
  getNormalizedKnowledgeQuery,
  detectSentiment,
  isQuestion,
  detectTopic,
  removeApostrophes,
  normalizeText,
};
