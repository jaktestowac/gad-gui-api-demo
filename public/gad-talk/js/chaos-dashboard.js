/**
 * GadTalk Chaos Dashboard
 * Visual controls for chaos mode settings with presets
 */
/* eslint-disable no-console */

(function () {
  "use strict";

  // State
  let currentConfig = null;
  let presets = {};

  // DOM Elements
  const elements = {
    chaosStatus: null,
    masterBtn: null,
    presetsContainer: null,
    configDisplay: null,
    applyBtn: null,
    resetBtn: null,
  };

  // ==================== API CALLS ====================

  async function fetchChaosConfig() {
    try {
      const res = await fetch("/api/gad-talk/admin/chaos/config");
      const json = await res.json();
      if (json.ok && json.data) {
        return json.data;
      }
      throw new Error(json.error || "Failed to fetch chaos config");
    } catch (error) {
      console.error("[ChaosDashboard] Error fetching config:", error);
      return null;
    }
  }

  async function fetchPresets() {
    try {
      const res = await fetch("/api/gad-talk/admin/chaos/presets");
      const json = await res.json();
      if (json.ok && json.data) {
        return json.data;
      }
      throw new Error(json.error || "Failed to fetch presets");
    } catch (error) {
      console.error("[ChaosDashboard] Error fetching presets:", error);
      return { presets: {}, currentConfig: null };
    }
  }

  async function updateChaosConfig(config) {
    try {
      const res = await fetch("/api/gad-talk/admin/chaos/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (json.ok && json.data) {
        return json.data;
      }
      throw new Error(json.error || "Failed to update chaos config");
    } catch (error) {
      console.error("[ChaosDashboard] Error updating config:", error);
      showNotification("Failed to update configuration", "error");
      return null;
    }
  }

  async function applyPreset(presetName) {
    try {
      const res = await fetch(`/api/gad-talk/admin/chaos/presets/${presetName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.ok && json.data) {
        showNotification(`Preset "${json.data.preset}" applied!`, "success");
        return json.data.chaos;
      }
      throw new Error(json.error || "Failed to apply preset");
    } catch (error) {
      console.error("[ChaosDashboard] Error applying preset:", error);
      showNotification("Failed to apply preset", "error");
      return null;
    }
  }

  async function toggleChaosMode(enable) {
    try {
      const endpoint = enable ? "/api/gad-talk/admin/chaos/enable" : "/api/gad-talk/admin/chaos/disable";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.ok && json.data) {
        return json.data.chaos;
      }
      throw new Error(json.error || "Failed to toggle chaos mode");
    } catch (error) {
      console.error("[ChaosDashboard] Error toggling chaos mode:", error);
      showNotification("Failed to toggle chaos mode", "error");
      return null;
    }
  }

  // ==================== UI UPDATES ====================

  function updateMasterToggle(config) {
    if (!elements.chaosStatus || !elements.masterBtn) return;

    const isEnabled = config && config.enabled;
    elements.chaosStatus.textContent = isEnabled ? "ACTIVE" : "OFF";
    elements.chaosStatus.classList.toggle("active", isEnabled);
  }

  function renderPresets(presetsData) {
    if (!elements.presetsContainer) return;

    const html = Object.entries(presetsData)
      .map(
        ([key, preset]) => `
        <div class="chaos-preset-pill" data-preset="${key}">
          <span class="icon">${preset.icon}</span>
          <span>${preset.name}</span>
        </div>
      `
      )
      .join("");

    elements.presetsContainer.innerHTML = html;

    // Add click handlers
    elements.presetsContainer.querySelectorAll(".chaos-preset-pill").forEach((el) => {
      el.addEventListener("click", async () => {
        const presetName = el.dataset.preset;
        const newConfig = await applyPreset(presetName);
        if (newConfig) {
          currentConfig = newConfig;
          updateUI(newConfig);
          highlightActivePreset(presetName);
        }
      });
    });
  }

  function highlightActivePreset(activePreset) {
    if (!elements.presetsContainer) return;
    elements.presetsContainer.querySelectorAll(".chaos-preset-pill").forEach((el) => {
      el.classList.toggle("active", el.dataset.preset === activePreset);
    });
  }

  function updateFeatureToggles(config) {
    if (!config || !config.features) return;

    // Random Delays
    const randomDelays = config.features.randomDelays || {};
    setToggle("toggle-randomDelays", randomDelays.enabled);
    setValue("randomDelays-minMs", randomDelays.minMs || 100);
    setValue("randomDelays-maxMs", randomDelays.maxMs || 3000);
    setRange("randomDelays-probability", (randomDelays.probability || 0.3) * 100);

    // Intermittent Failures
    const intermittentFailures = config.features.intermittentFailures || {};
    setToggle("toggle-intermittentFailures", intermittentFailures.enabled);
    setRange("intermittentFailures-probability", (intermittentFailures.probability || 0.05) * 100);
    setSelect("intermittentFailures-httpStatus", intermittentFailures.httpStatus || 503);

    // Partial Response Corruption
    const partialResponseCorruption = config.features.partialResponseCorruption || {};
    setToggle("toggle-partialResponseCorruption", partialResponseCorruption.enabled);
    setRange("partialResponseCorruption-probability", (partialResponseCorruption.probability || 0.05) * 100);
    setSelect("partialResponseCorruption-mode", partialResponseCorruption.mode || "dropFields");
    setValue("partialResponseCorruption-maxFieldsToDrop", partialResponseCorruption.maxFieldsToDrop || 2);
    setValue("partialResponseCorruption-truncateLength", partialResponseCorruption.truncateLength || 80);

    // Slow Endpoints
    const slowEndpoints = config.features.slowEndpoints || {};
    setToggle("toggle-slowEndpoints", slowEndpoints.enabled);
    setValue("slowEndpoints-delayMs", slowEndpoints.delayMs || 2000);
    updateEndpointCheckboxes(slowEndpoints.endpoints || []);

    // Flaky WebSocket
    const flakyWebSocket = config.features.flakyWebSocket || {};
    setToggle("toggle-flakyWebSocket", flakyWebSocket.enabled);
    setRange("flakyWebSocket-disconnectProbability", (flakyWebSocket.disconnectProbability || 0.1) * 100);
    setValue("flakyWebSocket-reconnectDelayMs", flakyWebSocket.reconnectDelayMs || 5000);

    // Feature-Flag Chaos
    const featureFlagChaos = config.features.featureFlagChaos || {};
    setToggle("toggle-featureFlagChaos", featureFlagChaos.enabled);
    setValue("featureFlagChaos-flagKey", featureFlagChaos.flagKey || "chaos_dashboard");
    setSelect("featureFlagChaos-mode", featureFlagChaos.mode || "require-enabled");
    setRange("featureFlagChaos-probability", (featureFlagChaos.probability || 0.2) * 100);
    setSelect("featureFlagChaos-httpStatus", featureFlagChaos.httpStatus || 503);
  }

  function updateScopeControls(config) {
    const scope = config?.scope || {};
    setValue("scope-allowlist", (scope.allowlist || []).join(", "));
    setValue("scope-denylist", (scope.denylist || []).join(", "));
    setValue("scope-methods", (scope.methods || []).join(", "));
  }

  function updateEndpointCheckboxes(enabledEndpoints) {
    const container = document.getElementById("slowEndpoints-list");
    if (!container) return;

    container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = enabledEndpoints.includes(cb.value);
    });
  }

  function updateConfigDisplay(config) {
    if (!elements.configDisplay) return;
    elements.configDisplay.textContent = JSON.stringify(config, null, 2);
  }

  function updateUI(config) {
    updateMasterToggle(config);
    updateFeatureToggles(config);
    updateScopeControls(config);
    updateConfigDisplay(config);
  }

  // ==================== HELPERS ====================

  function setToggle(id, enabled) {
    const el = document.getElementById(id);
    if (el) el.checked = !!enabled;
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function setRange(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.value = value;
      // Update the value display
      const valueDisplay = document.getElementById(id + "-value");
      if (valueDisplay) {
        valueDisplay.textContent = Math.round(value) + "%";
      }
    }
  }

  function setSelect(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function getToggle(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  }

  function getValue(id, type = "number") {
    const el = document.getElementById(id);
    if (!el) return 0;
    return type === "number" ? parseFloat(el.value) || 0 : el.value;
  }

  function getRange(id) {
    const el = document.getElementById(id);
    return el ? parseFloat(el.value) / 100 : 0;
  }

  function getListFromInput(id) {
    const el = document.getElementById(id);
    if (!el) return [];
    return el.value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  function getSelectedEndpoints() {
    const container = document.getElementById("slowEndpoints-list");
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map((cb) => cb.value);
  }

  function collectCurrentConfig() {
    return {
      enabled: currentConfig?.enabled ?? false,
      scope: {
        allowlist: getListFromInput("scope-allowlist"),
        denylist: getListFromInput("scope-denylist"),
        methods: getListFromInput("scope-methods").map((method) => method.toUpperCase()),
      },
      features: {
        randomDelays: {
          enabled: getToggle("toggle-randomDelays"),
          minMs: getValue("randomDelays-minMs"),
          maxMs: getValue("randomDelays-maxMs"),
          probability: getRange("randomDelays-probability"),
        },
        intermittentFailures: {
          enabled: getToggle("toggle-intermittentFailures"),
          probability: getRange("intermittentFailures-probability"),
          httpStatus: parseInt(getValue("intermittentFailures-httpStatus", "string"), 10),
        },
        partialResponseCorruption: {
          enabled: getToggle("toggle-partialResponseCorruption"),
          probability: getRange("partialResponseCorruption-probability"),
          mode: getValue("partialResponseCorruption-mode", "string"),
          maxFieldsToDrop: getValue("partialResponseCorruption-maxFieldsToDrop"),
          truncateLength: getValue("partialResponseCorruption-truncateLength"),
        },
        slowEndpoints: {
          enabled: getToggle("toggle-slowEndpoints"),
          endpoints: getSelectedEndpoints(),
          delayMs: getValue("slowEndpoints-delayMs"),
        },
        flakyWebSocket: {
          enabled: getToggle("toggle-flakyWebSocket"),
          disconnectProbability: getRange("flakyWebSocket-disconnectProbability"),
          reconnectDelayMs: getValue("flakyWebSocket-reconnectDelayMs"),
        },
        featureFlagChaos: {
          enabled: getToggle("toggle-featureFlagChaos"),
          flagKey: getValue("featureFlagChaos-flagKey", "string"),
          mode: getValue("featureFlagChaos-mode", "string"),
          probability: getRange("featureFlagChaos-probability"),
          httpStatus: parseInt(getValue("featureFlagChaos-httpStatus", "string"), 10),
        },
      },
    };
  }

  function showNotification(message, type = "info") {
    // Simple notification - could be enhanced
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      right: 16px;
      padding: 10px 16px;
      background-color: ${type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#1d9bf0"};
      color: white;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "fadeOut 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  }

  // ==================== EVENT HANDLERS ====================

  function setupEventListeners() {
    // Master toggle
    elements.masterBtn?.addEventListener("click", async () => {
      const enable = !currentConfig?.enabled;
      const newConfig = await toggleChaosMode(enable);
      if (newConfig) {
        currentConfig = newConfig;
        updateUI(newConfig);
        showNotification(enable ? "Chaos mode enabled!" : "Chaos mode disabled!", "success");
      }
    });

    // Apply button
    elements.applyBtn?.addEventListener("click", async () => {
      const config = collectCurrentConfig();
      const newConfig = await updateChaosConfig(config);
      if (newConfig) {
        currentConfig = newConfig;
        updateUI(newConfig);
        showNotification("Configuration applied!", "success");
        // Clear active preset since we customized
        highlightActivePreset(null);
      }
    });

    // Reset button
    elements.resetBtn?.addEventListener("click", async () => {
      const newConfig = await applyPreset("off");
      if (newConfig) {
        currentConfig = newConfig;
        updateUI(newConfig);
        highlightActivePreset("off");
      }
    });

    // Range sliders - update value displays
    document.querySelectorAll('input[type="range"]').forEach((range) => {
      range.addEventListener("input", () => {
        const valueDisplay = document.getElementById(range.id + "-value");
        if (valueDisplay) {
          valueDisplay.textContent = Math.round(range.value) + "%";
        }
      });
    });
  }

  // ==================== INITIALIZATION ====================

  async function init() {
    // Cache DOM elements
    elements.chaosStatus = document.getElementById("chaos-status");
    elements.masterBtn = document.getElementById("chaos-master-btn");
    elements.presetsContainer = document.getElementById("chaos-presets");
    elements.configDisplay = document.getElementById("chaos-config-json");
    elements.applyBtn = document.getElementById("apply-chaos-config");
    elements.resetBtn = document.getElementById("reset-chaos-config");

    // Fetch data
    const data = await fetchPresets();
    presets = data.presets || {};
    currentConfig = data.currentConfig || (await fetchChaosConfig());

    // Render UI
    renderPresets(presets);
    if (currentConfig) {
      updateUI(currentConfig);
    }

    // Setup event listeners
    setupEventListeners();

    console.log("[ChaosDashboard] Initialized");
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
