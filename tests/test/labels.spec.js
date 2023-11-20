const { request, expect, baseLabelsUrl, sleepTime } = require("../config.js");
const { authUser } = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, sleep } = require("../helpers/helpers.js");

describe("Endpoint /labels", () => {
  const baseUrl = baseLabelsUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", () => {
    it("GET /labels", async () => {
      // Act:
      const response = await request.get(baseUrl);

      // Assert:
      expect(response.status).to.equal(200);
    });

    it("POST /labels", () => {
      return request.post(baseUrl).send({}).expect(422);
    });

    it("PUT /labels", () => {
      return request.put(baseUrl).send({}).expect(404);
    });

    it("PUT /labels/:id", () => {
      return request.put(`${baseUrl}/1`).send({}).expect(200);
    });

    it("PATCH /labels", () => {
      return request.patch(baseUrl).send({}).expect(404);
    });

    it("PATCH /labels/:id", () => {
      return request.patch(`${baseUrl}/1`).send({}).expect(200);
    });

    it("DELETE /labels", () => {
      return request.delete(baseUrl).expect(405);
    });

    it("DELETE /labels/:id", () => {
      return request.delete(`${baseUrl}/1`).expect(200);
    });

    it("HEAD /labels", () => {
      return request.head(`${baseUrl}/2`).expect(200);
    });
  });
});
