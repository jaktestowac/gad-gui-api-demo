const { expect, request, baseLoginUrl } = require("../config");
const { generateValidUserLoginData } = require("../helpers/data.helpers");
const { gracefulQuit, setupEnv } = require("../helpers/helpers");

describe("Endpoint /login", () => {
  const baseUrl = baseLoginUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  it("POST /login - valid login", async () => {
    // Arrange:
    const userData = generateValidUserLoginData();

    // Act:
    const response = await request.post(baseUrl).send(userData);

    // Assert:
    expect(response.status).to.equal(200);
  });

  it("GET /login - validate if token is correct and user is logged in", async () => {
    // Arrange:
    const userData = generateValidUserLoginData();

    // Act:
    const response = await request.post(baseUrl).send(userData);

    // Assert:
    expect(response.status).to.equal(200);

    // Arrange:
    const token = response.body.access_token;
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Act:
    const responseGet = await request.get(baseUrl).set(headers);

    // Assert:
    expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(200);
  });

  it("GET /login - no header", async () => {
    // Arrange:

    // Act:
    const responseGet = await request.get(baseUrl);

    // Assert:
    expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(401);
  });

  it("GET /login - invalid token", async () => {
    // Arrange:
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer 1234`,
    };

    // Act:
    const responseGet = await request.get(baseUrl).set(headers);

    // Assert:
    expect(responseGet.status, JSON.stringify(responseGet.body)).to.equal(401);
  });

  it("POST /login - empty data", async () => {
    // Arrange:
    const userData = {};

    // Act:
    const response = await request.post(baseUrl).send(userData);

    // Assert:
    expect(response.status).to.equal(401);
  });

  ["", 0, true, undefined].forEach((testValue) => {
    it(`POST /login - invalid pass - "${testValue}"`, async () => {
      // Arrange:
      const userData = generateValidUserLoginData();
      userData.password = testValue;

      // Act:
      const response = await request.post(baseUrl).send(userData);

      // Assert:
      expect(response.status).to.equal(401);
    });
  });

  ["", 0, true, undefined].forEach((testValue) => {
    it(`POST /login - invalid email - "${testValue}"`, async () => {
      // Arrange:
      const userData = generateValidUserLoginData();
      userData.email = testValue;

      // Act:
      const response = await request.post(baseUrl).send(userData);

      // Assert:
      expect(response.status).to.equal(401);
    });
  });

  it("POST /login - invalid data", async () => {
    // Arrange:
    const userData = undefined;

    // Act:
    const response = await request.post(baseUrl).send(userData);

    // Assert:
    expect(response.status).to.equal(401);
  });
});
