const { baseFlashpostsUrl, request, expect } = require("../config.js");
const { authUser } = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, sleep, invokeRequestUntil } = require("../helpers/helpers.js");

describe("Endpoint /flashposts", async () => {
  const baseUrl = baseFlashpostsUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", async () => {
    describe("GET /:resources", async () => {
      it("GET /flashposts", async () => {
        // Act:
        const response = await request.get(baseUrl);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.length).to.be.greaterThan(0);

        // check if all posts are public:
        response.body.forEach((post) => {
          expect(post.is_public).to.be.true;
        });
      });

      it("GET /flashposts/:id private [KNOWN BUG]", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/1`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.is_public).to.equal(undefined);
      });

      it("GET /flashposts/:id public", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/2`);

        // Assert:
        expect(response.status).to.equal(200);
        expect(response.body.is_public).to.equal(true);
      });

      it("GET /flashposts/:id - non existing flashposts", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/112312312`);

        // Assert:
        expect(response.status).to.equal(404);
      });

      it("POST /flashposts", () => {
        return request.post(baseUrl).send({}).expect(401);
      });

      it("PUT /flashposts", () => {
        return request.put(baseUrl).send({}).expect(501);
      });

      it("PUT /flashposts/:id", () => {
        return request.put(`${baseUrl}/1`).send({}).expect(501);
      });

      it("PATCH /flashposts", () => {
        return request.patch(baseUrl).send({}).expect(404);
      });

      it("PATCH /flashposts/:id", () => {
        return request.patch(`${baseUrl}/1`).send({}).expect(401);
      });

      it("DELETE /flashposts", () => {
        return request.delete(baseUrl).expect(404);
      });

      it("DELETE /flashposts/:id", () => {
        return request.delete(`${baseUrl}/1`).expect(401);
      });

      it("HEAD /flashposts", () => {
        return request.head(`${baseUrl}/1`).expect(200);
      });
    });
  });

  describe("With auth", async () => {
    this.timeout(6000);
    let headers;
    let userId;

    beforeEach(async () => {
      const data = await authUser();
      headers = data.headers;
      userId = data.userId;
    });

    it("GET /flashposts", async () => {
      // Act:
      const response = await request.get(baseUrl).set(headers);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.length, JSON.stringify(response.body)).to.be.greaterThan(1);
    });

    [
      {
        body: "Test1",
        is_public: true,
      },
      {
        body: "Test2",
        is_public: false,
      },
      {
        body: "Test3",
      },
      {
        body: "Test4",
        is_public: true,
        settings: {
          color: "#FF0000",
        },
      },
    ].forEach(async (flashpost) => {
      it("POST /flashposts - create valid flashpost", async () => {
        // get base number of flashposts:
        const responseGet = await request.get(baseUrl).set(headers);
        const baseCount = responseGet.body.length;

        // Act:
        const response = await request.post(baseUrl).set(headers).send(flashpost);

        // Assert:
        invokeRequestUntil(
          flashpost.body,
          async () => {
            return await request.get(baseUrl).set(headers);
          },
          (response) => {
            return response.body.length === baseCount + 1;
          }
        ).then((response) => {
          expect(response.body.length, JSON.stringify(response.body)).to.be.equal(baseCount + 1);
        });
      });
    });

    [
      {
        body: "Test content",
        is_public: true,
        settings: {
          color: "red",
        },
      },
    ].forEach((flashpost) => {
      it("POST /flashposts - invalid color field", async () => {
        // get base number of flashposts:
        const responseGet = await request.get(baseUrl).set(headers);
        const baseCount = responseGet.body.length;

        // Act:
        const response = await request.post(baseUrl).set(headers).send(flashpost);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(422);

        // get final number of flashposts:
        const responseGetFinal = await request.get(baseUrl).set(headers);
        expect(responseGetFinal.body.length).to.be.equal(baseCount);
      });
    });
    it("PATCH /flashposts - correct update", async () => {
      const baseBody = {
        body: "Test content",
        is_public: true,
        settings: {
          color: "#000000",
        },
      };

      const baseBodyUpdated = {
        body: "Test content 2",
        is_public: false,
        settings: {
          color: "#dddddd",
        },
      };

      // Act:
      const responsePost = await request.post(baseUrl).set(headers).send(baseBody);
      await sleep(500);

      const newUrl = `${baseUrl}/${responsePost.body.id}`;

      // Act:
      const responsePatch = await request.patch(newUrl).set(headers).send(baseBodyUpdated);

      // Assert:
      expect(responsePatch.status, JSON.stringify(responsePatch.body)).to.equal(200);
      await sleep(500);

      const responseGet = await request.get(newUrl);

      delete responseGet.body.date;
      baseBodyUpdated.id = responsePost.body.id;
      baseBodyUpdated.user_id = userId;

      // Assert:
      expect(responseGet.body, JSON.stringify(responsePatch.body)).to.eql(baseBodyUpdated);
    });
    it("DELETE /flashposts - valid remove", async () => {
      const baseBody = {
        body: "Test content",
        is_public: true,
        settings: {
          color: "#000000",
        },
      };

      const responsePost = await request.post(baseUrl).set(headers).send(baseBody);
      await sleep(500);

      const newUrl = `${baseUrl}/${responsePost.body.id}`;

      // Act:
      const responseDelete = await request.delete(newUrl).set(headers);

      // Assert:
      expect(responseDelete.status, JSON.stringify(responseDelete.body)).to.equal(200);
      await sleep(500);

      const responseGet = await request.get(newUrl);
      expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(404);
    });
  });
});
