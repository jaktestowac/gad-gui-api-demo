const {
  bugHatchProjectsDb,
  findBugHatchProjectById,
  bugHatchIssuesDb,
  findBugHatchIssueById,
  createBugHatchIssue,
  updateBugHatchIssue,
  archiveBugHatchIssue,
  transitionBugHatchIssue,
  createBugHatchAuditLog,
  readBugHatchDemoDb,
} = require("../../endpoints/bug-hatch/db-bug-hatch.operations");
const { areIdsEqual } = require("../../helpers/compare.helpers");

// ================= Validation Helpers =================
function validateIssueCreate(data) {
  if (!data) return { valid: false, error: "Missing payload" };
  if (!data.projectId) return { valid: false, error: "projectId required" };
  if (!data.title || data.title.trim().length < 3) return { valid: false, error: "title must be >=3 chars" };
  if (data.title.length > 300) return { valid: false, error: "title too long" };
  if (data.description && data.description.length > 5000) return { valid: false, error: "description too long" };
  return { valid: true };
}

function validateTransition(project, currentStatus, toStatus) {
  if (!project.workflow || !project.workflow.transitions) return false;
  const allowed = project.workflow.transitions[currentStatus] || [];
  return allowed.includes(toStatus);
}

// ================= RBAC Helpers =================
function userCanSeeProject(project, user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "viewer") return true; // viewers have global read
  if (user.isDemo) return true; // demo user can view all (read-only)
  return project.members.includes(user.id);
}

function userCanMutateProject(project, user) {
  if (!user) return false;
  if (user.isDemo) return false; // demo read-only (middleware also blocks but double guard)
  if (user.role === "admin") return true;
  // Could extend: allow members to create issues; for Phase 3 we'll allow members to create/edit within their projects
  return project.members.includes(user.id);
}

// ================= Services =================
function listIssuesService(projectId, query, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };

  const forceDemo = query && (query.demo === "true" || query.forceDemo === "true");
  const useDemo = currentUser.isDemo || forceDemo;

  let originalLookup = projectId;
  let project = findBugHatchProjectById(projectId);

  // Fallback: allow using project KEY instead of internal id
  if (!project) {
    try {
      const all = bugHatchProjectsDb();
      project = all.find((p) => (p.key || "").toLowerCase() === projectId.toLowerCase());
      if (project) {
        projectId = project.id; // normalize for downstream filtering
      }
    } catch (e) {
      /* ignore */
    }
  }

  // If still not found and demo snapshot is in play, attempt lookup inside demo dataset (id OR key)
  if (!project && useDemo) {
    try {
      const demo = readBugHatchDemoDb();
      const demoProjects = demo.projects || [];
      project =
        demoProjects.find((p) => p.id === originalLookup) ||
        demoProjects.find((p) => (p.key || "").toLowerCase() === originalLookup.toLowerCase());
      if (project) {
        projectId = project.id;
      }
    } catch (e) {
      /* ignore */
    }
  }

  if (!project) {
    // Provide helpful hint in demo mode
    if (useDemo) {
      try {
        const demo = readBugHatchDemoDb();
        const ids = (demo.projects || []).map((p) => p.id).join(", ");
        const keys = (demo.projects || []).map((p) => p.key).join(", ");
        return {
          success: false,
          error: `Project not found (tried id or key). Demo project ids: ${ids}. Keys: ${keys}.`,
          errorType: "notfound",
        };
      } catch (e) {
        return { success: false, error: "Project not found", errorType: "notfound" };
      }
    }
    try {
      const allReal = bugHatchProjectsDb();
      const keysReal = allReal.map((p) => p.key).join(", ");
      return {
        success: false,
        error: keysReal ? `Project not found (tried id or key). Existing keys: ${keysReal}` : "Project not found",
        errorType: "notfound",
      };
    } catch (e) {
      return { success: false, error: "Project not found", errorType: "notfound" };
    }
  }

  // Load issues
  let issues = bugHatchIssuesDb();
  if (useDemo) {
    try {
      const demo = readBugHatchDemoDb();
      // ensure we use demo snapshot project object if available (keeps fields consistent in responses)
      const demoProject = (demo.projects || []).find((p) => p.id === projectId);
      if (demoProject) project = demoProject;
      issues = (demo.issues || []).filter((i) => i.projectId === projectId);
    } catch (e) {
      issues = [];
    }
  } else {
    issues = issues.filter((i) => areIdsEqual(i.projectId, projectId));
  }

  if (!userCanSeeProject(project, currentUser)) {
    return { success: false, error: "Forbidden", errorType: "forbidden" };
  }

  const {
    status,
    type,
    labels,
    assigneeId,
    search,
    sort = "createdAt",
    order = "desc",
    limit = 50,
    offset = 0,
  } = query || {};

  if (status) issues = issues.filter((i) => i.status === status);
  if (type) issues = issues.filter((i) => i.type === type);
  if (assigneeId) issues = issues.filter((i) => areIdsEqual(i.assigneeId, assigneeId));
  if (labels) {
    const labelArr = labels
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);
    if (labelArr.length) issues = issues.filter((i) => labelArr.every((l) => i.labels.includes(l)));
  }
  if (search) {
    const s = search.toLowerCase();
    issues = issues.filter((i) => i.title.toLowerCase().includes(s) || (i.description || "").toLowerCase().includes(s));
  }

  // Sorting
  issues = issues.sort((a, b) => {
    const dir = order === "asc" ? 1 : -1;
    if (a[sort] < b[sort]) return -1 * dir;
    if (a[sort] > b[sort]) return 1 * dir;
    return 0;
  });

  const total = issues.length;
  const page = issues.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  return { success: true, issues: page, total };
}

async function createIssueService(data, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  const val = validateIssueCreate(data);
  if (!val.valid) return { success: false, error: val.error };
  const project = findBugHatchProjectById(data.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (!userCanMutateProject(project, currentUser))
    return { success: false, error: "Forbidden", errorType: "forbidden" };

  try {
    const issue = await createBugHatchIssue({ ...data, createdBy: currentUser.id });
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "issue.created",
      payloadObject: { issueId: issue.id, projectId: project.id },
    });
    return { success: true, issue };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getIssueService(issueId, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  let issue = findBugHatchIssueById(issueId);
  if (!issue) return { success: false, error: "Issue not found", errorType: "notfound" };
  let project = findBugHatchProjectById(issue.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (currentUser.isDemo) {
    try {
      const demo = readBugHatchDemoDb();
      issue = (demo.issues || []).find((i) => i.id === issueId) || issue;
      project = (demo.projects || []).find((p) => p.id === issue.projectId) || project;
    } catch (e) {
      /* ignore */
    }
  }
  if (!userCanSeeProject(project, currentUser)) return { success: false, error: "Forbidden", errorType: "forbidden" };
  return { success: true, issue };
}

async function patchIssueService(issueId, patch, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  const existing = findBugHatchIssueById(issueId);
  if (!existing) return { success: false, error: "Issue not found", errorType: "notfound" };
  const project = findBugHatchProjectById(existing.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (!userCanMutateProject(project, currentUser))
    return { success: false, error: "Forbidden", errorType: "forbidden" };

  // basic field validations
  if (patch.title && patch.title.length < 3) return { success: false, error: "title too short" };
  if (patch.description && patch.description.length > 5000) return { success: false, error: "description too long" };
  if (patch.status && !project.workflow.statuses.includes(patch.status)) {
    return { success: false, error: "Invalid status for workflow" };
  }

  try {
    const updated = await updateBugHatchIssue(issueId, patch);
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "issue.updated",
      payloadObject: { issueId: updated.id, projectId: project.id },
    });
    return { success: true, issue: updated };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function transitionIssueService(issueId, toStatus, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  const existing = findBugHatchIssueById(issueId);
  if (!existing) return { success: false, error: "Issue not found", errorType: "notfound" };
  const project = findBugHatchProjectById(existing.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (!userCanMutateProject(project, currentUser))
    return { success: false, error: "Forbidden", errorType: "forbidden" };
  if (!project.workflow.statuses.includes(toStatus)) return { success: false, error: "Invalid status" };
  if (!validateTransition(project, existing.status, toStatus)) {
    return { success: false, error: `Transition not allowed from ${existing.status} to ${toStatus}` };
  }
  try {
    const transitioned = await transitionBugHatchIssue(issueId, toStatus);
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "issue.transition",
      payloadObject: { issueId: transitioned.id, from: existing.status, to: toStatus },
    });
    return { success: true, issue: transitioned };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function archiveIssueService(issueId, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  const existing = findBugHatchIssueById(issueId);
  if (!existing) return { success: false, error: "Issue not found", errorType: "notfound" };
  const project = findBugHatchProjectById(existing.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (!userCanMutateProject(project, currentUser))
    return { success: false, error: "Forbidden", errorType: "forbidden" };
  try {
    const archived = await archiveBugHatchIssue(issueId);
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "issue.archived",
      payloadObject: { issueId: archived.id, projectId: project.id },
    });
    return { success: true, issue: archived };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  listIssuesService,
  createIssueService,
  getIssueService,
  patchIssueService,
  transitionIssueService,
  archiveIssueService,
};
