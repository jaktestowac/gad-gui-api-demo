const { booksUrl, request, expect, bookShopAccountUrl } = require("../../config.js");
const { authUser, authUser4 } = require("../../helpers/data.helpers.js");
const { setupEnv, gracefulQuit } = require("../../helpers/helpers.js");

describe("Endpoint /books", async () => {
  const baseUrl = booksUrl;

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
      return request.post(baseUrl).send({}).expect(401);
    });

    it(`PUT ${baseUrl}`, () => {
      return request.put(baseUrl).send({}).expect(401);
    });

    it(`PUT ${baseUrl}/:id`, () => {
      return request.put(`${baseUrl}/1`).send({}).expect(401);
    });

    it(`PATCH ${baseUrl}`, () => {
      return request.patch(baseUrl).send({}).expect(401);
    });

    it(`PATCH ${baseUrl}/:id`, () => {
      return request.patch(`${baseUrl}/1`).send({}).expect(401);
    });

    it(`DELETE ${baseUrl}`, () => {
      return request.delete(baseUrl).expect(401);
    });

    it(`DELETE ${baseUrl}/:id`, () => {
      return request.delete(`${baseUrl}/1`).expect(401);
    });

    it(`HEAD ${baseUrl}`, () => {
      return request.head(`${baseUrl}/1`).expect(401);
    });
  });

  describe(`With auth ${baseUrl}`, async () => {
    let headers;
    let userId;
    let headersAdmin;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;

      const dataAdmin = await authUser4();
      headersAdmin = dataAdmin.headers;
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
      expect(response.body.title, JSON.stringify(response.body)).to.not.be.empty;
      expect(response.body.cover, JSON.stringify(response.body)).to.not.be.empty;
      expect(response.body.language, JSON.stringify(response.body)).to.not.be.empty;
    });

    it(`GET ${baseUrl}/:id 2`, async () => {
      // Act:
      const response = await request.get(`${baseUrl}/2`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body.id, JSON.stringify(response.body)).to.equal(2);
      expect(response.body.title, JSON.stringify(response.body)).to.not.be.empty;
      expect(response.body.cover, JSON.stringify(response.body)).to.not.be.empty;
      expect(response.body.language, JSON.stringify(response.body)).to.not.be.empty;
    });

    it(`POST ${baseUrl}`, () => {
      return request.post(baseUrl).send({}).set(headers).expect(401);
    });

    it(`POST ${baseUrl} - create new book`, async () => {
      const newBook = {
        title: "Test Book",
        author_ids: [1],
        published_at: "2016-01-19T15:21:32.123Z",
        genre_ids: [1],
        language: "English",
        pages: 200,
        cover: "test-cover.jpg",
        description: "Test description",
      };

      // Act:
      const response = await request.post(baseUrl).send(newBook).set(headersAdmin);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(201);
      expect(response.body.title).to.equal(newBook.title);
      expect(response.body.language).to.equal(newBook.language);
    });

    it(`POST ${baseUrl} - create new book without admin rights`, async () => {
      const newBook = {
        title: "Test Book",
        author_ids: [1],
        published_at: "2016-01-19T15:21:32.123Z",
        genre_ids: [1],
        language: "English",
        pages: 200,
        cover: "test-cover.jpg",
        description: "Test description",
      };

      // Act:
      const response = await request.post(baseUrl).send(newBook).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(401);
    });

    it(`POST ${baseUrl} - create book with missing fields`, async () => {
      const invalidBook = {
        title: "Test Book",
        // missing required fields
      };

      const response = await request.post(baseUrl).send(invalidBook).set(headersAdmin);
      expect(response.status, JSON.stringify(response.body)).to.equal(422);
    });

    it(`POST ${baseUrl} - create book with invalid date`, async () => {
      const invalidBook = {
        title: "Test Book",
        author_ids: [1],
        published_at: "123",
        genre_ids: [1],
        language: "English",
        pages: 200,
        cover: "test-cover.jpg",
        description: "Test description",
      };

      const response = await request.post(baseUrl).send(invalidBook).set(headersAdmin);
      expect(response.status, JSON.stringify(response.body)).to.equal(422);
    });

    it(`PUT ${baseUrl}`, () => {
      return request.put(baseUrl).send({}).set(headers).expect(401);
    });

    it(`PUT ${baseUrl}/:id`, () => {
      return request.put(`${baseUrl}/1`).send({}).set(headers).expect(401);
    });

    it(`PATCH ${baseUrl}`, () => {
      return request.patch(baseUrl).send({}).set(headers).expect(401);
    });

    it(`PATCH ${baseUrl}/:id`, () => {
      return request.patch(`${baseUrl}/1`).send({}).set(headers).expect(401);
    });

    it(`PATCH ${baseUrl}/:id - update book`, async () => {
      const updates = {
        title: "Updated Book Title",
        description: "Updated description",
      };

      // Act:
      const response = await request.patch(`${baseUrl}/1`).send(updates).set(headersAdmin);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body.title).to.equal(updates.title);
      expect(response.body.description).to.equal(updates.description);
    });

    it(`PATCH ${baseUrl}/:id - update book with invalid ID`, async () => {
      const updates = {
        title: "Updated Title",
      };

      const response = await request.patch(`${baseUrl}/99999`).send(updates).set(headersAdmin);
      expect(response.status).to.equal(404);
    });

    it(`DELETE ${baseUrl}`, () => {
      return request.delete(baseUrl).set(headers).expect(401);
    });

    it(`DELETE ${baseUrl}/:id`, () => {
      return request.delete(`${baseUrl}/1`).set(headers).expect(401);
    });

    it(`DELETE ${baseUrl}/:id - soft delete book`, async () => {
      // Act:
      const response = await request.delete(`${baseUrl}/1`).set(headersAdmin);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body._inactive).to.be.true;
    });

    it(`DELETE ${baseUrl}/:id - delete non-existent book`, async () => {
      const response = await request.delete(`${baseUrl}/99999`).set(headersAdmin);
      expect(response.status).to.equal(404);
    });

    it(`HEAD ${baseUrl}`, () => {
      return request.head(`${baseUrl}/1`).set(headers).expect(401);
    });

    ["owned", "wishlist", "read", "favorites"].forEach((field) => {
      it(`POST ${baseUrl} - add book to ${field}`, async () => {
        const bookId = 1;
        const fieldNames = {
          owned: "owned_books_ids",
          wishlist: "wishlist_books_ids",
          read: "read_books_ids",
          favorites: "favorite_books_ids",
        };

        // Act:
        const response = await request.post(`${baseUrl}/${field}/${bookId}`).send({}).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(200);

        // Act:
        const responseGet = await request.get(`${bookShopAccountUrl}`).send({}).set(headers);

        // Assert:
        expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);

        expect(
          responseGet.body[fieldNames[field]].includes(bookId) ||
            responseGet.body[fieldNames[field]].includes(`${bookId}`),
          JSON.stringify(responseGet.body)
        ).to.be.true;
      });
    });

    ["owned", "wishlist", "read", "favorites"].forEach((field) => {
      [11213, "12345123", "", "AVSDSASDEWS", undefined].forEach((bookId) => {
        it(`POST ${baseUrl} - add not existing book to ${field} (bookId: ${bookId})`, async () => {
          const fieldNames = {
            owned: "owned_books_ids",
            wishlist: "wishlist_books_ids",
            read: "read_books_ids",
            favorites: "favorite_books_ids",
          };

          // Act:
          const response = await request.post(`${baseUrl}/${field}/${bookId}`).send({}).set(headers);

          // Assert:
          expect(response.status, JSON.stringify(response.body)).to.equal(404);

          // Act:
          const responseGet = await request.get(`${bookShopAccountUrl}`).send({}).set(headers);

          // Assert:
          expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);

          expect(
            responseGet.body[fieldNames[field]].includes(bookId) ||
              responseGet.body[fieldNames[field]].includes(`${bookId}`),
            JSON.stringify(responseGet.body)
          ).to.be.false;
        });
      });

      it(`GET ${baseUrl}/${field}`, () => {
        return request.get(`${baseUrl}/${field}`).set(headers).expect(404);
      });

      it(`GET ${baseUrl}/${field}/:id`, () => {
        return request.get(`${baseUrl}/${field}/1`).set(headers).expect(404);
      });

      it(`POST ${baseUrl}/${field}`, () => {
        return request.post(`${baseUrl}/${field}`).send({}).set(headers).expect(401);
      });

      it(`PUT ${baseUrl}/${field}`, () => {
        return request.put(`${baseUrl}/${field}`).send({}).set(headers).expect(401);
      });

      it(`PUT ${baseUrl}/${field}/:id`, () => {
        return request.put(`${baseUrl}/${field}/1`).send({}).set(headers).expect(401);
      });

      it(`PATCH ${baseUrl}/${field}`, () => {
        return request.patch(`${baseUrl}/${field}`).send({}).set(headers).expect(401);
      });

      it(`PATCH ${baseUrl}/${field}/:id`, () => {
        return request.patch(`${baseUrl}/${field}/1`).send({}).set(headers).expect(401);
      });

      it(`DELETE ${baseUrl}/${field}`, () => {
        return request.delete(`${baseUrl}/${field}`).set(headers).expect(401);
      });

      it(`DELETE ${baseUrl}/${field}/:id`, () => {
        return request.delete(`${baseUrl}/${field}/1`).set(headers).expect(401);
      });

      it(`HEAD ${baseUrl}/${field}`, () => {
        return request.head(`${baseUrl}/${field}/1`).set(headers).expect(401);
      });
    });
  });
});
