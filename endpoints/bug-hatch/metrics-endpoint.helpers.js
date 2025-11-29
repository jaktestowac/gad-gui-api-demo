"use strict";

const { getMetricsService } = require("./metrics.service");
const { formatResponse, formatErrorResponse } = require("../../helpers/api-helpers");
const { HTTP_OK } = require("../../helpers/response.helpers");

/**
 * GET /api/bug-hatch/metrics
 * Get metrics for all accessible projects
 */
async function handleGetMetrics(req, res) {
  try {
    const metrics = await getMetricsService(req.bhUser);
    res.status(HTTP_OK).json(formatResponse(metrics));
  } catch (err) {
    res.status(500).json(formatErrorResponse("Failed to fetch metrics"));
  }
}

module.exports = {
  handleGetMetrics,
};
