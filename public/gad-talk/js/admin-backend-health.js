(function () {
  "use strict";

  function formatBytes(bytes) {
    if (bytes === undefined || bytes === null) return "-";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function renderHealth(obj) {
    // support responses like { ok, data: { ... } } from /api/health and older shapes
    const data = obj.data || obj.health || obj;

    const lines = [];
    if (obj.ok !== undefined) lines.push("OK: " + (obj.ok ? "yes" : "no"));
    if (data.status) lines.push("Status: " + data.status);

    const timestamp = data.timestamp || obj.timestamp || data.metrics?.timestamp;
    if (timestamp) lines.push("Timestamp: " + new Date(timestamp).toLocaleString());

    // Uptime (prefer detailed uptimeTotal if available)
    if (data.uptimeTotal) {
      const d = Math.floor(data.uptimeTotal.days || 0);
      const h = Math.floor((data.uptimeTotal.hours || 0) % 24);
      const m = Math.floor((data.uptimeTotal.minutes || 0) % 60);
      const s = Math.floor((data.uptimeTotal.seconds || 0) % 60);
      lines.push(`Uptime: ${d}d ${h}h ${m}m ${s}s`);
    } else {
      const uptime = data.uptimeSeconds ?? data.metrics?.uptimeSeconds ?? obj.uptimeSeconds ?? data.uptime;
      if (uptime !== undefined) lines.push("Uptime: " + Math.floor(uptime) + "s");
    }

    // Memory (detailed)
    const mem = data.metrics?.system?.memory || data.system?.memory || data.memory || data.memoryUsageMB;

    function firstNumeric(o, keys) {
      if (!o || typeof o !== "object") return undefined;
      for (const k of keys) {
        if (o[k] !== undefined && typeof o[k] === "number") return o[k];
      }
      return undefined;
    }

    const rssMB =
      typeof mem === "number" ? mem : firstNumeric(mem, ["rssMemoryMB", "rssMB", "rss", "rss_mem", "rss_memory"]);
    const heapUsedMB = firstNumeric(mem, ["heapUsedMB", "heapUsed", "heap_used"]);
    const heapTotalMB = firstNumeric(mem, ["heapTotalMB", "heapTotal", "heap_total"]);
    const externalMB = firstNumeric(mem, ["externalMB", "external"]);

    if (rssMB !== undefined) lines.push("Memory (RSS): " + rssMB + " MB");
    if (heapUsedMB !== undefined) lines.push("Heap used: " + heapUsedMB + " MB");
    if (heapTotalMB !== undefined) lines.push("Heap total: " + heapTotalMB + " MB");
    if (externalMB !== undefined) lines.push("External: " + externalMB + " MB");

    if (!rssMB && !heapUsedMB && mem && typeof mem === "object") {
      const numericFields = Object.entries(mem).filter(([, v]) => typeof v === "number");
      if (numericFields.length > 0) {
        const mapped = numericFields
          .map(([k, v]) =>
            k.toLowerCase().includes("bytes")
              ? `${k}=${formatBytes(v)}`
              : `${k}=${Math.round(v * 100) / 100}${
                  k.toLowerCase().includes("mb") || k.toLowerCase().includes("rss") ? " MB" : ""
                }`
          )
          .join(", ");
        lines.push("Memory: " + mapped);
      } else {
        lines.push("Memory: " + JSON.stringify(mem));
      }
    }

    // CPU (if provided)
    const cpu = data.metrics?.system?.cpu || data.system?.cpu || data.cpu;
    if (cpu && typeof cpu === "object") {
      const user = cpu.userMs ?? cpu.user ?? cpu.user_us;
      const system = cpu.systemMs ?? cpu.system ?? cpu.system_us;
      if (typeof user === "number" || typeof system === "number") {
        const userMs = typeof user === "number" ? Math.round((user / 1000) * 100) / 100 : undefined;
        const systemMs = typeof system === "number" ? Math.round((system / 1000) * 100) / 100 : undefined;
        const parts = [];
        if (userMs !== undefined) parts.push(`user ${userMs} ms`);
        if (systemMs !== undefined) parts.push(`system ${systemMs} ms`);
        if (parts.length) lines.push("CPU: " + parts.join(", "));
      }
    }

    // Database info
    if (data.metrics?.database && typeof data.metrics.database === "object") {
      const col = data.metrics.database;
      lines.push("DB collections: " + Object.keys(col).length);
      const sample = Object.entries(col)
        .slice(0, 5)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      if (sample) lines.push("DB sample: " + sample);
    } else if (obj.dbProblems) {
      lines.push("DB problems: " + obj.dbProblems.length);
      if (obj.dbProblems.length && obj.dbProblems[0].message) lines.push("DB issue: " + obj.dbProblems[0].message);
    }

    // Config/Backend problems
    if (obj.configProblems && obj.configProblems.length)
      lines.push(
        "Config problems: " +
          obj.configProblems.length +
          (obj.configProblems[0].error ? " (" + obj.configProblems[0].error + ")" : "")
      );
    if (obj.backendProblems && obj.backendProblems.length)
      lines.push(
        "Backend problems: " +
          obj.backendProblems.length +
          (obj.backendProblems[0].message ? " (" + obj.backendProblems[0].message + ")" : "")
      );

    // Chaos and feature flags
    if (data.chaos)
      lines.push(
        "Chaos enabled: " +
          (data.chaos.enabled ? "yes" : "no") +
          (data.chaos.activeFeatureCount !== undefined ? " (" + data.chaos.activeFeatureCount + " features)" : "")
      );
    if (data.featureFlags && typeof data.featureFlags === "object") {
      const flags = Object.keys(data.featureFlags);
      const enabled = flags.filter((k) => data.featureFlags[k]);
      lines.push(`Feature flags: ${enabled.length} enabled (${enabled.slice(0, 5).join(", ")})`);
    }

    // Fallback: show whole JSON if nothing obvious
    const summary = lines.length ? lines.join("\n") : JSON.stringify(obj, null, 2);
    return { summary, raw: obj };
  }

  function init() {
    const btn = document.getElementById("load-health-btn");
    const out = document.getElementById("health-summary");
    if (!btn || !out) return;

    btn.addEventListener("click", async function () {
      btn.disabled = true;
      const original = btn.innerHTML;
      btn.innerHTML = "Loading…";
      out.style.display = "none";
      out.style.color = "";
      try {
        const r = await fetch("/api/health");
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "HTTP " + r.status);
        const result = renderHealth(json);
        // Render compact summary and attach a toggle to show full JSON
        out.innerHTML = "";
        const pre = document.createElement("pre");
        pre.textContent = result.summary;
        pre.style.whiteSpace = "pre-wrap";
        pre.style.fontFamily = "monospace";
        pre.style.margin = "0";
        out.appendChild(pre);

        const btnToggle = document.createElement("button");
        btnToggle.className = "gt-back-button";
        btnToggle.style.marginTop = "10px";
        btnToggle.textContent = "Show full JSON";
        out.appendChild(btnToggle);

        const rawPre = document.createElement("pre");
        rawPre.textContent = JSON.stringify(result.raw, null, 2);
        rawPre.style.display = "none";
        rawPre.style.marginTop = "8px";
        rawPre.style.background = "rgba(255,255,255,0.03)";
        rawPre.style.padding = "12px";
        rawPre.style.borderRadius = "8px";
        rawPre.style.whiteSpace = "pre-wrap";
        rawPre.style.fontFamily = "monospace";
        out.appendChild(rawPre);

        btnToggle.addEventListener("click", function () {
          if (rawPre.style.display === "none") {
            rawPre.style.display = "block";
            btnToggle.textContent = "Hide full JSON";
          } else {
            rawPre.style.display = "none";
            btnToggle.textContent = "Show full JSON";
          }
        });

        out.style.display = "block";
        out.scrollIntoView({ behavior: "smooth", block: "end" });
      } catch (err) {
        out.style.display = "block";
        out.textContent = "Error fetching health: " + (err.message || err);
        out.style.color = "#ff6666";
      } finally {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
