const { bookShopAuthorsUrl, request, expect } = require("../../config.js");
const { authUser } = require("../../helpers/data.helpers.js");
const { setupEnv, gracefulQuit } = require("../../helpers/helpers.js");

describe(`Endpoint ${bookShopAuthorsUrl}`, async () => {
  const baseUrl = bookShopAuthorsUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe(`Without auth ${baseUrl}`, async () => {
    it(`GET ${baseUrl}`, async () => {
      return request.get(baseUrl).expect(200);
    });

    it(`GET ${baseUrl}/:id`, async () => {
      return request.get(`${baseUrl}/1`).expect(200);
    });

    it(`POST ${baseUrl}`, () => {
      return request.post(baseUrl).send({}).expect(404);
    });

    it(`PUT ${baseUrl}`, () => {
      return request.put(baseUrl).send({}).expect(404);
    });

    it(`PUT ${baseUrl}/:id`, () => {
      return request.put(`${baseUrl}/1`).send({}).expect(404);
    });

    it(`PATCH ${baseUrl}`, () => {
      return request.patch(baseUrl).send({}).expect(404);
    });

    it(`PATCH ${baseUrl}/:id`, () => {
      return request.patch(`${baseUrl}/1`).send({}).expect(404);
    });

    it(`DELETE ${baseUrl}`, () => {
      return request.delete(baseUrl).expect(404);
    });

    it(`DELETE ${baseUrl}/:id`, () => {
      return request.delete(`${baseUrl}/1`).expect(404);
    });

    it(`HEAD ${baseUrl}`, () => {
      return request.head(`${baseUrl}/1`).expect(404);
    });
  });

  describe(`With auth ${baseUrl}`, async () => {
    let headers;
    let userId;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;
    });

    it(`GET ${baseUrl}`, async () => {
      // Act:
      const response = await request.get(baseUrl).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body.length, JSON.stringify(response.body)).to.be.greaterThan(0);
    });

    it(`GET ${baseUrl}/:id`, async () => {
      // Act:
      const response = await request.get(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body.id, JSON.stringify(response.body)).to.equal(1);
    });

    it(`GET ${baseUrl}/:id 2`, async () => {
      // Act:
      const response = await request.get(`${baseUrl}/2`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body.id, JSON.stringify(response.body)).to.equal(2);
    });

    it(`POST ${baseUrl}`, () => {
      return request.post(baseUrl).send({}).set(headers).expect(404);
    });

    it(`PUT ${baseUrl}`, () => {
      return request.put(baseUrl).send({}).set(headers).expect(404);
    });

    it(`PUT ${baseUrl}/:id`, () => {
      return request.put(`${baseUrl}/1`).send({}).set(headers).expect(404);
    });

    it(`PATCH ${baseUrl}`, () => {
      return request.patch(baseUrl).send({}).set(headers).expect(404);
    });

    it(`PATCH ${baseUrl}/:id`, () => {
      return request.patch(`${baseUrl}/1`).send({}).set(headers).expect(404);
    });

    it(`DELETE ${baseUrl}`, () => {
      return request.delete(baseUrl).set(headers).expect(404);
    });

    it(`DELETE ${baseUrl}/:id`, () => {
      return request.delete(`${baseUrl}/1`).set(headers).expect(404);
    });

    it(`HEAD ${baseUrl}`, () => {
      return request.head(`${baseUrl}/1`).set(headers).expect(404);
    });
  });
});
