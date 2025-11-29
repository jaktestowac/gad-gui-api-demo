"use strict";

const {
  getUserFiltersService,
  getFilterByIdService,
  createFilterService,
  updateFilterService,
  deleteFilterService,
} = require("./filters.service");
const { formatResponse, formatErrorResponse } = require("../../helpers/api-helpers");
const { HTTP_OK, HTTP_CREATED, HTTP_NOT_FOUND, HTTP_BAD_REQUEST } = require("../../helpers/response.helpers");

/**
 * GET /api/bug-hatch/filters/my
 * Get all saved filters for the authenticated user
 */
async function handleGetMyFilters(req, res) {
  try {
    const filters = await getUserFiltersService(req.bhUser);
    res.status(HTTP_OK).json(formatResponse(filters));
  } catch (err) {
    res.status(500).json(formatErrorResponse("Failed to fetch filters"));
  }
}

/**
 * GET /api/bug-hatch/filters/:fid
 * Get a specific filter by ID
 */
async function handleGetFilterById(req, res, filterId) {
  try {
    const filter = await getFilterByIdService(filterId, req.bhUser);
    if (!filter) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Filter not found"));
    }
    res.status(HTTP_OK).json(formatResponse(filter));
  } catch (err) {
    res.status(500).json(formatErrorResponse("Failed to fetch filter"));
  }
}

/**
 * POST /api/bug-hatch/filters
 * Create a new saved filter
 */
async function handleCreateFilter(req, res) {
  try {
    const { name, projectId, criteria } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Filter name is required"));
    }

    if (!criteria || typeof criteria !== "object") {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Filter criteria is required"));
    }

    const filter = await createFilterService(
      {
        name: name.trim(),
        projectId: projectId || null,
        criteria,
      },
      req.bhUser
    );

    res.status(HTTP_CREATED).json(formatResponse(filter));
  } catch (err) {
    res.status(500).json(formatErrorResponse("Failed to create filter"));
  }
}

/**
 * PATCH /api/bug-hatch/filters/:fid
 * Update an existing filter
 */
async function handleUpdateFilter(req, res, filterId) {
  try {
    const { name, projectId, criteria } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Invalid filter name"));
      }
      updateData.name = name.trim();
    }

    if (projectId !== undefined) {
      updateData.projectId = projectId;
    }

    if (criteria !== undefined) {
      if (typeof criteria !== "object") {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Invalid filter criteria"));
      }
      updateData.criteria = criteria;
    }

    const filter = await updateFilterService(filterId, updateData, req.bhUser);
    if (!filter) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Filter not found"));
    }

    res.status(HTTP_OK).json(formatResponse(filter));
  } catch (err) {
    res.status(500).json(formatErrorResponse("Failed to update filter"));
  }
}

/**
 * DELETE /api/bug-hatch/filters/:fid
 * Delete a saved filter
 */
async function handleDeleteFilter(req, res, filterId) {
  try {
    const deleted = await deleteFilterService(filterId, req.bhUser);
    if (!deleted) {
      return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Filter not found"));
    }
    res.status(HTTP_OK).json(formatResponse({ deleted: true }));
  } catch (err) {
    res.status(500).json(formatErrorResponse("Failed to delete filter"));
  }
}

module.exports = {
  handleGetMyFilters,
  handleGetFilterById,
  handleCreateFilter,
  handleUpdateFilter,
  handleDeleteFilter,
};
