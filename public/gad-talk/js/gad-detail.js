/**
 * GadTalk Gad Detail Page
 * Handles single gad view, replies, and interactions
 */

(function () {
  "use strict";

  const MAX_GAD_LENGTH = 280;
  const EDIT_WINDOW_MINUTES = 15;

  // State
  let currentGad = null;
  let currentUser = null;
  let repliesPage = 1;
  let repliesHasMore = false;
  let replyImageUrl = null;

  // DOM Elements
  const elements = {};

  /**
   * Initialize page
   */
  async function init() {
    cacheElements();
    setupEventListeners();
    await loadCurrentUser();

    const gadId = getGadIdFromUrl();
    if (gadId) {
      await loadGad(gadId);
    } else {
      showError("Invalid gad URL");
    }

    // Check if we should open reply composer
    const params = new URLSearchParams(window.location.search);
    if (params.get("reply") === "true") {
      focusReplyComposer();
    }

    // Load trending
    loadTrending();
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    elements.loading = document.getElementById("gad-loading");
    elements.error = document.getElementById("gad-error");
    elements.notFound = document.getElementById("gad-not-found");
    elements.container = document.getElementById("gad-detail-container");
    elements.mainGad = document.getElementById("main-gad");
    elements.parentContainer = document.getElementById("parent-gad-container");

    // Gad info elements
    elements.avatar = document.getElementById("gad-avatar");
    elements.displayName = document.getElementById("gad-display-name");
    elements.username = document.getElementById("gad-username");
    elements.verified = document.getElementById("gad-verified");
    elements.content = document.getElementById("gad-content");
    elements.imageContainer = document.getElementById("gad-image-container");
    elements.image = document.getElementById("gad-image");
    elements.timestamp = document.getElementById("gad-timestamp");
    elements.edited = document.getElementById("gad-edited");
    elements.quotedContainer = document.getElementById("quoted-gad-container");

    // Reply indicator
    elements.replyIndicator = document.getElementById("reply-indicator");
    elements.replyToLink = document.getElementById("reply-to-link");

    // Stats
    elements.regadCount = document.getElementById("regad-count");
    elements.likeCount = document.getElementById("like-count");
    elements.bookmarkCount = document.getElementById("bookmark-count");

    // Action buttons
    elements.likeBtn = document.getElementById("like-btn");
    elements.regadBtn = document.getElementById("regad-btn");
    elements.bookmarkBtn = document.getElementById("bookmark-btn");

    // Menu
    elements.menuBtn = document.getElementById("gad-menu-btn");
    elements.menuDropdown = document.getElementById("gad-menu-dropdown");
    elements.editBtn = document.getElementById("edit-gad-btn");
    elements.deleteBtn = document.getElementById("delete-gad-btn");
    elements.copyLinkBtn = document.getElementById("copy-link-btn");

    // Reply composer
    elements.replyForm = document.getElementById("reply-form");
    elements.replyTextarea = document.getElementById("reply-textarea");
    elements.replyCharCount = document.getElementById("reply-char-count");
    elements.replyBtn = document.getElementById("reply-btn");
    elements.replyAvatar = document.getElementById("reply-avatar");
    elements.replyContext = document.getElementById("reply-context");
    elements.replyingToUsername = document.getElementById("replying-to-username");
    elements.addImageBtn = document.getElementById("add-image-btn");

    // Replies
    elements.repliesSection = document.getElementById("replies-section");
    elements.repliesTitle = document.getElementById("replies-title");
    elements.repliesLoading = document.getElementById("replies-loading");
    elements.noReplies = document.getElementById("no-replies");
    elements.repliesList = document.getElementById("replies-list");
    elements.loadMoreReplies = document.getElementById("load-more-replies");
    elements.loadMoreRepliesBtn = document.getElementById("load-more-replies-btn");

    // Modals
    elements.regadModal = document.getElementById("regad-modal");
    elements.quoteModal = document.getElementById("quote-modal");
    elements.editModal = document.getElementById("edit-modal");
    elements.deleteModal = document.getElementById("delete-modal");
    elements.imageUrlModal = document.getElementById("image-url-modal");

    // Quote modal elements
    elements.quoteForm = document.getElementById("quote-form");
    elements.quoteTextarea = document.getElementById("quote-textarea");
    elements.quoteCharCount = document.getElementById("quote-char-count");
    elements.quotePreview = document.getElementById("quote-preview");
    elements.quoteAvatar = document.getElementById("quote-avatar");

    // Edit modal elements
    elements.editForm = document.getElementById("edit-form");
    elements.editTextarea = document.getElementById("edit-textarea");
    elements.editCharCount = document.getElementById("edit-char-count");
    elements.editAvatar = document.getElementById("edit-avatar");
    elements.editImageUrlContainer = document.getElementById("edit-image-url-container");
    elements.editImageUrl = document.getElementById("edit-image-url");
    elements.editAddImageBtn = document.getElementById("edit-add-image-btn");
    elements.removeEditImage = document.getElementById("remove-edit-image");
    elements.editWarning = document.getElementById("edit-warning");
    elements.editTimeRemaining = document.getElementById("edit-time-remaining");

    // Other
    elements.backBtn = document.getElementById("back-btn");
    elements.retryBtn = document.getElementById("retry-btn");
    elements.searchInput = document.getElementById("search-input");
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Back button
    elements.backBtn?.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/gad-talk/";
      }
    });

    // Retry button
    elements.retryBtn?.addEventListener("click", () => {
      const gadId = getGadIdFromUrl();
      if (gadId) loadGad(gadId);
    });

    // Menu toggle
    elements.menuBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      elements.menuDropdown?.classList.toggle("gt-hidden");
    });

    // Close menu on outside click
    document.addEventListener("click", () => {
      elements.menuDropdown?.classList.add("gt-hidden");
    });

    // Copy link
    elements.copyLinkBtn?.addEventListener("click", () => {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard", "success");
      elements.menuDropdown?.classList.add("gt-hidden");
    });

    // Edit button
    elements.editBtn?.addEventListener("click", () => {
      openEditModal();
      elements.menuDropdown?.classList.add("gt-hidden");
    });

    // Delete button
    elements.deleteBtn?.addEventListener("click", () => {
      openDeleteModal();
      elements.menuDropdown?.classList.add("gt-hidden");
    });

    // Action buttons
    elements.likeBtn?.addEventListener("click", handleLike);
    elements.regadBtn?.addEventListener("click", handleRegadClick);
    elements.bookmarkBtn?.addEventListener("click", handleBookmark);

    // Reply form
    elements.replyTextarea?.addEventListener("input", handleReplyInput);
    elements.replyForm?.addEventListener("submit", handleReplySubmit);

    // Add image button
    elements.addImageBtn?.addEventListener("click", () => {
      elements.imageUrlModal?.classList.remove("gt-hidden");
    });

    // Image URL modal
    document.getElementById("add-image-confirm")?.addEventListener("click", () => {
      const input = document.getElementById("image-url-input");
      if (input && input.value.trim()) {
        replyImageUrl = input.value.trim();
        showToast("Image added", "success");
        elements.addImageBtn?.classList.add("gt-active");
      }
      elements.imageUrlModal?.classList.add("gt-hidden");
    });

    // Quote form
    elements.quoteTextarea?.addEventListener("input", handleQuoteInput);
    elements.quoteForm?.addEventListener("submit", handleQuoteSubmit);

    // Edit form
    elements.editTextarea?.addEventListener("input", handleEditInput);
    elements.editForm?.addEventListener("submit", handleEditSubmit);
    elements.editAddImageBtn?.addEventListener("click", () => {
      elements.editImageUrlContainer?.classList.toggle("gt-hidden");
    });
    elements.removeEditImage?.addEventListener("click", () => {
      elements.editImageUrl.value = "";
      elements.editImageUrlContainer?.classList.add("gt-hidden");
    });

    // Regad modal options
    document.getElementById("regad-option")?.addEventListener("click", handleRegad);
    document.getElementById("quote-option")?.addEventListener("click", openQuoteModal);

    // Delete confirmation
    document.getElementById("confirm-delete-btn")?.addEventListener("click", handleDelete);

    // Load more replies
    elements.loadMoreRepliesBtn?.addEventListener("click", loadMoreReplies);

    // Search
    elements.searchInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim()) {
        window.location.href = `/gad-talk/search.html?q=${encodeURIComponent(e.target.value.trim())}`;
      }
    });

    // Modal close handlers
    document.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.target.closest(".gt-modal")?.classList.add("gt-hidden");
      });
    });

    // Escape key to close modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".gt-modal:not(.gt-hidden)").forEach((modal) => {
          modal.classList.add("gt-hidden");
        });
      }
    });
  }

  /**
   * Get gad ID from URL
   */
  function getGadIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  /**
   * Load current user
   */
  async function loadCurrentUser() {
    try {
      if (window.GadTalkAPI.auth.isAuthenticated()) {
        const response = await window.GadTalkAPI.auth.me();
        currentUser = response.user;
        updateReplyAvatar();
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  }

  /**
   * Update reply composer avatar
   */
  function updateReplyAvatar() {
    if (currentUser && elements.replyAvatar) {
      elements.replyAvatar.innerHTML = window.gadTalkGads.getAvatarHtml(currentUser, "md");
    }
    if (currentUser && elements.quoteAvatar) {
      elements.quoteAvatar.innerHTML = window.gadTalkGads.getAvatarHtml(currentUser, "md");
    }
    if (currentUser && elements.editAvatar) {
      elements.editAvatar.innerHTML = window.gadTalkGads.getAvatarHtml(currentUser, "md");
    }
  }

  /**
   * Load gad
   */
  async function loadGad(gadId) {
    showLoading();

    try {
      const response = await window.GadTalkAPI.gads.get(gadId);
      currentGad = response.gad;

      if (!currentGad) {
        showNotFound();
        return;
      }

      renderGad();
      showContainer();

      // Load replies
      await loadReplies();
    } catch (error) {
      console.error("Error loading gad:", error);
      if (error.status === 404) {
        showNotFound();
      } else {
        showError(error.message || "Failed to load gad");
      }
    }
  }

  /**
   * Render main gad
   */
  function renderGad() {
    const gad = currentGad;
    const user = gad.user || {};

    // Avatar
    elements.avatar.innerHTML = `
      <a href="/gad-talk/@${encodeURIComponent(user.username)}">
        ${window.gadTalkGads.getAvatarHtml(user, "lg")}
      </a>
    `;

    // User info
    elements.displayName.textContent = user.displayName || user.username || "Unknown";
    elements.displayName.href = `/gad-talk/@${encodeURIComponent(user.username)}`;
    elements.username.textContent = `@${user.username || "unknown"}`;
    elements.username.href = `/gad-talk/@${encodeURIComponent(user.username)}`;

    if (user.verified) {
      elements.verified.classList.remove("gt-hidden");
    }

    // Content
    elements.content.innerHTML = window.gadTalkGads.parseContent(gad.content);

    // Image
    if (gad.imageUrl) {
      elements.image.src = gad.imageUrl;
      elements.imageContainer.classList.remove("gt-hidden");
    }

    // Timestamp
    const createdAt = new Date(gad.createdAt);
    elements.timestamp.textContent = createdAt.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    elements.timestamp.setAttribute("datetime", gad.createdAt);

    // Edited indicator
    if (gad.editedAt) {
      elements.edited.classList.remove("gt-hidden");
    }

    // Reply indicator
    if (gad.replyToUser) {
      elements.replyIndicator.classList.remove("gt-hidden");
      elements.replyToLink.textContent = `@${gad.replyToUser.username}`;
      elements.replyToLink.href = `/gad-talk/@${encodeURIComponent(gad.replyToUser.username)}`;

      // Update reply context in composer
      elements.replyContext?.classList.remove("gt-hidden");
      elements.replyingToUsername.textContent = `@${user.username}`;
    } else {
      elements.replyContext?.classList.remove("gt-hidden");
      elements.replyingToUsername.textContent = `@${user.username}`;
    }

    // Quoted gad
    if (gad.quotedGad) {
      renderQuotedGad(gad.quotedGad, elements.quotedContainer);
      elements.quotedContainer.classList.remove("gt-hidden");
    }

    // Stats
    elements.regadCount.textContent = formatCount(gad.regadCount || 0);
    elements.likeCount.textContent = formatCount(gad.likeCount || 0);
    elements.bookmarkCount.textContent = "0"; // Bookmarks are private

    // Update action button states
    updateActionStates();

    // Show edit/delete buttons if owner
    if (currentUser && currentUser.id === gad.userId) {
      elements.deleteBtn?.classList.remove("gt-hidden");

      // Check if within edit window
      const createdAt = new Date(gad.createdAt);
      const now = new Date();
      const diffMinutes = (now - createdAt) / (1000 * 60);
      if (diffMinutes <= EDIT_WINDOW_MINUTES) {
        elements.editBtn?.classList.remove("gt-hidden");
      }
    }

    // Update page title
    document.title = `${user.displayName || user.username}: "${gad.content.substring(0, 50)}${
      gad.content.length > 50 ? "..." : ""
    }" - GadTalk`;
  }

  /**
   * Render quoted gad
   */
  function renderQuotedGad(quotedGad, container) {
    const user = quotedGad.user || {};
    container.innerHTML = `
      <a href="/gad-talk/gad.html?id=${quotedGad.id}" class="gt-quoted-gad-link">
        <div class="gt-quoted-gad-header">
          ${window.gadTalkGads.getAvatarHtml(user, "sm")}
          <span class="gt-quoted-display-name">${user.displayName || user.username}</span>
          ${user.verified ? '<span class="gt-verified"><i class="fa-solid fa-circle-check"></i></span>' : ""}
          <span class="gt-quoted-username">@${user.username}</span>
          <span class="gt-gad-separator">·</span>
          <span class="gt-quoted-time">${window.gadTalkGads.formatRelativeTime(quotedGad.createdAt)}</span>
        </div>
        <p class="gt-quoted-content">${escapeHtml(quotedGad.content)}</p>
        ${
          quotedGad.imageUrl ? `<img src="${quotedGad.imageUrl}" alt="Quoted gad image" class="gt-quoted-image" />` : ""
        }
      </a>
    `;
  }

  /**
   * Update action button states
   */
  function updateActionStates() {
    const gad = currentGad;

    // Like button
    if (gad.isLiked) {
      elements.likeBtn?.classList.add("gt-active");
      elements.likeBtn.querySelector(".gt-action-icon").innerHTML = '<i class="fa-solid fa-heart"></i>';
    } else {
      elements.likeBtn?.classList.remove("gt-active");
      elements.likeBtn.querySelector(".gt-action-icon").innerHTML = '<i class="fa-regular fa-heart"></i>';
    }

    // Regad button
    if (gad.isRegadded) {
      elements.regadBtn?.classList.add("gt-active");
    } else {
      elements.regadBtn?.classList.remove("gt-active");
    }

    // Bookmark button
    if (gad.isBookmarked) {
      elements.bookmarkBtn?.classList.add("gt-active");
      elements.bookmarkBtn.querySelector(".gt-action-icon").innerHTML = '<i class="fa-solid fa-bookmark"></i>';
    } else {
      elements.bookmarkBtn?.classList.remove("gt-active");
      elements.bookmarkBtn.querySelector(".gt-action-icon").innerHTML = '<i class="fa-regular fa-bookmark"></i>';
    }
  }

  /**
   * Load replies
   */
  async function loadReplies(append = false) {
    if (!append) {
      elements.repliesLoading?.classList.remove("gt-hidden");
      elements.noReplies?.classList.add("gt-hidden");
      repliesPage = 1;
    }

    try {
      const response = await window.GadTalkAPI.gads.getReplies(currentGad.id, repliesPage);
      const replies = response.gads || [];
      repliesHasMore = response.hasMore;

      elements.repliesLoading?.classList.add("gt-hidden");

      if (replies.length === 0 && !append) {
        elements.noReplies?.classList.remove("gt-hidden");
        elements.repliesTitle?.classList.add("gt-hidden");
      } else {
        elements.repliesTitle?.classList.remove("gt-hidden");
        window.gadTalkGads.renderGads(replies, elements.repliesList, currentUser?.id, append);
      }

      // Show/hide load more button
      if (repliesHasMore) {
        elements.loadMoreReplies?.classList.remove("gt-hidden");
      } else {
        elements.loadMoreReplies?.classList.add("gt-hidden");
      }
    } catch (error) {
      console.error("Error loading replies:", error);
      elements.repliesLoading?.classList.add("gt-hidden");
    }
  }

  /**
   * Load more replies
   */
  async function loadMoreReplies() {
    repliesPage++;
    await loadReplies(true);
  }

  /**
   * Handle reply input
   */
  function handleReplyInput() {
    const remaining = MAX_GAD_LENGTH - elements.replyTextarea.value.length;
    elements.replyCharCount.textContent = remaining;
    elements.replyCharCount.classList.toggle("gt-warning", remaining < 20);
    elements.replyCharCount.classList.toggle("gt-danger", remaining < 0);
    elements.replyBtn.disabled = remaining < 0 || elements.replyTextarea.value.trim().length === 0;
  }

  /**
   * Handle reply submit
   */
  async function handleReplySubmit(e) {
    e.preventDefault();

    if (!checkAuth("reply")) return;

    const content = elements.replyTextarea.value.trim();
    if (!content) return;

    elements.replyBtn.disabled = true;
    elements.replyBtn.textContent = "Replying...";

    try {
      const options = { replyTo: currentGad.id };
      if (replyImageUrl) {
        options.imageUrl = replyImageUrl;
      }

      const response = await window.GadTalkAPI.gads.create(content, options);

      // Clear form
      elements.replyTextarea.value = "";
      elements.replyCharCount.textContent = MAX_GAD_LENGTH;
      replyImageUrl = null;
      elements.addImageBtn?.classList.remove("gt-active");

      // Add reply to list
      elements.noReplies?.classList.add("gt-hidden");
      elements.repliesTitle?.classList.remove("gt-hidden");
      elements.repliesList.insertAdjacentHTML(
        "afterbegin",
        window.gadTalkGads.renderGad(response.gad, currentUser?.id)
      );
      window.gadTalkGads.attachGadEventListeners(elements.repliesList);

      // Update reply count
      currentGad.replyCount = (currentGad.replyCount || 0) + 1;

      showToast("Reply posted!", "success");
    } catch (error) {
      console.error("Error posting reply:", error);
      showToast(error.message || "Failed to post reply", "error");
    } finally {
      elements.replyBtn.disabled = false;
      elements.replyBtn.textContent = "Reply";
    }
  }

  /**
   * Handle like
   */
  async function handleLike() {
    if (!checkAuth("like")) return;

    const isLiked = currentGad.isLiked;
    const newCount = (currentGad.likeCount || 0) + (isLiked ? -1 : 1);

    // Optimistic update
    currentGad.isLiked = !isLiked;
    currentGad.likeCount = newCount;
    updateActionStates();
    elements.likeCount.textContent = formatCount(newCount);

    try {
      if (isLiked) {
        await window.GadTalkAPI.gads.unlike(currentGad.id);
      } else {
        await window.GadTalkAPI.gads.like(currentGad.id);
      }
    } catch (error) {
      // Revert on error
      currentGad.isLiked = isLiked;
      currentGad.likeCount = (currentGad.likeCount || 0) + (isLiked ? 1 : -1);
      updateActionStates();
      elements.likeCount.textContent = formatCount(currentGad.likeCount);
      showToast("Failed to update like", "error");
    }
  }

  /**
   * Handle regad button click - show options
   */
  function handleRegadClick() {
    if (!checkAuth("regad")) return;
    elements.regadModal?.classList.remove("gt-hidden");
  }

  /**
   * Handle regad
   */
  async function handleRegad() {
    elements.regadModal?.classList.add("gt-hidden");

    const isRegadded = currentGad.isRegadded;
    const newCount = (currentGad.regadCount || 0) + (isRegadded ? -1 : 1);

    // Optimistic update
    currentGad.isRegadded = !isRegadded;
    currentGad.regadCount = newCount;
    updateActionStates();
    elements.regadCount.textContent = formatCount(newCount);

    try {
      if (isRegadded) {
        await window.GadTalkAPI.gads.unregad(currentGad.id);
        showToast("Regad removed", "success");
      } else {
        await window.GadTalkAPI.gads.regad(currentGad.id);
        showToast("Regadded!", "success");
      }
    } catch (error) {
      // Revert on error
      currentGad.isRegadded = isRegadded;
      currentGad.regadCount = (currentGad.regadCount || 0) + (isRegadded ? 1 : -1);
      updateActionStates();
      elements.regadCount.textContent = formatCount(currentGad.regadCount);
      showToast("Failed to regad", "error");
    }
  }

  /**
   * Handle bookmark
   */
  async function handleBookmark() {
    if (!checkAuth("bookmark")) return;

    const isBookmarked = currentGad.isBookmarked;

    // Optimistic update
    currentGad.isBookmarked = !isBookmarked;
    updateActionStates();

    try {
      if (isBookmarked) {
        await window.GadTalkAPI.gads.unbookmark(currentGad.id);
        showToast("Removed from bookmarks", "success");
      } else {
        await window.GadTalkAPI.gads.bookmark(currentGad.id);
        showToast("Added to bookmarks", "success");
      }
    } catch (error) {
      // Revert on error
      currentGad.isBookmarked = isBookmarked;
      updateActionStates();
      showToast("Failed to update bookmark", "error");
    }
  }

  /**
   * Open quote modal
   */
  function openQuoteModal() {
    elements.regadModal?.classList.add("gt-hidden");

    // Set up quote preview
    const user = currentGad.user || {};
    elements.quotePreview.innerHTML = `
      <div class="gt-quoted-gad-preview-content">
        <div class="gt-quoted-gad-header">
          ${window.gadTalkGads.getAvatarHtml(user, "sm")}
          <span class="gt-quoted-display-name">${user.displayName || user.username}</span>
          <span class="gt-quoted-username">@${user.username}</span>
        </div>
        <p class="gt-quoted-content">${escapeHtml(currentGad.content.substring(0, 100))}${
      currentGad.content.length > 100 ? "..." : ""
    }</p>
      </div>
    `;

    elements.quoteTextarea.value = "";
    elements.quoteCharCount.textContent = MAX_GAD_LENGTH;
    elements.quoteModal?.classList.remove("gt-hidden");
    elements.quoteTextarea?.focus();
  }

  /**
   * Handle quote input
   */
  function handleQuoteInput() {
    const remaining = MAX_GAD_LENGTH - elements.quoteTextarea.value.length;
    elements.quoteCharCount.textContent = remaining;
    elements.quoteCharCount.classList.toggle("gt-warning", remaining < 20);
    elements.quoteCharCount.classList.toggle("gt-danger", remaining < 0);
  }

  /**
   * Handle quote submit
   */
  async function handleQuoteSubmit(e) {
    e.preventDefault();

    const content = elements.quoteTextarea.value.trim();
    if (!content) {
      showToast("Please add a comment", "warning");
      return;
    }

    const submitBtn = document.getElementById("quote-submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Posting...";

    try {
      await window.GadTalkAPI.gads.create(content, { quotedGadId: currentGad.id });
      elements.quoteModal?.classList.add("gt-hidden");
      showToast("Quote posted!", "success");
    } catch (error) {
      console.error("Error posting quote:", error);
      showToast(error.message || "Failed to post quote", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Quote";
    }
  }

  /**
   * Open edit modal
   */
  function openEditModal() {
    if (!currentGad) return;

    elements.editTextarea.value = currentGad.content;
    elements.editCharCount.textContent = MAX_GAD_LENGTH - currentGad.content.length;

    if (currentGad.imageUrl) {
      elements.editImageUrl.value = currentGad.imageUrl;
      elements.editImageUrlContainer?.classList.remove("gt-hidden");
    } else {
      elements.editImageUrl.value = "";
      elements.editImageUrlContainer?.classList.add("gt-hidden");
    }

    // Calculate remaining edit time
    const createdAt = new Date(currentGad.createdAt);
    const now = new Date();
    const diffMinutes = (now - createdAt) / (1000 * 60);
    const remainingMinutes = Math.max(0, Math.ceil(EDIT_WINDOW_MINUTES - diffMinutes));
    elements.editTimeRemaining.textContent = `${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`;

    elements.editModal?.classList.remove("gt-hidden");
    elements.editTextarea?.focus();
  }

  /**
   * Handle edit input
   */
  function handleEditInput() {
    const remaining = MAX_GAD_LENGTH - elements.editTextarea.value.length;
    elements.editCharCount.textContent = remaining;
    elements.editCharCount.classList.toggle("gt-warning", remaining < 20);
    elements.editCharCount.classList.toggle("gt-danger", remaining < 0);
  }

  /**
   * Handle edit submit
   */
  async function handleEditSubmit(e) {
    e.preventDefault();

    const content = elements.editTextarea.value.trim();
    if (!content) {
      showToast("Content is required", "warning");
      return;
    }

    const submitBtn = document.getElementById("edit-submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    try {
      const updates = { content };
      if (elements.editImageUrl.value.trim()) {
        updates.imageUrl = elements.editImageUrl.value.trim();
      } else if (currentGad.imageUrl && !elements.editImageUrl.value.trim()) {
        updates.imageUrl = null;
      }

      const response = await fetch(`/api/gad-talk/gads/${currentGad.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.GadTalkAPI.getToken()}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update gad");
      }

      // Update current gad
      currentGad.content = data.gad.content;
      currentGad.imageUrl = data.gad.imageUrl;
      currentGad.editedAt = data.gad.editedAt;
      currentGad.hashtags = data.gad.hashtags;
      currentGad.mentions = data.gad.mentions;

      // Re-render
      renderGad();

      elements.editModal?.classList.add("gt-hidden");
      showToast("Gad updated!", "success");
    } catch (error) {
      console.error("Error updating gad:", error);
      showToast(error.message || "Failed to update gad", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save";
    }
  }

  /**
   * Open delete modal
   */
  function openDeleteModal() {
    elements.deleteModal?.classList.remove("gt-hidden");
  }

  /**
   * Handle delete
   */
  async function handleDelete() {
    const confirmBtn = document.getElementById("confirm-delete-btn");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Deleting...";

    try {
      await window.GadTalkAPI.gads.delete(currentGad.id);
      showToast("Gad deleted", "success");
      window.location.href = "/gad-talk/";
    } catch (error) {
      console.error("Error deleting gad:", error);
      showToast(error.message || "Failed to delete gad", "error");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Delete";
    }
  }

  /**
   * Focus reply composer
   */
  function focusReplyComposer() {
    elements.replyTextarea?.focus();
    elements.replyTextarea?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /**
   * Load trending hashtags
   */
  async function loadTrending() {
    const trendingList = document.getElementById("trending-list");
    if (!trendingList) return;

    try {
      const response = await window.GadTalkAPI.hashtags.getTrending(5);
      const hashtags = response.hashtags || [];

      if (hashtags.length === 0) {
        trendingList.innerHTML = '<p class="gt-text-secondary gt-text-sm">No trending topics</p>';
        return;
      }

      trendingList.innerHTML = hashtags
        .map(
          (tag) => `
        <a href="/gad-talk/explore.html?hashtag=${tag.tag || tag.name}" class="gt-trending-item">
          <span class="gt-trending-category">Trending</span>
          <span class="gt-trending-tag">#${tag.tag || tag.name}</span>
          <span class="gt-trending-count">${formatCount(tag.count)} gads</span>
        </a>
      `
        )
        .join("");
    } catch (error) {
      console.error("Error loading trending:", error);
      trendingList.innerHTML = '<p class="gt-text-secondary gt-text-sm">Failed to load</p>';
    }
  }

  /**
   * Check if user is authenticated
   */
  function checkAuth(action) {
    if (!window.GadTalkAPI.auth.isAuthenticated()) {
      showToast(`Please log in to ${action}`, "warning");
      setTimeout(() => {
        window.location.href = "/gad-talk/login.html";
      }, 1500);
      return false;
    }
    return true;
  }

  // UI Helper functions
  function showLoading() {
    elements.loading?.classList.remove("gt-hidden");
    elements.error?.classList.add("gt-hidden");
    elements.notFound?.classList.add("gt-hidden");
    elements.container?.classList.add("gt-hidden");
  }

  function showError(message) {
    elements.loading?.classList.add("gt-hidden");
    elements.error?.classList.remove("gt-hidden");
    elements.notFound?.classList.add("gt-hidden");
    elements.container?.classList.add("gt-hidden");
    document.getElementById("error-message").textContent = message;
  }

  function showNotFound() {
    elements.loading?.classList.add("gt-hidden");
    elements.error?.classList.add("gt-hidden");
    elements.notFound?.classList.remove("gt-hidden");
    elements.container?.classList.add("gt-hidden");
  }

  function showContainer() {
    elements.loading?.classList.add("gt-hidden");
    elements.error?.classList.add("gt-hidden");
    elements.notFound?.classList.add("gt-hidden");
    elements.container?.classList.remove("gt-hidden");
  }

  function showToast(message, type = "info") {
    if (window.GadTalkUI && window.GadTalkUI.toast) {
      window.GadTalkUI.toast[type](message);
    } else if (window.gadTalkGads && window.gadTalkGads.showToast) {
      window.gadTalkGads.showToast(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  }

  function formatCount(num) {
    return window.gadTalkGads ? window.gadTalkGads.formatCount(num) : num.toString();
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
