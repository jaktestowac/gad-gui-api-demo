const { expect, request, baseHangmanUrl } = require("../config");
const { authUser } = require("../helpers/data.helpers");
const { gracefulQuit, setupEnv } = require("../helpers/helpers");

describe("Endpoint /hangman", () => {
  const baseUrl = baseHangmanUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", () => {
    it("GET /random", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/random`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.word.length).to.be.greaterThan(1);
    });
  });

  describe("With auth", () => {
    let headers;
    before(async () => {
      const data = await authUser();
      headers = data.headers;
    });

    it("GET /random", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/random`).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.word.length).to.be.greaterThan(1);
    });
  });
});
