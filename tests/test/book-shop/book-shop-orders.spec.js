const { bookShopOrdersUrl, request, expect } = require("../../config.js");
const { authUser, authUser3, authUser4, authUser2 } = require("../../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, clearDB, sleep } = require("../../helpers/helpers.js");

// TODO: Implement tests
describe(`Endpoint /${bookShopOrdersUrl}`, async () => {
  const baseUrl = bookShopOrdersUrl;

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

    let headersWithoutOrder;
    let userIdWithoutOrder;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;

      const data4 = await authUser4();
      headersWithoutOrder = data4.headers;
      userIdWithoutOrder = data4.userId;
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

    it(`POST ${baseUrl} - create new order`, async () => {
      await clearDB();

      // Arrange:
      const expectedData = {
        user_id: userIdWithoutOrder,
        status_id: 1,
        book_ids: [],
        books_cost: {},
        partial_costs: {},
        total_cost: 0,
        created_at: "2024-10-26T15:53:23.269Z",
        id: 4,
      };

      // Act:
      const responseBefore = await request.get(baseUrl).set(headersWithoutOrder);

      // Assert:
      expect(responseBefore.status, JSON.stringify(responseBefore.body)).to.equal(200);
      const numberOfOrdersBefore = responseBefore.body.length;

      // Act:
      const response = await request.post(baseUrl).send({}).set(headersWithoutOrder);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(201);

      expectedData.created_at = response.body.created_at;
      expectedData.id = response.body.id;

      expect(response.body, JSON.stringify(response.body)).to.eql(expectedData);
      expect(response.body.created_at, JSON.stringify(response.body)).to.not.be.undefined;
      expect(response.body.id, JSON.stringify(response.body)).to.not.be.undefined;

      // Act:
      const responseAfter = await request.get(baseUrl).set(headersWithoutOrder);

      // Assert:
      expect(responseAfter.status, JSON.stringify(responseAfter.body)).to.equal(200);
      const numberOfOrdersAfter = responseAfter.body.length;

      expect(numberOfOrdersAfter, JSON.stringify(response.body)).to.equal(numberOfOrdersBefore + 1);
    });

    it(`POST ${baseUrl} - create new order when it already exist`, async () => {
      await clearDB();

      // Act:
      const responseBefore = await request.get(baseUrl).set(headersWithoutOrder);

      // Assert:
      expect(responseBefore.status, JSON.stringify(responseBefore.body)).to.equal(200);
      const numberOfOrdersBefore = responseBefore.body.length;

      // Act:
      const response = await request.post(baseUrl).send({}).set(headersWithoutOrder);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(201);

      await sleep(500);

      // Act: Try to create the same order again
      const response2 = await request.post(baseUrl).send({}).set(headersWithoutOrder);

      // Assert:
      expect(response2.status, JSON.stringify(response2.body)).to.equal(409);

      // Act:
      const responseAfter = await request.get(baseUrl).set(headersWithoutOrder);

      // Assert:
      expect(responseAfter.status, JSON.stringify(responseAfter.body)).to.equal(200);
      const numberOfOrdersAfter = responseAfter.body.length;

      expect(numberOfOrdersAfter, JSON.stringify(response.body)).to.equal(numberOfOrdersBefore + 1);
    });

    it(`DELETE ${baseUrl} - delete order`, async () => {
      await clearDB();

      // Act:
      const responseBefore = await request.get(baseUrl).set(headersWithoutOrder);

      // Assert:
      expect(responseBefore.status, JSON.stringify(responseBefore.body)).to.equal(200);
      const numberOfOrdersBefore = responseBefore.body.length;

      // Act:
      const response = await request.post(baseUrl).send({}).set(headersWithoutOrder);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(201);

      await sleep(500);

      // Act:
      const responseDel = await request.delete(baseUrl).set(headersWithoutOrder);

      // Assert:
      expect(responseDel.status, JSON.stringify(responseDel.body)).to.equal(404);

      await sleep(500);

      // Assert:
      const responseAfter = await request.get(baseUrl).set(headersWithoutOrder);
      expect(responseAfter.status, JSON.stringify(responseAfter.body)).to.equal(200);
      const numberOfOrdersAfter = responseAfter.body.length;

      expect(numberOfOrdersAfter, JSON.stringify(response.body)).to.equal(numberOfOrdersBefore + 1);
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
      return request.patch(`${baseUrl}/1`).send({}).set(headers).expect(409);
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

  describe(`With auth ${baseUrl} - order items`, async () => {
    let headers;
    let userId;
    let orderId;

    beforeEach(async () => {
      await clearDB();
      const data = await authUser4();
      headers = data.headers;
      userId = data.userId;

      const response = await request.post(baseUrl).send({}).set(headers);
      expect(response.status, JSON.stringify(response.body)).to.equal(201);
      orderId = response.body.id;
      await sleep(250);
    });

    it(`PATCH ${baseUrl} - add item`, async () => {
      // Arrange:
      const expectedPartialCosts = {
        shipping: 500,
        books: 2500,
      };

      const itemsBody = {
        book_id: 1,
      };

      // Act: add item to order
      const responseAddItem = await request.post(`${baseUrl}/items`).send(itemsBody).set(headers);

      // Assert:
      expect(responseAddItem.status, JSON.stringify(responseAddItem.body)).to.equal(200);

      await sleep(250);

      const responseGet = await request.get(`${baseUrl}/${orderId}`).set(headers);
      expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
      expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(1);
      expect(responseGet.body.book_ids, JSON.stringify(responseGet.body)).to.eql([itemsBody.book_id]);
      expect(responseGet.body.total_cost, JSON.stringify(responseGet.body)).to.eql(3000);
      expect(responseGet.body.books_cost[itemsBody.book_id], JSON.stringify(responseGet.body)).to.eql(2500);
      expect(responseGet.body.partial_costs, JSON.stringify(responseGet.body)).to.eql(expectedPartialCosts);
    });

    describe(`With auth ${baseUrl} - order items`, async () => {
      let headers;
      let userId;
      let orderId;

      const itemBody1 = {
        book_id: 1,
      };
      const expectedPartialCostsForItem1 = {
        shipping: 500,
        books: 2500,
      };

      beforeEach(async () => {
        await clearDB();
        await sleep(250);

        const data = await authUser2();
        headers = data.headers;
        userId = data.userId;

        const response = await request.post(baseUrl).send({}).set(headers);
        expect(response.status, JSON.stringify(response.body)).to.equal(201);
        orderId = response.body.id;

        await sleep(250);

        // Act: add item to order
        const responseAddItem = await request.post(`${baseUrl}/items`).send(itemBody1).set(headers);
        expect(responseAddItem.status, JSON.stringify(responseAddItem.body)).to.equal(200);

        await sleep(250);
      });

      describe(`Add coupons`, async () => {
        it(`PATCH - add fixed coupon`, async () => {
          const couponBody = {
            coupon_code: "10OFF",
          };

          // Act: add coupon to order
          const response = await request.post(`${baseUrl}/coupon`).send(couponBody).set(headers);
          expect(response.status, JSON.stringify(response.body)).to.equal(200);

          // Assert:
          await sleep(250);

          const responseGet = await request.get(`${baseUrl}/${orderId}`).set(headers);
          expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
          expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(1);
          expect(responseGet.body.total_cost, JSON.stringify(responseGet.body)).to.eql(2000);
          expect(responseGet.body.partial_costs[couponBody.coupon_code], JSON.stringify(responseGet.body)).to.eql(
            -1000
          );
        });

        it(`PATCH - add percentage coupon`, async () => {
          const couponBody = {
            coupon_code: "20OFF",
          };

          // Act: add coupon to order
          const response = await request.post(`${baseUrl}/coupon`).send(couponBody).set(headers);
          expect(response.status, JSON.stringify(response.body)).to.equal(200);

          // Assert:
          await sleep(250);

          const responseGet = await request.get(`${baseUrl}/${orderId}`).set(headers);
          expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
          expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(1);
          expect(responseGet.body.total_cost, JSON.stringify(responseGet.body)).to.eql(2500);
          expect(responseGet.body.partial_costs[couponBody.coupon_code], JSON.stringify(responseGet.body)).to.eql(-500);
        });

        [
          { c1: "20OFF", c2: "10OFF", value1: -500, value2: -1000 },
          { c1: "10OFF", c2: "20OFF", value1: -1000, value2: -500 },
        ].forEach((coupons) => {
          it(`PATCH - add fixed and percentage coupon - ${coupons.c1} and ${coupons.c2}`, async () => {
            const couponBody1 = {
              coupon_code: coupons.c1,
            };
            const couponBody2 = {
              coupon_code: coupons.c2,
            };

            // Act: add coupon to order
            const response1 = await request.post(`${baseUrl}/coupon`).send(couponBody1).set(headers);
            expect(response1.status, JSON.stringify(response1.body)).to.equal(200);
            await sleep(250);

            const response2 = await request.post(`${baseUrl}/coupon`).send(couponBody2).set(headers);
            expect(response2.status, JSON.stringify(response2.body)).to.equal(200);

            // Assert:
            await sleep(250);

            const responseGet = await request.get(`${baseUrl}/${orderId}`).set(headers);
            expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
            expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(1);
            expect(responseGet.body.total_cost, JSON.stringify(responseGet.body)).to.eql(1500);
            expect(responseGet.body.partial_costs[couponBody1.coupon_code], JSON.stringify(responseGet.body)).to.eql(
              coupons.value1
            );
            expect(responseGet.body.partial_costs[couponBody2.coupon_code], JSON.stringify(responseGet.body)).to.eql(
              coupons.value2
            );
          });
        });

        it(`PATCH - add invalid coupon`, async () => {
          const couponBody = {
            coupon_code: "2120OFF",
          };

          // Act: add coupon to order
          const response = await request.post(`${baseUrl}/coupon`).send(couponBody).set(headers);
          expect(response.status, JSON.stringify(response.body)).to.equal(404);

          // Assert:
          await sleep(250);

          const responseGet = await request.get(`${baseUrl}/${orderId}`).set(headers);
          expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
          expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(1);
          expect(responseGet.body.total_cost, JSON.stringify(responseGet.body)).to.eql(3000);
          expect(responseGet.body.partial_costs[couponBody.coupon_code], JSON.stringify(responseGet.body)).to.eql(
            undefined
          );
        });
      });

      it(`PATCH ${baseUrl} - add items`, async () => {
        // Arrange:
        const expectedPartialCosts = {
          shipping: 500,
          books: 5500,
        };

        const itemBody2 = {
          book_id: 2,
        };

        const responseAddItem2 = await request.post(`${baseUrl}/items`).send(itemBody2).set(headers);
        expect(responseAddItem2.status, JSON.stringify(responseAddItem2.body)).to.equal(200);

        // Assert:
        await sleep(250);

        const responseGet = await request.get(`${baseUrl}/${orderId}`).set(headers);
        expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
        expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(1);
        expect(responseGet.body.book_ids, JSON.stringify(responseGet.body)).to.eql([
          itemBody1.book_id,
          itemBody2.book_id,
        ]);
        expect(responseGet.body.total_cost, JSON.stringify(responseGet.body)).to.eql(6000);
        expect(responseGet.body.books_cost[itemBody1.book_id], JSON.stringify(responseGet.body)).to.eql(2500);
        expect(responseGet.body.books_cost[itemBody2.book_id], JSON.stringify(responseGet.body)).to.eql(3000);
        expect(responseGet.body.partial_costs, JSON.stringify(responseGet.body)).to.eql(expectedPartialCosts);
      });

      it(`PATCH ${baseUrl} - add one item two times`, async () => {
        const responseAddItem = await request.post(`${baseUrl}/items`).send(itemBody1).set(headers);
        expect(responseAddItem.status, JSON.stringify(responseAddItem.body)).to.equal(409);

        await sleep(250);

        const responseGet = await request.get(`${baseUrl}/${orderId}`).set(headers);
        expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
        expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(1);
        expect(responseGet.body.book_ids, JSON.stringify(responseGet.body)).to.eql([itemBody1.book_id]);
        expect(responseGet.body.total_cost, JSON.stringify(responseGet.body)).to.eql(3000);
        expect(responseGet.body.books_cost[itemBody1.book_id], JSON.stringify(responseGet.body)).to.eql(2500);
        expect(responseGet.body.partial_costs, JSON.stringify(responseGet.body)).to.eql(expectedPartialCostsForItem1);
      });

      it(`PATCH ${baseUrl} - add not existing item`, async () => {
        const itemBody2 = {
          book_id: 42131123,
        };

        // Act: add item to order
        const responseAddItem = await request.post(`${baseUrl}/items`).send(itemBody2).set(headers);
        expect(responseAddItem.status, JSON.stringify(responseAddItem.body)).to.equal(404);

        await sleep(250);

        const responseGet = await request.get(`${baseUrl}/${orderId}`).set(headers);
        expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
        expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(1);
        expect(responseGet.body.book_ids, JSON.stringify(responseGet.body)).to.eql([itemBody1.book_id]);
        expect(responseGet.body.total_cost, JSON.stringify(responseGet.body)).to.eql(3000);
        expect(responseGet.body.books_cost[itemBody1.book_id], JSON.stringify(responseGet.body)).to.eql(2500);
        expect(responseGet.body.partial_costs, JSON.stringify(responseGet.body)).to.eql(expectedPartialCostsForItem1);
      });

      it(`PATCH ${baseUrl} - add book out of stock`, async () => {
        const itemBody2 = {
          book_id: 33,
        };

        // Act: add item to order
        const responseAddItem = await request.post(`${baseUrl}/items`).send(itemBody2).set(headers);
        expect(responseAddItem.status, JSON.stringify(responseAddItem.body)).to.equal(404);

        await sleep(250);

        const responseGet = await request.get(`${baseUrl}/${orderId}`).set(headers);
        expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
        expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(1);
        expect(responseGet.body.book_ids, JSON.stringify(responseGet.body)).to.eql([itemBody1.book_id]);
        expect(responseGet.body.total_cost, JSON.stringify(responseGet.body)).to.eql(3000);
        expect(responseGet.body.books_cost[itemBody1.book_id], JSON.stringify(responseGet.body)).to.eql(2500);
        expect(responseGet.body.partial_costs, JSON.stringify(responseGet.body)).to.eql(expectedPartialCostsForItem1);
      });
    });
  });

  describe(`With auth ${baseUrl} - change order status`, async () => {
    let headers;
    let userId;
    let headers2;
    let userId2;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;

      const data2 = await authUser4();
      headers2 = data2.headers;
      userId2 = data2.userId;
    });

    it(`PATCH ${baseUrl} - change order status - no items in order`, async () => {
      await clearDB();
      // Arrange:
      const statusBody = {
        status_id: 5,
      };

      const response = await request.post(baseUrl).send({}).set(headers2);
      expect(response.status, JSON.stringify(response.body)).to.equal(201);

      await sleep(250);

      // Act:
      const responsePatch = await request.patch(`${baseUrl}/${response.body.id}`).send(statusBody).set(headers2);

      // Assert:
      expect(responsePatch.status, JSON.stringify(responsePatch.body)).to.equal(422);

      await sleep(250);

      const responseGet = await request.get(`${baseUrl}/${response.body.id}`).set(headers2);
      expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
      expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(1);
    });

    describe(`Order status`, async () => {
      let headers;
      let userId;
      let orderId;

      const itemBody1 = {
        book_id: 1,
      };

      const expectedPartialCostsForItem1 = {
        shipping: 500,
        books: 2500,
      };

      beforeEach(async () => {
        await clearDB();
        const data = await authUser4();
        headers = data.headers;
        userId = data.userId;

        const response = await request.post(baseUrl).send({}).set(headers);
        expect(response.status, JSON.stringify(response.body)).to.equal(201);
        orderId = response.body.id;

        await sleep(250);

        // Act: add item to order
        const responseAddItem = await request.post(`${baseUrl}/items`).send(itemBody1).set(headers);
        expect(responseAddItem.status, JSON.stringify(responseAddItem.body)).to.equal(200);

        await sleep(250);
      });

      [
        { statusId: 5, name: "sent", itemsQuantityChange: -1, accountFundsChange: -3000 },
        { statusId: 20, name: "cancelled", itemsQuantityChange: 0, accountFundsChange: 0 },
      ].forEach((status) => {
        it(`PATCH ${baseUrl} - change order status - from new to valid: ${JSON.stringify(status)}`, async () => {
          // Arrange:
          const statusBody = {
            status_id: status.statusId,
          };

          const responseItemsBefore = await request.get(`/api/book-shop-items`).set(headers);
          const responseBodyItemsBefore = responseItemsBefore.body;
          const itemsQuantityBefore = responseBodyItemsBefore.find((item) => item.id === itemBody1.book_id).quantity;

          // Act: change status to pending
          const responsePatch = await request.patch(`${baseUrl}/${orderId}`).send(statusBody).set(headers);

          // Assert:
          expect(responsePatch.status, JSON.stringify(responsePatch.body)).to.equal(200);

          await sleep(250);

          const responseGet = await request.get(`${baseUrl}/${orderId}`).set(headers);
          expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
          expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(statusBody.status_id);
          expect(responseGet.body.book_ids, JSON.stringify(responseGet.body)).to.eql([itemBody1.book_id]);
          expect(responseGet.body.total_cost, JSON.stringify(responseGet.body)).to.eql(3000);
          expect(responseGet.body.books_cost[itemBody1.book_id], JSON.stringify(responseGet.body)).to.eql(2500);
          expect(responseGet.body.partial_costs, JSON.stringify(responseGet.body)).to.eql(expectedPartialCostsForItem1);

          const responseItemsAfter = await request.get(`/api/book-shop-items`).set(headers);
          const responseBodyItemsAfter = responseItemsAfter.body;
          const itemsQuantityAfter = responseBodyItemsAfter.find((item) => item.id === itemBody1.book_id).quantity;

          expect(itemsQuantityAfter, JSON.stringify(responseBodyItemsAfter)).to.equal(
            itemsQuantityBefore + status.itemsQuantityChange
          );
        });
      });

      [0, 3213, 21, 99, "", undefined].forEach((statusId) => {
        it(`PATCH ${baseUrl} - change order status - from new to invalid: ${statusId}`, async () => {
          // Arrange:
          const statusBody = {
            status_id: statusId,
          };

          const responseItemsBefore = await request.get(`/api/book-shop-items`).set(headers);
          const responseBodyItemsBefore = responseItemsBefore.body;
          const itemsQuantityBefore = responseBodyItemsBefore.find((item) => item.id === itemBody1.book_id).quantity;

          // Act: change status to pending
          const responsePatch = await request.patch(`${baseUrl}/${orderId}`).send(statusBody).set(headers);

          // Assert:
          expect(responsePatch.status, JSON.stringify(responsePatch.body)).to.equal(409);

          await sleep(250);

          const responseGet = await request.get(`${baseUrl}/${orderId}`).set(headers);
          expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
          expect(responseGet.body.status_id, JSON.stringify(responseGet.body)).to.equal(1);
          expect(responseGet.body.book_ids, JSON.stringify(responseGet.body)).to.eql([itemBody1.book_id]);
          expect(responseGet.body.total_cost, JSON.stringify(responseGet.body)).to.eql(3000);
          expect(responseGet.body.books_cost[itemBody1.book_id], JSON.stringify(responseGet.body)).to.eql(2500);
          expect(responseGet.body.partial_costs, JSON.stringify(responseGet.body)).to.eql(expectedPartialCostsForItem1);

          const responseItemsAfter = await request.get(`/api/book-shop-items`).set(headers);
          const responseBodyItemsAfter = responseItemsAfter.body;
          const itemsQuantityAfter = responseBodyItemsAfter.find((item) => item.id === itemBody1.book_id).quantity;

          expect(itemsQuantityAfter, JSON.stringify(responseBodyItemsAfter)).to.equal(itemsQuantityBefore);
        });
      });
    });
  });
});
