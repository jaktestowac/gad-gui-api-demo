// Chirper Frontend Application
// Main JavaScript file for the Chirper application

// API Base URL
const API_BASE_URL = "/api/practice/v1/chirper";

// Current user and application state
let currentUser = null;
let currentProfile = null;
let currentChirps = [];
let isLoadingMore = false;
let hasMoreChirps = true;

const POST_MAX_LENGTH = 128; // Maximum length for chirps

// Utility Functions
const getBrowserCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// DOM Elements - General
const loadingContainer = document.getElementById("loading-container");
const authContainer = document.getElementById("auth-container");
const mainContainer = document.getElementById("main-container");
const customAlert = document.getElementById("custom-alert");

// DOM Elements - Auth
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");
const tabBtns = document.querySelectorAll(".tab-btn");
const predefinedUsers = document.querySelectorAll(".predefined-user");

// DOM Elements - Navigation
const homeLink = document.querySelector(".home-link");
const profileLink = document.querySelector(".profile-link");
const logoutLink = document.querySelector(".logout-link");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

// DOM Elements - Sections
const feedSection = document.getElementById("feed-section");
const profileSection = document.getElementById("profile-section");
const editProfileSection = document.getElementById("edit-profile-section");

// DOM Elements - Feed
const chirpsContainer = document.getElementById("chirps-container");
const composeForm = document.getElementById("compose-form");
const chirpText = document.getElementById("chirp-text");
const charCounter = document.querySelector(".char-counter");
const isPrivateCheckbox = document.getElementById("is-private");

// DOM Elements - Profile
const profileUsername = document.getElementById("profile-username");
const profileFullname = document.getElementById("profile-fullname");
const profileImage = document.getElementById("profile-image");
const profileBio = document.getElementById("profile-bio");
const chirpsCount = document.getElementById("chirps-count");
const followersCount = document.getElementById("followers-count");
const followingCount = document.getElementById("following-count");
const editProfileBtn = document.getElementById("edit-profile-btn");
const followBtn = document.getElementById("follow-btn");
const profileChirpsContainer = document.getElementById("profile-chirps-container");
const profileFilterIndicator = document.getElementById("profile-filter-indicator");

// DOM Elements - Edit Profile
const editProfileForm = document.getElementById("edit-profile-form");
const editFullname = document.getElementById("edit-fullname");
const editBio = document.getElementById("edit-bio");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const editProfileError = document.getElementById("edit-profile-error");

// Templates
const chirpTemplate = document.getElementById("chirp-template");
const replyTemplate = document.getElementById("reply-template");
const searchResultTemplate = document.getElementById("search-result-template");

// Custom Alert Elements
const popupTitle = document.getElementById("popup-title");
const popupMessage = document.getElementById("popup-message");
const popupCancel = document.getElementById("popup-cancel");
const popupConfirm = document.getElementById("popup-confirm");
const popupClose = document.querySelector(".popup-close");

// API Client for Chirper
const api = {
  token: getBrowserCookie("token") || localStorage.getItem("token"),

  setToken(token) {
    this.token = token;
    // Store token in both cookie and localStorage for persistence
    document.cookie = `token=${token}; max-age=86400; path=/`;
    localStorage.setItem("token", token);
  },

  clearToken() {
    this.token = null;
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("token");
  },

  async request(endpoint, method = "GET", data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies
    };

    // Add token to headers if available
    if (this.token) {
      options.headers["Authorization"] = `Bearer ${this.token}`;
    }

    // Add body for non-GET requests
    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "API request failed");
    }

    return result;
  },

  // Auth endpoints
  register(data) {
    return this.request("/auth/register", "POST", data);
  },

  login(data) {
    return this.request("/auth/login", "POST", data);
  },

  logout() {
    return this.request("/auth/logout", "POST");
  },

  checkAuth() {
    return this.request("/auth/check", "GET");
  }, // Chirp endpoints
  getChirps(before = null, limit = 10, offset = 0) {
    let endpoint = `/chirps?limit=${limit}&offset=${offset}`;
    if (before) {
      endpoint += `&before=${before}`;
    }
    return this.request(endpoint, "GET");
  },

  createChirp(data) {
    return this.request("/chirps", "POST", data);
  },

  getChirpById(id) {
    return this.request(`/chirps/${id}`, "GET");
  },

  deleteChirp(id) {
    return this.request(`/chirps/${id}`, "DELETE");
  },

  likeChirp(id) {
    return this.request(`/chirps/${id}/like`, "POST");
  },

  replyToChirp(id, data) {
    return this.request(`/chirps/${id}/reply`, "POST", data);
  }, // User endpoints
  getUserProfile(username, before = null, limit = 10, offset = 0) {
    let endpoint = `/users/${username}?limit=${limit}&offset=${offset}`;
    if (before) {
      endpoint += `&before=${before}`;
    }
    return this.request(endpoint, "GET");
  },

  updateProfile(data) {
    return this.request("/users", "PUT", data);
  },

  followUser(username) {
    return this.request(`/users/${username}/follow`, "POST");
  },

  searchUsers(query) {
    return this.request(`/search?query=${encodeURIComponent(query)}`, "GET");
  },
};

// ChirperAvatarPicker Class - Custom avatar picker for Chirper
class ChirperAvatarPicker {
  constructor(containerId, onSelect) {
    this.container = document.getElementById(containerId);
    this.onSelect = onSelect;
    this.selectedAvatar = null;
    this.avatarList = [];
  }

  async getPictureList() {
    const response = await fetch("/api/images/user", {
      headers: {
        "Content-Type": "application/json",
        ...(api.token && { Authorization: `Bearer ${api.token}` }),
      },
    });
    return response.json();
  }

  async loadAvatars() {
    try {
      const data = await this.getPictureList();
      if (Array.isArray(data)) {
        this.avatarList = data;
        // Don't select random avatar initially - wait for user's current avatar to be set
      } else {
        console.error("Invalid avatar data format:", data);
        this.selectedAvatar = "/data/users/_default.png";
        this.render();
      }
    } catch (error) {
      console.error("Failed to load avatars:", error);
      this.selectedAvatar = "/data/users/_default.png";
      this.render();
    }
  }

  setCurrentAvatar(avatar) {
    this.selectedAvatar = avatar;
    this.render();
  }

  selectRandomAvatar() {
    if (this.avatarList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * this.avatarList.length);
    this.selectedAvatar = `/data/users/${this.avatarList[randomIndex]}`;
    this.onSelect(this.selectedAvatar);
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="avatar-display">
        <img src="${this.selectedAvatar || "/data/users/_default.png"}" alt="Avatar" class="avatar-image">
        <button type="button" class="randomize-avatar-btn">
          <i class="fas fa-random"></i>
          Choose New Avatar
        </button>
        <input type="hidden" name="avatar" value="${this.selectedAvatar || ""}">
      </div>
    `;

    // Add click handler for randomize button
    const randomizeBtn = this.container.querySelector(".randomize-avatar-btn");
    if (randomizeBtn) {
      randomizeBtn.addEventListener("click", () => {
        this.selectRandomAvatar();
      });
    }
  }

  getSelectedAvatar() {
    return this.selectedAvatar;
  }
}

// Utility Functions
const showError = (element, message) => {
  element.textContent = message;
  element.classList.remove("hidden");
};

const hideError = (element) => {
  element.textContent = "";
  element.classList.add("hidden");
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "just now";
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const updateURL = (path) => {
  window.history.pushState(null, "", `#${path}`);
};

// Custom Alert Functions
const showAlert = (
  message,
  title = "Alert",
  cancelText = null,
  confirmText = "OK",
  onConfirm = null,
  onCancel = null
) => {
  popupTitle.textContent = title;
  popupMessage.textContent = message;

  // Set up buttons
  if (cancelText) {
    popupCancel.textContent = cancelText;
    popupCancel.classList.remove("hidden");
    popupCancel.onclick = () => {
      if (onCancel) onCancel();
      closeAlert();
    };
  } else {
    popupCancel.classList.add("hidden");
  }

  popupConfirm.textContent = confirmText;
  popupConfirm.onclick = () => {
    if (onConfirm) onConfirm();
    closeAlert();
  };

  // Show alert
  customAlert.classList.remove("hidden");
};

const closeAlert = () => {
  customAlert.classList.add("hidden");
};

// Initialize Alert Close Button
popupClose.addEventListener("click", closeAlert);

// Auth Event Handlers
const handleRegister = async (e) => {
  e.preventDefault();

  const email = document.getElementById("register-email").value;
  const username = document.getElementById("register-username").value;
  const fullName = document.getElementById("register-fullname").value;
  const password = document.getElementById("register-password").value;

  hideError(registerError);

  // Frontend validation for field lengths (3-32 characters)
  if (email.length < 3 || email.length > 32) {
    showError(registerError, "Email must be between 3 and 32 characters");
    return;
  }

  if (username.length < 3 || username.length > 32) {
    showError(registerError, "Username must be between 3 and 32 characters");
    return;
  }

  if (password.length < 3 || password.length > 32) {
    showError(registerError, "Password must be between 3 and 32 characters");
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError(registerError, "Please enter a valid email address");
    return;
  }
  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    showError(registerError, "Username can only contain letters, numbers, underscores, and hyphens");
    return;
  }

  // Validate fullName length if provided
  if (fullName && fullName.length > 50) {
    showError(registerError, "Full name cannot exceed 50 characters");
    return;
  }

  try {
    const data = { email, username, password };
    if (fullName) data.fullName = fullName;

    const result = await api.register(data);

    // Set token and update UI
    api.setToken(result.token);
    currentUser = result.user;

    // Switch to main view
    loadingContainer.classList.add("hidden");
    authContainer.classList.add("hidden");
    mainContainer.classList.remove("hidden");

    // Update navigation for authenticated user
    updateNavigation(true);

    // Load feed
    loadFeed();

    showAlert("Registration successful! Welcome to Chirper!");
  } catch (error) {
    showError(registerError, error.message || "Registration failed. Please try again.");
  }
};

const handleLogin = async (e) => {
  e.preventDefault();

  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  hideError(loginError);

  // Frontend validation for field lengths (3-32 characters)
  if (username.length < 3 || username.length > 32) {
    showError(loginError, "Username must be between 3 and 32 characters");
    return;
  }

  if (password.length < 3 || password.length > 32) {
    showError(loginError, "Password must be between 3 and 32 characters");
    return;
  }

  try {
    const result = await api.login({ username, password });

    // Set token and update UI
    api.setToken(result.token);
    currentUser = result.user;

    // Switch to main view
    loadingContainer.classList.add("hidden");
    authContainer.classList.add("hidden");
    mainContainer.classList.remove("hidden");

    // Update navigation for authenticated user
    updateNavigation(true);

    // Load feed
    loadFeed();
  } catch (error) {
    showError(loginError, error.message || "Login failed. Please check your credentials.");
  }
};

const handleLogout = async () => {
  try {
    await api.logout();
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear token and user state regardless of API response
    api.clearToken();
    currentUser = null;

    // Switch to auth view
    mainContainer.classList.add("hidden");
    authContainer.classList.remove("hidden");

    // Reset forms
    loginForm.reset();
    registerForm.reset();
    hideError(loginError);
    hideError(registerError);
  }
};

// Tab Switching
const switchTab = (tabName) => {
  tabBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  loginForm.classList.toggle("hidden", tabName !== "login");
  registerForm.classList.toggle("hidden", tabName !== "register");

  // Clear errors
  hideError(loginError);
  hideError(registerError);
};

// Navigation Functions
const updateNavigation = (isAuthenticated) => {
  if (isAuthenticated) {
    // Show profile link for authenticated users
    profileLink.classList.remove("hidden");
    // Update profile link to point to current user's profile
    profileLink.href = `#/profile/${currentUser.username}`;
  } else {
    // Hide profile link for unauthenticated users
    profileLink.classList.add("hidden");
  }
};

const showSection = (section) => {
  // Hide all sections
  feedSection.classList.add("hidden");
  profileSection.classList.add("hidden");
  editProfileSection.classList.add("hidden");

  // Show requested section
  section.classList.remove("hidden");

  // Update nav
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => link.classList.remove("active"));

  if (section === feedSection) {
    homeLink.classList.add("active");
  } else if (section === profileSection || section === editProfileSection) {
    profileLink.classList.add("active");
  }
};

// URL Handling
const handleURLChange = () => {
  const hash = window.location.hash;

  if (!hash || hash === "#/" || hash === "#/feed") {
    loadFeed();
    showSection(feedSection);
  } else if (hash.startsWith("#/profile/")) {
    const username = hash.split("/")[2];
    loadProfile(username);
  }
};

// Chirp Functions
const loadFeed = async (loadMore = false) => {
  try {
    if (isLoadingMore) return;
    if (loadMore) {
      isLoadingMore = true;
      // Add loading indicator at the bottom
      const loadingIndicator = document.createElement("div");
      loadingIndicator.className = "loading-indicator";
      loadingIndicator.id = "load-more-indicator";
      loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading more chirps...';
      chirpsContainer.appendChild(loadingIndicator);
    } else {
      // Display initial loading state
      chirpsContainer.innerHTML =
        '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading chirps...</div>';
      currentChirps = [];
      hasMoreChirps = true;
    } // Calculate pagination parameters
    const lastTimestamp =
      loadMore && currentChirps.length > 0 ? currentChirps[currentChirps.length - 1].createdAt : null;

    // When using timestamp pagination, don't use offset
    const offset = lastTimestamp ? 0 : loadMore ? currentChirps.length : 0;

    // Get chirps from API
    const response = await api.getChirps(lastTimestamp, 10, offset);

    // Remove loading indicator if it exists
    const loadingIndicator = document.getElementById("load-more-indicator");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    // Check if we have more chirps to load using hasMore from response
    hasMoreChirps = response.hasMore;

    if (loadMore) {
      // Append new chirps to existing ones
      currentChirps = [...currentChirps, ...response.chirps];
    } else {
      currentChirps = response.chirps || [];
    }

    // Display chirps
    renderChirps(loadMore);

    // Show feed section
    showSection(feedSection);

    isLoadingMore = false;
  } catch (error) {
    console.error("Error loading feed:", error);
    isLoadingMore = false;

    if (loadMore) {
      // Remove loading indicator
      const loadingIndicator = document.getElementById("load-more-indicator");
      if (loadingIndicator) {
        loadingIndicator.remove();
      }

      // Show error message
      const errorEl = document.createElement("div");
      errorEl.className = "error";
      errorEl.textContent = "Failed to load more chirps. Please try again.";
      chirpsContainer.appendChild(errorEl);
    } else {
      chirpsContainer.innerHTML = '<div class="error">Failed to load chirps. Please try again.</div>';
    }
  }
};

const renderChirps = (append = false) => {
  if (currentChirps.length === 0 && !append) {
    chirpsContainer.innerHTML = `
      <div class="no-chirps">
        <h3>No chirps yet</h3>
        <p>Be the first to share your thoughts!</p>
      </div>
    `;
    return;
  }

  if (!append) {
    chirpsContainer.innerHTML = "";
  }

  // If we're appending, only add the new chirps
  const startIndex = append ? chirpsContainer.querySelectorAll(".chirp").length : 0;
  const chirpsToRender = currentChirps.slice(startIndex);

  chirpsToRender.forEach((chirp) => {
    const chirpEl = createChirpElement(chirp);
    chirpsContainer.appendChild(chirpEl);
  });

  // Add "Load More" button or message if needed
  if (!hasMoreChirps && currentChirps.length > 10) {
    const endMessage = document.createElement("div");
    endMessage.className = "end-message";
    endMessage.textContent = "No more chirps to load";
    chirpsContainer.appendChild(endMessage);
  }
};

const createChirpElement = (chirp) => {
  const chirpEl = document.importNode(chirpTemplate.content, true);
  const chirpNode = chirpEl.querySelector(".chirp");

  chirpNode.dataset.id = chirp.id;
  // Set user info
  const username = chirp.username || "unknown";
  const fullName = chirp.userFullName || username;
  const userAvatar = chirp.userAvatar || "/practice/chirper/images/default-avatar.svg";

  chirpEl.querySelector(".username").textContent = `@${username}`;
  chirpEl.querySelector(".username").href = `#/profile/${username}`;
  chirpEl.querySelector(".fullname").textContent = fullName;
  chirpEl.querySelector(".user-pic").src = userAvatar;
  chirpEl.querySelector(".chirp-time").textContent = formatTimestamp(chirp.createdAt);

  // Set chirp content
  chirpEl.querySelector(".chirp-content").textContent = chirp.text;

  // Show private indicator if chirp is private
  if (chirp.isPrivate) {
    chirpEl.querySelector(".private-indicator").classList.remove("hidden");
  }

  // Set like count
  chirpEl.querySelector(".likes-count").textContent = chirp.likes.length;

  // Set reply count
  chirpEl.querySelector(".replies-count").textContent = chirp.replies.length;

  // Attach event handlers
  const likeBtn = chirpEl.querySelector(".like-btn");
  const replyBtn = chirpEl.querySelector(".reply-btn");
  const replyBox = chirpEl.querySelector(".reply-box");
  const replyInput = chirpEl.querySelector(".reply-input");
  const submitReplyBtn = chirpEl.querySelector(".submit-reply");
  const repliesContainer = chirpEl.querySelector(".replies-container");

  // Handle like button
  likeBtn.addEventListener("click", () => {
    if (!currentUser) {
      showAlert("Please log in to like chirps", "Authentication Required");
      return;
    }

    handleChirpLike(chirp.id);
  });

  // Show like status for authenticated users
  if (currentUser && chirp.likes.includes(currentUser.id)) {
    likeBtn.classList.add("liked");
    likeBtn.querySelector("i").className = "fas fa-heart";
  }

  // Handle reply button
  replyBtn.addEventListener("click", () => {
    if (!currentUser) {
      showAlert("Please log in to reply to chirps", "Authentication Required");
      return;
    }

    replyBox.classList.toggle("hidden");
    if (!replyBox.classList.contains("hidden")) {
      replyInput.focus();
    }
  });

  // Handle submit reply
  submitReplyBtn.addEventListener("click", () => {
    const text = replyInput.value.trim();
    if (text) {
      handleSubmitReply(chirp.id, text, replyInput, replyBox, repliesContainer);
    }
  });

  // Enter key to submit reply
  replyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = replyInput.value.trim();
      if (text) {
        handleSubmitReply(chirp.id, text, replyInput, replyBox, repliesContainer);
      }
    }
  });

  // Show existing replies if any
  if (chirp.replies && chirp.replies.length > 0) {
    repliesContainer.classList.remove("hidden");
    chirp.replies.forEach((reply) => {
      const replyEl = createReplyElement(reply);
      repliesContainer.appendChild(replyEl);
    });
  }

  // Dropdown menu for chirp actions (delete, etc.)
  const dropdownToggle = chirpEl.querySelector(".dropdown-toggle");
  const dropdownMenu = chirpEl.querySelector(".dropdown-menu");
  const deleteChirpBtn = chirpEl.querySelector(".delete-chirp");

  dropdownToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("hidden");
  });

  // Hide dropdown when clicking elsewhere
  document.addEventListener("click", () => {
    dropdownMenu.classList.add("hidden");
  });

  // Show delete option only for user's own chirps
  if (currentUser && chirp.userId === currentUser.id) {
    deleteChirpBtn.classList.remove("hidden");
    deleteChirpBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showAlert(
        "Are you sure you want to delete this chirp?",
        "Confirm Delete",
        "Cancel",
        "Delete",
        () => handleDeleteChirp(chirp.id),
        null
      );
    });
  } else {
    deleteChirpBtn.classList.add("hidden");
  }

  return chirpEl;
};

const createReplyElement = (reply) => {
  const replyEl = document.importNode(replyTemplate.content, true);

  // Set username
  const username = reply.username || "unknown";
  replyEl.querySelector(".reply-username").textContent = `@${username}`;
  replyEl.querySelector(".reply-username").href = `#/profile/${username}`;

  // Set content and time
  replyEl.querySelector(".reply-content").textContent = reply.text;
  replyEl.querySelector(".reply-time").textContent = formatTimestamp(reply.createdAt);

  return replyEl;
};

const handleChirpLike = async (chirpId) => {
  try {
    const updatedChirp = await api.likeChirp(chirpId);

    // Find chirp in current chirps
    const chirpIndex = currentChirps.findIndex((c) => c.id === chirpId);
    if (chirpIndex !== -1) {
      currentChirps[chirpIndex] = updatedChirp;
    }

    // Update UI
    updateChirpLikes(updatedChirp);
  } catch (error) {
    console.error("Like error:", error);
    showAlert("Failed to like chirp: " + error.message, "Error");
  }
};

const updateChirpLikes = (chirp) => {
  // Update in feed
  const chirpEl = document.querySelector(`.chirp[data-id="${chirp.id}"]`);
  if (chirpEl) {
    const likeBtn = chirpEl.querySelector(".like-btn");
    const likesCount = chirpEl.querySelector(".likes-count");

    likesCount.textContent = chirp.likes.length;

    // Update like button appearance
    if (currentUser) {
      const isLiked = chirp.likes.includes(currentUser.id);
      likeBtn.classList.toggle("liked", isLiked);
      likeBtn.querySelector("i").className = isLiked ? "fas fa-heart" : "far fa-heart";
    }
  }

  // Update in profile view
  const profileChirpEl = document.querySelector(`#profile-chirps-container .chirp[data-id="${chirp.id}"]`);
  if (profileChirpEl) {
    const likeBtn = profileChirpEl.querySelector(".like-btn");
    const likesCount = profileChirpEl.querySelector(".likes-count");

    likesCount.textContent = chirp.likes.length;

    if (currentUser) {
      const isLiked = chirp.likes.includes(currentUser.id);
      likeBtn.classList.toggle("liked", isLiked);
      likeBtn.querySelector("i").className = isLiked ? "fas fa-heart" : "far fa-heart";
    }
  }
};

const handleSubmitReply = async (chirpId, text, inputElement, replyBoxElement, repliesContainerElement) => {
  try {
    if (text.length > POST_MAX_LENGTH) {
      showAlert(`Reply cannot exceed ${POST_MAX_LENGTH} characters`, "Error");
      return;
    }

    const newReply = await api.replyToChirp(chirpId, { text });

    // Update UI
    inputElement.value = "";
    replyBoxElement.classList.add("hidden");

    // Add the new reply to the replies container
    repliesContainerElement.classList.remove("hidden");
    const replyEl = createReplyElement(newReply);
    repliesContainerElement.appendChild(replyEl);

    // Update reply count
    const chirpEl = document.querySelector(`.chirp[data-id="${chirpId}"]`);
    if (chirpEl) {
      const repliesCount = chirpEl.querySelector(".replies-count");
      repliesCount.textContent = parseInt(repliesCount.textContent, 10) + 1;
    }

    // Also update in currentChirps array
    const chirpIndex = currentChirps.findIndex((c) => c.id === chirpId);
    if (chirpIndex !== -1) {
      if (!currentChirps[chirpIndex].replies) {
        currentChirps[chirpIndex].replies = [];
      }
      currentChirps[chirpIndex].replies.push(newReply);
    }
  } catch (error) {
    console.error("Reply error:", error);
    showAlert("Failed to submit reply: " + error.message, "Error");
  }
};

const handleDeleteChirp = async (chirpId) => {
  try {
    await api.deleteChirp(chirpId);

    // Remove chirp from DOM
    const chirpEl = document.querySelector(`.chirp[data-id="${chirpId}"]`);
    if (chirpEl) {
      chirpEl.remove();
    }

    // Remove from currentChirps array
    const chirpIndex = currentChirps.findIndex((c) => c.id === chirpId);
    if (chirpIndex !== -1) {
      currentChirps.splice(chirpIndex, 1);
    }

    // Check if we need to display "no chirps" message
    if (currentChirps.length === 0) {
      renderChirps();
    }

    showAlert("Chirp deleted successfully", "Success");
  } catch (error) {
    console.error("Delete chirp error:", error);
    showAlert("Failed to delete chirp: " + error.message, "Error");
  }
};

const handleComposeChirp = async (e) => {
  e.preventDefault();

  const text = chirpText.value.trim();
  const isPrivate = isPrivateCheckbox.checked;

  if (!text) {
    showAlert("Chirp text is required", "Error");
    return;
  }

  if (text.length > POST_MAX_LENGTH) {
    showAlert(`Chirp cannot exceed ${POST_MAX_LENGTH} characters`, "Error");
    return;
  }

  try {
    const newChirp = await api.createChirp({ text, isPrivate });

    // Add to currentChirps at the beginning
    currentChirps.unshift(newChirp);

    // Clear form
    chirpText.value = "";
    isPrivateCheckbox.checked = false;
    charCounter.textContent = `0/${POST_MAX_LENGTH}`;

    // Render chirps to show the new one
    renderChirps();

    showAlert("Chirp posted successfully", "Success");
  } catch (error) {
    console.error("Compose chirp error:", error);
    showAlert("Failed to post chirp: " + error.message, "Error");
  }
};

// Profile Functions
const loadProfile = async (username, loadMore = false) => {
  try {
    if (isLoadingMore) return;

    if (loadMore) {
      isLoadingMore = true; // Add loading indicator at the bottom
      const loadingIndicator = document.createElement("div");
      loadingIndicator.className = "loading-indicator";
      loadingIndicator.id = "profile-load-more-indicator";
      loadingIndicator.textContent = "Loading more chirps...";
      profileChirpsContainer.appendChild(loadingIndicator);
    } else {
      // Display loading state
      profileChirpsContainer.innerHTML = '<div class="loading-indicator">Loading profile...</div>';

      // Update URL
      if (window.location.hash !== `#/profile/${username}`) {
        window.removeEventListener("hashchange", handleURLChange);
        updateURL(`/profile/${username}`);
        setTimeout(() => {
          window.addEventListener("hashchange", handleURLChange);
        }, 0);
      }
    } // Calculate pagination parameters
    const lastTimestamp =
      loadMore && currentProfile && currentProfile.chirps.length > 0
        ? currentProfile.chirps[currentProfile.chirps.length - 1].createdAt
        : null;

    // When using timestamp pagination, don't use offset
    const offset = lastTimestamp ? 0 : loadMore && currentProfile ? currentProfile.chirps.length : 0;

    // Get profile data
    const profileData = await api.getUserProfile(username, lastTimestamp, 10, offset);

    // Remove loading indicator if it exists
    const loadingIndicator = document.getElementById("profile-load-more-indicator");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    if (loadMore) {
      // Merge chirps with existing ones
      profileData.chirps = [...currentProfile.chirps, ...profileData.chirps];

      // Update the current profile with the merged data
      currentProfile = {
        ...currentProfile,
        chirps: profileData.chirps,
      };
    } else {
      currentProfile = profileData;

      // Update UI
      profileUsername.textContent = `@${profileData.user.username}`;
      profileFullname.textContent = profileData.user.fullName || profileData.user.username;
      profileBio.textContent = profileData.user.bio || "No bio yet.";

      // Update profile image
      if (profileData.user.avatar) {
        profileImage.src = profileData.user.avatar;
      } else {
        profileImage.src = "/practice/chirper/images/default-avatar.svg";
      }

      // Update stats
      chirpsCount.textContent = profileData.chirps.length;
      followersCount.textContent = profileData.followersCount;
      followingCount.textContent = profileData.followingCount;

      // Check if user is authenticated
      if (!currentUser) {
        // For unauthenticated users, hide edit and follow buttons
        editProfileBtn.classList.add("hidden");
        followBtn.classList.add("hidden");
      } else {
        // Show edit profile or follow button for authenticated users
        const isOwnProfile = currentUser.username === username;
        if (isOwnProfile) {
          editProfileBtn.classList.remove("hidden");
          followBtn.classList.add("hidden");
        } else {
          editProfileBtn.classList.add("hidden");
          followBtn.classList.remove("hidden");
          followBtn.textContent = profileData.isFollowing ? "Unfollow" : "Follow";
        }
      }
    }

    // Check if we have more chirps to load
    hasMoreChirps = profileData.hasMore;

    // Define isOwnProfile for both authenticated and unauthenticated users
    const isOwnProfile = currentUser ? currentUser.username === username : false;
    if (profileData.chirps.length === 0 && !loadMore) {
      profileChirpsContainer.innerHTML = `
        <div class="no-chirps">
          <h3>${isOwnProfile ? "You have no chirps yet" : "This user has no chirps yet"}</h3>
          <p>${
            isOwnProfile
              ? "Share your first chirp by using the compose box at the top of the feed."
              : "This user has not shared any chirps yet."
          }</p>
        </div>`;

      // Still show the profile section even if there are no chirps
      showSection(profileSection);
      return;
    }

    if (!loadMore) {
      // Clear container for fresh load
      profileChirpsContainer.innerHTML = "";

      // Filter indicator for private chirps
      if (isOwnProfile) {
        profileFilterIndicator.innerHTML = '<i class="fas fa-filter"></i> Showing all your chirps (including private)';
        profileFilterIndicator.classList.remove("hidden");
      } else if (currentUser && profileData.isFollowing) {
        profileFilterIndicator.innerHTML = '<i class="fas fa-filter"></i> Showing all chirps (including private)';
        profileFilterIndicator.classList.remove("hidden");
      } else {
        profileFilterIndicator.innerHTML = '<i class="fas fa-filter"></i> Showing only public chirps';
        profileFilterIndicator.classList.remove("hidden");
      }
    }

    // If we're loading more, only render the new chirps
    const startIndex = loadMore ? document.querySelectorAll("#profile-chirps-container .chirp").length : 0;
    const chirpsToRender = profileData.chirps.slice(startIndex);

    chirpsToRender.forEach((chirp) => {
      const chirpEl = createChirpElement(chirp);
      profileChirpsContainer.appendChild(chirpEl);
    });

    // Add "No more chirps" message if needed
    if (!hasMoreChirps && profileData.chirps.length > 10) {
      const endMessage = document.createElement("div");
      endMessage.className = "end-message";
      endMessage.textContent = "No more chirps to load";
      profileChirpsContainer.appendChild(endMessage);
    }

    // Show profile section
    showSection(profileSection);

    isLoadingMore = false;
  } catch (error) {
    console.error("Error loading profile:", error);
    isLoadingMore = false;

    if (loadMore) {
      // Remove loading indicator
      const loadingIndicator = document.getElementById("profile-load-more-indicator");
      if (loadingIndicator) {
        loadingIndicator.remove();
      }

      // Show error message
      const errorEl = document.createElement("div");
      errorEl.className = "error";
      errorEl.textContent = "Failed to load more chirps. Please try again.";
      profileChirpsContainer.appendChild(errorEl);
    } else {
      profileChirpsContainer.innerHTML = '<div class="error">Failed to load profile. Please try again.</div>';
      showAlert("Failed to load profile: " + error.message, "Error");
    }
  }
};

const handleFollowUser = async () => {
  if (!currentUser) {
    showAlert("Please log in to follow users", "Authentication Required");
    return;
  }

  try {
    const username = currentProfile.user.username;
    const result = await api.followUser(username);

    // Update button text
    followBtn.textContent = result.isFollowing ? "Unfollow" : "Follow";

    // Update followers count
    const newCount = result.isFollowing
      ? parseInt(followersCount.textContent) + 1
      : parseInt(followersCount.textContent) - 1;
    followersCount.textContent = newCount;

    // Update currentProfile
    currentProfile.isFollowing = result.isFollowing;

    // Show success message
    showAlert(
      result.isFollowing ? `You are now following @${username}` : `You have unfollowed @${username}`,
      "Success"
    );

    // Reload profile to update chirps (to see/hide private chirps)
    loadProfile(username);
  } catch (error) {
    console.error("Follow error:", error);
    showAlert("Failed to follow user: " + error.message, "Error");
  }
};

const showEditProfile = () => {
  if (!currentUser) {
    showAlert("Please log in to edit your profile", "Authentication Required");
    return;
  }

  // Pre-fill form with current user data
  editFullname.value = currentUser.fullName || "";
  editBio.value = currentUser.bio || "";

  // Initialize avatar picker
  if (!window.editAvatarPicker) {
    window.editAvatarPicker = new ChirperAvatarPicker("edit-avatar-picker", (avatar) => {
      // Store the selected avatar for later use
    });
    window.editAvatarPicker.loadAvatars();
  }

  // Set current user's avatar in the picker
  if (currentUser.avatar) {
    window.editAvatarPicker.setCurrentAvatar(currentUser.avatar);
  }

  // Show edit profile section
  showSection(editProfileSection);
};

const handleUpdateProfile = async (e) => {
  e.preventDefault();

  const fullName = editFullname.value.trim();
  const bio = editBio.value.trim();
  const avatar = window.editAvatarPicker ? window.editAvatarPicker.getSelectedAvatar() : null;

  hideError(editProfileError);

  // Frontend validation for field lengths
  if (fullName.length > 50) {
    showError(editProfileError, "Full name cannot exceed 50 characters");
    return;
  }

  if (bio.length > 160) {
    showError(editProfileError, "Bio cannot exceed 160 characters");
    return;
  }

  try {
    const updateData = { fullName, bio };
    if (avatar) {
      updateData.avatar = avatar;
    }

    const result = await api.updateProfile(updateData);

    // Update current user with new data
    currentUser = result.user;

    // Update profile page
    profileFullname.textContent = currentUser.fullName || currentUser.username;
    profileBio.textContent = currentUser.bio || "No bio yet.";

    // Update profile image if avatar was changed
    if (currentUser.avatar) {
      profileImage.src = currentUser.avatar;
    } else {
      profileImage.src = "/data/users/_default.png";
    }

    // Switch back to profile view
    showSection(profileSection);

    // Reload profile to refresh data
    loadProfile(currentUser.username);

    // Show success message
    showAlert("Profile updated successfully", "Success");
  } catch (error) {
    console.error("Update profile error:", error);
    showError(editProfileError, error.message || "Failed to update profile");
    showAlert("Failed to update profile: " + error.message, "Error");
  }
};

// Search Functions
const handleSearch = async () => {
  const query = searchInput.value.trim();

  if (!query) {
    searchResults.classList.add("hidden");
    return;
  }

  if (!currentUser) {
    showAlert("Please log in to search for users", "Authentication Required");
    return;
  }

  try {
    const results = await api.searchUsers(query);

    searchResults.innerHTML = "";

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result">No users found</div>';
    } else {
      results.forEach((user) => {
        const resultEl = document.importNode(searchResultTemplate.content, true);
        resultEl.querySelector(".search-result-pic").src = user.avatar || "/practice/chirper/images/default-avatar.svg";
        resultEl.querySelector(".search-result-username").textContent = `@${user.username}`;
        resultEl.querySelector(".search-result-username").href = `#/profile/${user.username}`;
        resultEl.querySelector(".search-result-username").addEventListener("click", (e) => {
          e.preventDefault();
          loadProfile(user.username);
          searchResults.classList.add("hidden");
          searchInput.value = "";
        });
        resultEl.querySelector(".search-result-fullname").textContent = user.fullName || "";

        searchResults.appendChild(resultEl);
      });
    }

    searchResults.classList.remove("hidden");
  } catch (error) {
    console.error("Search error:", error);
    searchResults.classList.add("hidden");
  }
};

// Handle scroll for infinite scrolling
const handleScroll = () => {
  if (!hasMoreChirps || isLoadingMore) return;

  const scrollPosition = window.innerHeight + window.scrollY;
  const pageHeight = document.body.offsetHeight;
  const scrollThreshold = 0.85; // Load more when user scrolls to 85% of the page (slightly earlier)

  if (scrollPosition >= pageHeight * scrollThreshold) {
    // Check which section is currently visible
    if (!feedSection.classList.contains("hidden")) {
      loadFeed(true);
    } else if (!profileSection.classList.contains("hidden") && currentProfile) {
      loadProfile(currentProfile.user.username, true);
    }
  }
};

// Event Listeners
// Auth
loginForm.addEventListener("submit", handleLogin);
registerForm.addEventListener("submit", handleRegister);
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});
logoutLink.addEventListener("click", handleLogout);

// Add scroll event listener for infinite scrolling
window.addEventListener("scroll", handleScroll);

// Use predefined test users
predefinedUsers.forEach((user) => {
  user.addEventListener("click", () => {
    document.getElementById("login-username").value = user.dataset.username;
    document.getElementById("login-password").value = user.dataset.password;
  });
});

// Navigation
homeLink.addEventListener("click", (e) => {
  e.preventDefault();
  loadFeed();
  updateURL("/feed");
});

profileLink.addEventListener("click", (e) => {
  e.preventDefault();
  if (currentUser) {
    loadProfile(currentUser.username);
  }
});

// Compose Chirp
composeForm.addEventListener("submit", handleComposeChirp);

// Character counter
chirpText.addEventListener("input", () => {
  const length = chirpText.value.length;
  charCounter.textContent = `${length}/${POST_MAX_LENGTH}`;
  charCounter.classList.toggle("limit-exceeded", length > POST_MAX_LENGTH);
});

// Profile
editProfileBtn.addEventListener("click", showEditProfile);
followBtn.addEventListener("click", handleFollowUser);
editProfileForm.addEventListener("submit", handleUpdateProfile);
cancelEditBtn.addEventListener("click", () => {
  if (currentProfile) {
    showSection(profileSection);
  } else {
    showSection(feedSection);
  }
});

// Search
searchInput.addEventListener("input", handleSearch);
searchInput.addEventListener("focusout", () => {
  // Delay hiding so click on result can register
  setTimeout(() => {
    searchResults.classList.add("hidden");
  }, 200);
});

// Hide search results when clicking outside
document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.classList.add("hidden");
  }
});

// URL change handling
window.addEventListener("hashchange", handleURLChange);

// Initialize
const init = async () => {
  // Initially show the loading screen, hide auth and main
  loadingContainer.classList.remove("hidden");
  authContainer.classList.add("hidden");
  mainContainer.classList.add("hidden");

  // Set minimum loading time to ensure skeleton is visible
  const minLoadingTime = 800;
  const loadingStartTime = Date.now();

  // Check if user is logged in
  const token = getBrowserCookie("token") || localStorage.getItem("token");

  if (token) {
    api.setToken(token);

    try {
      const authResult = await api.checkAuth();

      // Ensure minimum loading time
      const loadingEndTime = Date.now();
      const loadingElapsedTime = loadingEndTime - loadingStartTime;
      if (loadingElapsedTime < minLoadingTime) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingTime - loadingElapsedTime));
      }

      if (authResult.isAuthenticated) {
        currentUser = authResult.user;

        // Show the main app, hide loading
        loadingContainer.classList.add("hidden");
        authContainer.classList.add("hidden");
        mainContainer.classList.remove("hidden");

        // Update navigation for authenticated user
        updateNavigation(true);

        // Process URL hash or load the feed
        if (window.location.hash) {
          handleURLChange();
        } else {
          // Load the user's feed
          loadFeed();
        }
      } else {
        // Token is invalid, show login, hide loading
        loadingContainer.classList.add("hidden");
        authContainer.classList.remove("hidden");
        mainContainer.classList.add("hidden");
      }
    } catch (error) {
      // Ensure minimum loading time
      const loadingEndTime = Date.now();
      const loadingElapsedTime = loadingEndTime - loadingStartTime;
      if (loadingElapsedTime < minLoadingTime) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingTime - loadingElapsedTime));
      }

      // On error, show login, hide loading
      loadingContainer.classList.add("hidden");
      authContainer.classList.remove("hidden");
      mainContainer.classList.add("hidden");
    }
  } else {
    // No token case - artificial delay to show skeleton
    await new Promise((resolve) => setTimeout(resolve, minLoadingTime));

    // No token, show auth page
    loadingContainer.classList.add("hidden");
    authContainer.classList.remove("hidden");
    mainContainer.classList.add("hidden");

    // Default to login tab
    switchTab("login");
  }
};

// Input validation helpers
const validateInputLength = (input, errorElement, fieldName, min = 3, max = 32) => {
  const value = input.value.trim();

  // For optional fields (min = 0), allow empty values
  if (min === 0 && value.length === 0) {
    hideError(errorElement);
    return true;
  }

  if (value.length > 0 && (value.length < min || value.length > max)) {
    showError(errorElement, `${fieldName} must be between ${min} and ${max} characters`);
    return false;
  } else {
    hideError(errorElement);
    return true;
  }
};

const validateEmail = (input, errorElement) => {
  const value = input.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (value.length > 0 && !emailRegex.test(value)) {
    showError(errorElement, "Please enter a valid email address");
    return false;
  } else {
    hideError(errorElement);
    return true;
  }
};

const validateUsername = (input, errorElement) => {
  const value = input.value.trim();
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (value.length > 0 && !usernameRegex.test(value)) {
    showError(errorElement, "Username can only contain letters, numbers, underscores, and hyphens");
    return false;
  } else {
    hideError(errorElement);
    return true;
  }
};

// Add real-time validation event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Login form validation
  const loginUsername = document.getElementById("login-username");
  const loginPassword = document.getElementById("login-password");

  if (loginUsername) {
    loginUsername.addEventListener("input", () => {
      validateInputLength(loginUsername, loginError, "Username", 3, 32);
    });
  }

  if (loginPassword) {
    loginPassword.addEventListener("input", () => {
      validateInputLength(loginPassword, loginError, "Password", 3, 32);
    });
  }

  // Register form validation
  const registerEmail = document.getElementById("register-email");
  const registerUsername = document.getElementById("register-username");
  const registerPassword = document.getElementById("register-password");
  const registerFullname = document.getElementById("register-fullname");

  if (registerEmail) {
    registerEmail.addEventListener("input", () => {
      validateInputLength(registerEmail, registerError, "Email", 3, 32);
      validateEmail(registerEmail, registerError);
    });
  }

  if (registerUsername) {
    registerUsername.addEventListener("input", () => {
      validateInputLength(registerUsername, registerError, "Username", 3, 32);
      validateUsername(registerUsername, registerError);
    });
  }

  if (registerPassword) {
    registerPassword.addEventListener("input", () => {
      validateInputLength(registerPassword, registerError, "Password", 3, 32);
    });
  }

  if (registerFullname) {
    registerFullname.addEventListener("input", () => {
      validateInputLength(registerFullname, registerError, "Full Name", 0, 50);
    });
  }

  // Edit profile form validation
  const editFullname = document.getElementById("edit-fullname");
  const editBio = document.getElementById("edit-bio");

  if (editFullname) {
    editFullname.addEventListener("input", () => {
      validateInputLength(editFullname, editProfileError, "Full Name", 0, 50);
    });
  }

  if (editBio) {
    editBio.addEventListener("input", () => {
      validateInputLength(editBio, editProfileError, "Bio", 0, 160);
    });
  }
});

// Start the application
init();
