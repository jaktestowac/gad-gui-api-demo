const { expect, request, baseStatsUrl } = require("../config");
const { authUser } = require("../helpers/data.helpers");
const { gracefulQuit, setupEnv } = require("../helpers/helpers");

describe("Endpoint /stats", () => {
  const baseUrl = baseStatsUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", async () => {
    describe("/users", async () => {
      it("GET /users", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/users`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.userIdToName).to.not.be.undefined;
        expect(response.body.articlesDataForChart).to.not.be.undefined;
        expect(response.body.commentsDataForChart).to.not.be.undefined;
      });

      it("GET /users chartType=table", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/users?chartType=table`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.userIdToName).to.not.be.undefined;
        expect(response.body.articlesPerUser).to.not.be.undefined;
        expect(response.body.commentsPerUser).to.not.be.undefined;
      });

      it("GET /users chartType=pie", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/users?chartType=pie`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
        expect(response.body.commentsDataForChart).to.not.be.undefined;
        expect(response.body.userIdToName).to.not.be.undefined;
      });

      it("GET /users chartType=chart", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/users?chartType=chart`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
        expect(response.body.commentsDataForChart).to.not.be.undefined;
        expect(response.body.userIdToName).to.not.be.undefined;
      });
    });
    describe("/articles", () => {
      it("GET /articles", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/articles`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
      });

      it("GET /articles chartType=table", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/articles?chartType=table`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articleIdToTitle).to.not.be.undefined;
        expect(response.body.commentsPerArticle).to.not.be.undefined;
      });

      it("GET /articles chartType=pie", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/articles?chartType=pie`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
      });

      it("GET /articles chartType=chart", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/articles?chartType=chart`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
      });
    });
    describe("/publish/articles", () => {
      it("GET /publish/articles", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/publish/articles`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.yearly).to.not.be.undefined;
        expect(response.body.monthly).to.not.be.undefined;
        expect(response.body.daily).to.not.be.undefined;
      });
    });
    describe("/publish/comments", () => {
      it("GET /publish/comments", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/publish/comments`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.yearly).to.not.be.undefined;
        expect(response.body.monthly).to.not.be.undefined;
        expect(response.body.daily).to.not.be.undefined;
      });
    });
    it("GET /api calls", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/api`);

      // Assert:
      expect(response.status).to.equal(200);
    });
  });

  describe("With auth", () => {
    let headers;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
    });

    describe("/users", async () => {
      it("GET /users", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/users`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.userIdToName).to.not.be.undefined;
        expect(response.body.articlesDataForChart).to.not.be.undefined;
        expect(response.body.commentsDataForChart).to.not.be.undefined;
      });

      it("GET /users chartType=table", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/users?chartType=table`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.userIdToName).to.not.be.undefined;
        expect(response.body.articlesPerUser).to.not.be.undefined;
        expect(response.body.commentsPerUser).to.not.be.undefined;
      });

      it("GET /users chartType=pie", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/users?chartType=pie`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
        expect(response.body.commentsDataForChart).to.not.be.undefined;
        expect(response.body.userIdToName).to.not.be.undefined;
      });

      it("GET /users chartType=chart", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/users?chartType=chart`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
        expect(response.body.commentsDataForChart).to.not.be.undefined;
        expect(response.body.userIdToName).to.not.be.undefined;
      });
    });
    describe("/articles", () => {
      it("GET /articles", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/articles`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
      });

      it("GET /articles chartType=table", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/articles?chartType=table`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articleIdToTitle).to.not.be.undefined;
        expect(response.body.commentsPerArticle).to.not.be.undefined;
      });

      it("GET /articles chartType=pie", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/articles?chartType=pie`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
      });

      it("GET /articles chartType=chart", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/articles?chartType=chart`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
      });
    });
    describe("/publish/articles", () => {
      it("GET /publish/articles", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/publish/articles`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.yearly).to.not.be.undefined;
        expect(response.body.monthly).to.not.be.undefined;
        expect(response.body.daily).to.not.be.undefined;
      });
    });
    describe("/publish/comments", () => {
      it("GET /publish/comments", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/publish/comments`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.yearly).to.not.be.undefined;
        expect(response.body.monthly).to.not.be.undefined;
        expect(response.body.daily).to.not.be.undefined;
      });
    });
    it("GET /api calls", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/api`).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
    });
  });
});
