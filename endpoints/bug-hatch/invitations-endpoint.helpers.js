const { logError } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");
const {
  HTTP_OK,
  HTTP_CREATED,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_FORBIDDEN,
} = require("../../helpers/response.helpers");
const {
  createInvitationService,
  getProjectInvitationsService,
  acceptInvitationService,
  rejectInvitationService,
  cancelInvitationService,
} = require("./services/invitation.service");
const { verifyToken } = require("../../helpers/jwtauth");

// ==================== INVITATION HANDLERS ====================

/**
 * Create invitation
 * POST /api/bug-hatch/invitations
 */
async function handleCreateInvitation(req, res) {
  try {
    const user = getCurrentUserFromReq(req);
    if (!user) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    const { projectId, email } = req.body;

    const result = await createInvitationService({ projectId, email }, user);

    if (!result.success) {
      let statusCode = HTTP_BAD_REQUEST;
      if (result.error && result.error.includes("Forbidden")) {
        statusCode = HTTP_FORBIDDEN;
      }
      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_CREATED).send({
      ok: true,
      data: result.invitation,
    });
  } catch (error) {
    logError("BugHatch create invitation error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to create invitation"));
  }
}

/**
 * Get project invitations
 * GET /api/bug-hatch/projects/:projectId/invitations
 */
async function handleGetProjectInvitations(req, res) {
  try {
    const user = getCurrentUserFromReq(req);
    if (!user) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    const projectId = req.params.projectId;
    const result = await getProjectInvitationsService(projectId, user);

    if (!result.success) {
      let statusCode = HTTP_BAD_REQUEST;
      if (result.error && result.error.includes("Forbidden")) {
        statusCode = HTTP_FORBIDDEN;
      } else if (result.error && result.error.includes("not found")) {
        statusCode = 404;
      }
      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: result.invitations,
    });
  } catch (error) {
    logError("BugHatch get project invitations error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get invitations"));
  }
}

/**
 * Accept invitation
 * POST /api/bug-hatch/invitations/:token/accept
 */
async function handleAcceptInvitation(req, res) {
  try {
    const user = getCurrentUserFromReq(req);
    if (!user) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    const token = req.params.token;

    const result = await acceptInvitationService(token, user);

    if (!result.success) {
      let statusCode = HTTP_BAD_REQUEST;
      if (result.error && result.error.includes("not found")) {
        statusCode = 404;
      }
      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    logError("BugHatch accept invitation error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to accept invitation"));
  }
}

/**
 * Reject invitation
 * POST /api/bug-hatch/invitations/:token/reject
 */
async function handleRejectInvitation(req, res) {
  try {
    const user = getCurrentUserFromReq(req);
    if (!user) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    const token = req.params.token;

    const result = await rejectInvitationService(token, user);

    if (!result.success) {
      let statusCode = HTTP_BAD_REQUEST;
      if (result.error && result.error.includes("not found")) {
        statusCode = 404;
      }
      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      message: "Invitation rejected",
    });
  } catch (error) {
    logError("BugHatch reject invitation error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to reject invitation"));
  }
}

/**
 * Cancel invitation
 * DELETE /api/bug-hatch/invitations/:invitationId
 */
async function handleCancelInvitation(req, res) {
  try {
    const user = getCurrentUserFromReq(req);
    if (!user) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    const invitationId = req.params.invitationId;

    const result = await cancelInvitationService(invitationId, user);

    if (!result.success) {
      let statusCode = HTTP_BAD_REQUEST;
      if (result.error && result.error.includes("Forbidden")) {
        statusCode = HTTP_FORBIDDEN;
      } else if (result.error && result.error.includes("not found")) {
        statusCode = 404;
      }
      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      message: "Invitation cancelled",
    });
  } catch (error) {
    logError("BugHatch cancel invitation error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to cancel invitation"));
  }
}

function getCurrentUserFromReq(req) {
  const token = req.cookies["bug-hatch-token"];
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded instanceof Error) return null;
  const base = { id: decoded.userId, role: decoded.role, email: decoded.email, isDemo: decoded.isDemo === true };
  if (req.bugHatchForceDemo === true) {
    base.isDemo = true;
  }
  return base;
}

module.exports = {
  handleCreateInvitation,
  handleGetProjectInvitations,
  handleAcceptInvitation,
  handleRejectInvitation,
  handleCancelInvitation,
};
