"use strict";

const { getMetricsService } = require("./metrics.service");
const { formatResponse, formatErrorResponse } = require("../../helpers/api-helpers");
const { HTTP_OK, HTTP_UNAUTHORIZED } = require("../../helpers/response.helpers");
const { verifyToken } = require("../../helpers/jwtauth");

/**
 * Get current user from cookie token
 */
function getCurrentUser(req) {
  const token = req.cookies["bug-hatch-token"];
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded instanceof Error) return null;
  const base = { id: decoded.userId, role: decoded.role, email: decoded.email, isDemo: decoded.isDemo === true };
  if (req.bugHatchForceDemo === true) {
    base.isDemo = true;
  }
  return base;
}

/**
 * GET /api/bug-hatch/metrics
 * Get metrics for all accessible projects or a specific project
 * Query params:
 *   - projectId: optional, filter by specific project
 */
async function handleGetMetrics(req, res) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(HTTP_UNAUTHORIZED).json(formatErrorResponse("Authentication required"));
    }
    const projectId = req.query.projectId || null;
    const metrics = await getMetricsService(user, projectId);
    res.status(HTTP_OK).json(formatResponse(metrics));
  } catch (err) {
    console.error("Metrics error:", err);
    res.status(500).json(formatErrorResponse("Failed to fetch metrics"));
  }
}

module.exports = {
  handleGetMetrics,
};
