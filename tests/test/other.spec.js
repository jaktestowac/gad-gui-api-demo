const request = require("supertest");
const { serverApp } = require("../../server.js");
let expect = require("chai").expect;

describe("Endpoint /other", () => {
  const baseUrl = "/api";

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

  after(async () => {
    const restoreResponse = await request(serverApp).get("/api/restoreDB");
    expect(restoreResponse.status).to.equal(201);

    serverApp.close();
  });

  describe("Without auth", () => {
    it("GET /images/user", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/images/user`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /images/posts", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/images/posts`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /restoreEmptyDB", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/restoreEmptyDB`);

      // Assert:
      expect(response.status).to.equal(201);
    });

    it("GET /restoreDB", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/restoreDB`);

      // Assert:
      expect(response.status).to.equal(201);
    });
  });
});
