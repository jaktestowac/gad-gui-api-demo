const { request, expect, bookShopAccountUrl, bookShopAccountAuthorizeUrl } = require("../../config.js");
const { authUser, authUser4, authUser5WithoutBookShopAccount } = require("../../helpers/data.helpers.js");
const { setupEnv, gracefulQuit } = require("../../helpers/helpers.js");

describe(`Endpoint /${bookShopAccountUrl}`, async () => {
  const baseUrl = bookShopAccountUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe(`Authorize - ${bookShopAccountAuthorizeUrl}`, async () => {
    const baseUrl = bookShopAccountAuthorizeUrl;
    bookShopAccountAuthorizeUrl;
    describe(`Without auth ${baseUrl}`, async () => {
      it(`GET ${baseUrl}`, async () => {
        return request.get(baseUrl).expect(404);
      });

      it(`GET ${baseUrl}/:id`, async () => {
        return request.get(`${baseUrl}/1`).expect(404);
      });

      it(`POST ${baseUrl}`, () => {
        return request.post(baseUrl).send({}).expect(401);
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
        expect(response.status, JSON.stringify(response.body)).to.equal(404);
      });

      it(`GET ${baseUrl}/:id`, async () => {
        // Act:
        const response = await request.get(`${baseUrl}/1`).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(404);
      });

      it(`GET ${baseUrl}/:id2`, async () => {
        // Act:
        const response = await request.get(`${baseUrl}/2`).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(404);
      });

      it(`GET ${baseUrl}/:id/my-books`, async () => {
        // Act:
        const response = await request.get(`${baseUrl}/1/my-books`).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(404);
      });

      it(`GET ${baseUrl}/:id2/my-books`, async () => {
        // Act:
        const response = await request.get(`${baseUrl}/2/my-books`).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(404);
      });

      it(`POST ${baseUrl} - authorize`, async () => {
        // Act:
        const response = await request.post(baseUrl).send({}).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(200);
        expect(response.body.user_id, JSON.stringify(response.body)).to.equal(userId);
        expect(response.body.id, JSON.stringify(response.body)).to.equal(1);
        expect(response.body.role_id, JSON.stringify(response.body)).to.equal(2);
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

  describe(`Without auth ${baseUrl}`, async () => {
    it(`GET ${baseUrl}`, async () => {
      return request.get(baseUrl).expect(404);
    });

    it(`GET ${baseUrl}/:id`, async () => {
      return request.get(`${baseUrl}/1`).expect(401);
    });

    it(`GET ${baseUrl}/my-books`, async () => {
      return request.get(`${baseUrl}/my-books`).expect(401);
    });

    it(`GET ${baseUrl}/:id/my-books`, async () => {
      return request.get(`${baseUrl}/1/my-books`).expect(401);
    });

    it(`POST ${baseUrl}`, () => {
      return request.post(baseUrl).send({}).expect(401);
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
      return request.patch(`${baseUrl}/1`).send({}).expect(401);
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
    let headers2;
    let userId2;
    let headers3;
    let userId3;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;

      const data2 = await authUser4();
      headers2 = data2.headers;
      userId2 = data2.userId;

      const data3 = await authUser5WithoutBookShopAccount();
      headers3 = data3.headers;
      userId3 = data3.userId;
    });

    it(`GET ${baseUrl}`, async () => {
      // Act:
      const response = await request.get(baseUrl).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body.id, JSON.stringify(response.body)).to.equal(1);
    });

    it(`GET ${baseUrl}/:id`, async () => {
      // Act:
      const response = await request.get(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body.id, JSON.stringify(response.body)).to.equal(1);
    });

    it(`GET ${baseUrl}/:id2`, async () => {
      // Act:
      const response = await request.get(`${baseUrl}/2`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(404);
    });

    it(`GET ${baseUrl}/my-books`, async () => {
      // Act:
      const response = await request.get(`${baseUrl}/my-books`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body, JSON.stringify(response.body)).to.eql({
        wishlist_books_ids: [3],
        read_books_ids: [2],
        owned_books_ids: [1, 5],
        purchased_book_ids: [1],
        favorite_books_ids: [1],
      });
    });

    it(`GET ${baseUrl}/:id/my-books`, async () => {
      // Act:
      const response = await request.get(`${baseUrl}/1/my-books`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(404);
    });

    it(`GET ${baseUrl}/:id2/my-books`, async () => {
      // Act:
      const response = await request.get(`${baseUrl}/2/my-books`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(404);
    });

    it(`POST ${baseUrl} - create new account`, async () => {
      // Arrange:
      const expectedData = {
        user_id: userId3,
        role_id: 2,
        wishlist_books_ids: [],
        read_books_ids: [],
        owned_books_ids: [],
        purchased_book_ids: [],
        favorite_books_ids: [],
        funds: 10000,
        country: "",
        city: "",
        street: "",
        postal_code: "",
      };

      // Act:
      const response = await request.post(baseUrl).send({}).set(headers3);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(201);
      expectedData.created_at = response.body.created_at;
      expectedData.id = response.body.id;
      expect(response.body, JSON.stringify(response.body)).to.eql(expectedData);
      expect(response.body.created_at, JSON.stringify(response.body)).to.not.be.undefined;
      expect(response.body.id, JSON.stringify(response.body)).to.not.be.undefined;
    });

    it(`POST ${baseUrl} - create new account when it already exists`, async () => {
      // Act:
      const response = await request.post(baseUrl).send({}).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(409);
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
      return request.patch(`${baseUrl}/1`).send({}).set(headers).expect(403);
    });

    it(`PATCH ${baseUrl}/:id - different account`, () => {
      return request.patch(`${baseUrl}/2`).send({}).set(headers).expect(404);
    });

    ["country", "city", "street", "postal_code"].forEach((field) => {
      it(`PATCH ${baseUrl}/:id - update ${field}`, async () => {
        // Arrange:
        const data = { [field]: "new value" };

        // Act:
        const response = await request.patch(`${baseUrl}/1`).send(data).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(200);
        expect(response.body[field], JSON.stringify(response.body)).to.equal(data[field]);
      });
    });

    ["role_id", "id", "_active", "_inactive", "test"].forEach((field) => {
      it(`PATCH ${baseUrl}/:id - update ${field} (not allowed)`, async () => {
        // Arrange:
        const data = { [field]: "new value" };

        // Act:
        const response = await request.patch(`${baseUrl}/1`).send(data).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(403);

        // Act: check if the data was not updated
        const response2 = await request.get(`${baseUrl}`).set(headers);

        // Assert:
        expect(response2.status, JSON.stringify(response2.body)).to.equal(200);
        expect(response2.body[field], JSON.stringify(response2.body)).to.not.equal(data[field]);
      });
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
