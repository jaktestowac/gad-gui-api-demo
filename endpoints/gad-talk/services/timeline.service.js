/**
 * GadTalk Timeline Service
 * Handles timeline generation, sorting, and filtering
 */

const { readGadTalkDb, isGadVisibleToUser, getFollowing, hasBlocked, hasMuted } = require("../db-gad-talk.operations");
const { areIdsEqual } = require("../../../helpers/compare.helpers");

/**
 * Sort types for timeline
 */
const SORT_TYPE = {
  LATEST: "latest", // Chronological, newest first
  TOP: "top", // By engagement (likes + reposts + replies)
  MEDIA: "media", // Only posts with images
};

/**
 * Get home timeline (posts from followed users)
 * @param {string} userId - Current user ID
 * @param {Object} options - Timeline options
 * @param {string} options.sort - Sort type: 'latest', 'top', 'media'
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.cursor - Cursor for pagination (last gad ID)
 * @returns {Object} { gads, total, hasMore, nextCursor }
 */
function getHomeTimeline(userId, options = {}) {
  const { sort = SORT_TYPE.LATEST, page = 1, limit = 20, cursor = null } = options;

  const db = readGadTalkDb();

  // Get following IDs
  const following = getFollowing(userId);
  const followingIds = following.map((f) => f.followingId);

  // Include user's own posts
  const userIdsForTimeline = [...followingIds, userId];

  // Filter gads
  let gads = db.gads.filter((g) => {
    // Skip deleted gads
    if (g.deleted) return false;

    // Must be from followed user or self
    if (!userIdsForTimeline.some((uid) => areIdsEqual(g.userId, uid))) return false;

    // Check visibility
    if (!isGadVisibleToUser(g, userId, followingIds)) return false;

    // Filter by media if needed
    if (sort === SORT_TYPE.MEDIA && !g.imageUrl) return false;

    // Check if author is blocked or muted by current user
    if (!areIdsEqual(g.userId, userId)) {
      if (hasBlocked(userId, g.userId)) return false;
      if (hasMuted(userId, g.userId)) return false;
    }

    return true;
  });

  // Sort gads
  gads = sortGads(gads, sort);

  // Apply cursor pagination if provided
  if (cursor) {
    const cursorIndex = gads.findIndex((g) => g.id === cursor);
    if (cursorIndex >= 0) {
      gads = gads.slice(cursorIndex + 1);
    }
  }

  const total = gads.length;
  const start = cursor ? 0 : (page - 1) * limit;
  const paginatedGads = gads.slice(start, start + limit);

  return {
    gads: paginatedGads,
    total,
    hasMore: start + limit < total,
    nextCursor: paginatedGads.length > 0 ? paginatedGads[paginatedGads.length - 1].id : null,
  };
}

/**
 * Get "For You" global timeline
 * @param {string|null} userId - Current user ID (optional)
 * @param {Object} options - Timeline options
 * @param {string} options.sort - Sort type: 'latest', 'top', 'media'
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @returns {Object} { gads, total, hasMore }
 */
function getForYouTimeline(userId, options = {}) {
  const { sort = SORT_TYPE.LATEST, page = 1, limit = 20 } = options;

  const db = readGadTalkDb();

  // Get following IDs for visibility filtering
  let followingIds = [];
  if (userId) {
    const following = getFollowing(userId);
    followingIds = following.map((f) => f.followingId);
  }

  // Filter gads
  let gads = db.gads.filter((g) => {
    if (g.deleted) return false;
    if (!isGadVisibleToUser(g, userId, followingIds)) return false;

    // Filter by media if needed
    if (sort === SORT_TYPE.MEDIA && !g.imageUrl) return false;

    // Check if author is blocked by current user
    if (userId && !areIdsEqual(g.userId, userId)) {
      if (hasBlocked(userId, g.userId)) return false;
    }

    return true;
  });

  // Sort gads
  gads = sortGads(gads, sort);

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
 * Get user timeline (posts from a specific user)
 * @param {string} targetUserId - User whose posts to get
 * @param {string|null} currentUserId - Current viewing user
 * @param {Object} options - Timeline options
 * @param {string} options.sort - Sort type
 * @param {string} options.filter - Filter: 'all', 'replies', 'media'
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @returns {Object} { gads, total, hasMore }
 */
function getUserTimeline(targetUserId, currentUserId, options = {}) {
  const { sort = SORT_TYPE.LATEST, filter = "all", page = 1, limit = 20 } = options;

  const db = readGadTalkDb();

  // Get following IDs for visibility
  let followingIds = [];
  if (currentUserId) {
    const following = getFollowing(currentUserId);
    followingIds = following.map((f) => f.followingId);
  }

  let gads = db.gads.filter((g) => {
    if (g.deleted) return false;
    if (!areIdsEqual(g.userId, targetUserId)) return false;
    if (!isGadVisibleToUser(g, currentUserId, followingIds)) return false;

    // Apply filter
    switch (filter) {
      case "replies":
        // Only replies
        if (!g.replyTo) return false;
        break;
      case "media":
        // Only posts with images
        if (!g.imageUrl) return false;
        break;
      case "all":
      default:
        // All posts (exclude replies for cleaner profile)
        // Optionally: if (!g.replyTo) return true;
        break;
    }

    return true;
  });

  gads = sortGads(gads, sort);

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
 * Get hashtag timeline
 * @param {string} hashtag - Hashtag to filter by
 * @param {string|null} userId - Current user ID
 * @param {Object} options - Timeline options
 * @returns {Object} { gads, total, hasMore, hashtagStats }
 */
function getHashtagTimeline(hashtag, userId, options = {}) {
  const { sort = SORT_TYPE.LATEST, page = 1, limit = 20 } = options;

  const db = readGadTalkDb();
  const lowerHashtag = hashtag.toLowerCase();

  // Get following IDs for visibility
  let followingIds = [];
  if (userId) {
    const following = getFollowing(userId);
    followingIds = following.map((f) => f.followingId);
  }

  let gads = db.gads.filter((g) => {
    if (g.deleted) return false;
    if (!g.hashtags || !g.hashtags.includes(lowerHashtag)) return false;
    if (!isGadVisibleToUser(g, userId, followingIds)) return false;

    // Filter blocked users
    if (userId && !areIdsEqual(g.userId, userId)) {
      if (hasBlocked(userId, g.userId)) return false;
    }

    return true;
  });

  gads = sortGads(gads, sort);

  // Get hashtag stats
  const hashtagData = db.hashtags.find((h) => h.tag.toLowerCase() === lowerHashtag);
  const hashtagStats = hashtagData || { tag: hashtag, count: gads.length };

  const total = gads.length;
  const start = (page - 1) * limit;
  const paginatedGads = gads.slice(start, start + limit);

  return {
    gads: paginatedGads,
    total,
    hasMore: start + limit < total,
    hashtagStats,
  };
}

/**
 * Sort gads by specified type
 * @param {Array} gads - Array of gads
 * @param {string} sortType - Sort type
 * @returns {Array} Sorted gads
 */
function sortGads(gads, sortType) {
  switch (sortType) {
    case SORT_TYPE.TOP:
      // Sort by engagement score (likes + reposts + replies)
      return gads.sort((a, b) => {
        const scoreA = (a.likeCount || 0) + (a.regadCount || 0) + (a.replyCount || 0);
        const scoreB = (b.likeCount || 0) + (b.regadCount || 0) + (b.replyCount || 0);
        // Secondary sort by date for ties
        if (scoreB === scoreA) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return scoreB - scoreA;
      });

    case SORT_TYPE.MEDIA:
    case SORT_TYPE.LATEST:
    default:
      // Sort by creation date, newest first
      return gads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

/**
 * Calculate engagement score for a gad
 * @param {Object} gad - Gad object
 * @returns {number} Engagement score
 */
function calculateEngagementScore(gad) {
  const likes = gad.likeCount || 0;
  const reposts = gad.regadCount || 0;
  const replies = gad.replyCount || 0;

  // Weight: reposts > replies > likes
  return likes * 1 + replies * 2 + reposts * 3;
}

module.exports = {
  SORT_TYPE,
  getHomeTimeline,
  getForYouTimeline,
  getUserTimeline,
  getHashtagTimeline,
  sortGads,
  calculateEngagementScore,
};
