const { isUndefined } = require("../helpers/compare.helpers");
const { searchForUserWithOnlyToken } = require("../helpers/db-operation.helpers");
const { isUserActionAllowed, searchForRoleByUserId } = require("../helpers/db-operations/db-user-roles.operations");
const { userRolesDb } = require("../helpers/db.helpers");
const { formatErrorResponse, formatInvalidTokenErrorResponse } = require("../helpers/helpers");
const { HTTP_UNAUTHORIZED, HTTP_OK } = require("../helpers/response.helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");

function handleUserRoles(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  const verifyTokenResult = verifyAccessToken(req, res, "users", req.url);
  if (isUndefined(verifyTokenResult)) {
    res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
    return;
  }

  // get user roles:
  if (req.method === "GET" && urlEnds.includes("/api/user-roles")) {
    const roles = userRolesDb();
    res.status(HTTP_OK).send(roles);
    return;
  }

  // modify user roles:
  if (req.method === "PATCH" && urlEnds.includes("/api/user-roles")) {
    if (!isAdmin) {
      const foundUser = searchForUserWithOnlyToken(verifyTokenResult);
      if (isUndefined(foundUser)) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return false;
      }

      const foundRole = searchForRoleByUserId(foundUser["id"]);

      // role can be undefined if the user has no role assigned - this is allowed for now
      // user is then treated as a regular user
      if (isUndefined(foundRole)) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authorized to manage roles"));
        return false;
      }

      const isAllowed = isUserActionAllowed(foundRole.id, "manage-all-roles");
      if (!isAllowed) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not authorized to manage roles"));
        return false;
      }
    }

    // TODO: modify user roles here

    return;
  }

  return;
}

module.exports = {
  handleUserRoles,
};
