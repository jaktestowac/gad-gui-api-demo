const request = require("supertest");
const { serverApp } = require("../../server.js");

describe("Endpoint /articles", () => {
  const baseUrl = "/api/articles";

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
    describe("GET /:resources", () => {
      test("GET /articles", async () => {
        // Act:
        const response = await request(serverApp).get("/api/articles");

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.length).toBeGreaterThan(1);
      });
      test("GET /articles/:id", async () => {
        // Arrange:
        const expectedData = {
          id: 1,
          title: "How to write effective test cases",
          body: "Test cases are the backbone of any testing process. They define what to test, how to test, and what to expect. Writing effective test cases can save time, effort, and resources. Here are some tips for writing effective test cases:\n- Use clear and concise language\n- Follow a consistent format and structure\n- Include preconditions, steps, expected results, and postconditions\n- Cover positive, negative, and boundary scenarios\n- Prioritize test cases based on risk and importance\n- Review and update test cases regularly",
          user_id: 1,
          date: "2021-07-13T16:35:00Z",
          image: ".\\data\\images\\256\\chuttersnap-9cCeS9Sg6nU-unsplash.jpg",
        };

        // Act:
        const response = await request(serverApp).get("/api/articles/1");

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(expectedData);
      });

      test("POST /articles", () => {
        return request(serverApp).post(baseUrl).send({}).expect(401);
      });
      test("PUT /articles", () => {
        return request(serverApp).put(baseUrl).send({}).expect(401);
      });
      test("PUT /articles/:id", () => {
        return request(serverApp).put(`${baseUrl}/1`).send({}).expect(401);
      });
      test("PATCH /articles/:id", () => {
        return request(serverApp).patch(`${baseUrl}/1`).send({}).expect(401);
      });
      test("DELETE /articles/:id", () => {
        return request(serverApp).delete(`${baseUrl}/1`).send({}).expect(401);
      });
      test("HEAD /articles", () => {
        return request(serverApp).head(`${baseUrl}/1`).expect(200);
      });
    });
    describe("With auth", () => {
      let headers;
      beforeEach(async () => {
        const email = "Danial.Dicki@dicki.test";
        const password = "test2";
        const response = await request(serverApp).post("/api/login").send({
          email,
          password,
        });
        expect(response.status).toEqual(200);

        const token = response.body.access_token;
        headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
      });
      test("GET /articles", async () => {
        // Act:
        const response = await request(serverApp).get(baseUrl).set(headers);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.length).toBeGreaterThan(1);
      });
      test("GET /articles/:id", async () => {
        // Arrange:
        const expectedData = {
          id: 1,
          title: "How to write effective test cases",
          body: "Test cases are the backbone of any testing process. They define what to test, how to test, and what to expect. Writing effective test cases can save time, effort, and resources. Here are some tips for writing effective test cases:\n- Use clear and concise language\n- Follow a consistent format and structure\n- Include preconditions, steps, expected results, and postconditions\n- Cover positive, negative, and boundary scenarios\n- Prioritize test cases based on risk and importance\n- Review and update test cases regularly",
          user_id: 1,
          date: "2021-07-13T16:35:00Z",
          image: ".\\data\\images\\256\\chuttersnap-9cCeS9Sg6nU-unsplash.jpg",
        };

        // Act:
        const response = await request(serverApp).get(`${baseUrl}/1`).set(headers);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(expectedData);
      });
      test("HEAD /articles", () => {
        return request(serverApp).head(`${baseUrl}/1`).set(headers).expect(200);
      });
    });
  });
});
