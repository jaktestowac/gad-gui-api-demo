const request = require("supertest");
const { serverApp } = require("../../server.js");

describe("Endpoint /other", () => {
  const baseUrl = "/api";

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
    test("GET /images/user", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/images/user`);

      // Assert:
      expect(response.status).toEqual(200);
      expect(response.body.length).toBeGreaterThan(1);
    });
    test("GET /images/posts", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/images/posts`);

      // Assert:
      expect(response.status).toEqual(200);
      expect(response.body.length).toBeGreaterThan(1);
    });
    test("GET /restoreEmptyDB", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/restoreEmptyDB`);

      // Assert:
      expect(response.status).toEqual(201);
    });
    test("GET /restoreDB", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/restoreDB`);

      // Assert:
      expect(response.status).toEqual(201);
    });
  });
});
