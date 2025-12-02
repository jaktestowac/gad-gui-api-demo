"use strict";

const { readBugHatchDb, writeBugHatchDb, generateId } = require("./db-bug-hatch.operations");

/**
 * Get all saved filters for the current user
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<Array>} Array of saved filters
 */
async function getUserFiltersService(currentUser) {
  const db = await readBugHatchDb();
  const filters = db.filters || [];
  return filters.filter((f) => f.userId === currentUser.id);
}

/**
 * Get a specific filter by ID
 * @param {string} filterId - Filter ID
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object|null>} Filter object or null
 */
async function getFilterByIdService(filterId, currentUser) {
  const db = await readBugHatchDb();
  const filters = db.filters || [];
  const filter = filters.find((f) => f.id === filterId);
  if (!filter) return null;
  if (filter.userId !== currentUser.id) return null;
  return filter;
}

/**
 * Create a new saved filter
 * @param {object} filterData - Filter data { name, projectId, criteria }
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} Created filter object
 */
async function createFilterService(filterData, currentUser) {
  const db = await readBugHatchDb();
  if (!db.filters) {
    db.filters = [];
  }

  const newFilter = {
    id: generateId(),
    userId: currentUser.id,
    name: filterData.name,
    projectId: filterData.projectId || null,
    criteria: filterData.criteria || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.filters.push(newFilter);
  await writeBugHatchDb(db);
  return newFilter;
}

/**
 * Update an existing filter
 * @param {string} filterId - Filter ID
 * @param {object} updateData - Fields to update
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object|null>} Updated filter or null if not found/unauthorized
 */
async function updateFilterService(filterId, updateData, currentUser) {
  const db = await readBugHatchDb();
  if (!db.filters) {
    db.filters = [];
  }

  const filterIndex = db.filters.findIndex((f) => f.id === filterId);
  if (filterIndex === -1) return null;

  const filter = db.filters[filterIndex];
  if (filter.userId !== currentUser.id) return null;

  const allowedFields = ["name", "criteria", "projectId"];
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filter[field] = updateData[field];
    }
  }
  filter.updatedAt = new Date().toISOString();

  db.filters[filterIndex] = filter;
  await writeBugHatchDb(db);
  return filter;
}

/**
 * Delete a saved filter
 * @param {string} filterId - Filter ID
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<boolean>} True if deleted, false if not found/unauthorized
 */
async function deleteFilterService(filterId, currentUser) {
  const db = await readBugHatchDb();
  if (!db.filters) {
    return false;
  }

  const filterIndex = db.filters.findIndex((f) => f.id === filterId);
  if (filterIndex === -1) return false;

  const filter = db.filters[filterIndex];
  if (filter.userId !== currentUser.id) return false;

  db.filters.splice(filterIndex, 1);
  await writeBugHatchDb(db);
  return true;
}

module.exports = {
  getUserFiltersService,
  getFilterByIdService,
  createFilterService,
  updateFilterService,
  deleteFilterService,
};
