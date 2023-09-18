const { expect, request, baseApiUrl } = require("../config");
const { gracefulQuit, setupEnv } = require("../helpers/helpers");

describe("Endpoint /other", () => {
  const baseUrl = baseApiUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", () => {
    it("GET /images/user", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/images/user`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /images/posts", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/images/posts`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /restoreEmptyDB", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/restoreEmptyDB`);

      // Assert:
      expect(response.status).to.equal(201);
    });

    it("GET /restoreDB", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/restoreDB`);

      // Assert:
      expect(response.status).to.equal(201);
    });
  });
});
