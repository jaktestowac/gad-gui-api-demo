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
        // data.error may be an object returned by formatErrorResponse({ error: { message, details }})
        // Prefer nested message if present and fall back to other string sources.
        const errorMessage =
          (data && data.error && (typeof data.error === "string" ? data.error : data.error.message)) ||
          data.message ||
          "Request failed";
        const error = new Error(errorMessage);
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
     * Get user by ID
     */
    async get(userId) {
      return request(`/users/${encodeURIComponent(userId)}`);
    },

    /**
     * Get user by username
     */
    async getByUsername(username) {
      return request(`/users/username/${encodeURIComponent(username)}`);
    },

    /**
     * Update current user's profile
     */
    async updateProfile(updates, userId) {
      // For GadTalk update profile, expect PUT /users/:id/profile
      if (!userId) {
        // Try to use 'me' as a fallback - but route doesn't support 'me/profile' so it's better to require userId
        throw new Error("updateProfile requires a userId for gad-talk API");
      }
      return request(`/users/${encodeURIComponent(userId)}/profile`, {
        method: "PUT",
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
     * @param {string} content - The gad content
     * @param {string|null} replyTo - ID of gad being replied to
     * @param {string|null} imageUrl - URL of attached image
     * @param {string|null} quotedGadId - ID of gad being quoted
     */
    async create(content, replyTo = null, imageUrl = null, quotedGadId = null) {
      const body = { content };
      if (replyTo) body.replyTo = replyTo;
      if (imageUrl) body.imageUrl = imageUrl;
      if (quotedGadId) body.quotedGadId = quotedGadId;

      return request("/gads", {
        method: "POST",
        body,
      });
    },

    /**
     * Get a single gad by ID
     */
    async get(gadId) {
      return request(`/gads/${encodeURIComponent(gadId)}`);
    },

    /**
     * Get a single gad by ID (alias)
     */
    async getById(gadId) {
      return request(`/gads/${encodeURIComponent(gadId)}`);
    },

    /**
     * Update a gad
     */
    async update(gadId, updates) {
      return request(`/gads/${encodeURIComponent(gadId)}`, {
        method: "PUT",
        body: updates,
      });
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
     * @param {number} page - Page number (for page-based pagination)
     * @param {number} limit - Items per page
     * @param {string} sort - Sort type: 'latest', 'top', 'media'
     * @param {string} cursor - Cursor for cursor-based pagination
     */
    async getTimeline(page = 1, limit = 20, sort = "latest", cursor = null) {
      let url = `/gads/timeline?page=${page}&limit=${limit}&sort=${sort}`;
      if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
      return request(url);
    },

    /**
     * Get for-you feed (all gads)
     * @param {number} page - Page number (for page-based pagination)
     * @param {number} limit - Items per page
     * @param {string} sort - Sort type: 'latest', 'top', 'media'
     * @param {string} cursor - Cursor for cursor-based pagination
     */
    async getForYou(page = 1, limit = 20, sort = "latest", cursor = null) {
      let url = `/gads/foryou?page=${page}&limit=${limit}&sort=${sort}`;
      if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
      return request(url);
    },

    /**
     * Get popular gads sorted by engagement
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     */
    async getPopular(page = 1, limit = 20) {
      return request(`/gads/popular?page=${page}&limit=${limit}`);
    },

    /**
     * Get trending hashtags (alias)
     * @param {number} limit - Number of hashtags
     */
    async getTrending(limit = 10) {
      return request(`/hashtags/trending?limit=${limit}`);
    },

    /**
     * Get gads by hashtag (alias)
     * @param {string} hashtag - Hashtag without #
     */
    async getByHashtag(hashtag, page = 1, limit = 20) {
      return request(`/hashtags/${encodeURIComponent(hashtag)}?page=${page}&limit=${limit}`);
    },

    /**
     * Get gads by a specific user
     */
    async getByUser(userId, page = 1, limit = 20) {
      return request(`/users/${encodeURIComponent(userId)}/gads?page=${page}&limit=${limit}`);
    },

    /**
     * Get replies by a specific user
     */
    async getUserReplies(userId, page = 1, limit = 20) {
      return request(`/users/${encodeURIComponent(userId)}/replies?page=${page}&limit=${limit}`);
    },

    /**
     * Get gads liked by a specific user
     */
    async getUserLikes(userId, page = 1, limit = 20) {
      return request(`/users/${encodeURIComponent(userId)}/likes?page=${page}&limit=${limit}`);
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
     * Get all notifications (alias for get)
     */
    async getAll(page = 1, limit = 20) {
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

  // ==================== Feature Flags API ====================

  const featureFlags = {
    /**
     * Get all feature flags
     */
    async getAll() {
      return request("/admin/feature-flags");
    },

    /**
     * Update feature flag
     */
    async update(flagKey, enabled) {
      return request(`/admin/feature-flags/${encodeURIComponent(flagKey)}`, {
        method: "PUT",
        body: { enabled },
      });
    },

    /**
     * Enable feature flag
     */
    async enable(flagKey) {
      return request(`/admin/feature-flags/${encodeURIComponent(flagKey)}/enable`, {
        method: "POST",
      });
    },

    /**
     * Disable feature flag
     */
    async disable(flagKey) {
      return request(`/admin/feature-flags/${encodeURIComponent(flagKey)}/disable`, {
        method: "POST",
      });
    },
  };

  // ==================== Search API ====================

  const search = {
    /**
     * Get search suggestions (autocomplete)
     */
    async getSuggestions(query, limit = 8) {
      return request(`/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
    },

    /**
     * Combined search for gads, users, and hashtags
     */
    async all(query, page = 1, limit = 20) {
      return request(`/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    },

    /**
     * Search gads only
     */
    async gads(query, page = 1, limit = 20) {
      return request(`/search/gads?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    },

    /**
     * Search users only
     */
    async users(query, page = 1, limit = 20) {
      return request(`/search/users?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    },
  };

  // ==================== Explore API ====================

  const explore = {
    /**
     * Get explore page data (trending content, popular users, etc.)
     */
    async getData() {
      return request("/explore");
    },

    /**
     * Get trending content
     */
    async getTrending(limit = 10) {
      return request(`/explore/trending?limit=${limit}`);
    },

    /**
     * Get popular gads
     */
    async getPopularGads(page = 1, limit = 20) {
      return request(`/explore/gads?page=${page}&limit=${limit}`);
    },

    /**
     * Get suggested users to follow
     */
    async getSuggestedUsers(limit = 10) {
      return request(`/explore/users?limit=${limit}`);
    },
  };

  // ==================== Analytics API ====================

  const analytics = {
    /**
     * Get activity heatmap data
     */
    async getActivityHeatmap(userId, days = 365) {
      return request(`/analytics/user/${encodeURIComponent(userId)}/activity-heatmap?days=${days}`);
    },

    /**
     * Get engagement timeline data
     */
    async getEngagementTimeline(userId, days = 30) {
      return request(`/analytics/user/${encodeURIComponent(userId)}/engagement-timeline?days=${days}`);
    },

    /**
     * Get follower growth data
     */
    async getFollowerGrowth(userId, weeks = 12) {
      return request(`/analytics/user/${encodeURIComponent(userId)}/follower-growth?weeks=${weeks}`);
    },

    /**
     * Get hashtag distribution data
     */
    async getHashtagDistribution(userId, limit = 8) {
      return request(`/analytics/user/${encodeURIComponent(userId)}/hashtag-distribution?limit=${limit}`);
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
    featureFlags,
    search,
    explore,
    analytics,
    getToken,
    setToken,
    clearToken,
  };
})();

// Export for use in other scripts
window.GadTalkAPI = GadTalkAPI;
