const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const config = { interval: 1000, maxQueue: 100 };

const jobs = {};
const queue = [];
const history = [];

function processQueue() {
  if (queue.length === 0) return;
  const id = queue.shift();
  const job = jobs[id];
  if (!job) return; // Safety check
  job.status = "processing";
  job.startedAt = new Date();
  try {
    if (!job.input) throw new Error("No input provided");
    const input = typeof job.input === "string" ? job.input : JSON.stringify(job.input);
    const hash = crypto.createHash(job.algorithm);
    hash.update(input);
    const buffer = hash.digest();
    const hex = buffer.toString("hex");
    const bytes = buffer.length;
    const inputSize = input.length;
    job.result = { algorithm: job.algorithm, hex, bytes, inputSize };
    job.status = "done";
    job.completedAt = new Date();
    history.push(job);
    delete jobs[id];
    if (history.length > 500) history.shift();
  } catch (e) {
    job.status = "failed";
    job.error = e.message;
    job.failedAt = new Date();
    history.push(job);
    delete jobs[id];
    if (history.length > 500) history.shift();
  }
}

// Process queue every 1000ms
let intervalId = setInterval(processQueue, config.interval);

app.post("/api/jobs", (req, res) => {
  const { algorithm, input } = req.body;
  if (!["sha256", "md5"].includes(algorithm)) {
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
  const algorithms = ["sha256", "md5"];
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
  const { interval, maxQueue } = req.body;
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
  res.json(config);
});

app.get("/api/config", (req, res) => {
  res.json(config);
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", queueDepth: queue.length });
});

app.get("/api/capabilities", (req, res) => {
  res.json({ maxQueue: config.maxQueue, supportedAlgorithms: ["sha256", "md5"] });
});

app.get("/api/status", (req, res) => {
  const statusCounts = {};
  Object.values(jobs).forEach((job) => {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
  });
  res.json({ queueLength: queue.length, jobsCount: Object.keys(jobs).length, statusCounts, config });
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

// Simplified OpenAPI-like endpoint listing
function listEndpoints(app) {
  const endpoints = [];
  if (!app || !app._router || !app._router.stack) return endpoints;
  app._router.stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods || {}).filter((m) => layer.route.methods[m]);
      methods.forEach((m) => endpoints.push({ method: m.toUpperCase(), path }));
    }
  });
  // Keep only /api/* endpoints for clarity
  return endpoints.filter((e) => typeof e.path === "string" && e.path.startsWith("/api"));
}

app.get("/api/openapi", (_req, res) => {
  const endpoints = listEndpoints(app);
  const paths = endpoints.reduce((acc, e) => {
    acc[e.path] = acc[e.path] || [];
    if (!acc[e.path].includes(e.method)) acc[e.path].push(e.method);
    return acc;
  }, {});
  // Add example bodies for relevant endpoints
  const enhancedEndpoints = endpoints.map((ep) => {
    let exampleBody = null;
    if (ep.method === "POST" && ep.path === "/api/jobs") {
      exampleBody = { algorithm: "sha256", input: "hello world" };
    }
    return { ...ep, exampleBody };
  });
  res.json({
    name: "Hasher",
    basePath: "/api",
    endpoints: enhancedEndpoints,
    paths,
  });
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Hasher service running on port ${port}`);
  console.log(`Visit http://localhost:${port}/api/jobs to get jobs`);
  // list all available endpoints
  console.log(`Available endpoints:`);
  console.log(`- GET /api/jobs: Get all active jobs`);
  console.log(`- GET /api/history: Get job history`);
  console.log(`- POST /api/jobs: Submit a new job`);
  console.log(`- POST /api/jobs/dummy: Submit a random dummy job`);
  console.log(`- GET /api/jobs/:id: Get job status`);
  console.log(`- POST /api/config: Update configuration`);
  console.log(`- GET /api/config: Get current configuration`);
  console.log(`- GET /api/health: Check service health`);
  console.log(`- GET /api/capabilities: Get service capabilities`);
  console.log(`- GET /api/status: Get service status`);
  console.log(`- GET /api/openapi: List all API endpoints`);
});
