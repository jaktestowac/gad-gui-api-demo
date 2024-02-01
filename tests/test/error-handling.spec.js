const { gracefulQuit, setupEnv } = require("../helpers/helpers.js");
const { request, expect, baseApiUrl } = require("../config.js");

describe("Invalid JSON data", async () => {
  const baseUrl = baseApiUrl;
  const endpoints = ["/articles", "/users", "/comments", "/login", "/likes"];

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  endpoints.forEach((endpoint) => {
    it(`POST ${endpoint} - should return proper error on invalid JSON data`, async () => {
      // Arrange:
      const brokenData = '{"invalid"}';

      // Act:
      const response = await request.post(`${baseUrl}${endpoint}`).send(brokenData).type("json");

      // Assert:
      expect(response.status).to.equal(400);
    });
  });

  endpoints.forEach((endpoint) => {
    it(`PUT ${endpoint} - should return proper error on invalid JSON data`, async () => {
      // Arrange:
      const brokenData = '{"invalid"}';

      // Act:
      const response = await request.put(`${baseUrl}${endpoint}`).send(brokenData).type("json");

      // Assert:
      expect(response.status).to.equal(400);
    });
  });

  endpoints.forEach((endpoint) => {
    it(`PUT ${endpoint} - should return proper error on invalid JSON data`, async () => {
      // Arrange:
      const brokenData = '{"invalid"}';

      // Act:
      const response = await request.patch(`${baseUrl}${endpoint}`).send(brokenData).type("json");

      // Assert:
      expect(response.status).to.equal(400);
    });
  });
});
