const {
  bugHatchProjectsDb,
  createBugHatchProject,
  updateBugHatchProject,
  addBugHatchProjectMember,
  removeBugHatchProjectMember,
  findBugHatchProjectById,
  createBugHatchAuditLog,
  bugHatchUsersDb,
  readBugHatchDemoDb,
} = require("../db-bug-hatch.operations");
const { areStringsEqualIgnoringCase } = require("../../../helpers/compare.helpers");

// ==================== VALIDATION ====================
function validateProjectKey(key) {
  if (!key) return { valid: false, error: "Project key is required" };
  if (!/^[A-Z][A-Z0-9]{1,7}$/.test(key)) {
    return { valid: false, error: "Project key must be 2-8 chars, uppercase letters/numbers, start with letter" };
  }
  return { valid: true };
}

function validateProjectName(name) {
  if (!name) return { valid: false, error: "Project name is required" };
  if (name.length < 2) return { valid: false, error: "Project name too short" };
  if (name.length > 120) return { valid: false, error: "Project name too long" };
  return { valid: true };
}

function validateWorkflow(workflow) {
  if (!workflow) return { valid: true };
  if (!Array.isArray(workflow.statuses) || workflow.statuses.length === 0) {
    return { valid: false, error: "Workflow statuses must be non-empty array" };
  }
  if (typeof workflow.transitions !== "object") {
    return { valid: false, error: "Workflow transitions must be object" };
  }
  return { valid: true };
}

// ==================== SERVICES ====================
async function createProjectService(data, currentUser) {
  // RBAC: only admin can create
  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, error: "Only admin users can create projects", errorType: "forbidden" };
  }
  const keyValidation = validateProjectKey(data.key);
  if (!keyValidation.valid) return { success: false, error: keyValidation.error };
  const nameValidation = validateProjectName(data.name);
  if (!nameValidation.valid) return { success: false, error: nameValidation.error };
  const workflowValidation = validateWorkflow(data.workflow);
  if (!workflowValidation.valid) return { success: false, error: workflowValidation.error };

  // uniqueness
  if (bugHatchProjectsDb().some((p) => areStringsEqualIgnoringCase(p.key, data.key))) {
    return { success: false, error: "Project key already exists", errorType: "unique" };
  }

  const project = await createBugHatchProject({
    key: data.key.trim().toUpperCase(),
    name: data.name.trim(),
    createdBy: currentUser.id,
    workflow: data.workflow,
  });

  await createBugHatchAuditLog({
    actorUserId: currentUser.id,
    eventType: "project.created",
    payloadObject: { projectId: project.id, key: project.key },
  });

  return { success: true, project };
}

function listProjectsService(query, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };

  const { search, archived, limit = 25, offset = 0, sort = "createdAt", order = "desc" } = query || {};

  let projects = bugHatchProjectsDb();
  if (currentUser.isDemo) {
    // Use demo DB snapshot for listing
    try {
      const demo = readBugHatchDemoDb();
      projects = demo.projects || [];
    } catch (e) {
      // fallback silently to empty; return success with no projects
      projects = [];
    }
  }

  // RBAC Visibility:
  // - admin: all
  // - viewer: all (read-only role)
  // - demo: all (demo snapshot)
  // - member: only their projects
  if (currentUser.role !== "admin" && currentUser.role !== "viewer" && !currentUser.isDemo) {
    projects = projects.filter((p) => p.members.includes(currentUser.id));
  }

  if (search) {
    const s = search.toLowerCase();
    projects = projects.filter((p) => p.name.toLowerCase().includes(s) || p.key.toLowerCase().includes(s));
  }
  if (archived === "true") {
    // only archived
    projects = projects.filter((p) => p.archived === true);
  } else if (archived === "false") {
    projects = projects.filter((p) => p.archived !== true);
  }

  // sorting
  projects = projects.sort((a, b) => {
    const dir = order === "asc" ? 1 : -1;
    if (a[sort] < b[sort]) return -1 * dir;
    if (a[sort] > b[sort]) return 1 * dir;
    return 0;
  });

  const total = projects.length;
  const page = projects.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  return { success: true, projects: page, total };
}

function getProjectService(projectId, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  let project = findBugHatchProjectById(projectId);
  // Fallback: allow using project KEY
  if (!project) {
    try {
      const all = bugHatchProjectsDb();
      project = all.find((p) => (p.key || "").toLowerCase() === projectId.toLowerCase()) || project;
    } catch (e) {
      /* ignore */
    }
  }
  if (currentUser.isDemo) {
    try {
      const demo = readBugHatchDemoDb();
      project =
        (demo.projects || []).find((p) => p.id === projectId) ||
        project ||
        (demo.projects || []).find((p) => (p.key || "").toLowerCase() === projectId.toLowerCase());
    } catch (e) {
      // ignore
    }
  }
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (currentUser.role !== "admin" && currentUser.role !== "viewer" && !currentUser.isDemo) {
    if (!project.members.includes(currentUser.id)) {
      return { success: false, error: "Forbidden", errorType: "forbidden" };
    }
  }
  return { success: true, project };
}

async function patchProjectService(projectId, patch, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  if (currentUser.role !== "admin") {
    return { success: false, error: "Only admin can update project", errorType: "forbidden" };
  }
  if (patch.key) {
    return { success: false, error: "Project key cannot be changed" };
  }
  if (patch.name) {
    const nameValidation = validateProjectName(patch.name);
    if (!nameValidation.valid) return { success: false, error: nameValidation.error };
  }
  if (patch.workflow) {
    const workflowValidation = validateWorkflow(patch.workflow);
    if (!workflowValidation.valid) return { success: false, error: workflowValidation.error };
  }
  try {
    const updated = await updateBugHatchProject(projectId, patch);
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "project.updated",
      payloadObject: { projectId: updated.id, archived: updated.archived },
    });
    return { success: true, project: updated };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function addMemberService(projectId, userId, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  if (currentUser.role !== "admin") return { success: false, error: "Forbidden", errorType: "forbidden" };
  const userExists = bugHatchUsersDb().some((u) => u.id === userId);
  if (!userExists) return { success: false, error: "User not found" };
  try {
    const project = await addBugHatchProjectMember(projectId, userId);
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "project.member.added",
      payloadObject: { projectId, userId },
    });
    return { success: true, project };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function removeMemberService(projectId, userId, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  if (currentUser.role !== "admin") return { success: false, error: "Forbidden", errorType: "forbidden" };
  try {
    const project = await removeBugHatchProjectMember(projectId, userId);
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "project.member.removed",
      payloadObject: { projectId, userId },
    });
    return { success: true, project };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  createProjectService,
  listProjectsService,
  getProjectService,
  patchProjectService,
  addMemberService,
  removeMemberService,
};
