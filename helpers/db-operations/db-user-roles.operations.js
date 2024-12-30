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
