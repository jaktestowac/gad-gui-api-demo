const { formatErrorResponse } = require("../../../helpers/helpers");
const { logDebug } = require("../../../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_CREATED, HTTP_NOT_FOUND } = require("../../../helpers/response.helpers");

// In-memory database for employees
let employees = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    personalInfo: {
      email: "john.doe@example.com",
      phone: "+1-555-123-4567",
      address: {
        street: "123 Tech Lane",
        city: "Silicon Valley",
        state: "CA",
        zipCode: "94025",
        country: "USA",
      },
      emergencyContact: {
        name: "Jane Doe",
        relationship: "Spouse",
        phone: "+1-555-987-6543",
      },
    },
    employmentDetails: {
      position: "Software Engineer",
      department: {
        id: 101,
        name: "Engineering",
      },
      manager: {
        id: 2,
        name: "Jane Smith",
      },
      permissions: ["READ", "UPDATE"],
      compensation: {
        salary: {
          base: 5000,
          bonus: 1000,
          currency: "USD",
        },
        benefits: {
          healthInsurance: true,
          dentalInsurance: true,
          stockOptions: 1000,
        },
      },
      dates: {
        hired: "2022-03-15",
        startedRole: "2022-03-20",
        nextReview: "2024-03-15",
      },
    },
    performance: {
      rating: 4.5,
      lastReviewDate: "2023-03-15",
      skills: ["JavaScript", "Node.js", "React"],
      certifications: [
        {
          name: "AWS Certified Developer",
          issueDate: "2023-01-15",
          expiryDate: "2026-01-15",
        },
      ],
    },
    attendance: [
      {
        date: "2025-03-01",
        status: "PRESENT",
        hoursWorked: 8,
      },
      {
        date: "2025-03-02",
        status: "ABSENT",
        reason: "Sick leave",
      },
    ],
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    personalInfo: {
      email: "jane.smith@example.com",
      phone: "+1-555-234-5678",
      address: {
        street: "456 Leadership Ave",
        city: "Silicon Valley",
        state: "CA",
        zipCode: "94025",
        country: "USA",
      },
      emergencyContact: {
        name: "John Smith",
        relationship: "Spouse",
        phone: "+1-555-876-5432",
      },
    },
    employmentDetails: {
      position: "Engineering Manager",
      department: {
        id: 101,
        name: "Engineering",
      },
      manager: null,
      permissions: ["READ", "UPDATE", "CREATE", "DELETE"],
      compensation: {
        salary: {
          base: 8000,
          bonus: 2000,
          currency: "USD",
        },
        benefits: {
          healthInsurance: true,
          dentalInsurance: true,
          stockOptions: 2000,
        },
      },
      dates: {
        hired: "2020-05-10",
        startedRole: "2020-05-15",
        nextReview: "2024-05-10",
      },
    },
    performance: {
      rating: 4.8,
      lastReviewDate: "2023-05-10",
      skills: ["Leadership", "Project Management", "Architecture"],
      certifications: [
        {
          name: "PMP Certification",
          issueDate: "2021-06-15",
          expiryDate: "2024-06-15",
        },
      ],
    },
    attendance: [],
  },
];

const getNextId = () => {
  return Math.max(...employees.map((emp) => emp.id)) + 1;
};

const findEmployee = (id) => {
  return employees.find((emp) => emp.id === parseInt(id));
};

const validateEmployee = (employee) => {
  if (!employee.firstName || !employee.lastName) {
    return "Missing required fields: firstName, lastName";
  }

  if (!employee.personalInfo?.email || !employee.employmentDetails?.position) {
    return "Missing required fields: email, position";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(employee.personalInfo.email)) {
    return "Invalid email format";
  }

  const existingEmail = employees.find(
    (emp) => emp.personalInfo.email === employee.personalInfo.email && emp.id !== employee.id
  );

  if (existingEmail) {
    return "Email already exists";
  }

  if (
    employee.employmentDetails?.manager?.id &&
    !employees.find((emp) => emp.id === employee.employmentDetails.manager.id)
  ) {
    return "Invalid manager ID";
  }

  const dateFields = employee.employmentDetails?.dates;
  if (dateFields) {
    if (dateFields.startedRole && dateFields.hired && new Date(dateFields.startedRole) < new Date(dateFields.hired)) {
      return "Role start date cannot be before hire date";
    }
  }

  return null;
};

const employeeHandlers = {
  getAll: (req, res) => {
    const { departmentId, managerId, role } = req.query;
    let result = [...employees];

    if (departmentId) {
      result = result.filter((emp) => emp.employmentDetails.department.id === parseInt(departmentId));
    }

    if (managerId) {
      result = result.filter((emp) => emp.employmentDetails.manager?.id === parseInt(managerId));
    }

    if (role) {
      result = result.filter((emp) => emp.employmentDetails.permissions.includes(role));
    }

    logDebug("employeeHandlers:getAll", { count: result.length, filters: req.query });
    return res.status(HTTP_OK).json(result);
  },

  getOne: (req, res, id) => {
    const employee = findEmployee(id);

    if (!employee) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Employee not found"));
    }

    logDebug("employeeHandlers:getOne", { id });
    return res.status(HTTP_OK).json(employee);
  },

  create: (req, res) => {
    const newEmployee = req.body;

    const validationError = validateEmployee(newEmployee);
    if (validationError) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(validationError));
    }

    const employee = {
      ...newEmployee,
      id: getNextId(),
      performance: {
        ...(newEmployee.performance || {}),
        rating: newEmployee.performance?.rating || 0,
        skills: newEmployee.performance?.skills || [],
        certifications: newEmployee.performance?.certifications || [],
      },
      attendance: newEmployee.attendance || [],
    };

    employees.push(employee);

    logDebug("employeeHandlers:create", { id: employee.id });
    return res.status(HTTP_CREATED).json(employee);
  },

  update: (req, res, id) => {
    const employeeIndex = employees.findIndex((emp) => emp.id === parseInt(id));

    if (employeeIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Employee not found"));
    }

    const updatedEmployee = {
      ...req.body,
      id: parseInt(id),
    };

    const validationError = validateEmployee(updatedEmployee);
    if (validationError) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(validationError));
    }
    if (updatedEmployee.employmentDetails?.manager?.id) {
      let managerIdToCheck = updatedEmployee.employmentDetails.manager.id;
      const visited = new Set([parseInt(id)]);

      while (managerIdToCheck) {
        if (visited.has(managerIdToCheck)) {
          return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Circular manager relationship detected"));
        }

        visited.add(managerIdToCheck);
        const manager = employees.find((emp) => emp.id === managerIdToCheck);
        managerIdToCheck = manager ? manager.employmentDetails.manager?.id : null;
      }
    }

    employees[employeeIndex] = updatedEmployee;

    logDebug("employeeHandlers:update", { id });
    return res.status(HTTP_OK).json(updatedEmployee);
  },

  delete: (req, res, id) => {
    const employeeIndex = employees.findIndex((emp) => emp.id === parseInt(id));

    if (employeeIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Employee not found"));
    }

    const isManager = employees.some((emp) => emp.employmentDetails?.manager?.id === parseInt(id));
    if (isManager) {
      return res
        .status(HTTP_BAD_REQUEST)
        .send(
          formatErrorResponse(
            "Cannot delete employee who is a manager for others. Please reassign their direct reports first."
          )
        );
    }

    const deletedEmployee = employees[employeeIndex];
    employees.splice(employeeIndex, 1);

    logDebug("employeeHandlers:delete", { id });
    return res.status(HTTP_OK).json(deletedEmployee);
  },
};

module.exports = {
  employeeV1: employeeHandlers,
  employees,
};
