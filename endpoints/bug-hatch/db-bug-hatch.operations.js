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

// ==================== ID GENERATION ====================
// note: generateBugHatchId implementation lives near bottom (single definition)

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
    const seed = require("./bug-hatch-demo-data.js");
    let shouldWrite = false;
    let demoDb;
    if (!fs.existsSync(DEMO_DB_PATH)) {
      // seed file
      demoDb = { ...seed };
      shouldWrite = true;
    } else {
      const data = fs.readFileSync(DEMO_DB_PATH, "utf8");
      demoDb = JSON.parse(data);
      // if empty or missing core arrays, re-seed
      if (!Array.isArray(demoDb.projects) || demoDb.projects.length === 0) {
        demoDb = { ...seed };
        shouldWrite = true;
      }
    }
    if (shouldWrite) {
      try {
        fs.writeFileSync(DEMO_DB_PATH, JSON.stringify(demoDb, null, 2));
        logTrace("> Demo DB seeded from bug-hatch-demo-data.js");
      } catch (e) {
        logError("Failed to write demo DB seed", e);
      }
    }
    return demoDb;
  } catch (error) {
    logError("Error reading Demo BugHatch DB:", error);
    return { users: [], projects: [], issues: [], comments: [], attachments: [], filters: [], outbox: [] };
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

    logTrace("Initializing BugHatch database (preferring init dataset)...");

    // Try loading init dataset (non-demo canonical starter data)
    let initData;
    try {
      // Use fresh require to allow edits during dev (delete cache)
      const initPath = require.resolve("./bug-hatch-init-data.js");
      delete require.cache[initPath];
      initData = require("./bug-hatch-init-data.js");
    } catch (e) {
      logTrace("No explicit init dataset or failed to load, will fallback to demo dataset", { error: e.message });
      initData = null;
    }

    const hasInitContent =
      initData &&
      ((Array.isArray(initData.users) && initData.users.length) ||
        (Array.isArray(initData.projects) && initData.projects.length) ||
        (Array.isArray(initData.issues) && initData.issues.length));

    let seedSourceName = "init";
    let seed = initData;
    if (!hasInitContent) {
      seedSourceName = "demo";
      const demoDb = readBugHatchDemoDb();
      seed = demoDb;
    }

    logTrace(`> Using ${seedSourceName} dataset for initial BugHatch DB seeding`);

    const initialDb = {
      users: (seed && seed.users) || [],
      projects: (seed && seed.projects) || [],
      issues: (seed && seed.issues) || [],
      comments: (seed && seed.comments) || [],
      attachments: (seed && seed.attachments) || [],
      filters: (seed && seed.filters) || [],
      audit: [],
      outbox: (seed && seed.outbox) || [],
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

// ==================== PROJECT OPERATIONS ====================

/**
 * Get all projects
 * @returns {Array}
 */
function bugHatchProjectsDb() {
  return readBugHatchDb().projects || [];
}

/**
 * Find project by id
 * @param {string} projectId
 */
function findBugHatchProjectById(projectId) {
  const projects = bugHatchProjectsDb();
  return projects.find((p) => areIdsEqual(p.id, projectId));
}

/**
 * Find project by key (case-insensitive)
 * @param {string} key
 */
function findBugHatchProjectByKey(key) {
  const projects = bugHatchProjectsDb();
  return projects.find((p) => areStringsEqualIgnoringCase(p.key, key));
}

/**
 * Persist updated db helper
 * @param {Function} mutator receives db and should modify
 */
async function mutateAndWriteDb(mutator) {
  const db = readBugHatchDb();
  await mutator(db);
  await writeBugHatchDb(db);
  return db;
}

/**
 * Create project
 * @param {Object} data {key,name,createdBy, workflow?}
 */
async function createBugHatchProject(data) {
  const id = data.id || generateBugHatchId("proj");
  const project = {
    id,
    key: data.key,
    name: data.name,
    members: data.members || (data.createdBy ? [data.createdBy] : []),
    archived: false,
    workflow: data.workflow || {
      statuses: ["Backlog", "In Progress", "Review", "Done"],
      transitions: {
        Backlog: ["In Progress"],
        "In Progress": ["Review", "Backlog"],
        Review: ["Done", "In Progress"],
        Done: [],
      },
    },
    createdAt: new Date().toISOString(),
  };

  await mutateAndWriteDb((db) => {
    // unique constraints: key
    if (db.projects.find((p) => areStringsEqualIgnoringCase(p.key, project.key))) {
      throw new Error("Project key already exists");
    }
    db.projects.push(project);
  });
  return project;
}

/**
 * Update project basic fields (name, archived, workflow)
 */
async function updateBugHatchProject(projectId, patch) {
  let updated;
  await mutateAndWriteDb((db) => {
    const idx = db.projects.findIndex((p) => areIdsEqual(p.id, projectId));
    if (idx === -1) throw new Error("Project not found");
    const current = db.projects[idx];
    updated = { ...current };
    if (patch.name !== undefined) {
      updated.name = patch.name;
    }
    if (patch.archived !== undefined) {
      updated.archived = !!patch.archived;
    }
    if (patch.workflow) {
      // basic validation: ensure statuses array and transitions object
      if (
        !Array.isArray(patch.workflow.statuses) ||
        typeof patch.workflow.transitions !== "object" ||
        patch.workflow.statuses.length === 0
      ) {
        throw new Error("Invalid workflow structure");
      }
      updated.workflow = patch.workflow;
    }
    db.projects[idx] = updated;
  });
  return updated;
}

/**
 * Add member to project
 */
async function addBugHatchProjectMember(projectId, userId) {
  let project;
  await mutateAndWriteDb((db) => {
    project = db.projects.find((p) => areIdsEqual(p.id, projectId));
    if (!project) throw new Error("Project not found");
    if (!project.members.includes(userId)) {
      project.members.push(userId);
    }
  });
  return project;
}

/**
 * Remove member
 */
async function removeBugHatchProjectMember(projectId, userId) {
  let project;
  await mutateAndWriteDb((db) => {
    project = db.projects.find((p) => areIdsEqual(p.id, projectId));
    if (!project) throw new Error("Project not found");
    project.members = project.members.filter((m) => m !== userId);
  });
  return project;
}

// (exports consolidated at bottom module.exports object)

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
// (duplicate project retrieval functions removed - defined earlier in file)

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

// ==================== ISSUE OPERATIONS (Phase 3) ====================

function bugHatchIssuesDb() {
  return readBugHatchDb().issues || [];
}

function findBugHatchIssueById(issueId) {
  return bugHatchIssuesDb().find((i) => areIdsEqual(i.id, issueId));
}

function findBugHatchIssuesByProjectId(projectId) {
  return bugHatchIssuesDb().filter((i) => areIdsEqual(i.projectId, projectId));
}

// Generate next issue key number for a project (e.g., PROJ-1)
function generateNextIssueKey(project) {
  const projectIssues = bugHatchIssuesDb().filter((i) => areIdsEqual(i.projectId, project.id));
  // Extract trailing number part after dash
  let max = 0;
  for (const issue of projectIssues) {
    const parts = issue.key.split("-");
    const n = parseInt(parts[1], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `${project.key}-${max + 1}`;
}

async function createBugHatchIssue(data) {
  let created;
  await mutateAndWriteDb((db) => {
    const project = db.projects.find((p) => areIdsEqual(p.id, data.projectId));
    if (!project) throw new Error("Project not found");
    const issueKey = generateNextIssueKey(project);
    const now = new Date().toISOString();
    created = {
      id: data.id || generateBugHatchId("iss"),
      key: issueKey,
      projectId: project.id,
      type: data.type || "task",
      title: data.title,
      description: data.description || "",
      status: data.status || project.workflow.statuses[0],
      priority: data.priority || "medium",
      assigneeId: data.assigneeId || null,
      labels: Array.isArray(data.labels) ? data.labels : [],
      storyPoints: data.storyPoints || null,
      attachments: [],
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
      archived: false,
    };
    db.issues.push(created);
  });
  return created;
}

async function updateBugHatchIssue(issueId, patch) {
  let updated;
  await mutateAndWriteDb((db) => {
    const idx = db.issues.findIndex((i) => areIdsEqual(i.id, issueId));
    if (idx === -1) throw new Error("Issue not found");
    const current = db.issues[idx];
    updated = { ...current };
    const mutableFields = [
      "title",
      "description",
      "priority",
      "assigneeId",
      "labels",
      "storyPoints",
      "archived",
      "status",
    ];
    for (const f of mutableFields) {
      if (patch[f] !== undefined) {
        updated[f] = patch[f];
      }
    }
    updated.updatedAt = new Date().toISOString();
    db.issues[idx] = updated;
  });
  return updated;
}

async function archiveBugHatchIssue(issueId) {
  return updateBugHatchIssue(issueId, { archived: true });
}

// Transition only adjusts status + updatedAt; validation happens in service layer
async function transitionBugHatchIssue(issueId, toStatus) {
  return updateBugHatchIssue(issueId, { status: toStatus });
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
  createBugHatchProject,
  updateBugHatchProject,
  addBugHatchProjectMember,
  removeBugHatchProjectMember,
  // internal helper (exported for services/tests)
  mutateAndWriteDb,

  // Issues
  bugHatchIssuesDb,
  findBugHatchIssueById,
  findBugHatchIssuesByProjectId,
  createBugHatchIssue,
  updateBugHatchIssue,
  archiveBugHatchIssue,
  transitionBugHatchIssue,

  // Audit
  createBugHatchAuditLog,
  getBugHatchAuditLogs,

  // Helpers
  generateBugHatchId,
};
