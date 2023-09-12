const { request, expect, baseCommentsUrl } = require("./config.js");
const { authUser, validExistingComment } = require("./helpers/data.helpers.js");
const { gracefulQuit, setupEnv } = require("./helpers/helpers.js");

describe("Endpoint /comments", () => {
  const baseUrl = baseCommentsUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", () => {
    it("GET /comments", async () => {
      // Act:
      const response = await request.get(baseUrl);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /comments/:id", async () => {
      // Arrange:
      const expectedData = validExistingComment;

      // Act:
      const response = await request.get(`${baseUrl}/1`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedData);
    });

    it("GET /comments/:id - non existing comment", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/112312312`);

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("POST /comments", () => {
      return request.post(baseUrl).send({}).expect(401);
    });

    it("PUT /comments", () => {
      return request.put(baseUrl).send({}).expect(401);
    });

    it("PUT /comments/:id", () => {
      return request.put(`${baseUrl}/1`).send({}).expect(401);
    });

    it("PATCH /comments/:id", () => {
      return request.patch(`${baseUrl}/1`).send({}).expect(401);
    });

    it("DELETE /comments/:id", () => {
      return request.delete(`${baseUrl}/1`).send({}).expect(401);
    });

    it("HEAD /comments", () => {
      return request.head(`${baseUrl}/1`).expect(200);
    });
  });

  describe("MODIFY /comments", async () => {
    // TODO:
  });

  describe("DELETE /comments", async () => {
    // TODO:
  });

  describe("With auth", () => {
    let headers;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
    });

    it("GET /comments", async () => {
      // Act:
      const response = await request.get(baseUrl).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /comments/:id", async () => {
      // Arrange:
      const expectedData = validExistingComment;

      // Act:
      const response = await request.get(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedData);
    });

    it("HEAD /comments", () => {
      return request.head(`${baseUrl}/1`).set(headers).expect(200);
    });
  });
});
