const { formatErrorResponse } = require("../../../helpers/helpers");
const { logDebug } = require("../../../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_CREATED, HTTP_NOT_FOUND } = require("../../../helpers/response.helpers");

let attendanceRecords = [
  {
    id: 1,
    employeeId: 1,
    date: "2025-02-01",
    status: "PRESENT",
    hoursWorked: 8,
  },
  {
    id: 2,
    employeeId: 1,
    date: "2025-02-02",
    status: "ABSENT",
    reason: "Sick leave",
  },
  {
    id: 3,
    employeeId: 2,
    date: "2025-02-03",
    status: "PRESENT",
    hoursWorked: 7,
  },
  {
    id: 4,
    employeeId: 2,
    date: "2025-02-04",
    status: "PRESENT",
    hoursWorked: 8,
  },
  {
    id: 5,
    employeeId: 3,
    date: "2025-02-05",
    status: "ABSENT",
    reason: "Personal reasons",
  },
  {
    id: 6,
    employeeId: 3,
    date: "2025-02-06",
    status: "PRESENT",
    hoursWorked: 6,
  },
];

const getNextId = () => {
  return Math.max(...attendanceRecords.map((record) => record.id)) + 1;
};

const findAttendance = (id) => {
  return attendanceRecords.find((record) => record.id === parseInt(id));
};

const validateAttendance = (attendance) => {
  if (!attendance.employeeId) {
    return "Employee ID is required";
  }

  if (!attendance.date) {
    return "Date is required";
  }

  if (!attendance.status) {
    return "Status is required";
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(attendance.date)) {
    return "Date must be in YYYY-MM-DD format";
  }

  if (attendance.status === "PRESENT" && attendance.hoursWorked === undefined) {
    return "Hours worked is required for PRESENT status";
  }

  if (attendance.status === "ABSENT" && !attendance.reason) {
    return "Reason is required for ABSENT status";
  }

  return null;
};

const attendanceHandlers = {
  getAll: (req, res) => {
    const { employeeId, startDate, endDate } = req.query;
    let result = [...attendanceRecords];

    if (employeeId) {
      result = result.filter((record) => record.employeeId === parseInt(employeeId));
    }

    if (startDate) {
      result = result.filter((record) => record.date >= startDate);
    }

    if (endDate) {
      result = result.filter((record) => record.date <= endDate);
    }

    logDebug("attendanceHandlers:getAll", { count: result.length, filters: req.query });
    return res.status(HTTP_OK).json(result);
  },

  create: (req, res) => {
    const newAttendance = req.body;

    const validationError = validateAttendance(newAttendance);
    if (validationError) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(validationError));
    }

    const existingRecord = attendanceRecords.find(
      (record) => record.employeeId === newAttendance.employeeId && record.date === newAttendance.date
    );

    if (existingRecord) {
      return res
        .status(HTTP_BAD_REQUEST)
        .send(formatErrorResponse("Attendance record already exists for this employee on this date"));
    }

    const attendance = {
      ...newAttendance,
      id: getNextId(),
    };

    attendanceRecords.push(attendance);

    logDebug("attendanceHandlers:create", { id: attendance.id });
    return res.status(HTTP_CREATED).json(attendance);
  },

  update: (req, res, id) => {
    const attendanceIndex = attendanceRecords.findIndex((record) => record.id === parseInt(id));

    if (attendanceIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Attendance record not found"));
    }

    const currentRecord = attendanceRecords[attendanceIndex];
    const updatedAttendance = {
      ...currentRecord,
      ...req.body,
      id: parseInt(id), // Ensure ID doesn't change
    };

    const validationError = validateAttendance(updatedAttendance);
    if (validationError) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(validationError));
    }

    const currentDate = new Date().toISOString().split("T")[0];
    if (currentRecord.date < currentDate) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Cannot modify attendance records from the past"));
    }

    attendanceRecords[attendanceIndex] = updatedAttendance;

    logDebug("attendanceHandlers:update", { id });
    return res.status(HTTP_OK).json(updatedAttendance);
  },

  delete: (req, res, id) => {
    const attendanceIndex = attendanceRecords.findIndex((record) => record.id === parseInt(id));

    if (attendanceIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Attendance record not found"));
    }

    const deletedRecord = attendanceRecords[attendanceIndex];

    const currentDate = new Date().toISOString().split("T")[0];
    if (deletedRecord.date < currentDate) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Cannot delete attendance records from the past"));
    }

    attendanceRecords.splice(attendanceIndex, 1);

    logDebug("attendanceHandlers:delete", { id });
    return res.status(HTTP_OK).json(deletedRecord);
  },
};

module.exports = {
  attendanceV1: attendanceHandlers,
};
