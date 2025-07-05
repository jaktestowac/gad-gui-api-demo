const { formatErrorResponse } = require("../../../helpers/helpers");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_INTERNAL_SERVER_ERROR } = require("../../../helpers/response.helpers");
const { logDebug } = require("../../../helpers/logger-api");
const cookie = require("cookie");

// Import user memory system
const { userMemory, initUserMemory } = require("./user-memory");

// Import text processing utilities
const textProcessingUtils = require("./text-processing");

// Import behavior system
const { initializeBehaviors, behaviorRegistry } = require("./behaviors/behavior-manager");
const MessageContext = require("./behaviors/message-context");

// Initialize the behavior system on import
initializeBehaviors();

// In-memory storage for conversations and conversation analytics
const conversations = {};
const conversationAnalytics = {};

/**
 * Simple that responds to user messages
 * @param {string} message - The user's message
 * @param {string} conversationId - Unique identifier for the conversation
 * @returns {string} The response
 */
function generateAIResponse(message, conversationId) {
  // Initialize conversation history and analytics if they don't exist
  if (!conversations[conversationId]) {
    conversations[conversationId] = [];
    conversationAnalytics[conversationId] = {
      startTime: Date.now(),
      messageCount: 0,
      lastActiveTime: Date.now(),
      unknownTermContext: {}, // For tracking unknown term conversation state
    };
  }

  // Update analytics
  conversationAnalytics[conversationId].messageCount++;
  conversationAnalytics[conversationId].lastActiveTime = Date.now();

  // Extract userId from conversationId: 'conv_<userId>_<timestamp>_<random>'
  let userId = null;
  if (conversationId && conversationId.startsWith("conv_")) {
    const parts = conversationId.split("_");
    if (parts.length >= 3) {
      userId = parts[1];
    }
  }

  // Initialize or get user memory
  const userMem = initUserMemory(userId);
  // Create message context
  const context = new MessageContext(
    userId,
    conversationId,
    conversations[conversationId],
    userMem,
    conversationAnalytics[conversationId]
  );   // Restore the unknown term context if it exists and is recent (within 2 minutes)
  const unknownTermContext = conversationAnalytics[conversationId].unknownTermContext || {};
  if (unknownTermContext.term && !unknownTermContext.cleared && Date.now() - unknownTermContext.timestamp < 2 * 60 * 1000) {
    context.previousUnknownTerm = unknownTermContext.term;
    // Set isDefiningUnknownTerm to true to indicate this message is likely a definition response
    context.isDefiningUnknownTerm = true;
    logDebug(`[Nova] Restored previous unknown term context: "${unknownTermContext.term}"`, {
      userId,
      message,
      timestamp: unknownTermContext.timestamp,
      timeSince: Date.now() - unknownTermContext.timestamp,
      isDefiningUnknownTerm: context.isDefiningUnknownTerm,
    });
  }
  // Prepare message for processing
  context.prepareMessage(message, textProcessingUtils);

  // Diagnostic log before behavior processing
  if (context.previousUnknownTerm || context.unknownTerm) {
    logDebug(`[Nova] Pre-processing message context for term learning:`, {
      userId,
      message: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
      previousUnknownTerm: context.previousUnknownTerm,
      isDefiningUnknownTerm: context.isDefiningUnknownTerm,
      knownTerm: context.knownTerm,
      unknownTerm: context.unknownTerm,
    });
  }

  // Process message through behavior registry
  const response = behaviorRegistry.processMessage(message, context);
  // Preserve unknown term context for the next message
  if (context.unknownTerm) {
    // Store the current unknown term for the next message
    conversationAnalytics[conversationId].unknownTermContext = {
      term: context.unknownTerm,
      timestamp: Date.now(),
    };
    logDebug(`[Nova] Saved unknown term context for next message: "${context.unknownTerm}"`, {
      userId,
      conversationId,
    });
  } else if (context.previousUnknownTerm && context.isDefiningUnknownTerm) {
    // Clear the context after the user has defined the term
    conversationAnalytics[conversationId].unknownTermContext = { cleared: true };
    logDebug(`[Nova] Cleared unknown term context after definition was provided`, {
      userId,
      term: context.previousUnknownTerm,
      isDefiningUnknownTerm: context.isDefiningUnknownTerm,
      extractionAttempted: true,
    });
  } else if (context.knownTerm) {
    // Log that we had a known term
    logDebug(`[Nova] Known term detected: "${context.knownTerm}"`, {
      userId,
      message,
    });

    // Clear any previous unknown term context
    conversationAnalytics[conversationId].unknownTermContext = { cleared: true };
  } else if (context.previousUnknownTerm === null && context.isDefiningUnknownTerm === false) {
    // Clear the context when the user dismisses the term definition request
    conversationAnalytics[conversationId].unknownTermContext = { cleared: true };
    logDebug(`[Nova] Cleared unknown term context after user dismissal`, {
      userId,
      message: message.substring(0, 50),
    });
  }

  // Add response to history
  conversations[conversationId].push({ role: "assistant", content: response });

  // Smart conversation history management
  // Keep most recent messages and important context
  if (conversations[conversationId].length > 50) {
    // Keep first 10 messages (initial context)
    const initialMessages = conversations[conversationId].slice(0, 10);
    // Keep last 40 messages (recent context)
    const recentMessages = conversations[conversationId].slice(-40);
    // Combine for a total of 50 messages maximum
    conversations[conversationId] = [...initialMessages, ...recentMessages];
  }

  // Memory cleanup: Remove old conversations (older than 24 hours)
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  Object.keys(conversationAnalytics).forEach(cid => {
    if (now - conversationAnalytics[cid].lastActiveTime > maxAge) {
      delete conversations[cid];
      delete conversationAnalytics[cid];
      logDebug(`[Nova] Cleaned up old conversation: ${cid}`);
    }
  });

  return response;
}

/**
 * Retrieve user and conversation IDs from cookies
 * @param {Object} req - The request object
 * @returns {Object} - Object containing userId and conversationId
 */
function getUserAndConversationIdFromCookies(req) {
  let userId = null;
  let conversationId = null;
  if (req.headers.cookie) {
    const cookies = cookie.parse(req.headers.cookie);
    userId = cookies.novaUserId;
    conversationId = cookies.novaConversationId;
  }
  return { userId, conversationId };
}

/**
 * Handle a user message and generate a Nova response
 */
function handleMessage(req, res) {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid request body"));
    }

    // Try to get userId and conversationId from cookies if not provided in body
    let { message, conversationId, conversationName } = req.body;
    const cookieIds = getUserAndConversationIdFromCookies(req);
    if (!conversationId && cookieIds.conversationId) conversationId = cookieIds.conversationId;
    let userId = null;
    if (conversationId) {
      // Extract userId from conversationId (format: conv_<userId>_...)
      const parts = conversationId.split("_");
      if (parts.length >= 3) {
        userId = parts[1];
      }
    } else if (cookieIds.userId) {
      userId = cookieIds.userId;
    }

    // Validate message
    if (!message || typeof message !== 'string') {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Message is required and must be a string"));
    }

    // Sanitize message to prevent potential issues
    message = message.trim();
    if (message.length === 0) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Message cannot be empty"));
    }

    if (message.length > 1000) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Message is too long (max 1000 characters)"));
    }

    // If conversationId is missing, create a new one and set cookies
    if (!conversationId || !conversations[conversationId]) {
      // Only generate a new userId if not present or if it's an invalid fallback like 'user'
      if (!userId || userId === "user") {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      }
      conversationId = `conv_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      res.setHeader("Set-Cookie", [
        cookie.serialize("novaUserId", userId, {
          httpOnly: false,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "Lax",
        }),
        cookie.serialize("novaConversationId", conversationId, {
          httpOnly: false,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "Lax",
        }),
      ]);
      conversations[conversationId] = [];
      conversationAnalytics[conversationId] = {
        startTime: Date.now(),
        messageCount: 0,
        lastActiveTime: Date.now(),
        name: conversationName || "New Conversation",
        userId,
      };
    }

    // If conversation name is provided, store it
    if (conversationName && !conversationAnalytics[conversationId]?.name) {
      if (!conversationAnalytics[conversationId]) {
        conversationAnalytics[conversationId] = {
          startTime: Date.now(),
          messageCount: 0,
          lastActiveTime: Date.now(),
        };
      }
      conversationAnalytics[conversationId].name = conversationName;
    }

    // Generate AI response with error handling
    let response;
    try {
      response = generateAIResponse(message, conversationId);
    } catch (error) {
      logDebug("[Nova] Error generating AI response", {
        error: error.message,
        stack: error.stack,
        message: message.substring(0, 100),
        conversationId,
        userId
      });
      
      response = "I'm sorry, I encountered an error while processing your message. Please try again.";
    }

    // Validate response
    if (!response || typeof response !== 'string') {
      response = "I'm sorry, I couldn't generate a proper response. Please try again.";
    }

    return res.status(HTTP_OK).json({
      response,
      conversationId,
      conversationName: conversationAnalytics[conversationId]?.name,
    });
  } catch (error) {
    logDebug("[Nova] handleMessage", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to process message"));
  }
}

/**
 * Retrieve conversation history
 */
function getConversationHistory(req, res) {
  try {
    const { conversationId } = req.query;

    if (!conversationId) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Conversation ID is required"));
    }

    const history = conversations[conversationId] || [];

    return res.status(HTTP_OK).json({
      history,
      conversationId,
    });
  } catch (error) {
    logDebug("[Nova] getConversationHistory", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to retrieve conversation history"));
  }
}

/**
 * Clear conversation history
 */
function clearConversation(req, res) {
  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Conversation ID is required"));
    }

    if (conversations[conversationId]) {
      delete conversations[conversationId];
    }

    return res.status(HTTP_OK).json({
      message: "Conversation cleared successfully",
      conversationId,
    });
  } catch (error) {
    logDebug("[Nova] clearConversation", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to clear conversation"));
  }
}

/**
 * Rename a conversation
 */
function renameConversation(req, res) {
  try {
    const { conversationId, name } = req.body;

    if (!conversationId || !name) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Conversation ID and name are required"));
    }

    if (!conversationAnalytics[conversationId]) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Conversation not found"));
    }

    conversationAnalytics[conversationId].name = name;

    return res.status(HTTP_OK).json({
      message: "Conversation renamed successfully",
      conversationId,
      name,
    });
  } catch (error) {
    logDebug("[Nova] renameConversation", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to rename conversation"));
  }
}

/**
 * List all conversations for a user
 */
function listConversations(req, res) {
  try {
    // We can identify a user's conversations by looking at the prefix of the conversation IDs
    // This is a simple approach that works for our demo
    const { userId } = req.query;

    if (!userId) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("User ID is required"));
    }

    const userConversations = Object.keys(conversationAnalytics)
      .filter((cid) => cid.startsWith(`conv_${userId}`))
      .map((cid) => ({
        id: cid,
        name: conversationAnalytics[cid].name || "Unnamed Conversation",
        messageCount: conversationAnalytics[cid].messageCount,
        startTime: conversationAnalytics[cid].startTime,
        lastActiveTime: conversationAnalytics[cid].lastActiveTime,
      }));

    return res.status(HTTP_OK).json({
      conversations: userConversations,
    });
  } catch (error) {
    logDebug("[Nova] listConversations", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to list conversations"));
  }
}

/**
 * Get statistics about the Nova chat system
 */
function getStatistics(req, res) {
  try {
    const stats = {
      totalConversations: Object.keys(conversations).length,
      totalMessages: Object.values(conversationAnalytics).reduce((sum, conv) => sum + conv.messageCount, 0),
      activeConversations: Object.values(conversationAnalytics).filter(
        (conv) => Date.now() - conv.lastActiveTime < 3600000 // Active in the last hour
      ).length,
      avgMessagesPerConversation: 0,
    };

    if (stats.totalConversations > 0) {
      stats.avgMessagesPerConversation = (stats.totalMessages / stats.totalConversations).toFixed(2);
    }

    return res.status(HTTP_OK).json(stats);
  } catch (error) {
    logDebug("[Nova] getStatistics", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to get statistics"));
  }
}

/**
 * Clear all stored user memory
 */
function clearUserMemory(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("User ID is required"));
    }

    delete userMemory[userId];

    return res.status(HTTP_OK).json({
      message: "User memory cleared successfully",
      userId,
    });
  } catch (error) {
    logDebug("[Nova] clearUserMemory", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to clear user memory"));
  }
}

/**
 * Initialize a new chat session (userId + conversationId)
 * Sets HttpOnly cookies for userId and conversationId
 */
function initSession(req, res) {
  try {
    // If userId is provided in query, use it, otherwise generate a new one
    let userId = req.query.userId;
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    const conversationId = `conv_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Set cookies (not HttpOnly, path=/, 7 days expiry, camelCase names)
    res.setHeader("Set-Cookie", [
      cookie.serialize("novaUserId", userId, {
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "Lax",
      }),
      cookie.serialize("novaConversationId", conversationId, {
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "Lax",
      }),
    ]);

    // Initialize conversation and analytics
    conversations[conversationId] = [];
    conversationAnalytics[conversationId] = {
      startTime: Date.now(),
      messageCount: 0,
      lastActiveTime: Date.now(),
      name: "New Conversation",
      userId,
    };

    logDebug("[Nova] initSession", { userId, conversationId });

    return res.status(HTTP_OK).json({
      userId,
      conversationId,
      conversationName: "New Conversation",
    });
  } catch (error) {
    logDebug("[Nova] initSession", { error: error.message });
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to initialize session"));
  }
}

/**
 * Clear all conversations for a user
 */
function clearAllConversations(userId) {
  if (!userId) return false;
  let found = false;
  for (const convId in conversations) {
    if (conversations[convId].userId === userId) {
      delete conversations[convId];
      found = true;
    }
  }
  return found;
}

module.exports = {
  handleMessage,
  getConversationHistory,
  clearConversation,
  renameConversation,
  listConversations,
  getStatistics,
  clearUserMemory,
  initSession,
  clearAllConversations,
};
