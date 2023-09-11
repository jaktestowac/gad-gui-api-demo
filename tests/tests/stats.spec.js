const request = require("supertest");
const { serverApp } = require("../../server.js");

describe("Endpoint /stats", () => {
  const baseUrl = "/api/stats";

  beforeAll(async () => {
    // Lover log level to WARNING:
    const requestBody = {
      currentLogLevel: 2,
    };
    const response = await request(serverApp).post("/api/config").send(requestBody);
    expect(response.status).toEqual(200);
  });

  afterAll(() => {
    try {
      request(serverApp).get("/api/restoreDB").expect(200);
    } catch (error) {
      console.log(error);
    }

    serverApp.close();
  });

  describe("Without auth", () => {
    describe("/users", () => {
      test("GET /users", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/users`);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.userIdToName).not.toBeUndefined();
        expect(response.body.articlesDataForChart).not.toBeUndefined();
        expect(response.body.commentsDataForChart).not.toBeUndefined();
      });
      test("GET /users chartType=table", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/users?chartType=table`);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.userIdToName).not.toBeUndefined();
        expect(response.body.articlesPerUser).not.toBeUndefined();
        expect(response.body.commentsPerUser).not.toBeUndefined();
      });
      test("GET /users chartType=pie", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/users?chartType=pie`);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.articlesDataForChart).not.toBeUndefined();
        expect(response.body.commentsDataForChart).not.toBeUndefined();
        expect(response.body.userIdToName).not.toBeUndefined();
      });
      test("GET /users chartType=chart", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/users?chartType=chart`);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.articlesDataForChart).not.toBeUndefined();
        expect(response.body.commentsDataForChart).not.toBeUndefined();
        expect(response.body.userIdToName).not.toBeUndefined();
      });
    });
    describe("/articles", () => {
      test("GET /articles", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/articles`);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.articlesDataForChart).not.toBeUndefined();
      });
      test("GET /articles chartType=table", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/articles?chartType=table`);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.articleIdToTitle).not.toBeUndefined();
        expect(response.body.commentsPerArticle).not.toBeUndefined();
      });
      test("GET /articles chartType=pie", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/articles?chartType=pie`);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.articlesDataForChart).not.toBeUndefined();
      });
      test("GET /articles chartType=chart", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/articles?chartType=chart`);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.articlesDataForChart).not.toBeUndefined();
      });
    });
    describe("/publish/articles", () => {
      test("GET /publish/articles", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/publish/articles`);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.yearly).not.toBeUndefined();
        expect(response.body.monthly).not.toBeUndefined();
        expect(response.body.daily).not.toBeUndefined();
      });
    });
    describe("/publish/comments", () => {
      test("GET /publish/comments", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/publish/comments`);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.yearly).not.toBeUndefined();
        expect(response.body.monthly).not.toBeUndefined();
        expect(response.body.daily).not.toBeUndefined();
      });
    });
  });

  // describe("With auth", () => {
  //   let headers;
  //   beforeAll(async () => {
  //     const email = "Danial.Dicki@dicki.test";
  //     const password = "test2";
  //     const response = await request(serverApp).post("/api/login").send({
  //       email,
  //       password,
  //     });
  //     expect(response.status).toEqual(200);

  //     const token = response.body.access_token;
  //     headers = {
  //       Accept: "application/json",
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${token}`,
  //     };
  //   });
  // });
});
