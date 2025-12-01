const { logDebug, logTrace, logError } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");
const { HTTP_NOT_FOUND, HTTP_METHOD_NOT_ALLOWED } = require("../../helpers/response.helpers");
const { verifyToken } = require("../../helpers/jwtauth");

// Import endpoint handlers
const {
  handleSignup,
  handleLogin,
  handleLogout,
  handleDemoLogin,
  handleGetMe,
  handleRefresh,
  handleForgotPassword,
  handleResetPassword,
  handleOAuthGoogle,
} = require("./auth-endpoint.helpers");

const {
  handleGetUser,
  handleGetUserByUsername,
  handleGetUserProfile,
  handleUpdateProfile,
  handleGetUserStats,
  handleUploadAvatar,
  handleUploadHeader,
  handleFollow,
  handleUnfollow,
  handleGetFollowers,
  handleGetFollowing,
  handleGetSuggestions,
  handleBlock,
  handleUnblock,
  handleMute,
  handleUnmute,
  handleSearchUsers,
} = require("./users-endpoint.helpers");

const {
  handleResetDb,
  handleGetDbStatus,
  handleSeedDemoData,
  handleInitDb,
  handleGetLogs,
  handleGetMetrics,
  handleGetChaosConfig,
  handleUpdateChaosConfig,
  handleEnableChaos,
  handleDisableChaos,
} = require("./admin-endpoint.helpers");

const {
  handleCreateGad,
  handleGetGad,
  handleUpdateGad,
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
} = require("./gads-endpoint.helpers");

const {
  handleGetNotifications,
  handleGetUnreadCount,
  handleMarkRead,
  handleMarkAllRead,
} = require("./notifications-endpoint.helpers");

const { initializeAllGadTalkDatabases } = require("./db-gad-talk.operations");

// ==================== ROUTE HANDLING ====================

/**
 * Parse URL path to extract segments and params
 * @param {string} urlPath - URL path
 * @returns {object} { segments: string[], params: object }
 */
function parseUrlPath(urlPath) {
  // Remove /api/gad-talk prefix and query string
  let path = urlPath.replace(/^\/api\/gad-talk/, "");
  const queryIndex = path.indexOf("?");
  if (queryIndex >= 0) {
    path = path.substring(0, queryIndex);
  }

  // Split into segments
  const segments = path.split("/").filter((s) => s.length > 0);

  return { segments, path };
}

/**
 * Extract user from JWT token (optional auth)
 * Sets req.gadTalkUserId if valid token is present
 * @param {object} req - Express request
 */
function extractUserFromToken(req) {
  try {
    // Get token from cookie or authorization header
    let token = req.cookies?.gadtalk_token;
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      req.gadTalkUserId = null;
      return;
    }

    const decoded = verifyToken(token);
    if (decoded && decoded.userId) {
      req.gadTalkUserId = decoded.userId;
      req.gadTalkUserData = decoded;
      logTrace("GadTalk: User extracted from token:", { userId: decoded.userId });
    } else {
      req.gadTalkUserId = null;
    }
  } catch (error) {
    // Invalid token - treat as unauthenticated
    req.gadTalkUserId = null;
    logTrace("GadTalk: Invalid token, treating as unauthenticated");
  }
}

/**
 * Main GadTalk route handler
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function handleGadTalk(req, res) {
  const method = req.method.toUpperCase();
  const { segments } = parseUrlPath(req.url);

  // Extract user from token (optional auth for most endpoints)
  extractUserFromToken(req);

  logTrace("GadTalk request:", { method, segments, url: req.url, userId: req.gadTalkUserId });

  try {
    // ==================== AUTH ROUTES ====================
    if (segments[0] === "auth") {
      return await handleAuthRoutes(req, res, method, segments);
    }

    // ==================== USER ROUTES ====================
    if (segments[0] === "users") {
      return await handleUserRoutes(req, res, method, segments);
    }

    // ==================== GADS ROUTES ====================
    if (segments[0] === "gads") {
      return await handleGadsRoutes(req, res, method, segments);
    }

    // ==================== BOOKMARKS ROUTES ====================
    if (segments[0] === "bookmarks") {
      return await handleBookmarksRoutes(req, res, method, segments);
    }

    // ==================== NOTIFICATIONS ROUTES ====================
    if (segments[0] === "notifications") {
      return await handleNotificationsRoutes(req, res, method, segments);
    }

    // ==================== HASHTAGS ROUTES ====================
    if (segments[0] === "hashtags") {
      return await handleHashtagsRoutes(req, res, method, segments);
    }

    // ==================== ADMIN ROUTES ====================
    if (segments[0] === "admin") {
      return await handleAdminRoutes(req, res, method, segments);
    }

    // ==================== NOT FOUND ====================
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Endpoint not found"));
  } catch (error) {
    logError("GadTalk route error:", error);
    res.status(500).send(formatErrorResponse(error.message || "Internal server error"));
  }
}

/**
 * Handle auth routes
 */
async function handleAuthRoutes(req, res, method, segments) {
  const action = segments[1];

  switch (action) {
    case "signup":
      if (method === "POST") return handleSignup(req, res);
      break;

    case "login":
      if (method === "POST") return handleLogin(req, res);
      break;

    case "logout":
      if (method === "POST") return handleLogout(req, res);
      break;

    case "demo-login":
      if (method === "POST") return handleDemoLogin(req, res);
      break;

    case "me":
      if (method === "GET") return handleGetMe(req, res);
      break;

    case "refresh":
      if (method === "POST") return handleRefresh(req, res);
      break;

    case "forgot-password":
      if (method === "POST") return handleForgotPassword(req, res);
      break;

    case "reset-password":
      if (method === "POST") return handleResetPassword(req, res);
      break;

    case "oauth":
      if (segments[2] === "google" && method === "POST") {
        return handleOAuthGoogle(req, res);
      }
      break;

    default:
      break;
  }

  res.status(HTTP_METHOD_NOT_ALLOWED).send(formatErrorResponse("Method not allowed"));
}

/**
 * Handle user routes
 */
async function handleUserRoutes(req, res, method, segments) {
  // GET /api/gad-talk/users/suggestions
  if (segments[1] === "suggestions" && method === "GET") {
    return handleGetSuggestions(req, res);
  }

  // GET /api/gad-talk/users/search?q=query
  if (segments[1] === "search" && method === "GET") {
    return handleSearchUsers(req, res);
  }

  // GET /api/gad-talk/users/username/:username
  if (segments[1] === "username" && segments[2]) {
    req.params = { username: segments[2] };
    if (method === "GET") return handleGetUserByUsername(req, res);
    res.status(HTTP_METHOD_NOT_ALLOWED).send(formatErrorResponse("Method not allowed"));
    return;
  }

  // Routes with user ID
  const userId = segments[1];
  if (!userId) {
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User ID required"));
    return;
  }

  req.params = { id: userId };
  const subAction = segments[2];

  // No sub-action: GET /api/gad-talk/users/:id
  if (!subAction) {
    if (method === "GET") return handleGetUser(req, res);
    res.status(HTTP_METHOD_NOT_ALLOWED).send(formatErrorResponse("Method not allowed"));
    return;
  }

  switch (subAction) {
    case "profile":
      if (method === "GET") return handleGetUserProfile(req, res);
      if (method === "PUT") return handleUpdateProfile(req, res);
      break;

    case "stats":
      if (method === "GET") return handleGetUserStats(req, res);
      break;

    case "avatar":
      if (method === "POST") return handleUploadAvatar(req, res);
      break;

    case "header":
      if (method === "POST") return handleUploadHeader(req, res);
      break;

    case "follow":
      if (method === "POST") return handleFollow(req, res);
      if (method === "DELETE") return handleUnfollow(req, res);
      break;

    case "followers":
      if (method === "GET") return handleGetFollowers(req, res);
      break;

    case "following":
      if (method === "GET") return handleGetFollowing(req, res);
      break;

    case "block":
      if (method === "POST") return handleBlock(req, res);
      if (method === "DELETE") return handleUnblock(req, res);
      break;

    case "mute":
      if (method === "POST") return handleMute(req, res);
      if (method === "DELETE") return handleUnmute(req, res);
      break;

    case "gads":
      if (method === "GET") {
        req.params = { userId };
        return handleGetUserGads(req, res);
      }
      break;

    default:
      break;
  }

  res.status(HTTP_METHOD_NOT_ALLOWED).send(formatErrorResponse("Method not allowed"));
}

/**
 * Handle gads routes
 */
async function handleGadsRoutes(req, res, method, segments) {
  const gadId = segments[1];

  // POST /api/gad-talk/gads - Create new gad
  if (!gadId && method === "POST") {
    return handleCreateGad(req, res);
  }

  // GET /api/gad-talk/gads/timeline - Get timeline feed
  if (gadId === "timeline" && method === "GET") {
    return handleGetTimeline(req, res);
  }

  // GET /api/gad-talk/gads/foryou - Get for-you feed
  if (gadId === "foryou" && method === "GET") {
    return handleGetForYouFeed(req, res);
  }

  // GET /api/gad-talk/gads/search - Search gads
  if (gadId === "search" && method === "GET") {
    return handleSearchGads(req, res);
  }

  // Routes with gad ID
  if (gadId && gadId !== "timeline" && gadId !== "foryou" && gadId !== "search") {
    req.params = { gadId };
    const subAction = segments[2];

    // No sub-action: GET, PUT, or DELETE /api/gad-talk/gads/:gadId
    if (!subAction) {
      if (method === "GET") return handleGetGad(req, res);
      if (method === "PUT") return handleUpdateGad(req, res);
      if (method === "DELETE") return handleDeleteGad(req, res);
    }

    switch (subAction) {
      case "like":
        if (method === "POST") return handleLikeGad(req, res);
        if (method === "DELETE") return handleUnlikeGad(req, res);
        break;

      case "regad":
        if (method === "POST") return handleRegad(req, res);
        if (method === "DELETE") return handleUnregad(req, res);
        break;

      case "bookmark":
        if (method === "POST") return handleBookmarkGad(req, res);
        if (method === "DELETE") return handleRemoveBookmark(req, res);
        break;

      case "reply":
        if (method === "POST") return handleCreateGad(req, res); // Same handler, uses replyTo
        break;

      case "replies":
        if (method === "GET") return handleGetReplies(req, res);
        break;

      default:
        break;
    }
  }

  res.status(HTTP_METHOD_NOT_ALLOWED).send(formatErrorResponse("Method not allowed"));
}

/**
 * Handle bookmarks routes
 */
async function handleBookmarksRoutes(req, res, method, _segments) {
  // GET /api/gad-talk/bookmarks - Get user's bookmarks
  if (method === "GET") {
    return handleGetBookmarks(req, res);
  }

  res.status(HTTP_METHOD_NOT_ALLOWED).send(formatErrorResponse("Method not allowed"));
}

/**
 * Handle notifications routes
 */
async function handleNotificationsRoutes(req, res, method, segments) {
  const notificationId = segments[1];

  // GET /api/gad-talk/notifications - Get notifications list
  if (!notificationId && method === "GET") {
    return handleGetNotifications(req, res);
  }

  // GET /api/gad-talk/notifications/unread/count - Get unread count
  if (notificationId === "unread" && segments[2] === "count" && method === "GET") {
    return handleGetUnreadCount(req, res);
  }

  // POST /api/gad-talk/notifications/read-all - Mark all as read
  if (notificationId === "read-all" && method === "POST") {
    return handleMarkAllRead(req, res);
  }

  // POST /api/gad-talk/notifications/:id/read - Mark single as read
  if (notificationId && segments[2] === "read" && method === "POST") {
    req.params = { notificationId };
    return handleMarkRead(req, res);
  }

  res.status(HTTP_METHOD_NOT_ALLOWED).send(formatErrorResponse("Method not allowed"));
}

/**
 * Handle hashtags routes
 */
async function handleHashtagsRoutes(req, res, method, segments) {
  const hashtag = segments[1];

  // GET /api/gad-talk/hashtags/trending - Get trending hashtags
  if (hashtag === "trending" && method === "GET") {
    return handleGetTrendingHashtags(req, res);
  }

  // GET /api/gad-talk/hashtags/:hashtag - Get gads by hashtag
  if (hashtag && method === "GET") {
    req.params = { hashtag };
    return handleGetGadsByHashtag(req, res);
  }

  res.status(HTTP_METHOD_NOT_ALLOWED).send(formatErrorResponse("Method not allowed"));
}

/**
 * Handle admin routes
 */
async function handleAdminRoutes(req, res, method, segments) {
  const action = segments[1];

  switch (action) {
    case "reset-db":
      if (method === "POST") return handleResetDb(req, res);
      break;

    case "db-status":
      if (method === "GET") return handleGetDbStatus(req, res);
      break;

    case "seed-demo-data":
      if (method === "POST") return handleSeedDemoData(req, res);
      break;

    case "init-db":
      if (method === "POST") return handleInitDb(req, res);
      break;

    case "logs":
      if (method === "GET") return handleGetLogs(req, res);
      break;

    case "metrics":
      if (method === "GET") return handleGetMetrics(req, res);
      break;

    case "chaos": {
      const chaosAction = segments[2];
      if (chaosAction === "config") {
        if (method === "GET") return handleGetChaosConfig(req, res);
        if (method === "PUT") return handleUpdateChaosConfig(req, res);
      } else if (chaosAction === "enable" && method === "POST") {
        return handleEnableChaos(req, res);
      } else if (chaosAction === "disable" && method === "POST") {
        return handleDisableChaos(req, res);
      }
      break;
    }

    default:
      break;
  }

  res.status(HTTP_METHOD_NOT_ALLOWED).send(formatErrorResponse("Method not allowed"));
}

// ==================== INITIALIZATION ====================

/**
 * Initialize GadTalk module
 * Called on application startup
 */
async function initializeGadTalkModule() {
  try {
    logDebug("Initializing GadTalk module...");
    await initializeAllGadTalkDatabases();
    logDebug("GadTalk module initialized successfully");
  } catch (error) {
    logError("Failed to initialize GadTalk module:", error);
    throw error;
  }
}

// ==================== EXPORTS ====================

module.exports = {
  handleGadTalk,
  initializeGadTalkModule,
};
