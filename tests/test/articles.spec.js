const { baseArticlesUrl, request, faker, expect } = require("../config.js");
const {
  authUser,
  generateValidArticleData,
  validExistingArticle,
  prepareUniqueArticle,
} = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit } = require("../helpers/helpers.js");

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
        const response = await request.get("/api/articles");

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.length).to.be.greaterThan(1);
      });

      it("GET /articles/:id", async () => {
        // Arrange:
        const expectedData = validExistingArticle;

        // Act:
        const response = await request.get("/api/articles/1");

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

      it("POST /articles/upload", () => {
        return request.post(`${baseUrl}/upload`).send({}).expect(401);
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

      // TODO: investigate and fix server behaviour
      it.skip("PUT /articles - create article", async () => {
        // Act:
        const response = await request.put(baseUrl).set(headers).send(testArticleData);

        // Assert:
        expect(response.status).to.equal(201);
      });

      it("PUT /articles/:id - update", async () => {
        // Act:
        const response = await request.put(`${baseUrl}/${articleId}`).set(headers).send(testArticleData);

        // Assert:
        expect(response.status).to.equal(200);
        testArticleData.id = response.body.id;
        expect(response.body).to.deep.equal(testArticleData);
      });

      it("PUT /articles/:id - update different article", async () => {
        // Act:
        const response = await request.put(`${baseUrl}/1`).set(headers).send(testArticleData);

        // Assert:
        expect(response.status).to.equal(401);
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

      it("PATCH /articles/:id - full update", async () => {
        // Act:
        const response = await request.patch(`${baseUrl}/${articleId}`).set(headers).send(testArticleData);

        // Assert:
        expect(response.status).to.equal(200);
        testArticleData.id = response.body.id;
        expect(response.body).to.deep.equal(testArticleData);
      });

      ["title", "body", "date"].forEach((field) => {
        it(`PATCH /articles/:id - full update with invalid data - ${field}`, async () => {
          const testData = { ...testArticleData };
          testData[field] = faker.string.alphanumeric(10001);

          // Act:
          const response = await request.patch(`${baseUrl}/${articleId}`).set(headers).send(testData);

          // Assert:
          expect(response.status).to.equal(422);
        });
      });

      it("PATCH /articles - full update not existing", async () => {
        // Act:
        const response = await request.patch(baseUrl).set(headers).send(testArticleData);

        // Assert:
        expect(response.status).to.equal(404);
      });

      it("PATCH /articles/:id - full update different article", async () => {
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

        // Act:
        const responseGet = await request.get(`${baseUrl}/${articleId}`).set(headers);

        // Assert:
        expect(responseGet.status).to.equal(404);
      });

      it("DELETE /articles/:id - non existing article", async () => {
        // Act:
        const response = await request.delete(`${baseUrl}/1234213`).set(headers);

        // Assert:
        expect(response.status).to.equal(401);
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

      it("POST /articles - create valid article", async () => {
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

      it("POST /articles - create valid article (with id in body)", async () => {
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

      it("POST /articles - create valid article - max title length", async () => {
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

      it("POST /articles - create valid article - max body length", async () => {
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
        expect(response.status).to.equal(401);
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

      ["user_id"].forEach((field) => {
        it(`POST /articles - missing mandatory field - ${field}`, async () => {
          // Arrange:
          const testData = generateValidArticleData();
          testData.user_id = userId;

          testData[field] = undefined;

          // Act:
          const response = await request.post(baseUrl).set(headers).send(testData);

          // Assert:
          expect(response.status).to.equal(401);
        });
      });

      it.skip("POST /articles/upload", async () => {
        // TODO: prepare proper data

        // Arrange:
        const testData = generateValidArticleData();
        const newHeaders = { ...headers };
        newHeaders["userid"] = userId;

        // Act:
        const response = await request.post(`${baseUrl}/upload`).set(headers).send(testData);

        // Assert:
        expect(response.status).to.equal(201);
      });

      it("HEAD /articles", () => {
        return request.head(`${baseUrl}/1`).set(headers).expect(200);
      });
    });
  });
});
