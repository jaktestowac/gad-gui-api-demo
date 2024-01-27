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
      expect(response.body.word.length, `Response was: ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    });
    it("GET /highscores", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/highscores`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.highScore.length, `Response was: ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    });
    it("POST /highscores", async () => {
      // Act:
      const response = await request.post(`${baseUrl}/highscores`).send({});

      // Assert:
      expect(response.status).to.equal(404);
    });
    it("PUT /highscores", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/highscores`).send({});

      // Assert:
      expect(response.status).to.equal(404);
    });
    it("PATCH /highscores", async () => {
      // Act:
      const response = await request.patch(`${baseUrl}/highscores`).send({});

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("GET /score", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/score`);

      // Assert:
      expect(response.status).to.equal(404);
    });
    it("POST /score", async () => {
      // Act:
      const response = await request.post(`${baseUrl}/score`).send({});

      // Assert:
      expect(response.status).to.equal(401);
    });
    it("PUT /score", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/score`).send({});

      // Assert:
      expect(response.status).to.equal(404);
    });
    it("PATCH /score", async () => {
      // Act:
      const response = await request.patch(`${baseUrl}/score`).send({});

      // Assert:
      expect(response.status).to.equal(404);
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
    it("GET /highscores", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/highscores`).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.highScore.length, `Response was: ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    });
    it("POST /highscores", async () => {
      // Act:
      const response = await request.post(`${baseUrl}/highscores`).send({}).set(headers);

      // Assert:
      expect(response.status).to.equal(404);
    });
    it("PUT /highscores", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/highscores`).send({}).set(headers);

      // Assert:
      expect(response.status).to.equal(404);
    });
    it("PATCH /highscores", async () => {
      // Act:
      const response = await request.patch(`${baseUrl}/highscores`).send({}).set(headers);

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("GET /score", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/score`).set(headers);

      // Assert:
      expect(response.status).to.equal(404);
    });
    it("POST /score - should record score", async () => {
      // Act:
      const response = await request.post(`${baseUrl}/score`).send({ score: 123 }).set(headers);

      // Assert:
      expect(response.status).to.equal(201);
    });
    it("POST /score - should not record score with no score object", async () => {
      // Act:
      const response = await request.post(`${baseUrl}/score`).send({}).set(headers);

      // Assert:
      expect(response.status).to.equal(422);
    });
    it("POST /score - should not record score with score not a number", async () => {
      // Act:
      const response = await request.post(`${baseUrl}/score`).send({ score: "a" }).set(headers);

      // Assert:
      expect(response.status).to.equal(422);
    });
    it("PUT /score", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/score`).send({}).set(headers);

      // Assert:
      expect(response.status).to.equal(404);
    });
    it("PATCH /score", async () => {
      // Act:
      const response = await request.patch(`${baseUrl}/score`).send({}).set(headers);

      // Assert:
      expect(response.status).to.equal(404);
    });
  });
});
