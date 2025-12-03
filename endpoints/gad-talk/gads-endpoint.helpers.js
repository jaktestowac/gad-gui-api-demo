/**
 * GadTalk Gads Endpoint Helpers
 * Handles gad creation, retrieval, likes, regads, and feed operations
 */

const dbOps = require("./db-gad-talk.operations");
const config = require("./gad-talk-config");
const { logError } = require("../../helpers/logger-api");
const {
  HTTP_OK,
  HTTP_CREATED,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_NOT_FOUND,
  HTTP_INTERNAL_SERVER_ERROR,
} = require("../../helpers/response.helpers");
const { formatErrorResponse } = require("../../helpers/helpers");

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
    const { content, replyTo, quotedGadId, imageUrl } = req.body;

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

    // Validate image URL if provided
    if (imageUrl && typeof imageUrl === "string" && imageUrl.trim() !== "") {
      try {
        new URL(imageUrl);
      } catch {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Invalid image URL"));
      }
    }

    // If this is a reply, verify the parent gad exists
    if (replyTo) {
      const parentGad = await dbOps.getGadById(replyTo);
      if (!parentGad) {
        return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Parent gad not found"));
      }
    }

    // If this is a quote, verify the quoted gad exists
    if (quotedGadId) {
      const quotedGad = await dbOps.getGadById(quotedGadId);
      if (!quotedGad) {
        return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Quoted gad not found"));
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
      imageUrl: imageUrl && imageUrl.trim() !== "" ? imageUrl.trim() : null,
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

    // If this is a quote, notify the original gad author
    if (quotedGadId) {
      const quotedGad = await dbOps.getGadById(quotedGadId);
      if (quotedGad && quotedGad.userId !== userId) {
        await dbOps.createNotification({
          userId: quotedGad.userId,
          type: "quote",
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

    // Check visibility
    let followingIds = [];
    if (userId) {
      const following = await dbOps.getFollowing(userId);
      followingIds = following.map((f) => f.followingId);
    }

    if (!dbOps.isGadVisibleToUser(gad, userId, followingIds)) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Gad not found"));
    }

    // Calculate real-time counts
    const likeCounts = dbOps.getBatchLikeCounts([gadId]);
    const replyCounts = dbOps.getBatchReplyCounts([gadId]);
    const repostCounts = dbOps.getBatchRepostCounts([gadId]);
    gad.likeCount = likeCounts[gadId] || 0;
    gad.replyCount = replyCounts[gadId] || 0;
    gad.repostCount = repostCounts[gadId] || 0;

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

    // If this is a quote, get the quoted gad
    if (gad.quotedGadId || gad.quoteOfId) {
      const quotedGadId = gad.quotedGadId || gad.quoteOfId;
      const quotedGad = await dbOps.getGadById(quotedGadId);
      if (quotedGad && !quotedGad.deleted) {
        const quotedUser = await dbOps.getUserById(quotedGad.userId);
        gad.quotedGad = {
          id: quotedGad.id,
          content: quotedGad.content,
          imageUrl: quotedGad.imageUrl,
          createdAt: quotedGad.createdAt,
          user: quotedUser
            ? {
                id: quotedUser.id,
                username: quotedUser.username,
                displayName: quotedUser.displayName,
                avatar: quotedUser.avatar,
                verified: quotedUser.verified,
              }
            : null,
        };
      }
    }

    // If this is a reply, get the parent gad user
    if (gad.replyTo || gad.replyToId) {
      const parentGadId = gad.replyTo || gad.replyToId;
      const parentGad = await dbOps.getGadById(parentGadId);
      if (parentGad) {
        const parentUser = await dbOps.getUserById(parentGad.userId);
        gad.replyToUser = parentUser ? { username: parentUser.username, displayName: parentUser.displayName } : null;
      }
    }

    res.status(HTTP_OK).json({ gad });
  } catch (error) {
    logError("[GadTalk] Error getting gad:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get gad"));
  }
}

/**
 * Update/Edit a gad
 */
async function handleUpdateGad(req, res) {
  try {
    // Require authentication
    if (!requireAuth(req, res)) return;

    const { gadId } = req.params;
    const userId = req.gadTalkUserId;
    const { content, imageUrl } = req.body;

    const gad = await dbOps.getGadById(gadId);
    if (!gad) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Gad not found"));
    }

    // Check ownership
    if (gad.userId !== userId) {
      return res.status(403).json(formatErrorResponse("You can only edit your own gads"));
    }

    // Check edit window (15 minutes)
    const createdAt = new Date(gad.createdAt);
    const now = new Date();
    const diffMinutes = (now - createdAt) / (1000 * 60);

    if (diffMinutes > config.gads.editWindowMinutes) {
      return res
        .status(HTTP_BAD_REQUEST)
        .json(
          formatErrorResponse(
            `Edit window expired. Gads can only be edited within ${config.gads.editWindowMinutes} minutes of posting.`
          )
        );
    }

    // Validate content if provided
    if (content !== undefined) {
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
    }

    // Validate image URL if provided
    if (imageUrl !== undefined && imageUrl !== null && imageUrl !== "") {
      try {
        new URL(imageUrl);
      } catch {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Invalid image URL"));
      }
    }

    // Build updates object
    const updates = {};
    if (content !== undefined) {
      updates.content = content.trim();
    }
    if (imageUrl !== undefined) {
      updates.imageUrl = imageUrl || null;
    }

    // Update the gad
    const updatedGad = await dbOps.updateGad(gadId, updates);

    // Get user for response
    const user = await dbOps.getUserById(userId);
    updatedGad.user = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      verified: user.verified,
    };

    res.status(HTTP_OK).json({ gad: updatedGad });
  } catch (error) {
    logError("[GadTalk] Error updating gad:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to update gad"));
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
 * Get "For You" feed (all gads, with sorting options)
 * Supports sort parameter: 'latest' (default), 'top', 'media'
 * Supports cursor-based pagination via cursor query param
 */
async function handleGetForYouFeed(req, res) {
  try {
    const userId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(
      parseInt(req.query.limit) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );
    const sort = req.query.sort || "latest"; // 'latest', 'top', 'media'
    const cursor = req.query.cursor || null; // Cursor for cursor-based pagination

    // Get following IDs for visibility filtering
    let followingIds = [];
    let blockedUserIds = [];
    let mutedUserIds = [];

    if (userId) {
      const following = await dbOps.getFollowing(userId);
      followingIds = following.map((f) => f.followingId);
      // Get blocked and muted users to filter out their content
      blockedUserIds = dbOps.getBlockedUserIds(userId);
      mutedUserIds = dbOps.getMutedUserIds(userId);
    }

    const { gads, total, nextCursor } = await dbOps.getGadsForYou(page, limit, {
      currentUserId: userId,
      followingIds,
      sort,
      blockedUserIds,
      mutedUserIds,
      cursor,
    });

    // Enrich gads with user data and interaction status
    const enrichedGads = await enrichGads(gads, userId);

    res.status(HTTP_OK).json({
      gads: enrichedGads,
      page,
      limit,
      total,
      sort,
      hasMore: nextCursor !== null || page * limit < total,
      nextCursor,
    });
  } catch (error) {
    logError("[GadTalk] Error getting for-you feed:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get feed"));
  }
}

/**
 * Get timeline (gads from followed users)
 * Supports sort parameter: 'latest' (default), 'top', 'media'
 * Supports cursor-based pagination via cursor query param
 */
async function handleGetTimeline(req, res) {
  try {
    // Require authentication - timeline needs to know who user follows
    if (!requireAuth(req, res)) return;

    const userId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(
      parseInt(req.query.limit) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );
    const sort = req.query.sort || "latest"; // 'latest', 'top', 'media'
    const cursor = req.query.cursor || null; // Cursor for cursor-based pagination

    // Get users the current user follows
    const following = await dbOps.getFollowing(userId);
    const followingIds = following.map((f) => f.followingId);

    // Get blocked and muted users to filter out their content
    const blockedUserIds = dbOps.getBlockedUserIds(userId);
    const mutedUserIds = dbOps.getMutedUserIds(userId);

    // Include user's own gads in timeline
    const userIdsForTimeline = [...followingIds, userId];

    const { gads, total, nextCursor } = await dbOps.getGadsByUsers(userIdsForTimeline, page, limit, {
      currentUserId: userId,
      followingIds,
      sort,
      blockedUserIds,
      mutedUserIds,
      cursor,
    });

    // Enrich gads
    const enrichedGads = await enrichGads(gads, userId);

    res.status(HTTP_OK).json({
      gads: enrichedGads,
      page,
      limit,
      total,
      sort,
      hasMore: nextCursor !== null || page * limit < total,
      nextCursor,
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
    const limit = Math.min(
      parseInt(req.query.limit) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );

    // Verify user exists
    const user = await dbOps.getUserById(targetUserId);
    if (!user) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("User not found"));
    }

    // Get following IDs for visibility filtering
    let followingIds = [];
    if (currentUserId) {
      const following = await dbOps.getFollowing(currentUserId);
      followingIds = following.map((f) => f.followingId);
    }

    const { gads, total } = await dbOps.getGadsByUser(targetUserId, page, limit, {
      currentUserId,
      followingIds,
    });

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
 * Get replies by a specific user
 */
async function handleGetUserReplies(req, res) {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(
      parseInt(req.query.limit) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );

    // Verify user exists
    const user = await dbOps.getUserById(targetUserId);
    if (!user) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("User not found"));
    }

    // Get following IDs for visibility filtering
    let followingIds = [];
    if (currentUserId) {
      const following = await dbOps.getFollowing(currentUserId);
      followingIds = following.map((f) => f.followingId);
    }

    const { gads, total } = await dbOps.getUserReplies(targetUserId, page, limit, {
      currentUserId,
      followingIds,
    });

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
    logError("[GadTalk] Error getting user replies:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get user replies"));
  }
}

/**
 * Get gads liked by a specific user
 */
async function handleGetUserLikes(req, res) {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(
      parseInt(req.query.limit) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );

    // Verify user exists
    const user = await dbOps.getUserById(targetUserId);
    if (!user) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("User not found"));
    }

    // Get following IDs for visibility filtering
    let followingIds = [];
    if (currentUserId) {
      const following = await dbOps.getFollowing(currentUserId);
      followingIds = following.map((f) => f.followingId);
    }

    const { gads, total } = await dbOps.getUserLikedGads(targetUserId, page, limit, {
      currentUserId,
      followingIds,
    });

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
    logError("[GadTalk] Error getting user likes:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get user likes"));
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

    await dbOps.createLike(userId, gadId);
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

    await dbOps.createBookmark(userId, gadId);

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
    const limit = Math.min(
      parseInt(req.query.limit) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );

    const { bookmarks, total } = await dbOps.getBookmarksPaginated(userId, page, limit);

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
    const limit = Math.min(
      parseInt(req.query.limit) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );

    const gad = await dbOps.getGadById(gadId);
    if (!gad) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Gad not found"));
    }

    // Get following IDs for visibility filtering
    let followingIds = [];
    if (userId) {
      const following = await dbOps.getFollowing(userId);
      followingIds = following.map((f) => f.followingId);
    }

    const { gads: replies, total } = await dbOps.getReplies(gadId, page, limit, {
      currentUserId: userId,
      followingIds,
    });

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
    const limit = Math.min(
      parseInt(req.query.limit) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );

    if (!query.trim()) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Search query is required"));
    }

    // Get following IDs for visibility filtering and blocked users
    let followingIds = [];
    let blockedUserIds = [];
    if (userId) {
      const following = await dbOps.getFollowing(userId);
      followingIds = following.map((f) => f.followingId);
      blockedUserIds = dbOps.getBlockedUserIds(userId);
    }

    const { gads, total } = await dbOps.searchGads(query.trim(), page, limit, {
      currentUserId: userId,
      followingIds,
      blockedUserIds,
    });

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
 * Get popular gads sorted by engagement
 */
async function handleGetPopularGads(req, res) {
  try {
    const userId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(
      parseInt(req.query.limit) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );

    // Get following IDs for visibility filtering and blocked users
    let followingIds = [];
    let blockedUserIds = [];
    if (userId) {
      const following = await dbOps.getFollowing(userId);
      followingIds = following.map((f) => f.followingId);
      blockedUserIds = dbOps.getBlockedUserIds(userId);
    }

    const { gads, total } = await dbOps.getPopularGads(page, limit, {
      currentUserId: userId,
      followingIds,
      blockedUserIds,
    });

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
    logError("[GadTalk] Error getting popular gads:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get popular gads"));
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
    const limit = Math.min(
      parseInt(req.query.limit) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );

    // Get following IDs for visibility filtering
    let followingIds = [];
    if (userId) {
      const following = await dbOps.getFollowing(userId);
      followingIds = following.map((f) => f.followingId);
    }

    const { gads, total } = await dbOps.getGadsByHashtag(hashtag.toLowerCase(), page, limit, {
      currentUserId: userId,
      followingIds,
    });

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
 * Calculates real-time like/reply/repost counts from actual data
 */
async function enrichGads(gads, currentUserId) {
  const enriched = [];

  // Get all gad IDs for batch operations
  const gadIds = gads.map((g) => g.id);

  // Batch fetch real-time counts (single DB read per type)
  const likeCounts = dbOps.getBatchLikeCounts(gadIds);
  const replyCounts = dbOps.getBatchReplyCounts(gadIds);
  const repostCounts = dbOps.getBatchRepostCounts(gadIds);

  for (const gad of gads) {
    // Apply real-time counts
    gad.likeCount = likeCounts[gad.id] || 0;
    gad.replyCount = replyCounts[gad.id] || 0;
    gad.repostCount = repostCounts[gad.id] || 0;

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
    if (gad.replyTo || gad.replyToId) {
      const parentGadId = gad.replyTo || gad.replyToId;
      const parentGad = await dbOps.getGadById(parentGadId);
      if (parentGad) {
        const parentUser = await dbOps.getUserById(parentGad.userId);
        gad.replyToUser = parentUser ? { username: parentUser.username, displayName: parentUser.displayName } : null;
      }
    }

    // If this is a quote, get the quoted gad
    if (gad.quotedGadId || gad.quoteOfId) {
      const quotedGadId = gad.quotedGadId || gad.quoteOfId;
      const quotedGad = await dbOps.getGadById(quotedGadId);
      if (quotedGad && !quotedGad.deleted) {
        const quotedUser = await dbOps.getUserById(quotedGad.userId);
        gad.quotedGad = {
          id: quotedGad.id,
          content: quotedGad.content,
          imageUrl: quotedGad.imageUrl,
          createdAt: quotedGad.createdAt,
          user: quotedUser
            ? {
                id: quotedUser.id,
                username: quotedUser.username,
                displayName: quotedUser.displayName,
                avatar: quotedUser.avatar,
                verified: quotedUser.verified,
              }
            : null,
        };
      }
    }

    enriched.push(gad);
  }

  return enriched;
}

module.exports = {
  handleCreateGad,
  handleGetGad,
  handleUpdateGad,
  handleDeleteGad,
  handleGetForYouFeed,
  handleGetTimeline,
  handleGetUserGads,
  handleGetUserReplies,
  handleGetUserLikes,
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
  handleGetPopularGads,
  handleGetGadsByHashtag,
};
