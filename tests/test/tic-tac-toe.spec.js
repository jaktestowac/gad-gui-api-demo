const { expect, request, baseTicTacToeUrl } = require("../config");
const { authUser, authUser2 } = require("../helpers/data.helpers");
const { gracefulQuit, setupEnv } = require("../helpers/helpers");

describe("Endpoint /tic-tac-toe", () => {
  const baseUrl = baseTicTacToeUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe(`Without auth`, () => {
    it(`GET ${baseUrl}`, async () => {
      // Act:
      const response = await request.get(baseUrl);

      // Assert:
      expect(response.status).to.equal(404);
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

    it(`HEAD ${baseUrl}/:id`, () => {
      return request.head(`${baseUrl}/1`).expect(404);
    });
  });

  describe(`With auth`, () => {
    let headers1;
    let userId1;
    let headers2;
    let userId2;

    beforeEach(async () => {
      const data1 = await authUser();
      headers1 = data1.headers;
      userId1 = data1.userId;
      headers1["userid"] = userId1;

      const data2 = await authUser2();
      headers2 = data2.headers;
      userId2 = data2.userId;
      headers2["userid"] = userId2;
    });

    describe(`${baseUrl}`, () => {
      it(`GET ${baseUrl}`, async () => {
        // Act:
        const response = await request.get(baseUrl).set(headers1);

        // Assert:
        expect(response.status).to.equal(404);
      });

      it(`POST ${baseUrl}`, () => {
        return request.post(baseUrl).set(headers1).send({}).expect(404);
      });

      it(`PUT ${baseUrl}`, () => {
        return request.put(baseUrl).set(headers1).send({}).expect(404);
      });

      it(`PUT ${baseUrl}/:id`, () => {
        return request.put(`${baseUrl}/1`).set(headers1).send({}).expect(404);
      });

      it(`PATCH ${baseUrl}`, () => {
        return request.patch(baseUrl).set(headers1).send({}).expect(404);
      });

      it(`PATCH ${baseUrl}/:id`, () => {
        return request.patch(`${baseUrl}/1`).set(headers1).send({}).expect(404);
      });

      it(`DELETE ${baseUrl}`, () => {
        return request.delete(baseUrl).set(headers1).expect(404);
      });

      it(`DELETE ${baseUrl}/:id`, () => {
        return request.delete(`${baseUrl}/1`).set(headers1).expect(404);
      });

      it(`HEAD ${baseUrl}/:id`, () => {
        return request.head(`${baseUrl}/1`).set(headers1).expect(404);
      });
    });

    describe(`${baseUrl}/start`, async () => {
      const rootUrl = `${baseUrl}/start`;

      it(`GET ${rootUrl}`, async () => {
        // Act:
        const response = await request.get(rootUrl).set(headers1);

        // Assert:
        expect(response.status).to.equal(404);
      });

      it(`POST ${rootUrl}`, async () => {
        // Act:
        const response = await request.post(rootUrl).set(headers1).send({});

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(201);
        const sessionCode = response.body.code;
        expect(sessionCode.length, JSON.stringify(response.body)).to.be.greaterThan(0);
      });

      it(`PUT ${rootUrl}`, () => {
        return request.put(rootUrl).set(headers1).send({}).expect(404);
      });

      it(`PUT ${rootUrl}/:id`, () => {
        return request.put(`${rootUrl}/1`).set(headers1).send({}).expect(404);
      });

      it(`PATCH ${rootUrl}`, () => {
        return request.patch(rootUrl).set(headers1).send({}).expect(404);
      });

      it(`PATCH ${rootUrl}/:id`, () => {
        return request.patch(`${rootUrl}/1`).set(headers1).send({}).expect(404);
      });

      it(`DELETE ${rootUrl}`, () => {
        return request.delete(rootUrl).set(headers1).expect(404);
      });

      it(`DELETE ${rootUrl}/:id`, () => {
        return request.delete(`${rootUrl}/1`).set(headers1).expect(404);
      });

      it(`HEAD ${rootUrl}/:id`, () => {
        return request.head(`${rootUrl}/1`).set(headers1).expect(404);
      });
    });
    describe(`${baseUrl}/join`, () => {
      const rootUrl = `${baseUrl}/join`;

      it(`GET ${rootUrl}`, async () => {
        // Act:
        const response = await request.get(rootUrl).set(headers1);

        // Assert:
        expect(response.status).to.equal(404);
      });

      it(`POST ${rootUrl}`, async () => {
        // Act:
        const response = await request.post(rootUrl).set(headers1).send({});

        // Assert:
        expect(response.status).to.equal(422);
      });

      it(`PUT ${rootUrl}`, () => {
        return request.put(rootUrl).set(headers1).send({}).expect(404);
      });

      it(`PUT ${rootUrl}/:id`, () => {
        return request.put(`${rootUrl}/1`).set(headers1).send({}).expect(404);
      });

      it(`PATCH ${rootUrl}`, () => {
        return request.patch(rootUrl).set(headers1).send({}).expect(404);
      });

      it(`PATCH ${rootUrl}/:id`, () => {
        return request.patch(`${rootUrl}/1`).set(headers1).send({}).expect(404);
      });

      it(`DELETE ${rootUrl}`, () => {
        return request.delete(rootUrl).set(headers1).expect(404);
      });

      it(`DELETE ${rootUrl}/:id`, () => {
        return request.delete(`${rootUrl}/1`).set(headers1).expect(404);
      });

      it(`HEAD ${rootUrl}/:id`, () => {
        return request.head(`${rootUrl}/1`).set(headers1).expect(404);
      });
    });
    describe(`${baseUrl}/stop`, () => {
      const rootUrl = `${baseUrl}/stop`;

      it(`GET ${rootUrl}`, async () => {
        // Act:
        const response = await request.get(rootUrl).set(headers1);

        // Assert:
        expect(response.status).to.equal(404);
      });

      it(`POST ${rootUrl}`, async () => {
        // Act:
        const response = await request.post(rootUrl).set(headers1);

        // Assert:
        expect(response.status).to.equal(422);
      });

      it(`POST ${rootUrl}/:id`, () => {
        return request.post(`${rootUrl}/1`).set(headers1).send({}).expect(404);
      });

      it(`PUT ${rootUrl}`, () => {
        return request.put(rootUrl).set(headers1).send({}).expect(404);
      });

      it(`PUT ${rootUrl}/:id`, () => {
        return request.put(`${rootUrl}/1`).set(headers1).send({}).expect(404);
      });

      it(`PATCH ${rootUrl}`, () => {
        return request.patch(rootUrl).set(headers1).send({}).expect(404);
      });

      it(`PATCH ${rootUrl}/:id`, () => {
        return request.patch(`${rootUrl}/1`).set(headers1).send({}).expect(404);
      });

      it(`DELETE ${rootUrl}`, () => {
        return request.delete(rootUrl).set(headers1).expect(404);
      });

      it(`DELETE ${rootUrl}/:id`, () => {
        return request.delete(`${rootUrl}/1`).set(headers1).expect(404);
      });

      it(`HEAD ${rootUrl}/:id`, () => {
        return request.head(`${rootUrl}/1`).set(headers1).expect(404);
      });
    });
    describe(`E2e`, () => {
      it(`should start and join game`, async () => {
        // Act:
        const responseStart = await request.post(`${baseUrl}/start`).set(headers1).send({});

        // Assert:
        expect(responseStart.status, JSON.stringify(responseStart.body)).to.equal(201);
        const sessionCode = responseStart.body.code;

        // Act:
        const responseJoin = await request.post(`${baseUrl}/join`).set(headers2).send({ code: sessionCode });

        // Assert:
        expect(responseJoin.status, JSON.stringify(responseJoin.body)).to.equal(200);
      });
      it(`should start, join and stop game`, async () => {
        // Act:
        const responseStart = await request.post(`${baseUrl}/start`).set(headers1).send({});

        // Assert:
        expect(responseStart.status, JSON.stringify(responseStart.body)).to.equal(201);
        const sessionCode = responseStart.body.code;

        // Act:
        const responseJoin = await request.post(`${baseUrl}/join`).set(headers2).send({ code: sessionCode });

        // Assert:
        expect(responseJoin.status, JSON.stringify(responseJoin.body)).to.equal(200);
        const joinedSession = responseJoin.body;
        expect(joinedSession.firstUserId, JSON.stringify(joinedSession)).to.not.be.undefined;
        expect(joinedSession.secondUserId, JSON.stringify(joinedSession)).to.not.be.undefined;

        // Act:
        const responseStop = await request.post(`${baseUrl}/stop`).set(headers2).send({ code: sessionCode });

        // Assert:
        expect(responseStop.status, JSON.stringify(responseStop.body)).to.equal(200);
        const stoppedSession = responseStop.body;
        expect(stoppedSession.firstUserId, JSON.stringify(stoppedSession)).to.not.be.undefined;
        expect(stoppedSession.secondUserId, JSON.stringify(stoppedSession)).to.not.be.undefined;
      });
    });
  });
});
