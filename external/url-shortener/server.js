// URL Shortener Service
// Create short URLs with analytics, custom aliases, expiration dates, and QR code generation
// Features: Click tracking, bulk shortening, link preview, metadata extraction

const express = require("express");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const { URL } = require("url");
const app = express();
const PORT = process.env.PORT || 3117;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname)));

// Service Configuration
const CONFIG = {
  serviceName: "URLShortenerService",
  version: "1.0.0",
  enableDiagnostics: false,
  defaultShortLength: 6,
  maxCustomAliasLength: 50,
  maxBulkUrls: 100,
  baseUrl: process.env.BASE_URL || `http://localhost:${PORT}`,
  defaultExpirationDays: 365,
  maxExpirationDays: 3650, // 10 years
};

// Service State
const STATE = {
  startTime: new Date(),
  requestCount: 0,
  errorCount: 0,
  lastError: null,
  totalUrls: 0,
  totalClicks: 0,
  bulkJobs: new Map(),
};

// JSON Database setup
const DB_FILE = path.join(__dirname, "urls-tmp.json");
const ANALYTICS_FILE = path.join(__dirname, "analytics-tmp.json");

let urlsDB = {
  urls: {},
  aliases: {},
  metadata: {},
};

let analyticsDB = {
  clicks: {},
  daily: {},
  referrers: {},
  countries: {},
  userAgents: {},
};

// Load database
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      urlsDB = JSON.parse(data);
    }
    if (fs.existsSync(ANALYTICS_FILE)) {
      const data = fs.readFileSync(ANALYTICS_FILE, "utf8");
      analyticsDB = JSON.parse(data);
    }

    // Update state counters
    STATE.totalUrls = Object.keys(urlsDB.urls || {}).length;
    STATE.totalClicks = Object.values(analyticsDB.clicks || {}).reduce((sum, clicks) => sum + clicks.length, 0);

    console.log(`📊 Loaded ${STATE.totalUrls} URLs and ${STATE.totalClicks} clicks from database`);
  } catch (error) {
    console.error("Failed to load database:", error.message);
    // Initialize empty database
    urlsDB = { urls: {}, aliases: {}, metadata: {} };
    analyticsDB = { clicks: {}, daily: {}, referrers: {}, countries: {}, userAgents: {} };
  }
}

// Save database
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(urlsDB, null, 2));
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analyticsDB, null, 2));
  } catch (error) {
    console.error("Failed to save database:", error.message);
  }
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

/* ===== URL SHORTENER LOGIC ===== */

class URLShortener {
  static generateShortCode(length = CONFIG.defaultShortLength) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static validateUrl(url) {
    try {
      // Allow URLs without protocol, add https by default
      let urlToValidate = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        urlToValidate = "https://" + url;
      }

      const parsedUrl = new URL(urlToValidate);

      // Check for valid protocols
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return false;
      }

      // Check for valid hostname
      if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
        return false;
      }

      // Basic hostname validation
      const hostnameRegex =
        /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!hostnameRegex.test(parsedUrl.hostname)) {
        return false;
      }

      return true;
    } catch (error) {
      console.log(`URL validation error for "${url}":`, error.message);
      return false;
    }
  }

  static validateAlias(alias) {
    if (!alias || typeof alias !== "string") return false;
    if (alias.length > CONFIG.maxCustomAliasLength) return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(alias)) return false;
    return true;
  }

  static isExpired(url) {
    if (!url.expiresAt) return false;
    return new Date() > new Date(url.expiresAt);
  }

  static async extractMetadata(url) {
    return new Promise((resolve) => {
      try {
        const parsedUrl = new URL(url);
        const client = parsedUrl.protocol === "https:" ? https : http;

        // Enhanced request options for better compatibility with external sites
        const options = {
          timeout: 10000, // Increased timeout for slower sites
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
          },
        };

        const request = client.get(url, options, (response) => {
          // Handle redirects
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            console.log(`Following redirect from ${url} to ${response.headers.location}`);
            return this.extractMetadata(response.headers.location).then(resolve);
          }

          // Handle non-successful responses
          if (response.statusCode >= 400) {
            console.log(`HTTP ${response.statusCode} for ${url}, using basic metadata`);
            return resolve(this.getBasicMetadata(url));
          }

          let html = "";
          let bytesReceived = 0;
          const maxBytes = 100000; // Increased to 100KB for more complete metadata

          response.on("data", (chunk) => {
            bytesReceived += chunk.length;
            if (bytesReceived > maxBytes) {
              request.destroy();
              return;
            }
            html += chunk;
          });

          response.on("end", () => {
            try {
              const metadata = this.parseMetadata(html, url);
              resolve(metadata);
            } catch (error) {
              console.log(`Error parsing metadata for ${url}:`, error.message);
              resolve(this.getBasicMetadata(url));
            }
          });
        });

        request.on("error", (error) => {
          console.log(`Request error for ${url}:`, error.message);
          resolve(this.getBasicMetadata(url));
        });

        request.on("timeout", () => {
          request.destroy();
          console.log(`Request timeout for ${url}`);
          resolve(this.getBasicMetadata(url));
        });

        request.setTimeout(10000);
      } catch (error) {
        console.log(`General error extracting metadata for ${url}:`, error.message);
        resolve(this.getBasicMetadata(url));
      }
    });
  }

  static parseMetadata(html, url) {
    const metadata = this.getBasicMetadata(url);

    try {
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        metadata.title = titleMatch[1].trim();
      }

      // Extract meta description
      const descMatch = html.match(/<meta[^>]*name=['""]description['""][^>]*content=['""]([^'""]+)['""][^>]*>/i);
      if (descMatch) {
        metadata.description = descMatch[1].trim();
      }

      // Extract Open Graph data
      const ogTitle = html.match(/<meta[^>]*property=['""]og:title['""][^>]*content=['""]([^'""]+)['""][^>]*>/i);
      if (ogTitle) metadata.ogTitle = ogTitle[1].trim();

      const ogDesc = html.match(/<meta[^>]*property=['""]og:description['""][^>]*content=['""]([^'""]+)['""][^>]*>/i);
      if (ogDesc) metadata.ogDescription = ogDesc[1].trim();

      const ogImage = html.match(/<meta[^>]*property=['""]og:image['""][^>]*content=['""]([^'""]+)['""][^>]*>/i);
      if (ogImage) metadata.ogImage = ogImage[1].trim();

      // Extract favicon
      const favicon = html.match(/<link[^>]*rel=['""][^'""]*icon[^'""]*['""][^>]*href=['""]([^'""]+)['""][^>]*>/i);
      if (favicon) {
        const faviconUrl = favicon[1].trim();
        metadata.favicon = faviconUrl.startsWith("http") ? faviconUrl : new URL(faviconUrl, url).href;
      }
    } catch (error) {
      // Keep basic metadata if parsing fails
    }

    return metadata;
  }

  static getBasicMetadata(url) {
    try {
      const parsedUrl = new URL(url);
      return {
        title: parsedUrl.hostname,
        description: `Link to ${parsedUrl.hostname}`,
        domain: parsedUrl.hostname,
        protocol: parsedUrl.protocol,
        extractedAt: new Date().toISOString(),
      };
    } catch {
      return {
        title: "Unknown",
        description: "Unable to extract metadata",
        domain: "unknown",
        protocol: "unknown",
        extractedAt: new Date().toISOString(),
      };
    }
  }

  static recordClick(shortCode, req) {
    const now = new Date();
    const dateKey = now.toISOString().split("T")[0];

    const clickData = {
      timestamp: now.toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent") || "Unknown",
      referer: req.get("Referer") || "Direct",
    };

    // Record click
    if (!analyticsDB.clicks[shortCode]) {
      analyticsDB.clicks[shortCode] = [];
    }
    analyticsDB.clicks[shortCode].push(clickData);

    // Update daily stats
    if (!analyticsDB.daily[dateKey]) {
      analyticsDB.daily[dateKey] = {};
    }
    if (!analyticsDB.daily[dateKey][shortCode]) {
      analyticsDB.daily[dateKey][shortCode] = 0;
    }
    analyticsDB.daily[dateKey][shortCode]++;

    // Update referrer stats
    const domain = this.extractDomain(clickData.referer);
    if (!analyticsDB.referrers[shortCode]) {
      analyticsDB.referrers[shortCode] = {};
    }
    analyticsDB.referrers[shortCode][domain] = (analyticsDB.referrers[shortCode][domain] || 0) + 1;

    // Update user agent stats
    const browser = this.extractBrowser(clickData.userAgent);
    if (!analyticsDB.userAgents[shortCode]) {
      analyticsDB.userAgents[shortCode] = {};
    }
    analyticsDB.userAgents[shortCode][browser] = (analyticsDB.userAgents[shortCode][browser] || 0) + 1;

    // Update global counter
    STATE.totalClicks++;

    // Save database
    saveDatabase();
  }

  static extractDomain(referer) {
    if (!referer || referer === "Direct") return "Direct";
    try {
      return new URL(referer).hostname;
    } catch {
      return "Unknown";
    }
  }

  static extractBrowser(userAgent) {
    if (!userAgent) return "Unknown";
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    if (userAgent.includes("Opera")) return "Opera";
    return "Other";
  }
}

/* ===== STANDARD ENDPOINTS ===== */

// PING endpoint
app.get("/api/ping", (req, res) => {
  res.json({
    message: "pong",
    timestamp: new Date().toISOString(),
    service: CONFIG.serviceName,
  });
});

// HEALTH endpoint
app.get("/api/health", (req, res) => {
  const uptime = Date.now() - STATE.startTime.getTime();
  const status = STATE.errorCount > 10 ? "degraded" : "ok";

  res.json({
    status,
    uptime: Math.floor(uptime / 1000),
    timestamp: new Date().toISOString(),
    service: CONFIG.serviceName,
    version: CONFIG.version,
  });
});

// STATUS endpoint
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
      totalUrls: STATE.totalUrls,
      totalClicks: STATE.totalClicks,
      activeBulkJobs: STATE.bulkJobs.size,
      errorRate: STATE.requestCount > 0 ? ((STATE.errorCount / STATE.requestCount) * 100).toFixed(2) + "%" : "0%",
    },
    lastError: STATE.lastError,
    timestamp: new Date().toISOString(),
  });
});

// CAPABILITIES endpoint
app.get("/api/capabilities", (req, res) => {
  const endpoints = listEndpoints(app);
  const endpointStrings = endpoints.map((ep) => `${ep.method} ${ep.path}`);

  res.json({
    service: CONFIG.serviceName,
    version: CONFIG.version,
    features: [
      "url-shortening",
      "custom-aliases",
      "click-analytics",
      "expiration-dates",
      "qr-code-generation",
      "bulk-processing",
      "metadata-extraction",
      "link-preview",
    ],
    endpoints: endpointStrings,
    limits: {
      maxCustomAliasLength: CONFIG.maxCustomAliasLength,
      maxBulkUrls: CONFIG.maxBulkUrls,
      maxExpirationDays: CONFIG.maxExpirationDays,
    },
    timestamp: new Date().toISOString(),
  });
});

// CONFIG endpoints
app.get("/api/config", (req, res) => {
  res.json({
    config: CONFIG,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/config", (req, res) => {
  const updates = req.body || {};
  const allowedKeys = ["enableDiagnostics", "defaultShortLength", "maxBulkUrls", "baseUrl"];
  const updated = [];
  const errors = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unknown config key: ${key}`);
      continue;
    }

    // Validate specific configs
    if (key === "defaultShortLength" && (value < 4 || value > 20)) {
      errors.push("defaultShortLength must be between 4 and 20");
      continue;
    }

    if (key === "maxBulkUrls" && (value < 1 || value > 1000)) {
      errors.push("maxBulkUrls must be between 1 and 1000");
      continue;
    }

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

// OPENAPI endpoint
app.get("/api/openapi", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json({
    openapi: "3.0.0",
    info: {
      title: CONFIG.serviceName,
      version: CONFIG.version,
      description: "URL Shortener Service with analytics, custom aliases, and bulk processing",
    },
    basePath: "/api",
    endpoints: endpoints,
    timestamp: new Date().toISOString(),
  });
});

/* ===== URL SHORTENER ENDPOINTS ===== */

// TEST endpoint - Test URL validation
app.post("/api/test-url", (req, res) => {
  try {
    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({
        error: "Missing URL parameter",
        example: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      });
    }

    const isValid = URLShortener.validateUrl(url);
    let normalizedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      normalizedUrl = "https://" + url;
    }

    res.json({
      originalUrl: url,
      normalizedUrl: normalizedUrl,
      isValid: isValid,
      testResult: isValid ? "✅ URL is valid" : "❌ URL is invalid",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Test URL error:", error);
    res.status(500).json({
      error: "Failed to test URL",
      details: error.message,
    });
  }
});

// SHORTEN endpoint - Create short URL
app.post("/api/shorten", async (req, res) => {
  try {
    const { url, alias, expirationDays, extractMetadata = true } = req.body || {};

    console.log(`📝 Shortening request: URL="${url}", alias="${alias}", extractMetadata=${extractMetadata}`);

    // Validate URL
    if (!url) {
      return res.status(400).json({
        error: "Missing required field: url",
        example: { url: "https://example.com", alias: "my-link" },
      });
    }

    if (!URLShortener.validateUrl(url)) {
      return res.status(400).json({
        error: "Invalid URL format. Must be a valid HTTP or HTTPS URL",
      });
    }

    // Normalize URL - add https if no protocol specified
    let normalizedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      normalizedUrl = "https://" + url;
    }

    // Validate alias if provided
    let shortCode = alias;
    if (alias) {
      if (!URLShortener.validateAlias(alias)) {
        return res.status(400).json({
          error: "Invalid alias. Must contain only letters, numbers, hyphens, and underscores",
        });
      }

      if (urlsDB.aliases[alias]) {
        return res.status(409).json({
          error: "Alias already exists",
          alias: alias,
        });
      }
    } else {
      // Generate unique short code
      do {
        shortCode = URLShortener.generateShortCode();
      } while (urlsDB.aliases[shortCode]);
    }

    // Calculate expiration
    let expiresAt = null;
    if (expirationDays) {
      if (expirationDays > CONFIG.maxExpirationDays) {
        return res.status(400).json({
          error: `Expiration days cannot exceed ${CONFIG.maxExpirationDays}`,
        });
      }
      expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    // Create URL entry
    const urlData = {
      id: crypto.randomUUID(),
      originalUrl: normalizedUrl,
      shortCode: shortCode,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt,
      createdBy: req.ip || "unknown",
      active: true,
    };

    // Extract metadata if requested
    let metadata = null;
    if (extractMetadata) {
      try {
        metadata = await URLShortener.extractMetadata(normalizedUrl);
      } catch (error) {
        metadata = URLShortener.getBasicMetadata(normalizedUrl);
      }
    }

    // Save to database
    urlsDB.urls[urlData.id] = urlData;
    urlsDB.aliases[shortCode] = urlData.id;
    if (metadata) {
      urlsDB.metadata[urlData.id] = metadata;
    }

    // Initialize analytics
    analyticsDB.clicks[shortCode] = [];
    analyticsDB.referrers[shortCode] = {};
    analyticsDB.userAgents[shortCode] = {};

    saveDatabase();

    STATE.totalUrls++;

    const shortUrl = `${CONFIG.baseUrl}/${shortCode}`;

    console.log(`✅ Successfully shortened: ${normalizedUrl} -> ${shortUrl}`);

    res.status(201).json({
      success: true,
      data: {
        id: urlData.id,
        originalUrl: normalizedUrl,
        shortUrl: shortUrl,
        shortCode: shortCode,
        qrCode: `${CONFIG.baseUrl}/api/qr/${shortCode}`,
        expiresAt: expiresAt,
        metadata: metadata,
        createdAt: urlData.createdAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Shorten error:", error);
    res.status(500).json({
      error: "Failed to shorten URL",
      details: error.message,
    });
  }
});

// ANALYTICS endpoint - Get analytics for short URL
app.get("/api/analytics/:shortCode", (req, res) => {
  try {
    const { shortCode } = req.params;
    const { days = 30 } = req.query;

    if (!urlsDB.aliases[shortCode]) {
      return res.status(404).json({
        error: "Short URL not found",
        shortCode: shortCode,
      });
    }

    const urlId = urlsDB.aliases[shortCode];
    const urlData = urlsDB.urls[urlId];
    const clicks = analyticsDB.clicks[shortCode] || [];

    // Filter clicks by date range
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentClicks = clicks.filter((click) => new Date(click.timestamp) >= daysAgo);

    // Calculate daily statistics
    const dailyStats = {};
    recentClicks.forEach((click) => {
      const date = click.timestamp.split("T")[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    // Top referrers
    const referrers = analyticsDB.referrers[shortCode] || {};
    const topReferrers = Object.entries(referrers)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    // Browser statistics
    const browsers = analyticsDB.userAgents[shortCode] || {};
    const browserStats = Object.entries(browsers)
      .sort(([, a], [, b]) => b - a)
      .map(([browser, count]) => ({ browser, count }));

    res.json({
      shortCode: shortCode,
      originalUrl: urlData.originalUrl,
      createdAt: urlData.createdAt,
      expiresAt: urlData.expiresAt,
      isExpired: URLShortener.isExpired(urlData),
      analytics: {
        totalClicks: clicks.length,
        recentClicks: recentClicks.length,
        period: `${days} days`,
        dailyStats: dailyStats,
        topReferrers: topReferrers,
        browserStats: browserStats,
        lastClick: clicks.length > 0 ? clicks[clicks.length - 1].timestamp : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      error: "Failed to get analytics",
      details: error.message,
    });
  }
});

// PREVIEW endpoint - Get link preview/metadata
app.get("/api/preview", async (req, res) => {
  try {
    const { url, shortCode } = req.query;

    if (!url && !shortCode) {
      return res.status(400).json({
        error: "Missing required parameter: url or shortCode",
      });
    }

    let targetUrl = url;
    let urlData = null;

    // If shortCode provided, get original URL
    if (shortCode) {
      if (!urlsDB.aliases[shortCode]) {
        return res.status(404).json({
          error: "Short URL not found",
          shortCode: shortCode,
        });
      }

      const urlId = urlsDB.aliases[shortCode];
      urlData = urlsDB.urls[urlId];
      targetUrl = urlData.originalUrl;

      // Check if expired
      if (URLShortener.isExpired(urlData)) {
        return res.status(410).json({
          error: "Short URL has expired",
          shortCode: shortCode,
          expiresAt: urlData.expiresAt,
        });
      }
    }

    // Check if we have cached metadata
    let metadata = null;
    if (urlData && urlsDB.metadata[urlData.id]) {
      metadata = urlsDB.metadata[urlData.id];
    } else {
      // Extract fresh metadata
      if (!URLShortener.validateUrl(targetUrl)) {
        return res.status(400).json({
          error: "Invalid URL format",
        });
      }

      metadata = await URLShortener.extractMetadata(targetUrl);
    }

    res.json({
      url: targetUrl,
      shortCode: shortCode,
      preview: metadata,
      cached: urlData && urlsDB.metadata[urlData.id] ? true : false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).json({
      error: "Failed to get preview",
      details: error.message,
    });
  }
});

// BULK endpoint - Bulk URL shortening
app.post("/api/bulk", async (req, res) => {
  try {
    const { urls = [], expirationDays, extractMetadata = false } = req.body || {};

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        error: "Missing required field: urls (array)",
        example: {
          urls: [{ url: "https://example.com", alias: "example" }, { url: "https://google.com" }],
        },
      });
    }

    if (urls.length > CONFIG.maxBulkUrls) {
      return res.status(400).json({
        error: `Bulk operation too large. Maximum ${CONFIG.maxBulkUrls} URLs allowed`,
      });
    }

    // Create bulk job
    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      status: "processing",
      total: urls.length,
      completed: 0,
      results: [],
      errors: [],
      startTime: new Date(),
    };

    STATE.bulkJobs.set(jobId, job);

    // Process URLs
    for (let i = 0; i < urls.length; i++) {
      const item = urls[i];

      try {
        if (!item.url || !URLShortener.validateUrl(item.url)) {
          job.errors.push({
            index: i,
            error: "Invalid URL format",
            url: item.url,
          });
          continue;
        }

        // Check alias validity
        let shortCode = item.alias;
        if (item.alias) {
          if (!URLShortener.validateAlias(item.alias)) {
            job.errors.push({
              index: i,
              error: "Invalid alias format",
              url: item.url,
              alias: item.alias,
            });
            continue;
          }

          if (urlsDB.aliases[item.alias]) {
            job.errors.push({
              index: i,
              error: "Alias already exists",
              url: item.url,
              alias: item.alias,
            });
            continue;
          }
        } else {
          // Generate unique short code
          do {
            shortCode = URLShortener.generateShortCode();
          } while (urlsDB.aliases[shortCode]);
        }

        // Calculate expiration
        let expiresAt = null;
        if (expirationDays && expirationDays <= CONFIG.maxExpirationDays) {
          expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();
        }

        // Create URL entry
        const urlData = {
          id: crypto.randomUUID(),
          originalUrl: item.url,
          shortCode: shortCode,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt,
          createdBy: req.ip || "unknown",
          active: true,
        };

        // Extract metadata if requested
        let metadata = null;
        if (extractMetadata) {
          try {
            metadata = await URLShortener.extractMetadata(item.url);
          } catch (error) {
            metadata = URLShortener.getBasicMetadata(item.url);
          }
        }

        // Save to database
        urlsDB.urls[urlData.id] = urlData;
        urlsDB.aliases[shortCode] = urlData.id;
        if (metadata) {
          urlsDB.metadata[urlData.id] = metadata;
        }

        // Initialize analytics
        analyticsDB.clicks[shortCode] = [];
        analyticsDB.referrers[shortCode] = {};
        analyticsDB.userAgents[shortCode] = {};

        const shortUrl = `${CONFIG.baseUrl}/${shortCode}`;

        job.results.push({
          index: i,
          originalUrl: item.url,
          shortUrl: shortUrl,
          shortCode: shortCode,
          qrCode: `${CONFIG.baseUrl}/api/qr/${shortCode}`,
          expiresAt: expiresAt,
          metadata: metadata,
        });

        job.completed++;
        STATE.totalUrls++;
      } catch (error) {
        job.errors.push({
          index: i,
          error: error.message,
          url: item.url,
        });
      }
    }

    saveDatabase();

    job.status = "completed";
    job.endTime = new Date();
    job.duration = job.endTime - job.startTime;

    res.json({
      jobId: jobId,
      status: job.status,
      summary: {
        total: job.total,
        completed: job.completed,
        errors: job.errors.length,
        duration: job.duration + "ms",
      },
      results: job.results,
      errors: job.errors,
      completedAt: job.endTime.toISOString(),
    });
  } catch (error) {
    console.error("Bulk processing error:", error);
    res.status(500).json({
      error: "Bulk processing failed",
      details: error.message,
    });
  }
});

// QR CODE endpoint - Generate QR code for short URL
app.get("/api/qr/:shortCode", (req, res) => {
  try {
    const { shortCode } = req.params;
    const { size = 200, format = "png" } = req.query;

    if (!urlsDB.aliases[shortCode]) {
      return res.status(404).json({
        error: "Short URL not found",
        shortCode: shortCode,
      });
    }

    const shortUrl = `${CONFIG.baseUrl}/${shortCode}`;

    // Simple QR code representation (in production, use QR code library)
    const qrCodeData = {
      data: shortUrl,
      format: format,
      size: parseInt(size),
      shortCode: shortCode,
      generatedAt: new Date().toISOString(),
    };

    if (format === "json") {
      res.json(qrCodeData);
    } else {
      // Return QR code instructions
      res.json({
        message: "QR code data",
        instructions: "In production, this would generate an actual QR code image",
        data: qrCodeData,
        suggestedLibrary: "qrcode npm package",
      });
    }
  } catch (error) {
    console.error("QR code error:", error);
    res.status(500).json({
      error: "Failed to generate QR code",
      details: error.message,
    });
  }
});

// LIST endpoint - Get all URLs (with pagination)
app.get("/api/list", (req, res) => {
  try {
    const { page = 1, limit = 20, includeExpired = false } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const allUrls = Object.values(urlsDB.urls);

    // Filter expired URLs if requested
    const filteredUrls = includeExpired === "true" ? allUrls : allUrls.filter((url) => !URLShortener.isExpired(url));

    // Sort by creation date (newest first)
    filteredUrls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Paginate
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedUrls = filteredUrls.slice(startIndex, endIndex);

    // Add metadata and click counts
    const urlsWithStats = paginatedUrls.map((url) => {
      const metadata = urlsDB.metadata[url.id];
      const clicks = analyticsDB.clicks[url.shortCode] || [];

      return {
        ...url,
        shortUrl: `${CONFIG.baseUrl}/${url.shortCode}`,
        totalClicks: clicks.length,
        metadata: metadata || null,
        isExpired: URLShortener.isExpired(url),
      };
    });

    res.json({
      urls: urlsWithStats,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalItems: filteredUrls.length,
        totalPages: Math.ceil(filteredUrls.length / limitNum),
        hasNext: endIndex < filteredUrls.length,
        hasPrev: pageNum > 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("List error:", error);
    res.status(500).json({
      error: "Failed to list URLs",
      details: error.message,
    });
  }
});

// REDIRECT endpoint - Handle short URL redirects
app.get("/:shortCode", (req, res) => {
  try {
    const { shortCode } = req.params;

    if (!urlsDB.aliases[shortCode]) {
      return res.status(404).json({
        error: "Short URL not found",
        shortCode: shortCode,
      });
    }

    const urlId = urlsDB.aliases[shortCode];
    const urlData = urlsDB.urls[urlId];

    // Check if expired
    if (URLShortener.isExpired(urlData)) {
      return res.status(410).json({
        error: "Short URL has expired",
        shortCode: shortCode,
        expiresAt: urlData.expiresAt,
      });
    }

    // Record click analytics
    URLShortener.recordClick(shortCode, req);

    // Redirect to original URL
    res.redirect(302, urlData.originalUrl);
  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).json({
      error: "Redirect failed",
      details: error.message,
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

        // Add descriptions for endpoints
        if (path === "/api/shorten") {
          description = "Create short URL";
        } else if (path === "/api/analytics/:shortCode") {
          description = "Get URL analytics";
        } else if (path === "/api/preview") {
          description = "Get link preview";
        } else if (path === "/api/bulk") {
          description = "Bulk URL shortening";
        } else if (path === "/api/qr/:shortCode") {
          description = "Generate QR code";
        } else if (path === "/api/list") {
          description = "List all URLs";
        } else if (path === "/:shortCode") {
          description = "Redirect short URL";
        }

        endpoints.push({
          method: upperMethod,
          path,
          description,
        });
      });
    }
  });

  return endpoints.filter(
    (ep) => typeof ep.path === "string" && (ep.path.startsWith("/api") || ep.path === "/:shortCode")
  );
}

// Cleanup expired URLs periodically
setInterval(() => {
  const now = new Date();
  let cleanedCount = 0;

  Object.entries(urlsDB.urls).forEach(([id, url]) => {
    if (URLShortener.isExpired(url)) {
      // Mark as inactive instead of deleting to preserve analytics
      if (url.active) {
        url.active = false;
        cleanedCount++;
      }
    }
  });

  if (cleanedCount > 0) {
    console.log(`🧹 Marked ${cleanedCount} expired URLs as inactive`);
    saveDatabase();
  }
}, 60 * 60 * 1000); // Check hourly

// Cleanup old bulk jobs
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [jobId, job] of STATE.bulkJobs.entries()) {
    if (now - job.startTime.getTime() > maxAge) {
      STATE.bulkJobs.delete(jobId);
    }
  }
}, 60 * 60 * 1000); // Check hourly

/* ===== SERVER STARTUP ===== */

app.listen(PORT, () => {
  console.log(`🚀 ${CONFIG.serviceName} v${CONFIG.version} running on port ${PORT}`);
  console.log(`📊 Visit http://localhost:${PORT}/api/status for service status`);
  console.log(`🏥 Visit http://localhost:${PORT}/api/health for health check`);
  console.log(`📖 Visit http://localhost:${PORT}/api/openapi for API documentation`);
  console.log(`🌐 Visit http://localhost:${PORT}/ for HTML interface`);
  console.log("");

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
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(25)} - ${ep.description}`);
    });
    console.log("");
  }

  if (customEndpoints.length > 0) {
    console.log("URL Shortener endpoints:");
    customEndpoints.forEach((ep) => {
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(25)} - ${ep.description}`);
    });
    console.log("");
  }

  console.log("🔗 Features: Custom aliases, Analytics, Expiration, QR codes, Bulk processing");
  console.log("💾 Database: JSON files (urls.json, analytics.json)");
  console.log("🎯 Ready to shorten URLs!");
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
