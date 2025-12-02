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

    // Render a modern dropdown button for the nav user area
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
                window.location.href = `/gad-talk/profile.html?user=${currentUser.username}`;
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
        setTimeout(() => {
          const onDocClick = () => {
            dropdownBtn.setAttribute("aria-expanded", "false");
            document.removeEventListener("click", onDocClick);
          };
          document.addEventListener("click", onDocClick);
        }, 0);
      });
    } else if (dropdownBtn) {
      dropdownBtn.addEventListener("click", () => {
        window.location.href = `/gad-talk/profile.html?user=${currentUser.username}`;
      });
    }
  }

  /**
   * Load user profile
   */
  async function loadProfile(username) {
    try {
      const response = await window.GadTalkAPI.users.getByUsername(username);
      profileUser = response.data;

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

    // Update banner (stored as header in backend)
    const profileBanner = document.getElementById("profile-banner");
    if (profileBanner) {
      if (profileUser.header) {
        profileBanner.style.backgroundImage = `url(${profileUser.header})`;
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
        const isBlocked = profileUser.isBlocked || false;
        const isMuted = profileUser.isMuted || false;
        profileActions.innerHTML = `
          <div class="gt-profile-more-container">
            <button class="gt-btn gt-btn-icon" id="more-options-btn" title="More options" data-testid="more-options-button">
              <i class="fa-solid fa-ellipsis"></i>
            </button>
            <div class="gt-dropdown gt-hidden" id="more-options-menu">
              <button class="gt-dropdown-item" id="mute-btn" data-testid="mute-button">
                <span class="gt-dropdown-icon"><i class="fa-solid ${
                  isMuted ? "fa-volume-high" : "fa-volume-xmark"
                }"></i></span>
                ${isMuted ? "Unmute" : "Mute"} @${profileUser.username}
              </button>
              <button class="gt-dropdown-item gt-dropdown-item-danger" id="block-btn" data-testid="block-button">
                <span class="gt-dropdown-icon"><i class="fa-solid ${isBlocked ? "fa-user-check" : "fa-ban"}"></i></span>
                ${isBlocked ? "Unblock" : "Block"} @${profileUser.username}
              </button>
            </div>
          </div>
          <button class="gt-btn ${isFollowing ? "gt-btn-secondary" : "gt-btn-primary"}" 
                  id="follow-btn" 
                  data-testid="follow-button"
                  data-user-id="${profileUser.id}">
            ${isFollowing ? "Following" : "Follow"}
          </button>
        `;
        document.getElementById("follow-btn").addEventListener("click", handleFollowToggle);
        setupMoreOptionsMenu();
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
    if (followingLink) followingLink.href = `/gad-talk/following.html?user=${profileUser.username}`;
    if (followersLink) followersLink.href = `/gad-talk/followers.html?user=${profileUser.username}`;
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
   * Setup more options dropdown menu
   */
  function setupMoreOptionsMenu() {
    const moreBtn = document.getElementById("more-options-btn");
    const moreMenu = document.getElementById("more-options-menu");
    const muteBtn = document.getElementById("mute-btn");
    const blockBtn = document.getElementById("block-btn");

    if (!moreBtn || !moreMenu) return;

    // Toggle dropdown on button click
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      moreMenu.classList.toggle("gt-hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      moreMenu.classList.add("gt-hidden");
    });

    // Prevent closing when clicking inside menu
    moreMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Mute/Unmute handler
    if (muteBtn) {
      muteBtn.addEventListener("click", async () => {
        try {
          const isMuted = profileUser.isMuted || false;
          if (isMuted) {
            await window.GadTalkAPI.users.unmute(profileUser.id);
            profileUser.isMuted = false;
            muteBtn.innerHTML = `
              <span class="gt-dropdown-icon"><i class="fa-solid fa-volume-xmark"></i></span>
              Mute @${profileUser.username}
            `;
            window.gadTalkGads.showToast(`Unmuted @${profileUser.username}`, "success");
          } else {
            await window.GadTalkAPI.users.mute(profileUser.id);
            profileUser.isMuted = true;
            muteBtn.innerHTML = `
              <span class="gt-dropdown-icon"><i class="fa-solid fa-volume-high"></i></span>
              Unmute @${profileUser.username}
            `;
            window.gadTalkGads.showToast(`Muted @${profileUser.username}`, "success");
          }
          moreMenu.classList.add("gt-hidden");
        } catch (error) {
          window.gadTalkGads.showToast("Failed to update mute status", "error");
        }
      });
    }

    // Block/Unblock handler
    if (blockBtn) {
      blockBtn.addEventListener("click", async () => {
        try {
          const isBlocked = profileUser.isBlocked || false;
          if (isBlocked) {
            await window.GadTalkAPI.users.unblock(profileUser.id);
            profileUser.isBlocked = false;
            blockBtn.innerHTML = `
              <span class="gt-dropdown-icon"><i class="fa-solid fa-ban"></i></span>
              Block @${profileUser.username}
            `;
            window.gadTalkGads.showToast(`Unblocked @${profileUser.username}`, "success");
          } else {
            await window.GadTalkAPI.users.block(profileUser.id);
            profileUser.isBlocked = true;
            blockBtn.innerHTML = `
              <span class="gt-dropdown-icon"><i class="fa-solid fa-user-check"></i></span>
              Unblock @${profileUser.username}
            `;
            window.gadTalkGads.showToast(`Blocked @${profileUser.username}`, "success");
          }
          moreMenu.classList.add("gt-hidden");
        } catch (error) {
          window.gadTalkGads.showToast("Failed to update block status", "error");
        }
      });
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

    // Avatar and banner controls
    const changeAvatarBtn = document.getElementById("change-avatar-btn");
    const changeBannerBtn = document.getElementById("change-banner-btn");
    const chooseAvatarBtn = document.getElementById("choose-avatar-gallery-btn");
    const avatarGalleryModal = document.getElementById("avatar-gallery-modal");
    const avatarGalleryList = document.getElementById("avatar-gallery-list");
    const avatarHidden = document.getElementById("edit-avatar");
    const bannerHidden = document.getElementById("edit-banner");
    const avatarUrlInput = document.getElementById("edit-avatar-url");
    const bannerUrlInput = document.getElementById("edit-banner-url");
    const avatarPreview = document.getElementById("edit-avatar-preview");
    const bannerPreview = document.getElementById("edit-banner-preview");
    const avatarDropdown = document.getElementById("edit-avatar-dropdown");

    // Load avatar dropdown options from API
    async function loadAvatarDropdownOptions() {
      if (!avatarDropdown) return;
      try {
        const res = await fetch("/api/images/user");
        const data = await res.json();
        if (Array.isArray(data)) {
          // Clear existing options except the first placeholder
          avatarDropdown.innerHTML = '<option value="">-- Select from gallery --</option>';
          data.forEach((filename) => {
            const option = document.createElement("option");
            option.value = `/data/users/${filename}`;
            option.textContent = filename;
            avatarDropdown.appendChild(option);
          });
        }
      } catch (error) {
        console.error("Failed to load avatar options:", error);
      }
    }

    // Load dropdown options on page load
    loadAvatarDropdownOptions();

    // Handle avatar dropdown selection
    if (avatarDropdown) {
      avatarDropdown.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val) {
          if (avatarHidden) avatarHidden.value = val;
          if (avatarUrlInput) avatarUrlInput.value = "";
          if (avatarPreview) {
            avatarPreview.innerHTML = `<img src='${val}' width='64' height='64' style='border-radius:50%; object-fit:cover;'/>`;
          }
        }
      });
    }

    // Open avatar URL input when change avatar clicked
    if (changeAvatarBtn && avatarUrlInput) {
      changeAvatarBtn.addEventListener("click", () => {
        avatarUrlInput.focus();
      });
    }

    // Focus or open banner URL input when change banner clicked
    if (changeBannerBtn && bannerUrlInput) {
      changeBannerBtn.addEventListener("click", () => {
        bannerUrlInput.focus();
      });
    }

    // Open gallery modal
    if (chooseAvatarBtn && avatarGalleryModal) {
      chooseAvatarBtn.addEventListener("click", async () => {
        avatarGalleryModal.classList.remove("gt-hidden");
        // Load images if not loaded
        if (avatarGalleryList && avatarGalleryList.children.length === 0) {
          try {
            const res = await fetch("/api/gad-talk/users/gallery");
            const data = await res.json();
            const files = data.files || [];
            files.forEach((src) => {
              const img = document.createElement("img");
              img.src = src;
              img.alt = "avatar";
              img.style.width = "64px";
              img.style.height = "64px";
              img.style.objectFit = "cover";
              img.style.borderRadius = "50%";
              img.style.cursor = "pointer";
              img.addEventListener("click", () => {
                if (avatarHidden) avatarHidden.value = src;
                if (avatarUrlInput) avatarUrlInput.value = src;
                if (avatarPreview)
                  avatarPreview.innerHTML = `<img src='${src}' width='64' height='64' style='border-radius:50%; object-fit:cover;'/>`;
                avatarGalleryModal.classList.add("gt-hidden");
              });
              avatarGalleryList.appendChild(img);
            });
          } catch (error) {
            console.error("Failed to load avatar gallery", error);
          }
        }
      });
    }

    // Close gallery modal
    if (avatarGalleryModal) {
      avatarGalleryModal.querySelectorAll("[data-close-modal]").forEach((el) => {
        el.addEventListener("click", () => avatarGalleryModal.classList.add("gt-hidden"));
      });
    }

    // On avatar URL change update hidden input & preview
    if (avatarUrlInput) {
      avatarUrlInput.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        if (avatarHidden) avatarHidden.value = val;
        if (avatarPreview)
          avatarPreview.innerHTML = val
            ? `<img src='${val}' width='64' height='64' style='border-radius:50%; object-fit:cover;'/>`
            : window.gadTalkGads.getAvatarHtml(profileUser, "lg");
        // Clear dropdown selection when user types custom URL
        if (avatarDropdown) avatarDropdown.value = "";
      });
    }

    // On banner URL change update hidden input & preview
    if (bannerUrlInput) {
      bannerUrlInput.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        if (bannerHidden) bannerHidden.value = val;
        if (bannerPreview) bannerPreview.style.backgroundImage = val ? `url(${val})` : "";
      });
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
    const avatarHidden = document.getElementById("edit-avatar");
    const bannerHidden = document.getElementById("edit-banner");
    const avatarUrlInput = document.getElementById("edit-avatar-url");
    const bannerUrlInput = document.getElementById("edit-banner-url");

    if (displayNameInput) displayNameInput.value = profileUser.displayName || "";
    if (bioInput) {
      bioInput.value = profileUser.bio || "";
      const bioCharCount = document.getElementById("bio-char-count");
      if (bioCharCount) bioCharCount.textContent = 160 - (profileUser.bio?.length || 0);
    }
    if (locationInput) locationInput.value = profileUser.location || "";
    if (websiteInput) websiteInput.value = profileUser.website || "";
    if (avatarPreview) avatarPreview.innerHTML = window.gadTalkGads.getAvatarHtml(profileUser, "lg");
    if (avatarHidden) avatarHidden.value = profileUser.avatar || "";

    // Check if avatar is from gallery (starts with /data/users/)
    const avatarDropdown = document.getElementById("edit-avatar-dropdown");
    const currentAvatar = profileUser.avatar || "";
    const isGalleryAvatar = currentAvatar.startsWith("/data/users/");

    if (isGalleryAvatar) {
      // Avatar is from gallery - select in dropdown, clear URL input
      if (avatarDropdown) avatarDropdown.value = currentAvatar;
      if (avatarUrlInput) avatarUrlInput.value = "";
    } else {
      // Avatar is custom URL - fill URL input, clear dropdown
      if (avatarUrlInput) avatarUrlInput.value = currentAvatar;
      if (avatarDropdown) avatarDropdown.value = "";
    }

    if (bannerPreview && profileUser.header) {
      bannerPreview.style.backgroundImage = `url(${profileUser.header})`;
    }
    if (bannerHidden) bannerHidden.value = profileUser.header || "";
    if (bannerUrlInput) bannerUrlInput.value = profileUser.header || "";

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

    // avatar and banner/header
    const avatarVal = document.getElementById("edit-avatar")?.value?.trim();
    const bannerVal = document.getElementById("edit-banner")?.value?.trim();
    if (avatarVal !== undefined && avatarVal !== null) {
      updates.avatar = avatarVal || null;
    }
    if (bannerVal !== undefined && bannerVal !== null) {
      // GadTalk backend expects 'header' field
      updates.header = bannerVal || null;
    }

    try {
      const response = await window.GadTalkAPI.users.updateProfile(updates, profileUser.id);
      // GadTalk API returns { ok: true, data: user }
      const user = (response && (response.data || response.user)) || response;
      profileUser = { ...profileUser, ...user };
      currentUser = { ...currentUser, ...user };

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
