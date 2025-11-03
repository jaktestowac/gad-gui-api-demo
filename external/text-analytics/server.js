// Text Analytics Service
// Basic text analysis and metrics with sentiment analysis and keyword extraction
// Includes: word count, character count, reading time, sentiment, keywords, statistics

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3115;

// Middleware
app.use(express.json({ limit: "1mb" }));

// Serve static files (including our HTML page)
app.use(express.static(path.join(__dirname)));

// Service Configuration
const CONFIG = {
  serviceName: "TextAnalytics",
  version: "1.0.0",
  enableDiagnostics: false,
  maxTextLength: 50000,
  wordsPerMinute: 200, // Average reading speed
  minKeywordLength: 3,
  maxKeywords: 50,
  commonWords: [
    "the",
    "be",
    "to",
    "of",
    "and",
    "a",
    "in",
    "that",
    "have",
    "i",
    "it",
    "for",
    "not",
    "on",
    "with",
    "he",
    "as",
    "you",
    "do",
    "at",
    "this",
    "but",
    "his",
    "by",
    "from",
    "they",
    "we",
    "say",
    "her",
    "she",
    "or",
    "an",
    "will",
    "my",
    "one",
    "all",
    "would",
    "there",
    "their",
    "what",
    "so",
    "up",
    "out",
    "if",
    "about",
    "who",
    "get",
    "which",
    "go",
    "me",
    "when",
    "make",
    "can",
    "like",
    "time",
    "no",
    "just",
    "him",
    "know",
    "take",
    "people",
    "into",
    "year",
    "your",
    "good",
    "some",
    "could",
    "them",
    "see",
    "other",
    "than",
    "then",
    "now",
    "look",
    "only",
    "come",
    "its",
    "over",
    "think",
    "also",
    "back",
    "after",
    "use",
    "two",
    "how",
    "our",
    "work",
    "first",
    "well",
    "way",
    "even",
    "new",
    "want",
    "because",
    "any",
    "these",
    "give",
    "day",
    "most",
    "us",
    "is",
    "was",
    "are",
    "been",
    "has",
    "had",
    "were",
    "said",
    "each",
    "which",
    "their",
    "said",
    "she",
    "may",
    "use",
    "her",
    "than",
    "now",
    "way",
    "many",
    "such",
    "very",
    "much",
    "too",
    "any",
    "more",
    "here",
    "well",
    "should",
    "through",
    "long",
    "where",
    "much",
    "should",
    "through",
    "long",
    "where",
  ],
};

// Service State
const STATE = {
  startTime: new Date(),
  requestCount: 0,
  errorCount: 0,
  lastError: null,
  analyzedTexts: 0,
  totalWords: 0,
  totalCharacters: 0,
  analysisStats: {
    analyze: 0,
    sentiment: 0,
    keywords: 0,
    statistics: 0,
  },
};

// Request counter middleware
app.use((req, res, next) => {
  STATE.requestCount++;
  next();
});

// Error handler middleware
app.use((err, req, res, next) => {
  STATE.errorCount++;
  STATE.lastError = {
    message: err.message,
    timestamp: new Date(),
    path: req.path,
  };
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

/* ===== TEXT ANALYSIS FUNCTIONS ===== */

// Basic text statistics
function getBasicStats(text) {
  if (!text || typeof text !== "string") {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
    };
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;

  // Count words (split by whitespace and filter empty strings)
  const words = text.trim()
    ? text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0;

  // Count sentences (look for sentence endings)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;

  // Count paragraphs (split by double line breaks)
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

  // Count lines
  const lines = text.split(/\n/).length;

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
  };
}

// Reading time estimation
function estimateReadingTime(wordCount, wordsPerMinute = CONFIG.wordsPerMinute) {
  if (wordCount === 0) return { minutes: 0, seconds: 0, totalSeconds: 0 };

  const totalSeconds = Math.ceil((wordCount / wordsPerMinute) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    minutes,
    seconds,
    totalSeconds,
    wordsPerMinute,
  };
}

// Advanced text statistics
function getAdvancedStats(text) {
  if (!text || typeof text !== "string") {
    return {
      averageWordLength: 0,
      averageSentenceLength: 0,
      longestWord: "",
      shortestWord: "",
      uniqueWords: 0,
      wordFrequency: {},
    };
  }

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return {
      averageWordLength: 0,
      averageSentenceLength: 0,
      longestWord: "",
      shortestWord: "",
      uniqueWords: 0,
      wordFrequency: {},
    };
  }

  // Word lengths
  const wordLengths = words.map((word) => word.length);
  const averageWordLength = wordLengths.reduce((sum, len) => sum + len, 0) / wordLengths.length;

  // Longest and shortest words
  const longestWord = words.reduce((longest, word) => (word.length > longest.length ? word : longest), "");
  const shortestWord = words.reduce(
    (shortest, word) => (word.length < shortest.length ? word : shortest),
    words[0] || ""
  );

  // Sentence length
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const averageSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

  // Unique words and frequency
  const wordFrequency = {};
  words.forEach((word) => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });

  const uniqueWords = Object.keys(wordFrequency).length;

  return {
    averageWordLength: Math.round(averageWordLength * 100) / 100,
    averageSentenceLength: Math.round(averageSentenceLength * 100) / 100,
    longestWord,
    shortestWord,
    uniqueWords,
    wordFrequency,
  };
}

// Basic sentiment analysis (simple keyword-based approach)
function analyzeSentiment(text) {
  if (!text || typeof text !== "string") {
    return {
      score: 0,
      label: "neutral",
      confidence: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
    };
  }

  // Simple positive and negative word lists
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "awesome",
    "brilliant",
    "perfect",
    "outstanding",
    "superb",
    "magnificent",
    "marvelous",
    "terrific",
    "fabulous",
    "incredible",
    "remarkable",
    "exceptional",
    "splendid",
    "beautiful",
    "lovely",
    "nice",
    "pleasant",
    "delightful",
    "charming",
    "attractive",
    "gorgeous",
    "stunning",
    "elegant",
    "happy",
    "joy",
    "love",
    "like",
    "enjoy",
    "pleased",
    "satisfied",
    "content",
    "cheerful",
    "glad",
    "excited",
    "thrilled",
    "success",
    "successful",
    "win",
    "winner",
    "victory",
    "triumph",
    "achieve",
    "accomplish",
    "complete",
    "finish",
    "positive",
    "optimistic",
    "confident",
    "strong",
    "powerful",
    "effective",
    "efficient",
    "productive",
    "valuable",
    "helpful",
    "useful",
    "beneficial",
    "advantage",
    "improvement",
    "progress",
    "growth",
    "development",
    "innovation",
  ];

  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "disgusting",
    "pathetic",
    "useless",
    "worthless",
    "stupid",
    "ridiculous",
    "disappointing",
    "frustrating",
    "annoying",
    "irritating",
    "boring",
    "dull",
    "uninteresting",
    "monotonous",
    "tedious",
    "ugly",
    "hideous",
    "repulsive",
    "offensive",
    "unpleasant",
    "disturbing",
    "shocking",
    "appalling",
    "outrageous",
    "sad",
    "depressed",
    "unhappy",
    "miserable",
    "upset",
    "angry",
    "furious",
    "hate",
    "dislike",
    "despise",
    "loathe",
    "failure",
    "fail",
    "lose",
    "loss",
    "defeat",
    "disaster",
    "catastrophe",
    "crisis",
    "problem",
    "issue",
    "trouble",
    "negative",
    "pessimistic",
    "doubtful",
    "uncertain",
    "weak",
    "poor",
    "ineffective",
    "useless",
    "harmful",
    "dangerous",
    "difficult",
    "hard",
    "challenging",
    "impossible",
    "hopeless",
    "helpless",
    "confused",
    "lost",
    "broken",
    "damaged",
  ];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0);

  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((word) => {
    if (positiveWords.includes(word)) {
      positiveCount++;
    } else if (negativeWords.includes(word)) {
      negativeCount++;
    }
  });

  const totalSentimentWords = positiveCount + negativeCount;
  const totalWords = words.length;

  // Calculate scores
  const positive = totalWords > 0 ? (positiveCount / totalWords) * 100 : 0;
  const negative = totalWords > 0 ? (negativeCount / totalWords) * 100 : 0;
  const neutral = 100 - positive - negative;

  // Overall sentiment score (-1 to 1)
  let score = 0;
  let label = "neutral";
  let confidence = 0;

  if (totalSentimentWords > 0) {
    score = (positiveCount - negativeCount) / totalSentimentWords;
    confidence = Math.min((totalSentimentWords / totalWords) * 100, 100);

    if (score > 0.1) {
      label = "positive";
    } else if (score < -0.1) {
      label = "negative";
    } else {
      label = "neutral";
    }
  }

  return {
    score: Math.round(score * 1000) / 1000,
    label,
    confidence: Math.round(confidence * 100) / 100,
    positive: Math.round(positive * 100) / 100,
    negative: Math.round(negative * 100) / 100,
    neutral: Math.round(neutral * 100) / 100,
    details: {
      positiveWords: positiveCount,
      negativeWords: negativeCount,
      totalWords,
      sentimentWords: totalSentimentWords,
    },
  };
}

// Keyword extraction and frequency analysis
function extractKeywords(text, options = {}) {
  if (!text || typeof text !== "string") {
    return {
      keywords: [],
      frequency: {},
      totalUniqueWords: 0,
    };
  }

  const minLength = options.minLength || CONFIG.minKeywordLength;
  const maxKeywords = options.maxKeywords || CONFIG.maxKeywords;
  const excludeCommon = options.excludeCommon !== false;

  // Clean and tokenize text
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= minLength);

  // Filter out common words if requested
  const filteredWords = excludeCommon ? words.filter((word) => !CONFIG.commonWords.includes(word)) : words;

  // Count word frequency
  const frequency = {};
  filteredWords.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and get top keywords
  const keywords = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word, count]) => ({
      word,
      count,
      frequency: Math.round((count / filteredWords.length) * 10000) / 100,
    }));

  return {
    keywords,
    frequency,
    totalUniqueWords: Object.keys(frequency).length,
    totalWords: filteredWords.length,
    settings: {
      minLength,
      maxKeywords,
      excludeCommon,
    },
  };
}

// Update statistics
function updateAnalysisStats(endpoint, text) {
  STATE.analysisStats[endpoint] = (STATE.analysisStats[endpoint] || 0) + 1;

  if (text) {
    STATE.analyzedTexts++;
    const stats = getBasicStats(text);
    STATE.totalWords += stats.words;
    STATE.totalCharacters += stats.characters;
  }
}

/* ===== STANDARD ENDPOINTS ===== */

// PING endpoint - simple connectivity test
app.get("/api/ping", (req, res) => {
  res.json({
    message: "pong",
    timestamp: new Date().toISOString(),
    service: CONFIG.serviceName,
  });
});

// HEALTH endpoint - service health status
app.get("/api/health", (req, res) => {
  const uptime = Date.now() - STATE.startTime.getTime();
  const status = STATE.errorCount > 10 ? "degraded" : "ok";

  res.json({
    status,
    uptime: Math.floor(uptime / 1000), // seconds
    timestamp: new Date().toISOString(),
    service: CONFIG.serviceName,
    version: CONFIG.version,
  });
});

// STATUS endpoint - detailed service status
app.get("/api/status", (req, res) => {
  const uptime = Date.now() - STATE.startTime.getTime();

  res.json({
    service: CONFIG.serviceName,
    version: CONFIG.version,
    status: "running",
    uptime: {
      seconds: Math.floor(uptime / 1000),
      human: formatUptime(uptime),
    },
    metrics: {
      requestCount: STATE.requestCount,
      errorCount: STATE.errorCount,
      errorRate: STATE.requestCount > 0 ? ((STATE.errorCount / STATE.requestCount) * 100).toFixed(2) + "%" : "0%",
      analyzedTexts: STATE.analyzedTexts,
      totalWords: STATE.totalWords,
      totalCharacters: STATE.totalCharacters,
      analysisStats: STATE.analysisStats,
      averageWordsPerText: STATE.analyzedTexts > 0 ? Math.round(STATE.totalWords / STATE.analyzedTexts) : 0,
    },
    lastError: STATE.lastError,
    timestamp: new Date().toISOString(),
  });
});

// CAPABILITIES endpoint - service capabilities and limits
app.get("/api/capabilities", (req, res) => {
  const endpoints = listEndpoints(app);
  const endpointStrings = endpoints.map((ep) => `${ep.method} ${ep.path}`);

  res.json({
    service: CONFIG.serviceName,
    version: CONFIG.version,
    features: [
      "text-analysis",
      "word-counting",
      "reading-time-estimation",
      "sentiment-analysis",
      "keyword-extraction",
      "text-statistics",
      "frequency-analysis",
    ],
    capabilities: {
      basicStats: ["characters", "words", "sentences", "paragraphs", "lines"],
      advancedStats: ["average-word-length", "unique-words", "word-frequency"],
      sentiment: ["positive", "negative", "neutral", "confidence-scoring"],
      keywords: ["frequency-based", "common-word-filtering", "customizable-limits"],
    },
    limits: {
      maxTextLength: CONFIG.maxTextLength,
      maxKeywords: CONFIG.maxKeywords,
      minKeywordLength: CONFIG.minKeywordLength,
      wordsPerMinute: CONFIG.wordsPerMinute,
    },
    endpoints: endpointStrings,
    supportedFormats: ["json"],
    timestamp: new Date().toISOString(),
  });
});

// CONFIG endpoints - configuration management
app.get("/api/config", (req, res) => {
  res.json({
    config: CONFIG,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/config", (req, res) => {
  const updates = req.body || {};
  const allowedKeys = ["enableDiagnostics", "maxTextLength", "wordsPerMinute", "minKeywordLength", "maxKeywords"];
  const updated = [];
  const errors = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unknown config key: ${key}`);
      continue;
    }

    // Validate numeric values
    if (["maxTextLength", "wordsPerMinute", "minKeywordLength", "maxKeywords"].includes(key)) {
      if (typeof value !== "number" || value < 1) {
        errors.push(`${key} must be a positive number`);
        continue;
      }

      if (key === "maxTextLength" && value > 1000000) {
        errors.push("maxTextLength cannot exceed 1,000,000 characters");
        continue;
      }

      if (key === "wordsPerMinute" && (value < 50 || value > 1000)) {
        errors.push("wordsPerMinute must be between 50 and 1000");
        continue;
      }
    }

    // Update the config
    CONFIG[key] = value;
    updated.push(key);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Configuration validation failed",
      details: errors,
      updated,
    });
  }

  res.json({
    message: "Configuration updated successfully",
    updated,
    config: CONFIG,
    timestamp: new Date().toISOString(),
  });
});

// OPENAPI endpoint - API documentation
app.get("/api/openapi", (req, res) => {
  const endpoints = listEndpoints(app);

  const paths = endpoints.reduce((acc, ep) => {
    if (!acc[ep.path]) acc[ep.path] = [];
    if (!acc[ep.path].includes(ep.method)) acc[ep.path].push(ep.method);
    return acc;
  }, {});

  res.json({
    openapi: "3.0.0",
    info: {
      title: CONFIG.serviceName,
      version: CONFIG.version,
      description: "Text analysis service with sentiment analysis, keyword extraction, and statistics",
    },
    basePath: "/api",
    endpoints: endpoints,
    paths,
    timestamp: new Date().toISOString(),
  });
});

/* ===== TEXT ANALYTICS ENDPOINTS ===== */

// Comprehensive text analysis
app.post("/api/analyze", (req, res) => {
  try {
    const { text, options = {} } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error: "Missing or invalid 'text' field",
      });
    }

    if (text.length > CONFIG.maxTextLength) {
      return res.status(400).json({
        error: `Text too long. Maximum length is ${CONFIG.maxTextLength} characters`,
      });
    }

    const basicStats = getBasicStats(text);
    const advancedStats = getAdvancedStats(text);
    const readingTime = estimateReadingTime(basicStats.words, options.wordsPerMinute);
    const sentiment = analyzeSentiment(text);
    const keywords = extractKeywords(text, options);

    updateAnalysisStats("analyze", text);

    res.json({
      text: {
        length: text.length,
        preview: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      },
      basic: basicStats,
      advanced: advancedStats,
      readingTime,
      sentiment,
      keywords: {
        top10: keywords.keywords.slice(0, 10),
        total: keywords.totalUniqueWords,
      },
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// Sentiment analysis only
app.post("/api/sentiment", (req, res) => {
  try {
    const { text } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error: "Missing or invalid 'text' field",
      });
    }

    if (text.length > CONFIG.maxTextLength) {
      return res.status(400).json({
        error: `Text too long. Maximum length is ${CONFIG.maxTextLength} characters`,
      });
    }

    const sentiment = analyzeSentiment(text);

    updateAnalysisStats("sentiment", text);

    res.json({
      text: {
        length: text.length,
        preview: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      },
      sentiment,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// Keyword extraction only
app.post("/api/keywords", (req, res) => {
  try {
    const { text, options = {} } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error: "Missing or invalid 'text' field",
      });
    }

    if (text.length > CONFIG.maxTextLength) {
      return res.status(400).json({
        error: `Text too long. Maximum length is ${CONFIG.maxTextLength} characters`,
      });
    }

    const keywords = extractKeywords(text, options);

    updateAnalysisStats("keywords", text);

    res.json({
      text: {
        length: text.length,
        preview: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      },
      keywords,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// Text statistics only
app.post("/api/statistics", (req, res) => {
  try {
    const { text, options = {} } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error: "Missing or invalid 'text' field",
      });
    }

    if (text.length > CONFIG.maxTextLength) {
      return res.status(400).json({
        error: `Text too long. Maximum length is ${CONFIG.maxTextLength} characters`,
      });
    }

    const basicStats = getBasicStats(text);
    const advancedStats = getAdvancedStats(text);
    const readingTime = estimateReadingTime(basicStats.words, options.wordsPerMinute);

    updateAnalysisStats("statistics", text);

    res.json({
      text: {
        length: text.length,
        preview: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      },
      basic: basicStats,
      advanced: advancedStats,
      readingTime,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

/* ===== UTILITY FUNCTIONS ===== */

function formatUptime(uptimeMs) {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function listEndpoints(app) {
  const endpoints = [];

  if (!app || !app._router || !app._router.stack) return endpoints;

  app._router.stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods || {}).filter((m) => layer.route.methods[m]);

      methods.forEach((method) => {
        const upperMethod = method.toUpperCase();
        let description = "";
        let exampleBody = null;

        // Add descriptions for specific endpoints
        if (path === "/api/analyze" && method === "post") {
          description = "Comprehensive text analysis with all features";
          exampleBody = { text: "Your text here", options: {} };
        } else if (path === "/api/sentiment" && method === "post") {
          description = "Sentiment analysis only";
          exampleBody = { text: "Your text here" };
        } else if (path === "/api/keywords" && method === "post") {
          description = "Keyword extraction and frequency analysis";
          exampleBody = { text: "Your text here", options: { maxKeywords: 20 } };
        } else if (path === "/api/statistics" && method === "post") {
          description = "Text statistics and reading time";
          exampleBody = { text: "Your text here", options: { wordsPerMinute: 200 } };
        }

        endpoints.push({
          method: upperMethod,
          path,
          description,
          exampleBody,
        });
      });
    }
  });

  // Filter to only include /api/* endpoints
  return endpoints.filter((ep) => typeof ep.path === "string" && ep.path.startsWith("/api"));
}

/* ===== SERVER STARTUP ===== */

// Serve the HTML page as the default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 ${CONFIG.serviceName} v${CONFIG.version} running on port ${PORT}`);
  console.log(`📊 Visit http://localhost:${PORT}/api/status for service status`);
  console.log(`🏥 Visit http://localhost:${PORT}/api/health for health check`);
  console.log(`📖 Visit http://localhost:${PORT}/api/openapi for API documentation`);
  console.log(`🌐 Visit http://localhost:${PORT}/ for HTML interface`);
  console.log("");

  // Dynamically list all available endpoints
  const endpoints = listEndpoints(app);
  const standardEndpoints = endpoints.filter((ep) =>
    ["/api/ping", "/api/health", "/api/status", "/api/capabilities", "/api/config", "/api/openapi"].includes(ep.path)
  );
  const customEndpoints = endpoints.filter(
    (ep) =>
      !["/api/ping", "/api/health", "/api/status", "/api/capabilities", "/api/config", "/api/openapi"].includes(ep.path)
  );

  if (standardEndpoints.length > 0) {
    console.log("Standard endpoints:");
    standardEndpoints.forEach((ep) => {
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(20)} - ${ep.description || "Standard endpoint"}`);
    });
    console.log("");
  }

  if (customEndpoints.length > 0) {
    console.log("Text analytics endpoints:");
    customEndpoints.forEach((ep) => {
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(20)} - ${ep.description || "Text analytics endpoint"}`);
    });
    console.log("");
  }

  console.log("Analysis capabilities:");
  console.log("  - Basic stats: characters, words, sentences, paragraphs");
  console.log("  - Advanced stats: word length, frequency, unique words");
  console.log("  - Reading time: estimated based on WPM");
  console.log("  - Sentiment: positive/negative/neutral scoring");
  console.log("  - Keywords: frequency-based extraction with filtering");
  console.log("");

  console.log("🎯 Ready to analyze text!");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  process.exit(0);
});
