const { bookShopPaymentCardsUrl, request, expect } = require("../../config.js");
const { authUser, generateUniqueCardData } = require("../../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, clearDB } = require("../../helpers/helpers.js");

describe("Endpoint /book-shop-account-payment-cards", async () => {
  const baseUrl = bookShopPaymentCardsUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe(`Without auth ${baseUrl}`, async () => {
    it(`GET ${baseUrl}`, async () => {
      return request.get(baseUrl).expect(401);
    });

    it(`GET ${baseUrl}/:id`, async () => {
      return request.get(`${baseUrl}/1`).expect(401);
    });

    it(`POST ${baseUrl}`, () => {
      return request.post(baseUrl).send({}).expect(404);
    });

    it(`PUT ${baseUrl}`, () => {
      return request.put(baseUrl).send({}).expect(401);
    });

    it(`PUT ${baseUrl}/:id`, () => {
      return request.put(`${baseUrl}/1`).send({}).expect(401);
    });

    it(`PATCH ${baseUrl}`, () => {
      return request.patch(baseUrl).send({}).expect(404);
    });

    it(`PATCH ${baseUrl}/:id`, () => {
      return request.patch(`${baseUrl}/1`).send({}).expect(404);
    });

    it(`DELETE ${baseUrl}`, () => {
      return request.delete(baseUrl).expect(401);
    });

    it(`DELETE ${baseUrl}/:id`, () => {
      return request.delete(`${baseUrl}/1`).expect(401);
    });

    it(`HEAD ${baseUrl}`, () => {
      return request.head(`${baseUrl}/1`).expect(404);
    });
  });

  describe(`With auth ${baseUrl}`, async () => {
    this.timeout(3000);
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
      expect(response.body.card_number, JSON.stringify(response.body)).to.be.equal("****************2121");
      expect(response.body.balance, JSON.stringify(response.body)).to.be.equal(10000);
    });

    it(`GET ${baseUrl}/:id`, async () => {
      // Act:
      const response = await request.get(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body.card_number, JSON.stringify(response.body)).to.be.equal("****************2121");
      expect(response.body.balance, JSON.stringify(response.body)).to.be.equal(10000);
    });

    it(`GET ${baseUrl}/:id 2`, async () => {
      // Act:
      const response = await request.get(`${baseUrl}/2`).set(headers);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(response.body.card_number, JSON.stringify(response.body)).to.be.equal("****************2121");
      expect(response.body.balance, JSON.stringify(response.body)).to.be.equal(10000);
    });

    it(`POST ${baseUrl}`, () => {
      return request.post(baseUrl).send({}).set(headers).expect(404);
    });

    it(`PUT ${baseUrl}`, () => {
      return request.put(baseUrl).send({}).set(headers).expect(422);
    });

    it(`PUT ${baseUrl}/:id`, () => {
      return request.put(`${baseUrl}/1`).send({}).set(headers).expect(422);
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

  describe(`With auth ${baseUrl} - register new card`, async () => {
    let headers;
    let userId;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;
    });

    [`${baseUrl}`, `${baseUrl}/1`, `${baseUrl}/2`].forEach((url) => {
      it(`PUT ${url} - add new valid card`, async () => {
        // Arrange:
        const body = generateUniqueCardData();

        // Act:
        const response = await request.put(`${url}`).send(body).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(200);

        // Act:
        const responseGet = await request.get(`${url}`).set(headers);

        // Assert:
        expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
        expect(responseGet.body.card_number, JSON.stringify(responseGet.body)).to.be.equal(
          "****************" + body.card_number.slice(-4)
        );
        expect(responseGet.body.balance, JSON.stringify(responseGet.body)).to.be.equal(50000);
      });
    });

    [
      {
        testName: " - card number is too short",
        card_number: "1",
        cvv: "98901",
        expiration_date: "2025-12-31",
      },
      {
        testName: " - card number is empty",
        card_number: "",
      },
      {
        testName: " - card number contains letters",
        card_number: "1234567890123456009A",
      },
      {
        testName: " - card number is too long",
        card_number: "1234567890123456009213123",
      },
      {
        testName: " - cvv is empty",
        cvv: "",
      },
      {
        testName: " - cvv is too long",
        cvv: "9890321",
      },
      {
        testName: " - cvv contains letters",
        cvv: "9890A",
      },
      {
        testName: " - cvv is too short",
        cvv: "9",
      },
      {
        testName: " - expiration_date is empty",
        expiration_date: "",
      },
      {
        testName: " - expiration_date is in the past",
        expiration_date: "2019-12-31",
      },
      {
        testName: " - expiration_date is in the wrong format",
        expiration_date: "2025-12-A",
      },
      {
        testName: " - expiration_date is in the wrong format 2",
        expiration_date: "12-31-2025",
      },
    ].forEach((cardData) => {
      it(`PUT ${baseUrl} - add new invalid card ${cardData.testName}`, async () => {
        // Arrange:
        // Arrange:
        const body = generateUniqueCardData();
        if (cardData.card_number !== undefined) {
          body.card_number = cardData.card_number;
        }
        if (cardData.cvv !== undefined) {
          body.cvv = cardData.cvv;
        }
        if (cardData.expiration_date !== undefined) {
          body.expiration_date = cardData.expiration_date;
        }

        // Act:
        const response = await request.put(`${baseUrl}`).send(body).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(422);

        // Act:
        const responseGet = await request.get(`${baseUrl}`).set(headers);

        // Assert:
        expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
        expect(responseGet.body.card_number, JSON.stringify(responseGet.body)).to.be.equal("****************2121");
        expect(responseGet.body.balance, JSON.stringify(responseGet.body)).to.be.equal(10000);
      });
    });
  });

  describe(`With auth ${baseUrl} - top up`, async () => {
    let headers;
    let userId;

    beforeEach(async () => {
      await clearDB();
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;
    });

    [
      { amount: 10000, left: 0 },
      { amount: 100.0, left: 9900 },
      { amount: 100, left: 9900 },
      { amount: "900", left: 9100 },
    ].forEach((topupData) => {
      it(`POST ${baseUrl}/topup - amount:${topupData.amount}`, async () => {
        // Arrange:
        const body = {
          cvv: "12345",
          amount: topupData.amount,
        };

        // Act:
        const response = await request.post(`${baseUrl}/topup`).send(body).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(200);

        // Act:
        const responseGet = await request.get(`${baseUrl}`).set(headers);

        // Assert:
        expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
        expect(responseGet.body.balance, JSON.stringify(responseGet.body)).to.be.equal(topupData.left);
        expect(responseGet.body.card_number, JSON.stringify(responseGet.body)).to.be.equal("****************2121");
      });
    });

    [
      { amount: 100001, left: 10000 },
      { amount: 0, left: 10000 },
      { amount: "", left: 10000 },
      { amount: undefined, left: 10000 },
      { amount: "A", left: 10000 },
    ].forEach((topupData) => {
      it(`POST ${baseUrl}/topup - invalid amount:${topupData.amount}`, async () => {
        // Arrange:
        const body = {
          cvv: "12345",
          amount: topupData.amount,
        };

        // Act:
        const response = await request.post(`${baseUrl}/topup`).send(body).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(422);

        // Act:
        const responseGet = await request.get(`${baseUrl}`).set(headers);

        // Assert:
        expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
        expect(responseGet.body.balance, JSON.stringify(responseGet.body)).to.be.equal(topupData.left);
        expect(responseGet.body.card_number, JSON.stringify(responseGet.body)).to.be.equal("****************2121");
      });
    });
  });
});
