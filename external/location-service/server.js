// Time & Date Service
// Calculate dates, times, timezones, and astronomical data (sunrise/sunset) for locations
// Features: Date calculations, timezone conversions, sunrise/sunset times, business days, date arithmetic

const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3124;

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

// Service Configuration
const CONFIG = {
  serviceName: "LocationService",
  version: "1.0.0",
  enableDiagnostics: false,
  maxBatchCalculations: 50,
  supportedTimezones: [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Europe/Warsaw",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Australia/Sydney",
    "Pacific/Auckland",
  ],
  defaultTimezone: "UTC",
};

// Service State
const STATE = {
  startTime: new Date(),
  requestCount: 0,
  errorCount: 0,
  lastError: null,
  calculationsPerformed: 0,
  sunriseCalculations: 0,
  timezoneConversions: 0,
};

// Request counter middleware
app.use((req, res, next) => {
  STATE.requestCount++;
  next();
});

// Error handler middleware
app.use((err, req, res) => {
  STATE.errorCount++;
  STATE.lastError = {
    message: err.message,
    timestamp: new Date(),
    path: req.path,
  };
  // eslint-disable-next-line no-console
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

/* ===== ASTRONOMICAL CALCULATIONS ===== */

// Calculate sunrise and sunset times for a given date and location
function calculateSunriseSunset(date, latitude, longitude) {
  // Julian Day calculation
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  const julianDay =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // Number of days since J2000.0
  const n = julianDay - 2451545.0 + 0.0008;

  // Mean solar time
  const J_star = n - longitude / 360;

  // Solar mean anomaly
  const M = (357.5291 + 0.98560028 * J_star) % 360;
  const M_rad = (M * Math.PI) / 180;

  // Equation of center
  const C = 1.9148 * Math.sin(M_rad) + 0.02 * Math.sin(2 * M_rad) + 0.0003 * Math.sin(3 * M_rad);

  // Ecliptic longitude
  const lambda = (M + C + 180 + 102.9372) % 360;
  const lambda_rad = (lambda * Math.PI) / 180;

  // Solar transit
  const J_transit = 2451545.0 + J_star + 0.0053 * Math.sin(M_rad) - 0.0069 * Math.sin(2 * lambda_rad);

  // Declination of the Sun
  const sin_delta = Math.sin(lambda_rad) * Math.sin((23.44 * Math.PI) / 180);
  const delta = Math.asin(sin_delta);

  // Hour angle
  const lat_rad = (latitude * Math.PI) / 180;
  const cos_omega =
    (Math.sin((-0.833 * Math.PI) / 180) - Math.sin(lat_rad) * sin_delta) / (Math.cos(lat_rad) * Math.cos(delta));

  // Check if sun never rises or never sets
  if (cos_omega > 1) {
    return {
      sunrise: null,
      sunset: null,
      transit: julianDayToDate(J_transit),
      solarNoon: julianDayToDate(J_transit),
      dayLength: 0,
      note: "Polar night - sun does not rise",
    };
  }

  if (cos_omega < -1) {
    return {
      sunrise: null,
      sunset: null,
      transit: julianDayToDate(J_transit),
      solarNoon: julianDayToDate(J_transit),
      dayLength: 24 * 60,
      note: "Midnight sun - sun does not set",
    };
  }

  const omega = (Math.acos(cos_omega) * 180) / Math.PI;

  // Calculate sunrise and sunset
  const J_rise = J_transit - omega / 360;
  const J_set = J_transit + omega / 360;

  const sunrise = julianDayToDate(J_rise);
  const sunset = julianDayToDate(J_set);
  const solarNoon = julianDayToDate(J_transit);

  // Calculate day length in minutes (more precise calculation)
  // Using actual time difference for accuracy
  const dayLengthFromTimes = (sunset.getTime() - sunrise.getTime()) / (1000 * 60);
  const dayLength = dayLengthFromTimes;

  return {
    sunrise: sunrise.toISOString(),
    sunset: sunset.toISOString(),
    solarNoon: solarNoon.toISOString(),
    transit: solarNoon.toISOString(),
    dayLength: Math.round(dayLength),
    dayLengthHuman: formatMinutes(dayLength),
    civilTwilight: {
      dawn: julianDayToDate(J_rise - 0.0347).toISOString(), // ~50 minutes before sunrise
      dusk: julianDayToDate(J_set + 0.0347).toISOString(),
    },
  };
}

// Convert Julian Day to JavaScript Date
function julianDayToDate(jd) {
  const milliseconds = (jd - 2440587.5) * 86400000;
  return new Date(milliseconds);
}

// Format minutes to human-readable duration
function formatMinutes(minutes) {
  let hours = Math.floor(minutes / 60);
  let mins = Math.round(minutes % 60);

  // Handle case where rounding minutes gives 60
  if (mins === 60) {
    hours += 1;
    mins = 0;
  }

  return `${hours}h ${mins}m`;
}

/* ===== TIMEZONE UTILITIES ===== */

// Get current time in a specific timezone
function getTimeInTimezone(date, timezone) {
  try {
    const options = {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(date);

    const dateParts = {};
    parts.forEach((part) => {
      dateParts[part.type] = part.value;
    });

    return {
      timezone: timezone,
      date: `${dateParts.year}-${dateParts.month}-${dateParts.day}`,
      time: `${dateParts.hour}:${dateParts.minute}:${dateParts.second}`,
      iso: date.toLocaleString("en-US", { timeZone: timezone }),
      timestamp: date.getTime(),
      offset: getTimezoneOffset(date, timezone),
    };
  } catch (error) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
}

// Get timezone offset in hours
function getTimezoneOffset(date, timezone) {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  return offset;
}

/* ===== DATE ARITHMETIC ===== */

// Add/subtract time units from a date
function addToDate(date, amount, unit) {
  const newDate = new Date(date);

  switch (unit) {
    case "seconds":
      newDate.setSeconds(newDate.getSeconds() + amount);
      break;
    case "minutes":
      newDate.setMinutes(newDate.getMinutes() + amount);
      break;
    case "hours":
      newDate.setHours(newDate.getHours() + amount);
      break;
    case "days":
      newDate.setDate(newDate.getDate() + amount);
      break;
    case "weeks":
      newDate.setDate(newDate.getDate() + amount * 7);
      break;
    case "months":
      newDate.setMonth(newDate.getMonth() + amount);
      break;
    case "years":
      newDate.setFullYear(newDate.getFullYear() + amount);
      break;
    default:
      throw new Error(`Invalid unit: ${unit}`);
  }

  return newDate;
}

// Calculate difference between two dates
function dateDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  const diffMs = Math.abs(d2 - d1);
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  // Calculate approximate months and years
  const yearDiff = d2.getFullYear() - d1.getFullYear();
  const monthDiff = d2.getMonth() - d1.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff;

  return {
    milliseconds: diffMs,
    seconds: diffSeconds,
    minutes: diffMinutes,
    hours: diffHours,
    days: diffDays,
    weeks: diffWeeks,
    months: Math.abs(totalMonths),
    years: Math.abs(yearDiff),
    human: formatDuration(diffMs),
  };
}

// Format duration to human-readable string
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);

  if (years > 0) {
    const remainingDays = days % 365;
    return `${years} year${years > 1 ? "s" : ""}, ${remainingDays} day${remainingDays !== 1 ? "s" : ""}`;
  }
  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days} day${days > 1 ? "s" : ""}, ${remainingHours} hour${remainingHours !== 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? "s" : ""}, ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes} minute${minutes > 1 ? "s" : ""}, ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
  }
  return `${seconds} second${seconds !== 1 ? "s" : ""}`;
}

// Calculate business days between two dates
function calculateBusinessDays(startDate, endDate, holidays = []) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let businessDays = 0;
  const current = new Date(start);

  const holidaySet = new Set(holidays.map((h) => new Date(h).toDateString()));

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(current.toDateString());

    if (!isWeekend && !isHoliday) {
      businessDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return businessDays;
}

/* ===== STANDARD ENDPOINTS ===== */

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
    uptime: Math.floor(uptime / 1000),
    timestamp: new Date().toISOString(),
    service: CONFIG.serviceName,
    version: CONFIG.version,
  });
});

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
      calculationsPerformed: STATE.calculationsPerformed,
      sunriseCalculations: STATE.sunriseCalculations,
      timezoneConversions: STATE.timezoneConversions,
    },
    lastError: STATE.lastError,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/capabilities", (req, res) => {
  const endpoints = listEndpoints(app);
  const endpointStrings = endpoints.map((ep) => `${ep.method} ${ep.path}`);

  res.json({
    service: CONFIG.serviceName,
    version: CONFIG.version,
    features: [
      "current-time-by-timezone",
      "timezone-conversion",
      "sunrise-sunset-calculation",
      "date-arithmetic",
      "date-difference-calculation",
      "business-days-calculation",
      "unix-timestamp-conversion",
      "batch-calculations",
    ],
    endpoints: endpointStrings,
    supportedTimezones: CONFIG.supportedTimezones,
    limits: {
      maxBatchCalculations: CONFIG.maxBatchCalculations,
    },
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/config", (req, res) => {
  res.json({
    config: CONFIG,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/config", (req, res) => {
  const updates = req.body || {};
  const allowedKeys = ["enableDiagnostics", "maxBatchCalculations"];
  const updated = [];
  const errors = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unknown config key: ${key}`);
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

app.get("/api/openapi", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json({
    openapi: "3.0.0",
    info: {
      title: CONFIG.serviceName,
      version: CONFIG.version,
      description: "Time & Date service for calculations, timezone conversions, and astronomical data",
    },
    basePath: "/api",
    endpoints: endpoints,
    timestamp: new Date().toISOString(),
  });
});

/* ===== CUSTOM SERVICE ENDPOINTS ===== */

// Get current time in specified timezone(s)
app.get("/api/current-time", (req, res) => {
  const { timezone, timezones } = req.query;

  try {
    const now = new Date();

    if (timezones) {
      // Multiple timezones
      const tzArray = timezones.split(",").map((tz) => tz.trim());
      const results = tzArray.map((tz) => {
        try {
          return getTimeInTimezone(now, tz);
        } catch (error) {
          return { timezone: tz, error: error.message };
        }
      });

      STATE.timezoneConversions += tzArray.length;

      return res.json({
        timezones: results,
        utc: now.toISOString(),
        timestamp: now.getTime(),
      });
    }

    const tz = timezone || CONFIG.defaultTimezone;
    const result = getTimeInTimezone(now, tz);

    STATE.timezoneConversions++;

    res.json({
      ...result,
      utc: now.toISOString(),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Calculate time in specific location/timezone
app.post("/api/time-in-location", (req, res) => {
  const { date, timezone, location } = req.body;

  try {
    const targetDate = date ? new Date(date) : new Date();

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const tz = timezone || CONFIG.defaultTimezone;
    const result = getTimeInTimezone(targetDate, tz);

    STATE.timezoneConversions++;
    STATE.calculationsPerformed++;

    res.json({
      ...result,
      location: location || tz,
      utc: targetDate.toISOString(),
      requestedDate: date || "now",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Calculate sunrise and sunset for a location and date
app.post("/api/sunrise-sunset", (req, res) => {
  const { date, latitude, longitude, timezone } = req.body;

  try {
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: "Missing required fields: latitude and longitude",
        example: {
          date: "2025-09-29",
          latitude: 52.2297,
          longitude: 21.0122,
          timezone: "Europe/Warsaw",
        },
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: "Latitude must be between -90 and 90" });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "Longitude must be between -180 and 180" });
    }

    const targetDate = date ? new Date(date) : new Date();

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const tz = timezone || CONFIG.defaultTimezone;
    const result = calculateSunriseSunset(targetDate, latitude, longitude);

    STATE.sunriseCalculations++;
    STATE.calculationsPerformed++;

    res.json({
      date: targetDate.toISOString().split("T")[0],
      location: {
        latitude,
        longitude,
        timezone: tz,
      },
      ...result,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Batch sunrise/sunset calculations
app.post("/api/sunrise-sunset/batch", (req, res) => {
  const { locations, date } = req.body;

  try {
    if (!locations || !Array.isArray(locations)) {
      return res.status(400).json({ error: "Missing required field: locations (array)" });
    }

    if (locations.length > CONFIG.maxBatchCalculations) {
      return res.status(400).json({
        error: `Batch size exceeds maximum of ${CONFIG.maxBatchCalculations}`,
      });
    }

    const targetDate = date ? new Date(date) : new Date();

    const results = locations.map((loc, index) => {
      try {
        const { latitude, longitude, timezone, name } = loc;

        if (latitude === undefined || longitude === undefined) {
          return {
            index,
            name: name || `Location ${index + 1}`,
            error: "Missing latitude or longitude",
          };
        }

        const result = calculateSunriseSunset(targetDate, latitude, longitude);

        STATE.sunriseCalculations++;

        return {
          index,
          name: name || `Location ${index + 1}`,
          location: { latitude, longitude, timezone: timezone || CONFIG.defaultTimezone },
          ...result,
        };
      } catch (error) {
        return {
          index,
          error: error.message,
        };
      }
    });

    STATE.calculationsPerformed += locations.length;

    res.json({
      date: targetDate.toISOString().split("T")[0],
      count: locations.length,
      results,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Date arithmetic - add/subtract time from a date
app.post("/api/date-arithmetic", (req, res) => {
  const { date, operation, amount, unit } = req.body;

  try {
    if (!amount || !unit) {
      return res.status(400).json({
        error: "Missing required fields: amount and unit",
        supportedUnits: ["seconds", "minutes", "hours", "days", "weeks", "months", "years"],
      });
    }

    const startDate = date ? new Date(date) : new Date();

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const operationAmount = operation === "subtract" ? -amount : amount;
    const resultDate = addToDate(startDate, operationAmount, unit);

    STATE.calculationsPerformed++;

    res.json({
      startDate: startDate.toISOString(),
      operation: operation || "add",
      amount,
      unit,
      resultDate: resultDate.toISOString(),
      difference: dateDifference(startDate, resultDate),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Calculate difference between two dates
app.post("/api/date-difference", (req, res) => {
  const { date1, date2 } = req.body;

  try {
    if (!date1 || !date2) {
      return res.status(400).json({ error: "Missing required fields: date1 and date2" });
    }

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const difference = dateDifference(d1, d2);

    STATE.calculationsPerformed++;

    res.json({
      date1: d1.toISOString(),
      date2: d2.toISOString(),
      difference,
      laterDate: d2 > d1 ? "date2" : "date1",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Calculate business days between dates
app.post("/api/business-days", (req, res) => {
  const { startDate, endDate, holidays } = req.body;

  try {
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields: startDate and endDate" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const businessDays = calculateBusinessDays(start, end, holidays || []);
    const totalDays = dateDifference(start, end).days + 1;

    STATE.calculationsPerformed++;

    res.json({
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      businessDays,
      totalDays,
      weekendDays: totalDays - businessDays,
      holidays: holidays || [],
      holidayCount: (holidays || []).length,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Convert Unix timestamp
app.get("/api/unix-timestamp", (req, res) => {
  const { timestamp, timezone } = req.query;

  try {
    if (timestamp) {
      const ts = parseInt(timestamp);
      if (isNaN(ts)) {
        return res.status(400).json({ error: "Invalid timestamp" });
      }

      const date = new Date(ts);
      const tz = timezone || CONFIG.defaultTimezone;

      res.json({
        timestamp: ts,
        iso: date.toISOString(),
        ...getTimeInTimezone(date, tz),
        human: date.toUTCString(),
      });
    } else {
      const now = new Date();
      res.json({
        timestamp: now.getTime(),
        iso: now.toISOString(),
        human: now.toUTCString(),
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List supported timezones
app.get("/api/timezones", (req, res) => {
  res.json({
    timezones: CONFIG.supportedTimezones,
    count: CONFIG.supportedTimezones.length,
    default: CONFIG.defaultTimezone,
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
        endpoints.push({
          method: method.toUpperCase(),
          path,
        });
      });
    }
  });

  return endpoints.filter((ep) => typeof ep.path === "string" && ep.path.startsWith("/api"));
}

/* ===== SERVER STARTUP ===== */

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 ${CONFIG.serviceName} v${CONFIG.version} running on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`📊 Visit http://localhost:${PORT}/api/status for service status`);
  // eslint-disable-next-line no-console
  console.log(`🏥 Visit http://localhost:${PORT}/api/health for health check`);
  // eslint-disable-next-line no-console
  console.log(`📖 Visit http://localhost:${PORT}/api/capabilities for API info`);
  // eslint-disable-next-line no-console
  console.log(`📜 Visit http://localhost:${PORT}/ for HTML interface`);
  // eslint-disable-next-line no-console
  console.log("");

  const endpoints = listEndpoints(app);
  const customEndpoints = endpoints.filter(
    (ep) =>
      !["/api/ping", "/api/health", "/api/status", "/api/capabilities", "/api/config", "/api/openapi"].includes(ep.path)
  );

  if (customEndpoints.length > 0) {
    // eslint-disable-next-line no-console
    console.log("Available endpoints:");
    customEndpoints.forEach((ep) => {
      // eslint-disable-next-line no-console
      console.log(`  - ${ep.method.padEnd(4)} ${ep.path}`);
    });
    // eslint-disable-next-line no-console
    console.log("");
  }

  // eslint-disable-next-line no-console
  console.log(`🌍 Supported timezones: ${CONFIG.supportedTimezones.length}`);
  // eslint-disable-next-line no-console
  console.log("🎯 Ready to serve requests!");
});

process.on("SIGTERM", () => {
  // eslint-disable-next-line no-console
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  // eslint-disable-next-line no-console
  console.log("🛑 SIGINT received, shutting down gracefully");
  process.exit(0);
});
