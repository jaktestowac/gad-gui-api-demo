const { expect } = require("../../config.js");
const { gracefulQuit } = require("../../helpers/helpers.js");
const {
  calculateEnrollmentMetrics,
  calculateRevenueMetrics,
  calculateCompletionMetrics,
  calculateRatingMetrics,
} = require("../../../endpoints/learning/learning-endpoint.helpers.js");
const dataProvider = require("../../../endpoints/learning/learning-data.provider.js");

describe("Learning Analytics", () => {
  let courses;
  const startDate = new Date("2024-01-01");

  before(() => {
    courses = dataProvider.getCoursesByInstructorId(2);
  });

  after(() => {
    gracefulQuit();
  });

  describe("Enrollment Metrics", () => {
    it("should calculate enrollment metrics correctly", () => {
      const metrics = calculateEnrollmentMetrics(courses, startDate);
      expect(metrics).to.have.property("total");
      expect(metrics).to.have.property("trend");
      expect(metrics.total).to.be.a("number");
    });

    it("should handle courses with no enrollments", () => {
      const metrics = calculateEnrollmentMetrics([], startDate);
      expect(metrics.total).to.equal(0);
      expect(metrics.trend).to.equal(0);
    });
  });

  describe("Revenue Metrics", () => {
    it("should calculate revenue metrics correctly", () => {
      const metrics = calculateRevenueMetrics(courses, startDate);
      expect(metrics).to.have.property("total");
      expect(metrics).to.have.property("trend");
      expect(metrics.total).to.be.a("number");
    });

    it("should handle courses with no revenue", () => {
      const metrics = calculateRevenueMetrics([], startDate);
      expect(metrics.total).to.equal(0);
      expect(metrics.trend).to.equal(0);
    });
  });

  describe("Completion Metrics", () => {
    it("should calculate completion metrics correctly", () => {
      const metrics = calculateCompletionMetrics(courses, startDate);
      expect(metrics).to.have.property("completedCount");
      expect(metrics).to.have.property("totalEnrollments");
      expect(metrics).to.have.property("rate");
    });

    it("should handle courses with no completions", () => {
      const metrics = calculateCompletionMetrics([], startDate);
      expect(metrics.completedCount).to.equal(0);
      expect(metrics.rate).to.equal(0);
    });
  });

  describe("Rating Metrics", () => {
    it("should calculate rating metrics correctly", () => {
      const metrics = calculateRatingMetrics(courses, startDate);
      expect(metrics).to.have.property("average");
      expect(metrics).to.have.property("averageRange");
      expect(metrics).to.have.property("trend");
    });

    it("should handle courses with no ratings", () => {
      const metrics = calculateRatingMetrics([], startDate);
      expect(metrics.average).to.equal(0);
      expect(metrics.averageRange).to.equal(0);
    });
  });
});
