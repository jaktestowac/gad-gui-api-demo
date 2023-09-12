const request = require("supertest");
const { serverApp } = require("../../server.js");

describe("Endpoint /users", () => {
  const baseUrl = "/api/users";

  beforeAll(async () => {
    try {
      request(serverApp).get("/api/restoreDB").expect(201);
    } catch (error) {
      console.log(error);
    }

    // Lover log level to WARNING:
    const requestBody = {
      currentLogLevel: 2,
    };
    const response = await request(serverApp).post("/api/config").send(requestBody);
    expect(response.status).toEqual(200);
  });

  afterAll(() => {
    serverApp.close();
  });

  describe("Without auth", () => {
    test("GET /users", async () => {
      // Act:
      const response = await request(serverApp).get(baseUrl);

      // Assert:
      expect(response.status).toEqual(200);
      expect(response.body.length).toBeGreaterThan(1);
    });

    test("GET /users/:id - existing user", async () => {
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
      const response = await request(serverApp).get(`${baseUrl}/1`);

      // Assert:
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(expectedData);
    });

    test("GET /users/:id - non existing user", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/112312312`);

      // Assert:
      expect(response.status).toEqual(404);
    });

    describe("POST /users", () => {
      test("empty payload", () => {
        return request(serverApp).post(baseUrl).send({}).expect(422);
      });

      test("valid registration", async () => {
        // Arrange:
        const testUserData = {
          email: "user@example.com",
          firstname: "string",
          lastname: "string",
          password: "string",
          avatar: "string",
        };

        // Act:
        const response = await request(serverApp).post(baseUrl).send(testUserData);

        // Assert:
        expect(response.status).toEqual(201);
        testUserData.id = response.body.id;
        expect(response.body).toEqual(testUserData);
      });

      test("invalid email", async () => {
        // Arrange:
        const testUserData = {
          email: "userexample.com",
          firstname: "string",
          lastname: "string",
          password: "string",
          avatar: "string",
        };

        // Act:
        const response = await request(serverApp).post(baseUrl).send(testUserData);

        // Assert:
        expect(response.status).toEqual(422);
      });

      ["firstname", "lastname", "email", "avatar"].forEach((field) => {
        test(`missing mandatory field - ${field}`, async () => {
          // Arrange:
          const testUserData = {
            email: "userexample.com",
            firstname: "string",
            lastname: "string",
            password: "string",
            avatar: "string",
          };

          testUserData[field] = undefined;

          // Act:
          const response = await request(serverApp).post(baseUrl).send(testUserData);

          // Assert:
          expect(response.status).toEqual(422);
        });
      });
    });

    test("PUT /users", () => {
      return request(serverApp).put(baseUrl).send({}).expect(401);
    });

    test("PUT /users/:id", () => {
      return request(serverApp).put(`${baseUrl}/1`).send({}).expect(401);
    });

    test("PATCH /users/:id", () => {
      return request(serverApp).patch(`${baseUrl}/1`).send({}).expect(401);
    });

    test("DELETE /users/:id", () => {
      return request(serverApp).delete(`${baseUrl}/1`).send({}).expect(401);
    });

    test("HEAD /users", () => {
      return request(serverApp).head(`${baseUrl}/1`).expect(200);
    });
  });

  describe("With auth", () => {
    let headers;

    beforeEach(async () => {
      try {
        request(serverApp).get("/api/restoreDB").expect(201);
      } catch (error) {
        console.log(error);
      }

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

    test("GET /users", async () => {
      // Act:
      const response = await request(serverApp).get(baseUrl).set(headers);

      // Assert:
      expect(response.status).toEqual(200);
      expect(response.body.length).toBeGreaterThan(1);
    });

    test("GET /users/:id", async () => {
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
      const response = await request(serverApp).get(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(expectedData);
    });

    test("POST /users", async () => {
      // Arrange:
      const testUserData = {
        email: "user@example.com",
        firstname: "string",
        lastname: "string",
        password: "string",
        avatar: "string",
      };

      // Act:
      const response = await request(serverApp).post(baseUrl).send(testUserData).set(headers);

      // Assert:
      expect(response.status).toEqual(201);
      testUserData.id = response.body.id;
      expect(response.body).toEqual(testUserData);
    });

    test("PUT /users", () => {
      // TODO:
      return request(serverApp).put(baseUrl).send({}).expect(401);
    });

    test("PUT /users/:id", () => {
      // TODO:
      return request(serverApp).put(`${baseUrl}/1`).send({}).expect(401);
    });

    test("PATCH /users/:id", () => {
      // TODO:
      return request(serverApp).patch(`${baseUrl}/1`).send({}).expect(401);
    });

    describe("DELETE /users", () => {
      let headers;
      let userId;

      beforeEach(async () => {
        try {
          request(serverApp).get("/api/restoreDB").expect(201);
        } catch (error) {
          console.log(error);
        }

        // Arrange:
        const testUserData = {
          email: "user@example.com",
          firstname: "string",
          lastname: "string",
          password: "string",
          avatar: "string",
        };
        const response = await request(serverApp).post(baseUrl).send(testUserData);
        expect(response.status).toEqual(201);
        userId = response.body.id;

        const responseLogin = await request(serverApp).post("/api/login").send({
          email: testUserData.email,
          password: testUserData.password,
        });
        expect(responseLogin.status).toEqual(200);

        const token = responseLogin.body.access_token;
        headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
      });

      test("DELETE /users/:id - self delete", async () => {
        // Act:
        const responseDel = await request(serverApp).delete(`${baseUrl}/${userId}`).set(headers);

        // Assert:
        expect(responseDel.status).toEqual(200);
      });

      test("DELETE /users/:id - attempt of delete of other user", async () => {
        // Act:
        const responseDel = await request(serverApp).delete(`${baseUrl}/1`).set(headers);

        // Assert:
        expect(responseDel.status).toEqual(401);
      });

      test("DELETE /users/:id - attempt of delete of not existing user", async () => {
        // Act:
        const responseDel = await request(serverApp).delete(`${baseUrl}/112323212`).set(headers);

        // Assert:
        expect(responseDel.status).toEqual(401);
      });
    });

    test("HEAD /users", () => {
      return request(serverApp).head(`${baseUrl}/1`).set(headers).expect(200);
    });
  });
});
