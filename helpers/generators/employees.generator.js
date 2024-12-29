const e = require("express");
const { logDebug } = require("../logger-api");
const { randomNames, randomSurnames, possibleCity } = require("./base.data");
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
};

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
    employee.joinDate = "2018-01-15";

    if (dataGenerator.getNextValue(0, 100) < options.randomMissingFieldsProbability) {
      // get random field to remove but without id field
      const fields = Object.keys(employee).filter((field) => field !== "id");
      const fieldToRemove = fields[dataGenerator.getNextValue(0, fields.length - 1)];
      delete employee[fieldToRemove];
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

  return employeesData;
}

module.exports = {
  generateRandomEmployeesData,
};
