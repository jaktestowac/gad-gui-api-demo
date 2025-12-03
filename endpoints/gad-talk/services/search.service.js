/**
 * GadTalk Search Service
 * Handles search functionality including autocomplete and suggestions
 */

const { readGadTalkDb, isGadVisibleToUser, getFollowing, hasBlocked } = require("../db-gad-talk.operations");
const { areIdsEqual, areStringsEqualIgnoringCase } = require("../../../helpers/compare.helpers");

/**
 * Search types
 */
const SEARCH_TYPE = {
  ALL: "all",
  USERS: "users",
  GADS: "gads",
  HASHTAGS: "hashtags",
};

/**
 * Combined search across all types
 * @param {string} query - Search query
 * @param {string|null} userId - Current user ID
 * @param {Object} options - Search options
 * @returns {Object} { users, gads, hashtags }
 */
function searchAll(query, userId, options = {}) {
  const { limit = 5 } = options;

  return {
    users: searchUsers(query, userId, { limit }).users,
    gads: searchGads(query, userId, { limit }).gads,
    hashtags: searchHashtags(query, { limit }).hashtags,
  };
}

/**
 * Search for users
 * @param {string} query - Search query
 * @param {string|null} userId - Current user ID (excluded from results)
 * @param {Object} options - Search options
 * @returns {Object} { users, total, hasMore }
 */
function searchUsers(query, userId, options = {}) {
  const { page = 1, limit = 20 } = options;

  const db = readGadTalkDb();
  const lowerQuery = query.toLowerCase().trim();

  // Handle @username queries
  const isUserQuery = lowerQuery.startsWith("@");
  const searchTerm = isUserQuery ? lowerQuery.slice(1) : lowerQuery;

  let users = db.users.filter((u) => {
    // Exclude current user
    if (userId && areIdsEqual(u.id, userId)) return false;

    // Exclude shadow banned users
    if (u.shadowBanned) return false;

    // Exclude blocked users
    if (userId && hasBlocked(userId, u.id)) return false;

    // Match username or display name
    const usernameMatch = u.username && u.username.toLowerCase().includes(searchTerm);
    const displayNameMatch = u.displayName && u.displayName.toLowerCase().includes(searchTerm);
    const bioMatch = !isUserQuery && u.bio && u.bio.toLowerCase().includes(searchTerm);

    return usernameMatch || displayNameMatch || bioMatch;
  });

  // Sort by relevance
  users = sortUsersByRelevance(users, searchTerm);

  const total = users.length;
  const start = (page - 1) * limit;
  const paginatedUsers = users.slice(start, start + limit);

  return {
    users: paginatedUsers,
    total,
    hasMore: start + limit < total,
  };
}

/**
 * Search for gads
 * @param {string} query - Search query
 * @param {string|null} userId - Current user ID
 * @param {Object} options - Search options
 * @returns {Object} { gads, total, hasMore }
 */
function searchGads(query, userId, options = {}) {
  const { page = 1, limit = 20 } = options;

  const db = readGadTalkDb();
  const lowerQuery = query.toLowerCase().trim();

  // Get following IDs for visibility
  let followingIds = [];
  if (userId) {
    const following = getFollowing(userId);
    followingIds = following.map((f) => f.followingId);
  }

  let gads = db.gads.filter((g) => {
    if (g.deleted) return false;
    if (!g.content || !g.content.toLowerCase().includes(lowerQuery)) return false;
    if (!isGadVisibleToUser(g, userId, followingIds)) return false;

    // Exclude blocked users
    if (userId && !areIdsEqual(g.userId, userId)) {
      if (hasBlocked(userId, g.userId)) return false;
    }

    return true;
  });

  // Sort by recency
  gads = gads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = gads.length;
  const start = (page - 1) * limit;
  const paginatedGads = gads.slice(start, start + limit);

  return {
    gads: paginatedGads,
    total,
    hasMore: start + limit < total,
  };
}

/**
 * Search for hashtags
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Object} { hashtags, total, hasMore }
 */
function searchHashtags(query, options = {}) {
  const { page = 1, limit = 20 } = options;

  const db = readGadTalkDb();
  const lowerQuery = query.toLowerCase().trim();

  // Handle #hashtag queries
  const searchTerm = lowerQuery.startsWith("#") ? lowerQuery.slice(1) : lowerQuery;

  let hashtags = db.hashtags.filter((h) => {
    return h.tag.toLowerCase().includes(searchTerm);
  });

  // Sort by usage count (popularity)
  hashtags = hashtags.sort((a, b) => (b.count || 0) - (a.count || 0));

  const total = hashtags.length;
  const start = (page - 1) * limit;
  const paginatedHashtags = hashtags.slice(start, start + limit);

  return {
    hashtags: paginatedHashtags,
    total,
    hasMore: start + limit < total,
  };
}

/**
 * Get autocomplete suggestions for search
 * @param {string} query - Search query (partial)
 * @param {string|null} userId - Current user ID
 * @param {Object} options - Options
 * @returns {Object} { suggestions: [] }
 */
function getSearchSuggestions(query, userId, options = {}) {
  const { limit = 8 } = options;

  if (!query || query.trim().length < 1) {
    return { suggestions: [] };
  }

  const trimmedQuery = query.trim();
  const db = readGadTalkDb();

  const suggestions = [];

  // Check if query starts with special characters
  if (trimmedQuery.startsWith("@")) {
    // User search
    const userTerm = trimmedQuery.slice(1).toLowerCase();
    const matchingUsers = db.users
      .filter((u) => {
        if (userId && areIdsEqual(u.id, userId)) return false;
        if (u.shadowBanned) return false;
        return u.username.toLowerCase().includes(userTerm);
      })
      .slice(0, limit)
      .map((u) => ({
        type: "user",
        value: `@${u.username}`,
        displayName: u.displayName || u.username,
        username: u.username,
        avatar: u.avatar,
      }));

    suggestions.push(...matchingUsers);
  } else if (trimmedQuery.startsWith("#")) {
    // Hashtag search
    const hashtagTerm = trimmedQuery.slice(1).toLowerCase();
    const matchingHashtags = db.hashtags
      .filter((h) => h.tag.toLowerCase().includes(hashtagTerm))
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, limit)
      .map((h) => ({
        type: "hashtag",
        value: `#${h.tag}`,
        count: h.count || 0,
      }));

    suggestions.push(...matchingHashtags);
  } else {
    // Mixed suggestions
    const lowerQuery = trimmedQuery.toLowerCase();

    // Add matching hashtags first (limited)
    const matchingHashtags = db.hashtags
      .filter((h) => h.tag.toLowerCase().includes(lowerQuery))
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 3)
      .map((h) => ({
        type: "hashtag",
        value: `#${h.tag}`,
        count: h.count || 0,
      }));

    suggestions.push(...matchingHashtags);

    // Add matching users
    const matchingUsers = db.users
      .filter((u) => {
        if (userId && areIdsEqual(u.id, userId)) return false;
        if (u.shadowBanned) return false;
        const usernameMatch = u.username.toLowerCase().includes(lowerQuery);
        const displayNameMatch = u.displayName && u.displayName.toLowerCase().includes(lowerQuery);
        return usernameMatch || displayNameMatch;
      })
      .slice(0, 3)
      .map((u) => ({
        type: "user",
        value: `@${u.username}`,
        displayName: u.displayName || u.username,
        username: u.username,
        avatar: u.avatar,
      }));

    suggestions.push(...matchingUsers);

    // Add text suggestion
    if (trimmedQuery.length >= 2) {
      suggestions.push({
        type: "query",
        value: trimmedQuery,
      });
    }
  }

  return { suggestions: suggestions.slice(0, limit) };
}

/**
 * Get recent search history (stored in frontend, this is for generating suggestions)
 * @param {Array} history - Array of recent search queries
 * @param {number} limit - Max items to return
 * @returns {Array} Formatted recent searches
 */
function formatRecentSearches(history, limit = 5) {
  return history.slice(0, limit).map((query) => ({
    type: "recent",
    value: query,
  }));
}

/**
 * Sort users by relevance to search term
 * @param {Array} users - Array of users
 * @param {string} searchTerm - Search term
 * @returns {Array} Sorted users
 */
function sortUsersByRelevance(users, searchTerm) {
  return users.sort((a, b) => {
    // Exact username match first
    const aExact = areStringsEqualIgnoringCase(a.username, searchTerm);
    const bExact = areStringsEqualIgnoringCase(b.username, searchTerm);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Username starts with search term
    const aStartsWith = a.username.toLowerCase().startsWith(searchTerm);
    const bStartsWith = b.username.toLowerCase().startsWith(searchTerm);
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;

    // By followers count (popularity)
    return (b.followersCount || 0) - (a.followersCount || 0);
  });
}

module.exports = {
  SEARCH_TYPE,
  searchAll,
  searchUsers,
  searchGads,
  searchHashtags,
  getSearchSuggestions,
  formatRecentSearches,
  sortUsersByRelevance,
};
