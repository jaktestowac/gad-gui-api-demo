// server.js
// MiniTemplate (templates + queue + delayed processing) — Express + plain JS only

const express = require("express");
const app = express();
app.use(express.json({ limit: "512kb" }));
const PORT = process.env.PORT || 3113;

const apiRouter = express.Router();

/* ===== In-memory state ===== */
const MAX_QUEUE = 100; // max enqueued (not yet moved to "processing")
const JOBS = new Map(); // id -> { status, templateId, params, enqueuedAt, startedAt?, doneAt?, result?, error? }
const QUEUE = []; // array of job ids in FIFO order
const HISTORY = []; // last ≤500 finished jobs (snapshots)
let nextJobId = 1;

/* ===== Configuration ===== */
const CONFIG = {
  serviceName: "MiniTemplate",
  version: "1.0.0",
  processingDelay: { min: 2000, max: 3000 },
  maxQueue: MAX_QUEUE,
  maxHistory: 500,
  maxTemplateLength: 100_000,
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

/* ===== Enums ===== */
const JOB_STATUSES = {
  QUEUED: "queued",
  PROCESSING: "processing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
}; // Status of the job in the system

// Predefined templates (example set)
const TEMPLATES = {
  "welcome-email": {
    id: "welcome-email",
    description: "Simple welcome line",
    template: "Hello {{user.name|Friend}}, welcome to {{org.name|GAD}}!",
    sampleParams: { user: { name: "John" }, org: { name: "GAD" } },
  },
  "order-confirmation": {
    id: "order-confirmation",
    description: "Order confirmation line",
    template: "Order {{order.id}} for {{user.email}} totals {{order.total}} {{order.currency|USD}}.",
    sampleParams: {
      order: { id: "12345", total: "99.99", currency: "USD" },
      user: { email: "john@example.com" },
    },
  },
  badge: {
    id: "badge",
    description: "Badge label",
    template: "[{{label}}] — {{value|N/A}}",
    sampleParams: { label: "VIP", value: "Gold" },
  },
};

function getCapabilities() {
  const endpoints = listEndpoints(app);
  const endpointStrings = endpoints.map((ep) => `${ep.method} ${ep.path}`);

  return {
    service: "MiniTemplate",
    version: "1.0.0",
    features: [
      "template-processing",
      "queue-management",
      "delayed-processing",
      "job-tracking",
      "configuration-management",
      "openapi-documentation",
    ],
    templateFeatures: {
      templatesRegistry: true,
      dottedPaths: true,
      defaultPipe: true,
      delayedProcessingMs: CONFIG.processingDelay,
    },
    limits: { maxQueue: CONFIG.maxQueue, maxHistory: CONFIG.maxHistory, maxTemplateLength: CONFIG.maxTemplateLength },
    jobStatuses: Object.values(JOB_STATUSES),
    endpoints: endpointStrings,
    supportedFormats: ["json"],
    timestamp: new Date().toISOString(),
  };
}

/* ===== Helpers ===== */
function now() {
  return Date.now();
}

function getPath(obj, dotted) {
  if (!dotted) return undefined;
  const parts = dotted.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object" || !(p in cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

// Replace {{key}} or {{key|Default}} with String(value) or default/empty; supports dotted paths
function renderTemplate(tpl, params) {
  const re = /{{\s*([^}|]+?)(?:\|([^}]*))?\s*}}/g;
  const used = [],
    missing = [];
  const seenUsed = new Set(),
    seenMissing = new Set();

  const output = tpl.replace(re, (_m, keyRaw, defRaw) => {
    const key = keyRaw.trim();
    if (!seenUsed.has(key)) {
      seenUsed.add(key);
      used.push(key);
    }
    const v = getPath(params, key);
    if (v === undefined || v === null) {
      if (!seenMissing.has(key)) {
        seenMissing.add(key);
        missing.push(key);
      }
      return defRaw !== undefined ? String(defRaw) : "";
    }
    return String(v);
  });

  return { output, usedKeys: used, missingKeys: missing };
}

// Validate template syntax
function validateTemplateSyntax(template) {
  const errors = [];
  const re = /{{\s*([^}|]+?)(?:\|([^}]*))?\s*}}/g;
  let match;

  while ((match = re.exec(template)) !== null) {
    const key = match[1].trim();

    // Check for empty keys
    if (!key) {
      errors.push("Empty placeholder key found");
      continue;
    }

    // Check for invalid characters in keys
    if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(key)) {
      errors.push(`Invalid key format: "${key}". Keys should contain only letters, numbers, dots, and underscores`);
    }

    // Check for unclosed braces
    const openBraces = (template.match(/{{/g) || []).length;
    const closeBraces = (template.match(/}}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push("Unmatched template braces");
    }
  }

  return errors;
}

function snapshotJob(j) {
  // Minimal snapshot for listings
  return {
    jobId: j.jobId,
    status: j.status,
    templateId: j.templateId,
    enqueuedAt: j.enqueuedAt,
    startedAt: j.startedAt || null,
    doneAt: j.doneAt || null,
    error: j.error || null,
  };
}

function pushHistory(entry) {
  HISTORY.unshift(entry);
  if (HISTORY.length > CONFIG.maxHistory) HISTORY.pop();
}

/* ===== Templates endpoints ===== */
apiRouter.get("/templates", (_req, res) => {
  res.json(
    Object.values(TEMPLATES).map((t) => ({
      id: t.id,
      description: t.description || "",
      template: t.template,
      sampleParams: t.sampleParams,
    }))
  );
});

apiRouter.get("/templates/:id", (req, res) => {
  const t = TEMPLATES[req.params.id];
  if (!t) return res.status(404).json({ error: "not_found" });
  res.json(t);
});

apiRouter.post("/templates", (req, res) => {
  const { id, description = "", template, sampleParams } = req.body || {};
  if (typeof id !== "string" || !id.trim()) {
    return res.status(400).json({ error: "bad_request", reason: '"id" must be a non-empty string' });
  }
  if (TEMPLATES[id]) {
    return res.status(409).json({ error: "conflict", reason: `Template "${id}" already exists` });
  }
  if (typeof template !== "string" || !template.length || template.length > CONFIG.maxTemplateLength) {
    return res.status(400).json({ error: "bad_request", reason: '"template" must be a non-empty string under limit' });
  }

  // Validate template syntax
  const templateErrors = validateTemplateSyntax(template);
  if (templateErrors.length > 0) {
    return res.status(400).json({ error: "bad_request", reason: "Invalid template syntax", details: templateErrors });
  }

  // Validate sample parameters
  if (sampleParams !== undefined) {
    if (typeof sampleParams !== "object" || Array.isArray(sampleParams)) {
      return res.status(400).json({ error: "bad_request", reason: '"sampleParams" must be an object' });
    }
  }

  TEMPLATES[id] = { id, description, template, sampleParams };
  res.status(201).json({ id });
});

apiRouter.put("/templates/:id", (req, res) => {
  const id = req.params.id;
  const { description, template, sampleParams } = req.body || {};
  if (template !== undefined) {
    if (typeof template !== "string" || !template.length || template.length > CONFIG.maxTemplateLength) {
      return res
        .status(400)
        .json({ error: "bad_request", reason: '"template" must be a non-empty string under limit' });
    }

    // Validate template syntax
    const templateErrors = validateTemplateSyntax(template);
    if (templateErrors.length > 0) {
      return res.status(400).json({ error: "bad_request", reason: "Invalid template syntax", details: templateErrors });
    }
  }

  // Validate sample parameters
  if (sampleParams !== undefined) {
    if (typeof sampleParams !== "object" || Array.isArray(sampleParams)) {
      return res.status(400).json({ error: "bad_request", reason: '"sampleParams" must be an object' });
    }
  }

  const prev = TEMPLATES[id];
  TEMPLATES[id] = {
    id,
    description: description !== undefined ? description : (prev && prev.description) || "",
    template: template !== undefined ? template : (prev && prev.template) || "",
    sampleParams: sampleParams !== undefined ? sampleParams : (prev && prev.sampleParams) || undefined,
  };
  res.status(prev ? 200 : 201).json({ id });
});

apiRouter.delete("/templates/:id", (req, res) => {
  const id = req.params.id;
  if (!TEMPLATES[id]) {
    return res.status(404).json({ error: "not_found", reason: `Template "${id}" not found` });
  }
  delete TEMPLATES[id];
  res.json({ message: "Template deleted successfully" });
});

/* ===== Jobs endpoints ===== */
apiRouter.post("/jobs", (req, res) => {
  const { templateId, params } = req.body || {};
  if (typeof templateId !== "string" || !templateId.trim()) {
    return res.status(400).json({ error: "bad_request", reason: '"templateId" must be a non-empty string' });
  }
  const tpl = TEMPLATES[templateId];
  if (!tpl) return res.status(404).json({ error: "not_found", reason: `Unknown templateId "${templateId}"` });
  if (params == null || typeof params !== "object" || Array.isArray(params)) {
    return res.status(400).json({ error: "bad_request", reason: '"params" must be an object' });
  }
  if (QUEUE.length >= CONFIG.maxQueue) {
    return res.status(429).set("Retry-After", "2").json({ error: "queue_full" });
  }

  const jobId = String(nextJobId++);
  const job = {
    jobId,
    status: JOB_STATUSES.QUEUED,
    templateId,
    params,
    enqueuedAt: now(),
    startedAt: null,
    doneAt: null,
    result: null,
    error: null,
  };
  JOBS.set(jobId, job);
  QUEUE.push(jobId);
  res.status(202).json({ jobId });
});

apiRouter.get("/jobs/:id", (req, res) => {
  const j = JOBS.get(req.params.id);
  if (!j) return res.status(404).json({ error: "not_found" });
  // Include result only when done
  const base = { ...snapshotJob(j) };
  if (j.status === JOB_STATUSES.SUCCEEDED) base.result = j.result;
  if (j.status === JOB_STATUSES.FAILED) base.error = j.error;
  res.json(base);
});

apiRouter.get("/jobs", (_req, res) => {
  // Return concise status list for all jobs
  const list = Array.from(JOBS.values())
    .sort((a, b) => Number(a.jobId) - Number(b.jobId))
    .map(snapshotJob);
  res.json(list);
});

/* ===== History & Ops ===== */
apiRouter.get("/history", (_req, res) => {
  res.json(HISTORY);
});

apiRouter.get("/ping", (_req, res) => {
  res.json({
    message: "pong",
    timestamp: new Date().toISOString(),
    service: CONFIG.serviceName,
  });
});

apiRouter.get("/health", (_req, res) => {
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

apiRouter.get("/status", (_req, res) => {
  const uptime = Date.now() - STATE.startTime.getTime();
  const processing = Array.from(JOBS.values()).filter((j) => j.status === JOB_STATUSES.PROCESSING).length;

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
      queueDepth: QUEUE.length,
      capacity: MAX_QUEUE,
      processing,
      jobsCount: JOBS.size,
    },
    lastError: STATE.lastError,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get("/capabilities", (_req, res) => res.json(getCapabilities()));

/* ===== Configuration endpoints ===== */
apiRouter.get("/config", (_req, res) => {
  res.json(CONFIG);
});

apiRouter.put("/config", (req, res) => {
  const updates = req.body || {};
  const allowedKeys = Object.keys(CONFIG);

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ error: "bad_request", reason: `Unknown config key: ${key}` });
    }

    // Validate processingDelay
    if (key === "processingDelay") {
      if (typeof value !== "object" || !value.min || !value.max || value.min >= value.max) {
        return res
          .status(400)
          .json({ error: "bad_request", reason: "processingDelay must have min and max with min < max" });
      }
    }

    // Validate numeric values
    if (["maxQueue", "maxHistory", "maxTemplateLength"].includes(key)) {
      if (typeof value !== "number" || value < 1) {
        return res.status(400).json({ error: "bad_request", reason: `${key} must be a positive number` });
      }
    }

    CONFIG[key] = value;
  }

  res.json({ message: "Configuration updated", config: CONFIG });
});

/* ===== Serve HTML page ===== */
app.get("/", (_req, res) => {
  res.sendFile(__dirname + "/index.html");
});

/* ===== Utility Functions ===== */
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

/* ===== Worker: dequeue → process after 2–3s delay ===== */
function scheduleProcess(job) {
  job.startedAt = now();
  job.status = JOB_STATUSES.PROCESSING;
  // Random delay between min-max ms from config
  const delay =
    CONFIG.processingDelay.min +
    Math.floor(Math.random() * (CONFIG.processingDelay.max - CONFIG.processingDelay.min + 1));
  setTimeout(() => {
    try {
      const t = TEMPLATES[job.templateId];
      if (!t) throw new Error(`Template "${job.templateId}" disappeared`);
      const t0 = now();
      const rendered = renderTemplate(t.template, job.params);
      job.result = {
        templateId: job.templateId,
        output: rendered.output,
        usedKeys: rendered.usedKeys,
        missingKeys: rendered.missingKeys,
        metrics: { renderMs: now() - t0 },
      };
      job.status = JOB_STATUSES.SUCCEEDED;
      job.doneAt = now();
      pushHistory({
        ...snapshotJob(job),
        resultPreview: job.result.output.slice(0, 200), // small peek
      });
    } catch (e) {
      job.status = JOB_STATUSES.FAILED;
      job.error = { code: "render_error", message: String((e && e.message) || e) };
      job.doneAt = now();
      pushHistory(snapshotJob(job));
    }
  }, delay);
}

// Poll the queue and schedule jobs for processing.
// Using schedule allows multiple concurrent "processing" jobs with the delay.
setInterval(() => {
  if (QUEUE.length === 0) return;
  const jobId = QUEUE.shift();
  const job = JOBS.get(jobId);
  if (!job || job.status !== JOB_STATUSES.QUEUED) return;
  scheduleProcess(job);
}, 50);

/* ===== Start ===== */

app.use("/api", apiRouter);

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
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  process.exit(0);
});

/* ===== Utility Functions ===== */

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

function listEndpointsFromRouter(router) {
  const eps = [];
  const stack = router && router.stack ? router.stack : [];
  stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods || {}).filter((m) => layer.route.methods[m]);
      methods.forEach((method) => {
        const upperMethod = method.toUpperCase();
        let description = "";
        let exampleBody = null;
        eps.push({
          method: upperMethod,
          path,
          description,
          exampleBody,
        });
      });
    }
  });
  return eps;
}

apiRouter.get("/openapi", (req, res) => {
  const endpoints = listEndpointsFromRouter(apiRouter)
    .filter((e) => typeof e.path === "string")
    .map((e) => ({ method: e.method, path: `/api${e.path}`, description: e.description, exampleBody: e.exampleBody }));

  const paths = endpoints.reduce((acc, ep) => {
    if (!acc[ep.path]) acc[ep.path] = [];
    if (!acc[ep.path].includes(ep.method)) acc[ep.path].push(ep.method);
    return acc;
  }, {});

  // Add example bodies for relevant endpoints
  const enhancedEndpoints = endpoints.map((ep) => {
    let exampleBody = ep.exampleBody;
    if (ep.method === "POST" && ep.path === "/api/jobs") {
      exampleBody = {
        templateId: "welcome-email",
        params: { user: { name: "John" }, org: { name: "GAD" } },
      };
    } else if (ep.method === "PUT" && ep.path.startsWith("/api/templates/")) {
      exampleBody = {
        description: "Updated template",
        template: "Hello {{user.name}}!",
        sampleParams: { user: { name: "Jane" } },
      };
    } else if (ep.method === "POST" && ep.path === "/api/templates") {
      exampleBody = {
        id: "new-template",
        description: "A new template",
        template: "Welcome {{name}}!",
        sampleParams: { name: "Alice" },
      };
    } else if (ep.method === "PUT" && ep.path === "/api/config") {
      exampleBody = {
        processingDelay: { min: 2000, max: 3000 },
        maxQueue: 100,
      };
    }
    return { ...ep, exampleBody };
  });

  res.json({
    openapi: "3.0.0",
    info: {
      title: CONFIG.serviceName,
      version: CONFIG.version,
      description: "Template processing service with queue management",
    },
    basePath: "/api",
    endpoints: enhancedEndpoints,
    paths,
    timestamp: new Date().toISOString(),
  });
});
