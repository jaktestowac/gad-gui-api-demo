"use strict";

/**
 * Standard API response formatting helpers for consistent response structure.
 * All bug-hatch endpoints should use these helpers.
 */

/**
 * Format a successful response
 * @param {*} data - The response data
 * @returns {object} Formatted response { ok: true, data }
 */
function formatResponse(data) {
  return { ok: true, data };
}

/**
 * Format an error response
 * @param {string} message - Error message
 * @param {*} details - Optional error details
 * @returns {object} Formatted error response { ok: false, error: { message, details? } }
 */
function formatErrorResponse(message, details = undefined) {
  const error = { message };
  if (details !== undefined) {
    error.details = details;
  }
  return { ok: false, error };
}

module.exports = {
  formatResponse,
  formatErrorResponse,
};
