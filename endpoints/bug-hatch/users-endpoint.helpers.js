const { logError } = require("../../helpers/logger-api");
const { formatErrorResponse } = require("../../helpers/helpers");
const {
  HTTP_OK,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_BAD_REQUEST,
} = require("../../helpers/response.helpers");
const {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  searchUsersService,
} = require("./services/user.service");
const { findBugHatchUserById, findBugHatchUserByEmail } = require("./db-bug-hatch.operations");
const { verifyToken } = require("../../helpers/jwtauth");

// ==================== USER PROFILE HANDLERS ====================

/**
 * Get current user profile
 * GET /api/bug-hatch/users/profile
 */
async function handleGetUserProfile(req, res) {
  try {
    const user = getCurrentUserFromReq(req);
    if (!user) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    const result = await getUserProfile(user.id);

    if (!result.success) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: result.user,
    });
  } catch (error) {
    logError("BugHatch get user profile error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to get user profile"));
  }
}

/**
 * Update current user profile
 * PATCH /api/bug-hatch/users/profile
 */
async function handleUpdateUserProfile(req, res) {
  try {
    const user = getCurrentUserFromReq(req);
    if (!user) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    const { name, email } = req.body;

    const result = await updateUserProfile(user.id, { name, email });

    if (!result.success) {
      let statusCode = HTTP_BAD_REQUEST;
      if (result.error && result.error.includes("already in use")) {
        statusCode = HTTP_UNPROCESSABLE_ENTITY;
      } else if (result.error && (result.error.includes("required") || result.error.includes("format"))) {
        statusCode = HTTP_UNPROCESSABLE_ENTITY;
      }

      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: result.user,
    });
  } catch (error) {
    logError("BugHatch update user profile error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to update user profile"));
  }
}

/**
 * Change current user password
 * POST /api/bug-hatch/users/change-password
 */
async function handleChangeUserPassword(req, res) {
  try {
    const user = getCurrentUserFromReq(req);
    if (!user) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    const { currentPassword, newPassword } = req.body;

    const result = await changeUserPassword(user.id, { currentPassword, newPassword });

    if (!result.success) {
      let statusCode = HTTP_BAD_REQUEST;
      if (result.error && result.error.includes("Current password is incorrect")) {
        statusCode = HTTP_UNAUTHORIZED;
      } else if (result.error && (result.error.includes("required") || result.error.includes("characters"))) {
        statusCode = HTTP_UNPROCESSABLE_ENTITY;
      }

      res.status(statusCode).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    logError("BugHatch change password error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to change password"));
  }
}

/**
 * Search users by email
 * GET /api/bug-hatch/users?email=...
 */
async function handleSearchUsers(req, res) {
  try {
    const user = getCurrentUserFromReq(req);
    if (!user) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    const email = req.query.email;
    if (!email) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Email parameter required"));
      return;
    }

    // Only allow project admins or global admins to search users
    const currentUser = findBugHatchUserById(user.id);
    if (!currentUser || currentUser.role !== "admin") {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Insufficient permissions"));
      return;
    }

    const foundUser = findBugHatchUserByEmail(email);
    if (!foundUser) {
      res.status(HTTP_OK).send({ ok: true, data: [] });
      return;
    }

    // Return limited user info
    const userInfo = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
    };

    res.status(HTTP_OK).send({
      ok: true,
      data: [userInfo],
    });
  } catch (error) {
    logError("BugHatch search users error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to search users"));
  }
}

/**
 * Search users by email (POST version for member management)
 * POST /api/bug-hatch/users/search
 */
async function handleSearchUsersPost(req, res) {
  try {
    const user = getCurrentUserFromReq(req);
    if (!user) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required"));
      return;
    }

    const { email } = req.body || {};
    if (!email) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Email parameter required"));
      return;
    }

    // For member management, allow authenticated users to search
    // (they can only add existing users to projects they administer)
    const result = await searchUsersService({ email }, user);

    if (!result.success) {
      res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(result.error));
      return;
    }

    res.status(HTTP_OK).send({
      ok: true,
      data: result.users,
    });
  } catch (error) {
    logError("BugHatch search users POST error:", error);
    res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(error.message || "Failed to search users"));
  }
}

/**
 * Get current user from request
 */
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
  handleGetUserProfile,
  handleUpdateUserProfile,
  handleChangeUserPassword,
  handleSearchUsers,
  handleSearchUsersPost,
  getCurrentUserFromReq,
};
