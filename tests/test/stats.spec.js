const request = require("supertest");
const { serverApp } = require("../../server.js");
let expect = require("chai").expect;

describe("Endpoint /stats", () => {
  const baseUrl = "/api/stats";

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

  describe("Without auth", async () => {
    describe("/users", async () => {
      it("GET /users", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/users`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.userIdToName).to.not.be.undefined;
        expect(response.body.articlesDataForChart).to.not.be.undefined;
        expect(response.body.commentsDataForChart).to.not.be.undefined;
      });

      it("GET /users chartType=table", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/users?chartType=table`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.userIdToName).to.not.be.undefined;
        expect(response.body.articlesPerUser).to.not.be.undefined;
        expect(response.body.commentsPerUser).to.not.be.undefined;
      });

      it("GET /users chartType=pie", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/users?chartType=pie`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
        expect(response.body.commentsDataForChart).to.not.be.undefined;
        expect(response.body.userIdToName).to.not.be.undefined;
      });

      it("GET /users chartType=chart", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/users?chartType=chart`);

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
        const response = await request(serverApp).get(`${baseUrl}/articles`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
      });

      it("GET /articles chartType=table", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/articles?chartType=table`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articleIdToTitle).to.not.be.undefined;
        expect(response.body.commentsPerArticle).to.not.be.undefined;
      });

      it("GET /articles chartType=pie", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/articles?chartType=pie`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
      });

      it("GET /articles chartType=chart", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/articles?chartType=chart`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.articlesDataForChart).to.not.be.undefined;
      });
    });
    describe("/publish/articles", () => {
      it("GET /publish/articles", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/publish/articles`);

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
        const response = await request(serverApp).get(`${baseUrl}/publish/comments`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.yearly).to.not.be.undefined;
        expect(response.body.monthly).to.not.be.undefined;
        expect(response.body.daily).to.not.be.undefined;
      });
    });
  });

  // describe("With auth", () => {
  //   let headers;
  //   before(async () => {
  //     const email = "Danial.Dicki@dicki.test";
  //     const password = "test2";
  //     const response = await request(serverApp).post("/api/login").send({
  //       email,
  //       password,
  //     });
  //     expect(response.status).to.equal(200);

  //     const token = response.body.access_token;
  //     headers = {
  //       Accept: "application/json",
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${token}`,
  //     };
  //   });
  // });
});
