const { bookShopManageUrl, request, expect } = require("../../config.js");
const { authUser, authUserBookShopAdmin } = require("../../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, clearDB } = require("../../helpers/helpers.js");

describe(`Endpoint ${bookShopManageUrl}`, async () => {
  const baseUrl = bookShopManageUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  ["orders", "items", "users"].forEach((endpoint) => {
    [true, false].forEach((areHeadersSet) => {
      let headers;
      let userId;

      beforeEach(async () => {
        const data = await authUser();
        headers = data.headers;
        userId = data.userId;

        if (!areHeadersSet) {
          headers = {};
        }
      });

      const baseUrl = `${bookShopManageUrl}/${endpoint}`;
      describe(`${areHeadersSet ? "With" : "Without"} auth ${baseUrl}`, async () => {
        it(`GET ${baseUrl}`, async () => {
          return request.get(baseUrl).set(headers).expect(401);
        });

        it(`GET ${baseUrl}/:id`, async () => {
          return request.get(`${baseUrl}/1`).set(headers).expect(401);
        });

        it(`POST ${baseUrl}`, () => {
          return request.post(baseUrl).set(headers).send({}).expect(401);
        });

        it(`PUT ${baseUrl}`, () => {
          return request.put(baseUrl).set(headers).send({}).expect(401);
        });

        it(`PUT ${baseUrl}/:id`, () => {
          return request.put(`${baseUrl}/1`).set(headers).send({}).expect(401);
        });

        it(`PATCH ${baseUrl}`, () => {
          return request.patch(baseUrl).set(headers).send({}).expect(401);
        });

        it(`PATCH ${baseUrl}/:id`, () => {
          return request.patch(`${baseUrl}/1`).set(headers).send({}).expect(401);
        });

        it(`DELETE ${baseUrl}`, () => {
          return request.delete(baseUrl).set(headers).expect(401);
        });

        it(`DELETE ${baseUrl}/:id`, () => {
          return request.delete(`${baseUrl}/1`).set(headers).expect(401);
        });

        it(`HEAD ${baseUrl}`, () => {
          return request.head(`${baseUrl}/1`).set(headers).expect(401);
        });
      });
    });
  });

  ["orders", "items"].forEach((endpoint) => {
    const baseUrl = `${bookShopManageUrl}/${endpoint}`;
    let headers;
    let userId;

    beforeEach(async () => {
      await clearDB();
      const data = await authUserBookShopAdmin();
      headers = data.headers;
      userId = data.userId;
    });

    describe(`With auth ${baseUrl}`, async () => {
      it(`GET ${baseUrl}`, async () => {
        return request.get(baseUrl).set(headers).expect(200);
      });

      it(`GET ${baseUrl}/:id`, async () => {
        return request.get(`${baseUrl}/1`).set(headers).expect(200);
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

      it(`PATCH ${baseUrl}`, async () => {
        const response = await request.patch(baseUrl).set(headers).send({});
        expect(response.status, JSON.stringify(response.body)).to.equal(422);
      });

      it(`PATCH ${baseUrl}/:id`, async () => {
        const response = await request.patch(`${baseUrl}/1`).set(headers).send({});
        expect(response.status, JSON.stringify(response.body)).to.equal(422);
      });

      it(`DELETE ${baseUrl}`, () => {
        return request.delete(baseUrl).set(headers).expect(404);
      });

      it.skip(`DELETE ${baseUrl}/:id - existing`, () => {
        // depends on resource the response can be 200 or 404
        return request.delete(`${baseUrl}/1`).set(headers).expect(200);
      });

      it(`DELETE ${baseUrl}/:id - not existing`, () => {
        return request.delete(`${baseUrl}/132132`).set(headers).expect(404);
      });

      it(`HEAD ${baseUrl}`, () => {
        return request.head(`${baseUrl}/1`).set(headers).expect(404);
      });
    });
  });

  ["orders"].forEach((endpoint) => {
    const baseUrl = `${bookShopManageUrl}/${endpoint}`;
    let headers;
    let userId;

    beforeEach(async () => {
      await clearDB();
      const data = await authUserBookShopAdmin();
      headers = data.headers;
      userId = data.userId;
    });

    describe(`With auth ${baseUrl}`, async () => {
      it(`DELETE ${baseUrl}/:id - existing`, () => {
        return request.delete(`${baseUrl}/1`).set(headers).expect(404);
      });
    });
  });

  ["items"].forEach((endpoint) => {
    const baseUrl = `${bookShopManageUrl}/${endpoint}`;
    let headers;
    let userId;

    beforeEach(async () => {
      await clearDB();
      const data = await authUserBookShopAdmin();
      headers = data.headers;
      userId = data.userId;
    });

    describe(`With auth ${baseUrl}`, async () => {
      it(`DELETE ${baseUrl}/:id - existing`, () => {
        return request.delete(`${baseUrl}/1`).set(headers).expect(200);
      });
    });
  });
});
