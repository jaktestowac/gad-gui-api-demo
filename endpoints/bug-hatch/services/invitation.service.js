const { getCurrentDateTimeISO } = require("../../../helpers/datetime.helpers");
const { logDebug } = require("../../../helpers/logger-api");
const { areStringsEqualIgnoringCase } = require("../../../helpers/compare.helpers");
const {
  findBugHatchInvitationById,
  findBugHatchInvitationByToken,
  findBugHatchInvitationsByProjectId,
  findBugHatchInvitationsByEmail,
  createBugHatchInvitation,
  updateBugHatchInvitation,
  deleteBugHatchInvitation,
  findBugHatchProjectById,
  addBugHatchProjectMember,
  createBugHatchAuditLog,
} = require("../db-bug-hatch.operations");

// ==================== VALIDATION ====================

/**
 * Validate invitation data
 * @param {object} data - Invitation data { projectId, email }
 * @returns {object} { valid: boolean, error?: string }
 */
function validateInvitationData(data) {
  const { projectId, email } = data;

  if (!projectId || !email) {
    return { valid: false, error: "Project ID and email are required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true };
}

// ==================== INVITATION SERVICES ====================

/**
 * Create invitation
 * @param {object} invitationData - Invitation data { projectId, email }
 * @param {object} currentUser - Current user
 * @returns {Promise<object>} { success: boolean, invitation?: object, error?: string }
 */
async function createInvitationService(invitationData, currentUser) {
  try {
    const validation = validateInvitationData(invitationData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { projectId, email } = invitationData;

    // Check if user is project admin
    const project = findBugHatchProjectById(projectId);
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const isProjectAdmin = project.admin === currentUser.id;
    const isGlobalAdmin = currentUser.role === "admin";

    if (!isGlobalAdmin && !isProjectAdmin) {
      return { success: false, error: "Forbidden" };
    }

    // Check if user is already a member
    if (project.members.includes(email)) {
      return { success: false, error: "User is already a member of this project" };
    }

    // Check if invitation already exists
    const existingInvitations = findBugHatchInvitationsByEmail(email).filter(
      (inv) => inv.projectId === projectId && inv.status === "pending"
    );

    if (existingInvitations.length > 0) {
      return { success: false, error: "Invitation already sent to this email" };
    }

    const invitation = await createBugHatchInvitation({
      projectId,
      email,
      invitedBy: currentUser.id,
    });

    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "invitation.sent",
      payloadObject: { invitationId: invitation.id, projectId, email },
    });

    logDebug("Invitation created:", { id: invitation.id, email, projectId });
    return { success: true, invitation };
  } catch (error) {
    logDebug("Error creating invitation:", error);
    return { success: false, error: error.message || "Failed to create invitation" };
  }
}

/**
 * Get invitations for project
 * @param {string} projectId - Project ID
 * @param {object} currentUser - Current user
 * @returns {Promise<object>} { success: boolean, invitations?: array, error?: string }
 */
async function getProjectInvitationsService(projectId, currentUser) {
  try {
    // Check if user is project admin
    const project = findBugHatchProjectById(projectId);
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const isProjectAdmin = project.admin === currentUser.id;
    const isGlobalAdmin = currentUser.role === "admin";

    if (!isGlobalAdmin && !isProjectAdmin) {
      return { success: false, error: "Forbidden" };
    }

    const invitations = findBugHatchInvitationsByProjectId(projectId);

    logDebug("Project invitations retrieved:", { projectId, count: invitations.length });
    return { success: true, invitations };
  } catch (error) {
    logDebug("Error getting project invitations:", error);
    return { success: false, error: error.message || "Failed to get invitations" };
  }
}

/**
 * Accept invitation
 * @param {string} token - Invitation token
 * @param {object} currentUser - Current user
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
async function acceptInvitationService(token, currentUser) {
  try {
    const invitation = findBugHatchInvitationByToken(token);
    if (!invitation) {
      return { success: false, error: "Invitation not found" };
    }

    if (invitation.status !== "pending") {
      return { success: false, error: "Invitation is no longer valid" };
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expiresAt)) {
      await updateBugHatchInvitation(invitation.id, { status: "expired" });
      return { success: false, error: "Invitation has expired" };
    }

    // Check if current user matches the invited email
    if (!areStringsEqualIgnoringCase(currentUser.email, invitation.email)) {
      return { success: false, error: "This invitation is not for your email address" };
    }

    // Add user to project
    await addBugHatchProjectMember(invitation.projectId, currentUser.id);

    // Update invitation status
    await updateBugHatchInvitation(invitation.id, { status: "accepted" });

    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "invitation.accepted",
      payloadObject: { invitationId: invitation.id, projectId: invitation.projectId },
    });

    logDebug("Invitation accepted:", { id: invitation.id, userId: currentUser.id });
    return { success: true };
  } catch (error) {
    logDebug("Error accepting invitation:", error);
    return { success: false, error: error.message || "Failed to accept invitation" };
  }
}

/**
 * Reject invitation
 * @param {string} token - Invitation token
 * @param {object} currentUser - Current user
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
async function rejectInvitationService(token, currentUser) {
  try {
    const invitation = findBugHatchInvitationByToken(token);
    if (!invitation) {
      return { success: false, error: "Invitation not found" };
    }

    if (invitation.status !== "pending") {
      return { success: false, error: "Invitation is no longer valid" };
    }

    // Check if current user matches the invited email
    if (!areStringsEqualIgnoringCase(currentUser.email, invitation.email)) {
      return { success: false, error: "This invitation is not for your email address" };
    }

    // Update invitation status
    await updateBugHatchInvitation(invitation.id, { status: "rejected" });

    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "invitation.rejected",
      payloadObject: { invitationId: invitation.id, projectId: invitation.projectId },
    });

    logDebug("Invitation rejected:", { id: invitation.id, userId: currentUser.id });
    return { success: true };
  } catch (error) {
    logDebug("Error rejecting invitation:", error);
    return { success: false, error: error.message || "Failed to reject invitation" };
  }
}

/**
 * Cancel invitation
 * @param {string} invitationId - Invitation ID
 * @param {object} currentUser - Current user
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
async function cancelInvitationService(invitationId, currentUser) {
  try {
    const invitation = findBugHatchInvitationById(invitationId);
    if (!invitation) {
      return { success: false, error: "Invitation not found" };
    }

    // Check if user can cancel (project admin or the one who sent it)
    const project = findBugHatchProjectById(invitation.projectId);
    const isProjectAdmin = project && project.admin === currentUser.id;
    const isGlobalAdmin = currentUser.role === "admin";
    const isInviter = invitation.invitedBy === currentUser.id;

    if (!isGlobalAdmin && !isProjectAdmin && !isInviter) {
      return { success: false, error: "Forbidden" };
    }

    if (invitation.status !== "pending") {
      return { success: false, error: "Cannot cancel invitation that is not pending" };
    }

    await deleteBugHatchInvitation(invitationId);

    await createBugHatchAuditLog({
      actorUserId: currentUser.id,
      eventType: "invitation.cancelled",
      payloadObject: { invitationId, projectId: invitation.projectId, email: invitation.email },
    });

    logDebug("Invitation cancelled:", { id: invitationId });
    return { success: true };
  } catch (error) {
    logDebug("Error cancelling invitation:", error);
    return { success: false, error: error.message || "Failed to cancel invitation" };
  }
}

module.exports = {
  createInvitationService,
  getProjectInvitationsService,
  acceptInvitationService,
  rejectInvitationService,
  cancelInvitationService,
};
