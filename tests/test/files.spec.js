const { request, expect, baseFilesArticlesUrl } = require("../config.js");
const { authUser, generateValidArticleData } = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit } = require("../helpers/helpers.js");

describe("Endpoint /files", async () => {
  const baseUrl = baseFilesArticlesUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", async () => {
    it("POST /files/articles/upload", () => {
      return request.post(`${baseUrl}/upload`).send({}).expect(401);
    });

    it("GET /files/articles/upload", async () => {
      // Act:
      const response = await request.get(baseUrl + "/download/uploaded.json");

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("GET /files/articles/upload", async () => {
      // Act:
      const response = await request.get(baseUrl + "/download/uploaded-article_1_0_P_.json");

      // Assert:
      expect(response.status).to.equal(200);
    });

    it("GET /files/articles/upload", async () => {
      // Act:
      const response = await request.get(baseUrl + "/download/uploaded-article_1_0_R_.json");

      // Assert:
      expect(response.status).to.equal(404);
    });

    it("GET /uploaded/public", async () => {
      const url = baseUrl + "/uploaded/public";

      // Act:
      const response = await request.get(url);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(0);

      const privateFiles = response.body.find((file) => file.name.includes("_R_")) || [];
      expect(privateFiles.length, `Found: ${JSON.stringify(privateFiles.body)}`).to.be.equal(0);
    });

    it("GET /uploaded/public?userIds=1", async () => {
      const url = baseUrl + "/uploaded/public?userIds=1";

      // Act:
      const response = await request.get(url);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(0);

      const privateFiles = response.body.find((file) => file.name.includes("_R_")) || [];
      expect(privateFiles.length, `Found: ${JSON.stringify(privateFiles.body)}`).to.be.equal(0);
    });

    it("GET /uploaded/public?userIds=1,2", async () => {
      const url = baseUrl + "/uploaded/public?userIds=1,2";

      // Act:
      const response = await request.get(url);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(0);

      const privateFiles = response.body.find((file) => file.name.includes("_R_")) || [];
      expect(privateFiles.length, `Found: ${JSON.stringify(privateFiles.body)}`).to.be.equal(0);
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

    it("GET /files/articles/uploaded", async () => {
      const newHeaders = { ...headers };
      newHeaders["userid"] = userId;

      // Act:
      const response = await request.get(`${baseUrl}/uploaded`).set(newHeaders);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length, `Found: ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    });

    it.skip("POST /files/articles/upload", async () => {
      // Arrange:
      const testData = generateValidArticleData(10, 50);
      const newHeaders = { ...headers };
      newHeaders["userid"] = userId;

      // Act:
      //TODO: fix timeout
      const response = await request.post(`${baseUrl}/upload`).set(newHeaders).send(testData);

      // Assert:
      expect(response.status).to.equal(201);
    }).timeout(4000);
  });
});
