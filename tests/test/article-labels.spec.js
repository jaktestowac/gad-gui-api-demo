const { request, expect, sleepTime, baseArticleLabelsUrl } = require("../config.js");
const { authUser } = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, sleep } = require("../helpers/helpers.js");

describe("Endpoint /article-labels", () => {
  const baseUrl = baseArticleLabelsUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("With auth", () => {
    let headers;
    let userId;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;
      headers["userid"] = userId;
    });

    it("PUT /article-labels - missing labels", async () => {
      // Act:
      const response = await request.put(baseUrl).send({ user_id: userId, article_id: 2 }).set(headers);

      // Assert:
      expect(response.status).to.equal(422);
    });

    it("PUT /article-labels/:id - missing labels", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/11`).set(headers).send({ user_id: userId, article_id: 2 });

      // Assert:
      expect(response.status).to.equal(422);
    });

    it("PUT /article-labels/:id - too many labels", async () => {
      // Act:
      const response = await request
        .put(`${baseUrl}/11`)
        .set(headers)
        .send({ user_id: userId, article_id: 2, label_ids: [1, 2, 3, 4] });

      // Assert:
      expect(response.status).to.equal(422);
    });

    it("PUT /article-labels/:id", async () => {
      // Act:
      const response = await request
        .put(`${baseUrl}/11`)
        .set(headers)
        .send({ user_id: userId, article_id: 2, label_ids: [1] });

      // Assert:
      expect(response.status).to.equal(200);
    });
  });

  describe("Without auth", () => {
    it("GET /article-labels", async () => {
      // Act:
      const response = await request.get(baseUrl);

      // Assert:
      expect(response.status).to.equal(200);
    });

    it("GET /article-labels/articles/", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/articles/`);

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("GET /article-labels/articles/:id", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/articles/1`);

      // Assert:
      expect(response.status).to.equal(200);
    });

    it("POST /article-labels", () => {
      return request.post(baseUrl).send({}).expect(405);
    });

    it("PUT /article-labels", async () => {
      // Act:
      const response = await request.put(baseUrl).send({});

      // Assert:
      expect(response.status).to.equal(401);
    });

    it("PUT /article-labels/:id", () => {
      return request.put(`${baseUrl}/1`).send({}).expect(401);
    });

    it("PATCH /article-labels", () => {
      return request.patch(baseUrl).send({}).expect(405);
    });

    it("PATCH /article-labels/:id", () => {
      return request.patch(`${baseUrl}/1`).send({}).expect(200);
    });

    it("DELETE /article-labels", () => {
      return request.delete(baseUrl).expect(405);
    });

    it("DELETE /article-labels/:id", () => {
      return request.delete(`${baseUrl}/1`).expect(200);
    });

    it("HEAD /article-labels", () => {
      return request.head(`${baseUrl}/2`).expect(200);
    });
  });
});
