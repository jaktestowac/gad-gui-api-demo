// GadTalk Module Configuration
// Twitter/X-like microblogging application configuration

module.exports = {
  // Module identification
  moduleName: "gad-talk",
  moduleVersion: "1.0.0",

  // Authentication settings
  auth: {
    tokenCookieName: "gad-talk-token",
    sessionDuration: "24h",
    keepSignInDuration: "7d",
    passwordMinLength: 6,
    passwordMaxLength: 100,
    usernameMinLength: 3,
    usernameMaxLength: 15,
    usernamePattern: /^[a-zA-Z0-9_]+$/,
  },

  // User profile settings
  profile: {
    displayNameMaxLength: 50,
    bioMaxLength: 160,
    websiteMaxLength: 100,
    locationMaxLength: 30,
    avatarMaxSizeBytes: 2 * 1024 * 1024, // 2MB
    headerMaxSizeBytes: 5 * 1024 * 1024, // 5MB
  },

  // Gad (post) settings
  gads: {
    maxLength: 280,
    maxImageSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    editWindowMinutes: 15, // Can edit within 15 minutes of posting
  },

  // Notification settings
  notifications: {
    deliveryDelay: {
      minMs: 0,
      maxMs: 5000,
      enabled: false, // Set to true to simulate delayed notifications
    },
    aggregationWindowMs: 60000, // Aggregate notifications within 1 minute
    maxPerPage: 50,
  },

  // Trending settings
  trending: {
    recalculationIntervalMs: 60000, // 1 minute
    windowHours: 24, // Look-back period
    decayFactor: 0.95, // Score decay per hour
    minOccurrences: 3, // Minimum to trend
    maxTrendingItems: 10,
  },

  // Rate limiting settings (per 15-minute window)
  rateLimits: {
    auth: { limit: 10, windowMs: 15 * 60 * 1000 },
    postCreation: { limit: 30, windowMs: 15 * 60 * 1000 },
    likes: { limit: 100, windowMs: 15 * 60 * 1000 },
    follows: { limit: 50, windowMs: 15 * 60 * 1000 },
    search: { limit: 60, windowMs: 15 * 60 * 1000 },
    general: { limit: 300, windowMs: 15 * 60 * 1000 },
  },

  // Spam detection settings
  spam: {
    postsPerMinuteThreshold: 10,
    repeatedContentThreshold: 3,
    linksPerHourThreshold: 5,
    mentionsForShadowBanThreshold: 20,
  },

  // Pagination settings
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  // Timeline settings
  timeline: {
    mode: "hybrid", // "realtime", "cached", "hybrid"
    cacheTimeMs: 30000, // Cache for 30 seconds
  },

  // Chaos mode settings (for testing education)
  chaos: {
    enabled: false,
    features: {
      randomDelays: {
        enabled: false,
        minMs: 100,
        maxMs: 3000,
        probability: 0.3, // 30% of requests
      },
      intermittentFailures: {
        enabled: false,
        probability: 0.05, // 5% fail rate
        httpStatus: 503,
      },
      slowEndpoints: {
        enabled: false,
        endpoints: ["/api/gad-talk/search"],
        delayMs: 2000,
      },
      flakyWebSocket: {
        enabled: false,
        disconnectProbability: 0.1,
        reconnectDelayMs: 5000,
      },
    },
  },

  // Demo mode settings
  demo: {
    enabled: false,
    readOnly: true,
    demoUserEmail: "demo@gadtalk.local",
    demoUserPassword: "demo",
  },

  // Admin settings
  admin: {
    enabled: true,
    requireAuth: true,
    adminRoles: ["admin", "superadmin"],
  },

  // WebSocket settings
  websocket: {
    enabled: true,
    heartbeatIntervalMs: 30000,
    reconnectDelayMs: 5000,
    maxReconnectAttempts: 5,
  },

  // Logging settings
  logging: {
    level: "info", // trace, debug, info, warn, error
    includeTimestamps: true,
    includeRequestId: true,
  },
};
