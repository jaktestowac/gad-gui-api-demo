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
        .post(`${learningBaseUrl}/courses/8/enroll`)
        .set(userData.headers)
        .send({ userId: userData.userId });

      expect(response.status, JSON.stringify(response.body)).to.equal(400);
      expect(response.body.error.message).to.equal("Insufficient funds");
    });

    it("Should successfully enroll after adding funds", async () => {
      const responseGet1 = await request.get(`${baseUrl}/${userData.userId}/funds`).set(userData.headers);

      expect(responseGet1.status, JSON.stringify(responseGet1.body)).to.equal(200);
      const fundsBefore = responseGet1.body.funds;

      // Add sufficient funds
      const responsePut = await request
        .put(`${baseUrl}/${userData.userId}/funds`)
        .set(userData.headers)
        .send({ amount: 500 });
      expect(responsePut.status, JSON.stringify(responsePut.body)).to.equal(200);
      const responsePut2 = await request
        .put(`${baseUrl}/${userData.userId}/funds`)
        .set(userData.headers)
        .send({ amount: 500 });
      expect(responsePut2.status, JSON.stringify(responsePut.body)).to.equal(200);

      const responseGet = await request.get(`${baseUrl}/${userData.userId}/funds`).set(userData.headers);

      expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
      expect(responseGet.body).to.have.property("funds", fundsBefore + 1000);

      const response = await request
        .post(`${learningBaseUrl}/courses/8/enroll`)
        .set(userData.headers)
        .send({ userId: userData.userId });

      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body).to.have.property("success", true);
    });
  });
});
