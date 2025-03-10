const { formatErrorResponse } = require("../../../helpers/helpers");
const { logDebug } = require("../../../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_CREATED, HTTP_NOT_FOUND } = require("../../../helpers/response.helpers");
const { employees } = require("./employee-handlers");

// In-memory database for departments
let departments = [
  {
    id: 101,
    name: "Engineering",
    parentDepartmentId: null,
    subDepartments: [
      {
        id: 102,
        name: "Backend Team",
        parentDepartmentId: 101,
      },
      {
        id: 103,
        name: "Frontend Team",
        parentDepartmentId: 101,
      },
    ],
  },
  {
    id: 201,
    name: "Sales",
    parentDepartmentId: null,
    subDepartments: [
      {
        id: 202,
        name: "Enterprise Sales",
        parentDepartmentId: 201,
      },
      {
        id: 203,
        name: "Retail Sales",
        parentDepartmentId: 201,
      },
    ],
  },
  {
    id: 301,
    name: "HR",
    parentDepartmentId: null,
    subDepartments: [
      {
        id: 302,
        name: "Recruitment",
        parentDepartmentId: 301,
      },
      {
        id: 303,
        name: "Training",
        parentDepartmentId: 301,
      },
      {
        id: 304,
        name: "Compensation",
        parentDepartmentId: 301,
      },
      {
        id: 305,
        name: "Benefits",
        parentDepartmentId: 301,
      },
    ],
  },
];

const getNextId = () => {
  const allDepts = departments.reduce((acc, dept) => {
    acc.push(dept);
    if (dept.subDepartments) {
      acc.push(...dept.subDepartments);
    }
    return acc;
  }, []);

  return Math.max(...allDepts.map((dept) => dept.id)) + 1;
};

const findDepartment = (id) => {
  const mainDept = departments.find((dept) => dept.id === parseInt(id));
  if (mainDept) return mainDept;

  for (const dept of departments) {
    if (dept.subDepartments) {
      const subDept = dept.subDepartments.find((sub) => sub.id === parseInt(id));
      if (subDept) return subDept;
    }
  }

  return null;
};

const validateDepartment = (department) => {
  if (!department.name) {
    return "Department name is required";
  }

  if (department.parentDepartmentId !== null && department.parentDepartmentId !== undefined) {
    const parentDept = findDepartment(department.parentDepartmentId);
    if (!parentDept) {
      return "Invalid parent department ID";
    }
  }

  return null;
};

const detectCyclicDependency = (deptId, parentDeptId) => {
  if (deptId === parentDeptId) return true;

  let currentParentId = parentDeptId;
  const visited = new Set([parseInt(deptId)]);

  while (currentParentId) {
    if (visited.has(currentParentId)) {
      return true;
    }

    visited.add(currentParentId);
    const parent = findDepartment(currentParentId);
    currentParentId = parent ? parent.parentDepartmentId : null;
  }

  return false;
};

const departmentHandlers = {
  getAll: (req, res) => {
    logDebug("departmentHandlers:getAll", { count: departments.length });
    return res.status(HTTP_OK).json(departments);
  },

  getOne: (req, res, id) => {
    const department = findDepartment(id);

    if (!department) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Department not found"));
    }

    logDebug("departmentHandlers:getOne", { id });
    return res.status(HTTP_OK).json(department);
  },

  create: (req, res) => {
    const newDepartment = req.body;

    const validationError = validateDepartment(newDepartment);
    if (validationError) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(validationError));
    }

    const department = {
      ...newDepartment,
      id: getNextId(),
      subDepartments: newDepartment.subDepartments || [],
    };

    if (department.parentDepartmentId === null || department.parentDepartmentId === undefined) {
      departments.push(department);
    } else {
      const parentDept = findDepartment(department.parentDepartmentId);
      if (parentDept.subDepartments) {
        parentDept.subDepartments.push(department);
      } else {
        parentDept.subDepartments = [department];
      }
    }

    logDebug("departmentHandlers:create", { id: department.id });
    return res.status(HTTP_CREATED).json(department);
  },

  update: (req, res, id) => {
    const department = findDepartment(id);

    if (!department) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Department not found"));
    }

    const updatedDepartment = {
      ...department,
      ...req.body,
      id: parseInt(id),
    };

    const validationError = validateDepartment(updatedDepartment);
    if (validationError) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(validationError));
    }

    if (detectCyclicDependency(id, updatedDepartment.parentDepartmentId)) {
      return res
        .status(HTTP_BAD_REQUEST)
        .send(formatErrorResponse("Cyclic dependency detected in department hierarchy"));
    }

    Object.assign(department, updatedDepartment);

    logDebug("departmentHandlers:update", { id });
    return res.status(HTTP_OK).json(updatedDepartment);
  },

  delete: (req, res, id) => {
    const deptHasEmployees = employees.some(
      (emp) =>
        emp.employmentDetails?.department?.id === parseInt(id) ||
        emp.employmentDetails?.department?.parentDepartmentId === parseInt(id)
    );

    if (deptHasEmployees) {
      return res
        .status(HTTP_BAD_REQUEST)
        .send(formatErrorResponse("Cannot delete department that has active employees"));
    }

    const departmentIndex = departments.findIndex((dept) => dept.id === parseInt(id));

    if (departmentIndex === -1) {
      for (const dept of departments) {
        if (dept.subDepartments) {
          const subDeptIndex = dept.subDepartments.findIndex((sub) => sub.id === parseInt(id));
          if (subDeptIndex !== -1) {
            const deletedDepartment = dept.subDepartments[subDeptIndex];
            dept.subDepartments.splice(subDeptIndex, 1);

            logDebug("departmentHandlers:delete", { id });
            return res.status(HTTP_OK).json(deletedDepartment);
          }
        }
      }

      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse(`Department with ID ${id} not found`));
    }

    const deletedDepartment = departments[departmentIndex];
    departments.splice(departmentIndex, 1);

    logDebug("departmentHandlers:delete", { id });
    return res.status(HTTP_OK).json(deletedDepartment);
  },
};

module.exports = {
  departmentV1: departmentHandlers,
};
