const {
  findBugHatchIssueById,
  findBugHatchProjectById,
  findBugHatchCommentsByIssueId,
  findBugHatchAttachmentsByIssueId,
  getBugHatchAuditLogs,
  readBugHatchDemoDb,
  findBugHatchUserById,
} = require("../db-bug-hatch.operations");

function userCanSeeProject(project, user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "viewer") return true;
  if (user.isDemo) return true;
  return project.members.includes(user.id);
}

function activityForIssueService(issueId, currentUser) {
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

  // Load comments & attachments (exclude deleted)
  let comments = findBugHatchCommentsByIssueId(issue.id).filter((c) => !c.deleted);
  let attachments = findBugHatchAttachmentsByIssueId(issue.id).filter((a) => !a.deleted);
  if (currentUser.isDemo) {
    try {
      const demo = readBugHatchDemoDb();
      comments = (demo.comments || []).filter((c) => c.issueId === issue.id && !c.deleted);
      attachments = (demo.attachments || []).filter((a) => a.issueId === issue.id && !a.deleted);
    } catch (e) {
      comments = [];
      attachments = [];
    }
  }

  // Audit events filtered for this issue
  const audit = getBugHatchAuditLogs({}).filter((a) => a.payloadObject && a.payloadObject.issueId === issue.id);

  // Helper function to get user name
  const getUserName = (userId) => {
    if (!userId) return "Unknown User";
    let user = findBugHatchUserById(userId);
    if (currentUser.isDemo && !user) {
      try {
        const demo = readBugHatchDemoDb();
        user = (demo.users || []).find((u) => u.id === userId);
      } catch (e) {
        /* ignore */
      }
    }
    return user ? user.name : userId; // fallback to ID if name not found
  };

  const activity = [];
  for (const c of comments) {
    const userName = getUserName(c.authorId);
    activity.push({
      type: "comment",
      id: c.id,
      createdAt: c.createdAt,
      data: { ...c, authorName: userName },
    });
  }
  for (const a of attachments) {
    const userName = getUserName(a.uploadedBy);
    activity.push({
      type: "attachment",
      id: a.id,
      createdAt: a.createdAt,
      data: { ...a, uploaderName: userName },
    });
  }
  for (const ev of audit) {
    const userName = getUserName(ev.actorUserId);
    activity.push({
      type: "event",
      id: ev.id,
      createdAt: ev.createdAt,
      data: { ...ev, actorName: userName },
    });
  }

  activity.sort((x, y) => (x.createdAt < y.createdAt ? -1 : x.createdAt > y.createdAt ? 1 : 0));

  return { success: true, activity };
}

module.exports = { activityForIssueService };
