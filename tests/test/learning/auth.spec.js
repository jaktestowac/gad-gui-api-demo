const { learningBaseUrl, request, expect } = require("../../config.js");
const { setupEnv, gracefulQuit } = require("../../helpers/helpers.js");
const { authDefaultLearningUser } = require("../../helpers/data.helpers.js");

const baseUrl = `${learningBaseUrl}/auth`;
describe(`Endpoint ${baseUrl}`, async () => {
  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe(`Auth endpoints ${baseUrl}`, async () => {
    it(`GET ${baseUrl}/status - no auth`, async () => {
      const response = await request.get(`${baseUrl}/status`);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.have.property("authenticated", false);
    });

    it(`GET ${baseUrl}/status - with auth`, async () => {
      const data = await authDefaultLearningUser();
      // Make auth request first to ensure session is active
      await request.post(`${baseUrl}/login`).send({
        username: "user",
        password: "demo",
      });

      const response = await request.get(`${baseUrl}/status`).set(data.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.have.property("authenticated", true);
    });

    it(`POST ${baseUrl}/login - invalid credentials`, async () => {
      const response = await request.post(`${baseUrl}/login`).send({
        username: "invalid",
        password: "invalid",
      });
      expect(response.status, JSON.stringify(response.body)).to.equal(401);
    });

    it(`POST ${baseUrl}/login - valid credentials`, async () => {
      const response = await request.post(`${baseUrl}/login`).send({
        username: "user",
        password: "demo",
      });
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.have.property("access_token");
      expect(response.body, JSON.stringify(response.body)).to.have.property("username");
      expect(response.body, JSON.stringify(response.body)).to.have.property("id");
      expect(response.body, JSON.stringify(response.body)).to.have.property("firstName");
      expect(response.body, JSON.stringify(response.body)).to.have.property("lastName");
      expect(response.body, JSON.stringify(response.body)).to.have.property("avatar");
    });

    it(`POST ${baseUrl}/register - new user`, async () => {
      const newUser = {
        username: `test_user_${Date.now()}`,
        password: "test123",
        email: `test${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "User",
      };
      const response = await request.post(`${baseUrl}/register`).send(newUser);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.have.property("success", true);
    });

    it(`POST ${baseUrl}/register - duplicate user`, async () => {
      const dupUser = {
        username: "user",
        password: "test123",
        email: "michael.scott@test.test.com",
        firstName: "Test",
        lastName: "User",
      };
      const response = await request.post(`${baseUrl}/register`).send(dupUser);
      expect(response.status, JSON.stringify(response.body)).to.equal(422);
    });
  });
});
