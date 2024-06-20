const { expect, request, baseCaptchaUrl, baseUsersUrl } = require("../config");
const { authUser, generateValidUserData } = require("../helpers/data.helpers");
const { gracefulQuit, setupEnv, toggleFeatures, jsonToBase64, changeConfig } = require("../helpers/helpers");

describe("Endpoint /captcha", async () => {
  const baseUrl = baseCaptchaUrl;

  before(async () => {
    await setupEnv();
    await toggleFeatures(["feature_captcha"]);
    await changeConfig({ captchaSolutionInResponse: true });
  });

  after(async () => {
    await toggleFeatures(["feature_captcha"], false);
    gracefulQuit();
  });

  describe("Without auth", async () => {
    it("GET /captcha", async () => {
      // Act:
      const response = await request.get(`${baseUrl}`);

      // Assert:
      expect(response.status).to.equal(200);
      expect(response.body.equation.length, `Response was: ${JSON.stringify(response.body)}`).to.be.greaterThanOrEqual(
        0
      );
      expect(response.body.uuid.length, `Response was: ${JSON.stringify(response.body)}`).to.be.greaterThanOrEqual(0);
    });
    it("POST /captcha with empty body", async () => {
      // Act:
      const response = await request.post(`${baseUrl}`).send({});

      // Assert:
      expect(response.status).to.equal(422);
    });
    it("POST /captcha with invalid uuid", async () => {
      // Arrange:
      const body = {
        uuid: "invalid",
        result: 5,
      };

      // Act:
      const response = await request.post(`${baseUrl}`).send(body);

      // Assert:
      expect(response.status).to.equal(404);
    });
    it("POST /captcha with invalid result", async () => {
      // Act:
      const responseWithCaptcha = await request.get(`${baseUrl}`);

      // Assert:
      expect(responseWithCaptcha.status).to.equal(200);

      // Arrange:
      const body = {
        uuid: responseWithCaptcha.body.uuid,
        result: 5,
      };

      // Act:
      const response = await request.post(`${baseUrl}`).send(body);

      // Assert:
      expect(response.status).to.equal(400);
    });
    it("POST /captcha with valid result", async () => {
      // Act:
      const responseWithCaptcha = await request.get(`${baseUrl}`);

      // Assert:
      expect(responseWithCaptcha.status).to.equal(200);

      // Arrange:
      const body = {
        uuid: responseWithCaptcha.body.uuid,
        result: responseWithCaptcha.body.result,
      };

      // Act:
      const response = await request.post(`${baseUrl}`).send(body);

      // Assert:
      expect(response.status).to.equal(200);
    });
    it("POST /captcha - new captcha is generated after invalid response", async () => {
      // Act:
      const responseWithCaptcha = await request.get(`${baseUrl}`);

      // Assert:
      expect(responseWithCaptcha.status).to.equal(200);

      // Arrange:
      const body = {
        uuid: responseWithCaptcha.body.uuid,
        result: 5,
      };

      // Act:
      const response = await request.post(`${baseUrl}`).send(body);

      // Assert:
      expect(response.status).to.equal(400);

      // Act:
      const responseWithCaptcha2 = await request.get(`${baseUrl}`);

      // Assert:
      expect(responseWithCaptcha2.status).to.equal(200);

      expect(body.uuid).not.to.equal(responseWithCaptcha2.body.uuid);
    });
    it("POST /captcha - old captcha is not found after invalid result", async () => {
      // Act:
      const responseWithCaptcha = await request.get(`${baseUrl}`);

      // Assert:
      expect(responseWithCaptcha.status).to.equal(200);

      // Arrange:
      const body = {
        uuid: responseWithCaptcha.body.uuid,
        result: 5,
      };

      // Act:
      const response = await request.post(`${baseUrl}`).send(body);

      // Assert:
      expect(response.status).to.equal(400);

      // Act:
      const response2 = await request.post(`${baseUrl}`).send(body);

      // Assert:
      expect(response2.status).to.equal(404);
    });
    describe("register endpoint", async () => {
      it("POST /users with no captcha header", async () => {
        // Arrange:
        const body = {
          username: "test",
          password: "test",
          birthdate: "2000-01-01",
          avatar: "1",
        };

        // Act:
        const response = await request.post(`${baseUsersUrl}`).send(body);

        // Assert:
        expect(response.status).to.equal(422);
      });
      it("POST /users with invalid captcha uuid", async () => {
        // Arrange:
        const body = {
          username: "test",
          password: "test",
          birthdate: "2000-01-01",
          avatar: "1",
        };

        const captcha = {
          uuid: "invalid",
          result: 5,
        };

        const headers = {
          captcha: jsonToBase64(captcha),
        };

        // Act:
        const response = await request.post(`${baseUsersUrl}`).send(body).set(headers);

        // Assert:
        expect(response.status).to.equal(404);
      });
      it("POST /users with invalid captcha result", async () => {
        // Arrange:
        const body = {
          username: "test",
          password: "test",
          birthdate: "2000-01-01",
          avatar: "1",
        };

        // Act:
        const responseWithCaptcha = await request.get(`${baseUrl}`);

        // Assert:
        expect(responseWithCaptcha.status).to.equal(200);

        const captcha = {
          uuid: responseWithCaptcha.body.uuid,
          result: 5,
        };

        const headers = {
          captcha: jsonToBase64(captcha),
        };

        // Act:
        const response = await request.post(`${baseUsersUrl}`).send(body).set(headers);

        // Assert:
        expect(response.status).to.equal(400);

        // Lets do it again - old captcha should not be found
        // Act:
        const response2 = await request.post(`${baseUsersUrl}`).send(body).set(headers);

        // Assert:
        expect(response2.status).to.equal(404);
      });
      it("POST /users with valid captcha result and user was created", async () => {
        // Arrange:
        const body = generateValidUserData();

        // Act:
        const responseWithCaptcha = await request.get(`${baseUrl}`);

        // Assert:
        expect(responseWithCaptcha.status).to.equal(200);

        const captcha = {
          uuid: responseWithCaptcha.body.uuid,
          result: responseWithCaptcha.body.result,
        };

        const headers = {
          captcha: jsonToBase64(captcha),
        };

        // Act:
        const response = await request.post(`${baseUsersUrl}`).send(body).set(headers);

        // Assert:
        expect(response.status, JSON.stringify(response.body)).to.equal(201);
      });
    });
  });

  describe("With auth", () => {
    let headers;
    before(async () => {
      const data = await authUser();
      headers = data.headers;
    });
  });
});
