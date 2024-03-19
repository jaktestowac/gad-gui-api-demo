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
        expect(response.status).to.equal(403);
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
        expect(response.status).to.equal(403);
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
        expect(responseStart.body.code, JSON.stringify(responseStart.body)).to.not.be.undefined;
        expect(responseStart.body.users[0], JSON.stringify(responseStart.body)).to.not.be.undefined;
        expect(responseStart.body.users[1], JSON.stringify(responseStart.body)).to.be.undefined;
        const sessionCode = responseStart.body.code;

        // Act:
        const responseJoin = await request.post(`${baseUrl}/join`).set(headers2).send({ code: sessionCode });

        // Assert:
        expect(responseJoin.status, JSON.stringify(responseJoin.body)).to.equal(200);
        const joinedSession = responseJoin.body;
        expect(joinedSession.users[0], JSON.stringify(joinedSession)).to.not.be.undefined;
        expect(joinedSession.users[1], JSON.stringify(joinedSession)).to.not.be.undefined;
        expect(joinedSession.code, JSON.stringify(joinedSession)).to.not.be.undefined;
        expect(joinedSession.hasStarted, JSON.stringify(joinedSession)).to.be.true;
        expect(joinedSession.hasEnded, JSON.stringify(joinedSession)).to.be.false;
        expect(joinedSession.currentTurn, JSON.stringify(joinedSession)).to.be.equal(0);
      });
      it(`should not join game - already joined`, async () => {
        // Act:
        const responseStart = await request.post(`${baseUrl}/start`).set(headers1).send({});

        // Assert:
        expect(responseStart.status, JSON.stringify(responseStart.body)).to.equal(201);
        expect(responseStart.body.code, JSON.stringify(responseStart.body)).to.not.be.undefined;
        expect(responseStart.body.users[0], JSON.stringify(responseStart.body)).to.not.be.undefined;
        expect(responseStart.body.users[1], JSON.stringify(responseStart.body)).to.be.undefined;
        const sessionCode = responseStart.body.code;

        // Act:
        const responseJoin = await request.post(`${baseUrl}/join`).set(headers2).send({ code: sessionCode });

        // Assert:
        expect(responseJoin.status, JSON.stringify(responseJoin.body)).to.equal(200);

        // Act:
        const responseJoin2 = await request.post(`${baseUrl}/join`).set(headers2).send({ code: sessionCode });

        // Assert:
        expect(responseJoin2.status, JSON.stringify(responseJoin2.body)).to.equal(200);
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
        expect(joinedSession.users[0], JSON.stringify(joinedSession.body)).to.not.be.undefined;
        expect(joinedSession.users[1], JSON.stringify(joinedSession.body)).to.not.be.undefined;

        // Act:
        const responseStop = await request.post(`${baseUrl}/stop`).set(headers2).send({ code: sessionCode });

        // Assert:
        expect(responseStop.status, JSON.stringify(responseStop.body)).to.equal(200);
        const stoppedSession = responseStop.body;
        expect(stoppedSession.users[0], JSON.stringify(stoppedSession)).to.not.be.undefined;
        expect(stoppedSession.users[1], JSON.stringify(stoppedSession)).to.not.be.undefined;
        expect(stoppedSession.hasStarted, JSON.stringify(stoppedSession)).to.be.true;
        expect(stoppedSession.hasEnded, JSON.stringify(stoppedSession)).to.be.true;
        expect(stoppedSession.numberOfMatches, JSON.stringify(stoppedSession)).to.be.equal(1);
      });
      it(`should start, join, switch and stop game`, async () => {
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
        expect(joinedSession.users[0], JSON.stringify(joinedSession)).to.not.be.undefined;
        expect(joinedSession.users[1], JSON.stringify(joinedSession)).to.not.be.undefined;

        // Act:
        const responseStatus1 = await request
          .post(`${baseUrl}/status`)
          .set(headers1)
          .send({ code: sessionCode, move: [1, 1] });

        // Assert:
        expect(responseStatus1.status, JSON.stringify(responseStatus1.body)).to.equal(200);

        // Act:
        const responseStop = await request.post(`${baseUrl}/stop`).set(headers2).send({ code: sessionCode });

        // Assert:
        expect(responseStop.status, JSON.stringify(responseStop.body)).to.equal(200);
        const stoppedSession = responseStop.body;
        expect(stoppedSession.users[0], JSON.stringify(stoppedSession)).to.not.be.undefined;
        expect(stoppedSession.users[1], JSON.stringify(stoppedSession)).to.not.be.undefined;
        expect(stoppedSession.hasStarted, JSON.stringify(stoppedSession)).to.be.true;
        expect(stoppedSession.hasEnded, JSON.stringify(stoppedSession)).to.be.true;
        expect(stoppedSession.numberOfMatches, JSON.stringify(stoppedSession)).to.be.equal(1);
        expect(stoppedSession.currentTurn, JSON.stringify(stoppedSession)).to.be.equal(1);
      });
      it(`should start, join, switch and stop game`, async () => {
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
        expect(joinedSession.users[0], JSON.stringify(joinedSession)).to.not.be.undefined;
        expect(joinedSession.users[1], JSON.stringify(joinedSession)).to.not.be.undefined;

        // Act: first move:
        const responseStatus1 = await request
          .post(`${baseUrl}/status`)
          .set(headers1)
          .send({ code: sessionCode, move: [1, 1] });

        // Assert:
        expect(responseStatus1.status, JSON.stringify(responseStatus1.body)).to.equal(200);

        // Act: first move again - wrong user - should return 422:
        const responseStatus1b = await request
          .post(`${baseUrl}/status`)
          .set(headers1)
          .send({ code: sessionCode, move: [2, 1] });

        // Assert:
        expect(responseStatus1b.status, JSON.stringify(responseStatus1b.body)).to.equal(422);

        // Act: second move:
        const responseStatus2 = await request
          .post(`${baseUrl}/status`)
          .set(headers2)
          .send({ code: sessionCode, move: [1, 2] });

        // Assert:
        expect(responseStatus2.status, JSON.stringify(responseStatus2.body)).to.equal(200);

        // Act: third move - valid user but board field is taken - should return 422:
        const responseStatus3 = await request
          .post(`${baseUrl}/status`)
          .set(headers1)
          .send({ code: sessionCode, move: [1, 2] });

        // Assert:
        expect(responseStatus3.status, JSON.stringify(responseStatus3.body)).to.equal(422);

        // Act: third move - valid user but move out of bounds - should return 422:
        const responseStatus3b = await request
          .post(`${baseUrl}/status`)
          .set(headers1)
          .send({ code: sessionCode, move: [4, 2] });

        // Assert:
        expect(responseStatus3b.status, JSON.stringify(responseStatus3b.body)).to.equal(422);

        // Act: third move again - should pass:
        const responseStatus3c = await request
          .post(`${baseUrl}/status`)
          .set(headers1)
          .send({ code: sessionCode, move: [2, 2] });

        // Assert:
        expect(responseStatus3c.status, JSON.stringify(responseStatus3c.body)).to.equal(200);

        // Act:
        const responseStop = await request.post(`${baseUrl}/stop`).set(headers2).send({ code: sessionCode });

        // Assert:
        expect(responseStop.status, JSON.stringify(responseStop.body)).to.equal(200);
        const stoppedSession = responseStop.body;
        expect(stoppedSession.users[0], JSON.stringify(stoppedSession)).to.not.be.undefined;
        expect(stoppedSession.users[1], JSON.stringify(stoppedSession)).to.not.be.undefined;
        expect(stoppedSession.scores[0], JSON.stringify(stoppedSession)).to.be.equal(0);
        expect(stoppedSession.scores[1], JSON.stringify(stoppedSession)).to.be.equal(0);
        expect(stoppedSession.hasStarted, JSON.stringify(stoppedSession)).to.be.true;
        expect(stoppedSession.hasEnded, JSON.stringify(stoppedSession)).to.be.true;
        expect(stoppedSession.numberOfMatches, JSON.stringify(stoppedSession)).to.be.equal(1);
        expect(stoppedSession.currentTurn, JSON.stringify(stoppedSession)).to.be.equal(3);

        // Act: should not be able to play game after game has ended:
        const responsePlayAfterStop = await request
          .post(`${baseUrl}/status`)
          .set(headers2)
          .send({ code: sessionCode, move: [0, 0] });

        // Assert:
        expect(responsePlayAfterStop.status, JSON.stringify(responsePlayAfterStop.body)).to.equal(422);

        const responsePlayAfterStop2 = await request.get(`${baseUrl}/status/${sessionCode}`).set(headers2);
        expect(responsePlayAfterStop2.status, JSON.stringify(responsePlayAfterStop2.body)).to.equal(200);
        const stoppedSession2 = responsePlayAfterStop2.body;
        expect(stoppedSession2.scores[0], JSON.stringify(stoppedSession2)).to.be.equal(0);
        expect(stoppedSession2.scores[1], JSON.stringify(stoppedSession2)).to.be.equal(0);
        expect(stoppedSession2.hasStarted, JSON.stringify(stoppedSession2)).to.be.true;
        expect(stoppedSession2.hasEnded, JSON.stringify(stoppedSession2)).to.be.true;
        expect(stoppedSession2.numberOfMatches, JSON.stringify(stoppedSession2)).to.be.equal(1);
        expect(stoppedSession2.currentTurn, JSON.stringify(stoppedSession2)).to.be.equal(3);
      });

      it(`should play full game`, async () => {
        // Act:
        const responseStart = await request.post(`${baseUrl}/start`).set(headers1).send({});

        // Assert:
        expect(responseStart.status, JSON.stringify(responseStart.body)).to.equal(201);
        const sessionCode = responseStart.body.code;

        // Act:
        const responseJoin = await request.post(`${baseUrl}/join`).set(headers2).send({ code: sessionCode });

        // Assert:
        expect(responseJoin.status, JSON.stringify(responseJoin.body)).to.equal(200);

        // Act: 1 move:
        const responseStatus1 = await request
          .post(`${baseUrl}/status`)
          .set(headers1)
          .send({ code: sessionCode, move: [0, 0] });

        // Assert:
        expect(responseStatus1.status, JSON.stringify(responseStatus1.body)).to.equal(200);

        // Act: 2 move:
        const responseStatus2 = await request
          .post(`${baseUrl}/status`)
          .set(headers2)
          .send({ code: sessionCode, move: [0, 1] });

        // Assert:
        expect(responseStatus2.status, JSON.stringify(responseStatus2.body)).to.equal(200);

        // Act: 3 move - should pass:
        const responseStatus3 = await request
          .post(`${baseUrl}/status`)
          .set(headers1)
          .send({ code: sessionCode, move: [1, 0] });

        // Assert:
        expect(responseStatus3.status, JSON.stringify(responseStatus3.body)).to.equal(200);

        // Act: 4 move - should pass:
        const responseStatus4 = await request
          .post(`${baseUrl}/status`)
          .set(headers2)
          .send({ code: sessionCode, move: [1, 1] });

        // Assert:
        expect(responseStatus4.status, JSON.stringify(responseStatus4.body)).to.equal(200);

        // Act: 5 move - should pass:
        const responseStatus5 = await request
          .post(`${baseUrl}/status`)
          .set(headers1)
          .send({ code: sessionCode, move: [2, 0] });

        // Assert:
        expect(responseStatus5.status, JSON.stringify(responseStatus5.body)).to.equal(200);

        // Assert:
        expect(responseStatus5.status, JSON.stringify(responseStatus5.body)).to.equal(200);
        const finishedSession = responseStatus5.body;
        expect(finishedSession.scores[0], JSON.stringify(finishedSession)).to.be.equal(1);
        expect(finishedSession.scores[1], JSON.stringify(finishedSession)).to.be.equal(0);
        expect(finishedSession.hasEnded, JSON.stringify(finishedSession)).to.be.true;
        expect(finishedSession.numberOfMatches, JSON.stringify(finishedSession)).to.be.equal(1);
        expect(finishedSession.currentTurn, JSON.stringify(finishedSession)).to.be.equal(5);

        // Act: should not be able to stop game after game has ended:
        const responseStop = await request.post(`${baseUrl}/stop`).set(headers2).send({ code: sessionCode });

        // Assert:
        expect(responseStop.status, JSON.stringify(responseStop.body)).to.equal(200);
        const stoppedSession = responseStop.body;
        expect(stoppedSession.scores[0], JSON.stringify(stoppedSession)).to.be.equal(1);
        expect(stoppedSession.scores[1], JSON.stringify(stoppedSession)).to.be.equal(0);
        expect(stoppedSession.hasEnded, JSON.stringify(stoppedSession)).to.be.true;
        expect(stoppedSession.numberOfMatches, JSON.stringify(stoppedSession)).to.be.equal(1);
        expect(stoppedSession.currentTurn, JSON.stringify(stoppedSession)).to.be.equal(5);
      });
    });
  });
});
