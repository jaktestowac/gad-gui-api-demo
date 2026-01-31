const fs = require("fs");
const path = require("path");
const { logDebug, logTrace, logError } = require("../../helpers/logger-api");
const { areIdsEqual, areStringsEqualIgnoringCase } = require("../../helpers/compare.helpers");

// Database paths
const DB_PATH = path.join(__dirname, "../../db/gad-talk-db-tmp.json");
const AUDIT_DB_PATH = path.join(__dirname, "../../db/gad-talk-audit-db-tmp.json");
const DEMO_DB_PATH = path.join(__dirname, "../../db/gad-talk-demo-db-tmp.json");

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

// ==================== FEATURE FLAGS ====================

const DEFAULT_FEATURE_FLAGS = [
  {
    key: "charts",
    enabled: true,
    description: "Profile analytics charts",
  },
  {
    key: "search_history",
    enabled: true,
    description: "Search page recent history",
  },
  {
    key: "hashtag_hash_url",
    enabled: true,
    description: "Enable /gad-talk/#hashtag URL routing",
  },
  {
    key: "bookmark_filters",
    enabled: true,
    description: "Bookmarks search and sorting controls",
  },
  {
    key: "followers_sorting",
    enabled: true,
    description: "Followers/Following sorting controls",
  },
];

let featureFlagsCache = null;

function normalizeFeatureFlagKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase();
}

function buildFeatureFlagEntry(flag, existing = {}) {
  const now = new Date().toISOString();
  return {
    key: normalizeFeatureFlagKey(flag.key || existing.key),
    enabled: existing.enabled ?? flag.enabled ?? false,
    description: flag.description || existing.description || "",
    updatedAt: existing.updatedAt || now,
    updatedBy: existing.updatedBy || "system",
  };
}

function ensureFeatureFlagsInDb(db) {
  let updated = false;
  if (!Array.isArray(db.featureFlags)) {
    db.featureFlags = [];
    updated = true;
  }

  for (const flag of DEFAULT_FEATURE_FLAGS) {
    const key = normalizeFeatureFlagKey(flag.key);
    const existingIndex = db.featureFlags.findIndex((entry) => normalizeFeatureFlagKey(entry.key) === key);
    if (existingIndex === -1) {
      db.featureFlags.push({
        ...buildFeatureFlagEntry(flag),
        updatedAt: new Date().toISOString(),
      });
      updated = true;
    }
  }

  return updated;
}

// ==================== LOCK FUNCTIONS ====================

/**
 * Acquire lock for database operations
 * @returns {Promise<Function>} Release function
 */
function acquireGadTalkLock() {
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

// ==================== ID GENERATION ====================

/**
 * Generate unique ID for GadTalk entities
 * @param {string} prefix - Entity type prefix (user, gad, follow, etc.)
 * @returns {string} Generated ID
 */
function generateGadTalkId(prefix = "gt") {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${randomPart}`;
}

// ==================== DATABASE READ/WRITE ====================

/**
 * Read the entire GadTalk database
 * If DB doesn't exist or is empty, seed with demo data
 * @returns {Object} Database object
 */
function readGadTalkDb() {
  try {
    let shouldSeed = false;
    let db;

    if (!fs.existsSync(DB_PATH)) {
      logDebug("GadTalk DB file not found, will seed with demo data");
      shouldSeed = true;
    } else {
      const data = fs.readFileSync(DB_PATH, "utf8");
      db = JSON.parse(data);
      // Check if DB is empty or missing core data
      if (!Array.isArray(db.gads) || db.gads.length === 0) {
        logDebug("GadTalk DB is empty, will seed with demo data");
        shouldSeed = true;
      }
    }

    if (shouldSeed) {
      // Load demo data
      const demoData = require("./gad-talk-demo-data.js");
      db = {
        users: demoData.users || [],
        gads: demoData.gads || [],
        follows: demoData.follows || [],
        likes: demoData.likes || [],
        notifications: demoData.notifications || [],
        blocks: demoData.blocks || [],
        mutes: demoData.mutes || [],
        bookmarks: demoData.bookmarks || [],
        hashtags: demoData.hashtags || [],
        featureFlags: demoData.featureFlags || [],
        outbox: [],
        missions: [],
        missionCompletions: [],
      };
      ensureFeatureFlagsInDb(db);
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
      logDebug("GadTalk DB seeded with demo data");
    }

    return db;
  } catch (error) {
    logError("Error reading GadTalk DB:", error);
    throw error;
  }
}

/**
 * Write to GadTalk database atomically (using temp file + rename)
 * @param {Object} data - Complete database object
 */
async function writeGadTalkDb(data) {
  const release = await acquireGadTalkLock();
  try {
    const tmpPath = `${DB_PATH}.tmp`;

    // Write to temp file first
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");

    // Atomic rename
    fs.renameSync(tmpPath, DB_PATH);

    logTrace("GadTalk DB written successfully");
  } catch (error) {
    logError("Error writing GadTalk DB:", error);
    throw error;
  } finally {
    release();
  }
}

/**
 * Read the demo database (read-only)
 * @returns {Object} Demo database object
 */
function readGadTalkDemoDb() {
  try {
    const seed = require("./gad-talk-demo-data.js");
    let shouldWrite = false;
    let demoDb;
    if (!fs.existsSync(DEMO_DB_PATH)) {
      demoDb = { ...seed };
      shouldWrite = true;
    } else {
      const data = fs.readFileSync(DEMO_DB_PATH, "utf8");
      demoDb = JSON.parse(data);
      // if empty or missing core arrays, re-seed
      if (
        !Array.isArray(demoDb.users) ||
        demoDb.users.length === 0 ||
        !Array.isArray(demoDb.gads) ||
        demoDb.gads.length === 0
      ) {
        demoDb = { ...seed };
        shouldWrite = true;
      }
    }
    if (shouldWrite) {
      try {
        fs.writeFileSync(DEMO_DB_PATH, JSON.stringify(demoDb, null, 2));
        logTrace("> Demo DB seeded from gad-talk-demo-data.js");
      } catch (e) {
        logError("Failed to write demo DB seed", e);
      }
    }
    return demoDb;
  } catch (error) {
    logError("Error reading Demo GadTalk DB:", error);
    return {
      users: [],
      gads: [],
      follows: [],
      likes: [],
      notifications: [],
      blocks: [],
      mutes: [],
      bookmarks: [],
      hashtags: [],
      featureFlags: [],
      outbox: [],
      missions: [],
      missionCompletions: [],
    };
  }
}

// ==================== AUDIT DATABASE ====================

/**
 * Read the audit database
 * @returns {Object} Audit database object
 */
function readAuditDb() {
  try {
    if (!fs.existsSync(AUDIT_DB_PATH)) {
      logError("Audit GadTalk DB file not found, creating new one");
      const emptyDb = {
        audit: [],
      };
      fs.writeFileSync(AUDIT_DB_PATH, JSON.stringify(emptyDb, null, 2));
      return emptyDb;
    }
    const data = fs.readFileSync(AUDIT_DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    logError("Error reading Audit GadTalk DB:", error);
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

    logTrace("Audit GadTalk DB written successfully");
  } catch (error) {
    logError("Error writing Audit GadTalk DB:", error);
    throw error;
  } finally {
    release();
  }
}

/**
 * Create an audit log entry
 * @param {Object} auditData - Audit data
 * @returns {Promise<Object>} Created audit entry
 */
async function createGadTalkAuditLog(auditData) {
  const db = readAuditDb();

  const auditEntry = {
    id: auditData.id || generateGadTalkId("audit"),
    actorUserId: auditData.actorUserId,
    eventType: auditData.eventType,
    payloadObject: auditData.payloadObject || {},
    createdAt: auditData.createdAt || new Date().toISOString(),
  };

  db.audit.push(auditEntry);
  await writeAuditDb(db);

  logTrace("GadTalk audit log created:", { id: auditEntry.id, eventType: auditEntry.eventType });
  return auditEntry;
}

/**
 * Get audit logs with optional filtering
 * @param {Object} filters - Optional filters
 * @returns {Array} Array of audit entries
 */
function getGadTalkAuditLogs(filters = {}) {
  const db = readAuditDb();
  let logs = db.audit || [];
  if (filters.actorUserId) {
    logs = logs.filter((log) => areIdsEqual(log.actorUserId, filters.actorUserId));
  }
  if (filters.eventType) {
    logs = logs.filter((log) => log.eventType === filters.eventType);
  }
  if (filters.payloadObject) {
    logs = logs.filter((log) => {
      for (const [key, value] of Object.entries(filters.payloadObject)) {
        if (log.payloadObject[key] !== value) return false;
      }
      return true;
    });
  }
  return logs;
}

// ==================== DATABASE INTEGRITY ====================

/**
 * Required collections in the GadTalk database
 */
const REQUIRED_COLLECTIONS = [
  "users",
  "gads",
  "follows",
  "likes",
  "notifications",
  "blocks",
  "mutes",
  "bookmarks",
  "hashtags",
  "featureFlags",
  "outbox",
  "missions",
  "missionCompletions",
];

/**
 * Check if database structure is valid
 * @param {Object} db - Database object
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
function checkDbIntegrity(db) {
  const errors = [];
  const warnings = [];

  if (!db || typeof db !== "object") {
    errors.push("Database is null or not an object");
    return { valid: false, errors, warnings };
  }

  // Check required collections
  for (const collection of REQUIRED_COLLECTIONS) {
    if (!Array.isArray(db[collection])) {
      errors.push(`Missing or invalid collection: ${collection}`);
    }
  }

  // Check if core collections have content (users and gads should have data for a valid DB)
  // Note: Empty collections are warnings only - the seeding logic handles them separately
  if (Array.isArray(db.users) && db.users.length === 0) {
    warnings.push("Users collection is empty - consider re-seeding");
  }
  if (Array.isArray(db.gads) && db.gads.length === 0) {
    warnings.push("Gads collection is empty - will be seeded from init/demo data");
  }

  // Validate users collection
  if (Array.isArray(db.users)) {
    db.users.forEach((user, idx) => {
      if (!user.id) warnings.push(`User at index ${idx} missing id`);
      if (!user.email) warnings.push(`User at index ${idx} missing email`);
      if (!user.username) warnings.push(`User at index ${idx} missing username`);
    });

    // Check for duplicate emails
    const emails = db.users.map((u) => u.email?.toLowerCase()).filter(Boolean);
    const duplicateEmails = emails.filter((e, i) => emails.indexOf(e) !== i);
    if (duplicateEmails.length > 0) {
      warnings.push(`Duplicate emails found: ${duplicateEmails.join(", ")}`);
    }

    // Check for duplicate usernames
    const usernames = db.users.map((u) => u.username?.toLowerCase()).filter(Boolean);
    const duplicateUsernames = usernames.filter((u, i) => usernames.indexOf(u) !== i);
    if (duplicateUsernames.length > 0) {
      warnings.push(`Duplicate usernames found: ${duplicateUsernames.join(", ")}`);
    }
  }

  // Validate gads collection
  if (Array.isArray(db.gads)) {
    db.gads.forEach((gad, idx) => {
      if (!gad.id) warnings.push(`Gad at index ${idx} missing id`);
      if (!gad.userId) warnings.push(`Gad at index ${idx} missing userId`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Try to repair database by ensuring all required collections exist
 * @param {Object} db - Database object (may be corrupted)
 * @returns {Object} Repaired database
 */
function repairDb(db) {
  logDebug("[GadTalk] Attempting to repair database...");

  const repaired = db && typeof db === "object" ? { ...db } : {};

  // Ensure all required collections exist as arrays
  for (const collection of REQUIRED_COLLECTIONS) {
    if (!Array.isArray(repaired[collection])) {
      logDebug(`[GadTalk] Creating missing collection: ${collection}`);
      repaired[collection] = [];
    }
  }

  return repaired;
}

/**
 * Check database integrity and attempt repair if needed
 * Called on startup
 * @returns {Promise<Object>} { status: 'ok'|'repaired'|'reinitialized', db: Object }
 */
async function checkAndRepairGadTalkDb() {
  logDebug("[GadTalk] Checking database integrity on startup...");

  try {
    // Check if file exists
    if (!fs.existsSync(DB_PATH)) {
      logDebug("[GadTalk] Database file not found, will initialize from seed data");
      const db = await initializeGadTalkDb();
      return { status: "initialized", db };
    }

    // Try to read and parse the file
    let db;
    try {
      const data = fs.readFileSync(DB_PATH, "utf8");
      db = JSON.parse(data);
    } catch (parseError) {
      logError("[GadTalk] Database file corrupted (JSON parse error):", parseError.message);
      logDebug("[GadTalk] Re-initializing from seed data...");

      // Backup corrupted file
      const backupPath = `${DB_PATH}.corrupted.${Date.now()}`;
      try {
        fs.renameSync(DB_PATH, backupPath);
        logDebug(`[GadTalk] Corrupted file backed up to: ${backupPath}`);
      } catch (backupErr) {
        logError("[GadTalk] Failed to backup corrupted file:", backupErr.message);
      }

      const newDb = await initializeGadTalkDb();
      return { status: "reinitialized", db: newDb, reason: "JSON parse error" };
    }

    // Check integrity
    const integrity = checkDbIntegrity(db);

    if (integrity.warnings.length > 0) {
      logDebug("[GadTalk] Database integrity warnings:", integrity.warnings);
    }

    if (!integrity.valid) {
      logError("[GadTalk] Database integrity errors:", integrity.errors);

      // Try to repair
      const repairedDb = repairDb(db);
      const repairedIntegrity = checkDbIntegrity(repairedDb);

      if (repairedIntegrity.valid) {
        ensureFeatureFlagsInDb(repairedDb);
        logDebug("[GadTalk] Database repaired successfully");
        await writeGadTalkDb(repairedDb);
        return { status: "repaired", db: repairedDb, repairs: integrity.errors };
      } else {
        // Repair failed, reinitialize
        logError("[GadTalk] Database repair failed, re-initializing from seed data");

        // Backup corrupted file
        const backupPath = `${DB_PATH}.corrupted.${Date.now()}`;
        try {
          fs.copyFileSync(DB_PATH, backupPath);
          logDebug(`[GadTalk] Corrupted file backed up to: ${backupPath}`);
        } catch (backupErr) {
          logError("[GadTalk] Failed to backup corrupted file:", backupErr.message);
        }

        const newDb = await initializeGadTalkDb();
        return { status: "reinitialized", db: newDb, reason: "Repair failed" };
      }
    }

    logDebug("[GadTalk] Database integrity check passed");

    const flagsUpdated = ensureFeatureFlagsInDb(db);
    if (flagsUpdated) {
      logDebug("[GadTalk] Feature flags updated with defaults");
      await writeGadTalkDb(db);
    }

    // Even if integrity passes, check if gads collection is empty and needs seeding
    if (!Array.isArray(db.gads) || db.gads.length === 0) {
      logDebug("[GadTalk] Gads collection is empty, seeding from init/demo data...");
      const seededDb = await seedGadsFromSource(db);
      return { status: "seeded-gads", db: seededDb };
    }

    return { status: "ok", db };
  } catch (error) {
    logError("[GadTalk] Error during database integrity check:", error);
    throw error;
  }
}

/**
 * Seed gads collection from init or demo data source
 * @param {Object} existingDb - Existing database object
 * @returns {Promise<Object>} Database with seeded gads
 */
async function seedGadsFromSource(existingDb) {
  // Try loading init dataset first
  let seed;
  try {
    const initPath = require.resolve("./gad-talk-demo-data.js");
    delete require.cache[initPath];
    const initData = require("./gad-talk-demo-data.js");
    if (initData && Array.isArray(initData.gads) && initData.gads.length > 0) {
      seed = initData;
      logTrace("> Using init dataset for gads seeding");
    }
  } catch (e) {
    logTrace("Init dataset not available for gads seeding", { error: e.message });
  }

  // Fall back to demo data
  if (!seed) {
    const demoDb = readGadTalkDemoDb();
    seed = demoDb;
    logTrace("> Using demo dataset for gads seeding");
  }

  // Merge gads and related collections from seed into existing DB
  const updatedDb = {
    ...existingDb,
    gads: (seed && seed.gads) || [],
    hashtags: (seed && seed.hashtags) || existingDb.hashtags || [],
    // Also seed likes, follows etc. if they're empty
    likes: existingDb.likes && existingDb.likes.length > 0 ? existingDb.likes : (seed && seed.likes) || [],
    follows: existingDb.follows && existingDb.follows.length > 0 ? existingDb.follows : (seed && seed.follows) || [],
    notifications:
      existingDb.notifications && existingDb.notifications.length > 0
        ? existingDb.notifications
        : (seed && seed.notifications) || [],
    bookmarks:
      existingDb.bookmarks && existingDb.bookmarks.length > 0 ? existingDb.bookmarks : (seed && seed.bookmarks) || [],
  };

  await writeGadTalkDb(updatedDb);
  logDebug("[GadTalk] Gads collection seeded successfully");
  return updatedDb;
}

// ==================== DATABASE INITIALIZATION ====================

/**
 * Initialize GadTalk database with init data
 * @returns {Promise<Object>} Initialized database object
 */
async function initializeGadTalkDb() {
  try {
    // Check if database already exists with data (must have both users AND gads)
    if (fs.existsSync(DB_PATH)) {
      const existingDb = readGadTalkDb();
      const hasUsers = existingDb.users && existingDb.users.length > 0;
      const hasGads = existingDb.gads && existingDb.gads.length > 0;
      if (hasUsers && hasGads) {
        logTrace("> GadTalk DB already exists with data (users and gads), skipping initialization");
        return existingDb;
      }
      logTrace("> GadTalk DB exists but missing users or gads, will re-seed");
    }

    logTrace("Initializing GadTalk database...");

    // Try loading init dataset
    let initData;
    try {
      const initPath = require.resolve("./gad-talk-demo-data.js");
      delete require.cache[initPath];
      initData = require("./gad-talk-demo-data.js");
    } catch (e) {
      logTrace("No explicit init dataset or failed to load, will fallback to demo dataset", { error: e.message });
      initData = null;
    }

    const hasInitContent =
      initData &&
      ((Array.isArray(initData.users) && initData.users.length) ||
        (Array.isArray(initData.gads) && initData.gads.length));

    let seedSourceName = "init";
    let seed = initData;
    if (!hasInitContent) {
      seedSourceName = "demo";
      const demoDb = readGadTalkDemoDb();
      seed = demoDb;
    }

    logTrace(`> Using ${seedSourceName} dataset for initial GadTalk DB seeding`);

    const initialDb = {
      users: (seed && seed.users) || [],
      gads: (seed && seed.gads) || [],
      follows: (seed && seed.follows) || [],
      likes: (seed && seed.likes) || [],
      notifications: (seed && seed.notifications) || [],
      blocks: (seed && seed.blocks) || [],
      mutes: (seed && seed.mutes) || [],
      bookmarks: (seed && seed.bookmarks) || [],
      hashtags: (seed && seed.hashtags) || [],
      featureFlags: (seed && seed.featureFlags) || [],
      outbox: (seed && seed.outbox) || [],
      missions: (seed && seed.missions) || [],
      missionCompletions: (seed && seed.missionCompletions) || [],
    };

    ensureFeatureFlagsInDb(initialDb);

    // Write to database
    await writeGadTalkDb(initialDb);

    logDebug("GadTalk database initialized successfully");
    return initialDb;
  } catch (error) {
    logError("Error initializing GadTalk DB:", error);
    throw error;
  }
}

/**
 * Initialize audit database
 * @returns {Promise<Object>} Initialized audit database object
 */
async function initializeGadTalkAuditDb() {
  try {
    if (fs.existsSync(AUDIT_DB_PATH)) {
      logTrace("> Audit GadTalk DB already exists, skipping initialization");
      return readAuditDb();
    }

    logTrace("> Initializing Audit GadTalk database...");

    const initialAuditDb = {
      audit: [],
    };

    await writeAuditDb(initialAuditDb);

    logTrace("> Audit GadTalk database initialized successfully");
    return initialAuditDb;
  } catch (error) {
    logError("Error initializing Audit GadTalk DB:", error);
    throw error;
  }
}

/**
 * Initialize all GadTalk databases if they don't exist
 * Includes integrity check on startup
 * @returns {Promise<Object>} { mainDb: Object, auditDb: Object, integrityResult: Object }
 */
async function initializeAllGadTalkDatabases() {
  try {
    logDebug("[GadTalk] Checking GadTalk Module databases...");

    // Check and repair main database
    const integrityResult = await checkAndRepairGadTalkDb();
    logDebug(`[GadTalk] Main DB status: ${integrityResult.status}`);

    if (integrityResult.status === "repaired") {
      logDebug(`[GadTalk] Database was repaired. Fixes applied: ${integrityResult.repairs?.join(", ")}`);
    } else if (integrityResult.status === "reinitialized") {
      logDebug(`[GadTalk] Database was reinitialized. Reason: ${integrityResult.reason}`);
    }

    // Initialize audit database
    const auditDb = await initializeGadTalkAuditDb();

    logDebug("[GadTalk] All GadTalk Module databases ready");

    return {
      mainDb: integrityResult.db,
      auditDb,
      integrityResult,
    };
  } catch (error) {
    logError("[GadTalk] Error initializing databases:", error);
    throw error;
  }
}

/**
 * Force re-initialize database with demo data (admin function)
 * @returns {Promise<Object>} Result object
 */
async function resetGadTalkDatabaseWithDemoData() {
  try {
    logDebug("Force resetting GadTalk database with demo data...");

    const demoDb = readGadTalkDemoDb();

    const resetDb = {
      users: demoDb.users || [],
      gads: demoDb.gads || [],
      follows: demoDb.follows || [],
      likes: demoDb.likes || [],
      notifications: demoDb.notifications || [],
      blocks: demoDb.blocks || [],
      mutes: demoDb.mutes || [],
      bookmarks: demoDb.bookmarks || [],
      hashtags: demoDb.hashtags || [],
      featureFlags: demoDb.featureFlags || [],
      outbox: demoDb.outbox || [],
      missions: demoDb.missions || [],
      missionCompletions: demoDb.missionCompletions || [],
    };

    ensureFeatureFlagsInDb(resetDb);

    await writeGadTalkDb(resetDb);
    await writeAuditDb({ audit: [] });

    logDebug("Database reset completed successfully");

    return {
      success: true,
      message: "Database reset with demo data",
      stats: {
        users: resetDb.users.length,
        gads: resetDb.gads.length,
        follows: resetDb.follows.length,
        likes: resetDb.likes.length,
        notifications: resetDb.notifications.length,
        hashtags: resetDb.hashtags.length,
      },
    };
  } catch (error) {
    logError("Error resetting database:", error);
    throw error;
  }
}

// ==================== GENERIC MUTATOR ====================

/**
 * Persist updated db helper
 * @param {Function} mutator receives db and should modify
 */
async function mutateAndWriteDb(mutator) {
  const db = readGadTalkDb();
  await mutator(db);
  await writeGadTalkDb(db);
  return db;
}

// ==================== USER OPERATIONS ====================

/**
 * Get all GadTalk users
 * @returns {Array} Array of users
 */
function gadTalkUsersDb() {
  return readGadTalkDb().users || [];
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Object|undefined} User object or undefined
 */
function findGadTalkUserById(userId) {
  const users = gadTalkUsersDb();
  return users.find((user) => areIdsEqual(user.id, userId));
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Object|undefined} User object or undefined
 */
function findGadTalkUserByEmail(email) {
  const users = gadTalkUsersDb();
  return users.find((user) => areStringsEqualIgnoringCase(user.email, email));
}

/**
 * Find user by username
 * @param {string} username - Username
 * @returns {Object|undefined} User object or undefined
 */
function findGadTalkUserByUsername(username) {
  const users = gadTalkUsersDb();
  return users.find((user) => areStringsEqualIgnoringCase(user.username, username));
}

const PUBLIC_DATA_USERS_DIR = path.join(__dirname, "..", "..", "public", "data", "users");

function normalizeAvatarPath(avatar) {
  if (!avatar) return null;
  // Accept external http(s) URLs as-is
  try {
    if (/^https?:\/\//i.test(avatar)) {
      return avatar;
    }
  } catch (e) {
    // salt
  }

  // Convert backslashes to slashes and extract basename
  const normalized = avatar.replace(/\\/g, "/");
  // If the path already starts with /data/users/, take basename
  let baseName = path.basename(normalized);
  if (!baseName) return null;

  // Construct public avatar path
  const avatarPublicPath = `/data/users/${baseName}`;

  // If provided path was already /data/users/<name>, ensure file exists
  const absolutePath = path.join(PUBLIC_DATA_USERS_DIR, baseName);
  try {
    if (fs.existsSync(absolutePath)) {
      return avatarPublicPath;
    }
  } catch (e) {
    // If checking filesystem fails, still return avatar path
    return avatarPublicPath;
  }

  // File not found — do not allow external avatars
  return null;
}

async function createGadTalkUser(userData) {
  const db = readGadTalkDb();

  // Check if user already exists by email
  const existingByEmail = db.users.find((u) => areStringsEqualIgnoringCase(u.email, userData.email));
  if (existingByEmail) {
    throw new Error("User with this email already exists");
  }

  // Check if username already exists
  const existingByUsername = db.users.find((u) => areStringsEqualIgnoringCase(u.username, userData.username));
  if (existingByUsername) {
    throw new Error("Username already taken");
  }

  const newUser = {
    id: userData.id || generateGadTalkId("user"),
    username: userData.username,
    email: userData.email.toLowerCase(),
    displayName: userData.displayName || userData.username,
    password: userData.password,
    bio: userData.bio || "",
    avatar: normalizeAvatarPath(userData.avatar) || null,
    header: userData.header || null,
    website: userData.website || null,
    location: userData.location || null,
    role: userData.role || "member",
    shadowBanned: false,
    createdAt: userData.createdAt || new Date().toISOString(),
    lastLoginAt: null,
  };

  db.users.push(newUser);
  await writeGadTalkDb(db);

  logTrace("GadTalk user created:", { id: newUser.id, email: newUser.email, username: newUser.username });
  return newUser;
}

/**
 * Update user's last login time
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
async function updateGadTalkUserLastLogin(userId) {
  let updatedUser;
  await mutateAndWriteDb((db) => {
    const idx = db.users.findIndex((u) => areIdsEqual(u.id, userId));
    if (idx === -1) throw new Error("User not found");
    db.users[idx].lastLoginAt = new Date().toISOString();
    updatedUser = db.users[idx];
  });
  return updatedUser;
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
async function updateGadTalkUserProfile(userId, updates) {
  let updatedUser;
  await mutateAndWriteDb((db) => {
    const idx = db.users.findIndex((u) => areIdsEqual(u.id, userId));
    if (idx === -1) throw new Error("User not found");

    const allowedFields = ["displayName", "bio", "avatar", "header", "website", "location"];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === "avatar") {
          db.users[idx][field] = normalizeAvatarPath(updates[field]) || null;
        } else {
          db.users[idx][field] = updates[field];
        }
      }
    }
    updatedUser = db.users[idx];
  });
  return updatedUser;
}

/**
 * Get user stats (followers, following, posts counts)
 * @param {string} userId - User ID
 * @returns {Object} Stats object
 */
function getGadTalkUserStats(userId) {
  const db = readGadTalkDb();

  const followersCount = db.follows.filter((f) => areIdsEqual(f.followingId, userId)).length;
  const followingCount = db.follows.filter((f) => areIdsEqual(f.followerId, userId)).length;
  const gadsCount = db.gads.filter((g) => areIdsEqual(g.userId, userId) && !g.deleted).length;
  const likesCount = db.likes.filter((l) => areIdsEqual(l.userId, userId)).length;

  return {
    followersCount,
    followingCount,
    gadsCount,
    likesCount,
  };
}

// ==================== GAD (POST) OPERATIONS ====================

/**
 * Get all gads
 * @returns {Array} Array of gads
 */
function gadTalkGadsDb() {
  return readGadTalkDb().gads || [];
}

/**
 * Find gad by ID
 * @param {string} gadId - Gad ID
 * @returns {Object|undefined} Gad object or undefined
 */
function findGadById(gadId) {
  const gads = gadTalkGadsDb();
  return gads.find((gad) => areIdsEqual(gad.id, gadId));
}

/**
 * Create a new gad
 * @param {Object} gadData - Gad data
 * @returns {Promise<Object>} Created gad
 */
async function createGad(gadData) {
  const db = readGadTalkDb();

  // Extract hashtags and mentions from content
  const hashtags = extractHashtags(gadData.content);
  const mentions = extractMentions(gadData.content);

  const newGad = {
    id: gadData.id || generateGadTalkId("gad"),
    userId: gadData.userId,
    content: gadData.content,
    imageUrl: gadData.imageUrl || null,
    replyToId: gadData.replyToId || null,
    quoteOfId: gadData.quoteOfId || null,
    isRepost: gadData.isRepost || false,
    repostOfId: gadData.repostOfId || null,
    hashtags,
    mentions,
    likeCount: 0,
    replyCount: 0,
    repostCount: 0,
    createdAt: gadData.createdAt || new Date().toISOString(),
    editedAt: null,
    deleted: false,
  };

  db.gads.push(newGad);

  // Update hashtag counts
  for (const tag of hashtags) {
    updateHashtagCount(db, tag, 1);
  }

  await writeGadTalkDb(db);

  logTrace("Gad created:", { id: newGad.id, userId: newGad.userId });
  return newGad;
}

/**
 * Update a gad
 * @param {string} gadId - Gad ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated gad
 */
async function updateGad(gadId, updates) {
  let updatedGad;
  await mutateAndWriteDb((db) => {
    const idx = db.gads.findIndex((g) => areIdsEqual(g.id, gadId));
    if (idx === -1) throw new Error("Gad not found");

    if (updates.content) {
      // Re-extract hashtags and mentions
      db.gads[idx].hashtags = extractHashtags(updates.content);
      db.gads[idx].mentions = extractMentions(updates.content);
      db.gads[idx].content = updates.content;
      db.gads[idx].editedAt = new Date().toISOString();
    }

    // Update image URL if provided
    if (updates.imageUrl !== undefined) {
      db.gads[idx].imageUrl = updates.imageUrl;
      if (!updates.content) {
        db.gads[idx].editedAt = new Date().toISOString();
      }
    }

    updatedGad = db.gads[idx];
  });
  return updatedGad;
}

/**
 * Soft delete a gad
 * @param {string} gadId - Gad ID
 * @returns {Promise<Object>} Deleted gad
 */
async function deleteGad(gadId) {
  let deletedGad;
  await mutateAndWriteDb((db) => {
    const idx = db.gads.findIndex((g) => areIdsEqual(g.id, gadId));
    if (idx === -1) throw new Error("Gad not found");

    db.gads[idx].deleted = true;
    deletedGad = db.gads[idx];
  });
  return deletedGad;
}

/**
 * Extract hashtags from content
 * @param {string} content - Post content
 * @returns {Array} Array of hashtags (without #)
 */
function extractHashtags(content) {
  if (!content) return [];
  const matches = content.match(/#(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
}

/**
 * Extract mentions from content
 * @param {string} content - Post content
 * @returns {Array} Array of usernames (without @)
 */
function extractMentions(content) {
  if (!content) return [];
  const matches = content.match(/@(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((mention) => mention.slice(1).toLowerCase()))];
}

/**
 * Update hashtag count in database
 * @param {Object} db - Database object
 * @param {string} tag - Hashtag (without #)
 * @param {number} delta - Change in count (+1 or -1)
 */
function updateHashtagCount(db, tag, delta) {
  const existingIdx = db.hashtags.findIndex((h) => areStringsEqualIgnoringCase(h.tag, tag));
  if (existingIdx >= 0) {
    db.hashtags[existingIdx].count += delta;
    db.hashtags[existingIdx].lastCalculated = new Date().toISOString();
  } else if (delta > 0) {
    db.hashtags.push({
      tag: tag.toLowerCase(),
      count: delta,
      trendingScore: 0,
      lastCalculated: new Date().toISOString(),
    });
  }
}

// ==================== FOLLOW OPERATIONS ====================

/**
 * Create a follow relationship
 * @param {string} followerId - Follower user ID
 * @param {string} followingId - User being followed ID
 * @returns {Promise<Object>} Created follow
 */
async function createFollow(followerId, followingId) {
  let newFollow;
  await mutateAndWriteDb((db) => {
    // Check if already following
    const existing = db.follows.find(
      (f) => areIdsEqual(f.followerId, followerId) && areIdsEqual(f.followingId, followingId)
    );
    if (existing) {
      throw new Error("Already following this user");
    }

    newFollow = {
      id: generateGadTalkId("follow"),
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    };
    db.follows.push(newFollow);
  });
  return newFollow;
}

/**
 * Delete a follow relationship
 * @param {string} followerId - Follower user ID
 * @param {string} followingId - User being followed ID
 * @returns {Promise<boolean>} Success
 */
async function deleteFollow(followerId, followingId) {
  let deleted = false;
  await mutateAndWriteDb((db) => {
    const idx = db.follows.findIndex(
      (f) => areIdsEqual(f.followerId, followerId) && areIdsEqual(f.followingId, followingId)
    );
    if (idx >= 0) {
      db.follows.splice(idx, 1);
      deleted = true;
    }
  });
  return deleted;
}

/**
 * Get followers of a user
 * @param {string} userId - User ID
 * @returns {Array} Array of follow objects
 */
function getFollowers(userId) {
  const db = readGadTalkDb();
  return db.follows.filter((f) => areIdsEqual(f.followingId, userId));
}

/**
 * Get users that a user is following
 * @param {string} userId - User ID
 * @returns {Array} Array of follow objects
 */
function getFollowing(userId) {
  const db = readGadTalkDb();
  return db.follows.filter((f) => areIdsEqual(f.followerId, userId));
}

/**
 * Check if user A follows user B
 * @param {string} followerId - Follower user ID
 * @param {string} followingId - User being followed ID
 * @returns {boolean}
 */
function isFollowing(followerId, followingId) {
  const db = readGadTalkDb();
  return db.follows.some((f) => areIdsEqual(f.followerId, followerId) && areIdsEqual(f.followingId, followingId));
}

// ==================== LIKE OPERATIONS ====================

/**
 * Create a like
 * @param {string} userId - User ID
 * @param {string} gadId - Gad ID
 * @returns {Promise<Object>} Created like
 */
async function createLike(userId, gadId) {
  let newLike;
  await mutateAndWriteDb((db) => {
    // Check if already liked
    const existing = db.likes.find((l) => areIdsEqual(l.userId, userId) && areIdsEqual(l.gadId, gadId));
    if (existing) {
      throw new Error("Already liked this gad");
    }

    newLike = {
      id: generateGadTalkId("like"),
      userId,
      gadId,
      createdAt: new Date().toISOString(),
    };
    db.likes.push(newLike);

    // Update like count on gad
    const gadIdx = db.gads.findIndex((g) => areIdsEqual(g.id, gadId));
    if (gadIdx >= 0) {
      db.gads[gadIdx].likeCount = (db.gads[gadIdx].likeCount || 0) + 1;
    }
  });
  return newLike;
}

/**
 * Delete a like
 * @param {string} userId - User ID
 * @param {string} gadId - Gad ID
 * @returns {Promise<boolean>} Success
 */
async function deleteLike(userId, gadId) {
  let deleted = false;
  await mutateAndWriteDb((db) => {
    const idx = db.likes.findIndex((l) => areIdsEqual(l.userId, userId) && areIdsEqual(l.gadId, gadId));
    if (idx >= 0) {
      db.likes.splice(idx, 1);
      deleted = true;

      // Update like count on gad
      const gadIdx = db.gads.findIndex((g) => areIdsEqual(g.id, gadId));
      if (gadIdx >= 0) {
        db.gads[gadIdx].likeCount = Math.max(0, (db.gads[gadIdx].likeCount || 1) - 1);
      }
    }
  });
  return deleted;
}

// ==================== NOTIFICATION OPERATIONS ====================

/**
 * Create a notification
 * @param {Object} notifData - Notification data
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(notifData) {
  let newNotification;
  await mutateAndWriteDb((db) => {
    newNotification = {
      id: generateGadTalkId("notif"),
      userId: notifData.userId,
      type: notifData.type,
      actorId: notifData.actorId,
      targetId: notifData.targetId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.push(newNotification);
  });
  return newNotification;
}

/**
 * Get notifications for a user with pagination
 * @param {string} userId - User ID
 * @param {number} page - Page number (default 1)
 * @param {number} limit - Items per page (default 20)
 * @param {Object} options - Additional options (unreadOnly)
 * @returns {Object} { notifications: Array, total: number }
 */
function getNotifications(userId, page = 1, limit = 20, options = {}) {
  const db = readGadTalkDb();
  let allNotifications = db.notifications.filter((n) => areIdsEqual(n.userId, userId));

  if (options.unreadOnly) {
    allNotifications = allNotifications.filter((n) => !n.read);
  }

  // Sort by createdAt desc
  allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allNotifications.length;
  const start = (page - 1) * limit;
  const notifications = allNotifications.slice(start, start + limit);

  return { notifications, total };
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
async function markNotificationAsRead(notificationId) {
  let updated;
  await mutateAndWriteDb((db) => {
    const idx = db.notifications.findIndex((n) => areIdsEqual(n.id, notificationId));
    if (idx >= 0) {
      db.notifications[idx].read = true;
      updated = db.notifications[idx];
    }
  });
  return updated;
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of notifications marked
 */
async function markAllNotificationsAsRead(userId) {
  let count = 0;
  await mutateAndWriteDb((db) => {
    for (const notif of db.notifications) {
      if (areIdsEqual(notif.userId, userId) && !notif.read) {
        notif.read = true;
        count++;
      }
    }
  });
  return count;
}

// ==================== BLOCK/MUTE OPERATIONS ====================

/**
 * Create a block
 * @param {string} blockerId - User doing the blocking
 * @param {string} blockedId - User being blocked
 * @returns {Promise<Object>} Created block
 */
async function createBlock(blockerId, blockedId) {
  let newBlock;
  await mutateAndWriteDb((db) => {
    const existing = db.blocks.find((b) => areIdsEqual(b.blockerId, blockerId) && areIdsEqual(b.blockedId, blockedId));
    if (existing) {
      throw new Error("User already blocked");
    }

    newBlock = {
      id: generateGadTalkId("block"),
      blockerId,
      blockedId,
      createdAt: new Date().toISOString(),
    };
    db.blocks.push(newBlock);
  });
  return newBlock;
}

/**
 * Delete a block
 * @param {string} blockerId - User who blocked
 * @param {string} blockedId - User who was blocked
 * @returns {Promise<boolean>} Success
 */
async function deleteBlock(blockerId, blockedId) {
  let deleted = false;
  await mutateAndWriteDb((db) => {
    const idx = db.blocks.findIndex((b) => areIdsEqual(b.blockerId, blockerId) && areIdsEqual(b.blockedId, blockedId));
    if (idx >= 0) {
      db.blocks.splice(idx, 1);
      deleted = true;
    }
  });
  return deleted;
}

/**
 * Create a mute
 * @param {string} muterId - User doing the muting
 * @param {string} mutedId - User being muted
 * @returns {Promise<Object>} Created mute
 */
async function createMute(muterId, mutedId) {
  let newMute;
  await mutateAndWriteDb((db) => {
    const existing = db.mutes.find((m) => areIdsEqual(m.muterId, muterId) && areIdsEqual(m.mutedId, mutedId));
    if (existing) {
      throw new Error("User already muted");
    }

    newMute = {
      id: generateGadTalkId("mute"),
      muterId,
      mutedId,
      createdAt: new Date().toISOString(),
    };
    db.mutes.push(newMute);
  });
  return newMute;
}

/**
 * Delete a mute
 * @param {string} muterId - User who muted
 * @param {string} mutedId - User who was muted
 * @returns {Promise<boolean>} Success
 */
async function deleteMute(muterId, mutedId) {
  let deleted = false;
  await mutateAndWriteDb((db) => {
    const idx = db.mutes.findIndex((m) => areIdsEqual(m.muterId, muterId) && areIdsEqual(m.mutedId, mutedId));
    if (idx >= 0) {
      db.mutes.splice(idx, 1);
      deleted = true;
    }
  });
  return deleted;
}

/**
 * Check if a user has blocked another user
 * @param {string} blockerId - User who might have blocked
 * @param {string} blockedId - User who might be blocked
 * @returns {boolean} True if blocked
 */
function hasBlocked(blockerId, blockedId) {
  const db = readGadTalkDb();
  return db.blocks.some((b) => areIdsEqual(b.blockerId, blockerId) && areIdsEqual(b.blockedId, blockedId));
}

/**
 * Check if a user has muted another user
 * @param {string} muterId - User who might have muted
 * @param {string} mutedId - User who might be muted
 * @returns {boolean} True if muted
 */
function hasMuted(muterId, mutedId) {
  const db = readGadTalkDb();
  return db.mutes.some((m) => areIdsEqual(m.muterId, muterId) && areIdsEqual(m.mutedId, mutedId));
}

/**
 * Get all user IDs blocked by a user
 * @param {string} userId - The user who did the blocking
 * @returns {string[]} Array of blocked user IDs
 */
function getBlockedUserIds(userId) {
  if (!userId) return [];
  const db = readGadTalkDb();
  return db.blocks.filter((b) => areIdsEqual(b.blockerId, userId)).map((b) => b.blockedId);
}

/**
 * Get all user IDs who blocked a user
 * @param {string} userId - The user who was blocked
 * @returns {string[]} Array of user IDs who blocked this user
 */
function getBlockedByUserIds(userId) {
  if (!userId) return [];
  const db = readGadTalkDb();
  return db.blocks.filter((b) => areIdsEqual(b.blockedId, userId)).map((b) => b.blockerId);
}

/**
 * Get all user IDs muted by a user
 * @param {string} userId - The user who did the muting
 * @returns {string[]} Array of muted user IDs
 */
function getMutedUserIds(userId) {
  if (!userId) return [];
  const db = readGadTalkDb();
  return db.mutes.filter((m) => areIdsEqual(m.muterId, userId)).map((m) => m.mutedId);
}

// ==================== BOOKMARK OPERATIONS ====================

/**
 * Create a bookmark
 * @param {string} userId - User ID
 * @param {string} gadId - Gad ID
 * @returns {Promise<Object>} Created bookmark
 */
async function createBookmark(userId, gadId) {
  let newBookmark;
  await mutateAndWriteDb((db) => {
    const existing = db.bookmarks.find((b) => areIdsEqual(b.userId, userId) && areIdsEqual(b.gadId, gadId));
    if (existing) {
      throw new Error("Gad already bookmarked");
    }

    newBookmark = {
      id: generateGadTalkId("bookmark"),
      userId,
      gadId,
      createdAt: new Date().toISOString(),
    };
    db.bookmarks.push(newBookmark);
  });
  return newBookmark;
}

/**
 * Delete a bookmark
 * @param {string} userId - User ID
 * @param {string} gadId - Gad ID
 * @returns {Promise<boolean>} Success
 */
async function deleteBookmark(userId, gadId) {
  let deleted = false;
  await mutateAndWriteDb((db) => {
    const idx = db.bookmarks.findIndex((b) => areIdsEqual(b.userId, userId) && areIdsEqual(b.gadId, gadId));
    if (idx >= 0) {
      db.bookmarks.splice(idx, 1);
      deleted = true;
    }
  });
  return deleted;
}

/**
 * Get user's bookmarks
 * @param {string} userId - User ID
 * @returns {Array} Array of bookmark objects
 */
function getBookmarks(userId) {
  const db = readGadTalkDb();
  return db.bookmarks.filter((b) => areIdsEqual(b.userId, userId));
}

// ==================== ADDITIONAL HELPER FUNCTIONS ====================

/**
 * Get gad by ID (alias for findGadById for API consistency)
 */
function getGadById(gadId) {
  return findGadById(gadId);
}

/**
 * Get user by ID (alias for findGadTalkUserById)
 */
function getUserById(userId) {
  return findGadTalkUserById(userId);
}

/**
 * Get user by username (alias for findGadTalkUserByUsername)
 */
function getUserByUsername(username) {
  return findGadTalkUserByUsername(username);
}

/**
 * Check if user has liked a gad
 */
function hasUserLikedGad(userId, gadId) {
  const db = readGadTalkDb();
  return db.likes.some((l) => areIdsEqual(l.userId, userId) && areIdsEqual(l.gadId, gadId));
}

/**
 * Check if user has regadded a gad
 */
function hasUserRegadded(userId, gadId) {
  const db = readGadTalkDb();
  return db.outbox.some((o) => areIdsEqual(o.userId, userId) && areIdsEqual(o.gadId, gadId) && o.type === "regad");
}

/**
 * Check if user has bookmarked a gad
 */
function hasUserBookmarked(userId, gadId) {
  const db = readGadTalkDb();
  return db.bookmarks.some((b) => areIdsEqual(b.userId, userId) && areIdsEqual(b.gadId, gadId));
}

/**
 * Increment hashtag count
 */
async function incrementHashtagCount(tagName) {
  await mutateAndWriteDb((db) => {
    const idx = db.hashtags.findIndex((h) => areStringsEqualIgnoringCase(h.name, tagName));
    if (idx >= 0) {
      db.hashtags[idx].count = (db.hashtags[idx].count || 0) + 1;
    } else {
      db.hashtags.push({
        id: generateGadTalkId("tag"),
        name: tagName.toLowerCase(),
        count: 1,
        createdAt: new Date().toISOString(),
      });
    }
  });
}

/**
 * Increment gad reply count
 */
async function incrementGadReplyCount(gadId) {
  await mutateAndWriteDb((db) => {
    const gad = db.gads.find((g) => areIdsEqual(g.id, gadId));
    if (gad) {
      gad.replyCount = (gad.replyCount || 0) + 1;
    }
  });
}

/**
 * Decrement gad reply count
 */
async function decrementGadReplyCount(gadId) {
  await mutateAndWriteDb((db) => {
    const gad = db.gads.find((g) => areIdsEqual(g.id, gadId));
    if (gad && gad.replyCount > 0) {
      gad.replyCount = gad.replyCount - 1;
    }
  });
}

/**
 * Increment gad like count
 */
async function incrementGadLikeCount(gadId) {
  await mutateAndWriteDb((db) => {
    const gad = db.gads.find((g) => areIdsEqual(g.id, gadId));
    if (gad) {
      gad.likeCount = (gad.likeCount || 0) + 1;
    }
  });
}

/**
 * Decrement gad like count
 */
async function decrementGadLikeCount(gadId) {
  await mutateAndWriteDb((db) => {
    const gad = db.gads.find((g) => areIdsEqual(g.id, gadId));
    if (gad && gad.likeCount > 0) {
      gad.likeCount = gad.likeCount - 1;
    }
  });
}

/**
 * Increment gad regad count
 */
async function incrementGadRegadCount(gadId) {
  await mutateAndWriteDb((db) => {
    const gad = db.gads.find((g) => areIdsEqual(g.id, gadId));
    if (gad) {
      gad.regadCount = (gad.regadCount || 0) + 1;
    }
  });
}

/**
 * Decrement gad regad count
 */
async function decrementGadRegadCount(gadId) {
  await mutateAndWriteDb((db) => {
    const gad = db.gads.find((g) => areIdsEqual(g.id, gadId));
    if (gad && gad.regadCount > 0) {
      gad.regadCount = gad.regadCount - 1;
    }
  });
}

/**
 * Create a regad (repost)
 */
async function createRegad(regadData) {
  let newRegad;
  await mutateAndWriteDb((db) => {
    newRegad = {
      id: generateGadTalkId("regad"),
      userId: regadData.userId,
      gadId: regadData.gadId,
      comment: regadData.comment || "",
      type: "regad",
      createdAt: new Date().toISOString(),
    };
    db.outbox.push(newRegad);
  });
  return newRegad;
}

/**
 * Delete a regad
 */
async function deleteRegad(userId, gadId) {
  let deleted = false;
  await mutateAndWriteDb((db) => {
    const idx = db.outbox.findIndex(
      (o) => areIdsEqual(o.userId, userId) && areIdsEqual(o.gadId, gadId) && o.type === "regad"
    );
    if (idx >= 0) {
      db.outbox.splice(idx, 1);
      deleted = true;
    }
  });
  return deleted;
}

/**
 * Get "For You" feed - all gads with sorting support
 * Supports both page-based and cursor-based pagination
 * @param {number} page - Page number (for page-based pagination)
 * @param {number} limit - Items per page
 * @param {Object} options - Filter options
 * @param {string} options.currentUserId - Current user ID for visibility filtering
 * @param {string[]} options.followingIds - IDs of users the current user follows
 * @param {string} options.sort - Sort type: 'latest', 'top', 'media'
 * @param {string} options.cursor - Cursor for cursor-based pagination (ID of last item)
 */
function getGadsForYou(page = 1, limit = 20, options = {}) {
  const db = readGadTalkDb();
  const {
    currentUserId,
    followingIds = [],
    sort = "latest",
    blockedUserIds = [],
    mutedUserIds = [],
    cursor = null,
  } = options;

  // Combine blocked and muted users for filtering
  const excludedUserIds = [...new Set([...blockedUserIds, ...mutedUserIds])];

  let allGads = db.gads.filter((g) => {
    if (g.deleted) return false;
    // Filter out gads from blocked/muted users
    if (excludedUserIds.some((id) => areIdsEqual(id, g.userId))) return false;
    // Apply visibility filtering
    if (!isGadVisibleToUser(g, currentUserId, followingIds)) return false;
    // Filter by media if sort type is 'media'
    if (sort === "media" && !g.imageUrl) return false;
    return true;
  });

  // Apply sorting
  allGads = sortGadsBy(allGads, sort);

  const total = allGads.length;

  // Cursor-based pagination
  if (cursor) {
    const cursorIndex = allGads.findIndex((g) => areIdsEqual(g.id, cursor));
    if (cursorIndex !== -1) {
      allGads = allGads.slice(cursorIndex + 1);
    }
    const gads = allGads.slice(0, limit);
    const nextCursor = gads.length === limit && gads.length > 0 ? gads[gads.length - 1].id : null;
    return { gads, total, nextCursor };
  }

  // Page-based pagination
  const start = (page - 1) * limit;
  const gads = allGads.slice(start, start + limit);
  const nextCursor = start + limit < total && gads.length > 0 ? gads[gads.length - 1].id : null;

  return { gads, total, nextCursor };
}

/**
 * Check if a gad is visible to a user based on visibility settings
 * @param {Object} gad - The gad to check
 * @param {string} currentUserId - Current user ID (null if not logged in)
 * @param {string[]} followingIds - IDs of users the current user follows
 * @returns {boolean} Whether the gad is visible
 */
function isGadVisibleToUser(gad, currentUserId, followingIds = []) {
  const visibility = gad.visibility || "public";

  switch (visibility) {
    case "public":
      // Visible to everyone
      return true;

    case "private":
      // Visible only to logged-in users
      return !!currentUserId;

    case "followers":
      // Visible to author and their followers
      if (!currentUserId) return false;
      if (areIdsEqual(gad.userId, currentUserId)) return true;
      return followingIds.some((id) => areIdsEqual(id, gad.userId));

    case "self":
      // Visible only to the author
      if (!currentUserId) return false;
      return areIdsEqual(gad.userId, currentUserId);

    default:
      // Unknown visibility, default to public behavior
      return true;
  }
}

/**
 * Sort gads by specified type
 * @param {Array} gads - Array of gads
 * @param {string} sortType - 'latest', 'top', or 'media'
 * @returns {Array} Sorted gads
 */
function sortGadsBy(gads, sortType) {
  switch (sortType) {
    case "top":
      // Sort by engagement score (likes + reposts + replies)
      return gads.sort((a, b) => {
        const scoreA = (a.likeCount || 0) + (a.regadCount || 0) * 3 + (a.replyCount || 0) * 2;
        const scoreB = (b.likeCount || 0) + (b.regadCount || 0) * 3 + (b.replyCount || 0) * 2;
        // Secondary sort by date for ties
        if (scoreB === scoreA) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return scoreB - scoreA;
      });

    case "media":
    case "latest":
    default:
      // Sort by creation date, newest first
      return gads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

/**
 * Get popular gads sorted by engagement
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} options - Filter options
 * @param {string} options.currentUserId - Current user ID for visibility filtering
 * @param {string[]} options.followingIds - IDs of users the current user follows
 * @param {string[]} options.blockedUserIds - IDs of users blocked by current user
 * @returns {Object} { gads, total }
 */
function getPopularGads(page = 1, limit = 20, options = {}) {
  const db = readGadTalkDb();
  const { currentUserId, followingIds = [], blockedUserIds = [] } = options;

  let allGads = db.gads.filter((g) => {
    if (g.deleted) return false;
    // Filter out gads from blocked users
    if (blockedUserIds.some((id) => areIdsEqual(id, g.userId))) return false;
    // Apply visibility filtering
    if (!isGadVisibleToUser(g, currentUserId, followingIds)) return false;
    return true;
  });

  // Sort by engagement score (likes + reposts*3 + replies*2)
  allGads = allGads.sort((a, b) => {
    const scoreA = (a.likeCount || 0) + (a.regadCount || 0) * 3 + (a.replyCount || 0) * 2;
    const scoreB = (b.likeCount || 0) + (b.regadCount || 0) * 3 + (b.replyCount || 0) * 2;
    // Secondary sort by date for ties
    if (scoreB === scoreA) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return scoreB - scoreA;
  });

  const total = allGads.length;
  const start = (page - 1) * limit;
  const gads = allGads.slice(start, start + limit);

  return { gads, total };
}

/**
 * Get gads by multiple users
 * Supports both page-based and cursor-based pagination
 * @param {string[]} userIds - User IDs to get gads from
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} options - Filter options
 * @param {string} options.currentUserId - Current user ID for visibility filtering
 * @param {string[]} options.followingIds - IDs of users the current user follows
 * @param {string} options.sort - Sort type: 'latest', 'top', 'media'
 * @param {string[]} options.blockedUserIds - IDs of users blocked by current user
 * @param {string[]} options.mutedUserIds - IDs of users muted by current user
 * @param {string} options.cursor - Cursor for cursor-based pagination (ID of last item)
 */
function getGadsByUsers(userIds, page = 1, limit = 20, options = {}) {
  const db = readGadTalkDb();
  const {
    currentUserId,
    followingIds = [],
    sort = "latest",
    blockedUserIds = [],
    mutedUserIds = [],
    cursor = null,
  } = options;

  // Combine blocked and muted users for filtering
  const excludedUserIds = [...new Set([...blockedUserIds, ...mutedUserIds])];

  let allGads = db.gads.filter((g) => {
    if (g.deleted) return false;
    if (!userIds.some((uid) => areIdsEqual(g.userId, uid))) return false;
    // Filter out gads from blocked/muted users
    if (excludedUserIds.some((id) => areIdsEqual(id, g.userId))) return false;
    if (!isGadVisibleToUser(g, currentUserId, followingIds)) return false;
    // Filter by media if sort type is 'media'
    if (sort === "media" && !g.imageUrl) return false;
    return true;
  });

  // Apply sorting
  allGads = sortGadsBy(allGads, sort);

  const total = allGads.length;

  // Cursor-based pagination
  if (cursor) {
    const cursorIndex = allGads.findIndex((g) => areIdsEqual(g.id, cursor));
    if (cursorIndex !== -1) {
      allGads = allGads.slice(cursorIndex + 1);
    }
    const gads = allGads.slice(0, limit);
    const nextCursor = gads.length === limit && gads.length > 0 ? gads[gads.length - 1].id : null;
    return { gads, total, nextCursor };
  }

  // Page-based pagination
  const start = (page - 1) * limit;
  const gads = allGads.slice(start, start + limit);
  const nextCursor = start + limit < total && gads.length > 0 ? gads[gads.length - 1].id : null;

  return { gads, total, nextCursor };
}

/**
 * Get gads by a single user
 * @param {string} userId - User ID to get gads from
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} options - Filter options
 * @param {string} options.currentUserId - Current user ID for visibility filtering
 * @param {string[]} options.followingIds - IDs of users the current user follows
 */
function getGadsByUser(userId, page = 1, limit = 20, options = {}) {
  const db = readGadTalkDb();
  const { currentUserId, followingIds = [] } = options;

  const allGads = db.gads
    .filter((g) => {
      if (g.deleted) return false;
      if (!areIdsEqual(g.userId, userId)) return false;
      return isGadVisibleToUser(g, currentUserId, followingIds);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allGads.length;
  const start = (page - 1) * limit;
  const gads = allGads.slice(start, start + limit);

  return { gads, total };
}

/**
 * Get replies made by a user (gads that are replies to other gads)
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} options - Filter options
 */
function getUserReplies(userId, page = 1, limit = 20, options = {}) {
  const db = readGadTalkDb();
  const { currentUserId, followingIds = [] } = options;

  const allReplies = db.gads
    .filter((g) => {
      if (g.deleted) return false;
      if (!areIdsEqual(g.userId, userId)) return false;
      // Must be a reply (has replyTo or replyToId)
      if (!g.replyTo && !g.replyToId) return false;
      return isGadVisibleToUser(g, currentUserId, followingIds);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allReplies.length;
  const start = (page - 1) * limit;
  const gads = allReplies.slice(start, start + limit);

  return { gads, total };
}

/**
 * Get gads liked by a user
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} options - Filter options
 */
function getUserLikedGads(userId, page = 1, limit = 20, options = {}) {
  const db = readGadTalkDb();
  const { currentUserId, followingIds = [] } = options;

  // Get all likes by this user
  const userLikes = db.likes
    .filter((l) => areIdsEqual(l.userId, userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Get the gads for these likes
  const allLikedGads = userLikes
    .map((like) => {
      const gad = db.gads.find((g) => areIdsEqual(g.id, like.gadId));
      if (!gad || gad.deleted) return null;
      if (!isGadVisibleToUser(gad, currentUserId, followingIds)) return null;
      return gad;
    })
    .filter(Boolean);

  const total = allLikedGads.length;
  const start = (page - 1) * limit;
  const gads = allLikedGads.slice(start, start + limit);

  return { gads, total };
}

/**
 * Get replies to a gad
 * @param {string} gadId - ID of the gad to get replies for
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} options - Filter options
 * @param {string} options.currentUserId - Current user ID for visibility filtering
 * @param {string[]} options.followingIds - IDs of users the current user follows
 */
function getReplies(gadId, page = 1, limit = 20, options = {}) {
  const db = readGadTalkDb();
  const { currentUserId, followingIds = [] } = options;

  const allReplies = db.gads
    .filter((g) => {
      if (g.deleted) return false;
      // Check for both replyTo and replyToId (different field names in demo data)
      if (!areIdsEqual(g.replyTo, gadId) && !areIdsEqual(g.replyToId, gadId)) return false;
      return isGadVisibleToUser(g, currentUserId, followingIds);
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const total = allReplies.length;
  const start = (page - 1) * limit;
  const gads = allReplies.slice(start, start + limit);

  return { gads, total };
}

/**
 * Search gads by content
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} options - Filter options
 * @param {string} options.currentUserId - Current user ID for visibility filtering
 * @param {string[]} options.followingIds - IDs of users the current user follows
 * @param {string[]} options.blockedUserIds - IDs of users blocked by current user
 */
function searchGads(query, page = 1, limit = 20, options = {}) {
  const db = readGadTalkDb();
  const { currentUserId, followingIds = [], blockedUserIds = [] } = options;
  const lowerQuery = query.toLowerCase();

  const allGads = db.gads
    .filter((g) => {
      if (g.deleted) return false;
      if (!g.content || !g.content.toLowerCase().includes(lowerQuery)) return false;
      // Filter out gads from blocked users
      if (blockedUserIds.some((id) => areIdsEqual(id, g.userId))) return false;
      return isGadVisibleToUser(g, currentUserId, followingIds);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allGads.length;
  const start = (page - 1) * limit;
  const gads = allGads.slice(start, start + limit);

  return { gads, total };
}

/**
 * Search users by username or display name
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} options - Filter options
 * @param {string} options.currentUserId - Current user ID (to exclude from results)
 * @param {string[]} options.blockedUserIds - IDs of users blocked by current user
 * @param {string[]} options.blockedByUserIds - IDs of users who blocked current user
 */
function searchUsers(query, page = 1, limit = 20, options = {}) {
  const db = readGadTalkDb();
  const { currentUserId, blockedUserIds = [], blockedByUserIds = [] } = options;
  const lowerQuery = query.toLowerCase();

  // Combine blocked users for filtering
  const excludedUserIds = [...new Set([...blockedUserIds, ...blockedByUserIds])];

  const allUsers = db.users
    .filter((u) => {
      // Exclude current user from search results
      if (currentUserId && areIdsEqual(u.id, currentUserId)) return false;
      // Exclude blocked users
      if (excludedUserIds.some((id) => areIdsEqual(id, u.id))) return false;
      // Match username or display name
      const usernameMatch = u.username && u.username.toLowerCase().includes(lowerQuery);
      const displayNameMatch = u.displayName && u.displayName.toLowerCase().includes(lowerQuery);
      const bioMatch = u.bio && u.bio.toLowerCase().includes(lowerQuery);
      return usernameMatch || displayNameMatch || bioMatch;
    })
    .sort((a, b) => {
      // Prioritize exact username matches
      const aExact = a.username && a.username.toLowerCase() === lowerQuery;
      const bExact = b.username && b.username.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      // Then by followers count (popularity)
      return (b.followersCount || 0) - (a.followersCount || 0);
    });

  const total = allUsers.length;
  const start = (page - 1) * limit;
  const users = allUsers.slice(start, start + limit);

  return { users, total };
}

/**
 * Get trending hashtags
 */
function getTrendingHashtags(limit = 10) {
  const db = readGadTalkDb();
  return db.hashtags.sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, limit);
}

/**
 * Get gads by hashtag
 * @param {string} hashtag - Hashtag to search for
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} options - Filter options
 * @param {string} options.currentUserId - Current user ID for visibility filtering
 * @param {string[]} options.followingIds - IDs of users the current user follows
 */
function getGadsByHashtag(hashtag, page = 1, limit = 20, options = {}) {
  const db = readGadTalkDb();
  const { currentUserId, followingIds = [] } = options;
  const lowerHashtag = hashtag.toLowerCase();

  const allGads = db.gads
    .filter((g) => {
      if (g.deleted) return false;
      if (!g.hashtags || !g.hashtags.includes(lowerHashtag)) return false;
      return isGadVisibleToUser(g, currentUserId, followingIds);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allGads.length;
  const start = (page - 1) * limit;
  const gads = allGads.slice(start, start + limit);

  return { gads, total };
}

/**
 * Get notification by ID
 */
function getNotificationById(notificationId) {
  const db = readGadTalkDb();
  return db.notifications.find((n) => areIdsEqual(n.id, notificationId));
}

/**
 * Get unread notification count
 */
function getUnreadNotificationCount(userId) {
  const db = readGadTalkDb();
  return db.notifications.filter((n) => areIdsEqual(n.userId, userId) && !n.read).length;
}

/**
 * Get paginated bookmarks
 */
function getBookmarksPaginated(userId, page = 1, limit = 20) {
  const db = readGadTalkDb();
  const allBookmarks = db.bookmarks
    .filter((b) => areIdsEqual(b.userId, userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allBookmarks.length;
  const start = (page - 1) * limit;
  const bookmarks = allBookmarks.slice(start, start + limit);

  return { bookmarks, total };
}

// ==================== DATABASE STATUS ====================

/**
 * Get real-time like counts for multiple gads (batch operation)
 * @param {string[]} gadIds - Array of gad IDs
 * @returns {Object} Map of gadId -> likeCount
 */
function getBatchLikeCounts(gadIds) {
  const db = readGadTalkDb();
  const counts = {};

  // Initialize all to 0
  for (const gadId of gadIds) {
    counts[gadId] = 0;
  }

  // Count likes for each gad
  for (const like of db.likes) {
    if (Object.prototype.hasOwnProperty.call(counts, like.gadId)) {
      counts[like.gadId]++;
    }
  }

  return counts;
}

/**
 * Get real-time reply counts for multiple gads (batch operation)
 * @param {string[]} gadIds - Array of gad IDs
 * @returns {Object} Map of gadId -> replyCount
 */
function getBatchReplyCounts(gadIds) {
  const db = readGadTalkDb();
  const counts = {};

  // Initialize all to 0
  for (const gadId of gadIds) {
    counts[gadId] = 0;
  }

  // Count replies (gads that have replyToId or replyTo matching our gadIds)
  for (const gad of db.gads) {
    if (gad.deleted) continue;
    const replyToId = gad.replyToId || gad.replyTo;
    if (replyToId && Object.prototype.hasOwnProperty.call(counts, replyToId)) {
      counts[replyToId]++;
    }
  }

  return counts;
}

/**
 * Get real-time repost/regad counts for multiple gads (batch operation)
 * @param {string[]} gadIds - Array of gad IDs
 * @returns {Object} Map of gadId -> repostCount
 */
function getBatchRepostCounts(gadIds) {
  const db = readGadTalkDb();
  const counts = {};

  // Initialize all to 0
  for (const gadId of gadIds) {
    counts[gadId] = 0;
  }

  // Count from outbox (regads)
  for (const entry of db.outbox) {
    if (entry.type === "regad" && Object.prototype.hasOwnProperty.call(counts, entry.gadId)) {
      counts[entry.gadId]++;
    }
  }

  // Also count repost gads
  for (const gad of db.gads) {
    if (gad.deleted) continue;
    if (gad.isRepost && gad.repostOfId && Object.prototype.hasOwnProperty.call(counts, gad.repostOfId)) {
      counts[gad.repostOfId]++;
    }
  }

  return counts;
}

/**
 * Get database status and statistics
 * @returns {Object} Status object
 */
function getGadTalkDbStatus() {
  const db = readGadTalkDb();
  const auditDb = readAuditDb();

  return {
    status: "ok",
    collections: {
      users: db.users.length,
      gads: db.gads.length,
      follows: db.follows.length,
      likes: db.likes.length,
      notifications: db.notifications.length,
      blocks: db.blocks.length,
      mutes: db.mutes.length,
      bookmarks: db.bookmarks.length,
      hashtags: db.hashtags.length,
      featureFlags: db.featureFlags.length,
      outbox: db.outbox.length,
      missions: db.missions.length,
      missionCompletions: db.missionCompletions.length,
      auditLogs: auditDb.audit.length,
    },
    dbPath: DB_PATH,
    auditDbPath: AUDIT_DB_PATH,
    timestamp: new Date().toISOString(),
  };
}

// ==================== ANALYTICS (CHARTS) ====================

function clampNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeToUtcDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function toDateKey(value) {
  const d = normalizeToUtcDate(value);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function buildDateKeys(days, endDate = new Date()) {
  const end = normalizeToUtcDate(endDate) || new Date();
  const keys = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function formatLabelFromDateKey(dateKey) {
  try {
    const date = new Date(`${dateKey}T00:00:00Z`);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (e) {
    return dateKey;
  }
}

function startOfUtcWeek(date) {
  const normalized = normalizeToUtcDate(date) || new Date();
  const day = normalized.getUTCDay();
  const diff = (day + 6) % 7; // Monday = 0
  const start = new Date(normalized);
  start.setUTCDate(normalized.getUTCDate() - diff);
  return start;
}

function getUserActivityHeatmap(userId, options = {}) {
  const db = readGadTalkDb();
  const days = clampNumber(options.days, 7, 366, 365);
  const dateKeys = buildDateKeys(days, options.endDate || new Date());
  const counts = Object.fromEntries(dateKeys.map((key) => [key, 0]));

  db.gads
    .filter((g) => !g.deleted && areIdsEqual(g.userId, userId))
    .forEach((gad) => {
      const key = toDateKey(gad.createdAt);
      if (key && Object.prototype.hasOwnProperty.call(counts, key)) {
        counts[key] += 1;
      }
    });

  const data = dateKeys.map((key) => ({ date: key, count: counts[key] || 0 }));
  const maxCount = data.reduce((max, entry) => Math.max(max, entry.count), 0);

  return {
    range: {
      from: dateKeys[0],
      to: dateKeys[dateKeys.length - 1],
      days,
    },
    data,
    maxCount,
  };
}

function getUserEngagementTimeline(userId, options = {}) {
  const db = readGadTalkDb();
  const days = clampNumber(options.days, 7, 180, 30);
  const dateKeys = buildDateKeys(days, options.endDate || new Date());
  const likes = Object.fromEntries(dateKeys.map((key) => [key, 0]));
  const replies = Object.fromEntries(dateKeys.map((key) => [key, 0]));
  const reposts = Object.fromEntries(dateKeys.map((key) => [key, 0]));

  const userGadIds = new Set(db.gads.filter((g) => !g.deleted && areIdsEqual(g.userId, userId)).map((g) => g.id));

  db.likes.forEach((like) => {
    if (!userGadIds.has(like.gadId)) return;
    const key = toDateKey(like.createdAt);
    if (key && Object.prototype.hasOwnProperty.call(likes, key)) {
      likes[key] += 1;
    }
  });

  db.gads.forEach((gad) => {
    if (gad.deleted) return;
    const replyToId = gad.replyToId || gad.replyTo;
    if (!replyToId || !userGadIds.has(replyToId)) return;
    const key = toDateKey(gad.createdAt);
    if (key && Object.prototype.hasOwnProperty.call(replies, key)) {
      replies[key] += 1;
    }
  });

  db.outbox.forEach((entry) => {
    if (entry.type !== "regad" || !userGadIds.has(entry.gadId)) return;
    const key = toDateKey(entry.createdAt);
    if (key && Object.prototype.hasOwnProperty.call(reposts, key)) {
      reposts[key] += 1;
    }
  });

  db.gads.forEach((gad) => {
    if (gad.deleted || !gad.isRepost || !gad.repostOfId) return;
    if (!userGadIds.has(gad.repostOfId)) return;
    const key = toDateKey(gad.createdAt);
    if (key && Object.prototype.hasOwnProperty.call(reposts, key)) {
      reposts[key] += 1;
    }
  });

  const labels = dateKeys.map((key) => formatLabelFromDateKey(key));

  return {
    range: {
      from: dateKeys[0],
      to: dateKeys[dateKeys.length - 1],
      days,
    },
    labels,
    dateKeys,
    series: {
      likes: dateKeys.map((key) => likes[key] || 0),
      replies: dateKeys.map((key) => replies[key] || 0),
      reposts: dateKeys.map((key) => reposts[key] || 0),
    },
    totals: {
      likes: Object.values(likes).reduce((sum, val) => sum + val, 0),
      replies: Object.values(replies).reduce((sum, val) => sum + val, 0),
      reposts: Object.values(reposts).reduce((sum, val) => sum + val, 0),
    },
  };
}

function getUserFollowerGrowth(userId, options = {}) {
  const db = readGadTalkDb();
  const weeks = clampNumber(options.weeks, 4, 52, 12);
  const endDate = normalizeToUtcDate(options.endDate || new Date()) || new Date();
  const endWeekStart = startOfUtcWeek(endDate);
  const weekStarts = [];

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const d = new Date(endWeekStart);
    d.setUTCDate(endWeekStart.getUTCDate() - i * 7);
    weekStarts.push(d);
  }

  const followerDates = db.follows
    .filter((f) => areIdsEqual(f.followingId, userId))
    .map((f) => normalizeToUtcDate(f.createdAt))
    .filter(Boolean)
    .sort((a, b) => a - b);

  const counts = [];
  let runningTotal = 0;
  let cursor = 0;

  for (const weekStart of weekStarts) {
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

    while (cursor < followerDates.length && followerDates[cursor] <= weekEnd) {
      runningTotal += 1;
      cursor += 1;
    }

    counts.push(runningTotal);
  }

  return {
    range: {
      from: weekStarts[0].toISOString().slice(0, 10),
      to: weekStarts[weekStarts.length - 1].toISOString().slice(0, 10),
      weeks,
    },
    labels: weekStarts.map((date) => formatLabelFromDateKey(date.toISOString().slice(0, 10))),
    dateKeys: weekStarts.map((date) => date.toISOString().slice(0, 10)),
    counts,
  };
}

function getUserHashtagDistribution(userId, options = {}) {
  const db = readGadTalkDb();
  const limit = clampNumber(options.limit, 3, 12, 8);
  const counts = {};

  db.gads
    .filter((g) => !g.deleted && areIdsEqual(g.userId, userId))
    .forEach((gad) => {
      const tags = Array.isArray(gad.hashtags) && gad.hashtags.length > 0 ? gad.hashtags : extractHashtags(gad.content);
      tags.forEach((tag) => {
        const normalized = String(tag).toLowerCase();
        counts[normalized] = (counts[normalized] || 0) + 1;
      });
    });

  const entries = Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  const total = entries.reduce((sum, item) => sum + item.count, 0);
  const hashtags = entries.map((item) => ({
    ...item,
    percent: total ? Math.round((item.count / total) * 1000) / 10 : 0,
  }));

  return {
    total,
    hashtags,
  };
}

// ==================== FEATURE FLAG OPERATIONS ====================

function getFeatureFlags() {
  if (!featureFlagsCache) {
    const db = readGadTalkDb();
    ensureFeatureFlagsInDb(db);
    featureFlagsCache = db.featureFlags || [];
  }

  return [...featureFlagsCache].sort((a, b) => a.key.localeCompare(b.key));
}

function getFeatureFlagsMap() {
  const flags = getFeatureFlags();
  return flags.reduce((acc, flag) => {
    acc[normalizeFeatureFlagKey(flag.key)] = flag;
    return acc;
  }, {});
}

function isFeatureEnabled(flagKey) {
  const key = normalizeFeatureFlagKey(flagKey);
  const flags = getFeatureFlagsMap();
  if (!Object.prototype.hasOwnProperty.call(flags, key)) {
    return true;
  }
  return !!flags[key].enabled;
}

async function setFeatureFlag(flagKey, enabled, actorUserId = null) {
  const key = normalizeFeatureFlagKey(flagKey);
  if (!key) {
    throw new Error("Feature flag key is required");
  }

  let updatedFlag;
  let previousEnabled = null;

  await mutateAndWriteDb((db) => {
    ensureFeatureFlagsInDb(db);
    const index = db.featureFlags.findIndex((flag) => normalizeFeatureFlagKey(flag.key) === key);
    if (index >= 0) {
      previousEnabled = db.featureFlags[index].enabled;
      db.featureFlags[index].enabled = !!enabled;
      db.featureFlags[index].updatedAt = new Date().toISOString();
      db.featureFlags[index].updatedBy = actorUserId || "anonymous";
      updatedFlag = db.featureFlags[index];
    } else {
      updatedFlag = {
        key,
        enabled: !!enabled,
        description: "",
        updatedAt: new Date().toISOString(),
        updatedBy: actorUserId || "anonymous",
      };
      db.featureFlags.push(updatedFlag);
    }
  });

  featureFlagsCache = null;

  await createGadTalkAuditLog({
    actorUserId: actorUserId || "anonymous",
    eventType: "feature-flag-updated",
    payloadObject: {
      key,
      enabled: !!enabled,
      previousEnabled,
    },
  });

  return updatedFlag;
}

// ==================== EXPORTS ====================

module.exports = {
  // ID Generation
  generateGadTalkId,

  // Database Read/Write
  readGadTalkDb,
  writeGadTalkDb,
  readGadTalkDemoDb,
  mutateAndWriteDb,

  // Audit
  createGadTalkAuditLog,
  getGadTalkAuditLogs,

  // Database Integrity
  checkDbIntegrity,
  repairDb,
  checkAndRepairGadTalkDb,

  // Initialization
  initializeGadTalkDb,
  initializeGadTalkAuditDb,
  initializeAllGadTalkDatabases,
  resetGadTalkDatabaseWithDemoData,

  // Users
  gadTalkUsersDb,
  findGadTalkUserById,
  findGadTalkUserByEmail,
  findGadTalkUserByUsername,
  createGadTalkUser,
  updateGadTalkUserLastLogin,
  updateGadTalkUserProfile,
  getGadTalkUserStats,
  getUserById,
  getUserByUsername,

  // Gads
  gadTalkGadsDb,
  findGadById,
  getGadById,
  createGad,
  updateGad,
  deleteGad,
  extractHashtags,
  extractMentions,
  getGadsForYou,
  getGadsByUsers,
  getGadsByUser,
  getUserReplies,
  getUserLikedGads,
  getPopularGads,
  getReplies,
  searchGads,
  searchUsers,
  isGadVisibleToUser,
  incrementGadReplyCount,
  decrementGadReplyCount,
  incrementGadLikeCount,
  decrementGadLikeCount,
  incrementGadRegadCount,
  decrementGadRegadCount,

  // Follows
  createFollow,
  deleteFollow,
  getFollowers,
  getFollowing,
  isFollowing,

  // Likes
  createLike,
  deleteLike,
  hasUserLikedGad,

  // Regads
  createRegad,
  deleteRegad,
  hasUserRegadded,

  // Notifications
  createNotification,
  getNotifications,
  getNotificationById,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,

  // Blocks/Mutes
  createBlock,
  deleteBlock,
  hasBlocked,
  getBlockedUserIds,
  getBlockedByUserIds,
  createMute,
  deleteMute,
  hasMuted,
  getMutedUserIds,

  // Bookmarks
  createBookmark,
  deleteBookmark,
  getBookmarks,
  getBookmarksPaginated,
  hasUserBookmarked,

  // Hashtags
  incrementHashtagCount,
  getTrendingHashtags,
  getGadsByHashtag,

  // Batch counts (real-time)
  getBatchLikeCounts,
  getBatchReplyCounts,
  getBatchRepostCounts,

  // Status
  getGadTalkDbStatus,

  // Analytics
  getUserActivityHeatmap,
  getUserEngagementTimeline,
  getUserFollowerGrowth,
  getUserHashtagDistribution,

  // Feature flags
  getFeatureFlags,
  getFeatureFlagsMap,
  isFeatureEnabled,
  setFeatureFlag,
};
