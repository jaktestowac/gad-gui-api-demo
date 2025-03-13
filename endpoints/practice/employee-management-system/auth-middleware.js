const { formatErrorResponse } = require("../../../helpers/helpers");
const { logDebug } = require("../../../helpers/logger-api");
const { HTTP_UNAUTHORIZED, HTTP_FORBIDDEN } = require("../../../helpers/response.helpers");

const tokens = new Map();

const authMiddleware = {
  verifyToken: (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token || !tokens.has(token)) {
      return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Authentication required. Please log in."));
    }

    req.user = tokens.get(token);

    return next(req, res);
  },

  hasPermission: (requiredPermission) => {
    return (req, res, next) => {
      if (!req.user || !req.user.permissions) {
        return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User information not found"));
      }

      if (!req.user.permissions.includes(requiredPermission)) {
        logDebug("permissionDenied", {
          userId: req.user.userId,
          requiredPermission,
          userPermissions: req.user.permissions,
        });

        return res
          .status(HTTP_FORBIDDEN)
          .send(formatErrorResponse(`Permission denied: '${requiredPermission}' permission required`));
      }

      return next(req, res);
    };
  },

  tokens,
};

module.exports = authMiddleware;
