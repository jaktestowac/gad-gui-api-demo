/**
 * GadTalk Analytics Endpoint Helpers
 * Provides chart data for user analytics
 */

const dbOps = require("./db-gad-talk.operations");
const { logError } = require("../../helpers/logger-api");
const {
  HTTP_OK,
  HTTP_NOT_FOUND,
  HTTP_FORBIDDEN,
  HTTP_INTERNAL_SERVER_ERROR,
} = require("../../helpers/response.helpers");
const { formatErrorResponse } = require("../../helpers/helpers");

function parseNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function ensureUserExists(userId) {
  const user = dbOps.getUserById(userId);
  return user || null;
}

function ensureChartsEnabled(res) {
  if (!dbOps.isFeatureEnabled("charts")) {
    res.status(HTTP_FORBIDDEN).json(formatErrorResponse("Feature disabled"));
    return false;
  }
  return true;
}

async function handleGetActivityHeatmap(req, res) {
  try {
    if (!ensureChartsEnabled(res)) return;
    const { userId } = req.params;
    const user = ensureUserExists(userId);
    if (!user) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("User not found"));
    }

    const days = parseNumber(req.query.days, 7, 366, 365);
    const data = dbOps.getUserActivityHeatmap(userId, { days });

    res.status(HTTP_OK).json({
      userId,
      days,
      heatmap: data,
    });
  } catch (error) {
    logError("[GadTalk] Error getting activity heatmap:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get activity heatmap"));
  }
}

async function handleGetEngagementTimeline(req, res) {
  try {
    if (!ensureChartsEnabled(res)) return;
    const { userId } = req.params;
    const user = ensureUserExists(userId);
    if (!user) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("User not found"));
    }

    const days = parseNumber(req.query.days, 7, 180, 30);
    const data = dbOps.getUserEngagementTimeline(userId, { days });

    res.status(HTTP_OK).json({
      userId,
      days,
      timeline: data,
    });
  } catch (error) {
    logError("[GadTalk] Error getting engagement timeline:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get engagement timeline"));
  }
}

async function handleGetFollowerGrowth(req, res) {
  try {
    if (!ensureChartsEnabled(res)) return;
    const { userId } = req.params;
    const user = ensureUserExists(userId);
    if (!user) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("User not found"));
    }

    const weeks = parseNumber(req.query.weeks, 4, 52, 12);
    const data = dbOps.getUserFollowerGrowth(userId, { weeks });

    res.status(HTTP_OK).json({
      userId,
      weeks,
      growth: data,
    });
  } catch (error) {
    logError("[GadTalk] Error getting follower growth:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get follower growth"));
  }
}

async function handleGetHashtagDistribution(req, res) {
  try {
    if (!ensureChartsEnabled(res)) return;
    const { userId } = req.params;
    const user = ensureUserExists(userId);
    if (!user) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("User not found"));
    }

    const limit = parseNumber(req.query.limit, 3, 12, 8);
    const data = dbOps.getUserHashtagDistribution(userId, { limit });

    res.status(HTTP_OK).json({
      userId,
      limit,
      hashtags: data,
    });
  } catch (error) {
    logError("[GadTalk] Error getting hashtag distribution:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Failed to get hashtag distribution"));
  }
}

module.exports = {
  handleGetActivityHeatmap,
  handleGetEngagementTimeline,
  handleGetFollowerGrowth,
  handleGetHashtagDistribution,
};
