/**
 * GadTalk Interaction Modals
 * Who Liked and Who Regadded modals for gads
 */
/* global GadTalkAPI, GadTalkUI */
/* eslint-disable no-console */

const GadTalkInteractionModals = (function () {
  let featureFlags = {};

  /**
   * Initialize with feature flags
   */
  function init(flags) {
    featureFlags = flags || {};
  }

  /**
   * Render a user item for the modal
   */
  function renderUserItem(user, actionTimestamp = null) {
    const displayName = user.displayName || user.username || "Unknown";
    const username = user.username || "unknown";
    const avatar = user.avatar || "/gad-talk/images/default-avatar.png";
    const verified = user.verified
      ? '<span class="gt-verified" title="Verified"><i class="fa-solid fa-circle-check"></i></span>'
      : "";

    let timeInfo = "";
    if (actionTimestamp) {
      const date = new Date(actionTimestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) {
        timeInfo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeInfo = `${diffHours}h ago`;
      } else if (diffDays < 7) {
        timeInfo = `${diffDays}d ago`;
      } else {
        timeInfo = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    }

    return `
      <a href="/gad-talk/@${encodeURIComponent(username)}" class="gt-who-modal-user">
        <div class="gt-who-modal-user-avatar">
          <img src="${avatar}" alt="${displayName}" class="gt-avatar gt-avatar-md" />
        </div>
        <div class="gt-who-modal-user-info">
          <div class="gt-who-modal-user-name">
            <span class="gt-gad-display-name">${displayName}</span>
            ${verified}
          </div>
          <div class="gt-who-modal-user-username">@${username}</div>
        </div>
        ${timeInfo ? `<div class="gt-who-modal-user-time">${timeInfo}</div>` : ""}
      </a>
    `;
  }

  /**
   * Show the Who Liked modal
   * @param {string} gadId - Gad ID to show likes for
   */
  async function showWhoLikedModal(gadId) {
    if (!featureFlags.who_liked) {
      console.log("[InteractionModals] who_liked feature is disabled");
      return;
    }

    const modalContent = `
      <div class="gt-who-modal-content" id="who-liked-content">
        <div class="gt-who-modal-loading">
          <div class="gt-spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    `;

    GadTalkUI.modal.show({
      id: "who-liked-modal",
      title: "Liked by",
      content: modalContent,
      size: "sm",
    });

    try {
      const result = await GadTalkAPI.gads.getWhoLiked(gadId);
      const container = document.getElementById("who-liked-content");

      if (!container) return;

      if (!result.users || result.users.length === 0) {
        container.innerHTML = `
          <div class="gt-who-modal-empty">
            <span class="gt-icon"><i class="fa-regular fa-heart"></i></span>
            <p>No likes yet</p>
          </div>
        `;
        return;
      }

      let usersHtml = result.users.map((user) => renderUserItem(user, user.likedAt)).join("");

      if (result.hasMore) {
        usersHtml += `
          <button class="gt-who-modal-load-more" data-gad-id="${gadId}" data-offset="${result.users.length}" data-type="likes">
            Load more
          </button>
        `;
      }

      container.innerHTML = `
        <div class="gt-who-modal-list">
          ${usersHtml}
        </div>
        <div class="gt-who-modal-total">${result.total} ${result.total === 1 ? "like" : "likes"}</div>
      `;

      // Add load more handler
      const loadMoreBtn = container.querySelector(".gt-who-modal-load-more");
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => loadMoreLikes(gadId, loadMoreBtn));
      }
    } catch (error) {
      console.error("[InteractionModals] Error loading who liked:", error);
      const container = document.getElementById("who-liked-content");
      if (container) {
        container.innerHTML = `
          <div class="gt-who-modal-error">
            <span class="gt-icon"><i class="fa-solid fa-exclamation-circle"></i></span>
            <p>Failed to load likes</p>
          </div>
        `;
      }
    }
  }

  /**
   * Load more likes
   */
  async function loadMoreLikes(gadId, button) {
    const offset = parseInt(button.dataset.offset) || 0;
    button.disabled = true;
    button.textContent = "Loading...";

    try {
      const result = await GadTalkAPI.gads.getWhoLiked(gadId, 50, offset);

      if (result.users && result.users.length > 0) {
        const newUsersHtml = result.users.map((user) => renderUserItem(user, user.likedAt)).join("");
        button.insertAdjacentHTML("beforebegin", newUsersHtml);
      }

      if (result.hasMore) {
        button.dataset.offset = offset + result.users.length;
        button.disabled = false;
        button.textContent = "Load more";
      } else {
        button.remove();
      }
    } catch (error) {
      console.error("[InteractionModals] Error loading more likes:", error);
      button.disabled = false;
      button.textContent = "Retry";
    }
  }

  /**
   * Show the Who Regadded modal
   * @param {string} gadId - Gad ID to show regads for
   */
  async function showWhoRegaddedModal(gadId) {
    if (!featureFlags.who_regadded) {
      console.log("[InteractionModals] who_regadded feature is disabled");
      return;
    }

    const modalContent = `
      <div class="gt-who-modal-content" id="who-regadded-content">
        <div class="gt-who-modal-loading">
          <div class="gt-spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    `;

    GadTalkUI.modal.show({
      id: "who-regadded-modal",
      title: "Regadded by",
      content: modalContent,
      size: "sm",
    });

    try {
      const result = await GadTalkAPI.gads.getWhoRegadded(gadId);
      const container = document.getElementById("who-regadded-content");

      if (!container) return;

      if (!result.users || result.users.length === 0) {
        container.innerHTML = `
          <div class="gt-who-modal-empty">
            <span class="gt-icon"><i class="fa-solid fa-retweet"></i></span>
            <p>No regads yet</p>
          </div>
        `;
        return;
      }

      let usersHtml = result.users.map((user) => renderUserItem(user, user.regaddedAt)).join("");

      if (result.hasMore) {
        usersHtml += `
          <button class="gt-who-modal-load-more" data-gad-id="${gadId}" data-offset="${result.users.length}" data-type="regads">
            Load more
          </button>
        `;
      }

      container.innerHTML = `
        <div class="gt-who-modal-list">
          ${usersHtml}
        </div>
        <div class="gt-who-modal-total">${result.total} ${result.total === 1 ? "regad" : "regads"}</div>
      `;

      // Add load more handler
      const loadMoreBtn = container.querySelector(".gt-who-modal-load-more");
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => loadMoreRegads(gadId, loadMoreBtn));
      }
    } catch (error) {
      console.error("[InteractionModals] Error loading who regadded:", error);
      const container = document.getElementById("who-regadded-content");
      if (container) {
        container.innerHTML = `
          <div class="gt-who-modal-error">
            <span class="gt-icon"><i class="fa-solid fa-exclamation-circle"></i></span>
            <p>Failed to load regads</p>
          </div>
        `;
      }
    }
  }

  /**
   * Load more regads
   */
  async function loadMoreRegads(gadId, button) {
    const offset = parseInt(button.dataset.offset) || 0;
    button.disabled = true;
    button.textContent = "Loading...";

    try {
      const result = await GadTalkAPI.gads.getWhoRegadded(gadId, 50, offset);

      if (result.users && result.users.length > 0) {
        const newUsersHtml = result.users.map((user) => renderUserItem(user, user.regaddedAt)).join("");
        button.insertAdjacentHTML("beforebegin", newUsersHtml);
      }

      if (result.hasMore) {
        button.dataset.offset = offset + result.users.length;
        button.disabled = false;
        button.textContent = "Load more";
      } else {
        button.remove();
      }
    } catch (error) {
      console.error("[InteractionModals] Error loading more regads:", error);
      button.disabled = false;
      button.textContent = "Retry";
    }
  }

  // Public API
  return {
    init,
    showWhoLikedModal,
    showWhoRegaddedModal,
  };
})();

// Make globally available
window.GadTalkInteractionModals = GadTalkInteractionModals;
