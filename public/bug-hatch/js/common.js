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

function initMobileMenu() {
  const navbar = document.querySelector(".bh-navbar");
  if (!navbar) return;

  const navContainer = navbar.querySelector(".max-w-7xl") || navbar.querySelector(":scope > div");
  if (!navContainer) return;

  const navLinks =
    navContainer.querySelector(".flex.gap-2") ||
    navContainer.querySelector(".flex.gap-4") ||
    navContainer.querySelector(".flex.items-center.gap-4") ||
    navContainer.querySelector(".flex.items-center.gap-2");
  if (!navLinks) return;

  // Mark the nav links container for CSS targeting
  navLinks.classList.add("bh-nav-links");

  // Create hamburger button
  const hamburger = document.createElement("button");
  hamburger.type = "button";
  hamburger.className = "bh-hamburger";
  hamburger.setAttribute("aria-label", "Toggle navigation menu");
  hamburger.innerHTML = `
    <svg class="bh-hamburger-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
    <svg class="bh-hamburger-close" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `;

  // Insert hamburger before the nav links container
  navLinks.parentNode.insertBefore(hamburger, navLinks);

  // Toggle menu visibility
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("bh-nav-open");
    hamburger.classList.toggle("bh-hamburger-active");
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll("a, button").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        navLinks.classList.remove("bh-nav-open");
        hamburger.classList.remove("bh-hamburger-active");
      }
    });
  });

  // Close menu on resize to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
      navLinks.classList.remove("bh-nav-open");
      hamburger.classList.remove("bh-hamburger-active");
    }
  });
}

// Auto-initialize mobile menu on DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMobileMenu);
} else {
  initMobileMenu();
}

window.initMobileMenu = initMobileMenu;

// ==================== USER MENU DROPDOWN ====================

/**
 * Initialize the user menu dropdown with user info
 * @param {Object} user - User object with name, email, role
 * @param {Function} onLogout - Callback for logout action
 */
function initUserMenu(user, onLogout) {
  const userMenu = document.getElementById("userMenu");
  if (!userMenu) return;

  const trigger = userMenu.querySelector(".bh-user-menu-trigger");
  const nameEl = userMenu.querySelector(".bh-user-name");
  const avatarEl = userMenu.querySelector(".bh-user-avatar");
  const emailEl = userMenu.querySelector(".bh-user-dropdown-email");
  const roleEl = userMenu.querySelector(".bh-user-dropdown-role");
  const logoutBtn = userMenu.querySelector("[data-logout]");

  if (user) {
    // Set user info
    const displayName = user.name || user.email?.split("@")[0] || "User";
    const initials = displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2);

    if (nameEl) nameEl.textContent = displayName;
    if (avatarEl) avatarEl.textContent = initials;
    if (emailEl) emailEl.textContent = user.email || "";
    if (roleEl) {
      const roleName = user.isDemo ? "Demo" : user.role || "member";
      roleEl.textContent = roleName;
      roleEl.classList.toggle("bh-role-admin", user.role === "admin");
    }
  }

  // Toggle dropdown
  if (trigger) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.classList.toggle("bh-open");
    });
  }

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target)) {
      userMenu.classList.remove("bh-open");
    }
  });

  // Close on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      userMenu.classList.remove("bh-open");
    }
  });

  // Logout handler
  if (logoutBtn && onLogout) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      userMenu.classList.remove("bh-open");
      onLogout();
    });
  }
}

/**
 * Get user menu HTML template
 * @returns {string} HTML for user menu
 */
function getUserMenuHTML() {
  return `
    <div class="bh-user-menu" id="userMenu">
      <button type="button" class="bh-user-menu-trigger">
        <span class="bh-user-avatar">U</span>
        <span class="bh-user-name">User</span>
        <svg class="bh-user-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div class="bh-user-dropdown">
        <div class="bh-user-dropdown-header">
          <div class="bh-user-dropdown-email">user@example.com</div>
          <span class="bh-user-dropdown-role">member</span>
        </div>
        <a href="/bug-hatch/profile.html" class="bh-user-dropdown-item">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </a>
        <div class="bh-user-dropdown-divider"></div>
        <button type="button" class="bh-user-dropdown-item bh-logout" data-logout>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  `;
}

window.initUserMenu = initUserMenu;
window.getUserMenuHTML = getUserMenuHTML;

/**
 * Setup user menu with user data - call after authentication
 * Populates user avatar, name, email, role and sets up dropdown behavior
 * @param {Object} user - User object from auth
 */
function setupUserMenu(user) {
  const userMenu = document.getElementById("userMenu");
  if (!userMenu || !user) return;

  const displayName = user.name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Update avatar
  const avatar = userMenu.querySelector(".bh-user-avatar");
  if (avatar) avatar.textContent = initials;

  // Update name
  const nameEl = userMenu.querySelector(".bh-user-name");
  if (nameEl) nameEl.textContent = displayName;

  // Update email in dropdown
  const emailEl = userMenu.querySelector(".bh-user-dropdown-email");
  if (emailEl) emailEl.textContent = user.email || "";

  // Update role
  const roleEl = userMenu.querySelector(".bh-user-dropdown-role");
  if (roleEl) {
    const isDemo = user.isDemo === true;
    roleEl.textContent = isDemo ? "Demo" : user.role || "member";
    roleEl.classList.toggle("bh-role-admin", user.role === "admin");
  }

  // Setup dropdown toggle
  const trigger = userMenu.querySelector(".bh-user-menu-trigger");
  if (trigger) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.classList.toggle("bh-open");
    });
  }

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target)) {
      userMenu.classList.remove("bh-open");
    }
  });

  // Close on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      userMenu.classList.remove("bh-open");
    }
  });
}

window.setupUserMenu = setupUserMenu;
