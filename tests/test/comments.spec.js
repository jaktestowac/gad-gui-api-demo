const { request, expect, baseCommentsUrl, faker, baseArticlesUrl } = require("../config.js");
const {
  authUser,
  validExistingComment,
  prepareUniqueComment,
  generateValidCommentData,
  prepareUniqueArticle,
} = require("../helpers/data.helpers.js");
const { gracefulQuit, setupEnv, sleep, getCurrentDate } = require("../helpers/helpers.js");

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
    let headers;
    let userId;
    let articleId;
    let commentId;
    let testCommentData;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;

      const articleData = await prepareUniqueArticle(headers, userId);
      articleId = articleData.articleId;
      const commentData = await prepareUniqueComment(headers, userId, articleId);

      commentId = commentData.commentId;
      testCommentData = generateValidCommentData();
      testCommentData.id = commentId;
      testCommentData.article_id = articleId;
      testCommentData.user_id = userId;
    });

    it("PUT /comments", async () => {
      // Act:
      const response = await request.put(baseUrl).set(headers).send(testCommentData);

      // Assert:
      expect(response.status).to.equal(201);
    });

    it("PUT /comments/:id - update", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/${commentId}`).set(headers).send(testCommentData);

      // Assert:
      expect(response.status).to.equal(200);
      testCommentData.id = response.body.id;
      expect(response.body).to.deep.equal(testCommentData);
    });

    it("PUT /comments/:id - should not update comment with date in future", async () => {
      // Act:
      testCommentData.date = getCurrentDate(0, 0, 11);
      const response = await request.put(`${baseUrl}/${commentId}`).set(headers).send(testCommentData);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(422);
    });

    it("PUT /comments/:id - update different comment", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/1`).set(headers).send(testCommentData);

      // Assert:
      expect(response.status).to.equal(401);
    });

    it("PATCH /comments/:id - full update with invalid fields", async () => {
      const newData = { ...testCommentData };
      newData.body = faker.string.alphanumeric(10001);
      // Act:
      const response = await request.patch(`${baseUrl}/${commentId}`).set(headers).send(newData);

      // Assert:
      expect(response.status).to.equal(422);
    });

    it("PATCH /comments/:id - should do full update", async () => {
      // Act:
      const response = await request.patch(`${baseUrl}/${commentId}`).set(headers).send(testCommentData);

      // Assert:
      expect(response.status).to.equal(200);
      testCommentData.id = response.body.id;
      expect(response.body).to.deep.equal(testCommentData);
    });

    it("PATCH /comments/:id - should not update comment with date in future", async () => {
      // Act:
      testCommentData.date = getCurrentDate(0, 0, 11);
      const response = await request.patch(`${baseUrl}/${commentId}`).set(headers).send(testCommentData);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(422);
    });

    it("PATCH /comments/:id - full update different comment", async () => {
      // Act:
      const response = await request.patch(`${baseUrl}/1`).set(headers).send(testCommentData);

      // Assert:
      expect(response.status).to.equal(401);
    });

    it("PATCH /comments", async () => {
      // Act:
      const response = await request.patch(baseUrl).set(headers).send(testCommentData);

      // Assert:
      expect(response.status).to.equal(404);
    });
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

    it("DELETE /comments/:id - should delete comment", async () => {
      // Act:
      const response = await request.delete(`${baseUrl}/${commentId}`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.deep.equal({});

      // Act:
      const responseGet = await request.get(`${baseUrl}/${commentId}`).set(headers);

      // Assert:
      expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(404);
    });

    it("DELETE /comments/:id - non existing comment", async () => {
      // Act:
      const response = await request.delete(`${baseUrl}/1234213`).set(headers);

      // Assert:
      expect(response.status).to.equal(404);
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
      testData.user_id = undefined;
      testData.article_id = 1;

      // Act:
      const response = await request.post(baseCommentsUrl).set(headers).send(testData);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(201);
      testData.id = response.body.id;
      testData.user_id = userId;
      expect(response.body).to.deep.equal(testData);
    });

    it("POST /comments - should create comment with current date (plus few seconds)", async () => {
      // Arrange:
      const testData = generateValidCommentData();
      testData.user_id = userId;

      testData.date = getCurrentDate(0, 0, 10);

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(201);
      testData.id = response.body.id;
      expect(response.body).to.deep.equal(testData);
    });

    it("POST /comments - should not create comment with date in future", async () => {
      // Arrange:
      const testData = generateValidCommentData();
      testData.user_id = userId;

      testData.date = getCurrentDate(0, 0, 20);

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(422);
    });

    it("POST /comments - should not reuse ID of deleted comments @e2e", async () => {
      // Arrange:
      const testData = generateValidCommentData();
      testData.user_id = userId;

      // Act:
      const responsePost = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(responsePost.status, JSON.stringify(responsePost.body)).to.equal(201);
      const baseId = responsePost.body.id;

      await sleep(100);

      // Act:
      const responseDelete = await request.delete(`${baseUrl}/${baseId}`).set(headers);

      // Assert:
      expect(responseDelete.status).to.equal(200);

      // Create new article:
      // Act:
      const responsePost2 = await request.post(baseUrl).set(headers).send(testData);

      await sleep(100);

      // Assert:
      expect(responsePost2.status, JSON.stringify(responsePost2.body)).to.equal(201);
      const newBaseId = responsePost2.body.id;
      expect(baseId).to.not.equal(newBaseId);
      expect(baseId + 1).to.equal(newBaseId);
    });

    describe("PUT", () => {
      let commentId;
      const articleId = 1;

      beforeEach(async () => {
        const testData = generateValidCommentData();
        testData.user_id = userId;
        testData.article_id = articleId;

        // Act:
        const response = await request.post(baseCommentsUrl).set(headers).send(testData);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(201);
        testData.id = response.body.id;
        expect(response.body).to.deep.equal(testData);
        commentId = response.body.id;

        // check if was created:
        const responseGet = await request.get(`${baseCommentsUrl}/${commentId}`);
        expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
      });

      it("PUT /comments - should update valid comment", async () => {
        // Arrange:
        const testData = generateValidCommentData();
        testData.user_id = userId;
        testData.article_id = articleId;
        testData.id = commentId;
        // Act:
        const response = await request.put(`${baseCommentsUrl}/${commentId}`).set(headers).send(testData);

        // Assert:
        expect(
          response.status,
          `updating commentId: ${commentId} -> received: ${JSON.stringify(response.body)}`
        ).to.equal(200);
        testData.id = response.body.id;
        expect(response.body).to.deep.equal(testData);
      });

      it("PUT /comments - should update comment without providing user_id (user_id taken from token)", async () => {
        // Arrange:
        const testData = generateValidCommentData();
        testData.user_id = undefined;
        testData.article_id = articleId;
        testData.id = commentId;
        // Act:
        const response = await request.put(`${baseCommentsUrl}/${commentId}`).set(headers).send(testData);

        // Assert:
        expect(
          response.status,
          `updating commentId: ${commentId} -> received: ${JSON.stringify(response.body)}`
        ).to.equal(200);
        testData.id = response.body.id;
        testData.user_id = userId;
        expect(response.body).to.deep.equal(testData);
      });

      it("PUT /comments - should not update not Your own comment", async () => {
        // Arrange:
        const testData = generateValidCommentData();
        testData.user_id = userId;
        testData.article_id = articleId;
        testData.id = commentId;
        // Act:
        const response = await request.put(`${baseCommentsUrl}/5`).set(headers).send(testData);

        // Assert:
        expect(
          response.status,
          `updating commentId: ${commentId} -> received: ${JSON.stringify(response.body)}`
        ).to.equal(401);
      });

      it("PUT /comments - should create comment if not exist", async () => {
        // Arrange:
        const testData = generateValidCommentData();
        testData.user_id = userId;
        testData.article_id = articleId;
        testData.id = commentId;
        // Act:
        const response = await request.put(`${baseCommentsUrl}/12125`).set(headers).send(testData);

        // Assert:
        expect(
          response.status,
          `updating commentId: ${commentId} -> received: ${JSON.stringify(response.body)}`
        ).to.equal(201);
      });

      it("PUT /comments - should create comment", async () => {
        // Arrange:
        const testData = generateValidCommentData();
        testData.user_id = userId;
        testData.article_id = articleId;
        testData.id = commentId;
        // Act:
        const response = await request.put(`${baseCommentsUrl}`).set(headers).send(testData);

        // Assert:
        expect(
          response.status,
          `updating commentId: ${commentId} -> received: ${JSON.stringify(response.body)}`
        ).to.equal(201);
      });
    });

    it("POST /comments - create valid comment (with id in body)", async () => {
      const testData = generateValidCommentData();
      testData.user_id = userId;
      testData.article_id = 1;
      testData.id = 1;

      // Act:
      const response = await request.post(baseCommentsUrl).set(headers).send(testData);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(201);
      testData.id = response.body.id;
      expect(response.body).to.deep.equal(testData);
    });

    ["article_id", "body", "date"].forEach((field) => {
      it(`POST /comments - missing mandatory field - ${field}`, async () => {
        // Arrange:
        const testData = generateValidCommentData();
        testData.user_id = userId;

        testData[field] = undefined;

        // Act:
        const response = await request.post(baseUrl).set(headers).send(testData);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(422);
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

    it("GET /comments/:id - should return 404 when comment does not exist", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/100000`).set(headers);

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("HEAD /comments", () => {
      return request.head(`${baseUrl}/1`).set(headers).expect(200);
    });
  });

  describe("Soft delete @e2e", () => {
    let headers;
    let userId;
    let articleId;
    let commentId1;
    let commentId2;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;

      const articleData = await prepareUniqueArticle(headers, userId);
      articleId = articleData.articleId;

      const commentData1 = await prepareUniqueComment(headers, userId, articleId);
      commentId1 = commentData1.commentId;
    });

    it("should not return comment for soft deleted article", async () => {
      // Act:
      const responseDelete = await request.delete(`${baseArticlesUrl}/${articleId}`).set(headers);

      // Assert:
      expect(responseDelete.status, JSON.stringify(responseDelete.body)).to.equal(200);

      await sleep(100);

      // Act:
      const response = await request
        .get(`${baseUrl}/?_limit=6&_page=1&_sort=date&_order=DESC&article_id=${articleId}`)
        .set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body.length).to.equal(0);
    });
  });
});
