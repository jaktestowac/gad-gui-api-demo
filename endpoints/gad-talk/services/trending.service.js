/**
 * GadTalk Trending Service
 * Handles trending hashtags, topics, and explore page content
 */

const { readGadTalkDb, getFollowing, hasBlocked, isGadVisibleToUser } = require("../db-gad-talk.operations");
const { areIdsEqual } = require("../../../helpers/compare.helpers");

/**
 * Time windows for trending calculation
 */
const TRENDING_WINDOWS = {
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Get trending hashtags
 * @param {Object} options - Options
 * @param {number} options.limit - Number of hashtags to return
 * @param {string} options.window - Time window: 'hour', 'day', 'week'
 * @returns {Array} Trending hashtags
 */
function getTrendingHashtags(options = {}) {
  const { limit = 10, window = "day" } = options;

  const db = readGadTalkDb();
  const now = new Date();
  const windowMs = TRENDING_WINDOWS[window.toUpperCase()] || TRENDING_WINDOWS.DAY;
  const cutoff = new Date(now.getTime() - windowMs);

  // Calculate hashtag scores based on recent usage
  const hashtagScores = {};

  db.gads.forEach((gad) => {
    if (gad.deleted) return;
    if (!gad.hashtags || gad.hashtags.length === 0) return;

    const gadDate = new Date(gad.createdAt);
    if (gadDate < cutoff) return;

    // Score based on recency and engagement
    const ageHours = (now - gadDate) / (1000 * 60 * 60);
    const recencyBoost = Math.max(0, 1 - ageHours / (windowMs / (1000 * 60 * 60)));
    const engagementScore = (gad.likeCount || 0) + (gad.replyCount || 0) * 2 + (gad.regadCount || 0) * 3;
    const gadScore = 1 + recencyBoost + engagementScore * 0.1;

    gad.hashtags.forEach((tag) => {
      if (!hashtagScores[tag]) {
        hashtagScores[tag] = { tag, count: 0, score: 0 };
      }
      hashtagScores[tag].count++;
      hashtagScores[tag].score += gadScore;
    });
  });

  // Sort by score and return top hashtags
  return Object.values(hashtagScores)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((h, index) => ({
      ...h,
      rank: index + 1,
      trendingScore: Math.round(h.score * 100) / 100,
    }));
}

/**
 * Get suggested users to follow
 * @param {string|null} userId - Current user ID
 * @param {Object} options - Options
 * @returns {Array} Suggested users
 */
function getSuggestedUsers(userId, options = {}) {
  const { limit = 5, excludeFollowing = true } = options;

  const db = readGadTalkDb();

  // Get users current user is following
  let followingIds = [];
  if (userId && excludeFollowing) {
    const following = getFollowing(userId);
    followingIds = following.map((f) => f.followingId);
  }

  // Score users for suggestions
  const scoredUsers = db.users
    .filter((u) => {
      // Exclude self
      if (userId && areIdsEqual(u.id, userId)) return false;
      // Exclude already following
      if (followingIds.some((fid) => areIdsEqual(fid, u.id))) return false;
      // Exclude shadow banned
      if (u.shadowBanned) return false;
      // Exclude blocked users
      if (userId && hasBlocked(userId, u.id)) return false;
      return true;
    })
    .map((u) => {
      // Calculate suggestion score
      let score = 0;

      // More followers = more relevant
      score += (u.followersCount || 0) * 2;

      // Active users (recent posts) score higher
      const userGads = db.gads.filter((g) => areIdsEqual(g.userId, u.id) && !g.deleted);
      const recentGads = userGads.filter((g) => {
        const date = new Date(g.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return date > weekAgo;
      });
      score += recentGads.length * 5;

      // Total engagement on their posts
      const engagement = userGads.reduce((sum, g) => {
        return sum + (g.likeCount || 0) + (g.replyCount || 0) + (g.regadCount || 0);
      }, 0);
      score += engagement * 0.5;

      // Verified users get a boost
      if (u.verified) score += 50;

      // Users with complete profiles score higher
      if (u.bio) score += 10;
      if (u.avatar) score += 10;
      if (u.website) score += 5;

      return { ...u, suggestionScore: score };
    })
    .sort((a, b) => b.suggestionScore - a.suggestionScore)
    .slice(0, limit);

  return scoredUsers;
}

/**
 * Get popular gads for explore page
 * @param {string|null} userId - Current user ID
 * @param {Object} options - Options
 * @returns {Object} { gads, total, hasMore }
 */
function getPopularGads(userId, options = {}) {
  const { page = 1, limit = 20, window = "day" } = options;

  const db = readGadTalkDb();
  const now = new Date();
  const windowMs = TRENDING_WINDOWS[window.toUpperCase()] || TRENDING_WINDOWS.DAY;
  const cutoff = new Date(now.getTime() - windowMs);

  // Get following IDs for visibility
  let followingIds = [];
  if (userId) {
    const following = getFollowing(userId);
    followingIds = following.map((f) => f.followingId);
  }

  let gads = db.gads
    .filter((g) => {
      if (g.deleted) return false;
      if (!isGadVisibleToUser(g, userId, followingIds)) return false;

      // Exclude blocked users
      if (userId && !areIdsEqual(g.userId, userId)) {
        if (hasBlocked(userId, g.userId)) return false;
      }

      // Must be within time window
      const gadDate = new Date(g.createdAt);
      if (gadDate < cutoff) return false;

      return true;
    })
    .map((g) => {
      // Calculate popularity score
      const gadDate = new Date(g.createdAt);
      const ageHours = (now - gadDate) / (1000 * 60 * 60);
      const recencyBoost = Math.max(0.5, 1 - ageHours / 24);

      const engagement = (g.likeCount || 0) + (g.replyCount || 0) * 2 + (g.regadCount || 0) * 3;
      const popularityScore = engagement * recencyBoost;

      return { ...g, popularityScore };
    })
    .sort((a, b) => b.popularityScore - a.popularityScore);

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
 * Get explore page data (combined trending/suggested content)
 * @param {string|null} userId - Current user ID
 * @param {Object} options - Options
 * @returns {Object} { trending, suggestedUsers, popularGads }
 */
function getExploreData(userId, options = {}) {
  const { trendingLimit = 10, suggestionsLimit = 5, gadsLimit = 10 } = options;

  return {
    trending: getTrendingHashtags({ limit: trendingLimit }),
    suggestedUsers: getSuggestedUsers(userId, { limit: suggestionsLimit }),
    popularGads: getPopularGads(userId, { limit: gadsLimit }),
  };
}

/**
 * Get topics/categories for explore (based on hashtag clustering)
 * @param {Object} options - Options
 * @returns {Array} Topics
 */
function getExploreTopics(options = {}) {
  const { limit = 5 } = options;

  // Predefined topic categories
  const categories = [
    { id: "testing", name: "Testing", hashtags: ["testing", "qa", "qualityassurance", "tester"] },
    { id: "automation", name: "Automation", hashtags: ["automation", "selenium", "playwright", "cypress"] },
    { id: "development", name: "Development", hashtags: ["dev", "coding", "programming", "developer"] },
    { id: "devops", name: "DevOps", hashtags: ["devops", "cicd", "docker", "kubernetes"] },
    { id: "learning", name: "Learning", hashtags: ["learning", "tutorial", "tips", "beginner"] },
  ];

  const db = readGadTalkDb();

  return categories.slice(0, limit).map((category) => {
    // Count total gads in this category
    const gadCount = db.gads.filter((g) => {
      if (g.deleted) return false;
      if (!g.hashtags) return false;
      return g.hashtags.some((h) => category.hashtags.includes(h.toLowerCase()));
    }).length;

    return {
      ...category,
      gadCount,
    };
  });
}

module.exports = {
  TRENDING_WINDOWS,
  getTrendingHashtags,
  getSuggestedUsers,
  getPopularGads,
  getExploreData,
  getExploreTopics,
};
