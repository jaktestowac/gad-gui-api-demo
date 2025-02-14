const { learningBaseUrl, request, expect } = require("../../config.js");
const { setupEnv, gracefulQuit } = require("../../helpers/helpers.js");
const { authUser } = require("../../helpers/data.helpers.js");

const baseUrl = `${learningBaseUrl}/certificates`;
describe("Certificates Management", async () => {
  let userData;

  before(async () => {
    await setupEnv();
    userData = await authUser();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Certificate endpoints", () => {
    it("GET /public/:certificateId - view public certificate", async () => {
      // Using a known certificate UUID from mock data
      const response = await request.get(`${baseUrl}/public/550e8400-e29b-41d4-a716-446655440000`);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("certificateNumber");
      expect(response.body).to.have.property("uuid");
      expect(response.body).to.have.property("courseTitle");
      expect(response.body).to.have.property("recipientName");
      expect(response.body).to.have.property("issueDate");
    });

    it("GET /public/:certificateId - invalid certificate", async () => {
      const response = await request.get(`${baseUrl}/public/invalid-uuid`);
      expect(response.status, JSON.stringify(response.body)).to.equal(404);
    });
  });

  describe("Course completion and certificate generation", () => {
    it("Should generate certificate upon course completion", async () => {
      // Complete all lessons in course
      const courseId = 1;
      const lessons = await request.get(`${learningBaseUrl}/courses/${courseId}/lessons`).set(userData.headers);

      // Complete each lesson
      for (const lesson of lessons.body) {
        await request
          .post(`${learningBaseUrl}/courses/${courseId}/lessons/${lesson.id}/complete`)
          .set(userData.headers)
          .send({ userId: userData.userId });
      }

      // Verify certificate was generated
      const response = await request
        .get(`${learningBaseUrl}/users/${userData.userId}/certificates`)
        .set(userData.headers);

      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("certificates").that.is.an("array");
      expect(response.body.certificates).to.have.length.above(0);
    });
  });
});
