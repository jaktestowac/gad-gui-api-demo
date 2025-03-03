const { expect } = require("../../config.js");
const { gracefulQuit } = require("../../helpers/helpers.js");
const {
  validateNewUser,
  hasPermission,
  isInstructor,
  isAdmin,
  checkIfUserCanAccessCourse,
  roundSecondsToHours,
  parseDurationToSeconds,
} = require("../../../endpoints/learning/learning-endpoint.helpers.js");
const dataProvider = require("../../../endpoints/learning/learning-data.provider.js");

describe("Learning Helper Functions", () => {
  after(() => {
    gracefulQuit();
  });

  describe("User Validation", () => {
    it("should validate valid user data", () => {
      const validUser = {
        username: "testuser123",
        password: "password123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      };
      const result = validateNewUser(validUser);
      expect(result.success).to.be.true;
    });

    it("should reject invalid email", () => {
      const invalidUser = {
        username: "testuser123",
        password: "password123",
        email: "invalid-email",
        firstName: "John",
        lastName: "Doe",
      };
      const result = validateNewUser(invalidUser);
      expect(result.success).to.be.false;
      expect(result.error).to.include("Invalid email format");
    });

    it("should reject invalid username format", () => {
      const invalidUser = {
        username: "t@",
        password: "password123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      };
      const result = validateNewUser(invalidUser);
      expect(result.success).to.be.false;
      expect(result.error).to.include("Invalid username format");
    });

    it("should reject invalid name format", () => {
      const invalidUser = {
        username: "testuser123",
        password: "password123",
        email: "test@example.com",
        firstName: "J",
        lastName: "Doe",
      };
      const result = validateNewUser(invalidUser);
      expect(result.success).to.be.false;
      expect(result.error).to.include("Invalid first name format");
    });
  });

  describe("Permission Checks", () => {
    it("should verify instructor role", () => {
      const instructor = dataProvider.getUserById(2);
      expect(isInstructor(instructor)).to.be.true;

      const student = dataProvider.getUserById(1);
      expect(isInstructor(student)).to.be.false;
    });

    it("should verify admin role", () => {
      const admin = dataProvider.getUserById(0);
      expect(isAdmin(admin)).to.be.true;

      const student = dataProvider.getUserById(1);
      expect(isAdmin(student)).to.be.false;
    });

    it("should check user permissions", () => {
      const admin = dataProvider.getUserById(0);
      expect(hasPermission(admin, "manage_roles")).to.be.true;

      const student = dataProvider.getUserById(1);
      expect(hasPermission(student, "manage_roles")).to.be.false;
    });
  });

  describe("Course Access", () => {
    it("should verify enrolled student access", () => {
      const result = checkIfUserCanAccessCourse(1, 1); // User 1 is enrolled in Course 1
      expect(result).to.be.true;
    });

    it("should verify instructor access to own course", () => {
      const result = checkIfUserCanAccessCourse(2, 1); // User 2 is instructor of Course 1
      expect(result).to.be.true;
    });

    it("should deny access to non-enrolled student", () => {
      const result = checkIfUserCanAccessCourse(5, 4); // User 5 is not enrolled in Course 4
      expect(result).to.be.false;
    });
  });

  describe("Duration Calculations", () => {
    it("should parse duration correctly", () => {
      const result = parseDurationToSeconds("01:30:00");
      expect(result).to.equal(5400); // 1.5 hours in seconds
    });

    it("should round duration to hours correctly", () => {
      const result = roundSecondsToHours(5400);
      expect(result).to.equal(1.5);
    });
  });
});
