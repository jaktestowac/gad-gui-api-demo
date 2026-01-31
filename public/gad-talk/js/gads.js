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
    parsed = parsed.replace(/@(\w+)/g, '<a href="/gad-talk/@$1" class="gt-link gt-mention">@$1</a>');

    return parsed;
  }

  /**
   * Get avatar HTML
   */
  function getAvatarHtml(user, size = "md") {
    // Always return an image element; fall back to the default avatar when user has no avatar set
    const displayName = user?.displayName || user?.username || "?";
    const avatar = user?.avatar || "/gad-talk/images/default-avatar.png";
    return `<img src="${avatar}" alt="${displayName}" class="gt-avatar gt-avatar-${size}" />`;
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
          <a href="/gad-talk/@${encodeURIComponent(gad.replyToUser.username)}" class="gt-link">@${
        gad.replyToUser.username
      }</a>
        </div>
      `;
    }

    // Image attachment
    let imageHtml = "";
    if (gad.imageUrl) {
      imageHtml = `
        <div class="gt-gad-image">
          <img src="${gad.imageUrl}" alt="Gad image" loading="lazy" />
        </div>
      `;
    }

    // Quoted gad
    let quotedGadHtml = "";
    if (gad.quotedGad) {
      const qg = gad.quotedGad;
      const qgUser = qg.user || {};
      const qgDisplayName = qgUser.displayName || qgUser.username || "Unknown";
      const qgUsername = qgUser.username || "unknown";
      const qgTimeAgo = formatRelativeTime(qg.createdAt);
      const qgContent = parseContent(qg.content);

      quotedGadHtml = `
        <a href="/gad-talk/gad.html?id=${qg.id}" class="gt-quoted-gad" data-testid="quoted-gad-${qg.id}">
          <div class="gt-quoted-gad-header">
            <span class="gt-quoted-gad-author">
              <a href="/gad-talk/@${encodeURIComponent(
                qgUsername
              )}" class="gt-quoted-gad-author-link"><span class="gt-gad-display-name">${qgDisplayName}</span></a>
              <span class="gt-gad-username">@${qgUsername}</span>
            </span>
            <span class="gt-gad-separator">·</span>
            <span class="gt-gad-time">${qgTimeAgo}</span>
          </div>
          <div class="gt-quoted-gad-content">${qgContent}</div>
          ${qg.imageUrl ? `<div class="gt-quoted-gad-image"><img src="${qg.imageUrl}" alt="" /></div>` : ""}
        </a>
      `;
    }

    return `
      <article class="gt-gad" data-gad-id="${gad.id}" data-testid="gad-${gad.id}">
        ${regadIndicator}
        <div class="gt-gad-content">
          <div class="gt-gad-avatar">
            <a href="/gad-talk/@${encodeURIComponent(username)}">
              ${avatarHtml}
            </a>
          </div>
          <div class="gt-gad-body">
            <div class="gt-gad-header">
              <a href="/gad-talk/@${encodeURIComponent(username)}" class="gt-gad-author">
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
            <div class="gt-gad-text">${content}</div>
            ${imageHtml}
            ${quotedGadHtml}
            <div class="gt-gad-actions">
              <button class="gt-gad-action gt-gad-action-reply" data-action="reply" data-gad-id="${
                gad.id
              }" data-testid="reply-${gad.id}">
                <span class="gt-action-icon"><i class="fa-solid fa-comment"></i></span>
                <span class="gt-action-count">${formatCount(gad.replyCount || 0)}</span>
              </button>
              <div class="gt-gad-action-container gt-gad-action-regad-container">
                <button class="gt-gad-action gt-gad-action-regad ${
                  isRegadded ? "gt-active" : ""
                }" data-action="regad-menu" data-gad-id="${gad.id}" data-testid="regad-${gad.id}">
                  <span class="gt-action-icon"><i class="fa-solid fa-retweet"></i></span>
                  <span class="gt-action-count gt-action-count-clickable" data-action="who-regadded" data-gad-id="${
                    gad.id
                  }" title="See who regadded">${formatCount(gad.regadCount || 0)}</span>
                </button>
                <div class="gt-dropdown gt-dropdown-up gt-hidden" data-regad-dropdown="${gad.id}">
                  <button class="gt-dropdown-item" data-action="regad" data-gad-id="${gad.id}">
                    <span><i class="fa-solid fa-retweet"></i></span> ${isRegadded ? "Undo Regad" : "Regad"}
                  </button>
                  <button class="gt-dropdown-item" data-action="quote" data-gad-id="${gad.id}">
                    <span><i class="fa-solid fa-quote-left"></i></span> Quote
                  </button>
                </div>
              </div>
              <button class="gt-gad-action gt-gad-action-like ${
                isLiked ? "gt-active" : ""
              }" data-action="like" data-gad-id="${gad.id}" data-testid="like-${gad.id}">
                <span class="gt-action-icon">${
                  isLiked ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>'
                }</span>
                <span class="gt-action-count gt-action-count-clickable" data-action="who-liked" data-gad-id="${
                  gad.id
                }" title="See who liked">${formatCount(gad.likeCount || 0)}</span>
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

    // Clickable count elements (who liked, who regadded)
    container.querySelectorAll(".gt-action-count-clickable").forEach((countEl) => {
      countEl.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = countEl.dataset.action;
        const gadId = countEl.dataset.gadId;

        if (action === "who-liked" && window.GadTalkInteractionModals) {
          window.GadTalkInteractionModals.showWhoLikedModal(gadId);
        } else if (action === "who-regadded" && window.GadTalkInteractionModals) {
          window.GadTalkInteractionModals.showWhoRegaddedModal(gadId);
        }
      });
    });

    // Dropdown items (regad/quote menu, and delete menu)
    container.querySelectorAll(".gt-dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = item.dataset.action;

        if (action === "delete") {
          handleMenuAction(e);
        } else if (action === "regad" || action === "quote") {
          // Simulate action button click
          handleGadAction({ preventDefault: () => {}, stopPropagation: () => {}, currentTarget: item });
        }
      });
    });

    // Menu buttons (three dots)
    container.querySelectorAll(".gt-gad-menu-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        const dropdown = btn.nextElementSibling;
        dropdown.classList.toggle("gt-hidden");
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener("click", () => {
      closeAllDropdowns();
    });
  }

  /**
   * Handle gad action (like, regad, reply, etc.)
   */
  async function handleGadAction(event) {
    event.preventDefault();
    event.stopPropagation();
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
        case "regad-menu":
          handleRegadMenu(btn, gadId);
          break;
        case "regad":
          await handleRegad(btn, gadId);
          closeAllDropdowns();
          break;
        case "quote":
          closeAllDropdowns();
          openQuoteModal(gadId);
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
   * Handle regad menu toggle
   */
  function handleRegadMenu(btn, gadId) {
    closeAllDropdowns();
    const dropdown = document.querySelector(`[data-regad-dropdown="${gadId}"]`);
    if (dropdown) {
      dropdown.classList.toggle("gt-hidden");
    }
  }

  /**
   * Close all dropdown menus
   */
  function closeAllDropdowns() {
    document.querySelectorAll(".gt-dropdown").forEach((d) => d.classList.add("gt-hidden"));
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
    const regadBtn = btn.classList.contains("gt-gad-action-regad")
      ? btn
      : document.querySelector(`.gt-gad-action-regad[data-gad-id="${gadId}"]`);
    const isRegadded = regadBtn ? regadBtn.classList.contains("gt-active") : false;
    const countEl = regadBtn ? regadBtn.querySelector(".gt-action-count") : null;
    let count = countEl ? parseInt(countEl.textContent) || 0 : 0;

    // Optimistic update
    if (regadBtn) {
      regadBtn.classList.toggle("gt-active");
    }
    if (countEl) {
      countEl.textContent = formatCount(isRegadded ? count - 1 : count + 1);
    }

    const dropdown = document.querySelector(`[data-regad-dropdown="${gadId}"]`);
    const regadItem = dropdown ? dropdown.querySelector('[data-action="regad"]') : null;
    if (regadItem) {
      regadItem.innerHTML = `<span><i class="fa-solid fa-retweet"></i></span> ${isRegadded ? "Regad" : "Undo Regad"}`;
    }

    try {
      if (isRegadded) {
        await window.GadTalkAPI.gads.unregad(gadId);
      } else {
        await window.GadTalkAPI.gads.regad(gadId);
      }
    } catch (error) {
      // Revert on error
      if (regadBtn) {
        regadBtn.classList.toggle("gt-active");
      }
      if (countEl) {
        countEl.textContent = formatCount(count);
      }
      if (regadItem) {
        regadItem.innerHTML = `<span><i class="fa-solid fa-retweet"></i></span> ${isRegadded ? "Undo Regad" : "Regad"}`;
      }
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
  function initComposeForm(formId, textareaId, charCountId, submitBtnId, options = {}) {
    const form = document.getElementById(formId);
    const textarea = document.getElementById(textareaId);
    const charCount = document.getElementById(charCountId);
    const submitBtn = document.getElementById(submitBtnId);

    if (!form || !textarea) return;

    // Get optional elements based on options
    const imageUrlInput = options.imageUrlInputId ? document.getElementById(options.imageUrlInputId) : null;
    const imagePreview = options.imagePreviewId ? document.getElementById(options.imagePreviewId) : null;
    const quotedGadIdInput = options.quotedGadIdInputId ? document.getElementById(options.quotedGadIdInputId) : null;
    const quotePreview = options.quotePreviewId ? document.getElementById(options.quotePreviewId) : null;

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

    // Handle image preview removal
    if (imagePreview) {
      const removeBtn = imagePreview.querySelector(".gt-remove-image");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          if (imageUrlInput) imageUrlInput.value = "";
          imagePreview.classList.add("gt-hidden");
          const img = imagePreview.querySelector("img");
          if (img) img.src = "";
        });
      }
    }

    // Handle quote preview removal
    if (quotePreview) {
      quotePreview.addEventListener("click", (e) => {
        if (e.target.closest(".gt-remove-quote")) {
          if (quotedGadIdInput) quotedGadIdInput.value = "";
          quotePreview.classList.add("gt-hidden");
          quotePreview.innerHTML = "";
        }
      });
    }

    // Handle submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = textarea.value.trim();

      if (!content || content.length > MAX_GAD_LENGTH) return;

      submitBtn.disabled = true;
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = "Posting...";

      // Gather optional data
      const imageUrl = imageUrlInput?.value?.trim() || null;
      const quotedGadId = quotedGadIdInput?.value?.trim() || null;

      try {
        const response = await window.GadTalkAPI.gads.create(content, null, imageUrl, quotedGadId);
        const gad = response.gad || response;

        // Clear form
        textarea.value = "";
        if (charCount) charCount.textContent = MAX_GAD_LENGTH;
        submitBtn.textContent = originalBtnText;

        // Clear image
        if (imageUrlInput) imageUrlInput.value = "";
        if (imagePreview) {
          imagePreview.classList.add("gt-hidden");
          const img = imagePreview.querySelector("img");
          if (img) img.src = "";
        }

        // Clear quote
        if (quotedGadIdInput) quotedGadIdInput.value = "";
        if (quotePreview) {
          quotePreview.classList.add("gt-hidden");
          quotePreview.innerHTML = "";
        }

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
        const quoteModal = document.getElementById("quote-modal");
        if (quoteModal && !quoteModal.classList.contains("gt-hidden")) {
          quoteModal.classList.add("gt-hidden");
        }

        showToast("Gad posted!");
      } catch (error) {
        console.error("Error posting gad:", error);
        showToast("Failed to post gad", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }

  /**
   * Set image URL in compose form
   */
  function setComposeImage(imageUrl, previewId, inputId) {
    const preview = document.getElementById(previewId);
    const input = document.getElementById(inputId);

    if (input) input.value = imageUrl;
    if (preview) {
      const img = preview.querySelector("img");
      if (img) img.src = imageUrl;
      preview.classList.remove("gt-hidden");
    }
  }

  /**
   * Set quoted gad in compose form
   */
  function setComposeQuote(gad, previewId, inputId) {
    const preview = document.getElementById(previewId);
    const input = document.getElementById(inputId);

    if (!gad || !preview) return;

    if (input) input.value = gad.id;

    const user = gad.user || {};
    const displayName = user.displayName || user.username || "Unknown";
    const username = user.username || "unknown";
    const timeAgo = formatRelativeTime(gad.createdAt);
    const content = parseContent(gad.content);

    preview.innerHTML = `
      <div class="gt-quoted-gad">
        <button type="button" class="gt-icon-btn gt-remove-quote" title="Remove quote">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="gt-quoted-gad-header">
          <span class="gt-quoted-gad-author">
            <span class="gt-gad-display-name">${displayName}</span>
            <span class="gt-gad-username">@${username}</span>
          </span>
          <span class="gt-gad-separator">·</span>
          <span class="gt-gad-time">${timeAgo}</span>
        </div>
        <div class="gt-quoted-gad-content">${content}</div>
        ${gad.imageUrl ? `<div class="gt-quoted-gad-image"><img src="${gad.imageUrl}" alt="" /></div>` : ""}
      </div>
    `;
    preview.classList.remove("gt-hidden");
  }

  /**
   * Open quote modal for a gad
   */
  async function openQuoteModal(gadId) {
    const modal = document.getElementById("quote-modal");
    if (!modal) return;

    try {
      const gad = await window.GadTalkAPI.gads.getById(gadId);
      setComposeQuote(gad, "quote-gad-preview", "quote-quoted-gad-id");

      // Set user avatar
      const currentUser = window.gadTalkAuth.getCurrentUser();
      const avatarEl = document.getElementById("quote-compose-avatar");
      if (avatarEl && currentUser) {
        avatarEl.innerHTML = getAvatarHtml(currentUser, "md").replace(/<img|<div/, (match) =>
          match === "<img" ? '<img style="width:100%;height:100%;object-fit:cover;border-radius:50%"' : match
        );
      }

      // Show modal
      modal.classList.remove("gt-hidden");

      // Focus textarea
      const textarea = document.getElementById("quote-compose-textarea");
      if (textarea) textarea.focus();
    } catch (error) {
      console.error("Error loading gad for quote:", error);
      showToast("Failed to load gad", "error");
    }
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
    setComposeImage,
    setComposeQuote,
    openQuoteModal,
    MAX_GAD_LENGTH,
  };
})();

// Export for use in other scripts
window.gadTalkGads = gadTalkGads;
