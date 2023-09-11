const request = require("supertest");
const { serverApp } = require("../server.js");

describe("Server", () => {
  afterAll(() => {
    try {
      request(serverApp).get("/api/restoreDB").expect(200);
    } catch (error) {
      console.log(error);
    }

    serverApp.close();
  });
  describe("Endpoints", () => {
    describe("No auth", () => {
      describe("GET /:resources", () => {
        test("users", async () => {
          // Act:
          const response = await request(serverApp).get("/api/users");

          // Assert:
          expect(response.status).toEqual(200);
          expect(response.body.length).toBeGreaterThan(1);
        });
        test("comments", async () => {
          // Act:
          const response = await request(serverApp).get("/api/comments");

          // Assert:
          expect(response.status).toEqual(200);
          expect(response.body.length).toBeGreaterThan(1);
        });
        test("articles", async () => {
          // Act:
          const response = await request(serverApp).get("/api/articles");

          // Assert:
          expect(response.status).toEqual(200);
          expect(response.body.length).toBeGreaterThan(1);
        });
      });
      describe("GET /:resources/:id", () => {
        test("users/:id", async () => {
          // Arrange:
          const expectedData = {
            avatar: ".\\data\\users\\face_1591133479.7144732.jpg",
            email: "****",
            firstname: "Moses",
            id: 1,
            lastname: "****",
            password: "****",
          };

          // Act:
          const response = await request(serverApp).get("/api/users/1");

          // Assert:
          expect(response.status).toEqual(200);
          expect(response.body).toEqual(expectedData);
        });
        test("comments/:id", async () => {
          // Arrange:
          const expectedData = {
            id: 1,
            article_id: 1,
            user_id: 3,
            body: "I loved your insights on usability testing. It's crucial to ensure that the software meets the needs of the end users. Have you encountered any interesting user feedback during usability testing that led to significant improvements in the product?",
            date: "2021-11-30T14:44:22Z",
          };

          // Act:
          const response = await request(serverApp).get("/api/comments/1");

          // Assert:
          expect(response.status).toEqual(200);
          expect(response.body).toEqual(expectedData);
        });
        test("articles/:id", async () => {
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
      });
      describe("POST /:resources", () => {
        test("users", () => {
          return request(serverApp).post("/api/users").send({}).expect(422);
        });
        test("comments", () => {
          return request(serverApp).post("/api/comments").send({}).expect(401);
        });
        test("articles", () => {
          return request(serverApp).post("/api/articles").send({}).expect(401);
        });
      });
      describe("PUT /:resources", () => {
        test("users", () => {
          return request(serverApp).put("/api/users").send({}).expect(401);
        });
        test("comments", () => {
          return request(serverApp).put("/api/comments").send({}).expect(401);
        });
        test("articles", () => {
          return request(serverApp).put("/api/articles").send({}).expect(401);
        });
        test("users/:id", () => {
          return request(serverApp).put("/api/users/1").send({}).expect(401);
        });
        test("comments/:id", () => {
          return request(serverApp).put("/api/comments/1").send({}).expect(401);
        });
        test("articles/:id", () => {
          return request(serverApp).put("/api/articles/1").send({}).expect(401);
        });
      });
      describe("PATCH /:resources", () => {
        test("users/:id", () => {
          return request(serverApp).patch("/api/users/1").send({}).expect(401);
        });
        test("comments/:id", () => {
          return request(serverApp).patch("/api/comments/1").send({}).expect(401);
        });
        test("articles/:id", () => {
          return request(serverApp).patch("/api/articles/1").send({}).expect(401);
        });
      });
      describe("HEAD /:resources/:id", () => {
        test("users", () => {
          return request(serverApp).head("/api/users/1").expect(200);
        });
        test("comments", () => {
          return request(serverApp).head("/api/comments/1").expect(200);
        });
        test("articles", () => {
          return request(serverApp).head("/api/articles/1").expect(200);
        });
      });
    });
  });
  describe("Quiz", () => {
    const baseUrl = "/api/quiz";
    describe("Quiz - No auth", () => {
      test("start", () => {
        return request(serverApp).get(`${baseUrl}/start`).expect(401);
      });
      test("stop", () => {
        return request(serverApp).get(`${baseUrl}/stop`).expect(401);
      });
      test("highscores", () => {
        return request(serverApp).get(`${baseUrl}/highscores`).expect(200);
      });
      test("questions", () => {
        return request(serverApp).get(`${baseUrl}/questions`).expect(401);
      });
      test("questions/count", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/questions/count`);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.count).toBeGreaterThan(1);
      });
      test("questions/check", () => {
        return request(serverApp).post(`${baseUrl}/questions/check`).send({}).expect(401);
      });
    });
    describe("Quiz - Auth", () => {
      let headers;
      beforeAll(async () => {
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
      test("start", () => {
        return request(serverApp).get(`${baseUrl}/start`).set(headers).expect(200);
      });
      test("stop", () => {
        return request(serverApp).get(`${baseUrl}/stop`).set(headers).expect(200);
      });
      test("highscores", () => {
        return request(serverApp).get(`${baseUrl}/highscores`).set(headers).expect(200);
      });
      test("questions", () => {
        return request(serverApp).get(`${baseUrl}/questions`).set(headers).expect(200);
      });
      test("start", () => {
        return request(serverApp).get(`${baseUrl}/stop`).set(headers).expect(200);
      });
      test("questions/count", async () => {
        // Act:
        const response = await request(serverApp).get(`${baseUrl}/questions/count`).set(headers);

        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body.count).toBeGreaterThan(1);
      });
      test("questions/check - incorrect", async () => {
        // Arrange:
        const requestBody = {
          questionText: "string",
          selectedAnswers: ["string"],
        };
        const expectedBody = {
          isCorrect: false,
          score: 0,
        };

        // Act:
        const response = await request(serverApp)
          .post(`${baseUrl}/questions/check`)
          .send(requestBody)
          .set(headers)
          .expect(200);
        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(expectedBody);
      });
      test("questions/check - correct", async () => {
        // Arrange:
        const requestBody = {
          questionText: "What does HTML stand for?",
          selectedAnswers: ["Hyper Text Markup Language"],
        };
        const expectedBody = {
          isCorrect: true,
          score: 1,
        };

        // Act:
        const response = await request(serverApp)
          .post(`${baseUrl}/questions/check`)
          .send(requestBody)
          .set(headers)
          .expect(200);
        // Assert:
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(expectedBody);
      });
    });
  });
});
