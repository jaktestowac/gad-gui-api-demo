// server.js
// MiniTemplate (templates + queue + delayed processing) — Express + plain JS only

const express = require("express");
const app = express();
app.use(express.json({ limit: "512kb" }));

const apiRouter = express.Router();

/* ===== In-memory state ===== */
const MAX_QUEUE = 100; // max enqueued (not yet moved to "processing")
const JOBS = new Map(); // id -> { status, templateId, params, enqueuedAt, startedAt?, doneAt?, result?, error? }
const QUEUE = []; // array of job ids in FIFO order
const HISTORY = []; // last ≤500 finished jobs (snapshots)
let nextJobId = 1;

/* ===== Configuration ===== */
const CONFIG = {
  processingDelay: { min: 2000, max: 3000 },
  maxQueue: MAX_QUEUE,
  maxHistory: 500,
  maxTemplateLength: 100_000,
  enableDiagnostics: false,
};

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

const CAPABILITIES = {
  name: "MiniTemplate",
  version: "1.0.0",
  features: {
    templatesRegistry: true,
    dottedPaths: true,
    defaultPipe: true,
    delayedProcessingMs: CONFIG.processingDelay,
  },
  limits: { maxQueue: CONFIG.maxQueue, maxHistory: CONFIG.maxHistory, maxTemplateLength: CONFIG.maxTemplateLength },
  jobStatuses: Object.values(JOB_STATUSES),
};

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

apiRouter.get("/health", (_req, res) => {
  const processing = Array.from(JOBS.values()).filter((j) => j.status === JOB_STATUSES.PROCESSING).length;
  res.json({ status: "ok", queueDepth: QUEUE.length, capacity: MAX_QUEUE, processing });
});

apiRouter.get("/capabilities", (_req, res) => res.json(CAPABILITIES));

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
const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`Visit http://localhost:${PORT}/ to try the server via HTML page`);
  console.log(`Visit http://localhost:${PORT}/api/jobs to get all jobs`);
  // List all available endpoints
  console.log(`Available endpoints:`);
  console.log(`- GET /api/: HTML interface`);
  console.log(`- POST /api/jobs: Create a new job`);
  console.log(`- GET /api/jobs/:id: Get job status`);
  console.log(`- GET /api/jobs: Get all jobs`);
  console.log(`- GET /api/history: Get job history`);
  console.log(`- GET /api/health: Check service health`);
  console.log(`- GET /api/capabilities: Get service capabilities`);
  console.log(`- GET /api/config: Get configuration`);
  console.log(`- PUT /api/config: Update configuration`);
  console.log(`- POST /api/templates: Create template`);
  console.log(`- PUT /api/templates/:id: Update template`);
  console.log(`- DELETE /api/templates/:id: Delete template`);
});

app.use("/api", apiRouter);
