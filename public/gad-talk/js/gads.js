/**
 * GadTalk Gads Module
 * Handles gad rendering, creation, and interactions
 */

const gadTalkGads = (function () {
  const MAX_GAD_LENGTH = 280;

  /**
   * Format relative time
   */
  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  /**
   * Format number with abbreviation
   */
  function formatCount(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  }

  /**
   * Parse and linkify content (hashtags, mentions, URLs)
   */
  function parseContent(content) {
    if (!content) return "";

    // Escape HTML
    let parsed = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Linkify URLs
    parsed = parsed.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" class="gt-link" target="_blank" rel="noopener">$1</a>'
    );

    // Linkify hashtags
    parsed = parsed.replace(
      /#(\w+)/g,
      '<a href="/gad-talk/explore.html?hashtag=$1" class="gt-link gt-hashtag">#$1</a>'
    );

    // Linkify mentions
    parsed = parsed.replace(/@(\w+)/g, '<a href="/gad-talk/profile.html?user=$1" class="gt-link gt-mention">@$1</a>');

    return parsed;
  }

  /**
   * Get avatar HTML
   */
  function getAvatarHtml(user, size = "md") {
    const avatar = user?.avatar;
    const displayName = user?.displayName || user?.username || "?";
    const initial = displayName.charAt(0).toUpperCase();

    if (avatar) {
      return `<img src="${avatar}" alt="${displayName}" class="gt-avatar gt-avatar-${size}" />`;
    }

    return `<div class="gt-avatar gt-avatar-${size}" style="display: flex; align-items: center; justify-content: center; font-weight: bold;">${initial}</div>`;
  }

  /**
   * Render a single gad
   */
  function renderGad(gad, currentUserId = null) {
    const isOwner = currentUserId && gad.userId === currentUserId;
    const isLiked = gad.isLiked || false;
    const isRegadded = gad.isRegadded || false;
    const isBookmarked = gad.isBookmarked || false;

    const user = gad.user || {};
    const displayName = user.displayName || user.username || "Unknown";
    const username = user.username || "unknown";
    const avatarHtml = getAvatarHtml(user, "md");
    const timeAgo = formatRelativeTime(gad.createdAt);
    const content = parseContent(gad.content);

    // Regad indicator
    let regadIndicator = "";
    if (gad.isRegad && gad.regaddedBy) {
      regadIndicator = `
        <div class="gt-gad-regad-indicator">
          <span class="gt-icon"><i class="fa-solid fa-retweet"></i></span>
          <span>${gad.regaddedBy.displayName || gad.regaddedBy.username} Regadded</span>
        </div>
      `;
    }

    // Reply indicator
    let replyIndicator = "";
    if (gad.replyTo && gad.replyToUser) {
      replyIndicator = `
        <div class="gt-gad-reply-indicator">
          <span class="gt-text-secondary">Replying to </span>
          <a href="/gad-talk/profile.html?user=${gad.replyToUser.username}" class="gt-link">@${gad.replyToUser.username}</a>
        </div>
      `;
    }

    return `
      <article class="gt-gad" data-gad-id="${gad.id}" data-testid="gad-${gad.id}">
        ${regadIndicator}
        <div class="gt-gad-content">
          <div class="gt-gad-avatar">
            <a href="/gad-talk/profile.html?user=${username}">
              ${avatarHtml}
            </a>
          </div>
          <div class="gt-gad-body">
            <div class="gt-gad-header">
              <a href="/gad-talk/profile.html?user=${username}" class="gt-gad-author">
                <span class="gt-gad-display-name">${displayName}</span>
                ${
                  user.verified
                    ? '<span class="gt-verified" title="Verified"><i class="fa-solid fa-circle-check"></i></span>'
                    : ""
                }
                <span class="gt-gad-username">@${username}</span>
              </a>
              <span class="gt-gad-separator">·</span>
              <a href="/gad-talk/gad.html?id=${gad.id}" class="gt-gad-time" title="${new Date(
      gad.createdAt
    ).toLocaleString()}">
                ${timeAgo}
              </a>
              ${
                isOwner
                  ? `
                <div class="gt-gad-menu">
                  <button class="gt-icon-btn gt-gad-menu-btn" data-testid="gad-menu-${gad.id}"><i class="fa-solid fa-ellipsis"></i></button>
                  <div class="gt-dropdown gt-hidden">
                    <button class="gt-dropdown-item gt-dropdown-item-danger" data-action="delete" data-gad-id="${gad.id}">
                      <span><i class="fa-solid fa-trash"></i></span> Delete
                    </button>
                  </div>
                </div>
              `
                  : ""
              }
            </div>
            ${replyIndicator}
            <div class="gt-gad-text">
              ${content}
            </div>
            <div class="gt-gad-actions">
              <button class="gt-gad-action gt-gad-action-reply" data-action="reply" data-gad-id="${
                gad.id
              }" data-testid="reply-${gad.id}">
                <span class="gt-action-icon"><i class="fa-solid fa-comment"></i></span>
                <span class="gt-action-count">${formatCount(gad.replyCount || 0)}</span>
              </button>
              <button class="gt-gad-action gt-gad-action-regad ${
                isRegadded ? "gt-active" : ""
              }" data-action="regad" data-gad-id="${gad.id}" data-testid="regad-${gad.id}">
                <span class="gt-action-icon"><i class="fa-solid fa-retweet"></i></span>
                <span class="gt-action-count">${formatCount(gad.regadCount || 0)}</span>
              </button>
              <button class="gt-gad-action gt-gad-action-like ${
                isLiked ? "gt-active" : ""
              }" data-action="like" data-gad-id="${gad.id}" data-testid="like-${gad.id}">
                <span class="gt-action-icon">${
                  isLiked ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>'
                }</span>
                <span class="gt-action-count">${formatCount(gad.likeCount || 0)}</span>
              </button>
              <button class="gt-gad-action gt-gad-action-bookmark ${
                isBookmarked ? "gt-active" : ""
              }" data-action="bookmark" data-gad-id="${gad.id}" data-testid="bookmark-${gad.id}">
                <span class="gt-action-icon">${
                  isBookmarked ? '<i class="fa-solid fa-bookmark"></i>' : '<i class="fa-regular fa-bookmark"></i>'
                }</span>
              </button>
              <button class="gt-gad-action gt-gad-action-share" data-action="share" data-gad-id="${
                gad.id
              }" data-testid="share-${gad.id}">
                <span class="gt-action-icon"><i class="fa-solid fa-share-from-square"></i></span>
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Render gads list
   */
  function renderGads(gads, container, currentUserId = null, append = false) {
    const html = gads.map((gad) => renderGad(gad, currentUserId)).join("");

    if (append) {
      container.insertAdjacentHTML("beforeend", html);
    } else {
      container.innerHTML = html;
    }

    // Attach event listeners to new gads
    attachGadEventListeners(container);
  }

  /**
   * Attach event listeners to gad actions
   */
  function attachGadEventListeners(container) {
    // Action buttons
    container.querySelectorAll(".gt-gad-action").forEach((btn) => {
      btn.addEventListener("click", handleGadAction);
    });

    // Menu buttons
    container.querySelectorAll(".gt-gad-menu-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const dropdown = btn.nextElementSibling;
        dropdown.classList.toggle("gt-hidden");
      });
    });

    // Menu actions
    container.querySelectorAll(".gt-dropdown-item").forEach((item) => {
      item.addEventListener("click", handleMenuAction);
    });
  }

  /**
   * Handle gad action (like, regad, reply, etc.)
   */
  async function handleGadAction(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const action = btn.dataset.action;
    const gadId = btn.dataset.gadId;

    // Check if user is authenticated - show login prompt for guests
    if (!window.GadTalkAPI.auth.isAuthenticated()) {
      if (window.gadTalkApp && window.gadTalkApp.showLoginPrompt) {
        window.gadTalkApp.showLoginPrompt(action);
      } else {
        window.location.href = "/gad-talk/login.html";
      }
      return;
    }

    try {
      switch (action) {
        case "like":
          await handleLike(btn, gadId);
          break;
        case "regad":
          await handleRegad(btn, gadId);
          break;
        case "reply":
          handleReply(gadId);
          break;
        case "bookmark":
          await handleBookmark(btn, gadId);
          break;
        case "share":
          handleShare(gadId);
          break;
      }
    } catch (error) {
      console.error(`Error handling ${action}:`, error);
    }
  }

  /**
   * Handle like action
   */
  async function handleLike(btn, gadId) {
    const isLiked = btn.classList.contains("gt-active");
    const countEl = btn.querySelector(".gt-action-count");
    const iconEl = btn.querySelector(".gt-action-icon");
    let count = parseInt(countEl.textContent) || 0;

    // Optimistic update
    btn.classList.toggle("gt-active");
    iconEl.innerHTML = isLiked ? '<i class="fa-regular fa-heart"></i>' : '<i class="fa-solid fa-heart"></i>';
    countEl.textContent = formatCount(isLiked ? count - 1 : count + 1);

    try {
      if (isLiked) {
        await window.GadTalkAPI.gads.unlike(gadId);
      } else {
        await window.GadTalkAPI.gads.like(gadId);
      }
    } catch (error) {
      // Revert on error
      btn.classList.toggle("gt-active");
      iconEl.innerHTML = isLiked ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
      countEl.textContent = formatCount(count);
      throw error;
    }
  }

  /**
   * Handle regad action
   */
  async function handleRegad(btn, gadId) {
    const isRegadded = btn.classList.contains("gt-active");
    const countEl = btn.querySelector(".gt-action-count");
    let count = parseInt(countEl.textContent) || 0;

    // Optimistic update
    btn.classList.toggle("gt-active");
    countEl.textContent = formatCount(isRegadded ? count - 1 : count + 1);

    try {
      if (isRegadded) {
        await window.GadTalkAPI.gads.unregad(gadId);
      } else {
        await window.GadTalkAPI.gads.regad(gadId);
      }
    } catch (error) {
      // Revert on error
      btn.classList.toggle("gt-active");
      countEl.textContent = formatCount(count);
      throw error;
    }
  }

  /**
   * Handle bookmark action
   */
  async function handleBookmark(btn, gadId) {
    const isBookmarked = btn.classList.contains("gt-active");
    const iconEl = btn.querySelector(".gt-action-icon");

    // Optimistic update
    btn.classList.toggle("gt-active");
    iconEl.innerHTML = isBookmarked ? '<i class="fa-regular fa-bookmark"></i>' : '<i class="fa-solid fa-bookmark"></i>';

    try {
      if (isBookmarked) {
        await window.GadTalkAPI.gads.unbookmark(gadId);
      } else {
        await window.GadTalkAPI.gads.bookmark(gadId);
      }
    } catch (error) {
      // Revert on error
      btn.classList.toggle("gt-active");
      iconEl.innerHTML = isBookmarked
        ? '<i class="fa-solid fa-bookmark"></i>'
        : '<i class="fa-regular fa-bookmark"></i>';
      throw error;
    }
  }

  /**
   * Handle reply action - open reply modal
   */
  function handleReply(gadId) {
    // Could open a modal or navigate to the gad detail page
    window.location.href = `/gad-talk/gad.html?id=${gadId}&reply=true`;
  }

  /**
   * Handle share action
   */
  function handleShare(gadId) {
    const url = `${window.location.origin}/gad-talk/gad.html?id=${gadId}`;

    if (navigator.share) {
      navigator.share({
        title: "GadTalk",
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        // Show toast notification
        showToast("Link copied to clipboard!");
      });
    }
  }

  /**
   * Handle menu action (delete)
   */
  async function handleMenuAction(event) {
    event.stopPropagation();
    const item = event.currentTarget;
    const action = item.dataset.action;
    const gadId = item.dataset.gadId;

    if (action === "delete") {
      if (confirm("Are you sure you want to delete this gad?")) {
        try {
          await window.GadTalkAPI.gads.delete(gadId);
          // Remove from DOM
          const gadEl = document.querySelector(`[data-gad-id="${gadId}"]`);
          if (gadEl) {
            gadEl.remove();
          }
          showToast("Gad deleted");
        } catch (error) {
          console.error("Error deleting gad:", error);
          showToast("Failed to delete gad", "error");
        }
      }
    }

    // Close dropdown
    item.closest(".gt-dropdown").classList.add("gt-hidden");
  }

  /**
   * Show toast notification
   * Uses GadTalkUI if available, falls back to simple toast
   */
  function showToast(message, type = "success") {
    // Use GadTalkUI if available
    if (window.GadTalkUI && window.GadTalkUI.toast) {
      window.GadTalkUI.toast[type](message);
      return;
    }

    // Fallback implementation
    const existing = document.querySelector(".gt-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `gt-toast gt-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("gt-toast-show"), 10);
    setTimeout(() => {
      toast.classList.remove("gt-toast-show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Initialize compose form
   */
  function initComposeForm(formId, textareaId, charCountId, submitBtnId) {
    const form = document.getElementById(formId);
    const textarea = document.getElementById(textareaId);
    const charCount = document.getElementById(charCountId);
    const submitBtn = document.getElementById(submitBtnId);

    if (!form || !textarea) return;

    // Update character count
    textarea.addEventListener("input", () => {
      const remaining = MAX_GAD_LENGTH - textarea.value.length;
      if (charCount) {
        charCount.textContent = remaining;
        charCount.classList.toggle("gt-warning", remaining < 20);
        charCount.classList.toggle("gt-danger", remaining < 0);
      }
      if (submitBtn) {
        submitBtn.disabled = remaining < 0 || textarea.value.trim().length === 0;
      }
    });

    // Handle submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = textarea.value.trim();

      if (!content || content.length > MAX_GAD_LENGTH) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "Posting...";

      try {
        const gad = await window.GadTalkAPI.gads.create(content);

        // Clear form
        textarea.value = "";
        if (charCount) charCount.textContent = MAX_GAD_LENGTH;
        submitBtn.textContent = "Gad";

        // Add new gad to feed
        const gadsList = document.getElementById("gads-list");
        if (gadsList) {
          const currentUser = window.gadTalkAuth.getCurrentUser();
          gadsList.insertAdjacentHTML("afterbegin", renderGad(gad, currentUser?.id));
          attachGadEventListeners(gadsList);
        }

        // Close modal if open
        const modal = document.getElementById("compose-modal");
        if (modal && !modal.classList.contains("gt-hidden")) {
          modal.classList.add("gt-hidden");
        }

        showToast("Gad posted!");
      } catch (error) {
        console.error("Error posting gad:", error);
        showToast("Failed to post gad", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Gad";
      }
    });
  }

  // Public API
  return {
    renderGad,
    renderGads,
    formatRelativeTime,
    formatCount,
    parseContent,
    getAvatarHtml,
    initComposeForm,
    showToast,
    attachGadEventListeners,
    MAX_GAD_LENGTH,
  };
})();

// Export for use in other scripts
window.gadTalkGads = gadTalkGads;
