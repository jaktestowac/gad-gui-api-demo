/**
 * GadTalk UI Components
 * Toast notifications, modals, loading states, and other UI utilities
 */

const GadTalkUI = (function () {
  // ==================== TOAST NOTIFICATIONS ====================

  let toastContainer = null;
  let toastCounter = 0;

  /**
   * Initialize toast container
   */
  function initToastContainer() {
    if (toastContainer) return;

    toastContainer = document.createElement("div");
    toastContainer.id = "gt-toast-container";
    toastContainer.className = "gt-toast-container";
    toastContainer.setAttribute("aria-live", "polite");
    toastContainer.setAttribute("aria-atomic", "true");
    document.body.appendChild(toastContainer);
  }

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {Object} options - Toast options
   * @param {string} options.type - 'success' | 'error' | 'warning' | 'info'
   * @param {number} options.duration - Duration in ms (default: 4000)
   * @param {boolean} options.dismissible - Show close button (default: true)
   * @param {string} options.action - Action button text
   * @param {Function} options.onAction - Action button callback
   * @returns {string} Toast ID
   */
  function showToast(message, options = {}) {
    initToastContainer();

    const { type = "info", duration = 4000, dismissible = true, action = null, onAction = null } = options;

    const toastId = `gt-toast-${++toastCounter}`;

    const icons = {
      success: '<i class="fa-solid fa-check"></i>',
      error: '<i class="fa-solid fa-xmark"></i>',
      warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
      info: '<i class="fa-solid fa-circle-info"></i>',
    };

    const toast = document.createElement("div");
    toast.id = toastId;
    toast.className = `gt-toast gt-toast-${type}`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("data-testid", `toast-${type}`);

    let actionHtml = "";
    if (action) {
      actionHtml = `<button class="gt-toast-action" data-testid="toast-action">${action}</button>`;
    }

    let closeHtml = "";
    if (dismissible) {
      closeHtml = `<button class="gt-toast-close" aria-label="Close" data-testid="toast-close">×</button>`;
    }

    toast.innerHTML = `
      <span class="gt-toast-icon">${icons[type]}</span>
      <span class="gt-toast-message">${message}</span>
      ${actionHtml}
      ${closeHtml}
    `;

    // Add event listeners
    if (dismissible) {
      const closeBtn = toast.querySelector(".gt-toast-close");
      closeBtn.addEventListener("click", () => dismissToast(toastId));
    }

    if (action && onAction) {
      const actionBtn = toast.querySelector(".gt-toast-action");
      actionBtn.addEventListener("click", () => {
        onAction();
        dismissToast(toastId);
      });
    }

    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add("gt-toast-show");
    });

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => dismissToast(toastId), duration);
    }

    return toastId;
  }

  /**
   * Dismiss a toast by ID
   * @param {string} toastId - Toast ID to dismiss
   */
  function dismissToast(toastId) {
    const toast = document.getElementById(toastId);
    if (!toast) return;

    toast.classList.remove("gt-toast-show");
    toast.classList.add("gt-toast-hide");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }

  /**
   * Clear all toasts
   */
  function clearToasts() {
    if (!toastContainer) return;
    toastContainer.innerHTML = "";
  }

  // Convenience methods
  const toast = {
    success: (msg, opts) => showToast(msg, { ...opts, type: "success" }),
    error: (msg, opts) => showToast(msg, { ...opts, type: "error" }),
    warning: (msg, opts) => showToast(msg, { ...opts, type: "warning" }),
    info: (msg, opts) => showToast(msg, { ...opts, type: "info" }),
    dismiss: dismissToast,
    clear: clearToasts,
  };

  // ==================== MODAL DIALOGS ====================

  let modalContainer = null;
  let activeModals = [];

  /**
   * Initialize modal container
   */
  function initModalContainer() {
    if (modalContainer) return;

    modalContainer = document.createElement("div");
    modalContainer.id = "gt-modal-container";
    modalContainer.className = "gt-modal-container gt-hidden";
    document.body.appendChild(modalContainer);

    // Close on backdrop click
    modalContainer.addEventListener("click", (e) => {
      if (e.target === modalContainer) {
        const topModal = activeModals[activeModals.length - 1];
        if (topModal && topModal.closeOnBackdrop) {
          closeModal(topModal.id);
        }
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && activeModals.length > 0) {
        const topModal = activeModals[activeModals.length - 1];
        if (topModal && topModal.closeOnEscape) {
          closeModal(topModal.id);
        }
      }
    });
  }

  /**
   * Show a modal dialog
   * @param {Object} options - Modal options
   * @param {string} options.id - Modal ID
   * @param {string} options.title - Modal title
   * @param {string} options.content - Modal HTML content
   * @param {Array} options.buttons - Array of button configs
   * @param {string} options.size - 'sm' | 'md' | 'lg' (default: 'md')
   * @param {boolean} options.closeOnBackdrop - Close on backdrop click (default: true)
   * @param {boolean} options.closeOnEscape - Close on Escape key (default: true)
   * @param {Function} options.onClose - Callback when modal closes
   * @returns {string} Modal ID
   */
  function showModal(options = {}) {
    initModalContainer();

    const {
      id = `gt-modal-${Date.now()}`,
      title = "",
      content = "",
      buttons = [],
      size = "md",
      closeOnBackdrop = true,
      closeOnEscape = true,
      onClose = null,
    } = options;

    // Create modal element
    const modal = document.createElement("div");
    modal.id = id;
    modal.className = `gt-modal gt-modal-${size}`;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", `${id}-title`);
    modal.setAttribute("data-testid", `modal-${id}`);

    // Build buttons HTML
    let buttonsHtml = "";
    if (buttons.length > 0) {
      buttonsHtml = `
        <div class="gt-modal-footer">
          ${buttons
            .map(
              (btn, idx) => `
            <button 
              class="gt-btn ${btn.class || "gt-btn-secondary"}" 
              data-action="${btn.action || idx}"
              data-testid="modal-btn-${btn.action || idx}"
            >
              ${btn.text}
            </button>
          `
            )
            .join("")}
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="gt-modal-header">
        <h2 class="gt-modal-title" id="${id}-title">${title}</h2>
        <button class="gt-modal-close" aria-label="Close" data-testid="modal-close">×</button>
      </div>
      <div class="gt-modal-body" data-testid="modal-body">
        ${content}
      </div>
      ${buttonsHtml}
    `;

    // Add event listeners
    const closeBtn = modal.querySelector(".gt-modal-close");
    closeBtn.addEventListener("click", () => closeModal(id));

    // Button actions
    buttons.forEach((btn, idx) => {
      const btnEl = modal.querySelector(`[data-action="${btn.action || idx}"]`);
      if (btnEl && btn.onClick) {
        btnEl.addEventListener("click", () => {
          btn.onClick();
          if (btn.closeOnClick !== false) {
            closeModal(id);
          }
        });
      }
    });

    // Track modal
    activeModals.push({ id, closeOnBackdrop, closeOnEscape, onClose });

    // Show container and modal
    modalContainer.classList.remove("gt-hidden");
    modalContainer.appendChild(modal);

    // Prevent body scroll
    document.body.classList.add("gt-modal-open");

    // Focus first focusable element
    setTimeout(() => {
      const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
    }, 100);

    return id;
  }

  /**
   * Close a modal by ID
   * @param {string} modalId - Modal ID to close
   */
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const modalData = activeModals.find((m) => m.id === modalId);

    // Remove from tracking
    activeModals = activeModals.filter((m) => m.id !== modalId);

    // Animate out
    modal.classList.add("gt-modal-closing");

    setTimeout(() => {
      modal.remove();

      // Hide container if no more modals
      if (activeModals.length === 0) {
        modalContainer.classList.add("gt-hidden");
        document.body.classList.remove("gt-modal-open");
      }

      // Callback
      if (modalData && modalData.onClose) {
        modalData.onClose();
      }
    }, 200);
  }

  /**
   * Close all modals
   */
  function closeAllModals() {
    activeModals.forEach((m) => closeModal(m.id));
  }

  /**
   * Show a confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Object} options - Dialog options
   * @returns {Promise<boolean>} True if confirmed, false otherwise
   */
  function confirm(message, options = {}) {
    return new Promise((resolve) => {
      showModal({
        title: options.title || "Confirm",
        content: `<p>${message}</p>`,
        size: "sm",
        buttons: [
          {
            text: options.cancelText || "Cancel",
            class: "gt-btn-secondary",
            action: "cancel",
            onClick: () => resolve(false),
          },
          {
            text: options.confirmText || "Confirm",
            class: options.danger ? "gt-btn-danger" : "gt-btn-primary",
            action: "confirm",
            onClick: () => resolve(true),
          },
        ],
        onClose: () => resolve(false),
      });
    });
  }

  /**
   * Show an alert dialog
   * @param {string} message - Alert message
   * @param {Object} options - Dialog options
   * @returns {Promise<void>}
   */
  function alert(message, options = {}) {
    return new Promise((resolve) => {
      showModal({
        title: options.title || "Alert",
        content: `<p>${message}</p>`,
        size: "sm",
        buttons: [
          {
            text: options.okText || "OK",
            class: "gt-btn-primary",
            action: "ok",
            onClick: () => resolve(),
          },
        ],
        onClose: () => resolve(),
      });
    });
  }

  // ==================== LOADING STATES ====================

  /**
   * Show loading overlay on an element
   * @param {HTMLElement|string} element - Element or selector
   * @param {Object} options - Loading options
   */
  function showLoading(element, options = {}) {
    const el = typeof element === "string" ? document.querySelector(element) : element;
    if (!el) return;

    const { text = "Loading...", spinner = true } = options;

    // Make element relative if needed
    const position = getComputedStyle(el).position;
    if (position === "static") {
      el.style.position = "relative";
      el.dataset.gtOriginalPosition = "static";
    }

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "gt-loading-overlay";
    overlay.setAttribute("data-testid", "loading-overlay");

    overlay.innerHTML = `
      ${spinner ? '<div class="gt-spinner"></div>' : ""}
      ${text ? `<span class="gt-loading-text">${text}</span>` : ""}
    `;

    el.appendChild(overlay);
    el.classList.add("gt-loading");
  }

  /**
   * Hide loading overlay from an element
   * @param {HTMLElement|string} element - Element or selector
   */
  function hideLoading(element) {
    const el = typeof element === "string" ? document.querySelector(element) : element;
    if (!el) return;

    const overlay = el.querySelector(".gt-loading-overlay");
    if (overlay) {
      overlay.remove();
    }

    el.classList.remove("gt-loading");

    // Restore original position
    if (el.dataset.gtOriginalPosition === "static") {
      el.style.position = "";
      delete el.dataset.gtOriginalPosition;
    }
  }

  /**
   * Create a skeleton loader element
   * @param {Object} options - Skeleton options
   * @returns {HTMLElement} Skeleton element
   */
  function createSkeleton(options = {}) {
    const { type = "text", lines = 3, avatar = false, image = false } = options;

    const skeleton = document.createElement("div");
    skeleton.className = "gt-skeleton";
    skeleton.setAttribute("data-testid", "skeleton-loader");

    if (type === "gad") {
      skeleton.innerHTML = `
        <div class="gt-skeleton-gad">
          <div class="gt-skeleton-avatar"></div>
          <div class="gt-skeleton-content">
            <div class="gt-skeleton-header">
              <div class="gt-skeleton-line gt-skeleton-name"></div>
              <div class="gt-skeleton-line gt-skeleton-username"></div>
            </div>
            <div class="gt-skeleton-line gt-skeleton-text"></div>
            <div class="gt-skeleton-line gt-skeleton-text gt-skeleton-text-short"></div>
            ${image ? '<div class="gt-skeleton-image"></div>' : ""}
            <div class="gt-skeleton-actions">
              <div class="gt-skeleton-action"></div>
              <div class="gt-skeleton-action"></div>
              <div class="gt-skeleton-action"></div>
            </div>
          </div>
        </div>
      `;
    } else if (type === "profile") {
      skeleton.innerHTML = `
        <div class="gt-skeleton-profile">
          <div class="gt-skeleton-header-img"></div>
          <div class="gt-skeleton-avatar gt-skeleton-avatar-lg"></div>
          <div class="gt-skeleton-line gt-skeleton-name"></div>
          <div class="gt-skeleton-line gt-skeleton-username"></div>
          <div class="gt-skeleton-line gt-skeleton-bio"></div>
          <div class="gt-skeleton-stats">
            <div class="gt-skeleton-stat"></div>
            <div class="gt-skeleton-stat"></div>
          </div>
        </div>
      `;
    } else {
      // Default text lines
      for (let i = 0; i < lines; i++) {
        const line = document.createElement("div");
        line.className = `gt-skeleton-line ${i === lines - 1 ? "gt-skeleton-text-short" : ""}`;
        skeleton.appendChild(line);
      }
    }

    return skeleton;
  }

  /**
   * Show skeleton loaders in a container
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - Skeleton options
   * @param {number} options.count - Number of skeletons
   * @param {string} options.type - Skeleton type
   */
  function showSkeletons(container, options = {}) {
    const el = typeof container === "string" ? document.querySelector(container) : container;
    if (!el) return;

    const { count = 3, type = "gad" } = options;

    el.innerHTML = "";

    for (let i = 0; i < count; i++) {
      el.appendChild(createSkeleton({ type }));
    }
  }

  // ==================== BUTTON STATES ====================

  /**
   * Set button loading state
   * @param {HTMLElement|string} button - Button element or selector
   * @param {boolean} loading - Loading state
   * @param {string} loadingText - Text to show while loading
   */
  function setButtonLoading(button, loading, loadingText = "Loading...") {
    const btn = typeof button === "string" ? document.querySelector(button) : button;
    if (!btn) return;

    if (loading) {
      btn.disabled = true;
      btn.dataset.gtOriginalText = btn.innerHTML;
      btn.innerHTML = `<span class="gt-btn-spinner"></span> ${loadingText}`;
      btn.classList.add("gt-btn-loading");
    } else {
      btn.disabled = false;
      if (btn.dataset.gtOriginalText) {
        btn.innerHTML = btn.dataset.gtOriginalText;
        delete btn.dataset.gtOriginalText;
      }
      btn.classList.remove("gt-btn-loading");
    }
  }

  // ==================== EMPTY STATES ====================

  /**
   * Create an empty state element
   * @param {Object} options - Empty state options
   * @returns {HTMLElement}
   */
  function createEmptyState(options = {}) {
    const {
      icon = '<i class="fa-solid fa-inbox"></i>',
      title = "Nothing here",
      message = "No content to display.",
      action = null,
      actionText = null,
    } = options;

    const empty = document.createElement("div");
    empty.className = "gt-empty-state";
    empty.setAttribute("data-testid", "empty-state");

    let actionHtml = "";
    if (action && actionText) {
      actionHtml = `<button class="gt-btn gt-btn-primary gt-empty-action" data-testid="empty-action">${actionText}</button>`;
    }

    empty.innerHTML = `
      <div class="gt-empty-icon">${icon}</div>
      <h3 class="gt-empty-title">${title}</h3>
      <p class="gt-empty-message">${message}</p>
      ${actionHtml}
    `;

    if (action) {
      const btn = empty.querySelector(".gt-empty-action");
      if (btn) btn.addEventListener("click", action);
    }

    return empty;
  }

  // ==================== DROPDOWN MENUS ====================

  let activeDropdown = null;

  /**
   * Create and show a dropdown menu
   * @param {HTMLElement} trigger - Element that triggered the dropdown
   * @param {Array} items - Menu items
   * @param {Object} options - Dropdown options
   */
  function showDropdown(trigger, items, options = {}) {
    closeDropdown();

    const { align = "right" } = options;

    const dropdown = document.createElement("div");
    dropdown.className = `gt-dropdown gt-dropdown-${align}`;
    dropdown.setAttribute("role", "menu");
    dropdown.setAttribute("data-testid", "dropdown-menu");

    dropdown.innerHTML = items
      .map((item, idx) => {
        if (item.divider) {
          return '<div class="gt-dropdown-divider"></div>';
        }
        return `
          <button 
            class="gt-dropdown-item ${item.danger ? "gt-dropdown-item-danger" : ""}" 
            role="menuitem"
            data-action="${idx}"
            data-testid="dropdown-item-${item.action || idx}"
          >
            ${item.icon ? `<span class="gt-dropdown-icon">${item.icon}</span>` : ""}
            <span>${item.text}</span>
          </button>
        `;
      })
      .join("");

    // Position relative to trigger
    const rect = trigger.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
    if (align === "right") {
      dropdown.style.right = `${window.innerWidth - rect.right}px`;
    } else {
      dropdown.style.left = `${rect.left + window.scrollX}px`;
    }

    document.body.appendChild(dropdown);
    activeDropdown = dropdown;

    // Add click handlers
    items.forEach((item, idx) => {
      if (!item.divider && item.onClick) {
        const btn = dropdown.querySelector(`[data-action="${idx}"]`);
        if (btn) {
          btn.addEventListener("click", () => {
            item.onClick();
            closeDropdown();
          });
        }
      }
    });

    // Close on outside click
    setTimeout(() => {
      document.addEventListener("click", handleDropdownOutsideClick);
    }, 0);

    // Close on scroll
    window.addEventListener("scroll", closeDropdown, { once: true });
  }

  function handleDropdownOutsideClick(e) {
    if (activeDropdown && !activeDropdown.contains(e.target)) {
      closeDropdown();
    }
  }

  function closeDropdown() {
    if (activeDropdown) {
      activeDropdown.remove();
      activeDropdown = null;
      document.removeEventListener("click", handleDropdownOutsideClick);
    }
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize all UI components
   */
  function init() {
    initToastContainer();
  }

  // Auto-initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Public API
  return {
    toast,
    showToast,
    dismissToast,
    clearToasts,

    showModal,
    closeModal,
    closeAllModals,
    confirm,
    alert,

    showLoading,
    hideLoading,
    createSkeleton,
    showSkeletons,

    setButtonLoading,
    createEmptyState,

    showDropdown,
    closeDropdown,

    init,
  };
})();

// Make globally available
window.GadTalkUI = GadTalkUI;
