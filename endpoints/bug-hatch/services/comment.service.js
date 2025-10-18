const {
  findBugHatchIssueById,
  findBugHatchProjectById,
  findBugHatchCommentsByIssueId,
  createBugHatchComment,
  updateBugHatchComment,
  softDeleteBugHatchComment,
  createBugHatchAuditLog,
  readBugHatchDemoDb,
  findBugHatchCommentById,
} = require("../db-bug-hatch.operations");
const { areIdsEqual } = require("../../../helpers/compare.helpers");

// RBAC Helpers (reused conceptually from issue.service)
function userCanSeeProject(project, user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "viewer") return true; // global read
  if (user.isDemo) return true; // demo snapshot read
  return project.members.includes(user.id);
}
function userCanMutateProject(project, user) {
  if (!user) return false;
  if (user.isDemo) return false;
  if (user.role === "admin") return true;
  return project.members.includes(user.id);
}

function validateCommentBody(body) {
  if (typeof body !== "string") return { valid: false, error: "body must be string" };
  const trimmed = body.trim();
  if (trimmed.length < 1) return { valid: false, error: "body cannot be empty" };
  if (trimmed.length > 2000) return { valid: false, error: "body too long" };
  return { valid: true };
}

function listCommentsService(issueId, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  let issue = findBugHatchIssueById(issueId);
  if (!issue) return { success: false, error: "Issue not found", errorType: "notfound" };
  let project = findBugHatchProjectById(issue.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  // Demo snapshot substitution
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
  // In demo mode, use demo db comments
  let comments = findBugHatchCommentsByIssueId(issue.id);
  if (currentUser.isDemo) {
    try {
      const demo = readBugHatchDemoDb();
      comments = (demo.comments || []).filter((c) => c.issueId === issue.id);
    } catch (e) {
      comments = [];
    }
  }
  // Exclude deleted
  comments = comments.filter((c) => !c.deleted);
  // Sort by createdAt asc
  comments.sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  return { success: true, comments };
}

async function createCommentService(issueId, data, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  const issue = findBugHatchIssueById(issueId);
  if (!issue) return { success: false, error: "Issue not found", errorType: "notfound" };
  const project = findBugHatchProjectById(issue.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (!userCanMutateProject(project, currentUser))
    return { success: false, error: "Forbidden", errorType: "forbidden" };

  const val = validateCommentBody(data.body || "");
  if (!val.valid) return { success: false, error: val.error };

  // parent check (threaded)
  if (data.parentId) {
    const parent = findBugHatchCommentById(data.parentId);
    if (!parent || !areIdsEqual(parent.issueId, issue.id)) {
      return { success: false, error: "Invalid parentId" };
    }
  }

  try {
    const comment = await createBugHatchComment({
      issueId: issue.id,
      authorId: currentUser.id,
      parentId: data.parentId || null,
      body: data.body.trim(),
    });
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "comment.created",
      payloadObject: { issueId: issue.id, commentId: comment.id },
    });
    return { success: true, comment };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function patchCommentService(commentId, patch, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  const existing = findBugHatchCommentById(commentId);
  if (!existing || existing.deleted) return { success: false, error: "Comment not found", errorType: "notfound" };
  const issue = findBugHatchIssueById(existing.issueId);
  if (!issue) return { success: false, error: "Issue not found", errorType: "notfound" };
  const project = findBugHatchProjectById(issue.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (!userCanMutateProject(project, currentUser))
    return { success: false, error: "Forbidden", errorType: "forbidden" };
  if (!areIdsEqual(existing.authorId, currentUser.id) && currentUser.role !== "admin") {
    return { success: false, error: "Cannot edit others' comments", errorType: "forbidden" };
  }

  if (patch.body !== undefined) {
    const val = validateCommentBody(patch.body);
    if (!val.valid) return { success: false, error: val.error };
  }

  try {
    const updated = await updateBugHatchComment(commentId, { body: patch.body });
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "comment.updated",
      payloadObject: { issueId: issue.id, commentId: updated.id },
    });
    return { success: true, comment: updated };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function deleteCommentService(commentId, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  const existing = findBugHatchCommentById(commentId);
  if (!existing || existing.deleted) return { success: false, error: "Comment not found", errorType: "notfound" };
  const issue = findBugHatchIssueById(existing.issueId);
  if (!issue) return { success: false, error: "Issue not found", errorType: "notfound" };
  const project = findBugHatchProjectById(issue.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (!userCanMutateProject(project, currentUser))
    return { success: false, error: "Forbidden", errorType: "forbidden" };
  if (!areIdsEqual(existing.authorId, currentUser.id) && currentUser.role !== "admin") {
    return { success: false, error: "Cannot delete others' comments", errorType: "forbidden" };
  }

  try {
    const deleted = await softDeleteBugHatchComment(commentId);
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "comment.deleted",
      payloadObject: { issueId: issue.id, commentId: deleted.id },
    });
    return { success: true, comment: deleted };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  listCommentsService,
  createCommentService,
  patchCommentService,
  deleteCommentService,
};
