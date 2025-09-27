const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(express.json());

// Serve static files (including our HTML page)
app.use(express.static(path.join(__dirname)));

const config = { interval: 1000, maxQueue: 100, maxParallelJobs: 3 };
const port = process.env.PORT || 3112;

// Service Configuration
const CONFIG = {
  serviceName: "Hasher",
  version: "1.0.0",
  enableDiagnostics: false,
};

// Service State
const STATE = {
  startTime: new Date(),
  requestCount: 0,
  errorCount: 0,
  lastError: null,
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

const jobs = {};
const queue = [];
const history = [];
const processingJobs = new Set(); // Track currently processing job IDs

// Algorithm processing functions
const algorithmProcessors = {
  sha256: processSha256,
  md5: processMd5,
  "slow-sha256": processSlowSha256,
};

function processSha256(job) {
  return new Promise((resolve, reject) => {
    try {
      if (!job.input) {
        throw new Error("No input provided");
      }

      const input = typeof job.input === "string" ? job.input : JSON.stringify(job.input);
      const hash = crypto.createHash("sha256");
      hash.update(input);
      const buffer = hash.digest();
      const hex = buffer.toString("hex");
      const bytes = buffer.length;
      const inputSize = input.length;

      const result = {
        algorithm: job.algorithm,
        hex,
        bytes,
        inputSize,
      };

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

function processMd5(job) {
  return new Promise((resolve, reject) => {
    try {
      if (!job.input) {
        throw new Error("No input provided");
      }

      const input = typeof job.input === "string" ? job.input : JSON.stringify(job.input);
      const hash = crypto.createHash("md5");
      hash.update(input);
      const buffer = hash.digest();
      const hex = buffer.toString("hex");
      const bytes = buffer.length;
      const inputSize = input.length;

      const result = {
        algorithm: job.algorithm,
        hex,
        bytes,
        inputSize,
      };

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

function processSlowSha256(job) {
  return new Promise((resolve, reject) => {
    // Simulate slow processing with a 3-6 second delay
    const processingTime = Math.floor(Math.random() * 3000) + 3000;

    setTimeout(() => {
      try {
        if (!job.input) {
          throw new Error("No input provided");
        }

        const input = typeof job.input === "string" ? job.input : JSON.stringify(job.input);

        // Perform multiple iterations of hashing to simulate slow processing
        let hash = crypto.createHash("sha256");
        hash.update(input);
        let result = hash.digest();

        // Perform additional iterations for "slow" effect
        const iterations = Math.floor(input.length / 10) + 100;
        for (let i = 0; i < iterations; i++) {
          hash = crypto.createHash("sha256");
          hash.update(result);
          result = hash.digest();
        }

        const hex = result.toString("hex");
        const bytes = result.length;
        const inputSize = input.length;

        const hashResult = {
          algorithm: job.algorithm,
          hex,
          bytes,
          inputSize,
          iterations: iterations,
          processingTime: processingTime,
        };

        resolve(hashResult);
      } catch (error) {
        reject(error);
      }
    }, processingTime);
  });
}

function completeJob(job, result) {
  job.result = result;
  job.status = "done";
  job.completedAt = new Date();
  history.push(job);
  processingJobs.delete(job.id); // Remove from processing set
  delete jobs[job.id];
  if (history.length > 500) history.shift();
}

function failJob(job, error) {
  job.status = "failed";
  job.error = error.message;
  job.failedAt = new Date();
  history.push(job);
  processingJobs.delete(job.id); // Remove from processing set
  delete jobs[job.id];
  if (history.length > 500) history.shift();
}

function processQueue() {
  // Process multiple jobs up to the parallel limit
  while (queue.length > 0 && processingJobs.size < config.maxParallelJobs) {
    const id = queue.shift();
    const job = jobs[id];
    if (!job) continue; // Safety check

    job.status = "processing";
    job.startedAt = new Date();
    processingJobs.add(job.id); // Add to processing set

    // Get the appropriate processor function for the algorithm
    const processor = algorithmProcessors[job.algorithm];

    if (!processor) {
      failJob(job, new Error(`Unsupported algorithm: ${job.algorithm}`));
      continue;
    }

    // Process the job using the algorithm-specific function
    processor(job)
      .then((result) => {
        completeJob(job, result);
      })
      .catch((error) => {
        failJob(job, error);
      });
  }
}

// Process queue every 1000ms
let intervalId = setInterval(processQueue, config.interval);

app.post("/api/jobs", (req, res) => {
  const { algorithm, input } = req.body;
  const supportedAlgorithms = Object.keys(algorithmProcessors);
  if (!supportedAlgorithms.includes(algorithm)) {
    return res.status(400).json({ error: "Invalid algorithm" });
  }
  if (typeof input !== "string" && typeof input !== "object") {
    return res.status(400).json({ error: "Invalid input" });
  }
  if (queue.length >= config.maxQueue) {
    return res.status(429).json({ error: "Queue full" });
  }
  const id = crypto.randomUUID();
  jobs[id] = { id, algorithm, input, status: "queued", createdAt: new Date() };
  queue.push(id);
  res.json({ id });
});

app.get("/api/jobs/dummy", (req, res) => {
  const algorithms = Object.keys(algorithmProcessors);
  const algorithm = algorithms[Math.floor(Math.random() * algorithms.length)];
  const input = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); // random string
  if (queue.length >= config.maxQueue) {
    return res.status(429).json({ error: "Queue full" });
  }
  const id = crypto.randomUUID();
  jobs[id] = { id, algorithm, input, status: "queued", createdAt: new Date() };
  queue.push(id);
  res.json({ id, algorithm, input });
});

app.get("/api/jobs/:id", (req, res) => {
  let job = jobs[req.params.id];
  if (!job) {
    job = history.find((j) => j.id === req.params.id);
  }
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  res.json({
    status: job.status,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    failedAt: job.failedAt,
  });
});

app.post("/api/config", (req, res) => {
  const { interval, maxQueue, maxParallelJobs } = req.body;
  if (interval !== undefined) {
    if (typeof interval !== "number" || interval < 10) {
      return res.status(400).json({ error: "Invalid interval" });
    }
    config.interval = interval;
    clearInterval(intervalId);
    intervalId = setInterval(processQueue, config.interval);
  }
  if (maxQueue !== undefined) {
    if (typeof maxQueue !== "number" || maxQueue < 1) {
      return res.status(400).json({ error: "Invalid maxQueue" });
    }
    config.maxQueue = maxQueue;
  }
  if (maxParallelJobs !== undefined) {
    if (typeof maxParallelJobs !== "number" || maxParallelJobs < 1) {
      return res.status(400).json({ error: "Invalid maxParallelJobs" });
    }
    config.maxParallelJobs = maxParallelJobs;
  }
  res.json(config);
});

app.get("/api/config", (req, res) => {
  res.json(config);
});

app.get("/api/ping", (req, res) => {
  res.json({
    message: "pong",
    timestamp: new Date().toISOString(),
    service: CONFIG.serviceName,
  });
});

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

app.get("/api/capabilities", (req, res) => {
  const endpoints = listEndpoints(app);
  const endpointStrings = endpoints.map((ep) => `${ep.method} ${ep.path}`);

  res.json({
    service: CONFIG.serviceName,
    version: CONFIG.version,
    features: [
      "hash-generation",
      "queue-processing",
      "job-tracking",
      "configuration-management",
      "openapi-documentation",
    ],
    supportedAlgorithms: Object.keys(algorithmProcessors),
    limits: {
      maxQueue: config.maxQueue,
      maxParallelJobs: config.maxParallelJobs,
    },
    endpoints: endpointStrings,
    supportedFormats: ["json"],
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/status", (req, res) => {
  const uptime = Date.now() - STATE.startTime.getTime();
  const statusCounts = {};
  Object.values(jobs).forEach((job) => {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
  });

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
      queueLength: queue.length,
      jobsCount: Object.keys(jobs).length,
      processingJobsCount: processingJobs.size,
      statusCounts,
    },
    lastError: STATE.lastError,
    config,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/jobs", (req, res) => {
  const allJobs = Object.values(jobs).map((job) => ({
    id: job.id,
    status: job.status,
    algorithm: job.algorithm,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    failedAt: job.failedAt,
    error: job.error,
  }));
  res.json({ jobs: allJobs });
});

app.get("/api/history", (req, res) => {
  const historyJobs = history.map((job) => ({
    id: job.id,
    status: job.status,
    algorithm: job.algorithm,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    failedAt: job.failedAt,
    error: job.error,
  }));
  res.json({ history: historyJobs });
});

// Utility function to format uptime
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

app.get("/api/openapi", (req, res) => {
  const endpoints = listEndpoints(app);

  const paths = endpoints.reduce((acc, ep) => {
    if (!acc[ep.path]) acc[ep.path] = [];
    if (!acc[ep.path].includes(ep.method)) acc[ep.path].push(ep.method);
    return acc;
  }, {});

  // Add example bodies for relevant endpoints
  const enhancedEndpoints = endpoints.map((ep) => {
    let exampleBody = null;
    if (ep.method === "POST" && ep.path === "/api/jobs") {
      exampleBody = { algorithm: "sha256", input: "hello world" };
    } else if (ep.method === "POST" && ep.path === "/api/config") {
      exampleBody = { interval: 1000, maxQueue: 100, maxParallelJobs: 3 };
    }
    return { ...ep, exampleBody };
  });

  res.json({
    openapi: "3.0.0",
    info: {
      title: CONFIG.serviceName,
      version: CONFIG.version,
      description: "Hash generation service with queue processing",
    },
    basePath: "/api",
    endpoints: enhancedEndpoints,
    paths,
    timestamp: new Date().toISOString(),
  });
});

// Serve the HTML page as the default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 ${CONFIG.serviceName} v${CONFIG.version} running on port ${port}`);
  console.log(`📊 Visit http://localhost:${port}/api/status for service status`);
  console.log(`🏥 Visit http://localhost:${port}/api/health for health check`);
  console.log(`📖 Visit http://localhost:${port}/api/openapi for API documentation`);
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
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(15)} - ${ep.description}`);
    });
    console.log("");
  }

  if (customEndpoints.length > 0) {
    console.log("Service endpoints:");
    customEndpoints.forEach((ep) => {
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path.padEnd(15)} - ${ep.description}`);
    });
    console.log("");
  }

  console.log("🎯 Ready to serve requests!");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  clearInterval(intervalId);
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  clearInterval(intervalId);
  process.exit(0);
});
