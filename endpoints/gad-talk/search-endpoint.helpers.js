/**
 * GadTalk Search Endpoint Helpers
 * Handles search endpoints including suggestions and combined search
 */

const { logError } = require("../../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST } = require("../../helpers/response.helpers");
const { formatErrorResponse } = require("../../helpers/helpers");
const searchService = require("./services/search.service");
const trendingService = require("./services/trending.service");

/**
 * Get search suggestions (autocomplete)
 * GET /api/gad-talk/search/suggestions?q=query
 */
async function handleSearchSuggestions(req, res) {
  try {
    const userId = req.gadTalkUserId;
    const query = req.query.q || "";
    const limit = parseInt(req.query.limit) || 8;

    if (!query.trim()) {
      // Return empty suggestions for empty query
      return res.status(HTTP_OK).json({
        suggestions: [],
        query: "",
      });
    }

    const { suggestions } = searchService.getSearchSuggestions(query, userId, { limit });

    res.status(HTTP_OK).json({
      suggestions,
      query: query.trim(),
    });
  } catch (error) {
    logError("[GadTalk] Error getting search suggestions:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Failed to get suggestions"));
  }
}

/**
 * Combined search across all types
 * GET /api/gad-talk/search?q=query&type=all|users|gads|hashtags
 */
async function handleCombinedSearch(req, res) {
  try {
    const userId = req.gadTalkUserId;
    const query = req.query.q || "";
    const type = req.query.type || "all";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!query.trim()) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Search query is required"));
    }

    let result;

    switch (type) {
      case "users":
        result = searchService.searchUsers(query.trim(), userId, { page, limit });
        res.status(HTTP_OK).json({
          type: "users",
          users: result.users,
          total: result.total,
          hasMore: result.hasMore,
          page,
          limit,
          query: query.trim(),
        });
        break;

      case "gads":
        result = searchService.searchGads(query.trim(), userId, { page, limit });
        res.status(HTTP_OK).json({
          type: "gads",
          gads: result.gads,
          total: result.total,
          hasMore: result.hasMore,
          page,
          limit,
          query: query.trim(),
        });
        break;

      case "hashtags":
        result = searchService.searchHashtags(query.trim(), { page, limit });
        res.status(HTTP_OK).json({
          type: "hashtags",
          hashtags: result.hashtags,
          total: result.total,
          hasMore: result.hasMore,
          page,
          limit,
          query: query.trim(),
        });
        break;

      case "all":
      default:
        result = searchService.searchAll(query.trim(), userId, { limit: 5 });
        res.status(HTTP_OK).json({
          type: "all",
          users: result.users,
          gads: result.gads,
          hashtags: result.hashtags,
          query: query.trim(),
        });
        break;
    }
  } catch (error) {
    logError("[GadTalk] Error in combined search:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Failed to search"));
  }
}

/**
 * Get explore page data
 * GET /api/gad-talk/explore
 */
async function handleGetExplore(req, res) {
  try {
    const userId = req.gadTalkUserId;

    const data = trendingService.getExploreData(userId, {
      trendingLimit: 10,
      suggestionsLimit: 5,
      gadsLimit: 10,
    });

    res.status(HTTP_OK).json({
      trending: data.trending,
      suggestedUsers: data.suggestedUsers,
      popularGads: data.popularGads,
    });
  } catch (error) {
    logError("[GadTalk] Error getting explore data:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Failed to get explore data"));
  }
}

/**
 * Get explore topics
 * GET /api/gad-talk/explore/topics
 */
async function handleGetExploreTopics(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const topics = trendingService.getExploreTopics({ limit });

    res.status(HTTP_OK).json({ topics });
  } catch (error) {
    logError("[GadTalk] Error getting explore topics:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Failed to get topics"));
  }
}

/**
 * Get popular gads for explore
 * GET /api/gad-talk/explore/popular
 */
async function handleGetPopularGadsSearch(req, res) {
  try {
    const userId = req.gadTalkUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const window = req.query.window || "day";

    const result = trendingService.getPopularGads(userId, { page, limit, window });

    res.status(HTTP_OK).json({
      gads: result.gads,
      total: result.total,
      hasMore: result.hasMore,
      page,
      limit,
      window,
    });
  } catch (error) {
    logError("[GadTalk] Error getting popular gads:", error);
    res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Failed to get popular gads"));
  }
}

module.exports = {
  handleSearchSuggestions,
  handleCombinedSearch,
  handleGetExplore,
  handleGetExploreTopics,
  handleGetPopularGadsSearch,
};
