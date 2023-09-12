const { request, expect, baseCommentsUrl, faker } = require("./config.js");
const {
  authUser,
  validExistingComment,
  prepareUniqueComment,
  generateValidCommentData,
} = require("./helpers/data.helpers.js");
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

    it("PATCH /comments", () => {
      return request.patch(baseUrl).send({}).expect(401);
    });

    it("DELETE /comments/:id", () => {
      return request.delete(`${baseUrl}/1`).expect(401);
    });

    it("DELETE /comments", () => {
      return request.delete(baseUrl).expect(401);
    });

    it("HEAD /comments", () => {
      return request.head(`${baseUrl}/1`).expect(200);
    });
  });

  describe("MODIFY /comments", async () => {
    // TODO:
  });

  describe("DELETE /comments", async () => {
    let headers;
    let userId;
    let articleId;
    let commentId;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;
      articleId = 1;

      const commentData = await prepareUniqueComment(headers, userId, articleId);
      commentId = commentData.commentId;
    });

    it("DELETE /comments/:id", async () => {
      // Act:
      const response = await request.delete(`${baseUrl}/${commentId}`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);

      // Act:
      const responseGet = await request.get(`${baseUrl}/${commentId}`).set(headers);

      // Assert:
      expect(responseGet.status).to.equal(404);
    });

    it("DELETE /comments/:id - non existing comment", async () => {
      // Act:
      const response = await request.delete(`${baseUrl}/1234213`).set(headers);

      // Assert:
      expect(response.status).to.equal(401);
    });

    it("DELETE /comments/:id - not my comment", async () => {
      // Act:
      const response = await request.delete(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(response.status).to.equal(401);
    });
  });

  describe("With auth", () => {
    let headers;
    let userId;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;
    });

    it("POST /comments - create valid comment", async () => {
      const testData = generateValidCommentData();
      testData.user_id = userId;
      testData.article_id = 1;

      // Act:
      const response = await request.post(baseCommentsUrl).set(headers).send(testData);

      // Assert:
      expect(response.status).to.equal(201);
      testData.id = response.body.id;
      expect(response.body).to.deep.equal(testData);
    });

    it("POST /comments - create valid comment (with id in body)", async () => {
      const testData = generateValidCommentData();
      testData.user_id = userId;
      testData.article_id = 1;
      testData.id = 1;

      // Act:
      const response = await request.post(baseCommentsUrl).set(headers).send(testData);

      // Assert:
      expect(response.status).to.equal(201);
      testData.id = response.body.id;
      expect(response.body).to.deep.equal(testData);
    });

    ["user_id", "article_id", "body", "date"].forEach((field) => {
      it(`POST /comments - missing mandatory field - ${field}`, async () => {
        // Arrange:
        const testData = generateValidCommentData();
        testData.user_id = userId;

        testData[field] = undefined;

        // Act:
        const response = await request.post(baseUrl).set(headers).send(testData);

        // Assert:
        expect(response.status).to.equal(422);
      });
    });

    ["user_id", "article_id", "body", "date"].forEach((field) => {
      it(`POST /comments - length of field exceeded - ${field}`, async () => {
        // Arrange:
        const testData = generateValidCommentData();
        testData.user_id = userId;

        testData[field] = faker.string.alphanumeric(10001);

        // Act:
        const response = await request.post(baseUrl).set(headers).send(testData);

        // Assert:
        expect(response.status).to.equal(422);
      });
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
