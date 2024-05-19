const { baseArticlesUrl, request, faker, expect, baseRandomArticlesUrl } = require("../config.js");
const {
  authUser,
  generateValidArticleData,
  validExistingArticle,
  prepareUniqueArticle,
} = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, getCurrentDate, sleep } = require("../helpers/helpers.js");

describe("Endpoint /articles", () => {
  const baseUrl = baseArticlesUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", () => {
    describe("GET /:resources", () => {
      it("GET /articles", async () => {
        // Act:
        const response = await request.get(baseUrl);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.length).to.be.greaterThan(1);
      });

      it("GET /articles - use query", async () => {
        // Act:
        const response = await request.get(baseUrl + "?_limit=6&_page=1&_sort=date&_order=DESC");

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.length).to.equal(6);
      });

      it("GET /articles/:id", async () => {
        // Arrange:
        const expectedData = validExistingArticle;

        // Act:
        const response = await request.get(`${baseUrl}/1`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal(expectedData);
      });

      it("GET /articles/:id - non existing article", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/112312312`);

        // Assert:
        expect(response.status).to.equal(404);
      });

      it("POST /articles", () => {
        return request.post(baseUrl).send({}).expect(401);
      });

      it("PUT /articles", () => {
        return request.put(baseUrl).send({}).expect(401);
      });

      it("PUT /articles/:id", () => {
        return request.put(`${baseUrl}/1`).send({}).expect(401);
      });

      it("PATCH /articles", () => {
        return request.patch(baseUrl).send({}).expect(401);
      });

      it("PATCH /articles/:id", () => {
        return request.patch(`${baseUrl}/1`).send({}).expect(401);
      });

      it("DELETE /articles", () => {
        return request.delete(baseUrl).expect(401);
      });

      it("DELETE /articles/:id", () => {
        return request.delete(`${baseUrl}/1`).expect(401);
      });

      it("HEAD /articles", () => {
        return request.head(`${baseUrl}/1`).expect(200);
      });

      it("GET random/articles", () => {
        return request.get(baseRandomArticlesUrl).expect(200);
      });
    });
  });

  describe("MODIFY /articles", async () => {
    let headers;
    let userId;
    let articleId;
    let testArticleData;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;

      const articleData = await prepareUniqueArticle(headers, userId);
      articleId = articleData.articleId;
      testArticleData = generateValidArticleData();
      testArticleData.user_id = userId;
    });

    it("PUT /articles - should create valid article", async () => {
      // Act:
      const response = await request.put(baseUrl).set(headers).send(testArticleData);

      // Assert:
      expect(response.status, JSON.stringify(response)).to.equal(201);
    });

    it("PUT /articles/:id - should update valid article", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/${articleId}`).set(headers).send(testArticleData);

      // Assert:
      expect(response.status).to.equal(200);
      testArticleData.id = response.body.id;
      expect(response.body).to.deep.equal(testArticleData);
    });

    it("PUT /articles/:id - should update valid article without providing user_id (user_id taken from token)", async () => {
      // Arrange:
      testArticleData.user_id = undefined;

      // Act:
      const response = await request.put(`${baseUrl}/${articleId}`).set(headers).send(testArticleData);

      // Assert:
      expect(response.status).to.equal(200);
      testArticleData.id = response.body.id;
      testArticleData.user_id = userId;
      expect(response.body).to.deep.equal(testArticleData);
    });

    it("PUT /articles/:id - should not update article with date in future", async () => {
      // Act:
      testArticleData.date = getCurrentDate(0, 0, 11);
      const response = await request.put(`${baseUrl}/${articleId}`).set(headers).send(testArticleData);

      // Assert:
      expect(response.status).to.equal(422);
    });

    it("PUT /articles/:id - should update article with different user ID - id is overwritten on back-end", async () => {
      // Act:
      const newArticleData = testArticleData;
      newArticleData.user_id = newArticleData.user_id + 1;
      expect(userId).to.not.eql(newArticleData.user_id);

      const response = await request.put(`${baseUrl}/${articleId}`).set(headers).send(newArticleData);

      // Assert:
      expect(response.status).to.equal(200);

      const responseGet = await request.get(`${baseUrl}/${articleId}`).set(headers);
      expect(userId, JSON.stringify(responseGet.body)).to.equal(responseGet.body.user_id);
    });

    it("PUT /articles/:id - should not update different article", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/1`).set(headers).send(testArticleData);

      // Assert:
      expect(response.status, JSON.stringify(response)).to.equal(401);
    });

    ["title", "body", "date"].forEach((field) => {
      it(`PUT /articles/:id - missing mandatory field - ${field}`, async () => {
        // Arrange:
        testArticleData[field] = undefined;

        // Act:
        const response = await request.put(`${baseUrl}/${articleId}`).set(headers).send(testArticleData);

        // Assert:
        expect(response.status).to.equal(422);
      });
    });

    it(`PUT /articles - empty all fields`, async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = userId;
      testData.body = "";
      testData.image = "";
      testData.title = "";
      testData.date = "";

      // Act:
      const response = await request.put(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status).to.equal(422);
    });

    it("PATCH /articles/:id - should do full update", async () => {
      // Act:
      const response = await request.patch(`${baseUrl}/${articleId}`).set(headers).send(testArticleData);

      // Assert:
      expect(response.status).to.equal(200);
      testArticleData.id = response.body.id;
      expect(response.body).to.deep.equal(testArticleData);
    });

    it("PATCH /articles/:id - should not update article with date in future", async () => {
      // Act:
      testArticleData.date = getCurrentDate(0, 0, 11);
      const response = await request.patch(`${baseUrl}/${articleId}`).set(headers).send(testArticleData);

      // Assert:
      expect(response.status).to.equal(422);
    });

    it("PATCH /articles/:id - should not update with different user ID", async () => {
      // Act:
      const newArticleData = testArticleData;
      newArticleData.user_id = undefined;
      const newArticleId = articleId - 1;
      const response = await request.patch(`${baseUrl}/${newArticleId}`).set(headers).send(newArticleData);

      // Assert:
      expect(response.status).to.equal(401);
    });

    ["title", "body", "date"].forEach((field) => {
      it(`PATCH /articles/:id - should not full update with invalid data - ${field}`, async () => {
        const testData = { ...testArticleData };
        testData[field] = faker.string.alphanumeric(10001);

        // Act:
        const response = await request.patch(`${baseUrl}/${articleId}`).set(headers).send(testData);

        // Assert:
        expect(response.status).to.equal(422);
      });
    });

    it("PATCH /articles - should not do full update not existing", async () => {
      // Act:
      const response = await request.patch(baseUrl).set(headers).send(testArticleData);

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("PATCH /articles/:id - should not full update different article", async () => {
      // Act:
      const response = await request.patch(`${baseUrl}/1`).set(headers).send(testArticleData);

      // Assert:
      expect(response.status).to.equal(401);
    });
  });

  describe("DELETE /articles", async () => {
    let headers;
    let userId;
    let articleId;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;

      const articleData = await prepareUniqueArticle(headers, userId);
      articleId = articleData.articleId;
    });

    it("DELETE /articles/:id", async () => {
      // Act:
      const response = await request.delete(`${baseUrl}/${articleId}`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.deep.equal({});

      // Act:
      const responseGet = await request.get(`${baseUrl}/${articleId}`).set(headers);

      // Assert:
      expect(responseGet.status).to.equal(404);
    });

    it("DELETE /articles/:id - non existing article", async () => {
      // Act:
      const response = await request.delete(`${baseUrl}/1234213`).set(headers);

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("DELETE /articles/:id - not my article", async () => {
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

    it("GET /articles - use query", async () => {
      // Act:
      const response = await request.get(baseUrl + "?_limit=6&_page=1&_sort=date&_order=DESC");

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.equal(6);
    });

    it("GET /articles - use query 2", async () => {
      // Act:
      const response = await request.get(baseUrl + "?_limit=6&_page=1&_sort=date&_order=DESC&_inactive=true");

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.equal(6);
    });

    it("GET /articles - e2e - use query and delete one article", async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = userId;
      testData.date = getCurrentDate(0, 0, 0);

      // Act:
      const responseCreate = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(responseCreate.status, JSON.stringify(responseCreate.body)).to.equal(201);
      testData.id = responseCreate.body.id;
      const articleId = testData.id;
      expect(responseCreate.body).to.deep.equal(testData);

      // Act:
      const responseGet1 = await request.get(baseUrl + "?_limit=6&_page=1&_sort=date&_order=DESC");

      // Assert:
      expect(responseGet1.status).to.equal(200);
      expect(responseGet1.body.length).to.equal(6);

      // Act:
      const responseDel = await request.delete(`${baseUrl}/${articleId}`).set(headers);

      // Assert:
      expect(responseDel.status, JSON.stringify(responseDel.body)).to.equal(200);

      // Act:
      const responseGet = await request.get(`${baseUrl}/${articleId}`).set(headers);

      // Assert:
      expect(responseGet.status).to.equal(404);

      // Act:
      const responseGet2 = await request.get(baseUrl + "?_limit=6&_page=1&_sort=date&_order=DESC");

      // Assert:
      expect(responseGet2.status).to.equal(200);
      expect(responseGet2.body.length).to.equal(6);
    });

    it("GET /articles", async () => {
      // Act:
      const response = await request.get(baseUrl).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /articles/:id", async () => {
      // Arrange:
      const expectedData = validExistingArticle;

      // Act:
      const response = await request.get(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedData);
    });

    it("GET /articles/:id - should return 404 when article does not exist", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/10000000`).set(headers);

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("POST /articles - should create valid article", async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = userId;

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status).to.equal(201);
      testData.id = response.body.id;
      expect(response.body).to.deep.equal(testData);
    });

    [".000Z", ".0Z", ".00Z", ".000000Z"].forEach((milliseconds) => {
      it(`POST /articles - should create valid article (date with ${milliseconds})`, async () => {
        // Arrange:
        const testData = generateValidArticleData();
        testData.user_id = userId;
        testData.date = testData.date.replace("Z", milliseconds);

        // Act:
        const response = await request.post(baseUrl).set(headers).send(testData);

        // Assert:
        expect(response.status, JSON.stringify(response.data)).to.equal(201);
        testData.id = response.body.id;
        expect(response.body).to.deep.equal(testData);
      });
    });

    it("POST /articles - should create valid article without user id", async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = undefined;

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status).to.equal(201);
      testData.id = response.body.id;
      testData.user_id = userId;
      expect(response.body).to.deep.equal(testData);
    });

    it("POST /articles - should not reuse ID of deleted articles @e2e", async () => {
      // Arrange:
      const testData = generateValidArticleData();
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

    it("POST /articles - should create valid article (with id in body)", async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = userId;
      testData.id = 1;

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status).to.equal(201);
      testData.id = response.body.id;
      expect(response.body).to.deep.equal(testData);
    });

    it("POST /articles - should create valid article - max title length", async () => {
      // Arrange:
      const testData = generateValidArticleData(128);
      testData.user_id = userId;

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status).to.equal(201);
      testData.id = response.body.id;
      expect(response.body).to.deep.equal(testData);
    });

    it("POST /articles - should create valid article - max body length", async () => {
      // Arrange:
      const testData = generateValidArticleData(128, 10000);
      testData.user_id = userId;

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status).to.equal(201);
      testData.id = response.body.id;
      expect(response.body).to.deep.equal(testData);
    });

    it("POST /articles - should create article with current date", async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = userId;

      testData.date = getCurrentDate();

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(201);
      testData.id = response.body.id;
      expect(response.body).to.deep.equal(testData);
    });

    it("POST /articles - should create article with current date (plus few seconds)", async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = userId;

      testData.date = getCurrentDate(0, 0, 10);

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(201);
      testData.id = response.body.id;
      expect(response.body).to.deep.equal(testData);
    });

    it("POST /articles - should not create article with date in future", async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = userId;

      testData.date = getCurrentDate(0, 0, 20);

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(422);
    });

    it("POST /articles - should not create article with invalid date format", async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = userId;

      testData.date = testData.date.replace("Z", "0Z");

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(422);
    });

    ["title", "body", "date"].forEach((field) => {
      it(`POST /articles - length of field exceeded - ${field}`, async () => {
        // Arrange:
        const testData = generateValidArticleData();
        testData.user_id = userId;

        testData[field] = faker.string.alphanumeric(10001);

        // Act:
        const response = await request.post(baseUrl).set(headers).send(testData);

        // Assert:
        expect(response.status).to.equal(422);
      });
    });

    ["title", "body", "date"].forEach((field) => {
      it(`POST /articles - missing mandatory field - ${field}`, async () => {
        // Arrange:
        const testData = generateValidArticleData();
        testData.user_id = userId;

        testData[field] = undefined;

        // Act:
        const response = await request.post(baseUrl).set(headers).send(testData);

        // Assert:
        expect(response.status).to.equal(422);
      });
    });

    it(`POST /articles - empty all data fields`, async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = userId;
      testData.body = "";
      testData.image = "";
      testData.title = "";
      testData.date = "";

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status).to.equal(422);
    });

    it(`POST /articles - empty all fields`, async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = "";
      testData.body = "";
      testData.image = "";
      testData.title = "";
      testData.date = "";

      // Act:
      const response = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(422);
    });
    ["title", "body", "date"].forEach((field) => {
      it(`POST /articles - empty mandatory field - ${field}`, async () => {
        // Arrange:
        const testData = generateValidArticleData();
        testData.user_id = userId;

        testData[field] = "";

        // Act:
        const response = await request.post(baseUrl).set(headers).send(testData);

        // Assert:
        expect(response.status).to.equal(422);
      });
    });

    it("HEAD /articles", () => {
      return request.head(`${baseUrl}/1`).set(headers).expect(200);
    });
  });
});
