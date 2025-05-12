const { detectSentiment } = require("./text-processing");

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
  if (!memory) return null;

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

  // Extract name (expanded to detect more name patterns)
  const namePatterns = [/my name is ([A-Za-z]+)/i, /i am ([A-Za-z]+)/i, /call me ([A-Za-z]+)/i, /i'm ([A-Za-z]+)/i];

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

// Export all user memory functions
module.exports = {
  userMemory,
  initUserMemory,
  generatePersonalizedResponse,
  extractAndRememberUserInfo,
};
