// Password Generator Service
// Generate secure passwords with customizable rules and patterns
// Features: Multiple password types, strength scoring, batch generation, pattern-based generation

const express = require("express");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3118;

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

// Service Configuration
const CONFIG = {
  serviceName: "PasswordGeneratorService",
  version: "1.0.0",
  enableDiagnostics: false,
  defaultLength: 12,
  maxLength: 128,
  minLength: 4,
  maxBatchSize: 100,
  strengthThresholds: {
    weak: 30,
    fair: 50,
    good: 70,
    strong: 90,
  },
};

// Service State
const STATE = {
  startTime: new Date(),
  requestCount: 0,
  errorCount: 0,
  lastError: null,
  generatedPasswords: 0,
  batchJobs: new Map(),
  typeStats: {
    secure: 0,
    memorable: 0,
    pin: 0,
    passphrase: 0,
    pattern: 0,
    custom: 0,
  },
};

// JSON Database setup
const DB_FILE = path.join(__dirname, "passwords-db-tmp.json");

let passwordsDB = {
  generated: [],
  patterns: {},
  wordLists: {},
  statistics: {
    totalGenerated: 0,
    typeDistribution: {},
    strengthDistribution: {},
  },
};

// Load database
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      passwordsDB = JSON.parse(data);

      // Update state from database
      STATE.generatedPasswords = passwordsDB.statistics.totalGenerated || 0;

      console.log(`📊 Loaded password database with ${STATE.generatedPasswords} generated passwords`);
    } else {
      // Initialize with default word lists and patterns
      initializeDefaultData();
      saveDatabase();
      console.log("📊 Initialized new password database");
    }
  } catch (error) {
    console.error("Failed to load database:", error.message);
    initializeDefaultData();
  }
}

// Save database
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(passwordsDB, null, 2));
  } catch (error) {
    console.error("Failed to save database:", error.message);
  }
}

// Initialize default data
function initializeDefaultData() {
  passwordsDB = {
    generated: [],
    patterns: {
      "word-number-symbol": { pattern: "Wn#", description: "Word + Number + Symbol" },
      "word-word-number": { pattern: "WwN", description: "Word + Word + Number" },
      "caps-lower-number-symbol": { pattern: "Ln#", description: "Caps + Lower + Number + Symbol" },
      "alternating-case": { pattern: "AlTeRnAtInG", description: "Alternating case letters" },
    },
    wordLists: {
      common: [
        "apple",
        "beach",
        "chair",
        "dance",
        "eagle",
        "flame",
        "grape",
        "house",
        "ice",
        "jungle",
        "kite",
        "lemon",
        "mouse",
        "night",
        "ocean",
        "piano",
        "quiet",
        "river",
        "stone",
        "tree",
        "umbrella",
        "voice",
        "water",
        "yellow",
        "zebra",
        "bright",
        "cloud",
        "dream",
        "earth",
        "forest",
        "green",
        "happy",
        "island",
        "jewel",
        "knight",
        "light",
        "magic",
        "nature",
        "orange",
        "peace",
        "quick",
        "rainbow",
        "silver",
        "thunder",
        "unique",
        "valley",
        "winter",
        "crystal",
        "garden",
        "horizon",
      ],
      animals: [
        "cat",
        "dog",
        "lion",
        "tiger",
        "bear",
        "wolf",
        "fox",
        "deer",
        "rabbit",
        "horse",
        "bird",
        "fish",
        "shark",
        "whale",
        "dolphin",
        "turtle",
        "frog",
        "snake",
        "spider",
        "bee",
        "butterfly",
        "dragonfly",
        "owl",
        "eagle",
        "hawk",
        "penguin",
        "seal",
        "otter",
        "beaver",
        "squirrel",
      ],
      colors: [
        "red",
        "blue",
        "green",
        "yellow",
        "orange",
        "purple",
        "pink",
        "brown",
        "black",
        "white",
        "gray",
        "silver",
        "gold",
        "crimson",
        "azure",
        "emerald",
        "amber",
        "violet",
        "coral",
        "teal",
      ],
    },
    statistics: {
      totalGenerated: 0,
      typeDistribution: {},
      strengthDistribution: {},
    },
  };
}

// Load database on startup
loadDatabase();

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

/* ===== PASSWORD GENERATION LOGIC ===== */

class PasswordGenerator {
  static characterSets = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    safe_symbols: "!@#$%^&*+-=",
    brackets: "()[]{}",
    punctuation: ";:,.<>?",
    similar: "il1Lo0O", // Characters to avoid for readability
  };

  static generateSecure(options = {}) {
    const {
      length = CONFIG.defaultLength,
      includeLowercase = true,
      includeUppercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = false,
      customCharset = "",
    } = options;

    let charset = customCharset;

    if (!customCharset || customCharset === "") {
      charset = "";
      if (includeLowercase) charset += this.characterSets.lowercase;
      if (includeUppercase) charset += this.characterSets.uppercase;
      if (includeNumbers) charset += this.characterSets.numbers;
      if (includeSymbols) charset += this.characterSets.safe_symbols;

      // If no character sets are selected, default to a basic secure set
      if (charset.length === 0) {
        charset = this.characterSets.lowercase + this.characterSets.uppercase + this.characterSets.numbers;
      }
    } else {
      // Custom charset provided - validate it's not just whitespace
      if (customCharset.trim().length === 0) {
        throw new Error("Custom character set cannot be empty");
      }
    }

    if (excludeSimilar) {
      for (const char of this.characterSets.similar) {
        charset = charset.replace(new RegExp(char, "g"), "");
      }
    }

    if (charset.length === 0) {
      throw new Error("No valid characters available for password generation after applying filters");
    }

    // Generate password ensuring at least one character from each required set
    let password = "";
    const requiredSets = [];

    if (includeLowercase && !customCharset) requiredSets.push(this.characterSets.lowercase);
    if (includeUppercase && !customCharset) requiredSets.push(this.characterSets.uppercase);
    if (includeNumbers && !customCharset) requiredSets.push(this.characterSets.numbers);
    if (includeSymbols && !customCharset) requiredSets.push(this.characterSets.safe_symbols);

    // Add one character from each required set
    for (const set of requiredSets) {
      if (password.length < length) {
        const randomIndex = crypto.randomInt(0, set.length);
        password += set[randomIndex];
      }
    }

    // Fill the rest randomly from the full charset
    while (password.length < length) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    // Shuffle the password to avoid predictable patterns
    return this.shuffleString(password);
  }

  static generateMemorable(options = {}) {
    const { wordCount = 3, separator = "-", includeNumbers = true, capitalize = true, wordList = "common" } = options;

    const words = passwordsDB.wordLists[wordList] || passwordsDB.wordLists.common;
    if (!words || words.length === 0) {
      throw new Error(`Word list '${wordList}' not found or empty`);
    }

    let password = "";
    const selectedWords = [];

    // Select random words
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = crypto.randomInt(0, words.length);
      let word = words[randomIndex];

      if (capitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }

      selectedWords.push(word);
    }

    password = selectedWords.join(separator);

    // Add numbers if requested
    if (includeNumbers) {
      const number = crypto.randomInt(10, 999);
      password += separator + number;
    }

    return password;
  }

  static generatePIN(options = {}) {
    const { length = 4, excludeSequential = true, excludeRepeating = true } = options;

    if (length < 3 || length > 20) {
      throw new Error("PIN length must be between 3 and 20 digits");
    }

    let pin = "";
    let attempts = 0;
    const maxAttempts = 100;

    do {
      pin = "";
      for (let i = 0; i < length; i++) {
        pin += crypto.randomInt(0, 10).toString();
      }
      attempts++;
    } while (
      attempts < maxAttempts &&
      ((excludeSequential && this.hasSequentialDigits(pin)) || (excludeRepeating && this.hasRepeatingDigits(pin)))
    );

    return pin;
  }

  static generatePassphrase(options = {}) {
    const {
      wordCount = 5,
      minWordLength = 4,
      maxWordLength = 8,
      separator = " ",
      includeNumbers = false,
      wordList = "common",
    } = options;

    const words = passwordsDB.wordLists[wordList] || passwordsDB.wordLists.common;
    if (!words || words.length === 0) {
      throw new Error(`Word list '${wordList}' not found or empty`);
    }

    // Filter words by length
    const filteredWords = words.filter((word) => word.length >= minWordLength && word.length <= maxWordLength);

    if (filteredWords.length === 0) {
      throw new Error("No words match the specified length criteria");
    }

    const selectedWords = [];

    for (let i = 0; i < wordCount; i++) {
      const randomIndex = crypto.randomInt(0, filteredWords.length);
      selectedWords.push(filteredWords[randomIndex]);
    }

    let passphrase = selectedWords.join(separator);

    if (includeNumbers) {
      const number = crypto.randomInt(100, 9999);
      passphrase += separator + number;
    }

    return passphrase;
  }

  static generateFromPattern(pattern, options = {}) {
    const { customWords = [], customNumbers = [] } = options;
    let result = "";

    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];

      switch (char.toLowerCase()) {
        case "l": // lowercase letter
          result += this.getRandomChar(this.characterSets.lowercase);
          break;
        case "u": // uppercase letter
          result += this.getRandomChar(this.characterSets.uppercase);
          break;
        case "n": // number
          if (customNumbers.length > 0) {
            result += customNumbers[crypto.randomInt(0, customNumbers.length)];
          } else {
            result += this.getRandomChar(this.characterSets.numbers);
          }
          break;
        case "#": // symbol
          result += this.getRandomChar(this.characterSets.safe_symbols);
          break;
        case "w": // word (lowercase)
          if (customWords.length > 0) {
            result += customWords[crypto.randomInt(0, customWords.length)].toLowerCase();
          } else {
            const words = passwordsDB.wordLists.common;
            result += words[crypto.randomInt(0, words.length)];
          }
          break;
        case "W": // word (capitalized)
          let word;
          if (customWords.length > 0) {
            word = customWords[crypto.randomInt(0, customWords.length)];
          } else {
            const words = passwordsDB.wordLists.common;
            word = words[crypto.randomInt(0, words.length)];
          }
          result += word.charAt(0).toUpperCase() + word.slice(1);
          break;
        case "a": // any letter
          result += this.getRandomChar(this.characterSets.lowercase + this.characterSets.uppercase);
          break;
        case "x": // any character
          result += this.getRandomChar(
            this.characterSets.lowercase +
              this.characterSets.uppercase +
              this.characterSets.numbers +
              this.characterSets.safe_symbols
          );
          break;
        default:
          // Literal character
          result += char;
          break;
      }
    }

    return result;
  }

  static calculateStrength(password) {
    let score = 0;
    const checks = {
      length: false,
      lowercase: false,
      uppercase: false,
      numbers: false,
      symbols: false,
      noSequential: false,
      noRepeating: false,
      noCommon: false,
    };

    // Length scoring
    if (password.length >= 8) {
      score += 25;
      checks.length = true;
    } else if (password.length >= 6) {
      score += 15;
    } else if (password.length >= 4) {
      score += 5;
    }

    // Character variety
    if (/[a-z]/.test(password)) {
      score += 5;
      checks.lowercase = true;
    }
    if (/[A-Z]/.test(password)) {
      score += 5;
      checks.uppercase = true;
    }
    if (/[0-9]/.test(password)) {
      score += 5;
      checks.numbers = true;
    }
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      score += 10;
      checks.symbols = true;
    }

    // Additional length bonuses
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 15;
    if (password.length >= 20) score += 20;

    // Penalty for sequential characters
    if (!this.hasSequentialChars(password)) {
      score += 10;
      checks.noSequential = true;
    } else {
      score -= 10;
    }

    // Penalty for repeating characters
    if (!this.hasRepeatingChars(password)) {
      score += 5;
      checks.noRepeating = true;
    } else {
      score -= 5;
    }

    // Penalty for common patterns
    if (!this.hasCommonPatterns(password)) {
      score += 10;
      checks.noCommon = true;
    } else {
      score -= 15;
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine strength label
    let label = "weak";
    if (score >= CONFIG.strengthThresholds.strong) label = "strong";
    else if (score >= CONFIG.strengthThresholds.good) label = "good";
    else if (score >= CONFIG.strengthThresholds.fair) label = "fair";

    return {
      score,
      label,
      checks,
      entropy: this.calculateEntropy(password),
      crackTime: this.estimateCrackTime(password),
    };
  }

  // Utility methods
  static shuffleString(str) {
    const arr = str.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
  }

  static getRandomChar(charset) {
    return charset[crypto.randomInt(0, charset.length)];
  }

  static hasSequentialDigits(str) {
    for (let i = 0; i < str.length - 2; i++) {
      const a = parseInt(str[i]);
      const b = parseInt(str[i + 1]);
      const c = parseInt(str[i + 2]);
      if (!isNaN(a) && !isNaN(b) && !isNaN(c)) {
        if ((b === a + 1 && c === b + 1) || (b === a - 1 && c === b - 1)) {
          return true;
        }
      }
    }
    return false;
  }

  static hasRepeatingDigits(str) {
    for (let i = 0; i < str.length - 2; i++) {
      if (str[i] === str[i + 1] && str[i + 1] === str[i + 2]) {
        return true;
      }
    }
    return false;
  }

  static hasSequentialChars(password) {
    const sequences = [
      "abc",
      "bcd",
      "cde",
      "def",
      "efg",
      "fgh",
      "ghi",
      "hij",
      "ijk",
      "jkl",
      "klm",
      "lmn",
      "mno",
      "nop",
      "opq",
      "pqr",
      "qrs",
      "rst",
      "stu",
      "tuv",
      "uvw",
      "vwx",
      "wxy",
      "xyz",
      "123",
      "234",
      "345",
      "456",
      "567",
      "678",
      "789",
    ];
    const lowerPassword = password.toLowerCase();
    return sequences.some(
      (seq) => lowerPassword.includes(seq) || lowerPassword.includes(seq.split("").reverse().join(""))
    );
  }

  static hasRepeatingChars(password) {
    return /(.)\1{2,}/.test(password);
  }

  static hasCommonPatterns(password) {
    const commonPatterns = [
      /password/i,
      /123456/,
      /qwerty/i,
      /admin/i,
      /login/i,
      /welcome/i,
      /abc123/i,
      /letmein/i,
      /monkey/i,
      /dragon/i,
    ];
    return commonPatterns.some((pattern) => pattern.test(password));
  }

  static calculateEntropy(password) {
    const charset = new Set(password).size;
    const length = password.length;
    return Math.log2(Math.pow(charset, length));
  }

  static estimateCrackTime(password) {
    const charset = this.getCharsetSize(password);
    const length = password.length;
    const combinations = Math.pow(charset, length);
    const guessesPerSecond = 1000000000; // 1 billion guesses per second
    const secondsToCrack = combinations / (2 * guessesPerSecond);

    if (secondsToCrack < 60) return "< 1 minute";
    if (secondsToCrack < 3600) return `${Math.ceil(secondsToCrack / 60)} minutes`;
    if (secondsToCrack < 86400) return `${Math.ceil(secondsToCrack / 3600)} hours`;
    if (secondsToCrack < 31536000) return `${Math.ceil(secondsToCrack / 86400)} days`;
    if (secondsToCrack < 31536000000) return `${Math.ceil(secondsToCrack / 31536000)} years`;
    return "centuries";
  }

  static getCharsetSize(password) {
    let size = 0;
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/[0-9]/.test(password)) size += 10;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) size += 32;
    return size || 1;
  }
}

// Update statistics
function updateStats(type, strength) {
  STATE.generatedPasswords++;
  STATE.typeStats[type] = (STATE.typeStats[type] || 0) + 1;

  passwordsDB.statistics.totalGenerated++;
  passwordsDB.statistics.typeDistribution[type] = (passwordsDB.statistics.typeDistribution[type] || 0) + 1;
  passwordsDB.statistics.strengthDistribution[strength] =
    (passwordsDB.statistics.strengthDistribution[strength] || 0) + 1;

  saveDatabase();
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
      generatedPasswords: STATE.generatedPasswords,
      activeBatchJobs: STATE.batchJobs.size,
      typeStats: STATE.typeStats,
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
      "secure-password-generation",
      "memorable-passwords",
      "pin-generation",
      "passphrase-generation",
      "pattern-based-generation",
      "strength-analysis",
      "batch-generation",
      "custom-character-sets",
    ],
    passwordTypes: ["secure", "memorable", "pin", "passphrase", "pattern"],
    limits: {
      maxLength: CONFIG.maxLength,
      minLength: CONFIG.minLength,
      maxBatchSize: CONFIG.maxBatchSize,
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
  const allowedKeys = ["enableDiagnostics", "defaultLength", "maxBatchSize"];
  const updated = [];
  const errors = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unknown config key: ${key}`);
      continue;
    }

    // Validate specific configs
    if (key === "defaultLength" && (value < CONFIG.minLength || value > CONFIG.maxLength)) {
      errors.push(`defaultLength must be between ${CONFIG.minLength} and ${CONFIG.maxLength}`);
      continue;
    }

    if (key === "maxBatchSize" && (value < 1 || value > 1000)) {
      errors.push("maxBatchSize must be between 1 and 1000");
      continue;
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
      description: "Password Generator Service with multiple types, strength analysis, and customizable rules",
    },
    basePath: "/api",
    endpoints: endpoints,
    paths,
    timestamp: new Date().toISOString(),
  });
});

/* ===== PASSWORD GENERATOR ENDPOINTS ===== */

// GENERATE endpoint - Generate single password
app.post("/api/generate", (req, res) => {
  try {
    const { type = "secure", options = {} } = req.body || {};

    // Validate options for secure type
    if (type.toLowerCase() === "secure") {
      const {
        includeLowercase = true,
        includeUppercase = true,
        includeNumbers = true,
        includeSymbols = true,
        customCharset = "",
        length = CONFIG.defaultLength,
      } = options;

      // Check if length is valid
      if (length < CONFIG.minLength || length > CONFIG.maxLength) {
        return res.status(400).json({
          error: `Password length must be between ${CONFIG.minLength} and ${CONFIG.maxLength}`,
          provided: length,
        });
      }

      // Check if custom charset is provided but empty (only validate if it's a non-empty string that becomes empty after trimming)
      if (customCharset && customCharset !== "" && customCharset.trim().length === 0) {
        return res.status(400).json({
          error: "Custom character set cannot be empty",
          suggestion: "Either provide characters in customCharset or leave it empty to use checkboxes",
        });
      }

      // Check if at least one character set is selected or custom charset is provided
      if (
        (!customCharset || customCharset === "") &&
        !includeLowercase &&
        !includeUppercase &&
        !includeNumbers &&
        !includeSymbols
      ) {
        return res.status(400).json({
          error: "At least one character set must be selected or provide a custom character set",
          example: {
            type: "secure",
            options: {
              includeLowercase: true,
              includeUppercase: true,
              includeNumbers: true,
            },
          },
        });
      }
    }

    let password;
    let analysis;

    switch (type.toLowerCase()) {
      case "secure":
        password = PasswordGenerator.generateSecure(options);
        break;
      case "memorable":
        password = PasswordGenerator.generateMemorable(options);
        break;
      case "pin":
        password = PasswordGenerator.generatePIN(options);
        break;
      case "passphrase":
        password = PasswordGenerator.generatePassphrase(options);
        break;
      case "pattern":
        if (!options.pattern) {
          return res.status(400).json({
            error: "Pattern is required for pattern-based generation",
            example: { type: "pattern", options: { pattern: "Wn#" } },
          });
        }
        password = PasswordGenerator.generateFromPattern(options.pattern, options);
        break;
      default:
        return res.status(400).json({
          error: "Invalid password type",
          supportedTypes: ["secure", "memorable", "pin", "passphrase", "pattern"],
        });
    }

    // Analyze password strength
    analysis = PasswordGenerator.calculateStrength(password);

    // Update statistics
    updateStats(type, analysis.label);

    // Store in database (keep only last 100 entries)
    passwordsDB.generated.push({
      id: crypto.randomUUID(),
      type,
      length: password.length,
      strength: analysis.label,
      score: analysis.score,
      createdAt: new Date().toISOString(),
      options: options,
    });

    if (passwordsDB.generated.length > 100) {
      passwordsDB.generated.shift();
    }

    res.json({
      password,
      type,
      length: password.length,
      strength: analysis,
      options: options,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Password generation error:", error);

    // Provide user-friendly error messages
    let errorMessage = error.message;
    let suggestions = [];

    if (error.message.includes("No valid characters available")) {
      errorMessage = "Cannot generate password with the current settings";
      suggestions = [
        "Enable at least one character set (lowercase, uppercase, numbers, or symbols)",
        "Provide a custom character set",
        "Disable 'exclude similar characters' if using a small character set",
      ];
    }

    res.status(400).json({
      error: errorMessage,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      originalError: error.message,
    });
  }
});

// BATCH endpoint - Generate multiple passwords
app.post("/api/batch", (req, res) => {
  try {
    const { count = 5, type = "secure", options = {} } = req.body || {};

    if (typeof count !== "number" || count < 1 || count > CONFIG.maxBatchSize) {
      return res.status(400).json({
        error: `Count must be between 1 and ${CONFIG.maxBatchSize}`,
      });
    }

    // Validate options for secure type (same as single generation)
    if (type.toLowerCase() === "secure") {
      const {
        includeLowercase = true,
        includeUppercase = true,
        includeNumbers = true,
        includeSymbols = true,
        customCharset = "",
        length = CONFIG.defaultLength,
      } = options;

      if (length < CONFIG.minLength || length > CONFIG.maxLength) {
        return res.status(400).json({
          error: `Password length must be between ${CONFIG.minLength} and ${CONFIG.maxLength}`,
          provided: length,
        });
      }

      if (customCharset && customCharset !== "" && customCharset.trim().length === 0) {
        return res.status(400).json({
          error: "Custom character set cannot be empty",
          suggestion: "Either provide characters in customCharset or leave it empty to use checkboxes",
        });
      }

      if (
        (!customCharset || customCharset === "") &&
        !includeLowercase &&
        !includeUppercase &&
        !includeNumbers &&
        !includeSymbols
      ) {
        return res.status(400).json({
          error: "At least one character set must be selected or provide a custom character set",
          example: {
            type: "secure",
            options: {
              includeLowercase: true,
              includeUppercase: true,
              includeNumbers: true,
            },
          },
        });
      }
    }

    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      status: "processing",
      count,
      completed: 0,
      results: [],
      errors: [],
      startTime: new Date(),
      type,
      options,
    };

    STATE.batchJobs.set(jobId, job);

    // Generate passwords
    for (let i = 0; i < count; i++) {
      try {
        let password;

        switch (type.toLowerCase()) {
          case "secure":
            password = PasswordGenerator.generateSecure(options);
            break;
          case "memorable":
            password = PasswordGenerator.generateMemorable(options);
            break;
          case "pin":
            password = PasswordGenerator.generatePIN(options);
            break;
          case "passphrase":
            password = PasswordGenerator.generatePassphrase(options);
            break;
          case "pattern":
            if (!options.pattern) {
              throw new Error("Pattern is required for pattern-based generation");
            }
            password = PasswordGenerator.generateFromPattern(options.pattern, options);
            break;
          default:
            throw new Error(`Invalid password type: ${type}`);
        }

        const analysis = PasswordGenerator.calculateStrength(password);

        job.results.push({
          index: i,
          password,
          length: password.length,
          strength: analysis,
        });

        job.completed++;
        updateStats(type, analysis.label);
      } catch (error) {
        let errorMessage = error.message;
        if (error.message.includes("No valid characters available")) {
          errorMessage = "Cannot generate password with current settings - check character set options";
        }

        job.errors.push({
          index: i,
          error: errorMessage,
          originalError: error.message,
        });
      }
    }

    job.status = "completed";
    job.endTime = new Date();
    job.duration = job.endTime - job.startTime;

    res.json({
      jobId,
      status: job.status,
      summary: {
        total: job.count,
        completed: job.completed,
        errors: job.errors.length,
        duration: job.duration + "ms",
      },
      results: job.results,
      errors: job.errors,
      completedAt: job.endTime.toISOString(),
    });
  } catch (error) {
    console.error("Batch generation error:", error);
    res.status(500).json({
      error: "Batch generation failed",
      details: error.message,
    });
  }
});

// STRENGTH endpoint - Analyze password strength
app.post("/api/strength", (req, res) => {
  try {
    const { password } = req.body || {};

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        error: "Missing or invalid 'password' field",
      });
    }

    const analysis = PasswordGenerator.calculateStrength(password);

    res.json({
      password: password.replace(/./g, "*"), // Mask the password
      length: password.length,
      strength: analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// PATTERNS endpoint - Get available patterns and create custom ones
app.get("/api/patterns", (req, res) => {
  res.json({
    predefined: passwordsDB.patterns,
    patternGuide: {
      l: "lowercase letter",
      u: "uppercase letter",
      L: "uppercase letter (alias)",
      n: "number",
      N: "number (alias)",
      "#": "symbol",
      w: "word (lowercase)",
      W: "word (capitalized)",
      a: "any letter",
      x: "any character",
      literal: "Any other character is used literally",
    },
    examples: {
      Lllnnn: "One uppercase, two lowercase, three numbers",
      "Wn#W": "Word + number + symbol + Word",
      "lun#lun": "lowercase, uppercase, number, symbol pattern",
      "W-W-nn": "Two words separated by dashes with numbers",
    },
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/patterns", (req, res) => {
  try {
    const { name, pattern, description } = req.body || {};

    if (!name || !pattern) {
      return res.status(400).json({
        error: "Missing required fields: name, pattern",
        example: { name: "my-pattern", pattern: "Wn#", description: "Word + Number + Symbol" },
      });
    }

    if (passwordsDB.patterns[name]) {
      return res.status(409).json({
        error: "Pattern name already exists",
        name,
      });
    }

    // Test the pattern by generating a sample
    try {
      const sample = PasswordGenerator.generateFromPattern(pattern);

      passwordsDB.patterns[name] = {
        pattern,
        description: description || `Custom pattern: ${pattern}`,
        sample,
        createdAt: new Date().toISOString(),
      };

      saveDatabase();

      res.status(201).json({
        message: "Pattern created successfully",
        name,
        pattern: passwordsDB.patterns[name],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(400).json({
        error: "Invalid pattern",
        details: error.message,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// WORDLISTS endpoint - Manage word lists
app.get("/api/wordlists", (req, res) => {
  const lists = {};
  for (const [name, words] of Object.entries(passwordsDB.wordLists)) {
    lists[name] = {
      count: words.length,
      sample: words.slice(0, 5),
    };
  }

  res.json({
    wordlists: lists,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/wordlists", (req, res) => {
  try {
    const { name, words } = req.body || {};

    if (!name || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        error: "Missing or invalid fields: name (string), words (array)",
        example: { name: "my-words", words: ["apple", "banana", "cherry"] },
      });
    }

    // Validate words (should be strings, reasonable length)
    const validWords = words.filter((word) => typeof word === "string" && word.length > 0 && word.length <= 20);

    if (validWords.length === 0) {
      return res.status(400).json({
        error: "No valid words provided",
      });
    }

    passwordsDB.wordLists[name] = validWords;
    saveDatabase();

    res.status(201).json({
      message: "Word list created successfully",
      name,
      count: validWords.length,
      sample: validWords.slice(0, 5),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// STATISTICS endpoint - Get generation statistics
app.get("/api/statistics", (req, res) => {
  res.json({
    total: passwordsDB.statistics.totalGenerated,
    session: STATE.generatedPasswords,
    distribution: {
      byType: passwordsDB.statistics.typeDistribution,
      byStrength: passwordsDB.statistics.strengthDistribution,
      sessionByType: STATE.typeStats,
    },
    recentGenerated: passwordsDB.generated.slice(-10),
    timestamp: new Date().toISOString(),
  });
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
        if (path === "/api/generate" && method === "post") {
          description = "Generate single password";
          exampleBody = { type: "secure", options: { length: 12 } };
        } else if (path === "/api/batch" && method === "post") {
          description = "Generate multiple passwords";
          exampleBody = { count: 5, type: "secure" };
        } else if (path === "/api/strength" && method === "post") {
          description = "Analyze password strength";
          exampleBody = { password: "MyPassword123!" };
        } else if (path === "/api/patterns" && method === "get") {
          description = "Get available patterns";
        } else if (path === "/api/patterns" && method === "post") {
          description = "Create custom pattern";
        } else if (path === "/api/wordlists" && method === "get") {
          description = "Get word lists";
        } else if (path === "/api/statistics" && method === "get") {
          description = "Get generation statistics";
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

// Cleanup old batch jobs periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [jobId, job] of STATE.batchJobs.entries()) {
    if (now - job.startTime.getTime() > maxAge) {
      STATE.batchJobs.delete(jobId);
    }
  }
}, 60 * 60 * 1000); // Check hourly

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
  console.log(`🔐 Visit http://localhost:${PORT}/ for HTML interface`);
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
    console.log("Password generator endpoints:");
    customEndpoints.forEach((ep) => {
      console.log(
        `  - ${ep.method.padEnd(4)} ${ep.path.padEnd(20)} - ${ep.description || "Password service endpoint"}`
      );
    });
    console.log("");
  }

  console.log("Password types:");
  console.log("  - Secure: Strong random passwords with custom rules");
  console.log("  - Memorable: Easy-to-remember word-based passwords");
  console.log("  - PIN: Numeric passwords with optional rules");
  console.log("  - Passphrase: Multi-word phrases for high security");
  console.log("  - Pattern: Custom pattern-based generation");
  console.log("");

  console.log("🔐 Features: Strength analysis, batch generation, custom patterns");
  console.log("💾 Database: JSON file for patterns, word lists, and statistics");
  console.log("🎯 Ready to generate secure passwords!");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  saveDatabase();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  saveDatabase();
  process.exit(0);
});
