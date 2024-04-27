const { baseArticlesUrl, request, faker, expect } = require("../config.js");
const { authUser, generateValidArticleData } = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, enable404Bug, sleep } = require("../helpers/helpers.js");

describe("Endpoint /articles with slower GAD", async function () {
  const baseUrl = baseArticlesUrl;

  before(async () => {
    await setupEnv();
    await enable404Bug();
  });

  after(() => {
    gracefulQuit();
  });

  describe("With auth", async function () {
    this.timeout(6000);
    let headers;
    let userId;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;
    });

    it("POST /articles - should create article but GAD is slow and GET returns 404", async () => {
      // Arrange:
      const testData = generateValidArticleData();
      testData.user_id = userId;

      // Act:
      const responsePost = await request.post(baseUrl).set(headers).send(testData);

      // Assert:
      expect(responsePost.status).to.equal(201);
      testData.id = responsePost.body.id;
      expect(responsePost.body).to.deep.equal(testData);

      // Act:
      const responseGet = await request.get(`${baseUrl}/${testData.id}`).set(headers);

      // Assert:
      expect(responseGet.status).to.equal(404);

      for (let index = 0; index < 50; index++) {
        const responseGetPoll = await request.get(`${baseUrl}/${testData.id}`).set(headers);
        console.log(`Attempt ${index + 1}: ${responseGetPoll.status}`);
        if (responseGetPoll.status === 200) {
          expect(responseGetPoll.body).to.deep.equal(testData);
          break;
        } else {
          await sleep(500);
        }
      }
    });
  });
});
