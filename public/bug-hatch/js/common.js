function toggleDemoBanner(project) {
  const demoBanner = document.getElementById("demo-banner");
  if (demoBanner) {
    const isDemo = project?.demo === true;
    demoBanner.classList.toggle("hidden", !isDemo);
  }
}

window.toggleDemoBanner = toggleDemoBanner;

// ==================== CONFIRMATION MODAL UTILITY ====================

/**
 * Shows a custom confirmation modal and returns a Promise that resolves to true/false
 * @param {Object} options - Configuration options
 * @param {string} options.title - Modal title (default: "Confirm")
 * @param {string} options.message - Modal message
 * @param {string} options.confirmText - Confirm button text (default: "Confirm")
 * @param {string} options.cancelText - Cancel button text (default: "Cancel")
 * @param {string} options.confirmClass - Additional class for confirm button (default: "bh-btn-danger")
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
function showConfirmModal(options = {}) {
  const {
    title = "Confirm",
    message = "Are you sure?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmClass = "bg-red-600 hover:bg-red-500",
  } = options;

  return new Promise((resolve) => {
    // Check if modal already exists, if not create it
    let modal = document.getElementById("bhConfirmModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "bhConfirmModal";
      modal.className = "fixed inset-0 z-50 hidden";
      modal.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" data-confirm-backdrop></div>
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <div class="bh-card bh-card-glow bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl max-w-sm w-full p-4 transform transition-all duration-150" data-confirm-panel>
            <h3 class="text-lg font-semibold text-neutral-100 mb-2" data-confirm-title></h3>
            <p class="text-sm text-neutral-300 mb-4" data-confirm-message></p>
            <div class="flex gap-2 justify-end">
              <button type="button" class="bh-btn bh-btn-secondary px-3 py-1.5 text-sm rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200" data-confirm-cancel></button>
              <button type="button" class="bh-btn px-3 py-1.5 text-sm rounded-md text-white" data-confirm-ok></button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // Update content
    modal.querySelector("[data-confirm-title]").textContent = title;
    modal.querySelector("[data-confirm-message]").textContent = message;
    modal.querySelector("[data-confirm-cancel]").textContent = cancelText;
    const okBtn = modal.querySelector("[data-confirm-ok]");
    okBtn.textContent = confirmText;
    okBtn.className = `bh-btn px-3 py-1.5 text-sm rounded-md text-white ${confirmClass}`;

    // Show modal with animation
    modal.classList.remove("hidden");
    const panel = modal.querySelector("[data-confirm-panel]");
    panel.classList.add("opacity-0", "scale-95");
    requestAnimationFrame(() => {
      panel.classList.remove("opacity-0", "scale-95");
      panel.classList.add("opacity-100", "scale-100");
    });

    // Cleanup function
    const cleanup = () => {
      panel.classList.add("opacity-0", "scale-95");
      panel.classList.remove("opacity-100", "scale-100");
      setTimeout(() => {
        modal.classList.add("hidden");
      }, 150);
      okBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", handleCancel);
      backdrop.removeEventListener("click", handleCancel);
      document.removeEventListener("keydown", handleKeydown);
    };

    // Event handlers
    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };

    // Attach event listeners
    const cancelBtn = modal.querySelector("[data-confirm-cancel]");
    const backdrop = modal.querySelector("[data-confirm-backdrop]");

    okBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", handleCancel);
    backdrop.addEventListener("click", handleCancel);
    document.addEventListener("keydown", handleKeydown);

    // Focus the cancel button by default for safety
    cancelBtn.focus();
  });
}

window.showConfirmModal = showConfirmModal;
