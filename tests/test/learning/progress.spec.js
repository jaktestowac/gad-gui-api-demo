const { learningBaseUrl, request, expect } = require("../../config.js");
const { setupEnv, gracefulQuit } = require("../../helpers/helpers.js");
const { authUser } = require("../../helpers/data.helpers.js");

const baseUrl = `${learningBaseUrl}/courses`; // Changed from progress to courses
describe(`Course Progress Endpoints`, async () => {
  let userData;

  before(async () => {
    await setupEnv();
    userData = await authUser();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Progress tracking", () => {
    beforeEach(async () => {
      // Ensure enrollment
      await request.post(`${baseUrl}/1/enroll`).set(userData.headers).send({ userId: userData.userId });
    });

    it(`GET ${baseUrl}/:id/progress`, async () => {
      const response = await request.get(`${baseUrl}/1/progress`).set(userData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("progress");
    });

    it(`POST ${baseUrl}/:id/progress`, async () => {
      const response = await request
        .post(`${baseUrl}/1/progress`)
        .set(userData.headers)
        .send({ userId: userData.userId, progress: 50 });
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
    });
  });
});
