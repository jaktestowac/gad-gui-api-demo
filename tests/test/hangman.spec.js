const request = require("supertest");
const { serverApp } = require("../../server.js");
let expect = require("chai").expect;

describe("Endpoint /hangman", () => {
  const baseUrl = "/api/hangman";

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
    it("GET /random", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/random`);

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

    it("GET /random", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/random`).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.word.length).to.be.greaterThan(1);
    });
  });
});
