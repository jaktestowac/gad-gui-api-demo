/**
 * GadTalk Gads Endpoint Helpers
 * Handles gad creation, retrieval, likes, regads, and feed operations
 */

const dbOps = require("./db-gad-talk.operations");
const config = require("./gad-talk-config");
const { logError } = require("../../helpers/logger-api");
const {
  formatErrorResponse,
  HTTP_OK,
  HTTP_CREATED,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_NOT_FOUND,
  HTTP_INTERNAL_SERVER_ERROR,
} = require("../../helpers/response.helpers");

/**
 * Require authentication - return 401 if not authenticated
 */
function requireAuth(req, res) {
  if (!req.gadTalkUserId) {
    res.status(HTTP_UNAUTHORIZED).json(formatErrorResponse("Authentication required"));
    return false;
  }
  return true;
}

/**
 * Create a new gad
 */
async function handleCreateGad(req, res) {
  try {
    // Require authentication
    if (!requireAuth(req, res)) return;

    const userId = req.gadTalkUserId;
    const { content, replyTo, quotedGadId } = req.body;

    // Validate content
    if (!content || typeof content !== "string") {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Content is required"));
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Content cannot be empty"));
    }

    if (trimmedContent.length > config.maxGadLength) {
      return res
        .status(HTTP_BAD_REQUEST)
        .json(formatErrorResponse(`Content exceeds maximum length of ${config.maxGadLength} characters`));
    }

    // If this is a reply, verify the parent gad exists
    if (replyTo) {
      const parentGad = await dbOps.getGadById(replyTo);
      if (!parentGad) {
        return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Parent gad not found"));
      }
    }

    // Extract hashtags from content
    const hashtagMatches = trimmedContent.match(/#(\w+)/g) || [];
    const hashtags = hashtagMatches.map((h) => h.substring(1).toLowerCase());

    // Extract mentions from content
    const mentionMatches = trimmedContent.match(/@(\w+)/g) || [];
    const mentions = mentionMatches.map((m) => m.substring(1).toLowerCase());

    // Create the gad
    const gadData = {
      userId,
      content: trimmedContent,
      replyTo: replyTo || null,
      quotedGadId: quotedGadId || null,
      hashtags,
      mentions,
      likeCount: 0,
      replyCount: 0,
      regadCount: 0,
    };

    const gad = await dbOps.createGad(gadData);

    // Update hashtag counts
    for (const tag of hashtags) {
      await dbOps.incrementHashtagCount(tag);
    }

    // Create notifications for mentions
    for (const username of mentions) {
      const mentionedUser = await dbOps.getUserByUsername(username);
      if (mentionedUser && mentionedUser.id !== userId) {
        await dbOps.createNotification({
          userId: mentionedUser.id,
          type: "mention",
          actorId: userId,
          gadId: gad.id,
        });
      }
    }

    // If this is a reply, update parent's reply count and notify
    if (replyTo) {
      await dbOps.incrementGadReplyCount(replyTo);
      const parentGad = await dbOps.getGadById(replyTo);
      if (parentGad && parentGad.userId !== userId) {
        await dbOps.createNotification({
          userId: parentGad.userId,
          type: "reply",
          actorId: userId,
          gadId: gad.id,
        });
      }
    }

    // Get user for response
    const user = await dbOps.getUserById(userId);
    gad.user = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      verified: user.verified,
    };

    res.status(HTTP_CREATED).json({ gad });
  } catch (error) {
    logError("[GadTalk] Error creating gad:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to create gad"));
  }
}

/**
 * Get a single gad by ID
 */
async function handleGetGad(req, res) {
  try {
    const { gadId } = req.params;
    const userId = req.gadTalkUserId;

    const gad = await dbOps.getGadById(gadId);
    if (!gad) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Gad not found"));
    }

    // Get user
    const user = await dbOps.getUserById(gad.userId);
    gad.user = user
      ? {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          verified: user.verified,
        }
      : null;

    // Check if current user has liked/regadded/bookmarked
    if (userId) {
      gad.isLiked = await dbOps.hasUserLikedGad(userId, gadId);
      gad.isRegadded = await dbOps.hasUserRegadded(userId, gadId);
      gad.isBookmarked = await dbOps.hasUserBookmarked(userId, gadId);
    }

    res.status(HTTP_OK).json({ gad });
  } catch (error) {
    logError("[GadTalk] Error getting gad:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get gad"));
  }
}

/**
 * Delete a gad
 */
async function handleDeleteGad(req, res) {
  try {
    // Require authentication
    if (!requireAuth(req, res)) return;

    const { gadId } = req.params;
    const userId = req.gadTalkUserId;

    const gad = await dbOps.getGadById(gadId);
    if (!gad) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Gad not found"));
    }

    // Check ownership
    if (gad.userId !== userId) {
      return res.status(403).json(formatErrorResponse("You can only delete your own gads"));
    }

    await dbOps.deleteGad(gadId);

    // If this was a reply, decrement parent's reply count
    if (gad.replyTo) {
      await dbOps.decrementGadReplyCount(gad.replyTo);
    }

    res.status(HTTP_OK).json({ message: "Gad deleted successfully" });
  } catch (error) {
    logError("[GadTalk] Error deleting gad:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to delete gad"));
  }
}

/**
 * Get "For You" feed (all gads, sorted by recency)
 */
async function handleGetForYouFeed(req, res) {
  try {
    const userId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || config.defaultPageSize, config.maxPageSize);

    const { gads, total } = await dbOps.getGadsForYou(page, limit);

    // Enrich gads with user data and interaction status
    const enrichedGads = await enrichGads(gads, userId);

    res.status(HTTP_OK).json({
      gads: enrichedGads,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    logError("[GadTalk] Error getting for-you feed:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get feed"));
  }
}

/**
 * Get timeline (gads from followed users)
 */
async function handleGetTimeline(req, res) {
  try {
    // Require authentication - timeline needs to know who user follows
    if (!requireAuth(req, res)) return;

    const userId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || config.defaultPageSize, config.maxPageSize);

    // Get users the current user follows
    const following = await dbOps.getFollowing(userId);
    const followingIds = following.map((f) => f.followingId);

    // Include user's own gads in timeline
    followingIds.push(userId);

    const { gads, total } = await dbOps.getGadsByUsers(followingIds, page, limit);

    // Enrich gads
    const enrichedGads = await enrichGads(gads, userId);

    res.status(HTTP_OK).json({
      gads: enrichedGads,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    logError("[GadTalk] Error getting timeline:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get timeline"));
  }
}

/**
 * Get gads by a specific user
 */
async function handleGetUserGads(req, res) {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || config.defaultPageSize, config.maxPageSize);

    // Verify user exists
    const user = await dbOps.getUserById(targetUserId);
    if (!user) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("User not found"));
    }

    const { gads, total } = await dbOps.getGadsByUser(targetUserId, page, limit);

    // Enrich gads
    const enrichedGads = await enrichGads(gads, currentUserId);

    res.status(HTTP_OK).json({
      gads: enrichedGads,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    logError("[GadTalk] Error getting user gads:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get user gads"));
  }
}

/**
 * Like a gad
 */
async function handleLikeGad(req, res) {
  try {
    // Require authentication
    if (!requireAuth(req, res)) return;

    const { gadId } = req.params;
    const userId = req.gadTalkUserId;

    const gad = await dbOps.getGadById(gadId);
    if (!gad) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Gad not found"));
    }

    // Check if already liked
    const alreadyLiked = await dbOps.hasUserLikedGad(userId, gadId);
    if (alreadyLiked) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Already liked this gad"));
    }

    await dbOps.createLike({ userId, gadId });
    await dbOps.incrementGadLikeCount(gadId);

    // Create notification if not liking own gad
    if (gad.userId !== userId) {
      await dbOps.createNotification({
        userId: gad.userId,
        type: "like",
        actorId: userId,
        gadId,
      });
    }

    res.status(HTTP_OK).json({ message: "Gad liked successfully" });
  } catch (error) {
    logError("[GadTalk] Error liking gad:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to like gad"));
  }
}

/**
 * Unlike a gad
 */
async function handleUnlikeGad(req, res) {
  try {
    // Require authentication
    if (!requireAuth(req, res)) return;

    const { gadId } = req.params;
    const userId = req.gadTalkUserId;

    const gad = await dbOps.getGadById(gadId);
    if (!gad) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Gad not found"));
    }

    const deleted = await dbOps.deleteLike(userId, gadId);
    if (!deleted) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Not liked this gad"));
    }

    await dbOps.decrementGadLikeCount(gadId);

    res.status(HTTP_OK).json({ message: "Like removed successfully" });
  } catch (error) {
    logError("[GadTalk] Error unliking gad:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to unlike gad"));
  }
}

/**
 * Regad (retweet) a gad
 */
async function handleRegad(req, res) {
  try {
    // Require authentication
    if (!requireAuth(req, res)) return;

    const { gadId } = req.params;
    const userId = req.gadTalkUserId;
    const { comment } = req.body;

    const gad = await dbOps.getGadById(gadId);
    if (!gad) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Gad not found"));
    }

    // Check if already regadded
    const alreadyRegadded = await dbOps.hasUserRegadded(userId, gadId);
    if (alreadyRegadded) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Already regadded this gad"));
    }

    // Create regad entry in outbox
    await dbOps.createRegad({ userId, gadId, comment: comment || "" });
    await dbOps.incrementGadRegadCount(gadId);

    // Create notification if not regadding own gad
    if (gad.userId !== userId) {
      await dbOps.createNotification({
        userId: gad.userId,
        type: "regad",
        actorId: userId,
        gadId,
      });
    }

    res.status(HTTP_OK).json({ message: "Regadded successfully" });
  } catch (error) {
    logError("[GadTalk] Error regadding:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to regad"));
  }
}

/**
 * Remove regad
 */
async function handleUnregad(req, res) {
  try {
    // Require authentication
    if (!requireAuth(req, res)) return;

    const { gadId } = req.params;
    const userId = req.gadTalkUserId;

    const gad = await dbOps.getGadById(gadId);
    if (!gad) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Gad not found"));
    }

    const deleted = await dbOps.deleteRegad(userId, gadId);
    if (!deleted) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Not regadded this gad"));
    }

    await dbOps.decrementGadRegadCount(gadId);

    res.status(HTTP_OK).json({ message: "Regad removed successfully" });
  } catch (error) {
    logError("[GadTalk] Error removing regad:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to remove regad"));
  }
}

/**
 * Bookmark a gad
 */
async function handleBookmarkGad(req, res) {
  try {
    // Require authentication
    if (!requireAuth(req, res)) return;

    const { gadId } = req.params;
    const userId = req.gadTalkUserId;

    const gad = await dbOps.getGadById(gadId);
    if (!gad) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Gad not found"));
    }

    // Check if already bookmarked
    const alreadyBookmarked = await dbOps.hasUserBookmarked(userId, gadId);
    if (alreadyBookmarked) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Already bookmarked this gad"));
    }

    await dbOps.createBookmark({ userId, gadId });

    res.status(HTTP_OK).json({ message: "Gad bookmarked successfully" });
  } catch (error) {
    logError("[GadTalk] Error bookmarking gad:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to bookmark gad"));
  }
}

/**
 * Remove bookmark
 */
async function handleRemoveBookmark(req, res) {
  try {
    // Require authentication
    if (!requireAuth(req, res)) return;

    const { gadId } = req.params;
    const userId = req.gadTalkUserId;

    const deleted = await dbOps.deleteBookmark(userId, gadId);
    if (!deleted) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Not bookmarked this gad"));
    }

    res.status(HTTP_OK).json({ message: "Bookmark removed successfully" });
  } catch (error) {
    logError("[GadTalk] Error removing bookmark:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to remove bookmark"));
  }
}

/**
 * Get user's bookmarks
 */
async function handleGetBookmarks(req, res) {
  try {
    // Require authentication
    if (!requireAuth(req, res)) return;

    const userId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || config.defaultPageSize, config.maxPageSize);

    const { bookmarks, total } = await dbOps.getBookmarks(userId, page, limit);

    // Get gads for bookmarks
    const gadIds = bookmarks.map((b) => b.gadId);
    const gads = [];
    for (const gadId of gadIds) {
      const gad = await dbOps.getGadById(gadId);
      if (gad) {
        gads.push(gad);
      }
    }

    // Enrich gads
    const enrichedGads = await enrichGads(gads, userId);

    res.status(HTTP_OK).json({
      gads: enrichedGads,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    logError("[GadTalk] Error getting bookmarks:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get bookmarks"));
  }
}

/**
 * Get replies to a gad
 */
async function handleGetReplies(req, res) {
  try {
    const { gadId } = req.params;
    const userId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || config.defaultPageSize, config.maxPageSize);

    const gad = await dbOps.getGadById(gadId);
    if (!gad) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Gad not found"));
    }

    const { gads: replies, total } = await dbOps.getReplies(gadId, page, limit);

    // Enrich gads
    const enrichedReplies = await enrichGads(replies, userId);

    res.status(HTTP_OK).json({
      gads: enrichedReplies,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    logError("[GadTalk] Error getting replies:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get replies"));
  }
}

/**
 * Search gads
 */
async function handleSearchGads(req, res) {
  try {
    const userId = req.gadTalkUserId;
    const query = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || config.defaultPageSize, config.maxPageSize);

    if (!query.trim()) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Search query is required"));
    }

    const { gads, total } = await dbOps.searchGads(query.trim(), page, limit);

    // Enrich gads
    const enrichedGads = await enrichGads(gads, userId);

    res.status(HTTP_OK).json({
      gads: enrichedGads,
      query: query.trim(),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    logError("[GadTalk] Error searching gads:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to search gads"));
  }
}

/**
 * Get trending hashtags
 */
async function handleGetTrendingHashtags(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);

    const hashtags = await dbOps.getTrendingHashtags(limit);

    res.status(HTTP_OK).json({ hashtags });
  } catch (error) {
    logError("[GadTalk] Error getting trending hashtags:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get trending hashtags"));
  }
}

/**
 * Get gads by hashtag
 */
async function handleGetGadsByHashtag(req, res) {
  try {
    const { hashtag } = req.params;
    const userId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || config.defaultPageSize, config.maxPageSize);

    const { gads, total } = await dbOps.getGadsByHashtag(hashtag.toLowerCase(), page, limit);

    // Enrich gads
    const enrichedGads = await enrichGads(gads, userId);

    res.status(HTTP_OK).json({
      gads: enrichedGads,
      hashtag: hashtag.toLowerCase(),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    logError("[GadTalk] Error getting gads by hashtag:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get gads"));
  }
}

/**
 * Helper: Enrich gads with user data and interaction status
 */
async function enrichGads(gads, currentUserId) {
  const enriched = [];

  for (const gad of gads) {
    // Get user
    const user = await dbOps.getUserById(gad.userId);
    gad.user = user
      ? {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          verified: user.verified,
        }
      : null;

    // Check interaction status for current user
    if (currentUserId) {
      gad.isLiked = await dbOps.hasUserLikedGad(currentUserId, gad.id);
      gad.isRegadded = await dbOps.hasUserRegadded(currentUserId, gad.id);
      gad.isBookmarked = await dbOps.hasUserBookmarked(currentUserId, gad.id);
    } else {
      gad.isLiked = false;
      gad.isRegadded = false;
      gad.isBookmarked = false;
    }

    // If this is a reply, get the parent user
    if (gad.replyTo) {
      const parentGad = await dbOps.getGadById(gad.replyTo);
      if (parentGad) {
        const parentUser = await dbOps.getUserById(parentGad.userId);
        gad.replyToUser = parentUser ? { username: parentUser.username, displayName: parentUser.displayName } : null;
      }
    }

    enriched.push(gad);
  }

  return enriched;
}

module.exports = {
  handleCreateGad,
  handleGetGad,
  handleDeleteGad,
  handleGetForYouFeed,
  handleGetTimeline,
  handleGetUserGads,
  handleLikeGad,
  handleUnlikeGad,
  handleRegad,
  handleUnregad,
  handleBookmarkGad,
  handleRemoveBookmark,
  handleGetBookmarks,
  handleGetReplies,
  handleSearchGads,
  handleGetTrendingHashtags,
  handleGetGadsByHashtag,
};
