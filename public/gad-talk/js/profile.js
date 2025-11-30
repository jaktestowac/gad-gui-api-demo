/**
 * GadTalk Profile Page
 * Handles profile display and editing
 */

const gadTalkProfile = (function () {
  let currentUser = null;
  let profileUser = null;
  // eslint-disable-next-line no-unused-vars
  let currentTab = "gads"; // Used for tab state tracking
  let currentPage = 1;
  let isLoading = false;
  let hasMore = true;

  /**
   * Initialize the profile page
   */
  async function init() {
    // Require authentication
    currentUser = await window.gadTalkAuth.requireAuth();
    if (!currentUser) return;

    // Update nav user section
    updateNavUser();

    // Get username from URL
    const params = new URLSearchParams(window.location.search);
    const username = params.get("user") || currentUser.username;

    // Load profile
    await loadProfile(username);

    // Setup tabs
    setupTabs();

    // Setup compose modal
    setupComposeModal();

    // Setup edit profile modal (if own profile)
    setupEditProfileModal();

    // Setup nav profile link
    const navProfile = document.getElementById("nav-profile");
    if (navProfile) {
      navProfile.href = `/gad-talk/profile.html?user=${currentUser.username}`;
    }
  }

  /**
   * Update navigation user section
   */
  function updateNavUser() {
    const navUserSection = document.getElementById("nav-user-section");
    if (!navUserSection || !currentUser) return;

    navUserSection.innerHTML = `
      <div class="gt-nav-user">
        <a href="/gad-talk/profile.html?user=${currentUser.username}" class="gt-nav-user-link">
          ${window.gadTalkGads.getAvatarHtml(currentUser, "sm")}
        </a>
        <button class="gt-btn gt-btn-secondary gt-btn-sm" data-logout>
          Logout
        </button>
      </div>
    `;

    navUserSection.querySelector("[data-logout]").addEventListener("click", (e) => {
      e.preventDefault();
      window.gadTalkAuth.handleLogout();
    });
  }

  /**
   * Load user profile
   */
  async function loadProfile(username) {
    try {
      const response = await window.GadTalkAPI.users.get(username);
      profileUser = response.user;

      updateProfileUI();
      await loadProfileGads();
    } catch (error) {
      console.error("Error loading profile:", error);
      window.gadTalkGads.showToast("Failed to load profile", "error");
    }
  }

  /**
   * Update profile UI
   */
  function updateProfileUI() {
    if (!profileUser) return;

    const isOwnProfile = currentUser && currentUser.id === profileUser.id;

    // Update page title
    document.title = `${profileUser.displayName || profileUser.username} (@${profileUser.username}) - GadTalk`;

    // Update header
    const profileName = document.getElementById("profile-name");
    const gadsCount = document.getElementById("gads-count");
    if (profileName) profileName.textContent = profileUser.displayName || profileUser.username;
    if (gadsCount) gadsCount.textContent = `${profileUser.gadsCount || 0} Gads`;

    // Update banner
    const profileBanner = document.getElementById("profile-banner");
    if (profileBanner) {
      if (profileUser.banner) {
        profileBanner.style.backgroundImage = `url(${profileUser.banner})`;
      } else {
        profileBanner.style.background = "linear-gradient(135deg, var(--gt-primary), var(--gt-secondary))";
      }
    }

    // Update avatar
    const profileAvatar = document.getElementById("profile-avatar");
    if (profileAvatar) {
      profileAvatar.innerHTML = window.gadTalkGads.getAvatarHtml(profileUser, "xl");
    }

    // Update actions
    const profileActions = document.getElementById("profile-actions");
    if (profileActions) {
      if (isOwnProfile) {
        profileActions.innerHTML = `
          <button class="gt-btn gt-btn-secondary" id="edit-profile-btn" data-testid="edit-profile-button">
            Edit Profile
          </button>
        `;
        document.getElementById("edit-profile-btn").addEventListener("click", openEditModal);
      } else {
        const isFollowing = profileUser.isFollowing || false;
        profileActions.innerHTML = `
          <button class="gt-btn gt-btn-icon" title="More options" data-testid="more-options-button"><i class="fa-solid fa-ellipsis"></i></button>
          <button class="gt-btn ${isFollowing ? "gt-btn-secondary" : "gt-btn-primary"}" 
                  id="follow-btn" 
                  data-testid="follow-button"
                  data-user-id="${profileUser.id}">
            ${isFollowing ? "Following" : "Follow"}
          </button>
        `;
        document.getElementById("follow-btn").addEventListener("click", handleFollowToggle);
      }
    }

    // Update profile info
    const displayName = document.getElementById("display-name");
    const usernameEl = document.getElementById("username");
    const bio = document.getElementById("profile-bio");
    const location = document.getElementById("profile-location");
    const website = document.getElementById("profile-website");
    const joined = document.getElementById("profile-joined");

    if (displayName) displayName.textContent = profileUser.displayName || profileUser.username;
    if (usernameEl) usernameEl.textContent = `@${profileUser.username}`;
    if (bio) bio.textContent = profileUser.bio || "";

    if (location) {
      if (profileUser.location) {
        location.classList.remove("gt-hidden");
        location.querySelector("span:last-child").textContent = profileUser.location;
      } else {
        location.classList.add("gt-hidden");
      }
    }

    if (website) {
      if (profileUser.website) {
        website.classList.remove("gt-hidden");
        const link = website.querySelector("a");
        link.href = profileUser.website;
        link.textContent = profileUser.website.replace(/^https?:\/\//, "");
      } else {
        website.classList.add("gt-hidden");
      }
    }

    if (joined) {
      const joinedDate = new Date(profileUser.createdAt);
      joined.querySelector("span:last-child").textContent =
        "Joined " + joinedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    // Update stats
    const followingCount = document.getElementById("following-count");
    const followersCount = document.getElementById("followers-count");
    const followingLink = document.getElementById("following-link");
    const followersLink = document.getElementById("followers-link");

    if (followingCount) followingCount.textContent = profileUser.followingCount || 0;
    if (followersCount) followersCount.textContent = profileUser.followersCount || 0;
    if (followingLink) followingLink.href = `/gad-talk/profile.html?user=${profileUser.username}&tab=following`;
    if (followersLink) followersLink.href = `/gad-talk/profile.html?user=${profileUser.username}&tab=followers`;
  }

  /**
   * Handle follow/unfollow toggle
   */
  async function handleFollowToggle(event) {
    const btn = event.currentTarget;
    const userId = btn.dataset.userId;
    const isFollowing = btn.textContent.trim() === "Following";

    try {
      if (isFollowing) {
        await window.GadTalkAPI.users.unfollow(userId);
        btn.textContent = "Follow";
        btn.classList.remove("gt-btn-secondary");
        btn.classList.add("gt-btn-primary");
        profileUser.isFollowing = false;
        profileUser.followersCount = (profileUser.followersCount || 1) - 1;
      } else {
        await window.GadTalkAPI.users.follow(userId);
        btn.textContent = "Following";
        btn.classList.remove("gt-btn-primary");
        btn.classList.add("gt-btn-secondary");
        profileUser.isFollowing = true;
        profileUser.followersCount = (profileUser.followersCount || 0) + 1;
      }

      // Update followers count
      const followersCount = document.getElementById("followers-count");
      if (followersCount) followersCount.textContent = profileUser.followersCount;
    } catch (error) {
      console.error("Error toggling follow:", error);
      window.gadTalkGads.showToast("Failed to update follow status", "error");
    }
  }

  /**
   * Setup tabs
   */
  function setupTabs() {
    const tabs = document.querySelectorAll(".gt-tab[data-tab]");
    tabs.forEach((tab) => {
      tab.addEventListener("click", async () => {
        tabs.forEach((t) => t.classList.remove("gt-tab-active"));
        tab.classList.add("gt-tab-active");

        currentTab = tab.dataset.tab;
        currentPage = 1;
        hasMore = true;
        await loadProfileGads();
      });
    });
  }

  /**
   * Load profile gads
   */
  async function loadProfileGads() {
    if (!profileUser || isLoading) return;
    isLoading = true;

    const profileLoading = document.getElementById("profile-loading");
    const profileEmpty = document.getElementById("profile-empty");
    const gadsList = document.getElementById("profile-gads-list");
    const loadMoreSection = document.getElementById("profile-load-more");

    if (currentPage === 1) {
      profileLoading.classList.remove("gt-hidden");
      profileEmpty.classList.add("gt-hidden");
      gadsList.innerHTML = "";
    }

    try {
      let response;
      // For now, all tabs load user's gads (can be expanded later)
      response = await window.GadTalkAPI.gads.getByUser(profileUser.id, currentPage);

      const gads = response.gads || [];

      profileLoading.classList.add("gt-hidden");

      if (gads.length === 0 && currentPage === 1) {
        profileEmpty.classList.remove("gt-hidden");
        loadMoreSection.classList.add("gt-hidden");
      } else {
        profileEmpty.classList.add("gt-hidden");
        window.gadTalkGads.renderGads(gads, gadsList, currentUser?.id, currentPage > 1);

        hasMore = response.hasMore !== false && gads.length > 0;
        if (hasMore) {
          loadMoreSection.classList.remove("gt-hidden");
        } else {
          loadMoreSection.classList.add("gt-hidden");
        }
      }
    } catch (error) {
      console.error("Error loading profile gads:", error);
      profileLoading.classList.add("gt-hidden");
      window.gadTalkGads.showToast("Failed to load gads", "error");
    } finally {
      isLoading = false;
    }
  }

  /**
   * Setup compose modal
   */
  function setupComposeModal() {
    const composeBtn = document.getElementById("compose-btn");
    const composeModal = document.getElementById("compose-modal");

    if (!composeBtn || !composeModal) return;

    // Update compose avatar
    const modalComposeAvatar = document.getElementById("modal-compose-avatar");
    if (modalComposeAvatar && currentUser) {
      modalComposeAvatar.innerHTML = window.gadTalkGads.getAvatarHtml(currentUser, "md");
    }

    composeBtn.addEventListener("click", () => {
      composeModal.classList.remove("gt-hidden");
    });

    composeModal.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", () => {
        composeModal.classList.add("gt-hidden");
      });
    });

    // Initialize compose form
    window.gadTalkGads.initComposeForm(
      "modal-compose-form",
      "modal-compose-textarea",
      "modal-char-count",
      "modal-post-btn"
    );
  }

  /**
   * Setup edit profile modal
   */
  function setupEditProfileModal() {
    const modal = document.getElementById("edit-profile-modal");
    if (!modal) return;

    modal.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", () => {
        modal.classList.add("gt-hidden");
      });
    });

    // Bio character count
    const bioTextarea = document.getElementById("edit-bio");
    const bioCharCount = document.getElementById("bio-char-count");
    if (bioTextarea && bioCharCount) {
      bioTextarea.addEventListener("input", () => {
        const remaining = 160 - bioTextarea.value.length;
        bioCharCount.textContent = remaining;
        bioCharCount.classList.toggle("gt-warning", remaining < 20);
        bioCharCount.classList.toggle("gt-danger", remaining < 0);
      });
    }

    // Form submission
    const form = document.getElementById("edit-profile-form");
    if (form) {
      form.addEventListener("submit", handleEditProfileSubmit);
    }
  }

  /**
   * Open edit profile modal
   */
  function openEditModal() {
    const modal = document.getElementById("edit-profile-modal");
    if (!modal || !profileUser) return;

    // Populate form
    const displayNameInput = document.getElementById("edit-display-name");
    const bioInput = document.getElementById("edit-bio");
    const locationInput = document.getElementById("edit-location");
    const websiteInput = document.getElementById("edit-website");
    const avatarPreview = document.getElementById("edit-avatar-preview");
    const bannerPreview = document.getElementById("edit-banner-preview");

    if (displayNameInput) displayNameInput.value = profileUser.displayName || "";
    if (bioInput) {
      bioInput.value = profileUser.bio || "";
      const bioCharCount = document.getElementById("bio-char-count");
      if (bioCharCount) bioCharCount.textContent = 160 - (profileUser.bio?.length || 0);
    }
    if (locationInput) locationInput.value = profileUser.location || "";
    if (websiteInput) websiteInput.value = profileUser.website || "";
    if (avatarPreview) avatarPreview.innerHTML = window.gadTalkGads.getAvatarHtml(profileUser, "lg");
    if (bannerPreview && profileUser.banner) {
      bannerPreview.style.backgroundImage = `url(${profileUser.banner})`;
    }

    modal.classList.remove("gt-hidden");
  }

  /**
   * Handle edit profile form submission
   */
  async function handleEditProfileSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const updates = {
      displayName: form.displayName.value.trim(),
      bio: form.bio.value.trim(),
      location: form.location.value.trim(),
      website: form.website.value.trim(),
    };

    try {
      const response = await window.GadTalkAPI.users.updateProfile(updates);
      profileUser = { ...profileUser, ...response.user };
      currentUser = { ...currentUser, ...response.user };

      updateProfileUI();
      document.getElementById("edit-profile-modal").classList.add("gt-hidden");
      window.gadTalkGads.showToast("Profile updated!");
    } catch (error) {
      console.error("Error updating profile:", error);
      window.gadTalkGads.showToast("Failed to update profile", "error");
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Public API
  return {
    init,
    loadProfile,
    loadProfileGads,
  };
})();

// Export for use in other scripts
window.gadTalkProfile = gadTalkProfile;
