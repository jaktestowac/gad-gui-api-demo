const request = require("supertest");
const { serverApp } = require("../../server.js");
let expect = require("chai").expect;

describe("Endpoint /quiz", () => {
  const baseUrl = "/api/quiz";

  before(async () => {
    const restoreResponse = await request(serverApp).get("/api/restoreDB");
    expect(restoreResponse.status).to.equal(201);

    // Lower log level to WARNING:
    const requestBody = {
      currentLogLevel: 2,
    };
    const response = await request(serverApp).post("/api/config").send(requestBody);
    expect(response.status).to.equal(200);
  });

  after(() => {
    serverApp.close();
  });

  describe("Without auth", () => {
    it("start", () => {
      return request(serverApp).get(`${baseUrl}/start`).expect(401);
    });

    it("stop", () => {
      return request(serverApp).get(`${baseUrl}/stop`).expect(401);
    });

    it("highscores", () => {
      return request(serverApp).get(`${baseUrl}/highscores`).expect(200);
    });

    it("questions", () => {
      return request(serverApp).get(`${baseUrl}/questions`).expect(401);
    });

    it("questions/count", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/questions/count`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.count).to.be.greaterThan(1);
    });

    it("questions/check", () => {
      return request(serverApp).post(`${baseUrl}/questions/check`).send({}).expect(401);
    });
  });

  describe("With auth", () => {
    let headers;
    before(async () => {
      const email = "Danial.Dicki@dicki.test";
      const password = "test2";
      const response = await request(serverApp).post("/api/login").send({
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

    it("start", () => {
      return request(serverApp).get(`${baseUrl}/start`).set(headers).expect(200);
    });

    it("stop", () => {
      return request(serverApp).get(`${baseUrl}/stop`).set(headers).expect(200);
    });

    it("highscores", () => {
      return request(serverApp).get(`${baseUrl}/highscores`).set(headers).expect(200);
    });

    it("questions", () => {
      return request(serverApp).get(`${baseUrl}/questions`).set(headers).expect(200);
    });

    it("start", () => {
      return request(serverApp).get(`${baseUrl}/stop`).set(headers).expect(200);
    });

    it("questions/count", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/questions/count`).set(headers);

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
      const response = await request(serverApp)
        .post(`${baseUrl}/questions/check`)
        .send(requestBody)
        .set(headers)
        .expect(200);
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
      const response = await request(serverApp)
        .post(`${baseUrl}/questions/check`)
        .send(requestBody)
        .set(headers)
        .expect(200);
      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedBody);
    });
  });
});
