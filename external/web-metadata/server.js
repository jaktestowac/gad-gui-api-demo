// Web Scraper Metadata Service
// Extract metadata from web pages including Open Graph, Twitter Cards, SSL info, and performance metrics
// Features: Page metadata extraction, favicon detection, SSL certificate analysis, performance monitoring

const express = require("express");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3119;

// Middleware
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname)));

// Service Configuration
const CONFIG = {
  serviceName: "WebMetadataService",
  version: "1.0.0",
  enableDiagnostics: false,
  maxUrlLength: 2048,
  requestTimeout: 30000, // 30 seconds
  maxRedirects: 5,
  userAgent: "GAD-WebMetadata-Bot/1.0",
  maxContentLength: 1024 * 1024, // 1MB
  enableCache: true,
  cacheTimeout: 300000, // 5 minutes
  maxBatchSize: 10,
  allowedProtocols: ["http:", "https:"],
};

// Service State
const STATE = {
  startTime: new Date(),
  requestCount: 0,
  errorCount: 0,
  lastError: null,
  extractedMetadata: 0,
  cacheHits: 0,
  cacheMisses: 0,
  urlStats: {},
  performanceMetrics: [],
};

// Cache for metadata
const CACHE = new Map();

// Data storage
const dataFile = path.join(__dirname, "metadata-cache-tmp.json");

// Load cache from file
const loadCache = () => {
  try {
    if (fs.existsSync(dataFile)) {
      const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
      data.forEach((item) => {
        CACHE.set(item.url, {
          ...item,
          timestamp: new Date(item.timestamp),
        });
      });
      console.log(`📋 Loaded ${CACHE.size} cached entries`);
    }
  } catch (error) {
    console.error("Failed to load cache:", error);
  }
};

// Save cache to file
const saveCache = () => {
  try {
    const cacheArray = Array.from(CACHE.entries()).map(([url, data]) => ({
      url,
      ...data,
      timestamp: data.timestamp.toISOString(),
    }));
    fs.writeFileSync(dataFile, JSON.stringify(cacheArray, null, 2));
  } catch (error) {
    console.error("Failed to save cache:", error);
  }
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
      extractedMetadata: STATE.extractedMetadata,
      cacheEntries: CACHE.size,
      cacheHitRate:
        STATE.cacheHits + STATE.cacheMisses > 0
          ? ((STATE.cacheHits / (STATE.cacheHits + STATE.cacheMisses)) * 100).toFixed(2) + "%"
          : "0%",
    },
    cache: {
      size: CACHE.size,
      hits: STATE.cacheHits,
      misses: STATE.cacheMisses,
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
      "metadata-extraction",
      "open-graph-tags",
      "twitter-cards",
      "favicon-detection",
      "ssl-certificate-info",
      "performance-monitoring",
      "cache-management",
      "batch-processing",
    ],
    capabilities: {
      protocols: CONFIG.allowedProtocols,
      maxUrlLength: CONFIG.maxUrlLength,
      requestTimeout: CONFIG.requestTimeout,
      maxRedirects: CONFIG.maxRedirects,
      maxContentLength: CONFIG.maxContentLength,
      maxBatchSize: CONFIG.maxBatchSize,
    },
    metadataTypes: {
      basic: ["title", "description", "keywords", "author", "robots"],
      openGraph: ["og:title", "og:description", "og:image", "og:url", "og:type", "og:site_name"],
      twitter: ["twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:site"],
      technical: ["charset", "viewport", "canonical", "alternates"],
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
  const allowedKeys = [
    "enableDiagnostics",
    "requestTimeout",
    "maxRedirects",
    "enableCache",
    "cacheTimeout",
    "maxBatchSize",
  ];
  const updated = [];
  const errors = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unknown config key: ${key}`);
      continue;
    }

    // Validate specific config values
    if (key === "requestTimeout" && (typeof value !== "number" || value < 1000 || value > 120000)) {
      errors.push("requestTimeout must be between 1000 and 120000 milliseconds");
      continue;
    }
    if (key === "maxRedirects" && (typeof value !== "number" || value < 0 || value > 10)) {
      errors.push("maxRedirects must be between 0 and 10");
      continue;
    }
    if (key === "maxBatchSize" && (typeof value !== "number" || value < 1 || value > 50)) {
      errors.push("maxBatchSize must be between 1 and 50");
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
      description:
        "Web metadata extraction service with Open Graph, Twitter Cards, SSL info, and performance monitoring",
    },
    basePath: "/api",
    endpoints: endpoints,
    paths,
    timestamp: new Date().toISOString(),
  });
});

/* ===== CUSTOM SERVICE ENDPOINTS ===== */

// Main metadata extraction endpoint
app.post("/api/metadata", async (req, res) => {
  try {
    const { url, options = {} } = req.body || {};

    if (!url) {
      return res.status(400).json({
        error: "Missing required field: url",
        example: { url: "https://example.com", options: { ignoreCache: false } },
      });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({
        error: "Invalid URL format",
        provided: url,
      });
    }

    // Check cache first
    const cacheKey = url.toLowerCase();
    if (CONFIG.enableCache && !options.ignoreCache && CACHE.has(cacheKey)) {
      const cachedData = CACHE.get(cacheKey);
      if (Date.now() - cachedData.timestamp.getTime() < CONFIG.cacheTimeout) {
        STATE.cacheHits++;
        return res.json({
          ...cachedData,
          cached: true,
          cacheAge: Date.now() - cachedData.timestamp.getTime(),
        });
      } else {
        CACHE.delete(cacheKey);
      }
    }

    STATE.cacheMisses++;
    const startTime = Date.now();

    const metadata = await extractMetadata(url, options);
    metadata.extractionTime = Date.now() - startTime;
    metadata.timestamp = new Date().toISOString();
    metadata.cached = false;

    // Cache the result
    if (CONFIG.enableCache) {
      CACHE.set(cacheKey, {
        ...metadata,
        timestamp: new Date(),
      });

      // Cleanup old cache entries periodically
      if (CACHE.size > 1000) {
        cleanupCache();
      }
    }

    STATE.extractedMetadata++;
    STATE.urlStats[new URL(url).hostname] = (STATE.urlStats[new URL(url).hostname] || 0) + 1;

    res.json(metadata);
  } catch (error) {
    console.error("Metadata extraction error:", error);
    res.status(500).json({
      error: "Failed to extract metadata",
      details: error.message,
      url: req.body?.url,
    });
  }
});

// Batch metadata extraction
app.post("/api/metadata/batch", async (req, res) => {
  try {
    const { urls, options = {} } = req.body || {};

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({
        error: "Missing or invalid 'urls' array",
        example: { urls: ["https://example.com", "https://google.com"] },
      });
    }

    if (urls.length > CONFIG.maxBatchSize) {
      return res.status(400).json({
        error: `Batch size exceeds limit of ${CONFIG.maxBatchSize}`,
        provided: urls.length,
      });
    }

    const results = [];
    const errors = [];

    for (const url of urls) {
      try {
        if (!isValidUrl(url)) {
          errors.push({ url, error: "Invalid URL format" });
          continue;
        }

        const metadata = await extractMetadata(url, options);
        results.push({
          url,
          success: true,
          data: metadata,
        });
        STATE.extractedMetadata++;
      } catch (error) {
        errors.push({
          url,
          error: error.message,
        });
      }
    }

    res.json({
      totalUrls: urls.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Batch metadata extraction error:", error);
    res.status(500).json({
      error: "Failed to process batch metadata extraction",
      details: error.message,
    });
  }
});

// Open Graph tags extraction
app.post("/api/og-tags", async (req, res) => {
  try {
    const { url, options = {} } = req.body || {};

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({
        error: "Valid URL required",
        example: { url: "https://example.com" },
      });
    }

    const html = await fetchPageContent(url, options);
    const ogTags = extractOpenGraphTags(html);

    res.json({
      url,
      openGraph: ogTags,
      extractedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Open Graph extraction error:", error);
    res.status(500).json({
      error: "Failed to extract Open Graph tags",
      details: error.message,
    });
  }
});

// SSL certificate information
app.post("/api/ssl-info", async (req, res) => {
  try {
    const { url } = req.body || {};

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({
        error: "Valid HTTPS URL required",
        example: { url: "https://example.com" },
      });
    }

    const urlObj = new URL(url);
    if (urlObj.protocol !== "https:") {
      return res.status(400).json({
        error: "SSL info only available for HTTPS URLs",
      });
    }

    const sslInfo = await getSSLInfo(urlObj.hostname, urlObj.port || 443);

    res.json({
      url,
      ssl: sslInfo,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("SSL info error:", error);
    res.status(500).json({
      error: "Failed to get SSL information",
      details: error.message,
    });
  }
});

// Performance monitoring
app.post("/api/performance", async (req, res) => {
  try {
    const { url, options = {} } = req.body || {};

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({
        error: "Valid URL required",
        example: { url: "https://example.com" },
      });
    }

    const performance = await measurePerformance(url, options);

    // Store performance metrics
    STATE.performanceMetrics.push({
      url,
      ...performance,
      timestamp: new Date(),
    });

    // Keep only last 100 performance measurements
    if (STATE.performanceMetrics.length > 100) {
      STATE.performanceMetrics = STATE.performanceMetrics.slice(-100);
    }

    res.json({
      url,
      performance,
      measuredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Performance measurement error:", error);
    res.status(500).json({
      error: "Failed to measure performance",
      details: error.message,
    });
  }
});

// Cache management endpoints
app.get("/api/cache", (req, res) => {
  const cacheStats = {
    totalEntries: CACHE.size,
    hits: STATE.cacheHits,
    misses: STATE.cacheMisses,
    hitRate:
      STATE.cacheHits + STATE.cacheMisses > 0
        ? ((STATE.cacheHits / (STATE.cacheHits + STATE.cacheMisses)) * 100).toFixed(2) + "%"
        : "0%",
    entries: Array.from(CACHE.entries()).map(([url, data]) => ({
      url,
      timestamp: data.timestamp,
      age: Date.now() - data.timestamp.getTime(),
    })),
  };

  res.json(cacheStats);
});

app.delete("/api/cache", (req, res) => {
  const sizeBefore = CACHE.size;
  CACHE.clear();

  res.json({
    message: "Cache cleared successfully",
    entriesRemoved: sizeBefore,
    timestamp: new Date().toISOString(),
  });
});

app.delete("/api/cache/:url", (req, res) => {
  const url = decodeURIComponent(req.params.url);
  const existed = CACHE.delete(url.toLowerCase());

  res.json({
    message: existed ? "Cache entry removed" : "Cache entry not found",
    url,
    removed: existed,
    timestamp: new Date().toISOString(),
  });
});

/* ===== UTILITY FUNCTIONS ===== */

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return CONFIG.allowedProtocols.includes(url.protocol) && string.length <= CONFIG.maxUrlLength;
  } catch (_) {
    return false;
  }
}

async function extractMetadata(url, options = {}) {
  const startTime = Date.now();

  try {
    const html = await fetchPageContent(url, options);
    const urlObj = new URL(url);

    const metadata = {
      url,
      basic: extractBasicMetadata(html),
      openGraph: extractOpenGraphTags(html),
      twitter: extractTwitterTags(html),
      technical: extractTechnicalMetadata(html),
      favicon: await detectFavicon(url, html),
      performance: {
        fetchTime: Date.now() - startTime,
        contentLength: html.length,
      },
    };

    // Add SSL info for HTTPS URLs
    if (urlObj.protocol === "https:") {
      try {
        metadata.ssl = await getSSLInfo(urlObj.hostname, urlObj.port || 443);
      } catch (error) {
        metadata.ssl = { error: error.message };
      }
    }

    return metadata;
  } catch (error) {
    throw new Error(`Failed to extract metadata: ${error.message}`);
  }
}

async function fetchPageContent(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: "GET",
      timeout: options.timeout || CONFIG.requestTimeout,
      headers: {
        "User-Agent": CONFIG.userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "identity",
        Connection: "close",
      },
    };

    const req = client.request(requestOptions, (res) => {
      let data = "";
      let totalLength = 0;

      res.on("data", (chunk) => {
        totalLength += chunk.length;
        if (totalLength > CONFIG.maxContentLength) {
          req.destroy();
          reject(new Error("Content length exceeds maximum allowed size"));
          return;
        }
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Handle redirects
          const redirectUrl = new URL(res.headers.location, url).toString();
          if ((options.redirectCount || 0) < CONFIG.maxRedirects) {
            fetchPageContent(redirectUrl, { ...options, redirectCount: (options.redirectCount || 0) + 1 })
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error("Too many redirects"));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

function extractBasicMetadata(html) {
  const metadata = {};

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) metadata.title = titleMatch[1].trim();

  // Meta tags
  const metaTags = html.match(/<meta[^>]*>/gi) || [];

  metaTags.forEach((tag) => {
    const nameMatch = tag.match(/name=["']([^"']*)["']/i);
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);

    if (nameMatch && contentMatch) {
      const name = nameMatch[1].toLowerCase();
      const content = contentMatch[1];

      switch (name) {
        case "description":
          metadata.description = content;
          break;
        case "keywords":
          metadata.keywords = content.split(",").map((k) => k.trim());
          break;
        case "author":
          metadata.author = content;
          break;
        case "robots":
          metadata.robots = content;
          break;
      }
    }
  });

  return metadata;
}

function extractOpenGraphTags(html) {
  const ogTags = {};
  const metaTags = html.match(/<meta[^>]*property=["']og:[^"']*["'][^>]*>/gi) || [];

  metaTags.forEach((tag) => {
    const propertyMatch = tag.match(/property=["']og:([^"']*)["']/i);
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);

    if (propertyMatch && contentMatch) {
      ogTags[propertyMatch[1]] = contentMatch[1];
    }
  });

  return ogTags;
}

function extractTwitterTags(html) {
  const twitterTags = {};
  const metaTags = html.match(/<meta[^>]*name=["']twitter:[^"']*["'][^>]*>/gi) || [];

  metaTags.forEach((tag) => {
    const nameMatch = tag.match(/name=["']twitter:([^"']*)["']/i);
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);

    if (nameMatch && contentMatch) {
      twitterTags[nameMatch[1]] = contentMatch[1];
    }
  });

  return twitterTags;
}

function extractTechnicalMetadata(html) {
  const technical = {};

  // Charset
  const charsetMatch = html.match(/<meta[^>]*charset=["']?([^"'\s>]*)["']?[^>]*>/i);
  if (charsetMatch) technical.charset = charsetMatch[1];

  // Viewport
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["']/i);
  if (viewportMatch) technical.viewport = viewportMatch[1];

  // Canonical
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  if (canonicalMatch) technical.canonical = canonicalMatch[1];

  // Language
  const langMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
  if (langMatch) technical.language = langMatch[1];

  return technical;
}

async function detectFavicon(url, html) {
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

  const favicon = {
    found: false,
    urls: [],
  };

  // Check for favicon links in HTML
  const faviconLinks = html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi) || [];

  faviconLinks.forEach((link) => {
    const hrefMatch = link.match(/href=["']([^"']*)["']/i);
    if (hrefMatch) {
      let faviconUrl = hrefMatch[1];
      if (!faviconUrl.startsWith("http")) {
        faviconUrl = new URL(faviconUrl, baseUrl).toString();
      }
      favicon.urls.push(faviconUrl);
    }
  });

  // Default favicon location
  if (favicon.urls.length === 0) {
    favicon.urls.push(`${baseUrl}/favicon.ico`);
  }

  favicon.found = favicon.urls.length > 0;
  return favicon;
}

async function getSSLInfo(hostname, port) {
  return new Promise((resolve, reject) => {
    const socket = new (require("tls").TLSSocket)();

    const options = {
      host: hostname,
      port: port,
      servername: hostname,
      rejectUnauthorized: false,
    };

    const tlsSocket = require("tls").connect(options, () => {
      const cert = tlsSocket.getPeerCertificate();
      const cipher = tlsSocket.getCipher();

      if (cert) {
        const sslInfo = {
          valid: !tlsSocket.authorized ? false : true,
          reason: tlsSocket.authorizationError || null,
          subject: cert.subject,
          issuer: cert.issuer,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          fingerprint: cert.fingerprint,
          serialNumber: cert.serialNumber,
          cipher: cipher
            ? {
                name: cipher.name,
                version: cipher.version,
              }
            : null,
        };

        tlsSocket.end();
        resolve(sslInfo);
      } else {
        tlsSocket.end();
        reject(new Error("No certificate found"));
      }
    });

    tlsSocket.on("error", (error) => {
      reject(error);
    });

    tlsSocket.setTimeout(5000, () => {
      tlsSocket.destroy();
      reject(new Error("SSL connection timeout"));
    });
  });
}

async function measurePerformance(url, options = {}) {
  const startTime = Date.now();
  const startHrTime = process.hrtime.bigint();

  try {
    const html = await fetchPageContent(url, options);
    const endTime = Date.now();
    const endHrTime = process.hrtime.bigint();

    return {
      responseTime: endTime - startTime,
      preciseTiming: Number(endHrTime - startHrTime) / 1000000, // Convert to milliseconds
      contentSize: html.length,
      status: "success",
    };
  } catch (error) {
    const endTime = Date.now();

    return {
      responseTime: endTime - startTime,
      contentSize: 0,
      status: "error",
      error: error.message,
    };
  }
}

function cleanupCache() {
  const entries = Array.from(CACHE.entries());
  const now = Date.now();

  // Remove entries older than cache timeout
  entries.forEach(([url, data]) => {
    if (now - data.timestamp.getTime() > CONFIG.cacheTimeout) {
      CACHE.delete(url);
    }
  });

  console.log(`🧹 Cleaned up cache, ${CACHE.size} entries remaining`);
}

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

        // Add descriptions for known endpoints
        if (path === "/api/metadata" && upperMethod === "POST") {
          description = "Extract complete metadata from a web page";
        } else if (path === "/api/metadata/batch" && upperMethod === "POST") {
          description = "Extract metadata from multiple URLs";
        } else if (path === "/api/og-tags" && upperMethod === "POST") {
          description = "Extract Open Graph tags";
        } else if (path === "/api/ssl-info" && upperMethod === "POST") {
          description = "Get SSL certificate information";
        } else if (path === "/api/performance" && upperMethod === "POST") {
          description = "Measure website performance metrics";
        } else if (path === "/api/cache" && upperMethod === "GET") {
          description = "Get cache statistics";
        } else if (path === "/api/cache" && upperMethod === "DELETE") {
          description = "Clear all cache entries";
        }

        endpoints.push({
          method: upperMethod,
          path,
          description,
        });
      });
    }
  });

  return endpoints.filter((ep) => typeof ep.path === "string" && ep.path.startsWith("/api"));
}

/* ===== SERVER STARTUP ===== */

// Load cache on startup
loadCache();

// Auto-save cache periodically
setInterval(() => {
  if (CACHE.size > 0) {
    saveCache();
  }
}, 60000); // Save every minute

app.listen(PORT, () => {
  console.log(`🚀 ${CONFIG.serviceName} v${CONFIG.version} running on port ${PORT}`);
  console.log(`📊 Visit http://localhost:${PORT}/api/status for service status`);
  console.log(`🏥 Visit http://localhost:${PORT}/api/health for health check`);
  console.log(`📖 Visit http://localhost:${PORT}/api/openapi for API documentation`);
  console.log(`📜 Visit http://localhost:${PORT}/ for HTML interface`);
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
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(20)} - ${ep.description || "Standard endpoint"}`);
    });
    console.log("");
  }

  if (customEndpoints.length > 0) {
    console.log("Web Metadata endpoints:");
    customEndpoints.forEach((ep) => {
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(20)} - ${ep.description || "Custom endpoint"}`);
    });
    console.log("");
  }

  console.log("🎯 Ready to extract web metadata!");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  saveCache();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  saveCache();
  process.exit(0);
});
