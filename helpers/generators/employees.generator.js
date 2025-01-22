const { logDebug } = require("../logger-api");
const { randomNames, randomSurnames, possibleCity, skills, certifications, employmentType } = require("./base.data");
const { generateRandomDate } = require("./date-range.generator");
const { RandomValueGeneratorWithSeed } = require("./random-data.generator");

const employeeRoles = [
  "Developer",
  "Designer",
  "QA",
  "Manager",
  "Product Owner",
  "Scrum Master",
  "DevOps",
  "HR",
  "Support",
  "Researcher",
  "Admin",
  "Other",
];
const employeeStatuses = ["Active", "Inactive", "On Leave", "Sick Leave", "Vacation"];
const employeeDepartments = [
  "Engineering",
  "Design",
  "QA",
  "Product",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Legal",
  "IT",
  "Operations",
  "Customer Support",
  "Research",
  "Management",
  "Admin",
  "Other",
];

const _defaultOptions = {
  minEmployees: 50,
  maxEmployees: 200,
  seed: Math.random().toString(),
  randomMissingFieldsProbability: 10,
  details: false,
};

function generateAdditionalData(dataGenerator) {
  const additionalData = {
    salary: dataGenerator.getNextValue(10000, 50000),
    vacationDays: dataGenerator.getNextValue(0, 30),
    sickDays: dataGenerator.getNextValue(0, 30),
    performance: dataGenerator.getNextValue(0, 100),
    preferredWorkingHours: `${dataGenerator.getNextValue(4, 8)}h - ${dataGenerator.getNextValue(16, 20)}h`,
    skills: dataGenerator.getNValuesFromList(skills, dataGenerator.getNextValue(1, 3)),
    certifications: dataGenerator.getNValuesFromList(certifications, dataGenerator.getNextValue(0, 2)),
    employmentType: employmentType[dataGenerator.getNextValue(0, employmentType.length - 1)],
  };

  return additionalData;
}

function generateRandomEmployees(dataGenerator, options) {
  const employees = [];
  const employeesCount = dataGenerator.getNextValue(options.minEmployees, options.maxEmployees);

  for (let i = 0; i < employeesCount; i++) {
    const employee = {};

    employee.id = i + 1;
    const firstName = randomNames[dataGenerator.getNextValue(0, randomNames.length - 1)];
    const lastName = randomSurnames[dataGenerator.getNextValue(0, randomSurnames.length - 1)];
    employee.name = `${firstName} ${lastName}`;
    employee.email = `${employee.name.replace(" ", ".").toLowerCase()}@test.test.test`;
    employee.age = dataGenerator.getNextValue(18, 65);
    employee.role = employeeRoles[dataGenerator.getNextValue(0, employeeRoles.length - 1)];
    employee.status = employeeStatuses[dataGenerator.getNextValue(0, employeeStatuses.length - 1)];
    employee.location = possibleCity[dataGenerator.getNextValue(0, possibleCity.length - 1)];
    employee.department = employeeDepartments[dataGenerator.getNextValue(0, employeeDepartments.length - 1)];
    employee.joinDate = generateRandomDate(new Date(1995, 1, 1), new Date());
    employee.joinDate = employee.joinDate.toISOString().split("T")[0];

    employee.additionalData = generateAdditionalData(dataGenerator, options);

    if (dataGenerator.getNextValue(0, 100) < options.randomMissingFieldsProbability) {
      const fields = Object.keys(employee).filter((field) => field !== "id");
      const fieldToRemove = fields[dataGenerator.getNextValue(0, fields.length - 1)];
      delete employee[fieldToRemove];
    }

    if (
      dataGenerator.getNextValue(0, 100) < options.randomMissingFieldsProbability &&
      employee.additionalData !== undefined
    ) {
      const fields = Object.keys(employee.additionalData).filter((field) => field !== "id");
      const fieldToRemove = fields[dataGenerator.getNextValue(0, fields.length - 1)];
      delete employee.additionalData[fieldToRemove];
    }

    employees.push(employee);
  }

  return employees;
}

function generateRandomEmployeesData(options) {
  const employeesOptions = options || _defaultOptions;
  const generatorOptions = { ..._defaultOptions, ...employeesOptions };

  logDebug("Generating random Employees data with options:", generatorOptions);

  const dataGenerator = new RandomValueGeneratorWithSeed(options.seed);

  const employeesData = generateRandomEmployees(dataGenerator, generatorOptions);

  if (options.details === false) {
    employeesData.forEach((employee) => {
      delete employee.additionalData;
    });
  }

  return employeesData;
}

module.exports = {
  generateRandomEmployeesData,
};
