const { request, expect, baseBookmarksUrl } = require("../config.js");
const { authUser, authUser2 } = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, sleep } = require("../helpers/helpers.js");

describe("Endpoint /bookmarks", async () => {
  const baseUrl = baseBookmarksUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", async () => {
    it("GET /bookmarks", async () => {
      // Act:
      const response = await request.get(baseUrl);

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("POST /bookmarks", () => {
      return request.post(baseUrl).send({}).expect(404);
    });

    it("PUT /bookmarks", () => {
      return request.put(baseUrl).send({}).expect(404);
    });

    it("PUT /bookmarks/:id", () => {
      return request.put(`${baseUrl}/1`).send({}).expect(404);
    });

    it("PATCH /bookmarks", () => {
      return request.patch(baseUrl).send({}).expect(404);
    });

    it("PATCH /bookmarks/:id", () => {
      return request.patch(`${baseUrl}/1`).send({}).expect(404);
    });

    it("DELETE /bookmarks", () => {
      return request.delete(baseUrl).expect(404);
    });

    it("DELETE /bookmarks/:id", () => {
      return request.delete(`${baseUrl}/1`).expect(404);
    });

    it("HEAD /bookmarks", () => {
      return request.head(`${baseUrl}/1`).expect(404);
    });
  });

  describe("With auth /bookmarks/articles", async () => {
    let headers;
    let userId;

    beforeEach(async () => {
      const data = await authUser2();
      headers = data.headers;
      userId = data.userId;
      headers["userid"] = userId;
    });

    it(`POST /bookmarks - invalid article_id`, async () => {
      // Arrange:
      const bookmarksBody = {
        article_id: "abc",
      };
      const expectedBookmarkedArticles = undefined;

      // Act:
      const responsePost = await request.post(`${baseUrl}/articles`).set(headers).send(bookmarksBody);

      // Assert:
      expect(responsePost.status).to.equal(422);
      const responseGetAfter = await request.get(`${baseUrl}/articles`).set(headers);

      expect(responseGetAfter.status).to.equal(200);
      const articleIdsAfter = responseGetAfter.body.article_ids;
      expect(articleIdsAfter, JSON.stringify(responseGetAfter.body)).to.eql(expectedBookmarkedArticles);
    });

    describe("e2e", async () => {
      beforeEach(async () => {
        await setupEnv();
        await request.get("/api/restoreDB");
      });

      it(`POST /bookmarks - add a brand new bookmark`, async () => {
        // Arrange:
        const bookmarksBody = {
          article_id: 10,
        };
        const expectedBookmarkedArticles = [10];

        const response = await request.get(`${baseUrl}/articles`).set(headers);

        expect(response.status, `GET /articles: ${JSON.stringify(response.body)}`).to.equal(200);

        // Act:
        const responsePost = await request.post(`${baseUrl}/articles`).set(headers).send(bookmarksBody);

        // Assert:
        expect(responsePost.status).to.equal(201);
        const responseGetAfter = await request.get(`${baseUrl}/articles`).set(headers);

        expect(
          responseGetAfter.status,
          `GET /articles after creation: ${JSON.stringify(responseGetAfter.body)}`
        ).to.equal(200);
        const articleIdsAfter = responseGetAfter.body.article_ids;
        expect(articleIdsAfter, JSON.stringify(responseGetAfter.body)).to.eql(expectedBookmarkedArticles);
      });

      it(`POST /bookmarks - add article to bookmarks`, async () => {
        // Arrange:
        const bookmarksBody1 = {
          article_id: 10,
        };
        const bookmarksBody2 = {
          article_id: 11,
        };
        const expectedBookmarkedArticles = [10, 11];

        const response = await request.get(`${baseUrl}/articles`).set(headers);

        expect(response.status).to.equal(200);

        // Act:
        const responsePost1 = await request.post(`${baseUrl}/articles`).set(headers).send(bookmarksBody1);
        expect(responsePost1.status, JSON.stringify(responsePost1.body)).to.equal(201);

        await sleep(200);

        const responsePost2 = await request.post(`${baseUrl}/articles`).set(headers).send(bookmarksBody2);
        expect(responsePost2.status, JSON.stringify(responsePost2.body)).to.equal(200);

        await sleep(200);

        // Assert:
        const responseGetAfter = await request.get(`${baseUrl}/articles`).set(headers);

        expect(responseGetAfter.status).to.equal(200);
        const articleIdsAfter = responseGetAfter.body.article_ids;
        expect(articleIdsAfter, JSON.stringify(responseGetAfter.body)).to.eql(expectedBookmarkedArticles);
      });
    });
  });
});
