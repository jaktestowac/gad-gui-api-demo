const { learningBaseUrl, request, expect } = require("../../config.js");
const { setupEnv, gracefulQuit } = require("../../helpers/helpers.js");
const { authUser } = require("../../helpers/data.helpers.js");

const baseUrl = `${learningBaseUrl}/users`;
describe("User Funds Management", async () => {
  let userData;

  before(async () => {
    await setupEnv();
    userData = await authUser();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Funds endpoints", () => {
    it("GET /:userId/funds - get user funds", async () => {
      const response = await request.get(`${baseUrl}/${userData.userId}/funds`).set(userData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("funds");
      expect(response.body.funds).to.be.a("number");
    });

    it("PUT /:userId/funds - update user funds", async () => {
      const amount = 100;
      const response = await request.put(`${baseUrl}/${userData.userId}/funds`).set(userData.headers).send({ amount });

      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("success", true);
      expect(response.body).to.have.property("newBalance", amount);
    });

    it("PUT /:userId/funds - invalid amount", async () => {
      const response = await request
        .put(`${baseUrl}/${userData.userId}/funds`)
        .set(userData.headers)
        .send({ amount: -50 });

      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it("GET /:userId/funds/history - get funds history", async () => {
      const response = await request.get(`${baseUrl}/${userData.userId}/funds/history`).set(userData.headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("history").that.is.an("array");
    });
  });

  describe("Course purchase scenarios", () => {
    it("Should fail to enroll in course with insufficient funds", async () => {
      // First set funds to 0
      await request.put(`${baseUrl}/${userData.userId}/funds`).set(userData.headers).send({ amount: 0 });

      const response = await request
        .post(`${learningBaseUrl}/courses/4/enroll`)
        .set(userData.headers)
        .send({ userId: userData.userId });

      expect(response.status, JSON.stringify(response.body)).to.equal(400);
      expect(response.body.error.message).to.equal("Insufficient funds");
    });

    it("Should successfully enroll after adding funds", async () => {
      // Add sufficient funds
      await request.put(`${baseUrl}/${userData.userId}/funds`).set(userData.headers).send({ amount: 200 });

      const response = await request
        .post(`${learningBaseUrl}/courses/4/enroll`)
        .set(userData.headers)
        .send({ userId: userData.userId });

      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("success", true);
    });
  });
});
