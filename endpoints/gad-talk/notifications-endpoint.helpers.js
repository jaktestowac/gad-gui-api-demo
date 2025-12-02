/**
 * GadTalk Notifications Endpoint Helpers
 * Handles notification retrieval and management
 */

const dbOps = require("./db-gad-talk.operations");
const config = require("./gad-talk-config");
const { HTTP_OK, HTTP_NOT_FOUND, HTTP_INTERNAL_SERVER_ERROR } = require("../../helpers/response.helpers");
const { logError } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");

/**
 * Get user's notifications
 */
async function handleGetNotifications(req, res) {
  try {
    const userId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || config.defaultPageSize, config.maxPageSize);

    const { notifications, total } = await dbOps.getNotifications(userId, page, limit);

    // Enrich notifications with actor and gad data
    const enrichedNotifications = await enrichNotifications(notifications);

    res.status(HTTP_OK).json({
      notifications: enrichedNotifications,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    logError("[GadTalk] Error getting notifications:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get notifications"));
  }
}

/**
 * Get unread notification count
 */
async function handleGetUnreadCount(req, res) {
  try {
    const userId = req.gadTalkUserId;

    const count = await dbOps.getUnreadNotificationCount(userId);

    res.status(HTTP_OK).json({ count });
  } catch (error) {
    logError("[GadTalk] Error getting unread count:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get unread count"));
  }
}

/**
 * Mark a notification as read
 */
async function handleMarkRead(req, res) {
  try {
    const userId = req.gadTalkUserId;
    const { notificationId } = req.params;

    const notification = await dbOps.getNotificationById(notificationId);
    if (!notification) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Notification not found"));
    }

    // Verify ownership
    if (notification.userId !== userId) {
      return res.status(403).json(formatErrorResponse("Not authorized"));
    }

    await dbOps.markNotificationRead(notificationId);

    res.status(HTTP_OK).json({ message: "Notification marked as read" });
  } catch (error) {
    logError("[GadTalk] Error marking notification read:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to mark notification read"));
  }
}

/**
 * Mark all notifications as read
 */
async function handleMarkAllRead(req, res) {
  try {
    const userId = req.gadTalkUserId;

    await dbOps.markAllNotificationsRead(userId);

    res.status(HTTP_OK).json({ message: "All notifications marked as read" });
  } catch (error) {
    logError("[GadTalk] Error marking all notifications read:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to mark notifications read"));
  }
}

/**
 * Helper: Enrich notifications with actor and gad data
 */
async function enrichNotifications(notifications) {
  const enriched = [];

  for (const notification of notifications) {
    // Get actor (user who triggered the notification)
    if (notification.actorId) {
      const actor = await dbOps.getUserById(notification.actorId);
      notification.actor = actor
        ? {
            id: actor.id,
            username: actor.username,
            displayName: actor.displayName,
            avatar: actor.avatar,
          }
        : null;
    }

    // Get gad if applicable
    if (notification.gadId) {
      const gad = await dbOps.getGadById(notification.gadId);
      notification.gad = gad
        ? {
            id: gad.id,
            content: gad.content.substring(0, 100), // Truncate for preview
          }
        : null;
    }

    // Generate message based on type
    notification.message = generateNotificationMessage(notification);

    enriched.push(notification);
  }

  return enriched;
}

/**
 * Helper: Generate notification message
 */
function generateNotificationMessage(notification) {
  const actorName = notification.actor?.displayName || notification.actor?.username || "Someone";

  switch (notification.type) {
    case "like":
      return `${actorName} liked your gad`;
    case "regad":
      return `${actorName} regadded your gad`;
    case "reply":
      return `${actorName} replied to your gad`;
    case "mention":
      return `${actorName} mentioned you`;
    case "follow":
      return `${actorName} started following you`;
    default:
      return "You have a new notification";
  }
}

module.exports = {
  handleGetNotifications,
  handleGetUnreadCount,
  handleMarkRead,
  handleMarkAllRead,
};
