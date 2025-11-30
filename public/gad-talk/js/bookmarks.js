/**
 * GadTalk Bookmarks Page JavaScript
 * Handles display and management of bookmarked gads
 */

(function () {
  "use strict";

  let currentPage = 1;
  let isLoading = false;
  let hasMore = true;
  const ITEMS_PER_PAGE = 20;

  // DOM Elements
  const bookmarksList = document.getElementById("bookmarks-list");

  /**
   * Initialize bookmarks page
   */
  async function init() {
    if (!GadTalkAPI.getToken()) {
      window.location.href = "welcome.html";
      return;
    }

    await loadBookmarks();
    setupInfiniteScroll();
  }

  /**
   * Load bookmarks
   */
  async function loadBookmarks() {
    if (!bookmarksList) return;

    isLoading = true;
    GadTalkUI.showSkeletons(bookmarksList, "gad", 5);

    try {
      const response = await GadTalkAPI.gads.getBookmarks(currentPage, ITEMS_PER_PAGE);

      if (response.success && response.gads?.length > 0) {
        renderGads(response.gads, false);
        hasMore = response.gads.length === ITEMS_PER_PAGE;
      } else {
        showEmptyState();
        hasMore = false;
      }
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      bookmarksList.innerHTML = `
        <div class="gt-empty-state">
          <div class="gt-empty-icon"><i class="fa-solid fa-face-meh"></i></div>
          <h3>Couldn't load bookmarks</h3>
          <p>Please try again later</p>
          <button class="gt-btn gt-btn-primary" onclick="location.reload()">Retry</button>
        </div>
      `;
    } finally {
      isLoading = false;
    }
  }

  /**
   * Show empty state
   */
  function showEmptyState() {
    bookmarksList.innerHTML = `
      <div class="gt-empty-state">
        <div class="gt-empty-icon"><i class="fa-solid fa-bookmark"></i></div>
        <h3>No bookmarks yet</h3>
        <p>Save gads for later by clicking the bookmark icon</p>
        <a href="explore.html" class="gt-btn gt-btn-primary">Explore Gads</a>
      </div>
    `;
  }

  /**
   * Load more bookmarks
   */
  async function loadMore() {
    if (isLoading || !hasMore) return;

    isLoading = true;
    currentPage++;

    // Show loading indicator
    const loadingEl = document.createElement("div");
    loadingEl.className = "gt-loading-more";
    loadingEl.innerHTML = '<div class="gt-spinner"></div>';
    bookmarksList?.appendChild(loadingEl);

    try {
      const response = await GadTalkAPI.gads.getBookmarks(currentPage, ITEMS_PER_PAGE);

      loadingEl.remove();

      if (response.success && response.gads?.length > 0) {
        renderGads(response.gads, true);
        hasMore = response.gads.length === ITEMS_PER_PAGE;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error("Failed to load more bookmarks:", error);
      loadingEl.remove();
      currentPage--;
    } finally {
      isLoading = false;
    }
  }

  /**
   * Render gads
   */
  function renderGads(gads, append = false) {
    if (!bookmarksList) return;

    const html = gads.map((gad) => createGadHTML(gad)).join("");

    if (append) {
      bookmarksList.insertAdjacentHTML("beforeend", html);
    } else {
      bookmarksList.innerHTML = html;
    }

    // Setup interactions
    setupGadInteractions();
  }

  /**
   * Create HTML for a single gad
   */
  function createGadHTML(gad) {
    const user = gad.user || {};
    const avatar = user.avatar || "/gad-talk/images/default-avatar.png";
    const displayName = user.displayName || user.username || "Unknown";
    const username = user.username || "unknown";
    const createdAt = gad.createdAt ? formatRelativeTime(new Date(gad.createdAt)) : "";

    const isLiked = gad.isLiked ? "active" : "";
    const isRegaded = gad.isRegaded ? "active" : "";

    // Process content for hashtags and mentions
    const processedContent = processGadContent(gad.content || "");

    return `
      <article class="gt-gad" data-gad-id="${gad.id}">
        <a href="profile.html?user=${encodeURIComponent(username)}" class="gt-gad-avatar">
          <img src="${avatar}" alt="${displayName}" onerror="this.src='/gad-talk/images/default-avatar.png'">
        </a>
        <div class="gt-gad-content">
          <div class="gt-gad-header">
            <a href="profile.html?user=${encodeURIComponent(username)}" class="gt-gad-author">
              <span class="gt-display-name">${escapeHtml(displayName)}</span>
              <span class="gt-username">@${escapeHtml(username)}</span>
            </a>
            <span class="gt-gad-time">${createdAt}</span>
          </div>
          <div class="gt-gad-text">${processedContent}</div>
          ${gad.media ? renderMedia(gad.media) : ""}
          <div class="gt-gad-actions">
            <button class="gt-gad-action gt-action-reply" data-action="reply" title="Reply">
              <svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/></svg>
              <span>${formatCount(gad.replyCount || 0)}</span>
            </button>
            <button class="gt-gad-action gt-action-regad ${isRegaded}" data-action="regad" title="Regad">
              <svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
              <span>${formatCount(gad.regadCount || 0)}</span>
            </button>
            <button class="gt-gad-action gt-action-like ${isLiked}" data-action="like" title="Like">
              <svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z"/></svg>
              <span>${formatCount(gad.likeCount || 0)}</span>
            </button>
            <button class="gt-gad-action gt-action-bookmark active" data-action="bookmark" title="Remove bookmark">
              <svg viewBox="0 0 24 24"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"/></svg>
            </button>
            <button class="gt-gad-action gt-action-share" data-action="share" title="Share">
              <svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Process gad content for hashtags and mentions
   */
  function processGadContent(content) {
    let processed = escapeHtml(content);

    // Convert hashtags to links
    processed = processed.replace(/#(\w+)/g, '<a href="explore.html#tag=$1" class="gt-hashtag">#$1</a>');

    // Convert mentions to links
    processed = processed.replace(/@(\w+)/g, '<a href="profile.html?user=$1" class="gt-mention">@$1</a>');

    // Convert URLs to links
    processed = processed.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="gt-link">$1</a>'
    );

    return processed;
  }

  /**
   * Render media attachments
   */
  function renderMedia(media) {
    if (!media || media.length === 0) return "";

    return `
      <div class="gt-gad-media">
        ${media
          .map((m) => {
            if (m.type === "image") {
              return `<img src="${m.url}" alt="Media" class="gt-media-image" loading="lazy">`;
            } else if (m.type === "video") {
              return `<video src="${m.url}" controls class="gt-media-video"></video>`;
            }
            return "";
          })
          .join("")}
      </div>
    `;
  }

  /**
   * Setup gad interactions
   */
  function setupGadInteractions() {
    document.querySelectorAll(".gt-gad").forEach((gadEl) => {
      const gadId = gadEl.dataset.gadId;

      gadEl.querySelectorAll(".gt-gad-action").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();

          const action = btn.dataset.action;
          await handleGadAction(gadId, action, btn, gadEl);
        });
      });

      // Click on gad to view details
      gadEl.addEventListener("click", (e) => {
        if (!e.target.closest("a") && !e.target.closest("button")) {
          window.location.href = `gad.html?id=${gadId}`;
        }
      });
    });
  }

  /**
   * Handle gad actions
   */
  async function handleGadAction(gadId, action, btn, gadEl) {
    try {
      switch (action) {
        case "like": {
          const isLiked = btn.classList.contains("active");
          const response = isLiked ? await GadTalkAPI.gads.unlike(gadId) : await GadTalkAPI.gads.like(gadId);

          if (response.success) {
            btn.classList.toggle("active");
            const countSpan = btn.querySelector("span");
            if (countSpan) {
              const currentCount = parseInt(countSpan.textContent) || 0;
              countSpan.textContent = formatCount(isLiked ? currentCount - 1 : currentCount + 1);
            }
          }
          break;
        }

        case "regad": {
          const isRegaded = btn.classList.contains("active");
          const response = isRegaded ? await GadTalkAPI.gads.unregad(gadId) : await GadTalkAPI.gads.regad(gadId);

          if (response.success) {
            btn.classList.toggle("active");
            const countSpan = btn.querySelector("span");
            if (countSpan) {
              const currentCount = parseInt(countSpan.textContent) || 0;
              countSpan.textContent = formatCount(isRegaded ? currentCount - 1 : currentCount + 1);
            }
          }
          break;
        }

        case "bookmark": {
          // In bookmarks page, clicking removes the bookmark
          const response = await GadTalkAPI.gads.unbookmark(gadId);

          if (response.success) {
            // Animate removal
            gadEl.style.transition = "opacity 0.3s, transform 0.3s";
            gadEl.style.opacity = "0";
            gadEl.style.transform = "translateX(20px)";

            setTimeout(() => {
              gadEl.remove();

              // Check if list is now empty
              if (bookmarksList && bookmarksList.querySelectorAll(".gt-gad").length === 0) {
                showEmptyState();
              }
            }, 300);

            GadTalkUI.toast("Removed from bookmarks", "success");
          }
          break;
        }

        case "reply":
          window.location.href = `gad.html?id=${gadId}#reply`;
          break;

        case "share":
          await shareGad(gadId);
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      GadTalkUI.toast(`Failed to ${action}`, "error");
    }
  }

  /**
   * Share a gad
   */
  async function shareGad(gadId) {
    const url = `${window.location.origin}/gad-talk/gad.html?id=${gadId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this Gad",
          url: url,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  }

  /**
   * Copy to clipboard
   */
  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        GadTalkUI.toast("Link copied to clipboard", "success");
      })
      .catch(() => {
        GadTalkUI.toast("Failed to copy link", "error");
      });
  }

  /**
   * Setup infinite scroll
   */
  function setupInfiniteScroll() {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    // Create sentinel element
    const sentinel = document.createElement("div");
    sentinel.className = "gt-scroll-sentinel";
    bookmarksList?.parentElement?.appendChild(sentinel);
    observer.observe(sentinel);
  }

  /**
   * Format relative time
   */
  function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString();
  }

  /**
   * Format count (1000 -> 1K)
   */
  function formatCount(count) {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return count.toString();
  }

  /**
   * Escape HTML
   */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export for external use
  window.GadTalkBookmarks = {
    loadBookmarks,
  };
})();
