class ConfirmDialog {
  constructor() {
    this.dialogId = "confirmDialog_" + Math.random().toString(36).substr(2, 9);
    this.dialog = null;
    this.createDialog();
  }

  createDialog() {
    const template = `
      <div id="${this.dialogId}" class="dialog-overlay confirm-dialog" style="display: none;">
        <div class="dialog-content">
          <div class="dialog-header">
            <h3></h3>
            <button class="close-dialog">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="dialog-body"></div>
          <div class="dialog-actions">
            <button class="cancel-btn">Cancel</button>
            <button class="confirm-btn">Confirm</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", template);
    this.dialog = document.getElementById(this.dialogId);
    this.setupEventListeners();
  }

  setupEventListeners() {
    const closeBtn = this.dialog.querySelector(".close-dialog");
    const overlay = this.dialog;

    closeBtn.addEventListener("click", () => this.close());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close();
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen()) this.close();
    });
  }

  show({
    title = "Confirm Action",
    message = "Are you sure?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmButtonClass = "primary",
    showCloseButton = true,
  }) {
    return new Promise((resolve) => {
      const dialogHeader = this.dialog.querySelector(".dialog-header h3");
      const dialogBody = this.dialog.querySelector(".dialog-body");
      const confirmBtn = this.dialog.querySelector(".confirm-btn");
      const cancelBtn = this.dialog.querySelector(".cancel-btn");
      const closeBtn = this.dialog.querySelector(".close-dialog");

      dialogHeader.textContent = title;
      dialogBody.textContent = message;
      confirmBtn.textContent = confirmText;
      closeBtn.style.display = showCloseButton ? "block" : "none";

      // Handle alert-style dialogs (only OK button)
      if (cancelText === null) {
        cancelBtn.style.display = "none";
        confirmBtn.style.width = "100%";
      } else {
        cancelBtn.style.display = "block";
        cancelBtn.textContent = cancelText;
        confirmBtn.style.width = "";
      }

      confirmBtn.className = `confirm-btn ${confirmButtonClass}-btn`;

      const handleConfirm = () => {
        this.close();
        resolve(true);
      };

      const handleCancel = () => {
        this.close();
        resolve(false);
      };

      confirmBtn.onclick = handleConfirm;
      cancelBtn.onclick = handleCancel;
      this.dialog.style.display = "flex";

      // Focus confirm button
      confirmBtn.focus();
    });
  }

  close() {
    if (this.dialog) {
      this.dialog.style.display = "none";
    }
  }

  isOpen() {
    return this.dialog && this.dialog.style.display === "flex";
  }

  destroy() {
    if (this.dialog) {
      this.dialog.remove();
      this.dialog = null;
    }
  }
}

// Create singleton instance
const confirmDialog = new ConfirmDialog();
