// Lightweight Toast Module for BugHatch
// Provides window.bhToast.show(message, { type, timeout, dismissible })
// Types: info (default), success, warn, error
// Usage: window.bhToast.show('Saved!', { type: 'success', timeout: 4000 })
(function () {
  const TYPES = ["info", "success", "warn", "error"];
  const DEFAULT_TIMEOUT = 5000;

  function ensureLayer() {
    let layer = document.querySelector(".bh-toast-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "bh-toast-layer";
      document.body.appendChild(layer);
    }
    return layer;
  }

  function buildToast(message, opts) {
    const { type = "info", timeout = DEFAULT_TIMEOUT, dismissible = true } = opts || {};
    const layer = ensureLayer();
    const toast = document.createElement("div");
    const t = TYPES.includes(type) ? type : "info";
    toast.className = `bh-toast bh-toast-${t}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    const msgWrap = document.createElement("div");
    msgWrap.className = "bh-toast-msg";
    msgWrap.textContent = message;

    toast.appendChild(msgWrap);

    if (dismissible) {
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "bh-btn bh-btn-ghost bh-btn-xs bh-toast-close";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.innerHTML = "✕";
      closeBtn.addEventListener("click", () => dismiss());
      toast.appendChild(closeBtn);
    }

    function dismiss() {
      if (!toast.isConnected) return;
      toast.classList.add("bh-toast-hide");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
    }

    layer.appendChild(toast);

    if (timeout > 0) {
      setTimeout(dismiss, timeout);
    }
    return { dismiss, el: toast };
  }

  window.bhToast = {
    show(message, options) {
      return buildToast(message, options || {});
    },
  };
})();
