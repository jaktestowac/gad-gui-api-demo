const { areIdsEqual, areStringsEqualIgnoringCase, isStringOnTheList } = require("../compare.helpers");
const { userRolesDb, userRoleActionsDb } = require("../db.helpers");

function searchForUserRole(roleId) {
  const foundRole = userRolesDb().find((role) => {
    if (areIdsEqual(role["id"], roleId)) {
      return role;
    }
  });
  return foundRole;
}

function searchForUserRoleActions(actionName) {
  const foundBookShopAction = userRoleActionsDb().find((action) => {
    if (areStringsEqualIgnoringCase(action?.name, actionName)) {
      return action;
    }
  });
  return foundBookShopAction;
}

/**
 * Checks if a user action is allowed based on the user's role.
 *
 * @param {number} roleId - The ID of the user's role.
 * @param {string} actionName - The name of the action to check.
 * @returns {boolean} - Returns true if the action is allowed for the user's role, otherwise false.
 */
function isUserActionAllowed(roleId, actionName) {
  const role = searchForUserRole(roleId);
  if (role === undefined) {
    return false;
  }

  const action = searchForUserRoleActions(actionName);
  if (action === undefined) {
    return false;
  }

  return isStringOnTheList(roleId, action.role_ids);
}

module.exports = { searchForUserRole, searchForUserRoleActions, isUserActionAllowed };
