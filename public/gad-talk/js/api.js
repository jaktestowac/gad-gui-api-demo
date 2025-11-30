/**
 * GadTalk API Client
 * Handles all API communication with the GadTalk backend
 */

const GadTalkAPI = (function () {
  const BASE_URL = "/api/gad-talk";

  /**
   * Get auth token from storage
   */
  function getToken() {
    return localStorage.getItem("gadtalk_token") || sessionStorage.getItem("gadtalk_token");
  }

  /**
   * Set auth token in storage
   */
  function setToken(token, keepSignedIn = false) {
    if (keepSignedIn) {
      localStorage.setItem("gadtalk_token", token);
    } else {
      sessionStorage.setItem("gadtalk_token", token);
    }
  }

  /**
   * Remove auth token from storage
   */
  function clearToken() {
    localStorage.removeItem("gadtalk_token");
    sessionStorage.removeItem("gadtalk_token");
  }

  /**
   * Make an API request
   */
  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const token = getToken();

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (options.body && typeof options.body === "object") {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.error || data.message || "Request failed");
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.status === 401) {
        // Token expired or invalid - clear and redirect to login
        clearToken();
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/gad-talk/login.html";
        }
      }
      throw error;
    }
  }

  // ==================== Auth API ====================

  const auth = {
    /**
     * Sign up a new user
     */
    async signup(userData) {
      const response = await request("/auth/signup", {
        method: "POST",
        body: userData,
      });
      if (response.token) {
        setToken(response.token, false);
      }
      return response;
    },

    /**
     * Login user
     */
    async login(email, password, keepSignedIn = false) {
      const response = await request("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      if (response.token) {
        setToken(response.token, keepSignedIn);
      }
      return response;
    },

    /**
     * Login as demo user
     */
    async loginDemo() {
      const response = await request("/auth/demo", {
        method: "POST",
      });
      if (response.token) {
        setToken(response.token, false);
      }
      return response;
    },

    /**
     * Logout user
     */
    async logout() {
      try {
        await request("/auth/logout", {
          method: "POST",
        });
      } finally {
        clearToken();
      }
    },

    /**
     * Get current user
     */
    async me() {
      return request("/auth/me");
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
      return !!getToken();
    },
  };

  // ==================== Users API ====================

  const users = {
    /**
     * Get user by username or ID
     */
    async get(usernameOrId) {
      return request(`/users/${encodeURIComponent(usernameOrId)}`);
    },

    /**
     * Update current user's profile
     */
    async updateProfile(updates) {
      return request("/users/me", {
        method: "PATCH",
        body: updates,
      });
    },

    /**
     * Follow a user
     */
    async follow(userId) {
      return request(`/users/${encodeURIComponent(userId)}/follow`, {
        method: "POST",
      });
    },

    /**
     * Unfollow a user
     */
    async unfollow(userId) {
      return request(`/users/${encodeURIComponent(userId)}/follow`, {
        method: "DELETE",
      });
    },

    /**
     * Get followers of a user
     */
    async getFollowers(userId, page = 1, limit = 20) {
      return request(`/users/${encodeURIComponent(userId)}/followers?page=${page}&limit=${limit}`);
    },

    /**
     * Get users that a user is following
     */
    async getFollowing(userId, page = 1, limit = 20) {
      return request(`/users/${encodeURIComponent(userId)}/following?page=${page}&limit=${limit}`);
    },

    /**
     * Block a user
     */
    async block(userId) {
      return request(`/users/${encodeURIComponent(userId)}/block`, {
        method: "POST",
      });
    },

    /**
     * Unblock a user
     */
    async unblock(userId) {
      return request(`/users/${encodeURIComponent(userId)}/block`, {
        method: "DELETE",
      });
    },

    /**
     * Mute a user
     */
    async mute(userId) {
      return request(`/users/${encodeURIComponent(userId)}/mute`, {
        method: "POST",
      });
    },

    /**
     * Unmute a user
     */
    async unmute(userId) {
      return request(`/users/${encodeURIComponent(userId)}/mute`, {
        method: "DELETE",
      });
    },

    /**
     * Get suggested users to follow
     */
    async getSuggestions(limit = 5) {
      return request(`/users/suggestions?limit=${limit}`);
    },

    /**
     * Search for users
     */
    async search(query, page = 1, limit = 20) {
      return request(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    },
  };

  // ==================== Gads API ====================

  const gads = {
    /**
     * Create a new gad
     */
    async create(content, options = {}) {
      return request("/gads", {
        method: "POST",
        body: { content, ...options },
      });
    },

    /**
     * Get a single gad by ID
     */
    async get(gadId) {
      return request(`/gads/${encodeURIComponent(gadId)}`);
    },

    /**
     * Delete a gad
     */
    async delete(gadId) {
      return request(`/gads/${encodeURIComponent(gadId)}`, {
        method: "DELETE",
      });
    },

    /**
     * Get home timeline (gads from followed users)
     */
    async getTimeline(page = 1, limit = 20) {
      return request(`/gads/timeline?page=${page}&limit=${limit}`);
    },

    /**
     * Get for-you feed (all gads)
     */
    async getForYou(page = 1, limit = 20) {
      return request(`/gads/foryou?page=${page}&limit=${limit}`);
    },

    /**
     * Get gads by a specific user
     */
    async getByUser(userId, page = 1, limit = 20) {
      return request(`/users/${encodeURIComponent(userId)}/gads?page=${page}&limit=${limit}`);
    },

    /**
     * Like a gad
     */
    async like(gadId) {
      return request(`/gads/${encodeURIComponent(gadId)}/like`, {
        method: "POST",
      });
    },

    /**
     * Unlike a gad
     */
    async unlike(gadId) {
      return request(`/gads/${encodeURIComponent(gadId)}/like`, {
        method: "DELETE",
      });
    },

    /**
     * Regad (retweet) a gad
     */
    async regad(gadId, comment = "") {
      return request(`/gads/${encodeURIComponent(gadId)}/regad`, {
        method: "POST",
        body: { comment },
      });
    },

    /**
     * Remove regad
     */
    async unregad(gadId) {
      return request(`/gads/${encodeURIComponent(gadId)}/regad`, {
        method: "DELETE",
      });
    },

    /**
     * Reply to a gad
     */
    async reply(gadId, content) {
      return request(`/gads/${encodeURIComponent(gadId)}/reply`, {
        method: "POST",
        body: { content },
      });
    },

    /**
     * Get replies to a gad
     */
    async getReplies(gadId, page = 1, limit = 20) {
      return request(`/gads/${encodeURIComponent(gadId)}/replies?page=${page}&limit=${limit}`);
    },

    /**
     * Bookmark a gad
     */
    async bookmark(gadId) {
      return request(`/gads/${encodeURIComponent(gadId)}/bookmark`, {
        method: "POST",
      });
    },

    /**
     * Remove bookmark
     */
    async unbookmark(gadId) {
      return request(`/gads/${encodeURIComponent(gadId)}/bookmark`, {
        method: "DELETE",
      });
    },

    /**
     * Get user's bookmarks
     */
    async getBookmarks(page = 1, limit = 20) {
      return request(`/bookmarks?page=${page}&limit=${limit}`);
    },

    /**
     * Search gads
     */
    async search(query, page = 1, limit = 20) {
      return request(`/gads/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    },
  };

  // ==================== Notifications API ====================

  const notifications = {
    /**
     * Get notifications
     */
    async get(page = 1, limit = 20) {
      return request(`/notifications?page=${page}&limit=${limit}`);
    },

    /**
     * Get unread count
     */
    async getUnreadCount() {
      return request("/notifications/unread/count");
    },

    /**
     * Mark notification as read
     */
    async markRead(notificationId) {
      return request(`/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: "POST",
      });
    },

    /**
     * Mark all notifications as read
     */
    async markAllRead() {
      return request("/notifications/read-all", {
        method: "POST",
      });
    },
  };

  // ==================== Hashtags API ====================

  const hashtags = {
    /**
     * Get trending hashtags
     */
    async getTrending(limit = 10) {
      return request(`/hashtags/trending?limit=${limit}`);
    },

    /**
     * Get gads by hashtag
     */
    async getGads(hashtag, page = 1, limit = 20) {
      return request(`/hashtags/${encodeURIComponent(hashtag)}?page=${page}&limit=${limit}`);
    },
  };

  // ==================== Admin API ====================

  const admin = {
    /**
     * Reset database
     */
    async resetDatabase(mode = "init") {
      return request(`/admin/reset?mode=${mode}`, {
        method: "POST",
      });
    },

    /**
     * Get stats
     */
    async getStats() {
      return request("/admin/stats");
    },
  };

  // Public API
  return {
    auth,
    users,
    gads,
    notifications,
    hashtags,
    admin,
    getToken,
    setToken,
    clearToken,
  };
})();

// Export for use in other scripts
window.GadTalkAPI = GadTalkAPI;
