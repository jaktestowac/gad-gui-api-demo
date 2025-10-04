const fs = require("fs");
const path = require("path");
const { logDebug, logTrace, logError } = require("../../helpers/logger-api");
const { areIdsEqual, areStringsEqualIgnoringCase } = require("../../helpers/compare.helpers");

// Database paths
const DB_PATH = path.join(__dirname, "../../db/bug-hatch-db-tmp.json");
const AUDIT_DB_PATH = path.join(__dirname, "../../db/bug-hatch-audit-db-tmp.json");
const DEMO_DB_PATH = path.join(__dirname, "../../db/bug-hatch-demo-db-tmp.json");

// In-memory mutex for atomic operations
const dbLock = {
  locked: false,
  queue: [],
};

// Separate lock for audit database
const auditDbLock = {
  locked: false,
  queue: [],
};

/**
 * Acquire lock for database operations
 * @returns {Promise<Function>} Release function
 */
function acquireBugHatchLock() {
  return new Promise((resolve) => {
    if (!dbLock.locked) {
      dbLock.locked = true;
      resolve(() => {
        dbLock.locked = false;
        if (dbLock.queue.length > 0) {
          const next = dbLock.queue.shift();
          next();
        }
      });
    } else {
      dbLock.queue.push(() => {
        dbLock.locked = true;
        resolve(() => {
          dbLock.locked = false;
          if (dbLock.queue.length > 0) {
            const next = dbLock.queue.shift();
            next();
          }
        });
      });
    }
  });
}

/**
 * Read the entire BugHatch database
 * @returns {Object} Database object
 */
function readBugHatchDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      logError("BugHatch DB file not found, creating new one");
      const emptyDb = {
        users: [],
        projects: [],
        issues: [],
        comments: [],
        attachments: [],
        filters: [],
        audit: [],
        outbox: [],
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(emptyDb, null, 2));
      return emptyDb;
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    logError("Error reading BugHatch DB:", error);
    throw error;
  }
}

/**
 * Write to BugHatch database atomically (using temp file + rename)
 * @param {Object} data - Complete database object
 */
async function writeBugHatchDb(data) {
  const release = await acquireBugHatchLock();
  try {
    const tmpPath = `${DB_PATH}.tmp`;

    // Write to temp file first
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");

    // Atomic rename
    fs.renameSync(tmpPath, DB_PATH);

    logTrace("BugHatch DB written successfully");
  } catch (error) {
    logError("Error writing BugHatch DB:", error);
    throw error;
  } finally {
    release();
  }
}

/**
 * Read the demo database (read-only)
 * @returns {Object} Demo database object
 */
function readBugHatchDemoDb() {
  try {
    if (!fs.existsSync(DEMO_DB_PATH)) {
      logError("Demo BugHatch DB file not found");
      return {
        users: [],
        projects: [],
        issues: [],
        comments: [],
        attachments: [],
        filters: [],
        outbox: [],
      };
    }
    const data = fs.readFileSync(DEMO_DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    logError("Error reading Demo BugHatch DB:", error);
    throw error;
  }
}

/**
 * Acquire lock for audit database operations
 * @returns {Promise<Function>} Release function
 */
function acquireAuditLock() {
  return new Promise((resolve) => {
    if (!auditDbLock.locked) {
      auditDbLock.locked = true;
      resolve(() => {
        auditDbLock.locked = false;
        if (auditDbLock.queue.length > 0) {
          const next = auditDbLock.queue.shift();
          next();
        }
      });
    } else {
      auditDbLock.queue.push(() => {
        auditDbLock.locked = true;
        resolve(() => {
          auditDbLock.locked = false;
          if (auditDbLock.queue.length > 0) {
            const next = auditDbLock.queue.shift();
            next();
          }
        });
      });
    }
  });
}

/**
 * Read the audit database
 * @returns {Object} Audit database object
 */
function readAuditDb() {
  try {
    if (!fs.existsSync(AUDIT_DB_PATH)) {
      logError("Audit BugHatch DB file not found, creating new one");
      const emptyDb = {
        audit: [],
      };
      fs.writeFileSync(AUDIT_DB_PATH, JSON.stringify(emptyDb, null, 2));
      return emptyDb;
    }
    const data = fs.readFileSync(AUDIT_DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    logError("Error reading Audit BugHatch DB:", error);
    throw error;
  }
}

/**
 * Write to audit database atomically (using temp file + rename)
 * @param {Object} data - Complete audit database object
 */
async function writeAuditDb(data) {
  const release = await acquireAuditLock();
  try {
    const tmpPath = `${AUDIT_DB_PATH}.tmp`;

    // Write to temp file first
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");

    // Atomic rename
    fs.renameSync(tmpPath, AUDIT_DB_PATH);

    logTrace("Audit BugHatch DB written successfully");
  } catch (error) {
    logError("Error writing Audit BugHatch DB:", error);
    throw error;
  } finally {
    release();
  }
}

// ==================== DATABASE INITIALIZATION ====================

/**
 * Initialize BugHatch database with demo data from demo-db
 * This copies data from the demo database as initial seed data
 * @returns {Promise<Object>} Initialized database object
 */
async function initializeBugHatchDb() {
  try {
    // Check if database already exists
    if (fs.existsSync(DB_PATH)) {
      logTrace("> BugHatch DB already exists, skipping initialization");
      return readBugHatchDb();
    }

    logTrace("Initializing BugHatch database with demo data...");

    // Read demo database as template
    const demoDb = readBugHatchDemoDb();

    // Create initial database with demo data
    const initialDb = {
      users: demoDb.users || [],
      projects: demoDb.projects || [],
      issues: demoDb.issues || [],
      comments: demoDb.comments || [],
      attachments: demoDb.attachments || [],
      filters: demoDb.filters || [],
      audit: [], // Start with empty audit (will be in separate file)
      outbox: demoDb.outbox || [],
    };

    // Write to database
    await writeBugHatchDb(initialDb);

    logDebug("BugHatch database initialized successfully");
    return initialDb;
  } catch (error) {
    logError("Error initializing BugHatch DB:", error);
    throw error;
  }
}

/**
 * Initialize audit database
 * @returns {Promise<Object>} Initialized audit database object
 */
async function initializeBugHatchAuditDb() {
  try {
    // Check if audit database already exists
    if (fs.existsSync(AUDIT_DB_PATH)) {
      logTrace("> Audit BugHatch DB already exists, skipping initialization");
      return readAuditDb();
    }

    logTrace("> Initializing Audit BugHatch database...");

    // Create empty audit database
    const initialAuditDb = {
      audit: [],
    };

    // Write to database
    await writeAuditDb(initialAuditDb);

    logTrace("> Audit BugHatch database initialized successfully");
    return initialAuditDb;
  } catch (error) {
    logError("Error initializing Audit BugHatch DB:", error);
    throw error;
  }
}

/**
 * Initialize all BugHatch databases if they don't exist
 * Called on application startup
 * @returns {Promise<void>}
 */
async function initializeAllBugHatchDatabases() {
  try {
    logTrace("> Checking BugHatch Module databases...");

    // Initialize main database if needed
    await initializeBugHatchDb();

    // Initialize audit database if needed
    await initializeBugHatchAuditDb();

    logTrace("> All BugHatch Module databases ready");
  } catch (error) {
    logError("Error initializing databases:", error);
    throw error;
  }
}

/**
 * Force re-initialize database with demo data (admin function)
 * WARNING: This will overwrite existing data!
 * @param {boolean} force - Must be true to actually perform the reset
 * @returns {Promise<Object>} Result object
 */
async function resetBugHatchDatabaseWithDemoData() {
  try {
    logDebug("Force resetting BugHatch database with demo data...");

    // Read demo database
    const demoDb = readBugHatchDemoDb();

    // Create database with demo data
    const resetDb = {
      users: demoDb.users || [],
      projects: demoDb.projects || [],
      issues: demoDb.issues || [],
      comments: demoDb.comments || [],
      attachments: demoDb.attachments || [],
      filters: demoDb.filters || [],
      audit: [],
      outbox: demoDb.outbox || [],
    };

    // Overwrite database
    await writeBugHatchDb(resetDb);

    // Reset audit database
    await writeAuditDb({ audit: [] });

    logDebug("Database reset completed successfully");

    return {
      success: true,
      message: "Database reset with demo data",
      stats: {
        users: resetDb.users.length,
        projects: resetDb.projects.length,
        issues: resetDb.issues.length,
        comments: resetDb.comments.length,
        filters: resetDb.filters.length,
      },
    };
  } catch (error) {
    logError("Error resetting database:", error);
    throw error;
  }
}

// ==================== AUDIT OPERATIONS ====================

// ==================== USER OPERATIONS ====================

/**
 * Get all BugHatch users
 * @returns {Array} Array of users
 */
function bugHatchUsersDb() {
  return readBugHatchDb().users || [];
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Object|undefined} User object or undefined
 */
function findBugHatchUserById(userId) {
  const users = bugHatchUsersDb();
  return users.find((user) => areIdsEqual(user.id, userId));
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Object|undefined} User object or undefined
 */
function findBugHatchUserByEmail(email) {
  const users = bugHatchUsersDb();
  return users.find((user) => areStringsEqualIgnoringCase(user.email, email));
}

/**
 * Create a new BugHatch user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
async function createBugHatchUser(userData) {
  const db = readBugHatchDb();

  // Check if user already exists
  const existingUser = db.users.find((u) => areStringsEqualIgnoringCase(u.email, userData.email));
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const newUser = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    password: userData.password,
    role: userData.role || "member",
    createdAt: userData.createdAt || new Date().toISOString(),
    lastLoginAt: null,
  };

  db.users.push(newUser);
  await writeBugHatchDb(db);

  logTrace("BugHatch user created:", { id: newUser.id, email: newUser.email });
  return newUser;
}

/**
 * Update BugHatch user's last login time
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
async function updateBugHatchUserLastLogin(userId) {
  const db = readBugHatchDb();
  const userIndex = db.users.findIndex((u) => areIdsEqual(u.id, userId));

  if (userIndex === -1) {
    throw new Error("User not found");
  }

  db.users[userIndex].lastLoginAt = new Date().toISOString();
  await writeBugHatchDb(db);

  return db.users[userIndex];
}

/**
 * Update BugHatch user data
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
async function updateBugHatchUser(userId, updates) {
  const db = readBugHatchDb();
  const userIndex = db.users.findIndex((u) => areIdsEqual(u.id, userId));

  if (userIndex === -1) {
    throw new Error("User not found");
  }

  db.users[userIndex] = { ...db.users[userIndex], ...updates };
  await writeBugHatchDb(db);

  return db.users[userIndex];
}

// ==================== PROJECT OPERATIONS ====================

/**
 * Get all BugHatch projects
 * @returns {Array} Array of projects
 */
function bugHatchProjectsDb() {
  return readBugHatchDb().projects || [];
}

/**
 * Find project by ID
 * @param {string} projectId - Project ID
 * @returns {Object|undefined} Project object or undefined
 */
function findBugHatchProjectById(projectId) {
  const projects = bugHatchProjectsDb();
  return projects.find((project) => areIdsEqual(project.id, projectId));
}

/**
 * Find project by key
 * @param {string} key - Project key
 * @returns {Object|undefined} Project object or undefined
 */
function findBugHatchProjectByKey(key) {
  const projects = bugHatchProjectsDb();
  return projects.find((project) => areStringsEqualIgnoringCase(project.key, key));
}

// ==================== AUDIT OPERATIONS ====================

/**
 * Create an audit log entry
 * @param {Object} auditData - Audit data
 * @returns {Promise<Object>} Created audit entry
 */
async function createBugHatchAuditLog(auditData) {
  const db = readAuditDb();

  const auditEntry = {
    id: auditData.id || `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    actorUserId: auditData.actorUserId,
    eventType: auditData.eventType,
    payloadObject: auditData.payloadObject || {},
    createdAt: auditData.createdAt || new Date().toISOString(),
  };

  db.audit.push(auditEntry);
  await writeAuditDb(db);

  logTrace("BugHatch audit log created:", { id: auditEntry.id, eventType: auditEntry.eventType });
  return auditEntry;
}

/**
 * Get audit logs with optional filters
 * @param {Object} filters - Filter criteria
 * @returns {Array} Array of audit entries
 */
function getBugHatchAuditLogs(filters = {}) {
  const db = readAuditDb();
  let logs = db.audit || [];

  if (filters.userId) {
    logs = logs.filter((log) => areIdsEqual(log.actorUserId, filters.userId));
  }

  if (filters.eventType) {
    logs = logs.filter((log) => log.eventType === filters.eventType);
  }

  if (filters.limit) {
    logs = logs.slice(0, filters.limit);
  }

  return logs;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate a deterministic unique ID
 * @param {string} prefix - ID prefix
 * @returns {string} Generated ID
 */
function generateBugHatchId(prefix = "bh") {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

module.exports = {
  // Database core
  readBugHatchDb,
  writeBugHatchDb,
  acquireBugHatchLock,
  readBugHatchDemoDb,

  // Database initialization
  initializeBugHatchDb,
  initializeBugHatchAuditDb,
  initializeAllBugHatchDatabases,
  resetBugHatchDatabaseWithDemoData,

  // Users
  bugHatchUsersDb,
  findBugHatchUserById,
  findBugHatchUserByEmail,
  createBugHatchUser,
  updateBugHatchUserLastLogin,
  updateBugHatchUser,

  // Projects
  bugHatchProjectsDb,
  findBugHatchProjectById,
  findBugHatchProjectByKey,

  // Audit
  createBugHatchAuditLog,
  getBugHatchAuditLogs,

  // Helpers
  generateBugHatchId,
};
