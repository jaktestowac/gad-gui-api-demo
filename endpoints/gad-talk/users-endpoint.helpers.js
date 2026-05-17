const { logError, logDebug } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");
const fs = require("fs");
const path = require("path");
const PUBLIC_DATA_USERS_DIR = path.join(__dirname, "..", "..", "public", "data", "users");
const {
  HTTP_OK,
  HTTP_NOT_FOUND,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_FORBIDDEN,
} = require("../../helpers/response.helpers");
const {
  findGadTalkUserById,
  findGadTalkUserByUsername,
  updateGadTalkUserProfile,
  getGadTalkUserStats,
  getUserBadges,
  gadTalkUsersDb,
  getFollowers,
  getFollowing,
  createFollow,
  deleteFollow,
  isFollowing,
  getBlockedUserIds,
  getBlockedByUserIds,
  createBlock,
  deleteBlock,
  hasBlocked,
  getMutedUserIds,
  createMute,
  deleteMute,
  hasMuted,
  searchUsers,
  isFeatureEnabled,
} = require("./db-gad-talk.operations");
const { verifyGadTalkToken } = require("./services/auth.service");
const gadTalkConfig = require("./gad-talk-config");

// ==================== HELPERS ====================

function clampNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function toTimestamp(value) {
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : ts;
}

function getRecencyBoost(dateValue) {
  const ts = toTimestamp(dateValue);
  if (!ts) return 0;
  const daysAgo = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  if (daysAgo <= 1) return 15;
  if (daysAgo <= 7) return 8;
  if (daysAgo <= 30) return 3;
  return 0;
}

function computeSuggestionScore(user, stats, context) {
  if (!user) return -Infinity;

  const popularityScore =
    (stats.followersCount || 0) * 2 + (stats.gadsCount || 0) + Math.round((stats.likesCount || 0) * 0.5);
  const activityScore = getRecencyBoost(user.lastLoginAt) + getRecencyBoost(user.createdAt);
  const networkScore = (context.followedByCount.get(user.id) || 0) * 20 + (context.followersOfMe.has(user.id) ? 30 : 0);

  let score = 0;
  if (context.mode === "network") {
    score = networkScore * 1.4 + popularityScore * 0.3 + activityScore * 0.3;
  } else if (context.mode === "popular") {
    score = popularityScore * 1.2 + activityScore * 0.4;
  } else {
    score = popularityScore * 0.6 + activityScore * 0.6 + networkScore * 1.0;
  }

  if (user.role === "admin") score += 20;

  return score + Math.random();
}

/**
 * Get authenticated user from request
 * @param {object} req - Express request
 * @returns {object|null} User object or null
 */
function getAuthenticatedUser(req) {
  let token = req.cookies[gadTalkConfig.auth.tokenCookieName];

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const decoded = verifyGadTalkToken(token);
  if (!decoded) return null;

  return findGadTalkUserById(decoded.userId);
}

/**
 * Sanitize user object for response (remove sensitive fields)
 * @param {object} user - User object
 * @returns {object} Sanitized user
 */
function sanitizeUser(user) {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...sanitized } = user;

  // Ensure avatar path is constrained to /data/users/
  if (sanitized.avatar) {
    try {
      const normalized = sanitized.avatar.replace(/\\/g, "/");
      // Accept external http(s) links
      if (/^https?:\/\//i.test(normalized)) {
        sanitized.avatar = normalized;
      } else {
        const baseName = path.basename(normalized);
        if (baseName) {
          const publicPath = `/data/users/${baseName}`;
          const filePath = path.join(PUBLIC_DATA_USERS_DIR, baseName);
          if (fs.existsSync(filePath)) {
            sanitized.avatar = publicPath;
          } else {
            sanitized.avatar = null;
          }
        } else {
          sanitized.avatar = null;
        }
      }
    } catch (e) {
      sanitized.avatar = null;
    }
  }
  return sanitized;
}

// ==================== USER HANDLERS ====================

/**
 * Get user by ID
 * GET /api/gad-talk/users/:id
 */
async function handleGetUser(req, res) {
  try {
    const { id } = req.params;

    const user = findGadTalkUserById(id);
    if (!user) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    logError("[GadTalk] Get user error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get user"));
  }
}

/**
 * Get user by username
 * GET /api/gad-talk/users/username/:username
 */
async function handleGetUserByUsername(req, res) {
  try {
    const { username } = req.params;

    const user = findGadTalkUserByUsername(username);
    if (!user) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
      return;
    }

    // Get stats
    const stats = getGadTalkUserStats(user.id);

    // Check relationship status
    const authUser = getAuthenticatedUser(req);
    const isFollowingUser = authUser ? isFollowing(authUser.id, user.id) : false;
    const isOwnProfile = authUser ? authUser.id === user.id : false;
    const isBlockedUser = authUser && !isOwnProfile ? hasBlocked(authUser.id, user.id) : false;
    const isMutedUser = authUser && !isOwnProfile ? hasMuted(authUser.id, user.id) : false;

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        ...sanitizeUser(user),
        ...stats,
        isFollowing: isFollowingUser,
        isOwnProfile,
        isBlocked: isBlockedUser,
        isMuted: isMutedUser,
      },
    });
  } catch (error) {
    logError("[GadTalk] Get user by username error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get user"));
  }
}

/**
 * Search users by username or display name
 * GET /api/gad-talk/users/search?q=query&page=1&limit=20
 */
async function handleSearchUsers(req, res) {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(HTTP_OK).json({
        users: [],
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        hasMore: false,
      });
    }

    // Get current user if authenticated (to exclude from results)
    const authUser = getAuthenticatedUser(req);
    const currentUserId = authUser ? authUser.id : null;

    const blockedUserIds = currentUserId ? getBlockedUserIds(currentUserId) : [];
    const blockedByUserIds = currentUserId ? getBlockedByUserIds(currentUserId) : [];

    const { users, total } = searchUsers(query.trim(), parseInt(page), parseInt(limit), {
      currentUserId,
      blockedUserIds,
      blockedByUserIds,
    });

    // Sanitize user data and add isFollowing info
    const sanitizedUsers = users.map((user) => {
      const sanitized = sanitizeUser(user);
      if (authUser) {
        sanitized.isFollowing = isFollowing(authUser.id, user.id);
      }
      return sanitized;
    });

    res.status(HTTP_OK).json({
      users: sanitizedUsers,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    logError("[GadTalk] Search users error:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse(error.message || "Failed to search users"));
  }
}

/**
 * Check username availability
 * GET /api/gad-talk/users/available/:username
 */
async function handleCheckUsernameAvailability(req, res) {
  try {
    const username = req.params?.username || req.query?.username;
    if (!username) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username is required"));
      return;
    }

    // Validate username format using auth service validator
    const { validateUsername } = require("./services/auth.service");
    const validation = validateUsername(username);
    if (!validation.valid) {
      // Use 422 Unprocessable Entity
      const { HTTP_UNPROCESSABLE_ENTITY } = require("../../helpers/response.helpers");
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse(validation.error));
      return;
    }

    const existing = findGadTalkUserByUsername(username);
    res.status(HTTP_OK).json({ available: !existing });
  } catch (error) {
    logError("[GadTalk] Check username availability error:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse(error.message || "Failed to check username"));
  }
}

/**
 * Get user profile with stats
 * GET /api/gad-talk/users/:id/profile
 */
async function handleGetUserProfile(req, res) {
  try {
    const { id } = req.params;

    const user = findGadTalkUserById(id);
    if (!user) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
      return;
    }

    const stats = getGadTalkUserStats(id);

    // Check if authenticated user is following this user
    const authUser = getAuthenticatedUser(req);
    const isFollowingUser = authUser ? isFollowing(authUser.id, id) : false;
    const isOwnProfile = authUser ? authUser.id === id : false;
    const isBlockedUser = authUser && !isOwnProfile ? hasBlocked(authUser.id, id) : false;
    const isMutedUser = authUser && !isOwnProfile ? hasMuted(authUser.id, id) : false;

    // Get badges if feature is enabled
    const badgesEnabled = isFeatureEnabled("profile_badges");
    const badges = badgesEnabled ? getUserBadges(id) : [];

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        ...sanitizeUser(user),
        stats,
        badges,
        isFollowing: isFollowingUser,
        isOwnProfile,
        isBlocked: isBlockedUser,
        isMuted: isMutedUser,
      },
    });
  } catch (error) {
    logError("[GadTalk] Get user profile error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get user profile"));
  }
}

/**
 * Update user profile
 * PUT /api/gad-talk/users/:id/profile
 */
async function handleUpdateProfile(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check authentication
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    // Can only update own profile (unless admin)
    if (authUser.id !== id && authUser.role !== "admin") {
      res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Cannot update another user's profile"));
      return;
    }

    // Validate updates
    const { displayNameMaxLength, bioMaxLength, websiteMaxLength, locationMaxLength } = gadTalkConfig.profile;

    if (updates.displayName && updates.displayName.length > displayNameMaxLength) {
      res
        .status(HTTP_BAD_REQUEST)
        .send(formatErrorResponse(`Display name must not exceed ${displayNameMaxLength} characters`));
      return;
    }

    if (updates.bio && updates.bio.length > bioMaxLength) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(`Bio must not exceed ${bioMaxLength} characters`));
      return;
    }

    if (updates.website && updates.website.length > websiteMaxLength) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(`Website must not exceed ${websiteMaxLength} characters`));
      return;
    }

    if (updates.location && updates.location.length > locationMaxLength) {
      res
        .status(HTTP_BAD_REQUEST)
        .send(formatErrorResponse(`Location must not exceed ${locationMaxLength} characters`));
      return;
    }

    const updatedUser = await updateGadTalkUserProfile(id, updates);

    res.status(HTTP_OK).send({
      ok: true,
      data: sanitizeUser(updatedUser),
    });
  } catch (error) {
    logError("[GadTalk] Update profile error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to update profile"));
  }
}

/**
 * Get user stats
 * GET /api/gad-talk/users/:id/stats
 */
async function handleGetUserStats(req, res) {
  try {
    const { id } = req.params;

    const user = findGadTalkUserById(id);
    if (!user) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
      return;
    }

    const stats = getGadTalkUserStats(id);

    res.status(HTTP_OK).send({
      ok: true,
      data: stats,
    });
  } catch (error) {
    logError("[GadTalk] Get user stats error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get user stats"));
  }
}

/**
 * Upload avatar (placeholder - would need file upload handling)
 * POST /api/gad-talk/users/:id/avatar
 */
async function handleUploadAvatar(req, res) {
  try {
    const { id } = req.params;

    // Check authentication
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    if (authUser.id !== id && authUser.role !== "admin") {
      res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Cannot update another user's avatar"));
      return;
    }

    // For now, just return a placeholder response
    // In a real implementation, you would handle file upload here
    res.status(HTTP_OK).send({
      ok: true,
      data: {
        message: "Avatar upload placeholder - file upload handling would be implemented here",
        avatarUrl: `/data/users/${id}.jpg`,
      },
    });
  } catch (error) {
    logError("[GadTalk] Upload avatar error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to upload avatar"));
  }
}

/**
 * Upload header (placeholder)
 * POST /api/gad-talk/users/:id/header
 */
async function handleUploadHeader(req, res) {
  try {
    const { id } = req.params;

    // Check authentication
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    if (authUser.id !== id && authUser.role !== "admin") {
      res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Cannot update another user's header"));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        message: "Header upload placeholder - file upload handling would be implemented here",
        headerUrl: `/uploads/headers/${id}.jpg`,
      },
    });
  } catch (error) {
    logError("[GadTalk] Upload header error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to upload header"));
  }
}

/**
 * Get avatar gallery files from /public/data/users
 * GET /api/gad-talk/users/gallery
 */
async function handleGetAvatarGallery(req, res) {
  try {
    const files = [];
    try {
      const names = fs.readdirSync(PUBLIC_DATA_USERS_DIR);
      names.sort();
      for (const name of names) {
        if (typeof name !== "string") continue;
        const lower = name.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".gif")) {
          files.push(`/data/users/${name}`);
        }
      }
    } catch (error) {
      // ignore directory read errors and return empty list
      logDebug("[GadTalk] Avatar gallery read error", { error });
    }

    res.status(HTTP_OK).json({ files });
  } catch (error) {
    logError("[GadTalk] Avatar gallery error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to list avatar gallery"));
  }
}

// ==================== FOLLOW HANDLERS ====================

/**
 * Follow a user
 * POST /api/gad-talk/users/:id/follow
 */
async function handleFollow(req, res) {
  try {
    const { id } = req.params;

    // Check authentication
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    // Can't follow yourself
    if (authUser.id === id) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Cannot follow yourself"));
      return;
    }

    // Check if user exists
    const targetUser = findGadTalkUserById(id);
    if (!targetUser) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
      return;
    }

    // Block checks
    if (hasBlocked(authUser.id, id)) {
      res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Cannot follow a user you have blocked"));
      return;
    }

    if (hasBlocked(id, authUser.id)) {
      res.status(HTTP_FORBIDDEN).send(formatErrorResponse("Cannot follow this user"));
      return;
    }

    const follow = await createFollow(authUser.id, id);

    logDebug("[GadTalk] User followed:", { followerId: authUser.id, followingId: id });

    res.status(HTTP_OK).send({
      ok: true,
      data: follow,
    });
  } catch (error) {
    logError("[GadTalk] Follow error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to follow user"));
  }
}

/**
 * Unfollow a user
 * DELETE /api/gad-talk/users/:id/follow
 */
async function handleUnfollow(req, res) {
  try {
    const { id } = req.params;

    // Check authentication
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    await deleteFollow(authUser.id, id);

    logDebug("[GadTalk] User unfollowed:", { followerId: authUser.id, followingId: id });

    res.status(HTTP_OK).send({
      ok: true,
      data: { message: "Unfollowed successfully" },
    });
  } catch (error) {
    logError("[GadTalk] Unfollow error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to unfollow user"));
  }
}

/**
 * Get user's followers
 * GET /api/gad-talk/users/:id/followers
 */
async function handleGetFollowers(req, res) {
  try {
    const { id } = req.params;
    const { limit = 20, cursor } = req.query;

    const user = findGadTalkUserById(id);
    if (!user) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
      return;
    }

    let followers = getFollowers(id);

    const authUser = getAuthenticatedUser(req);

    // Sort by createdAt desc
    followers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply cursor pagination
    if (cursor) {
      const cursorIndex = followers.findIndex((f) => f.id === cursor);
      if (cursorIndex >= 0) {
        followers = followers.slice(cursorIndex + 1);
      }
    }

    // Apply limit
    const limitNum = parseInt(limit, 10);
    const hasMore = followers.length > limitNum;
    followers = followers.slice(0, limitNum);

    // Get follower user details
    const followerUsers = followers
      .map((f) => {
        const followerUser = findGadTalkUserById(f.followerId);
        if (!followerUser) return null;

        if (authUser) {
          if (hasBlocked(authUser.id, followerUser.id) || hasBlocked(followerUser.id, authUser.id)) {
            return null;
          }
        }

        const sanitized = sanitizeUser(followerUser);
        if (authUser) {
          sanitized.isFollowing = isFollowing(authUser.id, followerUser.id);
          sanitized.isFollower = isFollowing(followerUser.id, authUser.id);
        }

        return {
          ...f,
          user: sanitized,
        };
      })
      .filter(Boolean);

    res.status(HTTP_OK).json({
      followers: followerUsers,
      hasMore,
      nextCursor: hasMore && followers.length > 0 ? followers[followers.length - 1].id : null,
    });
  } catch (error) {
    logError("[GadTalk] Get followers error:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse(error.message || "Failed to get followers"));
  }
}

/**
 * Get users that user is following
 * GET /api/gad-talk/users/:id/following
 */
async function handleGetFollowing(req, res) {
  try {
    const { id } = req.params;
    const { limit = 20, cursor } = req.query;

    const user = findGadTalkUserById(id);
    if (!user) {
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
      return;
    }

    let following = getFollowing(id);

    const authUser = getAuthenticatedUser(req);

    // Sort by createdAt desc
    following.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply cursor pagination
    if (cursor) {
      const cursorIndex = following.findIndex((f) => f.id === cursor);
      if (cursorIndex >= 0) {
        following = following.slice(cursorIndex + 1);
      }
    }

    // Apply limit
    const limitNum = parseInt(limit, 10);
    const hasMore = following.length > limitNum;
    following = following.slice(0, limitNum);

    // Get following user details
    const followingUsers = following
      .map((f) => {
        const followingUser = findGadTalkUserById(f.followingId);
        if (!followingUser) return null;

        if (authUser) {
          if (hasBlocked(authUser.id, followingUser.id) || hasBlocked(followingUser.id, authUser.id)) {
            return null;
          }
        }

        const sanitized = sanitizeUser(followingUser);
        if (authUser) {
          sanitized.isFollowing = isFollowing(authUser.id, followingUser.id);
          sanitized.isFollower = isFollowing(followingUser.id, authUser.id);
        }

        return {
          ...f,
          user: sanitized,
        };
      })
      .filter(Boolean);

    res.status(HTTP_OK).json({
      following: followingUsers,
      hasMore,
      nextCursor: hasMore && following.length > 0 ? following[following.length - 1].id : null,
    });
  } catch (error) {
    logError("[GadTalk] Get following error:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse(error.message || "Failed to get following"));
  }
}

/**
 * Get follow suggestions
 * GET /api/gad-talk/users/suggestions
 */
async function handleGetSuggestions(req, res) {
  try {
    const { limit = 5, mode = "discover", includeFollowed = "false", includeStats = "false" } = req.query;
    const limitNum = clampNumber(limit, 1, 50, 5);
    const suggestionMode = String(mode || "discover").toLowerCase();
    const allowFollowed = String(includeFollowed).toLowerCase() === "true";
    const shouldIncludeStats = String(includeStats).toLowerCase() === "true";

    // Check authentication
    const authUser = getAuthenticatedUser(req);

    // Get all users
    const allUsers = gadTalkUsersDb();

    const followingIds = authUser ? new Set(getFollowing(authUser.id).map((f) => f.followingId)) : new Set();
    const followersOfMe = authUser ? new Set(getFollowers(authUser.id).map((f) => f.followerId)) : new Set();
    const blockedUserIds = authUser ? new Set(getBlockedUserIds(authUser.id)) : new Set();
    const blockedByUserIds = authUser ? new Set(getBlockedByUserIds(authUser.id)) : new Set();
    const mutedUserIds = authUser ? new Set(getMutedUserIds(authUser.id)) : new Set();

    const followedByCount = new Map();
    if (authUser && followingIds.size > 0) {
      for (const followingId of followingIds) {
        const secondDegree = getFollowing(followingId);
        for (const follow of secondDegree) {
          if (!follow?.followingId) continue;
          followedByCount.set(follow.followingId, (followedByCount.get(follow.followingId) || 0) + 1);
        }
      }
    }

    // Filter out current user and shadow banned/blocked users
    let suggestions = allUsers.filter((u) => {
      if (!u) return false;
      if (authUser && u.id === authUser.id) return false;
      if (u.shadowBanned) return false;
      if (authUser && (blockedUserIds.has(u.id) || blockedByUserIds.has(u.id))) return false;
      if (authUser && mutedUserIds.has(u.id)) return false;
      if (!allowFollowed && authUser && followingIds.has(u.id)) return false;
      return true;
    });

    const context = {
      mode: ["discover", "network", "popular"].includes(suggestionMode) ? suggestionMode : "discover",
      followedByCount,
      followersOfMe,
    };

    suggestions = suggestions
      .map((user) => {
        const stats = getGadTalkUserStats(user.id);
        return {
          user,
          stats,
          score: computeSuggestionScore(user, stats, context),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limitNum);

    res.status(HTTP_OK).json({
      users: suggestions.map(({ user, stats }) => {
        const sanitized = sanitizeUser(user);
        if (authUser) {
          sanitized.isFollowing = isFollowing(authUser.id, user.id);
        }
        if (shouldIncludeStats) {
          sanitized.stats = stats;
        }
        return sanitized;
      }),
      meta: {
        mode: context.mode,
        limit: limitNum,
        includeFollowed: allowFollowed,
      },
    });
  } catch (error) {
    logError("[GadTalk] Get suggestions error:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse(error.message || "Failed to get suggestions"));
  }
}

/**
 * Get follow recommendations (advanced suggestions)
 * GET /api/gad-talk/users/recommendations
 */
async function handleGetRecommendations(req, res) {
  return handleGetSuggestions(req, res);
}

// ==================== BLOCK/MUTE HANDLERS ====================

/**
 * Block a user
 * POST /api/gad-talk/users/:id/block
 */
async function handleBlock(req, res) {
  try {
    const { id } = req.params;

    // Check authentication
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    if (authUser.id === id) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Cannot block yourself"));
      return;
    }

    const block = await createBlock(authUser.id, id);

    res.status(HTTP_OK).send({
      ok: true,
      data: block,
    });
  } catch (error) {
    logError("[GadTalk] Block error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to block user"));
  }
}

/**
 * Unblock a user
 * DELETE /api/gad-talk/users/:id/block
 */
async function handleUnblock(req, res) {
  try {
    const { id } = req.params;

    // Check authentication
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    await deleteBlock(authUser.id, id);

    res.status(HTTP_OK).send({
      ok: true,
      data: { message: "Unblocked successfully" },
    });
  } catch (error) {
    logError("[GadTalk] Unblock error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to unblock user"));
  }
}

/**
 * Mute a user
 * POST /api/gad-talk/users/:id/mute
 */
async function handleMute(req, res) {
  try {
    const { id } = req.params;

    // Check authentication
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    if (authUser.id === id) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Cannot mute yourself"));
      return;
    }

    const mute = await createMute(authUser.id, id);

    res.status(HTTP_OK).send({
      ok: true,
      data: mute,
    });
  } catch (error) {
    logError("[GadTalk] Mute error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to mute user"));
  }
}

/**
 * Unmute a user
 * DELETE /api/gad-talk/users/:id/mute
 */
async function handleUnmute(req, res) {
  try {
    const { id } = req.params;

    // Check authentication
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    await deleteMute(authUser.id, id);

    res.status(HTTP_OK).send({
      ok: true,
      data: { message: "Unmuted successfully" },
    });
  } catch (error) {
    logError("[GadTalk] Unmute error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to unmute user"));
  }
}

// ==================== EXPORTS ====================

module.exports = {
  // User handlers
  handleGetUser,
  handleGetUserByUsername,
  handleGetUserProfile,
  handleUpdateProfile,
  handleGetUserStats,
  handleUploadAvatar,
  handleUploadHeader,
  handleGetAvatarGallery,
  handleSearchUsers,

  // Follow handlers
  handleFollow,
  handleUnfollow,
  handleGetFollowers,
  handleGetFollowing,
  handleGetSuggestions,
  handleGetRecommendations,

  // Block/Mute handlers
  handleBlock,
  handleUnblock,
  handleMute,
  handleUnmute,

  // Helpers (exported for use in other endpoints)
  getAuthenticatedUser,
  sanitizeUser,
};
