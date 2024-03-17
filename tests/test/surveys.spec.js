const { request, expect, baseSurveysUrl } = require("../config.js");
const { authUser, generateSurveyBody, authUser2 } = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, sleep } = require("../helpers/helpers.js");

describe(`Endpoint ${baseSurveysUrl}`, () => {
  const baseUrl = baseSurveysUrl;

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

      describe(`${baseUrl}`, () => {
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

      describe(`${baseUrl}`, () => {
        it(`GET ${baseUrl}`, async () => {
          // Act:
          const response = await request.get(baseUrl);

          // Assert:
          expect(response.status).to.equal(401);
        });
        it(`GET ${baseUrl}/:id`, async () => {
          // Act:
          const response = await request.get(`${baseUrl}/1`);

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
    ["/survey-responses"].forEach((endpoint) => {
      let baseUrl = rootUrl + endpoint;

      describe(`${baseUrl}`, () => {
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
    ["/statistics"].forEach((endpoint) => {
      let baseUrl = rootUrl + endpoint;

      describe(`${baseUrl}`, () => {
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
    const rootUrl = baseUrl;
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

    describe("/questions", () => {
      describe("GET", () => {
        it(`GET ${baseUrl}/1/questions/1 - should return existing question`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/1/questions/1").set(headers1);

          // Assert:
          expect(response.status).to.equal(200);
        });
        it(`GET ${baseUrl}/1/questions/0000 - should not return not existing question`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/1/questions/0000").set(headers1);

          // Assert:
          expect(response.status).to.equal(404);
        });
        it(`GET ${baseUrl}/1/questions/ - should not return anything`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/1/questions/").set(headers1);

          // Assert:
          expect(response.status).to.equal(404);
        });
        it(`GET ${baseUrl}/questions/1 - should not return not existing question`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/questions/1").set(headers1);

          // Assert:
          expect(response.status).to.equal(404);
        });
        it(`GET ${baseUrl}/questions/0000 - should not return not existing question`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/questions/0000").set(headers1);

          // Assert:
          expect(response.status).to.equal(404);
        });
        it(`GET ${baseUrl}/questions/ - should not return anything`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/questions/").set(headers1);

          // Assert:
          expect(response.status).to.equal(404);
        });
        it(`GET ${baseUrl}/0000/questions/1 - should not return not existing question`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/0000/questions/1").set(headers1);

          // Assert:
          expect(response.status).to.equal(404);
        });
        it(`GET ${baseUrl}/0000/questions/0000 - should not return not existing question`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/0000/questions/0000").set(headers1);

          // Assert:
          expect(response.status).to.equal(404);
        });
        it(`GET ${baseUrl}/0000/questions/ - should not return anything`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/0000/questions/").set(headers1);

          // Assert:
          expect(response.status).to.equal(404);
        });
      });
    });
    describe("/responses", () => {
      describe("POST", () => {
        it(`POST ${baseUrl} - should not create a survey response with empty body`, async () => {
          // Act:
          const response = await request
            .post(baseUrl + "/responses")
            .set(headers1)
            .send({});

          // Assert:
          expect(response.status).to.equal(422);
        });
        it(`POST ${baseUrl} - should not create a survey response for not existing survey`, async () => {
          // Arrange:
          const survey = generateSurveyBody(userId1, 10110111101, [{ test: 0 }]);

          // Act:
          const response = await request
            .post(baseUrl + "/responses")
            .set(headers1)
            .send(survey);

          // Assert:
          expect(response.status).to.equal(422);
        });
        it(`POST ${baseUrl} - should create a survey response`, async () => {
          // Arrange:
          const survey = generateSurveyBody(userId1, 2, [{ test: 0 }]);

          // Act:
          const response = await request
            .post(baseUrl + "/responses")
            .set(headers1)
            .send(survey);

          // Assert:
          expect(response.status).to.equal(201);
        });
        it(`POST ${baseUrl} - should overwrite a survey response`, async () => {
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
      describe("GET", () => {
        it(`GET ${baseUrl} - should not get a not existing survey response`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/responses/1123").set(headers1);

          // Assert:
          expect(response.status, JSON.stringify(response.body)).to.equal(404);
        });
        it(`GET ${baseUrl} - should not get a survey response of another user`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/responses/1").set(headers1);

          // Assert:
          expect(response.status, JSON.stringify(response.body)).to.equal(404);
        });
        it(`GET ${baseUrl} - should get users survey response`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/responses/5").set(headers1);

          // Assert:
          expect(response.status, JSON.stringify(response.body)).to.equal(200);
        });
        it(`GET ${baseUrl} - should get all users survey responses`, async () => {
          // Act:
          const response = await request.get(baseUrl + "/responses").set(headers1);

          // Assert:
          expect(response.status, JSON.stringify(response.body)).to.equal(200);
          expect(response.body.length).to.be.greaterThan(0);
        });
      });
    });

    ["/statistics"].forEach((endpoint) => {
      describe(endpoint, () => {
        let baseUrl = rootUrl + endpoint;

        it(`GET ${baseUrl}/:id - should return valid stats`, async () => {
          // Act:
          const response = await request.get(`${baseUrl}/1`).set(headers1);

          // Assert:
          expect(response.status, JSON.stringify(response.body)).to.equal(200);
          expect(Object.keys(response.body).length, JSON.stringify(response.body)).to.be.greaterThan(0);
        });
        it(`GET ${baseUrl}/:id - should not return stats for not existing survey`, async () => {
          // Act:
          const response = await request.get(`${baseUrl}/0011`).set(headers1);

          // Assert:
          expect(response.status).to.equal(404);
        });
        it(`GET ${baseUrl}`, async () => {
          // Act:
          const response = await request.get(baseUrl).set(headers1);

          // Assert:
          expect(response.status).to.equal(404);
        });
        it(`POST ${baseUrl}`, () => {
          return request.post(baseUrl).set(headers1).send({}).expect(404);
        });

        it(`POST ${baseUrl}/:id`, () => {
          return request.post(`${baseUrl}/1`).set(headers1).send({}).expect(404);
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
    });
  });
});
