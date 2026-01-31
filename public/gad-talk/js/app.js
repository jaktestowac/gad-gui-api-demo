/**
 * GadTalk Main Application
 * Handles the home feed and main app functionality
 */

const gadTalkApp = (function () {
  let currentUser = null;
  let currentFeed = "for-you";
  let currentSort = "latest";
  let currentPage = 1;
  let isLoading = false;
  let hasMore = true;
  let isGuestMode = false;
  let guestRedirectTimer = null;
  let guestScrollHandler = null;
  let featureFlags = {};
  let hashtagHashEnabled = true;

  function showFollowMessage(container, message) {
    if (!container) return;
    let msgEl = container.querySelector(".gt-follow-message");
    if (!msgEl) {
      msgEl = document.createElement("span");
      msgEl.className = "gt-text-secondary gt-text-sm gt-follow-message";
      msgEl.setAttribute("role", "status");
      container.appendChild(msgEl);
    }
    msgEl.textContent = message;

    clearTimeout(msgEl._gtHideTimer);
    msgEl._gtHideTimer = setTimeout(() => {
      if (msgEl && msgEl.parentElement) {
        msgEl.parentElement.removeChild(msgEl);
      }
    }, 3000);
  }

  async function getFollowingIds() {
    const followingIds = new Set();
    if (!currentUser || !window.GadTalkAPI?.users?.getFollowing) return followingIds;

    try {
      const followingResponse = await window.GadTalkAPI.users.getFollowing(currentUser.id, 1, 200);
      const followingUsers = followingResponse?.users || followingResponse?.following || followingResponse?.data || [];
      followingUsers.forEach((user) => {
        if (user && user.id) {
          followingIds.add(user.id);
        }
      });
    } catch (error) {
      // Silently ignore follow list fetch errors to avoid console noise
    }

    return followingIds;
  }

  function scoreSuggestedUser(user) {
    if (!user) return -Infinity;
    let score = 0;

    score += (user.followersCount || 0) * 2;
    score += user.gadsCount || 0;
    if (user.role === "admin") score += 25;

    if (user.lastLoginAt) {
      const lastLogin = Date.parse(user.lastLoginAt);
      if (!Number.isNaN(lastLogin)) {
        const daysAgo = (Date.now() - lastLogin) / (1000 * 60 * 60 * 24);
        if (daysAgo <= 1) score += 15;
        else if (daysAgo <= 7) score += 8;
      }
    }

    return score + Math.random();
  }

  function mergeUniqueUsers(existing, incoming) {
    const byId = new Map(existing.map((user) => [user.id, user]));
    incoming.forEach((user) => {
      if (user && user.id && !byId.has(user.id)) {
        byId.set(user.id, user);
      }
    });
    return Array.from(byId.values());
  }

  async function getSuggestedUsers(limit = 3) {
    let candidates = [];

    try {
      const response = await window.GadTalkAPI.users.getSuggestions(limit * 2);
      candidates = mergeUniqueUsers(candidates, response?.users || []);
    } catch (error) {
      // Ignore to allow other sources
    }

    try {
      if (window.GadTalkAPI?.explore?.getData) {
        const explore = await window.GadTalkAPI.explore.getData();
        candidates = mergeUniqueUsers(candidates, explore?.suggestedUsers || []);
      }
    } catch (error) {
      // Ignore to allow other sources
    }

    const searchQueries = ["a", "e", "i", "o", "u", "test", "qa", "dev", "auto"];
    for (const query of searchQueries) {
      if (candidates.length >= limit * 3) break;
      try {
        const response = await window.GadTalkAPI.users.search(query, 1, 10);
        candidates = mergeUniqueUsers(candidates, response?.users || []);
      } catch (error) {
        // Ignore and continue
      }
    }

    const followingIds = await getFollowingIds();
    const filtered = candidates.filter(
      (user) => user && user.id && !followingIds.has(user.id) && (!currentUser || user.id !== currentUser.id)
    );

    return filtered.sort((a, b) => scoreSuggestedUser(b) - scoreSuggestedUser(a)).slice(0, limit);
  }

  // Guest mode settings
  const GUEST_REDIRECT_DELAY = 30000; // 30 seconds
  const GUEST_SCROLL_THRESHOLD = 800; // pixels scrolled to trigger redirect

  /**
   * Initialize the app
   */
  async function init() {
    await loadFeatureFlags();
    applyFeatureFlags();

    if (hashtagHashEnabled && handleHashtagHashRedirect()) {
      return;
    }

    // Use optional auth - allow guests to view content
    currentUser = await window.gadTalkAuth.optionalAuth();
    isGuestMode = !currentUser;

    if (isGuestMode) {
      // Setup guest mode experience
      setupGuestMode();
    } else {
      // Full authenticated experience
      setupAuthenticatedMode();
    }

    // Common setup for both modes
    setupFeedTabs();
    setupSortOptions();
    setupSearch();

    // Load initial feed (works for both guest and authenticated)
    await loadFeed();

    // Load sidebar content
    loadTrending();
    loadSuggestions();

    // Setup infinite scroll
    setupInfiniteScroll();

    // Close dropdowns when clicking outside
    document.addEventListener("click", () => {
      document.querySelectorAll(".gt-dropdown").forEach((dropdown) => {
        dropdown.classList.add("gt-hidden");
      });
    });
  }

  async function loadFeatureFlags() {
    if (!window.GadTalkAPI || !window.GadTalkAPI.featureFlags) return;
    try {
      const response = await window.GadTalkAPI.featureFlags.getAll();
      const flags = response?.data || response?.flags || response || [];
      featureFlags = flags.reduce((acc, flag) => {
        acc[String(flag.key || "").toLowerCase()] = !!flag.enabled;
        return acc;
      }, {});
    } catch (error) {
      featureFlags = {};
    }
  }

  function applyFeatureFlags() {
    hashtagHashEnabled = featureFlags.hashtag_hash_url !== false;
  }

  function handleHashtagHashRedirect() {
    const hashtag = getHashtagFromHash();
    if (!hashtag) return false;

    const target = `/gad-talk/explore.html?hashtag=${encodeURIComponent(hashtag)}`;
    window.location.replace(target);
    return true;
  }

  function getHashtagFromHash() {
    const raw = window.location.hash || "";
    if (!raw || raw === "#") return null;

    let decoded = "";
    try {
      decoded = decodeURIComponent(raw.slice(1));
    } catch (error) {
      decoded = raw.slice(1);
    }

    const trimmed = decoded.trim().replace(/^#/, "");
    if (!trimmed) return null;

    const match = trimmed.match(/[a-zA-Z0-9_]+/);
    return match ? match[0] : null;
  }

  /**
   * Setup guest mode - show content but redirect after scroll or 30s
   */
  function setupGuestMode() {
    // Update nav to show login/signup buttons
    updateNavForGuest();

    // Hide compose section for guests
    const composeSection = document.getElementById("compose-section");
    if (composeSection) {
      composeSection.classList.add("gt-hidden");
    }

    // Hide compose button in sidebar
    const composeBtn = document.getElementById("compose-btn");
    if (composeBtn) {
      composeBtn.classList.add("gt-hidden");
    }

    // Hide notifications nav item (or disable it)
    const notificationsNav = document.querySelector('[data-testid="nav-notifications"]');
    if (notificationsNav) {
      notificationsNav.addEventListener("click", (e) => {
        e.preventDefault();
        showLoginPrompt("notifications");
      });
    }

    // Hide bookmarks nav item (or disable it)
    const bookmarksNav = document.querySelector('[data-testid="nav-bookmarks"]');
    if (bookmarksNav) {
      bookmarksNav.addEventListener("click", (e) => {
        e.preventDefault();
        showLoginPrompt("bookmarks");
      });
    }

    // Hide profile nav item (or disable it)
    const profileNav = document.getElementById("nav-profile");
    if (profileNav) {
      profileNav.addEventListener("click", (e) => {
        e.preventDefault();
        showLoginPrompt("profile");
      });
    }

    // Start redirect timer (30 seconds)
    guestRedirectTimer = setTimeout(() => {
      showLoginPrompt("timeout");
    }, GUEST_REDIRECT_DELAY);

    // Setup scroll-based redirect
    let totalScrolled = 0;
    let lastScrollY = window.scrollY;

    guestScrollHandler = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      totalScrolled += scrollDelta;
      lastScrollY = currentScrollY;

      if (totalScrolled > GUEST_SCROLL_THRESHOLD) {
        // Remove scroll listener to prevent multiple triggers
        window.removeEventListener("scroll", guestScrollHandler);
        showLoginPrompt("scroll");
      }
    };

    window.addEventListener("scroll", guestScrollHandler);
  }

  /**
   * Setup authenticated mode - full experience
   */
  function setupAuthenticatedMode() {
    // Update nav user section
    updateNavUser();

    // Update compose avatars
    updateComposeAvatars();

    // Initialize compose forms with image and quote support
    window.gadTalkGads.initComposeForm("compose-form", "compose-textarea", "char-count", "post-btn", {
      imageUrlInputId: "compose-image-url",
      imagePreviewId: "compose-image-preview",
      quotedGadIdInputId: "compose-quoted-gad-id",
      quotePreviewId: "compose-quote-preview",
    });
    window.gadTalkGads.initComposeForm(
      "modal-compose-form",
      "modal-compose-textarea",
      "modal-char-count",
      "modal-post-btn",
      {
        imageUrlInputId: "modal-image-url",
        imagePreviewId: "modal-image-preview",
        quotedGadIdInputId: "modal-quoted-gad-id",
        quotePreviewId: "modal-quote-preview",
      }
    );

    // Initialize quote compose form
    window.gadTalkGads.initComposeForm(
      "quote-compose-form",
      "quote-compose-textarea",
      "quote-char-count",
      "quote-post-btn",
      {
        quotedGadIdInputId: "quote-quoted-gad-id",
        quotePreviewId: "quote-gad-preview",
      }
    );

    // Setup compose modal
    setupComposeModal();

    // Setup image URL modal
    setupImageUrlModal();

    // Setup quote modal close handlers
    setupQuoteModal();

    // Setup nav profile link
    const navProfile = document.getElementById("nav-profile");
    if (navProfile) {
      navProfile.href = `/gad-talk/@${encodeURIComponent(currentUser.username)}`;
    }

    // Check for unread notifications
    checkNotifications();
  }

  /**
   * Update navigation for guest users
   */
  function updateNavForGuest() {
    const navUserSection = document.getElementById("nav-user-section");
    if (!navUserSection) return;

    navUserSection.innerHTML = `
      <div class="gt-nav-user gt-flex gt-gap-sm">
        <a href="/gad-talk/login.html" class="gt-btn gt-btn-secondary gt-btn-sm" data-testid="nav-login-button">
          Login
        </a>
        <a href="/gad-talk/signup.html" class="gt-btn gt-btn-primary gt-btn-sm" data-testid="nav-signup-button">
          Sign up
        </a>
      </div>
    `;
  }

  /**
   * Show login prompt modal for guests
   */
  function showLoginPrompt(reason = "action") {
    // Clear any pending timers
    if (guestRedirectTimer) {
      clearTimeout(guestRedirectTimer);
      guestRedirectTimer = null;
    }
    if (guestScrollHandler) {
      window.removeEventListener("scroll", guestScrollHandler);
      guestScrollHandler = null;
    }

    // Create and show login prompt modal
    const existingModal = document.getElementById("guest-login-modal");
    if (existingModal) {
      existingModal.remove();
    }

    let message = "Sign in to get the full GadTalk experience!";
    if (reason === "timeout") {
      message = "Thanks for checking out GadTalk! Sign in to continue exploring.";
    } else if (reason === "scroll") {
      message = "Enjoying GadTalk? Sign in to like, comment, and post your own gads!";
    } else if (reason === "notifications") {
      message = "Sign in to view your notifications.";
    } else if (reason === "bookmarks") {
      message = "Sign in to save your favorite gads.";
    } else if (reason === "profile") {
      message = "Sign in to view and customize your profile.";
    } else if (reason === "following") {
      message = "Sign in to see posts from people you follow.";
    } else if (reason === "like" || reason === "regad" || reason === "reply") {
      message = "Sign in to interact with gads.";
    }

    const modal = document.createElement("div");
    modal.id = "guest-login-modal";
    modal.className = "gt-modal";
    modal.innerHTML = `
      <div class="gt-modal-overlay"></div>
      <div class="gt-modal-content gt-card" style="max-width: 400px; text-align: center;">
        <div class="gt-modal-header" style="justify-content: center;">
          <h2 style="margin: 0;">Join GadTalk</h2>
        </div>
        <div style="padding: var(--gt-spacing-lg);">
          <p class="gt-text-secondary" style="margin-bottom: var(--gt-spacing-lg);">${message}</p>
          <div class="gt-flex gt-flex-col gt-gap-md">
            <a href="/gad-talk/login.html" class="gt-btn gt-btn-primary gt-btn-block gt-btn-lg" data-testid="modal-login-button">
              Sign in
            </a>
            <a href="/gad-talk/signup.html" class="gt-btn gt-btn-secondary gt-btn-block" data-testid="modal-signup-button">
              Create account
            </a>
          </div>
          <button type="button" class="gt-link gt-text-sm" style="margin-top: var(--gt-spacing-md); background: none; border: none; cursor: pointer;" data-dismiss-modal>
            Maybe later
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle dismiss
    modal.querySelector("[data-dismiss-modal]").addEventListener("click", () => {
      modal.remove();
      // Reset scroll tracking for another chance
      if (!guestScrollHandler) {
        let totalScrolled = 0;
        let lastScrollY = window.scrollY;
        guestScrollHandler = () => {
          const currentScrollY = window.scrollY;
          const scrollDelta = Math.abs(currentScrollY - lastScrollY);
          totalScrolled += scrollDelta;
          lastScrollY = currentScrollY;
          if (totalScrolled > GUEST_SCROLL_THRESHOLD * 2) {
            // Double threshold after dismiss
            window.removeEventListener("scroll", guestScrollHandler);
            showLoginPrompt("scroll");
          }
        };
        window.addEventListener("scroll", guestScrollHandler);
      }
    });

    // Handle overlay click
    modal.querySelector(".gt-modal-overlay").addEventListener("click", () => {
      modal.remove();
    });
  }

  /**
   * Update navigation user section
   */
  function updateNavUser() {
    const navUserSection = document.getElementById("nav-user-section");
    if (!navUserSection || !currentUser) return;

    // Render a modern dropdown button for the user
    navUserSection.innerHTML = `
      <div class="gt-nav-user">
        <button class="gt-nav-user-btn" id="nav-user-dropdown-btn" aria-haspopup="true" aria-expanded="false">
          ${window.gadTalkGads.getAvatarHtml(currentUser, "sm")}
          <span class="gt-nav-user-name">${currentUser.displayName || currentUser.username}</span>
          <span class="gt-nav-user-chevron"><i class="fa-solid fa-chevron-down"></i></span>
        </button>
      </div>
    `;

    const dropdownBtn = navUserSection.querySelector("#nav-user-dropdown-btn");
    if (dropdownBtn && window.GadTalkUI) {
      dropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownBtn.setAttribute("aria-expanded", "true");
        window.GadTalkUI.showDropdown(
          dropdownBtn,
          [
            {
              text: "Profile",
              icon: '<i class="fa-solid fa-user"></i>',
              onClick: () => {
                window.location.href = `/gad-talk/@${encodeURIComponent(currentUser.username)}`;
              },
            },
            {
              text: "Bookmarks",
              icon: '<i class="fa-solid fa-bookmark"></i>',
              onClick: () => {
                window.location.href = "/gad-talk/bookmarks.html";
              },
            },
            { divider: true },
            {
              text: "Logout",
              icon: '<i class="fa-solid fa-right-from-bracket"></i>',
              danger: true,
              onClick: () => window.gadTalkAuth.handleLogout(),
            },
          ],
          { align: "right" }
        );
        // When clicking anywhere else, close will hide dropdown and we can reset aria state
        setTimeout(() => {
          const onDocClick = () => {
            dropdownBtn.setAttribute("aria-expanded", "false");
            document.removeEventListener("click", onDocClick);
          };
          document.addEventListener("click", onDocClick);
        }, 0);
      });
    } else if (dropdownBtn) {
      // Fallback: navigate to profile on click
      dropdownBtn.addEventListener("click", () => {
        window.location.href = `/gad-talk/@${encodeURIComponent(currentUser.username)}`;
      });
    }
  }

  /**
   * Update compose avatars
   */
  function updateComposeAvatars() {
    const composeAvatar = document.getElementById("compose-avatar");
    const modalComposeAvatar = document.getElementById("modal-compose-avatar");

    if (composeAvatar && currentUser) {
      composeAvatar.innerHTML = window.gadTalkGads.getAvatarHtml(currentUser, "md");
    }
    if (modalComposeAvatar && currentUser) {
      modalComposeAvatar.innerHTML = window.gadTalkGads.getAvatarHtml(currentUser, "md");
    }
  }

  /**
   * Setup compose modal
   */
  function setupComposeModal() {
    const composeBtn = document.getElementById("compose-btn");
    const composeModal = document.getElementById("compose-modal");

    if (!composeBtn || !composeModal) return;

    composeBtn.addEventListener("click", () => {
      composeModal.classList.remove("gt-hidden");
      const textarea = document.getElementById("modal-compose-textarea");
      if (textarea) textarea.focus();
    });

    // Close modal handlers
    composeModal.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", () => {
        composeModal.classList.add("gt-hidden");
      });
    });

    // Close on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !composeModal.classList.contains("gt-hidden")) {
        composeModal.classList.add("gt-hidden");
      }
    });
  }

  /**
   * Setup image URL modal
   */
  function setupImageUrlModal() {
    const imageUrlModal = document.getElementById("image-url-modal");
    if (!imageUrlModal) return;

    let targetPreviewId = null;
    let targetInputId = null;

    // Handle add image buttons in compose forms
    const addImageBtns = [
      { btn: "add-image-btn", preview: "compose-image-preview", input: "compose-image-url" },
      { btn: "modal-add-image-btn", preview: "modal-image-preview", input: "modal-image-url" },
    ];

    addImageBtns.forEach(({ btn, preview, input }) => {
      const button = document.getElementById(btn);
      if (button) {
        button.addEventListener("click", () => {
          targetPreviewId = preview;
          targetInputId = input;
          document.getElementById("image-url-input").value = "";
          imageUrlModal.classList.remove("gt-hidden");
        });
      }
    });

    // Handle confirm button
    const confirmBtn = document.getElementById("confirm-image-url-btn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        const imageUrl = document.getElementById("image-url-input").value.trim();
        if (imageUrl && targetPreviewId && targetInputId) {
          window.gadTalkGads.setComposeImage(imageUrl, targetPreviewId, targetInputId);
        }
        imageUrlModal.classList.add("gt-hidden");
      });
    }

    // Close modal handlers
    imageUrlModal.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", () => {
        imageUrlModal.classList.add("gt-hidden");
      });
    });
  }

  /**
   * Setup quote modal
   */
  function setupQuoteModal() {
    const quoteModal = document.getElementById("quote-modal");
    if (!quoteModal) return;

    // Set quote compose avatar
    const quoteAvatar = document.getElementById("quote-compose-avatar");
    if (quoteAvatar && currentUser) {
      quoteAvatar.innerHTML = window.gadTalkGads.getAvatarHtml(currentUser, "md");
    }

    // Close modal handlers
    quoteModal.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", () => {
        quoteModal.classList.add("gt-hidden");
        // Clear the form
        const textarea = document.getElementById("quote-compose-textarea");
        const charCount = document.getElementById("quote-char-count");
        const quotedGadIdInput = document.getElementById("quote-quoted-gad-id");
        const quotePreview = document.getElementById("quote-gad-preview");

        if (textarea) textarea.value = "";
        if (charCount) charCount.textContent = "280";
        if (quotedGadIdInput) quotedGadIdInput.value = "";
        if (quotePreview) quotePreview.innerHTML = "";
      });
    });

    // Close on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !quoteModal.classList.contains("gt-hidden")) {
        quoteModal.classList.add("gt-hidden");
      }
    });
  }

  /**
   * Setup feed tabs
   */
  function setupFeedTabs() {
    const tabs = document.querySelectorAll(".gt-tab[data-feed]");
    tabs.forEach((tab) => {
      tab.addEventListener("click", async () => {
        const feedType = tab.dataset.feed;

        // Following tab requires authentication
        if (feedType === "following" && isGuestMode) {
          showLoginPrompt("following");
          return;
        }

        // Update active tab
        tabs.forEach((t) => t.classList.remove("gt-tab-active"));
        tab.classList.add("gt-tab-active");

        // Load new feed
        currentFeed = feedType;
        currentPage = 1;
        hasMore = true;
        await loadFeed();
      });
    });
  }

  /**
   * Setup sort options (Latest/Top)
   */
  function setupSortOptions() {
    const sortBtns = document.querySelectorAll(".gt-sort-btn[data-sort]");
    sortBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const sortType = btn.dataset.sort;
        if (sortType === currentSort) return;

        // Update active sort button
        sortBtns.forEach((b) => b.classList.remove("gt-sort-active"));
        btn.classList.add("gt-sort-active");

        // Load feed with new sort
        currentSort = sortType;
        currentPage = 1;
        hasMore = true;
        await loadFeed();
      });
    });
  }

  /**
   * Setup search
   */
  function setupSearch() {
    const searchInput = document.getElementById("search-input");
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `/gad-talk/explore.html?search=${encodeURIComponent(query)}`;
        }
      }, 500);
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `/gad-talk/explore.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  /**
   * Load feed
   */
  async function loadFeed() {
    if (isLoading) return;
    isLoading = true;

    const feedLoading = document.getElementById("feed-loading");
    const feedEmpty = document.getElementById("feed-empty");
    const gadsList = document.getElementById("gads-list");
    const loadMoreSection = document.getElementById("load-more-section");

    // Show loading skeletons for first page
    if (currentPage === 1) {
      feedLoading.classList.add("gt-hidden");
      feedEmpty.classList.add("gt-hidden");
      gadsList.innerHTML = "";

      // Show skeleton loaders
      if (window.GadTalkUI) {
        window.GadTalkUI.showSkeletons(gadsList, { count: 3, type: "gad" });
      } else {
        feedLoading.classList.remove("gt-hidden");
      }
    }

    try {
      let response;
      if (currentFeed === "following") {
        response = await window.GadTalkAPI.gads.getTimeline(currentPage, 20, currentSort);
      } else {
        response = await window.GadTalkAPI.gads.getForYou(currentPage, 20, currentSort);
      }

      const gads = response.gads || [];

      // Hide loading
      feedLoading.classList.add("gt-hidden");

      if (gads.length === 0 && currentPage === 1) {
        gadsList.innerHTML = "";
        feedEmpty.classList.remove("gt-hidden");
        loadMoreSection.classList.add("gt-hidden");
      } else {
        feedEmpty.classList.add("gt-hidden");
        window.gadTalkGads.renderGads(gads, gadsList, currentUser?.id, currentPage > 1);

        // Check if there are more pages
        hasMore = response.hasMore !== false && gads.length > 0;
        if (hasMore) {
          loadMoreSection.classList.remove("gt-hidden");
        } else {
          loadMoreSection.classList.add("gt-hidden");
        }
      }
    } catch (error) {
      console.error("Error loading feed:", error);
      feedLoading.classList.add("gt-hidden");
      window.gadTalkGads.showToast("Failed to load feed", "error");
    } finally {
      isLoading = false;
    }
  }

  /**
   * Load more gads
   */
  async function loadMore() {
    if (!hasMore || isLoading) return;
    currentPage++;
    await loadFeed();
  }

  /**
   * Setup infinite scroll
   */
  function setupInfiniteScroll() {
    const loadMoreBtn = document.getElementById("load-more-btn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", loadMore);
    }

    // Optional: Intersection Observer for automatic loading
    const loadMoreSection = document.getElementById("load-more-section");
    if (loadMoreSection && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading) {
            loadMore();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(loadMoreSection);
    }
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
          <span class="gt-trending-tag">#${tag.tag || tag.name}</span>
          <span class="gt-trending-count">${window.gadTalkGads.formatCount(tag.count)} gads</span>
        </a>
      `
        )
        .join("");
    } catch (error) {
      console.error("Error loading trending:", error);
      trendingList.innerHTML = '<p class="gt-text-secondary gt-text-sm">Failed to load trending</p>';
    }
  }

  /**
   * Load user suggestions
   */
  async function loadSuggestions() {
    const suggestionsList = document.getElementById("suggestions-list");
    if (!suggestionsList) return;

    try {
      const users = await getSuggestedUsers(3);

      if (users.length === 0) {
        suggestionsList.innerHTML = '<p class="gt-text-secondary gt-text-sm">No suggestions right now</p>';
        return;
      }

      suggestionsList.innerHTML = users
        .map(
          (user) => `
        <div class="gt-suggestion-item">
          <a href="/gad-talk/@${encodeURIComponent(user.username)}" class="gt-suggestion-user">
            ${window.gadTalkGads.getAvatarHtml(user, "sm")}
            <div class="gt-suggestion-info">
              <span class="gt-suggestion-name">${user.displayName || user.username}</span>
              <span class="gt-suggestion-username">@${user.username}</span>
            </div>
          </a>
          <button class="gt-btn ${
            user.isFollowing ? "gt-btn-secondary gt-following" : "gt-btn-primary"
          } gt-btn-sm" data-follow="${user.id}" data-following="${user.isFollowing}" data-testid="follow-${
            user.username
          }">
            ${user.isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      `
        )
        .join("");

      // Attach follow handlers
      suggestionsList.querySelectorAll("[data-follow]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const userId = btn.dataset.follow;
          const isFollowing = btn.dataset.following === "true";
          if (isFollowing) {
            showFollowMessage(btn.parentElement, "Already following");
            return;
          }
          try {
            await window.GadTalkAPI.users.follow(userId);
            btn.textContent = "Following";
            btn.classList.remove("gt-btn-primary");
            btn.classList.add("gt-btn-secondary");
            btn.disabled = true;
            btn.dataset.following = "true";
            showFollowMessage(btn.parentElement, "Now following");
          } catch (error) {
            if (error && error.message && /already following/i.test(error.message)) {
              btn.textContent = "Following";
              btn.classList.remove("gt-btn-primary");
              btn.classList.add("gt-btn-secondary");
              btn.disabled = true;
              btn.dataset.following = "true";
              showFollowMessage(btn.parentElement, "Already following");
            } else {
              showFollowMessage(btn.parentElement, "Could not follow user");
            }
          }
        });
      });
    } catch (error) {
      suggestionsList.innerHTML = '<p class="gt-text-secondary gt-text-sm">Failed to load suggestions</p>';
    }
  }

  /**
   * Check for unread notifications
   */
  async function checkNotifications() {
    const badge = document.getElementById("notification-badge");
    if (!badge) return;

    try {
      const response = await window.GadTalkAPI.notifications.getUnreadCount();
      const count = response.count || 0;

      if (count > 0) {
        badge.textContent = count > 99 ? "99+" : count;
        badge.classList.remove("gt-hidden");
      } else {
        badge.classList.add("gt-hidden");
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Debug / Console helpers
  function listFeatureFlags() {
    return featureFlags;
  }

  function listEnabledFeatureFlags() {
    return Object.keys(featureFlags).filter((k) => featureFlags[k]);
  }

  function whoami() {
    return currentUser || "(guest)";
  }

  function showState() {
    return {
      currentFeed,
      currentSort,
      currentPage,
      isGuestMode,
      hashtagHashEnabled,
    };
  }

  async function reloadFeatureFlags() {
    await loadFeatureFlags();
    applyFeatureFlags();
    return featureFlags;
  }

  function debugHelp() {
    return {
      description: "GadTalk console commands",
      commands: {
        help: "GadTalk.debug.help() - show this help (returns object)",
        listFeatureFlags: "GadTalk.debug.listFeatureFlags() - list all flags (object)",
        listEnabledFeatureFlags: "GadTalk.debug.listEnabledFeatureFlags() - list enabled flags (array)",
        whoami: "GadTalk.debug.whoami() - show current user or '(guest)'",
        showState: "GadTalk.debug.showState() - show app state (object)",
        reloadFeatureFlags: "GadTalk.debug.reloadFeatureFlags() - reload flags from API (async)",
      },
    };
  }

  // Public API
  return {
    init,
    loadFeed,
    loadMore,
    loadTrending,
    loadSuggestions,
    checkNotifications,
    showLoginPrompt,
    isGuest: () => isGuestMode,

    // Expose debug helpers for console use
    debug: {
      help: debugHelp,
      listFeatureFlags,
      listEnabledFeatureFlags,
      whoami,
      showState,
      reloadFeatureFlags,
    },
  };
})();

// Export for use in other scripts
window.gadTalkApp = gadTalkApp;

// Export console-friendly debug object for use on any page
window.GadTalk = window.GadTalk || {};
window.GadTalk.debug = window.gadTalkApp.debug;
// Backwards-compatible shorthand
window.GadTalkDebug = window.gadTalkApp.debug;
