const { request, expect, baseLikesUrl, sleepTime } = require("../config.js");
const { authUser, generateLikesBody } = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, sleep } = require("../helpers/helpers.js");

describe("Endpoint /likes", () => {
  const baseUrl = baseLikesUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", () => {
    it("GET /likes", async () => {
      // Act:
      const response = await request.get(baseUrl);

      // Assert:
      expect(response.status).to.equal(405);
    });

    it("POST /likes", () => {
      return request.post(baseUrl).send({}).expect(401);
    });

    it("PUT /likes", () => {
      return request.put(baseUrl).send({}).expect(401);
    });

    it("PUT /likes/:id", () => {
      return request.put(`${baseUrl}/1`).send({}).expect(401);
    });

    it("PATCH /likes", () => {
      return request.patch(baseUrl).send({}).expect(401);
    });

    it("PATCH /likes/:id", () => {
      return request.patch(`${baseUrl}/1`).send({}).expect(401);
    });

    it("DELETE /likes", () => {
      return request.delete(baseUrl).expect(401);
    });

    it("DELETE /likes/:id", () => {
      return request.delete(`${baseUrl}/1`).expect(401);
    });

    it("HEAD /likes/:id", () => {
      return request.head(`${baseUrl}/1`).expect(200);
    });
  });

  describe("With auth", () => {
    let headers;
    let userId;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;
      headers["userid"] = userId;
    });

    describe("e2e", () => {
      beforeEach(async () => {
        await setupEnv();
        await request.get("/restoreDB");
      });

      [
        ["comment", 1, undefined],
        ["article", undefined, 1],
      ].forEach((dataSet) => {
        it(`POST /likes - ${dataSet[0]} and one more like`, async () => {
          // Arrange:
          const likedBody = generateLikesBody(userId, dataSet[1], dataSet[2]);

          const response = await request.get(`${baseUrl}/${dataSet[0]}/1`).set(headers);

          expect(response.status).to.equal(200);
          const likesBefore = response.body.likes;

          // Act:
          const responsePost = await request.post(baseUrl).set(headers).send(likedBody);

          await sleep(100); // service is slow

          // Assert:
          expect(responsePost.status).to.equal(201);

          const responseGetAfter = await request.get(`${baseUrl}/${dataSet[0]}/1`).set(headers);

          expect(responseGetAfter.status).to.equal(200);
          const likesAfter = responseGetAfter.body.likes;
          expect(likesAfter, JSON.stringify(responseGetAfter.body)).to.equal(likesBefore + 1);
        });
      });

      [
        ["comment", 1, undefined],
        ["article", undefined, 1],
      ].forEach((dataSet) => {
        it(`POST /likes - ${dataSet[0]} liked by same user (unlike) - ${dataSet}`, async () => {
          // Arrange:
          const likedBody = generateLikesBody(userId, dataSet[1], dataSet[2]);

          const response = await request.get(`${baseUrl}/${dataSet[0]}/1`).set(headers);

          expect(response.status).to.equal(200);
          const likesBefore = response.body.likes;

          // Act: first like:
          const responsePost = await request.post(baseUrl).set(headers).send(likedBody);

          // Assert:
          expect(responsePost.status).to.equal(201);
          const responseGetAfterFirstLike = await request.get(`${baseUrl}/${dataSet[0]}/1`).set(headers);
          const likesAfterFirstLike = responseGetAfterFirstLike.body.likes;
          expect(likesAfterFirstLike, JSON.stringify(responseGetAfterFirstLike.body)).to.equal(likesBefore + 1);

          await sleep(sleepTime); // service is slow

          // Act: second like:
          const responsePostAnother = await request.post(baseUrl).set(headers).send(likedBody);

          // Assert:
          expect(responsePostAnother.status).to.equal(200);

          const responseGetAfterAnother = await request.get(`${baseUrl}/${dataSet[0]}/1`).set(headers);

          expect(responseGetAfterAnother.status).to.equal(200);
          const likesAfterAnother = responseGetAfterAnother.body.likes;
          expect(likesAfterAnother, JSON.stringify(responseGetAfterAnother.body)).to.equal(likesBefore);
        });
      });
    });

    describe("GET", () => {
      it("GET /likes", async () => {
        // Act:
        const response = await request.get(baseUrl).set(headers);

        // Assert:
        expect(response.status).to.equal(405);
      });

      it("GET /likes/:id", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/1`).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(405);
      });

      it("GET /likes/article", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/article`).set(headers);

        // Assert:
        expect(response.status).to.equal(405);
      });

      it("GET /likes/article/:id", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/article/1`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.likes, JSON.stringify(response.body)).to.be.greaterThan(0);
      });

      it("GET /likes/comment", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/comment`).set(headers);

        // Assert:
        expect(response.status).to.equal(405);
      });

      it("GET /likes/comment/:id", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/comment/1`).set(headers);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.likes, JSON.stringify(response.body)).to.be.greaterThan(0);
      });
    });

    describe("POST", () => {
      it("POST /likes - empty body", async () => {
        // Act:
        const response = await request.post(baseUrl).set(headers).send({});

        // Assert:
        expect(response.status).to.equal(422);
      });

      it("POST /likes - valid body for comment", async () => {
        // Assert:
        const likedBody = generateLikesBody(userId, 1, undefined);

        // Act:
        const response = await request.post(baseUrl).set(headers).send(likedBody);

        // Assert:
        expect(response.status).to.equal(201);
      });

      it("POST /likes - valid body for article", async () => {
        // Assert:
        const likedBody = generateLikesBody(userId, 1, undefined);

        // Act:
        const response = await request.post(baseUrl).set(headers).send(likedBody);

        // Assert:
        expect(response.status).to.equal(201);
      });

      it("POST /likes - invalid body - article and comment", async () => {
        // Assert:
        const likedBody = generateLikesBody(userId, 1, 1);

        // Act:
        const response = await request.post(baseUrl).set(headers).send(likedBody);

        // Assert:
        expect(response.status).to.equal(422);
      });

      it("POST /likes - invalid body - neither article nor comment", async () => {
        // Assert:
        const likedBody = generateLikesBody(userId, 1, 1);

        // Act:
        const response = await request.post(baseUrl).set(headers).send(likedBody);

        // Assert:
        expect(response.status).to.equal(422);
      });
    });

    it("PUT /likes", async () => {
      // Act:
      const response = await request.put(baseUrl).set(headers).send({});

      // Assert:
      expect(response.status).to.equal(405);
    });

    it("PUT /likes/:id", async () => {
      // Act:
      const response = await request.put(`${baseUrl}/1`).set(headers).send({});

      // Assert:
      expect(response.status).to.equal(405);
    });

    it("PATCH /likes", async () => {
      // Act:
      const response = await request.patch(baseUrl).set(headers).send({});

      // Assert:
      expect(response.status, response.body).to.equal(405);
    });

    it("PATCH /likes/:id", async () => {
      // Act:
      const response = await request.patch(`${baseUrl}/1`).set(headers).send({});

      // Assert:
      expect(response.status).to.equal(405);
    });

    it("DELETE /likes", async () => {
      // Act:
      const response = await request.delete(baseUrl).set(headers);

      // Assert:
      expect(response.status).to.equal(405);
    });

    it("DELETE /likes/:id", async () => {
      // Act:
      const response = await request.delete(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(response.status).to.equal(401);
    });

    it("HEAD /likes", async () => {
      // Act:
      const response = await request.head(`${baseUrl}/1`).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
    });
  });
});
