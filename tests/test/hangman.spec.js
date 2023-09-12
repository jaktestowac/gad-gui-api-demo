const { expect, request, baseHangmanUrl } = require("./config");
const { gracefulQuit, setupEnv } = require("./helpers/helpers");

describe("Endpoint /hangman", () => {
  const baseUrl = baseHangmanUrl

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
      const email = "Danial.Dicki@dicki.test";
      const password = "test2";
      const response = await request.post("/api/login").send({
        email,
        password,
      });
      expect(response.status).to.equal(200);

      const token = response.body.access_token;
      headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
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
