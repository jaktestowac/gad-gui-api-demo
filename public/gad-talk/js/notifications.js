/**
 * GadTalk Notifications Page JavaScript
 * Handles notification display and management
 */

(function () {
  "use strict";

  let currentPage = 1;
  let currentFilter = "all";
  let isLoading = false;
  let hasMore = true;
  const ITEMS_PER_PAGE = 20;

  // DOM Elements
  const notificationsList = document.getElementById("notifications-list");
  const filterTabs = document.querySelectorAll(".gt-tab-btn");
  const markAllReadBtn = document.getElementById("mark-all-read-btn");

  /**
   * Initialize notifications page
   */
  async function init() {
    if (!GadTalkAPI.getToken()) {
      window.location.href = "welcome.html";
      return;
    }

    setupEventListeners();
    await loadNotifications();
    setupInfiniteScroll();
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Filter tabs
    filterTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const filter = tab.dataset.filter;
        if (filter !== currentFilter) {
          filterTabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          currentFilter = filter;
          currentPage = 1;
          hasMore = true;
          loadNotifications();
        }
      });
    });

    // Mark all as read
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", markAllAsRead);
    }
  }

  /**
   * Load notifications
   */
  async function loadNotifications() {
    if (!notificationsList) return;

    isLoading = true;
    GadTalkUI.showSkeletons(notificationsList, "notification", 5);

    try {
      const response = await GadTalkAPI.notifications.get(currentPage, ITEMS_PER_PAGE);

      if (response.success && response.notifications?.length > 0) {
        let notifications = response.notifications;

        // Filter by mentions if needed
        if (currentFilter === "mentions") {
          notifications = notifications.filter((n) => n.type === "mention");
        }

        if (notifications.length > 0) {
          renderNotifications(notifications, false);
          hasMore = response.notifications.length === ITEMS_PER_PAGE;
        } else {
          showEmptyState();
          hasMore = false;
        }
      } else {
        showEmptyState();
        hasMore = false;
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      notificationsList.innerHTML = `
        <div class="gt-empty-state">
          <div class="gt-empty-icon"><i class="fa-solid fa-face-meh"></i></div>
          <h3>Couldn't load notifications</h3>
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
    const message =
      currentFilter === "mentions"
        ? "No mentions yet. When someone mentions you, it'll show up here."
        : "No notifications yet. When someone interacts with your gads, you'll see it here.";

    notificationsList.innerHTML = `
      <div class="gt-empty-state">
        <div class="gt-empty-icon"><i class="fa-solid fa-bell"></i></div>
        <h3>Nothing to see here</h3>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Load more notifications
   */
  async function loadMore() {
    if (isLoading || !hasMore) return;

    isLoading = true;
    currentPage++;

    // Show loading indicator
    const loadingEl = document.createElement("div");
    loadingEl.className = "gt-loading-more";
    loadingEl.innerHTML = '<div class="gt-spinner"></div>';
    notificationsList?.appendChild(loadingEl);

    try {
      const response = await GadTalkAPI.notifications.get(currentPage, ITEMS_PER_PAGE);

      loadingEl.remove();

      if (response.success && response.notifications?.length > 0) {
        let notifications = response.notifications;

        if (currentFilter === "mentions") {
          notifications = notifications.filter((n) => n.type === "mention");
        }

        if (notifications.length > 0) {
          renderNotifications(notifications, true);
          hasMore = response.notifications.length === ITEMS_PER_PAGE;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error("Failed to load more notifications:", error);
      loadingEl.remove();
      currentPage--;
    } finally {
      isLoading = false;
    }
  }

  /**
   * Render notifications
   */
  function renderNotifications(notifications, append = false) {
    if (!notificationsList) return;

    const html = notifications.map((notification) => createNotificationHTML(notification)).join("");

    if (append) {
      notificationsList.insertAdjacentHTML("beforeend", html);
    } else {
      notificationsList.innerHTML = html;
    }

    // Setup click handlers
    setupNotificationInteractions();
  }

  /**
   * Create HTML for a single notification
   */
  function createNotificationHTML(notification) {
    const user = notification.fromUser || {};
    const avatar = user.avatar || "/gad-talk/images/default-avatar.png";
    const username = user.username || "unknown";
    const displayName = user.displayName || username;

    const isUnread = !notification.read ? "unread" : "";
    const icon = getNotificationIcon(notification.type);
    const message = getNotificationMessage(notification);
    const createdAt = notification.createdAt ? formatRelativeTime(new Date(notification.createdAt)) : "";

    return `
      <div class="gt-notification-item ${isUnread}" data-notification-id="${notification.id}" data-type="${
      notification.type
    }">
        <div class="gt-notification-icon ${notification.type}">
          ${icon}
        </div>
        <a href="profile.html?user=${encodeURIComponent(username)}" class="gt-notification-avatar">
          <img src="${avatar}" alt="${displayName}" onerror="this.src='/gad-talk/images/default-avatar.png'">
        </a>
        <div class="gt-notification-content">
          <p class="gt-notification-text">
            <a href="profile.html?user=${encodeURIComponent(username)}" class="gt-notification-user">${escapeHtml(
      displayName
    )}</a>
            ${message}
          </p>
          ${
            notification.gadContent
              ? `<p class="gt-notification-preview">${escapeHtml(truncate(notification.gadContent, 100))}</p>`
              : ""
          }
          <span class="gt-notification-time">${createdAt}</span>
        </div>
        <div class="gt-notification-actions">
          ${
            !notification.read
              ? `<button class="gt-btn-icon" data-action="mark-read" title="Mark as read"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg></button>`
              : ""
          }
        </div>
      </div>
    `;
  }

  /**
   * Get notification icon based on type
   */
  function getNotificationIcon(type) {
    const icons = {
      like: '<svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z" fill="currentColor"/></svg>',
      reply:
        '<svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z" fill="currentColor"/></svg>',
      regad:
        '<svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" fill="currentColor"/></svg>',
      follow:
        '<svg viewBox="0 0 24 24"><path d="M17.863 13.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44zM12 2C9.791 2 8 3.79 8 6s1.791 4 4 4 4-1.79 4-4-1.791-4-4-4z" fill="currentColor"/></svg>',
      mention:
        '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="currentColor"/></svg>',
    };

    return icons[type] || icons.like;
  }

  /**
   * Get notification message based on type
   */
  function getNotificationMessage(notification) {
    const messages = {
      like: "liked your gad",
      reply: "replied to your gad",
      regad: "regaded your gad",
      follow: "followed you",
      mention: "mentioned you",
    };

    return messages[notification.type] || "interacted with your gad";
  }

  /**
   * Setup notification interactions
   */
  function setupNotificationInteractions() {
    document.querySelectorAll(".gt-notification-item").forEach((item) => {
      const notificationId = item.dataset.notificationId;

      // Mark as read button
      const markReadBtn = item.querySelector('[data-action="mark-read"]');
      if (markReadBtn) {
        markReadBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await markAsRead(notificationId, item);
        });
      }

      // Click to navigate
      item.addEventListener("click", async (e) => {
        if (e.target.closest("a") || e.target.closest("button")) return;

        // Mark as read
        if (item.classList.contains("unread")) {
          await markAsRead(notificationId, item);
        }

        // Navigate based on type
        const type = item.dataset.type;
        if (type === "follow") {
          // Go to user profile
          const userLink = item.querySelector(".gt-notification-user");
          if (userLink) {
            window.location.href = userLink.href;
          }
        } else {
          // Go to gad
          // Note: Need gadId from notification data
          GadTalkUI.toast("Navigate to gad", "info");
        }
      });
    });
  }

  /**
   * Mark notification as read
   */
  async function markAsRead(notificationId, element) {
    try {
      const response = await GadTalkAPI.notifications.markRead(notificationId);

      if (response.success) {
        element.classList.remove("unread");
        const markReadBtn = element.querySelector('[data-action="mark-read"]');
        if (markReadBtn) {
          markReadBtn.remove();
        }

        // Update badge count
        updateBadgeCount(-1);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async function markAllAsRead() {
    try {
      GadTalkUI.setButtonLoading(markAllReadBtn, true, "Marking...");

      const response = await GadTalkAPI.notifications.markAllRead();

      if (response.success) {
        // Update UI
        document.querySelectorAll(".gt-notification-item.unread").forEach((item) => {
          item.classList.remove("unread");
          const markReadBtn = item.querySelector('[data-action="mark-read"]');
          if (markReadBtn) {
            markReadBtn.remove();
          }
        });

        // Clear badge
        updateBadgeCount(0, true);

        GadTalkUI.toast("All notifications marked as read", "success");
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      GadTalkUI.toast("Failed to mark all as read", "error");
    } finally {
      GadTalkUI.setButtonLoading(markAllReadBtn, false);
    }
  }

  /**
   * Update notification badge count
   */
  function updateBadgeCount(delta, setAbsolute = false) {
    const badge = document.querySelector(".gt-nav-badge");
    if (badge) {
      if (setAbsolute) {
        if (delta <= 0) {
          badge.style.display = "none";
          badge.textContent = "0";
        } else {
          badge.style.display = "";
          badge.textContent = delta > 99 ? "99+" : delta;
        }
      } else {
        const currentCount = parseInt(badge.textContent) || 0;
        const newCount = Math.max(0, currentCount + delta);
        if (newCount <= 0) {
          badge.style.display = "none";
          badge.textContent = "0";
        } else {
          badge.style.display = "";
          badge.textContent = newCount > 99 ? "99+" : newCount;
        }
      }
    }
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
    notificationsList?.parentElement?.appendChild(sentinel);
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
   * Escape HTML
   */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Truncate text
   */
  function truncate(str, length) {
    if (!str) return "";
    if (str.length <= length) return str;
    return str.slice(0, length) + "...";
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export for external use
  window.GadTalkNotifications = {
    loadNotifications,
    markAllAsRead,
  };
})();
