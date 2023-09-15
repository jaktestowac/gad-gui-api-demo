const { gracefulQuit, setupEnv } = require("./helpers/helpers.js");
const { baseUsersUrl, request, expect, faker } = require("./config.js");
const {
  prepareUniqueLoggedUser,
  authUser,
  validExistingUser,
  generateValidUserData,
} = require("./helpers/data.helpers.js");

describe("Endpoint /users", async () => {
  const baseUrl = baseUsersUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", async () => {
    it("GET /users", async () => {
      // Act:
      const response = await request.get(baseUrl);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /users/:id - existing user", async () => {
      // Arrange:
      const expectedData = validExistingUser;

      // Act:
      const response = await request.get(`${baseUrl}/1`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedData);
    });

    it("GET /users/:id - non existing user", async () => {
      // Act:
      const response = await request.get(`${baseUrl}/112312312`);

      // Assert:
      expect(response.status).to.equal(404);
    });

    describe("POST /users", () => {
      it("empty payload", () => {
        return request.post(baseUrl).send({}).expect(422);
      });

      it("valid registration", async () => {
        // Arrange:
        const testUserData = generateValidUserData();

        // Act:
        const response = await request.post(baseUrl).send(testUserData);

        // Assert:
        expect(response.status).to.equal(201);
        testUserData.id = response.body.id;
        expect(response.body).to.deep.equal(testUserData);
      });

      it("invalid registration - same email", async () => {
        // Arrange:
        const testUserData = generateValidUserData();
        const response = await request.post(baseUrl).send(testUserData);
        expect(response.status).to.equal(201);

        // Act:
        const responseAgain = await request.post(baseUrl).send(testUserData);

        // Assert:
        expect(responseAgain.status).to.equal(201);
      });
      it("invalid email", async () => {
        // Arrange:
        const testUserData = generateValidUserData();
        testUserData.email = "abcd";

        // Act:
        const response = await request.post(baseUrl).send(testUserData);

        // Assert:
        expect(response.status).to.equal(422);
      });

      ["firstname", "lastname", "email", "avatar"].forEach((field) => {
        it(`missing mandatory field - ${field}`, async () => {
          // Arrange:
          const testUserData = generateValidUserData();

          testUserData[field] = undefined;

          // Act:
          const response = await request.post(baseUrl).send(testUserData);

          // Assert:
          expect(response.status).to.equal(422);
        });
      });

      ["firstname", "lastname", "email", "avatar"].forEach((field) => {
        it(`length of field exceeded - ${field}`, async () => {
          // Arrange:
          const testUserData = generateValidUserData();

          testUserData[field] = faker.string.alphanumeric(5000) + "@test." + faker.string.alphanumeric(4995);

          // Act:
          const response = await request.post(baseUrl).send(testUserData);

          // Assert:
          expect(response.status).to.equal(422);
        });
      });
    });

    it("PUT /users", () => {
      return request.put(baseUrl).send({}).expect(401);
    });

    it("PUT /users/:id", () => {
      return request.put(`${baseUrl}/1`).send({}).expect(401);
    });

    it("PATCH /users/:id", () => {
      return request.patch(`${baseUrl}/1`).send({}).expect(401);
    });

    it("PATCH /users", () => {
      return request.patch(baseUrl).send({}).expect(401);
    });

    it("DELETE /users", () => {
      return request.delete(baseUrl).expect(401);
    });

    it("DELETE /users/:id", () => {
      return request.delete(`${baseUrl}/1`).expect(401);
    });

    it("HEAD /users", () => {
      return request.head(`${baseUrl}/1`).expect(200);
    });
  });

  describe("With auth", async () => {
    let headers;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
    });

    it("GET /users", async () => {
      // Act:
      const response = await request.get(baseUrl).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length).to.be.greaterThan(1);
    });

    it("GET /users/:id", async () => {
      // Arrange:
      const expectedData = validExistingUser;

      // Act:
      const response = await request.get(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(expectedData);
    });

    it("POST /users - create valid user", async () => {
      // Arrange:
      const testUserData = generateValidUserData();

      // Act:
      const response = await request.post(baseUrl).send(testUserData).set(headers);

      // Assert:
      expect(response.status).to.equal(201);
      testUserData.id = response.body.id;
      expect(response.body).to.deep.equal(testUserData);
    });

    it("POST /users - create valid user (with id in body)", async () => {
      // Arrange:
      const testUserData = generateValidUserData();
      testUserData.id = 1;

      // Act:
      const response = await request.post(baseUrl).send(testUserData).set(headers);

      // Assert:
      expect(response.status).to.equal(201);
      testUserData.id = response.body.id;
      expect(response.body).to.deep.equal(testUserData);
    });

    it("HEAD /users", () => {
      return request.head(`${baseUrl}/1`).set(headers).expect(200);
    });
  });

  describe("MODIFY /users", async () => {
    let headers;
    let userId;
    let baseUserData;
    let testUserData;

    beforeEach(async () => {
      const data = await prepareUniqueLoggedUser();
      headers = data.headers;
      userId = data.userId;
      baseUserData = data.testUserData;

      testUserData = generateValidUserData();
      testUserData.id = userId;
    });

    it("PUT /users", async () => {
      // Act:
      const response = await request.put(baseUrl).set(headers).send(testUserData);

      // Assert:
      expect(response.status).to.equal(401);
    });

    it("PUT /users/:id - update", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/${userId}`).set(headers).send(testUserData);

      // Assert:
      expect(response.status).to.equal(200);
      testUserData.id = response.body.id;
      expect(response.body).to.deep.equal(testUserData);
    });

    ["firstname", "lastname", "email", "avatar"].forEach((field) => {
      it(`PUT /users/:id - update with missing mandatory field - ${field}`, async () => {
        // Arrange:
        const testUserData = generateValidUserData();

        testUserData[field] = undefined;

        // Act:
        const response = await request.put(`${baseUrl}/${userId}`).set(headers).send(testUserData);

        // Assert:
        expect(response.status).to.equal(422);
      });
    });
    it("PUT /users/:id - update different user", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/1`).set(headers).send(testUserData);

      // Assert:
      expect(response.status).to.equal(401);
    });

    it("PATCH /users/:id - full update", async () => {
      // Act:
      const response = await request.patch(`${baseUrl}/${userId}`).set(headers).send(testUserData);

      // Assert:
      expect(response.status).to.equal(200);
      testUserData.id = response.body.id;
      expect(response.body).to.deep.equal(testUserData);
    });

    it("PATCH /users/:id - full update different user", async () => {
      // Act:
      const response = await request.patch(`${baseUrl}/1`).set(headers).send(testUserData);

      // Assert:
      expect(response.status).to.equal(401);
    });

    it("PATCH /users/:id - update partial", async () => {
      // Arrange:
      const testPartialUserData = { firstname: testUserData.firstname };

      // Act:
      const response = await request.patch(`${baseUrl}/${userId}`).set(headers).send(testPartialUserData);

      // Assert:
      expect(response.status).to.equal(200);
      baseUserData.firstname = testPartialUserData.firstname;
      baseUserData.id = response.body.id;
      expect(response.body).to.deep.equal(baseUserData);
    });

    it("PATCH /users/:id - update partial with invalid data", async () => {
      // Arrange:
      const testPartialUserData = { firstname: faker.string.alphanumeric(10001) };

      // Act:
      const response = await request.patch(`${baseUrl}/${userId}`).set(headers).send(testPartialUserData);

      // Assert:
      expect(response.status).to.equal(422);

      const responseGet = await request.get(`${baseUrl}/${userId}`).set(headers);

      expect(responseGet.status).to.equal(200);
      expect(responseGet.body.firstname).to.deep.equal(baseUserData.firstname);
    });

    it("PATCH /users/:id - partial update different user", async () => {
      // Arrange:
      const testPartialUserData = { firstname: testUserData.firstname };

      // Act:
      const response = await request.patch(`${baseUrl}/1`).set(headers).send(testPartialUserData);

      // Assert:
      expect(response.status).to.equal(401);
    });
  });

  describe("DELETE /users", () => {
    let headers;
    let userId;

    beforeEach(async () => {
      const data = await prepareUniqueLoggedUser();
      headers = data.headers;
      userId = data.userId;
    });

    it("DELETE /users/:id - self delete", async () => {
      // Act:
      const responseDel = await request.delete(`${baseUrl}/${userId}`).set(headers);

      // Assert:
      expect(responseDel.status).to.equal(200);
    });

    it("DELETE /users/:id - attempt of delete of other user", async () => {
      // Act:
      const responseDel = await request.delete(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(responseDel.status).to.equal(401);
    });

    it("DELETE /users/:id - attempt of delete of not existing user", async () => {
      // Act:
      const responseDel = await request.delete(`${baseUrl}/112323212`).set(headers);

      // Assert:
      expect(responseDel.status).to.equal(401);
    });
  });
});
