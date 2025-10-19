const {
  initializeAllDatabases,
  resetDatabaseWithDemoData,
  readBugHatchDb,
  readBugHatchAuditDb,
} = require("../db-bug-hatch.operations");
const { logDebug, logError } = require("../../../helpers/logger-api");

// ==================== DATABASE INITIALIZATION ====================

/**
 * Initialize all BugHatch databases
 * @returns {Promise<object>} { success: boolean, message?: string, error?: string }
 */
async function initializeDatabases() {
  try {
    await initializeAllDatabases();
    return { success: true, message: "Databases initialized successfully" };
  } catch (error) {
    logError("Failed to initialize databases:", error);
    return { success: false, error: error.message || "Database initialization failed" };
  }
}

/**
 * Reset database with demo data
 * @param {boolean} force - Force reset flag (must be true)
 * @returns {Promise<object>} { success: boolean, message?: string, stats?: object, error?: string }
 */
async function resetDatabase(force) {
  if (force !== true) {
    return {
      success: false,
      error: "Force reset flag is required. Set force: true in request body to proceed.",
    };
  }

  const result = await resetDatabaseWithDemoData(force);
  if (result.demo) {
    return { success: false, error: "Cannot reset demo data" };
  }
  logDebug("Database reset completed:", result);
  return result;
}

/**
 * Get database status and statistics
 * @returns {Promise<object>} { success: boolean, stats?: object, error?: string }
 */
async function getDatabaseStatus() {
  try {
    const mainDb = readBugHatchDb();
    const auditDb = readBugHatchAuditDb();

    const stats = {
      users: mainDb.users ? mainDb.users.length : 0,
      projects: mainDb.projects ? mainDb.projects.length : 0,
      issues: mainDb.issues ? mainDb.issues.length : 0,
      comments: mainDb.comments ? mainDb.comments.length : 0,
      auditLogs: auditDb.auditLogs ? auditDb.auditLogs.length : 0,
      timestamp: new Date().toISOString(),
    };

    logDebug("Database status retrieved:", stats);

    return { success: true, stats };
  } catch (error) {
    logError("Failed to get database status:", error);
    return { success: false, error: error.message || "Failed to retrieve database status" };
  }
}

module.exports = {
  initializeDatabases,
  resetDatabase,
  getDatabaseStatus,
};
