const request = require("supertest");
const { serverApp } = require("../../server.js");

describe("Endpoint /quiz", () => {
  const baseUrl = "/api/quiz";

  beforeAll(async () => {
    try {
      request(serverApp).get("/api/restoreDB").expect(201);
    } catch (error) {
      console.log(error);
    }

    // Lover log level to WARNING:
    const requestBody = {
      currentLogLevel: 2,
    };
    const response = await request(serverApp).post("/api/config").send(requestBody);
    expect(response.status).toEqual(200);
  });

  afterAll(() => {
    serverApp.close();
  });

  describe("Without auth", () => {
    test("start", () => {
      return request(serverApp).get(`${baseUrl}/start`).expect(401);
    });
    test("stop", () => {
      return request(serverApp).get(`${baseUrl}/stop`).expect(401);
    });
    test("highscores", () => {
      return request(serverApp).get(`${baseUrl}/highscores`).expect(200);
    });
    test("questions", () => {
      return request(serverApp).get(`${baseUrl}/questions`).expect(401);
    });
    test("questions/count", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/questions/count`);

      // Assert:
      expect(response.status).toEqual(200);
      expect(response.body.count).toBeGreaterThan(1);
    });
    test("questions/check", () => {
      return request(serverApp).post(`${baseUrl}/questions/check`).send({}).expect(401);
    });
  });

  describe("With auth", () => {
    let headers;
    beforeAll(async () => {
      const email = "Danial.Dicki@dicki.test";
      const password = "test2";
      const response = await request(serverApp).post("/api/login").send({
        email,
        password,
      });
      expect(response.status).toEqual(200);

      const token = response.body.access_token;
      headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
    });
    test("start", () => {
      return request(serverApp).get(`${baseUrl}/start`).set(headers).expect(200);
    });
    test("stop", () => {
      return request(serverApp).get(`${baseUrl}/stop`).set(headers).expect(200);
    });
    test("highscores", () => {
      return request(serverApp).get(`${baseUrl}/highscores`).set(headers).expect(200);
    });
    test("questions", () => {
      return request(serverApp).get(`${baseUrl}/questions`).set(headers).expect(200);
    });
    test("start", () => {
      return request(serverApp).get(`${baseUrl}/stop`).set(headers).expect(200);
    });
    test("questions/count", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/questions/count`).set(headers);

      // Assert:
      expect(response.status).toEqual(200);
      expect(response.body.count).toBeGreaterThan(1);
    });
    test("questions/check - incorrect", async () => {
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
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(expectedBody);
    });
    test("questions/check - correct", async () => {
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
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(expectedBody);
    });
  });
});
