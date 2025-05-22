const { detectSentiment } = require("./text-processing");
const { logDebug } = require("../../../helpers/logger-api");

// In-memory storage for user memory
const userMemory = {};

/**
 * Initialize or update user memory with enhanced tracking
 * @param {string} userId - The user identifier
 * @returns {Object} - The user memory object
 */
function initUserMemory(userId) {
  if (!userMemory[userId]) {
    userMemory[userId] = {
      name: null,
      preferences: {},
      facts: [],
      profession: null,
      sentiments: [],
      topics: [],
      learnedTerms: {}, // Store learned terms and their definitions
      activeGames: {},
      lastInteractions: {},
      counters: {
        totalInteractions: 0,
        questionsAsked: 0,
        commandsUsed: 0,
      },
    };
  }

  // Increment interaction counter
  userMemory[userId].counters.totalInteractions++;

  return userMemory[userId];
}

/**
 * Generate a more personalized response based on user history
 * @param {string} userId - User ID
 * @returns {string|null} - Personalized message or null
 */
function generatePersonalizedResponse(userId) {
  const memory = userMemory[userId];
  if (!memory) {
    return null; // No memory found for this user
  }

  // If we know their name, occasionally use it
  if (memory.name && Math.random() < 0.4) {
    const greeting = [
      `By the way, ${memory.name}, `,
      `Oh, ${memory.name}, `,
      `${memory.name}, `,
      `I remember, ${memory.name}, `,
    ];
    const randomGreeting = greeting[Math.floor(Math.random() * greeting.length)];

    // If we know their profession
    if (memory.profession) {
      return `${randomGreeting}since you're a ${memory.profession}, you might be interested in some of our advanced programming resources.`;
    }

    // If they have shown interest in specific topics
    if (memory.topics && memory.topics.length > 0) {
      const topic = memory.topics[Math.floor(Math.random() * memory.topics.length)];
      return `${randomGreeting}I noticed you were interested in ${topic}. Would you like some resources about that?`;
    }

    // If they need positivity
    if (memory.needsPositivity) {
      return `${randomGreeting}I hope your day is going well. Is there anything specific I can help you with today?`;
    }
  }

  return null;
}

/**
 * Extract user information from a message
 * @param {string} message - The user's message
 * @param {string} conversationId - Conversation identifier
 * @returns {boolean} - Whether information was extracted
 */
function extractAndRememberUserInfo(message, conversationId) {
  const userId = conversationId.split("_")[0];

  // Initialize or get user memory
  const memory = initUserMemory(userId);
  let infoExtracted = false;

  // First try to extract topic interests
  const detectedTopic = extractAndTrackTopicInterest(message, userId);
  if (detectedTopic) {
    infoExtracted = true;
  } // Extract name (consolidated patterns for better performance)
  const namePatterns = [
    /my (?:name is|name's) ([A-Za-z]+)/i,
    /i(?:'?m|\s*am)\b ([A-Za-z]+)/i, // Improved consolidated "I am" variations
    /(?:call|you can call) me ([A-Za-z]+)/i,
    /i(?:'?m|\s*am)? known as ([A-Za-z]+)/i, // Improved pattern
    /i go by ([A-Za-z]+)/i,
    /my (?:nickname|friends call) me ([A-Za-z]+)/i,
    /i (?:prefer|would like) to be called ([A-Za-z]+)/i,
  ];

  for (const pattern of namePatterns) {
    const nameMatch = message.match(pattern);
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1];
      if (name.toLowerCase() !== "a" && name.toLowerCase() !== "the") {
        memory.name = nameMatch[1];
        infoExtracted = true;
        break;
      }
    }
  } // Extract preferences with consolidated patterns
  const likesPatterns = [
    /i (?:like|love|enjoy|prefer) ([^,.!?]+)/i,
    /([^,.!?]+) (?:is great|is awesome|is amazing)/i,
    /([^,.!?]+) (?:is my favorite)/i,
    /i(?:'?m|\s*am)\b (?:a fan of|fond of|into|really into) ([^,.!?]+)/i,
  ];

  for (const pattern of likesPatterns) {
    const likesMatch = message.match(pattern);
    if (likesMatch && likesMatch[1]) {
      const topic = likesMatch[1].trim().toLowerCase();
      if (topic.length > 2) {
        // Avoid very short topics
        memory.preferences[topic] = "like";
        infoExtracted = true;
      }
    }
  } // Extract dislikes with consolidated patterns
  const dislikesPatterns = [
    /i (?:dislike|hate|don'?t like|do not like) ([^,.!?]+)/i,
    /([^,.!?]+) (?:is bad|is terrible|is awful)/i,
    /([^,.!?]+) (?:is my least favorite)/i,
    /i(?:'?m|\s*am)\b not (?:a fan of|fond of|into|really into|really a fan of|really fond of|really keen on|really interested in) ([^,.!?]+)/i,
  ];

  for (const pattern of dislikesPatterns) {
    const dislikesMatch = message.match(pattern);
    if (dislikesMatch && dislikesMatch[1]) {
      const topic = dislikesMatch[1].trim().toLowerCase();
      if (topic.length > 2) {
        // Avoid very short topics
        memory.preferences[topic] = "dislike";
        infoExtracted = true;
      }
    }
  } // Extract profession or role (consolidated patterns)
  const professionPatterns = [
    /i(?:'?m|\s*am)\b(?: an?| ) ([^,.!?]+(?: developer| engineer| designer| programmer| student| teacher| manager| professional))/i,
    /my (?:job|profession|role) is ([^,.!?]+)/i,
    /i work(?: as)? ([^,.!?]+)/i,
    /i(?:'?m|\s*am)\b(?: a| an) ([^,.!?]+)/i,
    /i(?:'?m|\s*am)\b working as ([^,.!?]+)/i,
  ];

  for (const pattern of professionPatterns) {
    const professionMatch = message.match(pattern);
    if (professionMatch && professionMatch[1]) {
      memory.profession = professionMatch[1].trim();
      infoExtracted = true;
      break;
    }
  } // Extract age information (optimized pattern)
  const agePatterns = [
    /i(?:'?m|\s*am)\b (\d+)(?: years old)?/i, // Improved pattern for all "I am" variations
  ];

  for (const pattern of agePatterns) {
    const ageMatch = message.match(pattern);
    if (ageMatch && ageMatch[1]) {
      const age = parseInt(ageMatch[1], 10);
      if (age > 0 && age < 120) {
        // Sanity check
        memory.age = age;
        infoExtracted = true;
        break;
      }
    }
  } // Extract location information (optimized pattern)
  const locationPatterns = [
    /i (?:live|stay) in ([^,.!?]+)/i,
    /i(?:'?m|\s*am)\b from ([^,.!?]+)/i, // Improved pattern for all "I am" variations
  ];

  for (const pattern of locationPatterns) {
    const locationMatch = message.match(pattern);
    if (locationMatch && locationMatch[1]) {
      memory.location = locationMatch[1].trim();
      infoExtracted = true;
      break;
    }
  }

  // Track sentiment
  const sentiment = detectSentiment(message);
  if (sentiment) {
    if (!memory.sentiments) {
      memory.sentiments = [];
    }
    memory.sentiments.push({
      sentiment,
      timestamp: Date.now(),
    });

    // If consistent very negative sentiment, we might adjust our responses
    const recentSentiments = memory.sentiments.slice(-5);
    const negativeCount = recentSentiments.filter(
      (s) => s.sentiment === "negative" || s.sentiment === "very-negative"
    ).length;

    if (negativeCount >= 3) {
      memory.needsPositivity = true;
    } else {
      memory.needsPositivity = false;
    }

    logDebug("[Nova] User sentiment detected:", {
      sentiment,
      recentSentiments,
      needsPositivity: memory.needsPositivity,
    });
  }

  // Track topics of interest
  const topicKeywords = [
    "javascript",
    "python",
    "programming",
    "coding",
    "developer",
    "web",
    "software",
    "app",
    "mobile",
    "data",
    "ai",
    "machine learning",
    "frontend",
    "backend",
    "database",
    "api",
    "server",
    "cloud",
    "devops",
    "security",
  ];

  for (const keyword of topicKeywords) {
    if (message.toLowerCase().includes(keyword)) {
      if (!memory.topics.includes(keyword)) {
        memory.topics.push(keyword);
      }
      memory.lastInteractions.topic = keyword;
    }
  }

  return infoExtracted;
}

/**
 * Extract and save topic interests from a message
 * @param {string} message - The user's message
 * @param {string} userId - User identifier
 * @returns {string|null} - Detected topic or null
 */
function extractAndTrackTopicInterest(message, userId) {
  if (!message || !userId) return null;

  // Initialize or get user memory
  const memory = initUserMemory(userId);

  // Ensure topics array exists
  if (!memory.topics) {
    memory.topics = [];
  }

  // Common programming topics to track
  const topicKeywords = {
    javascript: ["javascript", "js", "node", "react", "vue", "angular", "typescript", "ts"],
    python: ["python", "py", "django", "flask", "pandas", "numpy", "scipy"],
    web: ["web", "html", "css", "dom", "browser", "frontend", "website"],
    database: ["database", "sql", "nosql", "mongodb", "postgres", "mysql", "oracle", "data"],
    api: ["api", "rest", "graphql", "endpoint", "request", "http"],
    ai: ["ai", "artificial intelligence", "ml", "machine learning", "nlp", "neural network"],
    programming: ["code", "programming", "software", "development", "coding"],
    backend: ["backend", "server", "node.js", "express", "php", "java"],
    frontend: ["frontend", "ui", "ux", "interface", "design"],
  };

  const lowerMessage = message.toLowerCase();
  let detectedTopic = null;

  // First check for direct topic mentions
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    // Check for the topic name itself
    if (lowerMessage.includes(topic)) {
      detectedTopic = topic;
      break;
    }

    // Check for specific keywords
    for (const keyword of keywords) {
      // Make sure we're matching whole words or phrases
      if (
        lowerMessage.includes(` ${keyword} `) ||
        lowerMessage.includes(`${keyword} `) ||
        lowerMessage.includes(` ${keyword}`) ||
        lowerMessage === keyword
      ) {
        detectedTopic = topic;
        break;
      }
    }

    if (detectedTopic) break;
  }

  // If we found a topic, add it to user memory
  if (detectedTopic) {
    // Add to the beginning if not already in the list
    if (!memory.topics.includes(detectedTopic)) {
      memory.topics.unshift(detectedTopic);

      // Keep only the 5 most recent topics
      if (memory.topics.length > 5) {
        memory.topics = memory.topics.slice(0, 5);
      }

      logDebug(`[Nova] Added topic interest for user ${userId}: ${detectedTopic}`);
    }
  }

  return detectedTopic;
}

/**
 * Store information about a previously unknown term
 * @param {string} term - The term being learned
 * @param {string} definition - The definition or explanation of the term
 * @param {string} userId - User identifier
 * @returns {boolean} - Whether the term was successfully stored
 */
function learnNewTerm(term, definition, userId) {
  if (!term || !definition || !userId) {
    logDebug(`[Nova] ERROR: Failed to learn term - missing parameters`, { term, definition, userId });
    return false;
  }

  logDebug(`[Nova] INVOKE: learnNewTerm called with term "${term}"`, { term, definition, userId });

  // Initialize or get user memory
  const memory = initUserMemory(userId);

  if (!memory.learnedTerms) {
    // Force initialize learnedTerms if missing
    memory.learnedTerms = {};
    logDebug(`[Nova] WARNING: Had to initialize learnedTerms for user ${userId}`);
  }

  // Store the term in lowercase for case-insensitive matching
  const normalizedTerm = term.toLowerCase().trim();

  // Log current state before updating
  logDebug(`[Nova] LEARNING: Current learned terms before adding`, {
    userId,
    count: Object.keys(memory.learnedTerms).length,
    terms: Object.keys(memory.learnedTerms),
  });

  // Store the definition with metadata
  memory.learnedTerms[normalizedTerm] = {
    definition: definition,
    learnedAt: new Date().toISOString(),
    usageCount: 0,
    lastUsed: null,
  };

  // Verify the term was actually stored
  if (!memory.learnedTerms[normalizedTerm]) {
    logDebug(`[Nova] ERROR: Failed to store term "${normalizedTerm}" for user ${userId}`);
    return false;
  }

  logDebug(`[Nova] SUCCESS: Learned new term for user ${userId}: "${normalizedTerm}"`, {
    definition,
    totalTermsKnown: Object.keys(memory.learnedTerms).length,
    allTerms: Object.keys(memory.learnedTerms),
  });

  return true;
}

/**
 * Check if Nova knows about a specific term for this user
 * @param {string} term - The term to check
 * @param {string} userId - User identifier
 * @returns {boolean} - Whether Nova knows about this term
 */
function knowsTerm(term, userId) {
  if (!term || !userId) {
    logDebug(`[Nova] ERROR: Cannot check term - missing parameters`, { term, userId });
    return false;
  }

  if (!userMemory[userId]) {
    logDebug(`[Nova] ERROR: User memory doesn't exist for user ${userId}`);
    return false;
  }

  if (!userMemory[userId].learnedTerms) {
    logDebug(`[Nova] ERROR: learnedTerms object missing for user ${userId}`);
    return false;
  }

  const normalizedTerm = term.toLowerCase().trim();
  const termExists = !!userMemory[userId].learnedTerms[normalizedTerm];

  // Log detailed info
  logDebug(`[Nova] KNOWS_TERM: Checking if Nova knows term "${normalizedTerm}" for user ${userId}`, {
    result: termExists,
    allTerms: Object.keys(userMemory[userId].learnedTerms),
    totalTermsKnown: Object.keys(userMemory[userId].learnedTerms).length,
  });

  return termExists;
}

/**
 * Get the definition of a term Nova has learned
 * @param {string} term - The term to retrieve
 * @param {string} userId - User identifier
 * @returns {string|null} - The definition or null if not found
 */
function getLearnedTermDefinition(term, userId) {
  if (!term || !userId || !userMemory[userId]) {
    logDebug(`[Nova] ERROR: Cannot get definition - missing parameters or user memory`, { term, userId });
    return null;
  }

  // Clean the term - this helps with minor formatting differences
  const normalizedTerm = term.toLowerCase().trim();

  if (!userMemory[userId].learnedTerms) {
    logDebug(`[Nova] ERROR: learnedTerms object missing for user ${userId}`);
    // Initialize it to prevent future errors
    userMemory[userId].learnedTerms = {};
    return null;
  }

  const termInfo = userMemory[userId].learnedTerms[normalizedTerm];

  if (!termInfo) {
    logDebug(`[Nova] ERROR: Term "${normalizedTerm}" not found for user ${userId}`, {
      availableTerms: Object.keys(userMemory[userId].learnedTerms),
    });
    return null;
  }

  // Update usage statistics
  termInfo.usageCount++;
  termInfo.lastUsed = new Date().toISOString();

  logDebug(`[Nova] SUCCESS: Retrieved definition for term "${normalizedTerm}" for user ${userId}`, {
    usageCount: termInfo.usageCount,
    definition: termInfo.definition,
    allTerms: Object.keys(userMemory[userId].learnedTerms),
  });

  return termInfo.definition;
}

/**
 * Extract potential term definition from a user's response
 * @param {string} message - The user's message
 * @param {string} term - The term that was previously unknown
 * @param {string} userId - User identifier
 * @returns {boolean} - Whether a definition was extracted and stored
 */
function extractTermDefinition(message, term, userId) {
  if (!message || !term || !userId) {
    logDebug(`[Nova] ERROR: Cannot extract definition - missing parameters`, { message, term, userId });
    return false;
  }

  // Check for dismissive phrases that indicate the user doesn't want to define the term
  const dismissivePhrases = [
    /^forget\s*it$/i,
    /^never\s*mind$/i,
    /^doesn'?t\s*matter$/i,
    /^don'?t\s*(?:worry|bother)(?:\s*about\s*it)?$/i,
    /^skip\s*(?:it|this)$/i,
    /^i\s*don'?t\s*(?:know|care)$/i,
    /^not\s*important$/i,
    /^no\s*(?:thanks|thank\s*you)?$/i,
  ];

  // Check if the message matches any dismissive phrase
  for (const pattern of dismissivePhrases) {
    if (pattern.test(message.trim())) {
      logDebug(`[Nova] EXTRACT: User dismissed defining the term "${term}"`, {
        message,
        userId,
        pattern: pattern.toString(),
      });
      return false;
    }
  }

  // Log detailed info about the extraction attempt
  logDebug(`[Nova] EXTRACT: Attempting to extract definition for term "${term}"`, {
    message,
    userId,
    messageLength: message.length,
    timestamp: new Date().toISOString(),
  }); // Try to extract a definition from various patterns in the message
  let definition = null;

  // Simple pattern for very short definitions like "its X"
  const simplePattern = /^its\s+(.+)$/i;
  const simpleMatch = message.match(simplePattern);
  if (simpleMatch && simpleMatch[1]) {
    definition = simpleMatch[1].trim();
    logDebug(`[Nova] EXTRACT: Found definition using simple pattern`, {
      pattern: simplePattern.toString(),
      definition,
    });
  }

  // Escape special characters in the term for regex safety
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Pattern 1: Direct definition patterns like "X is Y" or "X means Y"
  const directPatterns = [
    new RegExp(`${escapedTerm}\\s+(?:is|means|refers to|=)\\s+(.+)`, "i"),
    new RegExp(`(?:the|a|an)\\s+${escapedTerm}\\s+(?:is|means|refers to|=)\\s+(.+)`, "i"),
    new RegExp(`${escapedTerm}(?::|-)\\s*(.+)`, "i"), // For patterns like "term: definition" or "term - definition"
    new RegExp(`${escapedTerm}\\s+(?:can be defined as|is defined as)\\s+(.+)`, "i"), // Add "defined as" pattern
  ];

  for (const pattern of directPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      definition = match[1].trim();
      logDebug(`[Nova] EXTRACT: Found definition using direct pattern`, { pattern: pattern.toString(), definition });
      break;
    }
  }
  // Pattern 2: "It is X" or "That's X" patterns (when responding to a direct question)
  if (!definition) {
    const indirectPatterns = [
      /^(?:it|that|this)\s+(?:is|means|refers to)\s+(.+)/i,
      /^(?:it'?s|that'?s|this is)\s+(.+)/i,
      /^(?:its|it is)\s+(.+)/i, // Added pattern for "its X" which is a common short form
      /^(?:a|an)\s+(.+)/i,
      /^(?:basically|simply|just)\s+(?:a|an|the)?\s*(.+)/i,
      /^(?:something|a thing|an object|a concept)\s+(?:that|which|who)\s+(.+)/i,
      /^(?:the|this|that)\s+(?:is|means|refers to)\s+(.+)/i,
    ];

    for (const pattern of indirectPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        definition = match[1].trim();
        logDebug(`[Nova] EXTRACT: Found definition using indirect pattern`, {
          pattern: pattern.toString(),
          definition,
        });
        break;
      }
    }
  } // Pattern 3: Use the entire message if it's a simple response and nothing else matched
  if (!definition && message.trim().length > 2 && message.trim().length < 150) {
    definition = message.trim();
    logDebug(`[Nova] EXTRACT: Using entire message as definition`, { definition });
  }

  logDebug(`[Nova] EXTRACT: Final definition extracted`, {
    term,
    definition,
    message,
    userId,
  });

  // Clean up the definition (remove ending punctuation, etc.)
  if (definition) {
    // Remove phrase beginnings like "it is", "it's", etc. if using full message
    definition = definition
      .replace(/^(?:well,?|um,?|hmm,?|so,?|okay,?|like,?|you see,?|basically,?|actually,?)\s+/i, "") // Expanded filler words
      .replace(/[.!?]+$/, "") // Remove ending punctuation
      .trim();

    // If definition is too short, use the entire message
    if (definition.length < 5 && message.trim().length > 5) {
      definition = message.trim();
      logDebug(`[Nova] EXTRACT: Definition too short, falling back to entire message`, { definition });
    }
  }
  // Store the term if the definition seems reasonable (not too short)
  if (definition && definition.length > 2) {
    const success = learnNewTerm(term, definition, userId);

    if (!success) {
      logDebug(`[Nova] ERROR: Failed to learn term after extraction`, { term, definition });
      return false;
    }

    logDebug(`[Nova] SUCCESS: Successfully extracted and saved definition for "${term}"`, {
      definition,
      userId,
    });

    return true;
  } else {
    logDebug(`[Nova] ERROR: Could not extract a valid definition`, {
      originalMessage: message,
      extractedDefinition: definition || "(none)",
    });
    return false;
  }
}

// Export all user memory functions
module.exports = {
  userMemory,
  initUserMemory,
  generatePersonalizedResponse,
  extractAndRememberUserInfo,
  extractAndTrackTopicInterest,
  learnNewTerm,
  knowsTerm,
  getLearnedTermDefinition,
  extractTermDefinition,
};
