const request = require("supertest");
const { serverApp } = require("../../server.js");
const { faker } = require("@faker-js/faker");
const { sleep } = require("./helpers.js");
let expect = require("chai").expect;

describe("Endpoint /users", async () => {
  const baseUrl = "/api/users";

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

  describe("Without auth", () => {
    it("GET /users", async () => {
      // Act:
      const response = await request(serverApp).get(baseUrl);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /users/:id - existing user", async () => {
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
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedData);
    });

    it("GET /users/:id - non existing user", async () => {
      // Act:
      const response = await request(serverApp).get(`${baseUrl}/112312312`);

      // Assert:
      expect(response.status).to.equal(404);
    });

    describe("POST /users", () => {
      it("empty payload", () => {
        return request(serverApp).post(baseUrl).send({}).expect(422);
      });

      it("valid registration", async () => {
        // Arrange:
        const testUserData = {
          email: faker.internet.email({ provider: "example.test.test" }),
          firstname: "string",
          lastname: "string",
          password: "string",
          avatar: "string",
        };

        // Act:
        const response = await request(serverApp).post(baseUrl).send(testUserData);

        // Assert:
        expect(response.status).to.equal(201);
        testUserData.id = response.body.id;
        expect(response.body).to.deep.equal(testUserData);
      });

      it("invalid registration - same email", async () => {
        // Arrange:
        const testUserData = {
          email: faker.internet.email({ provider: "example.test.test" }),
          firstname: "string",
          lastname: "string",
          password: "string",
          avatar: "string",
        };
        const response = await request(serverApp).post(baseUrl).send(testUserData);
        expect(response.status).to.equal(201);

        // Act:
        const responseAgain = await request(serverApp).post(baseUrl).send(testUserData);

        // Assert:
        expect(responseAgain.status).to.equal(201);
      });
      it("invalid email", async () => {
        // Arrange:
        const testUserData = {
          email: "example.test.test",
          firstname: "string",
          lastname: "string",
          password: "string",
          avatar: "string",
        };

        // Act:
        const response = await request(serverApp).post(baseUrl).send(testUserData);

        // Assert:
        expect(response.status).to.equal(422);
      });

      ["firstname", "lastname", "email", "avatar"].forEach((field) => {
        it(`missing mandatory field - ${field}`, async () => {
          // Arrange:
          const testUserData = {
            email: faker.internet.email({ provider: "example.test.test" }),
            firstname: "string",
            lastname: "string",
            password: "string",
            avatar: "string",
          };

          testUserData[field] = undefined;

          // Act:
          const response = await request(serverApp).post(baseUrl).send(testUserData);

          // Assert:
          expect(response.status).to.equal(422);
        });
      });
    });

    it("PUT /users", () => {
      return request(serverApp).put(baseUrl).send({}).expect(401);
    });

    it("PUT /users/:id", () => {
      return request(serverApp).put(`${baseUrl}/1`).send({}).expect(401);
    });

    it("PATCH /users/:id", () => {
      return request(serverApp).patch(`${baseUrl}/1`).send({}).expect(401);
    });

    it("DELETE /users/:id", () => {
      return request(serverApp).delete(`${baseUrl}/1`).send({}).expect(401);
    });

    it("HEAD /users", () => {
      return request(serverApp).head(`${baseUrl}/1`).expect(200);
    });
  });

  describe("With auth", async () => {
    let headers;

    beforeEach(async () => {
      const restoreResponse = await request(serverApp).get("/api/restoreDB");
      expect(restoreResponse.status).to.equal(201);

      const email = "Danial.Dicki@dicki.test";
      const password = "test2";
      const response = await request(serverApp).post("/api/login").send({
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

    it("GET /users", async () => {
      // Act:
      const response = await request(serverApp).get(baseUrl).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /users/:id", async () => {
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
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedData);
    });

    it("POST /users", async () => {
      // Arrange:
      const testUserData = {
        email: faker.internet.email({ provider: "example.test.test" }),
        firstname: "string",
        lastname: "string",
        password: "string",
        avatar: "string",
      };

      // Act:
      const response = await request(serverApp).post(baseUrl).send(testUserData).set(headers);

      // Assert:
      expect(response.status).to.equal(201);
      testUserData.id = response.body.id;
      expect(response.body).to.deep.equal(testUserData);
    });

    it("HEAD /users", () => {
      return request(serverApp).head(`${baseUrl}/1`).set(headers).expect(200);
    });
  });

  describe("UPDATE /users", async () => {
    let headers;
    let userId;
    let testUserData;

    beforeEach(async () => {
      const restoreResponse = await request(serverApp).get("/api/restoreDB");
      expect(restoreResponse.status).to.equal(201);

      // Arrange:
      testUserData = {
        email: faker.internet.email({ provider: "example.test.test" }),
        firstname: "string",
        lastname: "string",
        password: "string",
        avatar: "string",
      };
      const response = await request(serverApp).post(baseUrl).send(testUserData);
      expect(response.status).to.equal(201);
      userId = response.body.id;

      await sleep(100); // wait for user registration // server is slow

      const responseLogin = await request(serverApp).post("/api/login").send({
        email: testUserData.email,
        password: testUserData.password,
      });

      expect(responseLogin.status, JSON.stringify(responseLogin.body)).to.equal(200);

      const token = responseLogin.body.access_token;
      headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
    });

    it("PUT /users", async () => {
      // Act:
      const response = await request(serverApp).put(`${baseUrl}/${userId}`).set(headers).send(testUserData);

      // Assert:
      expect(response.status).to.equal(200);
    });

    it("PUT /users/:id", async () => {
      // Act:
      const response = await request(serverApp).put(`${baseUrl}/${userId}`).set(headers).send(testUserData);

      // Assert:
      expect(response.status).to.equal(200);
    });

    it("PATCH /users/:id", async () => {
      // Act:
      const response = await request(serverApp).patch(`${baseUrl}/${userId}`).set(headers).send(testUserData);

      // Assert:
      expect(response.status).to.equal(200);
    });
  });
  describe("DELETE /users", () => {
    let headers;
    let userId;

    beforeEach(async () => {
      const restoreResponse = await request(serverApp).get("/api/restoreDB");
      expect(restoreResponse.status).to.equal(201);

      // Arrange:
      const testUserData = {
        email: faker.internet.email({ provider: "example.test.test" }),
        firstname: "string",
        lastname: "string",
        password: "string",
        avatar: "string",
      };
      const response = await request(serverApp).post(baseUrl).send(testUserData);
      expect(response.status).to.equal(201);
      userId = response.body.id;

      const responseLogin = await request(serverApp).post("/api/login").send({
        email: testUserData.email,
        password: testUserData.password,
      });
      expect(responseLogin.status, JSON.stringify(responseLogin.body)).to.equal(200);

      const token = responseLogin.body.access_token;
      headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
    });

    it("DELETE /users/:id - self delete", async () => {
      // Act:
      const responseDel = await request(serverApp).delete(`${baseUrl}/${userId}`).set(headers);

      // Assert:
      expect(responseDel.status).to.equal(200);
    });

    it("DELETE /users/:id - attempt of delete of other user", async () => {
      // Act:
      const responseDel = await request(serverApp).delete(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(responseDel.status).to.equal(401);
    });

    it("DELETE /users/:id - attempt of delete of not existing user", async () => {
      // Act:
      const responseDel = await request(serverApp).delete(`${baseUrl}/112323212`).set(headers);

      // Assert:
      expect(responseDel.status).to.equal(401);
    });
  });
});
