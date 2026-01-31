(function () {
  async function init() {
    let currentUser = null;
    let currentPage = 1;
    let isLoading = false;
    let hasMore = true;
    let currentTab = "all"; // 'all', 'mentions', 'interactions'

    if (!window.gadTalkAuth || !window.GadTalkAPI) return;

    // Require authentication
    currentUser = await window.gadTalkAuth.requireAuth();
    if (!currentUser) return;

    // Update nav profile link
    const navProfile = document.getElementById("nav-profile");
    if (navProfile) {
      navProfile.href = `/gad-talk/@${encodeURIComponent(currentUser.username)}`;
    }

    setupTabs();
    await loadNotifications();

    const markAllReadBtn = document.getElementById("mark-all-read");
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", async () => {
        try {
          await window.GadTalkAPI.notifications.markAllRead();
          document.querySelectorAll(".gt-notification-item.gt-notification-unread").forEach((el) => {
            el.classList.remove("gt-notification-unread");
          });
          window.GadTalkUI?.toast?.success?.("All notifications marked as read");
        } catch (error) {
          window.GadTalkUI?.toast?.error?.("Failed to mark notifications as read");
        }
      });
    }

    const loadMoreBtn = document.getElementById("load-more-btn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        if (!isLoading && hasMore) {
          currentPage++;
          loadNotifications(true);
        }
      });
    }

    function setupTabs() {
      const tabs = document.querySelectorAll(".gt-notification-tabs .gt-tab");
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          tabs.forEach((t) => t.classList.remove("gt-tab-active"));
          tab.classList.add("gt-tab-active");

          currentTab = tab.dataset.tab;
          currentPage = 1;
          hasMore = true;

          loadNotifications(false);
        });
      });
    }

    function filterNotificationsByTab(notifications, tab) {
      if (tab === "all") {
        return notifications;
      }
      if (tab === "mentions") {
        return notifications.filter((n) => ["mention", "reply", "quote"].includes(n.type));
      }
      if (tab === "interactions") {
        return notifications.filter((n) => ["like", "repost", "regad", "follow"].includes(n.type));
      }
      return notifications;
    }

    function getEmptyMessage(tab) {
      if (tab === "mentions") {
        return {
          title: "No mentions yet",
          message: "When someone mentions you in a Gad, you'll see it here.",
        };
      }
      if (tab === "interactions") {
        return {
          title: "No interactions yet",
          message: "Likes, reposts, and new followers will appear here.",
        };
      }
      return {
        title: "No notifications yet",
        message: "When someone interacts with your Gads, you'll see it here.",
      };
    }

    async function loadNotifications(append = false) {
      if (isLoading) return;
      isLoading = true;

      const loadingEl = document.getElementById("notifications-loading");
      const emptyEl = document.getElementById("notifications-empty");
      const listEl = document.getElementById("notifications-list");
      const loadMoreSection = document.getElementById("load-more-section");

      if (!append) {
        loadingEl?.classList.remove("gt-hidden");
        emptyEl?.classList.add("gt-hidden");
        if (listEl) listEl.innerHTML = "";
      }

      try {
        const response = await window.GadTalkAPI.notifications.getAll(currentPage);
        let notifications = response.notifications || [];

        notifications = filterNotificationsByTab(notifications, currentTab);

        loadingEl?.classList.add("gt-hidden");

        if (notifications.length === 0 && currentPage === 1) {
          const emptyMsg = getEmptyMessage(currentTab);
          const emptyTitleEl = emptyEl?.querySelector(".gt-empty-title");
          const emptyMsgEl = emptyEl?.querySelector(".gt-empty-message");
          if (emptyTitleEl) emptyTitleEl.textContent = emptyMsg.title;
          if (emptyMsgEl) emptyMsgEl.textContent = emptyMsg.message;
          emptyEl?.classList.remove("gt-hidden");
          loadMoreSection?.classList.add("gt-hidden");
        } else {
          emptyEl?.classList.add("gt-hidden");
          renderNotifications(notifications, append);

          hasMore = response.hasMore !== false && (response.notifications || []).length > 0;
          if (hasMore) {
            loadMoreSection?.classList.remove("gt-hidden");
          } else {
            loadMoreSection?.classList.add("gt-hidden");
          }
        }
      } catch (error) {
        if (loadingEl) {
          loadingEl.innerHTML = '<span class="gt-text-error">Failed to load notifications</span>';
        }
      } finally {
        isLoading = false;
      }
    }

    function renderNotifications(notifications, append) {
      const listEl = document.getElementById("notifications-list");
      if (!listEl) return;

      const html = notifications
        .map((notif) => {
          const icon = getNotificationIcon(notif.type);
          const message = getNotificationMessage(notif);
          const timeAgo = formatRelativeTime(notif.createdAt);
          const unreadClass = notif.read ? "" : "gt-notification-unread";

          return `
            <div class="gt-notification-item ${unreadClass}" data-id="${notif.id}" data-testid="notification-${notif.id}">
              <span class="gt-notification-icon">${icon}</span>
              <div class="gt-notification-content">
                <p class="gt-notification-message">${message}</p>
                <span class="gt-notification-time">${timeAgo}</span>
              </div>
            </div>
          `;
        })
        .join("");

      if (append) {
        listEl.insertAdjacentHTML("beforeend", html);
      } else {
        listEl.innerHTML = html;
      }

      listEl.querySelectorAll(".gt-notification-item.gt-notification-unread").forEach((el) => {
        el.addEventListener("click", async () => {
          const id = el.dataset.id;
          try {
            await window.GadTalkAPI.notifications.markRead(id);
            el.classList.remove("gt-notification-unread");
          } catch (err) {
            // Silent fail
          }
        });
      });
    }

    function getNotificationIcon(type) {
      const icons = {
        like: '<i class="fa-solid fa-heart"></i>',
        reply: '<i class="fa-solid fa-comment"></i>',
        mention: "@",
        follow: '<i class="fa-solid fa-user"></i>',
        repost: '<i class="fa-solid fa-retweet"></i>',
        regad: '<i class="fa-solid fa-retweet"></i>',
        quote: '<i class="fa-solid fa-quote-left"></i>',
      };
      return icons[type] || '<i class="fa-solid fa-bell"></i>';
    }

    function getNotificationMessage(notif) {
      const actor = notif.actor ? `<strong>${notif.actor.displayName || notif.actor.username}</strong>` : "Someone";

      switch (notif.type) {
        case "like":
          return `${actor} liked your Gad`;
        case "reply":
          return `${actor} replied to your Gad`;
        case "mention":
          return `${actor} mentioned you`;
        case "follow":
          return `${actor} followed you`;
        case "repost":
        case "regad":
          return `${actor} regadded your Gad`;
        case "quote":
          return `${actor} quoted your Gad`;
        default:
          return `${actor} interacted with your content`;
      }
    }

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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
