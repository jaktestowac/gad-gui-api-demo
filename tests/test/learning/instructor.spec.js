const { learningBaseUrl, request, expect } = require("../../config.js");
const { setupEnv, gracefulQuit } = require("../../helpers/helpers.js");
const { authUser, authLearningUser } = require("../../helpers/data.helpers.js");

const baseUrl = `${learningBaseUrl}/instructor`;
describe("Instructor Features", async () => {
  let instructorData;
  let studentData;

  before(async () => {
    await setupEnv();
    // Login as instructor
    instructorData = await authLearningUser("john_doe", "demo");
    // Login as student for comparison
    studentData = await authLearningUser("user", "demo");
  });

  after(() => {
    gracefulQuit();
  });

  describe("Instructor endpoints", () => {
    it("GET /stats - get instructor statistics", async () => {
      const response = await request.get(`${baseUrl}/stats`).set(instructorData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("totalCourses");
      expect(response.body).to.have.property("totalStudents");
      expect(response.body).to.have.property("averageRating");
      expect(response.body).to.have.property("totalRevenue");
    });

    it("GET /courses - get instructor's courses", async () => {
      const response = await request.get(`${baseUrl}/courses`).set(instructorData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.be.an("array");
    });

    it("POST /courses - create new course", async () => {
      const courseData = {
        title: "Test Course",
        description: "Test Description",
        price: 99.99,
        level: "Beginner",
        tags: ["test", "demo"],
      };

      const response = await request.post(`${baseUrl}/courses`).set(instructorData.headers).send(courseData);

      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("success", true);
      expect(response.body).to.have.property("course");
    });

    it("PUT /courses/:courseId/lessons/:lessonId - update lesson", async () => {
      const lessonData = {
        title: "Updated Lesson",
        type: "video",
        duration: "00:30:00",
        content: {
          videoUrl: "https://test.test.test/updated-video.mp4",
          transcript: "Updated transcript",
        },
      };

      const response = await request.put(`${baseUrl}/courses/1/lessons/1`).set(instructorData.headers).send(lessonData);

      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("success", true);
    });

    it("GET /analytics - get course analytics", async () => {
      const response = await request.get(`${baseUrl}/analytics?courseId=1&timeRange=30`).set(instructorData.headers);

      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body.data).to.have.property("metrics");
      expect(response.body.data).to.have.property("tables");
      expect(response.body.data).to.have.property("charts");
    });
  });

  describe("Access control", () => {
    it("Should prevent student from accessing instructor endpoints", async () => {
      const response = await request.get(`${baseUrl}/stats`).set(studentData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(403);
    });

    it("Should prevent unauthorized course updates", async () => {
      const lessonData = {
        title: "Unauthorized Update",
      };

      const response = await request.put(`${baseUrl}/courses/1/lessons/1`).set(studentData.headers).send(lessonData);

      expect(response.status, JSON.stringify(response.body)).to.equal(403);
    });
  });
});
