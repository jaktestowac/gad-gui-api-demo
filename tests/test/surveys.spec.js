const { request, expect, baseSurveysManualApiUrl } = require("../config.js");
const { setupEnv, gracefulQuit } = require("../helpers/helpers.js");

describe(`Endpoint ${baseSurveysManualApiUrl}`, () => {
  const baseUrl = baseSurveysManualApiUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", () => {
    it(`GET ${baseUrl}`, async () => {
      // Act:
      const response = await request.get(baseUrl);

      // Assert:
      expect(response.status).to.equal(404);
    });

    it(`POST ${baseUrl}`, () => {
      return request.post(baseUrl).send({}).expect(404);
    });

    it(`PUT ${baseUrl}`, () => {
      return request.put(baseUrl).send({}).expect(404);
    });

    it(`PUT ${baseUrl}/:id`, () => {
      return request.put(`${baseUrl}/1`).send({}).expect(404);
    });

    it(`PATCH ${baseUrl}`, () => {
      return request.patch(baseUrl).send({}).expect(404);
    });

    it(`PATCH ${baseUrl}/:id`, () => {
      return request.patch(`${baseUrl}/1`).send({}).expect(404);
    });

    it(`DELETE ${baseUrl}`, () => {
      return request.delete(baseUrl).expect(404);
    });

    it(`DELETE ${baseUrl}/:id`, () => {
      return request.delete(`${baseUrl}/1`).expect(404);
    });

    it(`HEAD ${baseUrl}/:id`, () => {
      return request.head(`${baseUrl}/1`).expect(404);
    });
  });
});
