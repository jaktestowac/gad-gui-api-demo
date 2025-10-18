const fs = require("fs");
const path = require("path");
const {
  findBugHatchIssueById,
  findBugHatchProjectById,
  findBugHatchAttachmentsByIssueId,
  createBugHatchAttachment,
  markBugHatchAttachmentDeleted,
  createBugHatchAuditLog,
  readBugHatchDemoDb,
  findBugHatchAttachmentById,
} = require("../endpoints/bug-hatch/db-bug-hatch.operations");
const { areIdsEqual } = require("../../../helpers/compare.helpers");

const UPLOAD_DIR = path.join(__dirname, "../../../uploads/bug-hatch");
if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    /* ignore */
  }
}

function userCanSeeProject(project, user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "viewer") return true;
  if (user.isDemo) return true;
  return project.members.includes(user.id);
}
function userCanMutateProject(project, user) {
  if (!user) return false;
  if (user.isDemo) return false;
  if (user.role === "admin") return true;
  return project.members.includes(user.id);
}

function listAttachmentsService(issueId, currentUser) {
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

  let attachments = findBugHatchAttachmentsByIssueId(issue.id).filter((a) => !a.deleted);
  if (currentUser.isDemo) {
    try {
      const demo = readBugHatchDemoDb();
      attachments = (demo.attachments || []).filter((a) => a.issueId === issue.id && !a.deleted);
    } catch (e) {
      attachments = [];
    }
  }
  attachments.sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  return { success: true, attachments };
}

async function uploadAttachmentService(issueId, file, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  const issue = findBugHatchIssueById(issueId);
  if (!issue) return { success: false, error: "Issue not found", errorType: "notfound" };
  const project = findBugHatchProjectById(issue.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (!userCanMutateProject(project, currentUser))
    return { success: false, error: "Forbidden", errorType: "forbidden" };
  if (!file) return { success: false, error: "No file uploaded" };

  // Basic validation
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB simple limit
  if (file.size > MAX_SIZE) return { success: false, error: "File too large (max 2MB)" };

  try {
    const attachment = await createBugHatchAttachment({
      issueId: issue.id,
      filename: file.originalname,
      storedFilename: file.filename,
      path: file.path,
      size: file.size,
      mime: file.mimetype,
      uploadedBy: currentUser.id,
    });
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "attachment.uploaded",
      payloadObject: { issueId: issue.id, attachmentId: attachment.id },
    });
    return { success: true, attachment };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getAttachmentService(attachmentId, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  const attachment = findBugHatchAttachmentById(attachmentId);
  if (!attachment || attachment.deleted)
    return { success: false, error: "Attachment not found", errorType: "notfound" };
  const issue = findBugHatchIssueById(attachment.issueId);
  if (!issue) return { success: false, error: "Issue not found", errorType: "notfound" };
  const project = findBugHatchProjectById(issue.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (!userCanSeeProject(project, currentUser)) return { success: false, error: "Forbidden", errorType: "forbidden" };
  return { success: true, attachment };
}

async function deleteAttachmentService(attachmentId, currentUser) {
  if (!currentUser) return { success: false, error: "Not authenticated", errorType: "unauthorized" };
  const attachment = findBugHatchAttachmentById(attachmentId);
  if (!attachment || attachment.deleted)
    return { success: false, error: "Attachment not found", errorType: "notfound" };
  const issue = findBugHatchIssueById(attachment.issueId);
  if (!issue) return { success: false, error: "Issue not found", errorType: "notfound" };
  const project = findBugHatchProjectById(issue.projectId);
  if (!project) return { success: false, error: "Project not found", errorType: "notfound" };
  if (!userCanMutateProject(project, currentUser))
    return { success: false, error: "Forbidden", errorType: "forbidden" };
  if (!areIdsEqual(attachment.uploadedBy, currentUser.id) && currentUser.role !== "admin") {
    return { success: false, error: "Cannot delete others' attachments", errorType: "forbidden" };
  }

  try {
    const deleted = await markBugHatchAttachmentDeleted(attachmentId);
    // attempt to unlink file (best effort)
    try {
      fs.unlinkSync(attachment.path);
    } catch (e) {
      /* ignore */
    }
    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "attachment.deleted",
      payloadObject: { issueId: issue.id, attachmentId: deleted.id },
    });
    return { success: true, attachment: deleted };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  listAttachmentsService,
  uploadAttachmentService,
  getAttachmentService,
  deleteAttachmentService,
  UPLOAD_DIR,
};
