const request = require("supertest");
const { serverApp } = require("../../server.js");

describe("Endpoint /hangman", () => {
  const baseUrl = "/api/hangman";

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
    test("GET /random", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/random`);

      // Assert:
      expect(response.status).toEqual(200);
      expect(response.body.word.length).toBeGreaterThan(1);
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
    test("GET /random", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/random`).set(headers);

      // Assert:
      expect(response.status).toEqual(200);
      expect(response.body.word.length).toBeGreaterThan(1);
    });
  });
});
