const { formatErrorResponse } = require("../../../helpers/helpers");
const { logDebug } = require("../../../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_CREATED, HTTP_NOT_FOUND } = require("../../../helpers/response.helpers");

let roles = [
  {
    id: 1,
    role: "Manager",
    permissions: ["CREATE", "UPDATE", "DELETE", "VIEW"],
  },
  {
    id: 2,
    role: "Developer",
    permissions: ["UPDATE", "VIEW"],
  },
  {
    id: 3,
    role: "Tester",
    permissions: ["VIEW"],
  }
];

const getNextId = () => {
  return Math.max(...roles.map((role) => role.id)) + 1;
};

const findRole = (id) => {
  return roles.find((role) => role.id === parseInt(id));
};

const validateRole = (role) => {
  if (!role.role) {
    return "Role name is required";
  }

  const existingRole = roles.find((r) => r.role === role.role && r.id !== role.id);

  if (existingRole) {
    return "Role name already exists";
  }

  if (role.permissions && !Array.isArray(role.permissions)) {
    return "Permissions must be an array";
  }

  return null;
};

const roleHandlers = {
  getAll: (req, res) => {
    logDebug("roleHandlers:getAll", { count: roles.length });
    return res.status(HTTP_OK).json(roles);
  },

  create: (req, res) => {
    const newRole = req.body;

    const validationError = validateRole(newRole);
    if (validationError) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(validationError));
    }

    const role = {
      ...newRole,
      id: getNextId(),
      permissions: newRole.permissions || [],
    };

    roles.push(role);

    logDebug("roleHandlers:create", { id: role.id });
    return res.status(HTTP_CREATED).json(role);
  },

  update: (req, res, id) => {
    const roleIndex = roles.findIndex((role) => role.id === parseInt(id));

    if (roleIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Role not found"));
    }

    const updatedRole = {
      ...roles[roleIndex],
      ...req.body,
      id: parseInt(id),  
    };

    const validationError = validateRole(updatedRole);
    if (validationError) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(validationError));
    }

    roles[roleIndex] = updatedRole;

    logDebug("roleHandlers:update", { id });
    return res.status(HTTP_OK).json(updatedRole);
  },

  delete: (req, res, id) => {
    const roleIndex = roles.findIndex((role) => role.id === parseInt(id));

    if (roleIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Role not found"));
    }

    const roleInUse = employees.some((emp) =>
      emp.employmentDetails?.permissions?.some((p) => p === roles[roleIndex].role)
    );

    if (roleInUse) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Cannot delete role that is assigned to employees"));
    }

    const deletedRole = roles[roleIndex];
    roles.splice(roleIndex, 1);

    logDebug("roleHandlers:delete", { id });
    return res.status(HTTP_OK).json(deletedRole);
  },
};

module.exports = {
  roleV1: roleHandlers,
};
