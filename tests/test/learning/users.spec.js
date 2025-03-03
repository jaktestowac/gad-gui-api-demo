const { learningBaseUrl, request, expect } = require("../../config.js");
const { setupEnv, gracefulQuit } = require("../../helpers/helpers.js");
const { authDefaultLearningUser } = require("../../helpers/data.helpers.js");

const baseUrl = `${learningBaseUrl}/users`;
describe(`Endpoint ${baseUrl}`, async () => {
  let userData;

  before(async () => {
    await setupEnv();
    userData = await authDefaultLearningUser();
  });

  after(() => {
    gracefulQuit();
  });

  describe("User profile endpoints", () => {
    it(`GET ${baseUrl}/:id`, async () => {
      const response = await request.get(`${baseUrl}/${userData.userId}`).set(userData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.not.have.property("password");
    });

    it(`PUT ${baseUrl}/:id/profile`, async () => {
      const profile = {
        firstName: "UpdatedFirst",
        lastName: "UpdatedLast",
        email: "michael.scott@test.test.com",
        currentPassword: "demo",
      };
      const response = await request.put(`${baseUrl}/${userData.userId}/profile`).set(userData.headers).send(profile);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.have.property("success", true);
    });

    it(`PUT ${baseUrl}/:id/profile - wrong password`, async () => {
      const profile = {
        firstName: "UpdatedFirst",
        lastName: "UpdatedLast",
        email: "michael.scott@test.test.com",
        currentPassword: "wrong",
      };
      const response = await request.put(`${baseUrl}/${userData.userId}/profile`).set(userData.headers).send(profile);
      expect(response.status, JSON.stringify(response.body)).to.equal(401);
    });

    it(`PUT ${baseUrl}/:id/password`, async () => {
      const passwords = {
        currentPassword: "demo",
        newPassword: "demo",
      };
      const response = await request
        .put(`${baseUrl}/${userData.userId}/password`)
        .set(userData.headers)
        .send(passwords);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.have.property("success", true);
    });

    it(`PUT ${baseUrl}/:id/password - wrong current password`, async () => {
      const passwords = {
        currentPassword: "wrong",
        newPassword: "demo",
      };
      const response = await request
        .put(`${baseUrl}/${userData.userId}/password`)
        .set(userData.headers)
        .send(passwords);
      expect(response.status, JSON.stringify(response.body)).to.equal(401);
    });
  });

  describe("User learning data endpoints", () => {
    it(`GET ${baseUrl}/:id/enrollments`, async () => {
      const response = await request.get(`${baseUrl}/${userData.userId}/enrollments`).set(userData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.be.an("array");
    });

    it(`GET ${baseUrl}/:id/certificates`, async () => {
      const response = await request.get(`${baseUrl}/${userData.userId}/certificates`).set(userData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.have.property("certificates");
    });

    it(`GET ${baseUrl}/:id/certificates - empty array`, async () => {
      const response = await request.get(`${baseUrl}/${userData.userId}/certificates`).set(userData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.have.property("certificates");
      expect(response.body.certificates, JSON.stringify(response.body)).to.be.an("array");
    });

    it(`GET ${baseUrl}/:id/stats`, async () => {
      const response = await request.get(`${baseUrl}/${userData.userId}/stats`).set(userData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
    });
  });
});
