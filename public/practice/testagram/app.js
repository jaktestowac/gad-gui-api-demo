// Testagram Frontend Application
// Main JavaScript file for the Testagram application

// API Base URL
const API_BASE_URL = "/api/practice/v1/testagram";

// Current user state
let currentUser = null;
let currentProfile = null;
let currentPosts = [];
let currentPage = 0;
let isLoadingMore = false;
let hasMorePosts = true;

// DOM Elements
const loadingContainer = document.getElementById("loading-container");
const authContainer = document.getElementById("auth-container");
const mainContainer = document.getElementById("main-container");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");
const tabBtns = document.querySelectorAll(".tab-btn");
const postsContainer = document.getElementById("posts-container");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const homeLink = document.querySelector(".home-link");
const createPostLink = document.querySelector(".create-post-link");
const profileLink = document.querySelector(".profile-link");
const logoutLink = document.querySelector(".logout-link");
const feedSection = document.getElementById("feed-section");
const profileSection = document.getElementById("profile-section");
const createPostSection = document.getElementById("create-post-section");
const editProfileSection = document.getElementById("edit-profile-section");
const createPostForm = document.getElementById("create-post-form");
const editProfileForm = document.getElementById("edit-profile-form");
const postImageUrl = document.getElementById("post-image-url");
const generateRandomImageBtn = document.getElementById("generate-random-image");
const imagePreview = document.getElementById("image-preview");
const postError = document.getElementById("post-error");
const editProfileBtn = document.getElementById("edit-profile-btn");
const followBtn = document.getElementById("follow-btn");
const profileUsername = document.getElementById("profile-username");
const profileFullname = document.getElementById("profile-fullname");
const profileImage = document.getElementById("profile-image");
const profileBio = document.getElementById("profile-bio");
const postsCount = document.getElementById("posts-count");
const followersCount = document.getElementById("followers-count");
const followingCount = document.getElementById("following-count");
const profilePostsContainer = document.getElementById("profile-posts-container");
const postModal = document.getElementById("post-modal");
const modalOverlay = document.querySelector(".modal-overlay");
const modalClose = document.querySelector(".modal-close");
const modalPostImage = document.getElementById("modal-post-image");
const modalUserPic = document.getElementById("modal-user-pic");
const modalUsername = document.getElementById("modal-username");
const modalCaption = document.getElementById("modal-caption");
const modalComments = document.getElementById("modal-comments");
const modalLikesCount = document.getElementById("modal-likes-count");
const modalTime = document.getElementById("modal-time");
const modalLikeBtn = document.getElementById("modal-like-btn");
const modalCommentForm = document.getElementById("modal-comment-form");
const modalCommentInput = document.getElementById("modal-comment-input");
const modalDeletePost = document.getElementById("modal-delete-post");
const modalPostActions = document.getElementById("modal-post-actions");
const editFullname = document.getElementById("edit-fullname");
const editBio = document.getElementById("edit-bio");
const editProfilePic = document.getElementById("edit-profile-pic");
const cancelEditBtn = document.getElementById("cancel-edit");
const editProfileError = document.getElementById("edit-profile-error");

// Custom Alert Elements
const customAlert = document.getElementById("custom-alert");
const popupOverlay = document.querySelector(".popup-overlay");
const popupTitle = document.getElementById("popup-title");
const popupMessage = document.getElementById("popup-message");
const popupConfirm = document.getElementById("popup-confirm");
const popupCancel = document.getElementById("popup-cancel");
const popupClose = document.querySelector(".popup-close");

// Templates
const postTemplate = document.getElementById("post-template");
const profilePostTemplate = document.getElementById("profile-post-template");
const commentTemplate = document.getElementById("comment-template");
const searchResultTemplate = document.getElementById("search-result-template");

// URL navigation functions
const updateURL = (path) => {
  window.location.hash = path;
};

const handleURLChange = () => {
  const hash = window.location.hash;

  if (!hash || hash === "#/" || hash === "#") {
    // Main feed
    showSection(feedSection);
    loadFeed();
  } else if (hash.startsWith("#/profile/")) {
    // User profile
    const username = hash.split("/")[2];
    if (username) {
      loadProfile(username);
    }
  } else if (hash === "#/post/new") {
    // Create post
    showSection(createPostSection);
  }
};

// Helper Functions
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`;
  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? "day" : "days"} ago`;

  return date.toLocaleDateString();
};

const showError = (element, message) => {
  element.textContent = message;
  element.classList.remove("hidden");

  setTimeout(() => {
    element.classList.add("hidden");
  }, 5000);
};

// Custom Alert Functions
const showAlert = (message, title = "Alert") => {
  return new Promise((resolve) => {
    popupTitle.textContent = title;
    popupMessage.textContent = message;

    // Hide cancel button for simple alerts
    popupCancel.classList.add("hidden");

    // Set up confirm button
    popupConfirm.onclick = () => {
      customAlert.classList.add("hidden");
      resolve(true);
    };

    // Set up close button
    popupClose.onclick = () => {
      customAlert.classList.add("hidden");
      resolve(false);
    };

    // Show alert
    customAlert.classList.remove("hidden");
  });
};

const showConfirm = (message, title = "Confirm") => {
  return new Promise((resolve) => {
    popupTitle.textContent = title;
    popupMessage.textContent = message;

    // Show cancel button for confirmations
    popupCancel.classList.remove("hidden");

    // Set up confirm button
    popupConfirm.onclick = () => {
      customAlert.classList.add("hidden");
      resolve(true);
    };

    // Set up cancel button
    popupCancel.onclick = () => {
      customAlert.classList.add("hidden");
      resolve(false);
    };

    // Set up close button
    popupClose.onclick = () => {
      customAlert.classList.add("hidden");
      resolve(false);
    };

    // Show alert
    customAlert.classList.remove("hidden");
  });
};

const setCookie = (name, value, days) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

const getBrowserCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const eraseCookie = (name) => {
  document.cookie = name + "=; Max-Age=-99999999; path=/";
};

// API Functions
const api = {
  token: getBrowserCookie("token") || localStorage.getItem("token"),

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  },

  async request(endpoint, method = "GET", data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const options = {
      method,
      headers,
      credentials: "include",
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "API request failed");
      }

      return result;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
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
  },

  // Posts endpoints
  getPosts(page = 0, limit = 3) {
    return this.request(`/posts?page=${page}&limit=${limit}`, "GET");
  },

  createPost(data) {
    return this.request("/posts", "POST", data);
  },

  getPost(id) {
    return this.request(`/posts/${id}`, "GET");
  },

  deletePost(id) {
    return this.request(`/posts/${id}`, "DELETE");
  },

  likePost(id) {
    return this.request(`/posts/${id}/like`, "POST");
  },

  commentOnPost(id, text) {
    return this.request(`/posts/${id}/comment`, "POST", { text });
  },

  // User endpoints
  getUserProfile(username) {
    return this.request(`/users/${username}`, "GET");
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

// Event Handlers
const handleTabClick = (e) => {
  const tab = e.target.dataset.tab;

  tabBtns.forEach((btn) => {
    btn.classList.remove("active");
  });

  e.target.classList.add("active");

  if (tab === "login") {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  if (!username && !password) {
    showError(loginError, "Please enter your username and password");
    return;
  } else if (!username) {
    showError(loginError, "Please enter your username or email");
    return;
  } else if (!password) {
    showError(loginError, "Please enter your password");
    return;
  } else if (password.length < 3) {
    showError(loginError, "Password must be at least 3 characters long");
    return;
  }

  try {
    const result = await api.login({ username, password });
    api.setToken(result.token);
    currentUser = result.user;

    // Save token to cookie
    setCookie("token", result.token, 1);

    // Show the main app
    authContainer.classList.add("hidden");
    mainContainer.classList.remove("hidden");

    // Load the user's feed
    loadFeed();
  } catch (error) {
    console.error("Login error:", error);
    if (error.message.includes("Invalid username or password")) {
      showError(loginError, "Invalid username or password. Please check your credentials and try again.");
    } else if (error.message.includes("network") || error.status === 0) {
      showError(loginError, "Network error. Please check your internet connection and try again.");
    } else {
      showError(loginError, "Login failed. " + (error.message || "Please try again later."));
    }
  }
};

const handleRegister = async (e) => {
  e.preventDefault();

  const email = document.getElementById("register-email").value;
  const username = document.getElementById("register-username").value;
  const fullName = document.getElementById("register-fullname").value;
  const password = document.getElementById("register-password").value;

  // Validation
  if (!email || !username || !password) {
    showError(registerError, "Please fill all required fields");
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError(registerError, "Please enter a valid email address");
    return;
  }

  // Validate username (3-20 characters, only letters, numbers, dots and underscores)
  const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;
  if (!usernameRegex.test(username)) {
    showError(
      registerError,
      "Username must be 3-20 characters and can only contain letters, numbers, dots, and underscores"
    );
    return;
  }

  // Validate password (at least 3 characters)
  if (password.length < 3) {
    showError(registerError, "Password must be at least 3 characters long");
    return;
  }

  try {
    const result = await api.register({ email, username, fullName, password });
    api.setToken(result.token);
    currentUser = result.user;

    // Save token to cookie
    setCookie("token", result.token, 1);

    // Show the main app
    authContainer.classList.add("hidden");
    mainContainer.classList.remove("hidden");

    // Load the user's feed
    loadFeed();
  } catch (error) {
    showError(registerError, error.message || "Registration failed. Please try again.");
  }
};

const handleLogout = async () => {
  try {
    await api.logout();
    api.setToken(null);
    currentUser = null;
    eraseCookie("token");

    // Return to the auth screen
    mainContainer.classList.add("hidden");
    authContainer.classList.remove("hidden");

    // Clear forms
    loginForm.reset();
    registerForm.reset();
  } catch (error) {
    console.error("Logout error:", error);
  }
};

const handleCreatePost = async (e) => {
  e.preventDefault();

  const imageUrl = postImageUrl.value;
  const caption = document.getElementById("post-caption").value;

  if (!imageUrl) {
    showError(postError, "Please enter an image URL");
    return;
  }

  // Validate image URL
  try {
    new URL(imageUrl);
  } catch (e) {
    showError(postError, "Please enter a valid image URL");
    return;
  }

  // Validate caption length
  if (caption && caption.length > 2000) {
    showError(postError, "Caption is too long (maximum 2000 characters)");
    return;
  }

  try {
    await api.createPost({ imageUrl, caption });

    // Reset form
    createPostForm.reset();
    imagePreview.src = "";
    imagePreview.classList.add("hidden");

    // Return to feed
    showSection(feedSection);
    loadFeed();
  } catch (error) {
    showError(postError, error.message || "Failed to create post");
  }
};

const handleImagePreview = () => {
  const url = postImageUrl.value;

  if (url) {
    imagePreview.src = url;
    imagePreview.classList.remove("hidden");
  } else {
    imagePreview.classList.add("hidden");
  }
};

const handleGenerateRandomImage = () => {
  const randomNum = Math.floor(Math.random() * 1000);
  const randomImageUrl = `https://picsum.photos/600/600?random=${randomNum}`;
  postImageUrl.value = randomImageUrl;
  imagePreview.src = randomImageUrl;
  imagePreview.classList.remove("hidden");
};

const handlePostLike = async (postId) => {
  try {
    const updatedPost = await api.likePost(postId);

    // Update UI for all instances of this post
    updatePostLikes(updatedPost);
  } catch (error) {
    console.error("Error liking post:", error);
  }
};

const handlePostComment = async (e, postId) => {
  e.preventDefault();

  const form = e.target;
  const input = form.querySelector(".comment-input") || modalCommentInput;
  const commentText = input.value.trim();

  if (!commentText) return;

  // Validate comment length
  if (commentText.length > 500) {
    showAlert("Comment is too long. Maximum 500 characters allowed.", "Error");
    return;
  }

  try {
    const newComment = await api.commentOnPost(postId, commentText);

    // Add comment to the post
    const post = currentPosts.find((p) => p.id === postId);
    if (post) {
      post.comments.push(newComment);

      // Update UI
      if (postModal.classList.contains("hidden")) {
        // Update in feed - just update the comment count
        const postEl = document.querySelector(`.post[data-id="${postId}"]`);
        if (postEl) {
          const viewComments = postEl.querySelector(".view-comments");
          viewComments.textContent = `View all ${post.comments.length} comments`;
        }
      } else {
        // Update in modal
        const commentEl = createCommentElement(newComment);
        modalComments.appendChild(commentEl);
      }
    }

    // Reset input
    input.value = "";

    // Show feedback
    showAlert("Comment added successfully!", "Success");
  } catch (error) {
    console.error("Error commenting on post:", error);
    showAlert("Failed to add comment: " + error.message, "Error");
  }
};

const handlePostDelete = async (postId) => {
  const shouldDelete = await showConfirm("Are you sure you want to delete this post?", "Delete Post");
  if (!shouldDelete) return;

  try {
    await api.deletePost(postId);

    // Remove from UI
    const postEl = document.querySelector(`.post[data-id="${postId}"]`);
    if (postEl) {
      postEl.remove();
    }

    // Remove from profile posts if in profile view
    const profilePostEl = document.querySelector(`.profile-post[data-id="${postId}"]`);
    if (profilePostEl) {
      profilePostEl.remove();
    }

    // Close modal if open
    closeModal();

    // Remove from currentPosts
    currentPosts = currentPosts.filter((p) => p.id !== postId);

    // If in profile view, update count
    if (!profileSection.classList.contains("hidden") && currentProfile) {
      postsCount.textContent = `${currentPosts.length} posts`;
    }

    // Show success message
    showAlert("Post deleted successfully.", "Success");
  } catch (error) {
    console.error("Error deleting post:", error);
    showAlert("Failed to delete post: " + error.message, "Error");
  }
};

const handleUserSearch = async () => {
  const query = searchInput.value.trim();

  if (query.length < 2) {
    searchResults.classList.add("hidden");
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
        resultEl.querySelector(".search-result-pic").src = user.profilePic;
        resultEl.querySelector(".search-result-username").textContent = user.username;
        resultEl.querySelector(".search-result-username").href = `#/profile/${user.username}`;
        resultEl.querySelector(".search-result-username").addEventListener("click", (e) => {
          e.preventDefault();
          loadProfile(user.username);
          searchResults.classList.add("hidden");
          searchInput.value = "";
        });
        resultEl.querySelector(".search-result-fullname").textContent = user.fullName;

        searchResults.appendChild(resultEl);
      });
    }

    searchResults.classList.remove("hidden");
  } catch (error) {
    console.error("Search error:", error);
    searchResults.classList.add("hidden");
  }
};

const handleFollowUser = async () => {
  if (!currentProfile) return;

  try {
    const result = await api.followUser(currentProfile.user.username);

    // Update button
    if (result.isFollowing) {
      followBtn.textContent = "Unfollow";
    } else {
      followBtn.textContent = "Follow";
    }

    // Update followers count
    const count = parseInt(followersCount.textContent);
    followersCount.textContent = result.isFollowing ? `${count + 1} followers` : `${count - 1} followers`;
  } catch (error) {
    console.error("Follow error:", error);
  }
};

const handleEditProfile = async (e) => {
  e.preventDefault();

  const fullName = editFullname.value;
  const bio = editBio.value;
  const profilePic = editProfilePic.value;

  try {
    const result = await api.updateProfile({ fullName, bio, profilePic });

    // Update currentUser
    currentUser = result.user;

    // Update UI
    profileImage.src = currentUser.profilePic;
    profileUsername.textContent = currentUser.username;
    profileFullname.textContent = currentUser.fullName;
    profileBio.textContent = currentUser.bio;

    // Switch back to profile view
    showSection(profileSection);

    // Reload profile to refresh data
    loadProfile(currentUser.username);

    // Show success message
    showAlert("Profile updated successfully.", "Success");
  } catch (error) {
    console.error("Update profile error:", error);
    // Show error in both places - alert and error message element
    showError(editProfileError, error.message || "Failed to update profile");
    showAlert("Failed to update profile: " + error.message, "Error");
  }
};

// UI Functions
const loadFeed = async (loadMore = false) => {
  if (isLoadingMore) return;

  try {
    if (!loadMore) {
      // First load or refresh
      currentPage = 0;
      currentPosts = [];
      hasMorePosts = true;
      postsContainer.innerHTML = '<div class="loading-indicator">Loading posts...</div>';
    } else {
      // Loading more posts (infinite scroll)
      isLoadingMore = true;
      const loadingEl = document.createElement("div");
      loadingEl.className = "loading-indicator";
      loadingEl.id = "load-more-indicator";
      loadingEl.innerHTML = "Loading more posts...";
      postsContainer.appendChild(loadingEl);
    }
    const response = await api.getPosts(currentPage);

    if (!loadMore) {
      postsContainer.innerHTML = "";
    } else {
      const loadingIndicator = document.getElementById("load-more-indicator");
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
    }

    const postData = response.posts || [];
    hasMorePosts = response.hasMore;

    // Add fetched posts to current posts
    currentPosts = loadMore ? [...currentPosts, ...postData] : postData;

    if (currentPosts.length === 0 && !loadMore) {
      postsContainer.innerHTML = `
        <div class="no-posts">
          <h3>No posts yet</h3>
          <p>Follow other users or create your first post!</p>
        </div>
      `;
      return;
    }

    if (loadMore) {
      // Only render the new posts
      postData.forEach((post) => {
        const postEl = createPostElement(post);
        postsContainer.appendChild(postEl);
      });
    } else {
      // Render all posts
      currentPosts.forEach((post) => {
        const postEl = createPostElement(post);
        postsContainer.appendChild(postEl);
      });
    }

    // Increment page for next load
    currentPage++;
  } catch (error) {
    console.error("Error loading feed:", error);

    if (!loadMore) {
      postsContainer.innerHTML = '<div class="error">Failed to load posts. Please try again.</div>';
    } else {
      const loadingIndicator = document.getElementById("load-more-indicator");
      if (loadingIndicator) {
        loadingIndicator.innerHTML = "Failed to load more posts. Try again.";
      }
    }
  } finally {
    isLoadingMore = false;
  }
};

const loadProfile = async (username) => {
  try {
    // Reset profile section
    profilePostsContainer.innerHTML = '<div class="loading-indicator">Loading posts...</div>';

    // Update URL without triggering the URL change handler
    if (window.location.hash !== `#/profile/${username}`) {
      window.removeEventListener("hashchange", handleURLChange);
      updateURL(`/profile/${username}`);
      setTimeout(() => {
        window.addEventListener("hashchange", handleURLChange);
      }, 0);
    }

    // Get profile data
    const profileData = await api.getUserProfile(username);
    currentProfile = profileData;
    currentPosts = profileData.posts;

    // Update UI
    profileUsername.textContent = profileData.user.username;
    profileFullname.textContent = profileData.user.fullName || "";
    profileImage.src = profileData.user.profilePic;
    profileBio.textContent = profileData.user.bio || "";
    postsCount.textContent = `${profileData.posts.length} posts`;
    followersCount.textContent = `${profileData.followersCount} followers`;
    followingCount.textContent = `${profileData.followingCount} following`;

    // Show edit profile or follow button
    const isOwnProfile = currentUser.username === username;
    if (isOwnProfile) {
      editProfileBtn.classList.remove("hidden");
      followBtn.classList.add("hidden");
    } else {
      editProfileBtn.classList.add("hidden");
      followBtn.classList.remove("hidden");
      followBtn.textContent = profileData.isFollowing ? "Unfollow" : "Follow";
    } // Display posts
    profilePostsContainer.innerHTML = "";

    if (profileData.posts.length === 0) {
      profilePostsContainer.innerHTML = `
        <div class="no-posts">
          <h3>${isOwnProfile ? "You have no posts yet" : "This user has no posts yet"}</h3>
          <p>${
            isOwnProfile
              ? "Create your first post by clicking the + icon in the navigation bar."
              : "This user has not shared any posts yet."
          }</p>
        </div>`;
      return;
    } // Add a heading to make it clearer whose posts are being displayed
    const postsHeading = document.querySelector(".profile-posts h3");
    const postsDescription = document.querySelector(".profile-posts-description");
    const filterIndicator = document.querySelector(".profile-filter-indicator");

    if (postsHeading) {
      postsHeading.textContent = isOwnProfile ? "My Posts" : `${username}'s Posts`;
    }

    if (postsDescription) {
      if (isOwnProfile) {
        postsDescription.textContent = "These are all the posts you have shared on Testagram.";
      } else {
        postsDescription.textContent = `These are all the posts shared by ${username}.`;
      }
    }

    if (filterIndicator) {
      if (isOwnProfile) {
        filterIndicator.innerHTML = '<i class="fas fa-filter"></i> Showing only your posts';
        filterIndicator.classList.remove("hidden");
      } else {
        filterIndicator.classList.add("hidden");
      }
    }

    profileData.posts.forEach((post) => {
      const postEl = createProfilePostElement(post);
      profilePostsContainer.appendChild(postEl);
    });

    // Show profile section
    showSection(profileSection);
  } catch (error) {
    console.error("Error loading profile:", error);
    showAlert("Failed to load profile: " + error.message, "Error");
  }
};

const createPostElement = (post) => {
  const postEl = document.importNode(postTemplate.content, true);
  const postNode = postEl.querySelector(".post");

  postNode.dataset.id = post.id;
  postEl.querySelector(".post-user-pic").src = post.userProfilePic;
  const usernameElements = postEl.querySelectorAll(".post-username");
  usernameElements.forEach((el) => {
    el.textContent = post.username;
    el.href = `#/profile/${post.username}`;
    el.addEventListener("click", (e) => {
      e.preventDefault();
      loadProfile(post.username);
    });
  });

  postEl.querySelector(".post-img").src = post.imageUrl;
  postEl.querySelector(".post-img").addEventListener("click", () => openPostModal(post));

  const likeBtn = postEl.querySelector(".like-btn");
  const isLiked = post.likes.some((like) => like.userId === currentUser.id);
  if (isLiked) {
    likeBtn.classList.add("liked");
    likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
  }

  likeBtn.addEventListener("click", () => handlePostLike(post.id));

  postEl.querySelector(".comment-btn").addEventListener("click", () => openPostModal(post));

  postEl.querySelector(".likes-count").textContent = `${post.likes.length} likes`;
  postEl.querySelector(".caption-text").textContent = post.caption;
  postEl.querySelector(".post-time").textContent = formatTimestamp(post.createdAt);

  // View comments link
  const viewComments = postEl.querySelector(".view-comments");
  if (post.comments.length > 0) {
    viewComments.textContent = `View all ${post.comments.length} comments`;
    viewComments.addEventListener("click", (e) => {
      e.preventDefault();
      openPostModal(post);
    });
  } else {
    viewComments.textContent = "Add a comment...";
    viewComments.addEventListener("click", (e) => {
      e.preventDefault();
      openPostModal(post);
    });
  }

  // Delete button for own posts
  const deleteLink = postEl.querySelector(".delete-post");
  if (post.userId === currentUser.id) {
    deleteLink.classList.remove("hidden");
    deleteLink.addEventListener("click", (e) => {
      e.preventDefault();
      handlePostDelete(post.id);
    });
  }

  // Dropdown toggle
  const dropdownToggle = postEl.querySelector(".dropdown-toggle");
  const dropdownMenu = postEl.querySelector(".dropdown-menu");

  dropdownToggle.addEventListener("click", () => {
    dropdownMenu.classList.toggle("hidden");
  });

  return postEl;
};

const createProfilePostElement = (post) => {
  const postEl = document.importNode(profilePostTemplate.content, true);
  const postNode = postEl.querySelector(".profile-post");

  postNode.dataset.id = post.id;
  postEl.querySelector(".profile-post-img").src = post.imageUrl;
  postEl.querySelector(".post-likes-count").textContent = post.likes.length;
  postEl.querySelector(".post-comments-count").textContent = post.comments.length;

  postNode.addEventListener("click", () => openPostModal(post));

  return postEl;
};

const createCommentElement = (comment) => {
  const commentEl = document.importNode(commentTemplate.content, true);
  const usernameEl = commentEl.querySelector(".comment-username");
  usernameEl.textContent = comment.username;
  usernameEl.href = `#/profile/${comment.username}`;
  usernameEl.addEventListener("click", (e) => {
    e.preventDefault();
    loadProfile(comment.username);
  });

  commentEl.querySelector(".comment-text").textContent = comment.text;
  commentEl.querySelector(".comment-time").textContent = formatTimestamp(comment.createdAt);

  return commentEl;
};

const updatePostLikes = (post) => {
  // Update in currentPosts array
  const postIndex = currentPosts.findIndex((p) => p.id === post.id);
  if (postIndex !== -1) {
    currentPosts[postIndex].likes = post.likes;
  }

  // Update in feed
  const postEl = document.querySelector(`.post[data-id="${post.id}"]`);
  if (postEl) {
    const likeBtn = postEl.querySelector(".like-btn");
    const likesCount = postEl.querySelector(".likes-count");

    likesCount.textContent = `${post.likes.length} likes`;

    const isLiked = post.likes.some((like) => like.userId === currentUser.id);
    if (isLiked) {
      likeBtn.classList.add("liked");
      likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
      likeBtn.classList.remove("liked");
      likeBtn.innerHTML = '<i class="far fa-heart"></i>';
    }
  }

  // Update in profile
  const profilePostEl = document.querySelector(`.profile-post[data-id="${post.id}"]`);
  if (profilePostEl) {
    profilePostEl.querySelector(".post-likes-count").textContent = post.likes.length;
  }

  // Update in modal
  if (!postModal.classList.contains("hidden")) {
    const modalPostId = modalPostImage.dataset.postId;
    if (modalPostId === post.id) {
      modalLikesCount.textContent = `${post.likes.length} likes`;

      const isLiked = post.likes.some((like) => like.userId === currentUser.id);
      if (isLiked) {
        modalLikeBtn.classList.add("liked");
        modalLikeBtn.innerHTML = '<i class="fas fa-heart"></i>';
      } else {
        modalLikeBtn.classList.remove("liked");
        modalLikeBtn.innerHTML = '<i class="far fa-heart"></i>';
      }
    }
  }
};

const openPostModal = (post) => {
  // Populate modal
  modalPostImage.dataset.postId = post.id;
  modalPostImage.src = post.imageUrl;
  modalPostImage.alt = post.caption || "Post image";
  modalUserPic.src = post.userProfilePic;
  modalUsername.textContent = post.username;
  modalUsername.href = `#/profile/${post.username}`;
  modalUsername.addEventListener("click", (e) => {
    e.preventDefault();
    loadProfile(post.username);
    closeModal();
  });
  modalCaption.innerHTML = `<a href="#/profile/${post.username}" class="modal-username">${post.username}</a> <span>${post.caption}</span>`;

  // Set up modal username in caption for profile navigation
  setTimeout(() => {
    const modalCaptionUsername = modalCaption.querySelector(".modal-username");
    if (modalCaptionUsername) {
      modalCaptionUsername.addEventListener("click", (e) => {
        e.preventDefault();
        loadProfile(post.username);
        closeModal();
      });
    }
  }, 0);

  modalTime.textContent = formatTimestamp(post.createdAt);
  modalLikesCount.textContent = `${post.likes.length} likes`;

  // Set up like button
  const isLiked = post.likes.some((like) => like.userId === currentUser.id);
  if (isLiked) {
    modalLikeBtn.classList.add("liked");
    modalLikeBtn.innerHTML = '<i class="fas fa-heart"></i>';
  } else {
    modalLikeBtn.classList.remove("liked");
    modalLikeBtn.innerHTML = '<i class="far fa-heart"></i>';
  }

  modalLikeBtn.onclick = () => handlePostLike(post.id);

  // Load comments
  modalComments.innerHTML = "";
  post.comments.forEach((comment) => {
    const commentEl = createCommentElement(comment);
    modalComments.appendChild(commentEl);
  });

  // Set up comment form
  modalCommentForm.onsubmit = (e) => handlePostComment(e, post.id);
  modalCommentInput.value = "";

  // Delete button for own posts
  if (post.userId === currentUser.id) {
    modalDeletePost.classList.remove("hidden");
    modalDeletePost.onclick = (e) => {
      e.preventDefault();
      handlePostDelete(post.id);
    };
  } else {
    modalDeletePost.classList.add("hidden");
  }

  // Show modal
  postModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  postModal.classList.add("hidden");
  document.body.style.overflow = "";
};

const showSection = (section) => {
  // Hide all sections
  feedSection.classList.add("hidden");
  profileSection.classList.add("hidden");
  createPostSection.classList.add("hidden");
  editProfileSection.classList.add("hidden");

  // Show requested section
  section.classList.remove("hidden");

  // Update nav
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => link.classList.remove("active"));

  if (section === feedSection) {
    homeLink.classList.add("active");
  } else if (section === createPostSection) {
    createPostLink.classList.add("active");
  } else if (section === profileSection || section === editProfileSection) {
    profileLink.classList.add("active");
  }
};

// Initialize
const init = async () => {
  // Initially show the loading screen, hide auth and main
  loadingContainer.classList.remove("hidden");
  authContainer.classList.add("hidden");
  mainContainer.classList.add("hidden");

  // Set minimum loading time to ensure skeleton is visible for at least 800ms
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
        currentUser = authResult.user; // Show the main app, hide loading
        loadingContainer.classList.add("hidden");
        authContainer.classList.add("hidden");
        mainContainer.classList.remove("hidden");

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
      console.error("Auth check error:", error);

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

    // No token, show login, hide loading
    loadingContainer.classList.add("hidden");
    authContainer.classList.remove("hidden");
    mainContainer.classList.add("hidden");
  }

  // Setup event listeners
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", handleTabClick);
  });

  loginForm.addEventListener("submit", handleLogin);
  registerForm.addEventListener("submit", handleRegister);
  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogout();
  });

  homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    updateURL("/");
  });

  createPostLink.addEventListener("click", (e) => {
    e.preventDefault();
    updateURL("/post/new");
  });

  profileLink.addEventListener("click", (e) => {
    e.preventDefault();
    updateURL(`/profile/${currentUser.username}`);
  });
  createPostForm.addEventListener("submit", handleCreatePost);
  postImageUrl.addEventListener("input", handleImagePreview);
  generateRandomImageBtn.addEventListener("click", handleGenerateRandomImage);

  editProfileBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // Populate form
    editFullname.value = currentUser.fullName || "";
    editBio.value = currentUser.bio || "";
    editProfilePic.value = currentUser.profilePic || "";

    showSection(editProfileSection);
  });

  cancelEditBtn.addEventListener("click", () => {
    showSection(profileSection);
  });

  editProfileForm.addEventListener("submit", handleEditProfile);

  followBtn.addEventListener("click", handleFollowUser);

  // Modal events
  modalOverlay.addEventListener("click", closeModal);
  modalClose.addEventListener("click", closeModal);

  // Custom Alert events
  popupOverlay.addEventListener("click", () => {
    customAlert.classList.add("hidden");
  });

  popupClose.addEventListener("click", () => {
    customAlert.classList.add("hidden");
  });

  // Search
  searchInput.addEventListener("input", handleUserSearch);
  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim().length >= 2) {
      searchResults.classList.remove("hidden");
    }
  });

  // Hide search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add("hidden");
    }
  });
  // Hide dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    const dropdowns = document.querySelectorAll(".dropdown-menu:not(.hidden)");
    dropdowns.forEach((dropdown) => {
      const parent = dropdown.closest(".dropdown");
      if (parent && !parent.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    });
  });

  // Add scroll event for infinite scrolling
  window.addEventListener("scroll", () => {
    if (feedSection.classList.contains("hidden") || !hasMorePosts || isLoadingMore) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    // Load more posts when user scrolls near the bottom (200px before the end)
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      loadFeed(true);
    }
  });

  // Listen to URL changes
  window.addEventListener("hashchange", handleURLChange);
  handleURLChange();
};

// Start the app
document.addEventListener("DOMContentLoaded", init);
