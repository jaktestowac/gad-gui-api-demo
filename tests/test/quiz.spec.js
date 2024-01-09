const { expect, request, baseQuizUrl } = require("../config");
const { authUser } = require("../helpers/data.helpers");
const { gracefulQuit, setupEnv } = require("../helpers/helpers");

describe("Endpoint /quiz", () => {
  const baseUrl = baseQuizUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", () => {
    it("start", () => {
      return request.get(`${baseUrl}/start`).expect(401);
    });

    it("stop", () => {
      return request.get(`${baseUrl}/stop`).expect(401);
    });

    it("highscores", () => {
      return request.get(`${baseUrl}/highscores`).expect(200);
    });

    it("questions", () => {
      return request.get(`${baseUrl}/questions`).expect(401);
    });

    it("questions/count", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/questions/count`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.count).to.be.greaterThan(1);
    });

    it("questions/check", () => {
      return request.post(`${baseUrl}/questions/check`).send({}).expect(401);
    });
  });

  describe("With auth", () => {
    let headers;
    before(async () => {
      const data = await authUser();
      headers = data.headers;
    });

    it("start", () => {
      return request.get(`${baseUrl}/start`).set(headers).expect(200);
    });

    it("stop", () => {
      return request.get(`${baseUrl}/stop`).set(headers).expect(201);
    });

    it("highscores", () => {
      return request.get(`${baseUrl}/highscores`).set(headers).expect(200);
    });

    it("questions", () => {
      return request.get(`${baseUrl}/questions`).set(headers).expect(200);
    });

    it("questions/count", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/questions/count`).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.count).to.be.greaterThan(1);
    });

    it("questions/check - incorrect", async () => {
      // Arrange:
      const requestBody = {
        questionText: "string",
        selectedAnswers: ["string"],
      };
      const expectedBody = {
        isCorrect: false,
        score: 0,
      };

      // Act:
      const response = await request.post(`${baseUrl}/questions/check`).send(requestBody).set(headers).expect(200);
      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedBody);
    });

    it("questions/check - correct", async () => {
      // Arrange:
      const requestBody = {
        questionText: "What does HTML stand for?",
        selectedAnswers: ["Hyper Text Markup Language"],
      };
      const expectedBody = {
        isCorrect: true,
        score: 1,
      };

      // Act:
      const response = await request.post(`${baseUrl}/questions/check`).send(requestBody).set(headers).expect(200);
      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedBody);
    });
  });
});
