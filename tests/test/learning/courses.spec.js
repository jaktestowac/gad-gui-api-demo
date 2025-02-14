const { learningBaseUrl, request, expect } = require("../../config.js");
const { setupEnv, gracefulQuit } = require("../../helpers/helpers.js");
const { authUser, registerNewLearningUser } = require("../../helpers/data.helpers.js");

const baseUrl = `${learningBaseUrl}/courses`;
describe(`Endpoint ${baseUrl}`, async () => {
  let userData;

  before(async () => {
    await setupEnv();
    userData = await authUser();
  });

  after(() => {
    gracefulQuit();
  });

  it(`GET ${baseUrl}`, async () => {
    const response = await request.get(baseUrl);
    expect(response.status, JSON.stringify(response.body)).to.equal(200);
    expect(response.body, JSON.stringify(response.body)).to.be.an("array");
  });

  it(`GET ${baseUrl}/:id`, async () => {
    const response = await request.get(`${baseUrl}/1`);
    expect(response.status, JSON.stringify(response.body)).to.equal(200);
    expect(response.body, JSON.stringify(response.body)).to.have.property("id");
    expect(response.body, JSON.stringify(response.body)).to.have.property("title");
  });

  it(`POST ${baseUrl}/:id/enroll`, async () => {
    const response = await request.post(`${baseUrl}/3/enroll`).set(userData.headers).send({ userId: userData.userId });
    expect(response.status, JSON.stringify(response.body)).to.equal(200);
    expect(response.body, JSON.stringify(response.body)).to.have.property("success", true);
  });

  it(`POST ${baseUrl}/:id/rate`, async () => {
    const rating = {
      userId: userData.userId,
      rating: 5,
      comment: "Great course!",
    };
    const response = await request.post(`${baseUrl}/1/rate`).set(userData.headers).send(rating);
    expect(response.status, JSON.stringify(response.body)).to.equal(200);
    expect(response.body, JSON.stringify(response.body)).to.have.property("success", true);
  });

  it(`GET ${baseUrl}/:id/ratings`, async () => {
    const response = await request.get(`${baseUrl}/1/ratings`);
    expect(response.status, JSON.stringify(response.body)).to.equal(200);
    expect(response.body, JSON.stringify(response.body)).to.be.an("array");
  });

  describe("Course content endpoints", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await registerNewLearningUser();
    });

    it(`GET ${baseUrl}/:id/lessons - without enrollment`, async () => {
      // Try to access lessons without enrollment
      const response = await request.get(`${baseUrl}/2/lessons`).set(testUser.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(403);
      expect(response.body.error.message).to.equal("Not authorized to access this course");
    });

    it(`GET ${baseUrl}/:id/lessons/:lessonId/content - without enrollment`, async () => {
      // Try to access content without enrollment
      const response = await request.get(`${baseUrl}/2/lessons/1/content`).set(testUser.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(403);
      expect(response.body.error.message).to.equal("User not enrolled in this course");
    });

    describe("Enrollment scenarios", () => {
      it(`POST ${baseUrl}/:id/enroll - first time`, async () => {
        const response = await request
          .post(`${baseUrl}/2/enroll`)
          .set(testUser.headers)
          .send({ userId: testUser.userId });
        expect(response.status, JSON.stringify(response.body)).to.equal(200);
        expect(response.body, JSON.stringify(response.body)).to.have.property("success", true);
      });

      it(`POST ${baseUrl}/:id/enroll - already enrolled`, async () => {
        // First enrollment
        await request.post(`${baseUrl}/3/enroll`).set(testUser.headers).send({ userId: testUser.userId });

        // Try to enroll again
        const response = await request
          .post(`${baseUrl}/3/enroll`)
          .set(testUser.headers)
          .send({ userId: testUser.userId });
        expect(response.status, JSON.stringify(response.body)).to.equal(400);
        expect(response.body.error.message).to.equal("Already enrolled in this course");
      });
    });

    describe("With enrollment", () => {
      beforeEach(async () => {
        // Ensure enrollment for subsequent tests
        await request.post(`${baseUrl}/1/enroll`).set(testUser.headers).send({ userId: testUser.userId });
      });

      it(`GET ${baseUrl}/:id/lessons - with enrollment`, async () => {
        const response = await request.get(`${baseUrl}/1/lessons`).set(testUser.headers);
        expect(response.status, JSON.stringify(response.body)).to.equal(200);
        expect(response.body, JSON.stringify(response.body)).to.be.an("array");
      });

      it(`GET ${baseUrl}/:id/lessons/:lessonId/content - with enrollment`, async () => {
        const response = await request.get(`${baseUrl}/1/lessons/1/content`).set(testUser.headers);
        expect(response.status, JSON.stringify(response.body)).to.equal(200);
        expect(response.body, JSON.stringify(response.body)).to.have.property("content");
      });

      it(`POST ${baseUrl}/:id/lessons/:lessonId/complete`, async () => {
        const response = await request
          .post(`${baseUrl}/1/lessons/1/complete`)
          .set(testUser.headers)
          .send({ userId: testUser.userId });
        expect(response.status, JSON.stringify(response.body)).to.equal(200);
        expect(response.body, JSON.stringify(response.body)).to.have.property("success", true);
      });

      it(`POST ${baseUrl}/:id/lessons/:lessonId/quiz`, async () => {
        const quizData = {
          userId: testUser.userId,
          answers: [0, 1, 2],
        };
        const response = await request.post(`${baseUrl}/1/lessons/3/quiz`).set(testUser.headers).send(quizData);
        expect(response.status, JSON.stringify(response.body)).to.equal(200);
        expect(response.body, JSON.stringify(response.body)).to.have.property("success", true);
      });
    });
  });

  describe("Course progress endpoints", () => {
    it(`POST ${baseUrl}/:id/progress`, async () => {
      const progressData = {
        userId: userData.userId,
        progress: 50,
      };
      const response = await request.post(`${baseUrl}/1/progress`).set(userData.headers).send(progressData);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.have.property("progress", 150);
    });

    it(`GET ${baseUrl}/:id/progress`, async () => {
      const response = await request.get(`${baseUrl}/1/progress`).set(userData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
    });
  });

  describe("Course preview endpoints", () => {
    it(`GET ${baseUrl}/:id/lessons/preview`, async () => {
      const response = await request.get(`${baseUrl}/1/lessons/preview`);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("previewLessons").that.is.an("array");
      expect(response.body).to.have.property("totalLessons").that.is.a("number");
    });

    it(`GET ${baseUrl}/:id/lessons/titles`, async () => {
      const response = await request.get(`${baseUrl}/1/lessons/titles`);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.be.an("array");
      expect(response.body[0]).to.have.property("id");
      expect(response.body[0]).to.have.property("title");
    });
  });
});
