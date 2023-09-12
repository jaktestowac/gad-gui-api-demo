const { request, expect, baseArticlesUrl } = require("./config.js");
const { setupEnv, gracefulQuit } = require("./helpers/helpers.js");

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
        const expectedData = {
          id: 1,
          title: "How to write effective test cases",
          body: "Test cases are the backbone of any testing process. They define what to test, how to test, and what to expect. Writing effective test cases can save time, effort, and resources. Here are some tips for writing effective test cases:\n- Use clear and concise language\n- Follow a consistent format and structure\n- Include preconditions, steps, expected results, and postconditions\n- Cover positive, negative, and boundary scenarios\n- Prioritize test cases based on risk and importance\n- Review and update test cases regularly",
          user_id: 1,
          date: "2021-07-13T16:35:00Z",
          image: ".\\data\\images\\256\\chuttersnap-9cCeS9Sg6nU-unsplash.jpg",
        };

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

      it("PUT /articles", () => {
        return request.put(baseUrl).send({}).expect(401);
      });

      it("PUT /articles/:id", () => {
        return request.put(`${baseUrl}/1`).send({}).expect(401);
      });

      it("PATCH /articles/:id", () => {
        return request.patch(`${baseUrl}/1`).send({}).expect(401);
      });

      it("DELETE /articles/:id", () => {
        return request.delete(`${baseUrl}/1`).send({}).expect(401);
      });

      it("HEAD /articles", () => {
        return request.head(`${baseUrl}/1`).expect(200);
      });
    });

    describe("MODIFY /articles", async () => {
      // TODO:
    });

    describe("With auth", () => {
      let headers;
      beforeEach(async () => {
        const email = "Danial.Dicki@dicki.test";
        const password = "test2";
        const response = await request.post("/api/login").send({
          email,
          password,
        });
        expect(response.status).to.equal(200);

        const token = response.body.access_token;
        headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
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
        const expectedData = {
          id: 1,
          title: "How to write effective test cases",
          body: "Test cases are the backbone of any testing process. They define what to test, how to test, and what to expect. Writing effective test cases can save time, effort, and resources. Here are some tips for writing effective test cases:\n- Use clear and concise language\n- Follow a consistent format and structure\n- Include preconditions, steps, expected results, and postconditions\n- Cover positive, negative, and boundary scenarios\n- Prioritize test cases based on risk and importance\n- Review and update test cases regularly",
          user_id: 1,
          date: "2021-07-13T16:35:00Z",
          image: ".\\data\\images\\256\\chuttersnap-9cCeS9Sg6nU-unsplash.jpg",
        };

        // Act:
        const response = await request.get(`${baseUrl}/1`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal(expectedData);
      });

      it("HEAD /articles", () => {
        return request.head(`${baseUrl}/1`).set(headers).expect(200);
      });
    });
  });
});
