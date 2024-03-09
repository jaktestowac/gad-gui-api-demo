const { request, expect, baseSurveysManualApiUrl } = require("../config.js");
const { authUser, generateSurveyBody, authUser2 } = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, sleep } = require("../helpers/helpers.js");

describe(`Endpoint ${baseSurveysManualApiUrl}`, () => {
  const baseUrl = baseSurveysManualApiUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe(`Without auth`, () => {
    const rootUrl = baseUrl;
    [""].forEach((endpoint) => {
      let baseUrl = rootUrl + endpoint;

      describe(`Without auth - ${baseUrl}`, () => {
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
    });
    ["/responses"].forEach((endpoint) => {
      let baseUrl = rootUrl + endpoint;

      describe(`Without auth - ${baseUrl}`, () => {
        it(`GET ${baseUrl}`, async () => {
          // Act:
          const response = await request.get(baseUrl);

          // Assert:
          expect(response.status).to.equal(401);
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

        it(`HEAD ${baseUrl}/:id`, () => {
          return request.head(`${baseUrl}/1`).expect(404);
        });
      });
    });
  });
  describe(`With auth - ${baseUrl}`, () => {
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

    describe("GET", () => {
      it(`GET ${baseUrl} - should return existing question`, async () => {
        // Act:
        const response = await request.get(baseUrl + "/questions/1").set(headers1);

        // Assert:
        expect(response.status).to.equal(200);
      });
      it(`GET ${baseUrl} - should not return not existing question`, async () => {
        // Act:
        const response = await request.get(baseUrl + "/questions/0000").set(headers1);

        // Assert:
        expect(response.status).to.equal(404);
      });
      it(`GET ${baseUrl} - should not return anything`, async () => {
        // Act:
        const response = await request.get(baseUrl + "/questions/").set(headers1);

        // Assert:
        expect(response.status).to.equal(404);
      });
    });
    describe("POST", () => {
      it(`POST ${baseUrl} - should not create a survey with empty body`, async () => {
        // Act:
        const response = await request
          .post(baseUrl + "/responses")
          .set(headers1)
          .send({});

        // Assert:
        expect(response.status).to.equal(422);
      });
      it(`POST ${baseUrl} - should create a survey`, async () => {
        // Arrange:
        const survey = generateSurveyBody(userId1, 1, [{ test: 0 }]);

        // Act:
        const response = await request
          .post(baseUrl + "/responses")
          .set(headers1)
          .send(survey);

        // Assert:
        expect(response.status).to.equal(201);
      });
      it(`POST ${baseUrl} - should overwrite a survey`, async () => {
        // Arrange:
        const survey1 = generateSurveyBody(userId2, 1, [{ test: 1 }]);
        const survey2 = generateSurveyBody(userId2, 1, [{ test: 2 }]);

        // Act:
        const response1 = await request
          .post(baseUrl + "/responses")
          .set(headers2)
          .send(survey1);

        // Assert:
        expect(response1.status).to.equal(201);

        await sleep(200); // service is slow

        // Act:
        const response2 = await request
          .post(baseUrl + "/responses")
          .set(headers2)
          .send(survey2);

        // Assert:
        expect(response2.status).to.equal(200);
      });
    });
  });
});
