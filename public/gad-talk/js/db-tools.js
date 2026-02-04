(() => {
  const output = document.getElementById("db-tools-output");
  if (!output) return;

  const setOutput = (data) => {
    output.style.display = "block";
    output.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  };

  // -------------------- Custom confirmation modal --------------------
  function injectModalStyles() {
    if (document.getElementById("db-tools-modal-style")) return;
    const style = document.createElement("style");
    style.id = "db-tools-modal-style";
    style.textContent = `
      #gt-modal-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.6);
        z-index: 9999;
      }
      #gt-modal {
        background: #0b0c0d;
        color: #e7e9ea;
        border-radius: 12px;
        max-width: 520px;
        width: calc(100% - 48px);
        padding: 18px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        border: 1px solid rgba(255,255,255,0.04);
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      }
      #gt-modal-message { margin-bottom: 14px; font-size: 14px; color: #cbd5df; line-height: 1.4; }
      #gt-modal-actions { display:flex; gap:10px; justify-content:flex-end; }
      #gt-modal-actions button { padding: 8px 12px; border-radius: 8px; border: none; cursor:pointer; font-weight:600; }
      #gt-modal-cancel { background: #1f2937; color: #9ca3af; }
      #gt-modal-confirm { background: linear-gradient(135deg,#1d9bf0 0%,#0c7abf 100%); color: #fff; }
    `;
    document.head.appendChild(style);
  }

  function showConfirmModal(message, confirmLabel = "Confirm", cancelLabel = "Cancel") {
    return new Promise((resolve) => {
      injectModalStyles();

      // If overlay exists, remove it first (cleanup)
      const existing = document.getElementById("gt-modal-overlay");
      if (existing) existing.remove();

      const overlay = document.createElement("div");
      overlay.id = "gt-modal-overlay";

      overlay.innerHTML = `
        <div id="gt-modal" role="dialog" aria-modal="true">
          <div id="gt-modal-message"></div>
          <div id="gt-modal-actions">
            <button id="gt-modal-cancel" type="button">${cancelLabel}</button>
            <button id="gt-modal-confirm" type="button">${confirmLabel}</button>
          </div>
        </div>`;

      document.body.appendChild(overlay);

      const msgEl = overlay.querySelector("#gt-modal-message");
      const confBtn = overlay.querySelector("#gt-modal-confirm");
      const cancelBtn = overlay.querySelector("#gt-modal-cancel");

      msgEl.textContent = message;

      function cleanup(result) {
        confBtn.removeEventListener("click", onConfirm);
        cancelBtn.removeEventListener("click", onCancel);
        overlay.removeEventListener("click", onOverlayClick);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }

      function onConfirm(e) {
        cleanup(true);
      }
      function onCancel(e) {
        cleanup(false);
      }
      function onOverlayClick(e) {
        if (e.target === overlay) cleanup(false);
      }

      confBtn.addEventListener("click", onConfirm);
      cancelBtn.addEventListener("click", onCancel);
      overlay.addEventListener("click", onOverlayClick);

      // Focus confirm button for keyboard users
      confBtn.focus();
    });
  }

  // --------------------------------------------------------------------

  const actions = {
    "gad-restore-default": { method: "POST", url: "/api/gad-talk/admin/restore-db", body: { dataset: "default" } },
    "gad-restore-demo": { method: "POST", url: "/api/gad-talk/admin/restore-db", body: { dataset: "demo" } },
    "gad-reset-demo": { method: "POST", url: "/api/gad-talk/admin/reset-db" },
    "gad-seed-demo": { method: "POST", url: "/api/gad-talk/admin/seed-demo-data" },
    "gad-init": { method: "POST", url: "/api/gad-talk/admin/init-db" },
    "gad-status": { method: "GET", url: "/api/gad-talk/admin/db-status" },
  };

  const handleActionClick = async (event) => {
    const button = event.currentTarget;
    const key = button.getAttribute("data-action");
    const action = actions[key];
    if (!action) return;

    const confirmMessage = button.getAttribute("data-confirm");
    if (confirmMessage) {
      // Use a simple custom modal instead of window.confirm
      const originalLabel = button.getAttribute("data-label") || button.textContent;
      const userConfirmed = await showConfirmModal(confirmMessage, originalLabel, "Cancel");
      if (!userConfirmed) return;
    }

    const originalLabel = button.getAttribute("data-label") || button.textContent;
    button.textContent = "Working...";
    button.disabled = true;

    try {
      const options = { method: action.method };
      if (action.body) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(action.body);
      }

      const response = await fetch(action.url, options);
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json") ? await response.json() : await response.text();
      setOutput(payload);
    } catch (err) {
      setOutput({ error: err.message || "Request failed" });
    } finally {
      button.textContent = originalLabel;
      button.disabled = false;
    }
  };

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", handleActionClick);
  });
})();
