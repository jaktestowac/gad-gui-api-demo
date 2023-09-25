const { request, faker, expect, baseLikesUrl } = require("../config.js");
const { setupEnv, gracefulQuit } = require("../helpers/helpers.js");

describe("Endpoint /likes", () => {
  const baseUrl = baseLikesUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", () => {
    it("GET /likes", async () => {
      // Act:
      const response = await request.get(baseUrl);

      // Assert:
      expect(response.status).to.equal(405);
    });

    it("POST /likes", () => {
      return request.post(baseUrl).send({}).expect(401);
    });

    it("PUT /likes", () => {
      return request.put(baseUrl).send({}).expect(401);
    });

    it("PUT /likes/:id", () => {
      return request.put(`${baseUrl}/1`).send({}).expect(401);
    });

    it("PATCH /likes", () => {
      return request.patch(baseUrl).send({}).expect(401);
    });

    it("PATCH /likes/:id", () => {
      return request.patch(`${baseUrl}/1`).send({}).expect(401);
    });

    it("DELETE /likes", () => {
      return request.delete(baseUrl).expect(401);
    });

    it("DELETE /likes/:id", () => {
      return request.delete(`${baseUrl}/1`).expect(401);
    });

    it("HEAD /likes", () => {
      return request.head(`${baseUrl}/1`).expect(200);
    });
  });
});
