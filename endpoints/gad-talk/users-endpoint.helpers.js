const { logError, logDebug } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");
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
  gadTalkUsersDb,
  getFollowers,
  getFollowing,
  createFollow,
  deleteFollow,
  isFollowing,
  createBlock,
  deleteBlock,
  hasBlocked,
  createMute,
  deleteMute,
  hasMuted,
  searchUsers,
} = require("./db-gad-talk.operations");
const { verifyGadTalkToken } = require("./services/auth.service");
const gadTalkConfig = require("./gad-talk-config");

// ==================== HELPERS ====================

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
    logError("GadTalk get user error:", error);
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
    logError("GadTalk get user by username error:", error);
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
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Search query must be at least 2 characters"));
      return;
    }

    // Get current user if authenticated (to exclude from results)
    const authUser = getAuthenticatedUser(req);
    const currentUserId = authUser ? authUser.id : null;

    const { users, total } = searchUsers(query.trim(), parseInt(page), parseInt(limit), {
      currentUserId,
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
    logError("GadTalk search users error:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse(error.message || "Failed to search users"));
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

    res.status(HTTP_OK).send({
      ok: true,
      data: {
        ...sanitizeUser(user),
        stats,
        isFollowing: isFollowingUser,
        isOwnProfile,
        isBlocked: isBlockedUser,
        isMuted: isMutedUser,
      },
    });
  } catch (error) {
    logError("GadTalk get user profile error:", error);
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
    logError("GadTalk update profile error:", error);
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
    logError("GadTalk get user stats error:", error);
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
        avatarUrl: `/uploads/avatars/${id}.jpg`,
      },
    });
  } catch (error) {
    logError("GadTalk upload avatar error:", error);
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
    logError("GadTalk upload header error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to upload header"));
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

    const follow = await createFollow(authUser.id, id);

    logDebug("GadTalk: User followed:", { followerId: authUser.id, followingId: id });

    res.status(HTTP_OK).send({
      ok: true,
      data: follow,
    });
  } catch (error) {
    logError("GadTalk follow error:", error);
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

    logDebug("GadTalk: User unfollowed:", { followerId: authUser.id, followingId: id });

    res.status(HTTP_OK).send({
      ok: true,
      data: { message: "Unfollowed successfully" },
    });
  } catch (error) {
    logError("GadTalk unfollow error:", error);
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
    const followerUsers = followers.map((f) => {
      const followerUser = findGadTalkUserById(f.followerId);
      return {
        ...f,
        user: sanitizeUser(followerUser),
      };
    });

    res.status(HTTP_OK).json({
      followers: followerUsers,
      hasMore,
      nextCursor: hasMore && followers.length > 0 ? followers[followers.length - 1].id : null,
    });
  } catch (error) {
    logError("GadTalk get followers error:", error);
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
    const followingUsers = following.map((f) => {
      const followingUser = findGadTalkUserById(f.followingId);
      return {
        ...f,
        user: sanitizeUser(followingUser),
      };
    });

    res.status(HTTP_OK).json({
      following: followingUsers,
      hasMore,
      nextCursor: hasMore && following.length > 0 ? following[following.length - 1].id : null,
    });
  } catch (error) {
    logError("GadTalk get following error:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse(error.message || "Failed to get following"));
  }
}

/**
 * Get follow suggestions
 * GET /api/gad-talk/users/suggestions
 */
async function handleGetSuggestions(req, res) {
  try {
    const { limit = 5 } = req.query;

    // Check authentication
    const authUser = getAuthenticatedUser(req);

    // Get all users
    const allUsers = gadTalkUsersDb();

    // Filter out current user and already followed users
    let suggestions = allUsers.filter((u) => {
      if (authUser && u.id === authUser.id) return false;
      if (authUser && isFollowing(authUser.id, u.id)) return false;
      if (u.shadowBanned) return false;
      return true;
    });

    // Limit
    suggestions = suggestions.slice(0, parseInt(limit, 10));

    res.status(HTTP_OK).json({
      users: suggestions.map(sanitizeUser),
    });
  } catch (error) {
    logError("GadTalk get suggestions error:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse(error.message || "Failed to get suggestions"));
  }
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
    logError("GadTalk block error:", error);
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
    logError("GadTalk unblock error:", error);
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
    logError("GadTalk mute error:", error);
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
    logError("GadTalk unmute error:", error);
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
  handleSearchUsers,

  // Follow handlers
  handleFollow,
  handleUnfollow,
  handleGetFollowers,
  handleGetFollowing,
  handleGetSuggestions,

  // Block/Mute handlers
  handleBlock,
  handleUnblock,
  handleMute,
  handleUnmute,

  // Helpers (exported for use in other endpoints)
  getAuthenticatedUser,
  sanitizeUser,
};
