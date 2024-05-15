const { gracefulQuit, setupEnv, sleep } = require("../helpers/helpers.js");
const { messengerContactsUrl, messengerMessagesUrl, request, expect } = require("../config.js");
const { authUser } = require("../helpers/data.helpers.js");

describe.only("Messenger - contacts and messages", async () => {
  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe(`Without auth - ${messengerContactsUrl}`, async () => {
    const baseUrl = messengerContactsUrl;
    it(`GET ${baseUrl} - should return 401`, async () => {
      // Act:
      const response = await request.get(baseUrl);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(401);
    });
    it(`POST ${baseUrl} - should return 501`, async () => {
      // Act:
      const response = await request.post(baseUrl);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(501);
    });
    it(`PUT ${baseUrl} - should return 401`, async () => {
      // Act:
      const response = await request.put(baseUrl);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(401);
    });
    it(`PATCH ${baseUrl} - should return 501`, async () => {
      // Act:
      const response = await request.patch(baseUrl);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(501);
    });
    it(`DELETE ${baseUrl} - should return 501`, async () => {
      // Act:
      const response = await request.delete(baseUrl);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(501);
    });
  });

  describe(`With auth - ${messengerContactsUrl}`, async () => {
    const baseUrl = messengerContactsUrl;
    let headers;
    let userId;
    let testArticleData;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;
    });

    it(`GET ${baseUrl} - should return 200`, async () => {
      // Act:
      const response = await request.get(baseUrl).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
    });
    it(`POST ${baseUrl} - should return 501`, async () => {
      // Act:
      const response = await request.post(baseUrl).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(501);
    });
    it(`PUT ${baseUrl} - should return 404 - user not found`, async () => {
      // Act:
      const response = await request.put(baseUrl).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(404);
    });
    it(`PUT ${baseUrl} - should return 404 - user not found`, async () => {
      // Arrange:
      const data = {
        email: "test@test.test",
      };

      // Act:
      const response = await request.put(baseUrl).set(headers).send(data);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(404);
    });
    it(`PUT ${baseUrl} - should return 200 - contact was added`, async () => {
      // Arrange:
      const data = {
        email: "Henry.Spencer@test.test",
      };

      // Act:
      const response = await request.put(baseUrl).set(headers).send(data);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
    });
    it(`PUT ${baseUrl} - should return 409 - can not add yourself`, async () => {
      // Arrange:
      const data = {
        email: "Danial.Dicki@dicki.test",
      };

      // Act:
      const response = await request.put(baseUrl).set(headers).send(data);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(409);
    });
    it(`PUT ${baseUrl} - should return 409 - can not twice the same contact`, async () => {
      // Arrange:
      const data = {
        email: "Henry.Spencer@test.test",
      };

      // Act:
      const response = await request.put(baseUrl).set(headers).send(data);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);

      await sleep(500);

      // Act:
      const response2 = await request.put(baseUrl).set(headers).send(data);

      // Assert:
      expect(response2.status, JSON.stringify(response2.body)).to.equal(409);
    });
    it(`PATCH ${baseUrl} - should return 501`, async () => {
      // Act:
      const response = await request.patch(baseUrl).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(501);
    });
    it(`DELETE ${baseUrl} - should return 501`, async () => {
      // Act:
      const response = await request.delete(baseUrl).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(501);
    });
  });

  describe(`Without auth - ${messengerMessagesUrl}`, async () => {
    const baseUrl = messengerMessagesUrl;
    it(`GET ${baseUrl} - should return 501`, async () => {
      // Act:
      const response = await request.get(baseUrl);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(501);
    });
    it(`POST ${baseUrl} - should return 501`, async () => {
      // Act:
      const response = await request.post(baseUrl);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(501);
    });
    it(`PUT ${baseUrl} - should return 501`, async () => {
      // Act:
      const response = await request.put(baseUrl);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(501);
    });
    it(`PATCH ${baseUrl} - should return 404`, async () => {
      // Act:
      const response = await request.patch(baseUrl);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(404);
    });
    it(`DELETE ${baseUrl} - should return 501`, async () => {
      // Act:
      const response = await request.delete(baseUrl);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(501);
    });
  });
});
