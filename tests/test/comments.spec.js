const request = require("supertest");
const { serverApp } = require("../../server.js");
let expect = require("chai").expect;

describe("Endpoint /comments", () => {
  const baseUrl = "/api/comments";

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
    it("GET /comments", async () => {
      // Act:
      const response = await request(serverApp).get(baseUrl);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /comments/:id", async () => {
      // Arrange:
      const expectedData = {
        id: 1,
        article_id: 1,
        user_id: 3,
        body: "I loved your insights on usability testing. It's crucial to ensure that the software meets the needs of the end users. Have you encountered any interesting user feedback during usability testing that led to significant improvements in the product?",
        date: "2021-11-30T14:44:22Z",
      };

      // Act:
      const response = await request(serverApp).get(`${baseUrl}/1`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedData);
    });

    it("GET /comments/:id - non existing comment", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/112312312`);

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("POST /comments", () => {
      return request(serverApp).post(baseUrl).send({}).expect(401);
    });

    it("PUT /comments", () => {
      return request(serverApp).put(baseUrl).send({}).expect(401);
    });

    it("PUT /comments/:id", () => {
      return request(serverApp).put(`${baseUrl}/1`).send({}).expect(401);
    });

    it("PATCH /comments/:id", () => {
      return request(serverApp).patch(`${baseUrl}/1`).send({}).expect(401);
    });

    it("DELETE /comments/:id", () => {
      return request(serverApp).delete(`${baseUrl}/1`).send({}).expect(401);
    });

    it("HEAD /comments", () => {
      return request(serverApp).head(`${baseUrl}/1`).expect(200);
    });
  });

  describe("With auth", () => {
    let headers;

    beforeEach(async () => {
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

    it("GET /comments", async () => {
      // Act:
      const response = await request(serverApp).get(baseUrl).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /comments/:id", async () => {
      // Arrange:
      const expectedData = {
        id: 1,
        article_id: 1,
        user_id: 3,
        body: "I loved your insights on usability testing. It's crucial to ensure that the software meets the needs of the end users. Have you encountered any interesting user feedback during usability testing that led to significant improvements in the product?",
        date: "2021-11-30T14:44:22Z",
      };

      // Act:
      const response = await request(serverApp).get(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedData);
    });

    it("HEAD /comments", () => {
      return request(serverApp).head(`${baseUrl}/1`).set(headers).expect(200);
    });
  });
});
