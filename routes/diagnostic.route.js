const { getConfigValue, setConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const { getLogs } = require("../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST } = require("../helpers/response.helpers");
const { TimeHistogramReporterJson, TimeHistogramReporterHtml } = require("../helpers/time-histogram/time-histogram");
const { TimeHistogramManager } = require("../helpers/time-histogram/time-histogram.manager");
const { logDebug } = require("../helpers/logger-api");

// Metrics collector for Prometheus
const metricsCollector = {
  requestCount: 0,
  requestsByMethod: {},
  requestsByEndpoint: {},
  errorCount: 0,
  startTime: Date.now(),

  incrementRequest(method, endpoint) {
    this.requestCount++;
    this.requestsByMethod[method] = (this.requestsByMethod[method] || 0) + 1;
    const normalizedEndpoint = endpoint.split("?")[0].replace(/\/\d+/g, "/:id");
    this.requestsByEndpoint[normalizedEndpoint] = (this.requestsByEndpoint[normalizedEndpoint] || 0) + 1;
  },

  incrementError() {
    this.errorCount++;
  },

  getUptimeSeconds() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  },

  generatePrometheusMetrics(metricsEnabled = true) {
    const lines = [];
    const prefix = "gad";

    // Metrics tracking status
    lines.push(`# HELP ${prefix}_metrics_tracking_enabled Whether metrics tracking is enabled (1=on, 0=off)`);
    lines.push(`# TYPE ${prefix}_metrics_tracking_enabled gauge`);
    lines.push(`${prefix}_metrics_tracking_enabled ${metricsEnabled ? 1 : 0}`);

    // Uptime
    lines.push(`# HELP ${prefix}_uptime_seconds The uptime of the GAD server in seconds`);
    lines.push(`# TYPE ${prefix}_uptime_seconds gauge`);
    lines.push(`${prefix}_uptime_seconds ${this.getUptimeSeconds()}`);

    // Total requests
    lines.push(`# HELP ${prefix}_http_requests_total Total number of HTTP requests`);
    lines.push(`# TYPE ${prefix}_http_requests_total counter`);
    lines.push(`${prefix}_http_requests_total ${this.requestCount}`);

    // Requests by method
    lines.push(`# HELP ${prefix}_http_requests_by_method_total HTTP requests by method`);
    lines.push(`# TYPE ${prefix}_http_requests_by_method_total counter`);
    for (const [method, count] of Object.entries(this.requestsByMethod)) {
      lines.push(`${prefix}_http_requests_by_method_total{method="${method}"} ${count}`);
    }

    // Requests by endpoint (top 20)
    lines.push(`# HELP ${prefix}_http_requests_by_endpoint_total HTTP requests by endpoint`);
    lines.push(`# TYPE ${prefix}_http_requests_by_endpoint_total counter`);
    const sortedEndpoints = Object.entries(this.requestsByEndpoint)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    for (const [endpoint, count] of sortedEndpoints) {
      lines.push(`${prefix}_http_requests_by_endpoint_total{endpoint="${endpoint}"} ${count}`);
    }

    // Error count
    lines.push(`# HELP ${prefix}_http_errors_total Total number of HTTP errors`);
    lines.push(`# TYPE ${prefix}_http_errors_total counter`);
    lines.push(`${prefix}_http_errors_total ${this.errorCount}`);

    // Memory usage
    const memUsage = process.memoryUsage();
    lines.push(`# HELP ${prefix}_memory_heap_used_bytes Heap memory used in bytes`);
    lines.push(`# TYPE ${prefix}_memory_heap_used_bytes gauge`);
    lines.push(`${prefix}_memory_heap_used_bytes ${memUsage.heapUsed}`);

    lines.push(`# HELP ${prefix}_memory_heap_total_bytes Total heap memory in bytes`);
    lines.push(`# TYPE ${prefix}_memory_heap_total_bytes gauge`);
    lines.push(`${prefix}_memory_heap_total_bytes ${memUsage.heapTotal}`);

    lines.push(`# HELP ${prefix}_memory_rss_bytes Resident set size in bytes`);
    lines.push(`# TYPE ${prefix}_memory_rss_bytes gauge`);
    lines.push(`${prefix}_memory_rss_bytes ${memUsage.rss}`);

    lines.push(`# HELP ${prefix}_memory_external_bytes External memory in bytes`);
    lines.push(`# TYPE ${prefix}_memory_external_bytes gauge`);
    lines.push(`${prefix}_memory_external_bytes ${memUsage.external}`);

    return lines.join("\n");
  },
};

const diagnosticRoutes = (req, res, next) => {
  // Track all requests for metrics (only if enabled)
  if (getConfigValue(ConfigKeys.METRICS_TRACKING_ENABLED) === true) {
    metricsCollector.incrementRequest(req.method, req.url);
  }

  // Track errors (only if metrics enabled)
  if (getConfigValue(ConfigKeys.METRICS_TRACKING_ENABLED) === true) {
    res.on("finish", () => {
      if (res.statusCode >= 400) {
        metricsCollector.incrementError();
      }
    });
  }

  function afterFinishResponse() {
    const timeHistogramManager = TimeHistogramManager.getInstance();
    timeHistogramManager.stopAction(`${req.method} ${req.url}`);
  }
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  // Prometheus metrics endpoint
  if (req.method === "GET" && urlEnds.includes("api/metrics")) {
    const metricsEnabled = getConfigValue(ConfigKeys.METRICS_TRACKING_ENABLED);
    const metrics = metricsCollector.generatePrometheusMetrics(metricsEnabled);
    res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    res.status(HTTP_OK).send(metrics);
    return;
  }

  // Toggle metrics tracking endpoint
  if (req.method === "GET" && urlEnds.includes("api/diagnostic/toggle-metrics")) {
    const metricsTrackingEnabled = setConfigValue(
      ConfigKeys.METRICS_TRACKING_ENABLED,
      !getConfigValue(ConfigKeys.METRICS_TRACKING_ENABLED)
    );
    logDebug("Changing metrics tracking", { metricsTrackingEnabled });
    res.status(HTTP_OK).json({ metricsTrackingEnabled });
    return;
  }

  if (req.method === "GET" && urlEnds.includes("api/diagnostic/toggle-diagnostics")) {
    const diagnosticsEnabled = setConfigValue(
      ConfigKeys.DIAGNOSTICS_ENABLED,
      !getConfigValue(ConfigKeys.DIAGNOSTICS_ENABLED)
    );
    const logsEnabled = setConfigValue(ConfigKeys.PUBLIC_LOGS_ENABLED, !getConfigValue(ConfigKeys.PUBLIC_LOGS_ENABLED));
    logDebug("Changing diagnostic logs", { diagnosticsEnabled, logsEnabled });
    res.status(HTTP_OK).json({ diagnosticsEnabled, logsEnabled });
    return;
  }
  if (req.method === "GET" && urlEnds.includes("api/diagnostic/toggle-logs")) {
    const logsEnabled = setConfigValue(ConfigKeys.PUBLIC_LOGS_ENABLED, !getConfigValue(ConfigKeys.PUBLIC_LOGS_ENABLED));
    res.status(HTTP_OK).json({ logsEnabled });
    return;
  }
  if (req.method === "GET" && urlEnds.includes("api/diagnostic/log-level")) {
    const logLevel = getConfigValue(ConfigKeys.CURRENT_LOG_LEVEL);
    res.status(HTTP_OK).json({ logLevel });
    return;
  }
  if (req.method === "POST" && urlEnds.includes("api/diagnostic/log-level")) {
    const level = req.body?.level;
    logDebug("Changing log level", { level });
    if (level) {
      setConfigValue(ConfigKeys.CURRENT_LOG_LEVEL, level);
      res.status(HTTP_OK).json({ level });
    } else {
      res.status(HTTP_BAD_REQUEST).json({ error: "Level not provided" });
    }
    return;
  }
  if (req.method === "GET" && urlEnds.includes("api/logs")) {
    if (getConfigValue(ConfigKeys.PUBLIC_LOGS_ENABLED)) {
      res.status(HTTP_OK).json({ logs: getLogs() });
    } else {
      res.status(HTTP_OK).json({});
    }
    return;
  }
  if (getConfigValue(ConfigKeys.DIAGNOSTICS_ENABLED) === true) {
    if (req.method === "GET" && urlEnds.includes("api/diagnostic/request/histogram")) {
      const timeHistogramManager = TimeHistogramManager.getInstance();
      const timeHistogram = timeHistogramManager.getActionsTimeHistogram();
      const histogram = new TimeHistogramReporterJson(timeHistogram).getReport();
      res.status(HTTP_OK).json(histogram);
      return;
    } else if (req.method === "GET" && urlEnds.includes("diagnostic/request/histogram")) {
      const timeHistogramManager = TimeHistogramManager.getInstance();
      const timeHistogram = timeHistogramManager.getActionsTimeHistogram();
      const histogram = new TimeHistogramReporterHtml(timeHistogram).getReport();
      res.send(histogram);
      return;
    }
    const timeHistogramManager = TimeHistogramManager.getInstance();
    timeHistogramManager.startAction(`${req.method} ${req.url}`);

    res.on("finish", afterFinishResponse);
  }

  if (res.headersSent !== true) {
    next();
  }
};

exports.diagnosticRoutes = diagnosticRoutes;
