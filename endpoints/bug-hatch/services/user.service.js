const { getCurrentDateTimeISO } = require("../../../helpers/datetime.helpers");
const { logDebug } = require("../../../helpers/logger-api");
const {
  findBugHatchUserById,
  findBugHatchUserByEmail,
  updateBugHatchUser,
  createBugHatchAuditLog,
} = require("../db-bug-hatch.operations");

// ==================== VALIDATION ====================

/**
 * Validate user profile update data
 * @param {object} data - Profile data { name, email }
 * @returns {object} { valid: boolean, error?: string }
 */
function validateProfileData(data) {
  const { name, email } = data;

  if (!name || !email) {
    return { valid: false, error: "Name and email are required" };
  }

  if (name.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters long" };
  }

  if (name.length > 100) {
    return { valid: false, error: "Name must not exceed 100 characters" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true };
}

/**
 * Validate password change data
 * @param {object} data - Password data { currentPassword, newPassword }
 * @returns {object} { valid: boolean, error?: string }
 */
function validatePasswordChangeData(data) {
  const { currentPassword, newPassword } = data;

  if (!currentPassword || !newPassword) {
    return { valid: false, error: "Current password and new password are required" };
  }

  if (newPassword.length < 2) {
    return { valid: false, error: "New password must be at least 2 characters long" };
  }

  if (newPassword.length > 100) {
    return { valid: false, error: "New password must not exceed 100 characters" };
  }

  return { valid: true };
}

// ==================== USER PROFILE SERVICES ====================

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Promise<object>} { success: boolean, user?: object, error?: string }
 */
async function getUserProfile(userId) {
  try {
    const user = findBugHatchUserById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Return user data without sensitive information
    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };

    logDebug("User profile retrieved:", { userId });
    return { success: true, user: profile };
  } catch (error) {
    logDebug("Error getting user profile:", error);
    return { success: false, error: error.message || "Failed to get user profile" };
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data { name, email }
 * @returns {Promise<object>} { success: boolean, user?: object, error?: string }
 */
async function updateUserProfile(userId, profileData) {
  try {
    const validation = validateProfileData(profileData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { name, email } = profileData;

    // Check if email is already taken by another user
    const existingUser = findBugHatchUserByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return { success: false, error: "Email is already in use by another user" };
    }

    const updatedUser = await updateBugHatchUser(userId, { name, email });

    await createBugHatchAuditLog({
      actorUserId: userId,
      eventType: "user.profile.updated",
      payloadObject: { fields: ["name", "email"] },
    });

    // Return updated profile data
    const profile = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      lastLoginAt: updatedUser.lastLoginAt,
    };

    logDebug("User profile updated:", { userId });
    return { success: true, user: profile };
  } catch (error) {
    logDebug("Error updating user profile:", error);
    return { success: false, error: error.message || "Failed to update user profile" };
  }
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {object} passwordData - Password data { currentPassword, newPassword }
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
async function changeUserPassword(userId, passwordData) {
  try {
    const validation = validatePasswordChangeData(passwordData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { currentPassword, newPassword } = passwordData;

    // Get current user to verify current password
    const user = findBugHatchUserById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify current password (note: passwords are stored as plain text in demo)
    if (user.password !== currentPassword) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Update password
    await updateBugHatchUser(userId, { password: newPassword });

    await createBugHatchAuditLog({
      actorUserId: userId,
      eventType: "user.password.changed",
      payloadObject: {},
    });

    logDebug("User password changed:", { userId });
    return { success: true };
  } catch (error) {
    logDebug("Error changing user password:", error);
    return { success: false, error: error.message || "Failed to change password" };
  }
}

/**
 * Search users by email
 * @param {object} query - Search query { email }
 * @param {object} currentUser - Current user making the request
 * @returns {object} { success: boolean, users?: array, error?: string }
 */
function searchUsersService(query, currentUser) {
  try {
    if (!currentUser) {
      return { success: false, error: "Authentication required" };
    }

    const { email } = query;
    if (!email) {
      return { success: false, error: "Email parameter required" };
    }

    // Find users matching the email (case-insensitive partial match)
    const allUsers = require("../db-bug-hatch.operations").bugHatchUsersDb();
    const matchingUsers = allUsers.filter((user) => user.email.toLowerCase().includes(email.toLowerCase()));

    // Return basic user info (id, name, email) - don't expose sensitive data
    const users = matchingUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));

    return { success: true, users };
  } catch (error) {
    logDebug("Error searching users:", error);
    return { success: false, error: error.message || "Failed to search users" };
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  searchUsersService,
};
