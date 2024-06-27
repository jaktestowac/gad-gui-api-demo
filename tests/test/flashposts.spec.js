const { baseFlashpostsUrl, request, expect } = require("../config.js");
const { authUser } = require("../helpers/data.helpers.js");
const { setupEnv, gracefulQuit, sleep } = require("../helpers/helpers.js");

describe.only("Endpoint /flashposts", async () => {
  const baseUrl = baseFlashpostsUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  describe("Without auth", () => {
    describe("GET /:resources", () => {
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

      it("GET /flashposts/:id", async () => {
        // Act:
        const response = await request.get(`${baseUrl}/1`);

        // Assert:
        expect(response.status).to.equal(200);
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
        return request.patch(baseUrl).send({}).expect(501);
      });

      it("PATCH /flashposts/:id", () => {
        return request.patch(`${baseUrl}/1`).send({}).expect(501);
      });

      it("DELETE /flashposts", () => {
        return request.delete(baseUrl).expect(501);
      });

      it("DELETE /flashposts/:id", () => {
        return request.delete(`${baseUrl}/1`).expect(501);
      });

      it("HEAD /flashposts", () => {
        return request.head(`${baseUrl}/1`).expect(200);
      });
    });
  });

  describe("With auth", () => {
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
      expect(response.body.length).to.be.greaterThan(1);
    });

    [
      {
        body: "Test content",
        is_public: true,
      },
      {
        body: "Test content",
        is_public: false,
      },
      {
        body: "Test content",
      },
      {
        body: "Test content",
        is_public: true,
        settings: {
          color: "#FF0000",
        },
      },
    ].forEach((flashpost) => {
      it("POST /flashposts - create valid flashpost", async () => {
        // get base number of flashposts:
        const responseGet = await request.get(baseUrl).set(headers);
        const baseCount = responseGet.body.length;

        // Act:
        const response = await request.post(baseUrl).set(headers).send(flashpost);

        await sleep(500);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(201);

        // get final number of flashposts:

        const responseGetFinal = await request.get(baseUrl).set(headers);
        expect(responseGetFinal.body.length).to.be.equal(baseCount + 1);
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
  });
});
