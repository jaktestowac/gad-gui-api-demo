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
  }

  // Extract name (expanded to detect more name patterns)
  const namePatterns = [
    /my name is ([A-Za-z]+)/i,
    /i am ([A-Za-z]+)/i,
    /call me ([A-Za-z]+)/i,
    /i'm ([A-Za-z]+)/i,
    /my name's ([A-Za-z]+)/i,
    /you can call me ([A-Za-z]+)/i,
    /i'm known as ([A-Za-z]+)/i,
    /i go by ([A-Za-z]+)/i,
    /my nickname is ([A-Za-z]+)/i,
    /i prefer to be called ([A-Za-z]+)/i,
    /i would like to be called ([A-Za-z]+)/i,
    /i am known as ([A-Za-z]+)/i,
    /my friends call me ([A-Za-z]+)/i,
    /im ([A-Za-z]+)/i,
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
  }

  // Extract preferences with more patterns
  const likesPatterns = [
    /i (?:like|love|enjoy|prefer) ([^,.!?]+)/i,
    /([^,.!?]+) (?:is great|is awesome|is amazing)/i,
    /([^,.!?]+) (?:is my favorite)/i,
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
  }

  // Extract dislikes with more patterns
  const dislikesPatterns = [
    /i (?:dislike|hate|don't like|do not like) ([^,.!?]+)/i,
    /([^,.!?]+) (?:is bad|is terrible|is awful)/i,
    /([^,.!?]+) (?:is my least favorite)/i,
    /i'm not a fan of ([^,.!?]+)/i,
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
  }

  // Extract profession or role
  const professionPatterns = [
    /i (?:am|work as)(?: an?| ) ([^,.!?]+(?: developer| engineer| designer| programmer| student| teacher| manager| professional))/i,
    /i'm(?: an?| ) ([^,.!?]+(?: developer| engineer| designer| programmer| student| teacher| manager| professional))/i,
    /my job is(?: an?| ) ([^,.!?]+(?: developer| engineer| designer| programmer| teacher| manager))/i,
    /my profession is ([^,.!?]+)/i,
    /i work as ([^,.!?]+)/i,
    /i am a ([^,.!?]+)/i,
    /i'm a ([^,.!?]+)/i,
    /im a ([^,.!?]+)/i,
    /i am working as ([^,.!?]+)/i,
    /i'm working as ([^,.!?]+)/i,
    /i work as ([^,.!?]+)/i,
    /i am(?: a| an) ([^,.!?]+)/i,
    /i'm(?: a| an) ([^,.!?]+)/i,
    /i work(?: as)? ([^,.!?]+)/i,
    /my role is ([^,.!?]+)/i,
  ];

  for (const pattern of professionPatterns) {
    const professionMatch = message.match(pattern);
    if (professionMatch && professionMatch[1]) {
      memory.profession = professionMatch[1].trim();
      infoExtracted = true;
      break;
    }
  }

  // Extract age information
  const agePatterns = [/i am (\d+)(?: years old)?/i, /i'm (\d+)(?: years old)?/i];

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
  }

  // Extract location information
  const locationPatterns = [/i (?:live|stay) in ([^,.!?]+)/i, /i am from ([^,.!?]+)/i, /i'm from ([^,.!?]+)/i];

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

    logDebug("User sentiment detected:", {
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

      logDebug(`Added topic interest for user ${userId}: ${detectedTopic}`);
    }
  }

  return detectedTopic;
}

// Export all user memory functions
module.exports = {
  userMemory,
  initUserMemory,
  generatePersonalizedResponse,
  extractAndRememberUserInfo,
  extractAndTrackTopicInterest,
};
