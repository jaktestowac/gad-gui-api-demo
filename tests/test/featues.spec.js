const { expect, request, baseFeatureCheckUrl, baseFeaturesCheckUrl } = require("../config");
const { gracefulQuit, setupEnv } = require("../helpers/helpers");

describe("Endpoint config/feature", async () => {
  before(async () => {
    await setupEnv();
  });

  after(async () => {
    gracefulQuit();
  });

  describe(`Endpoint ${baseFeatureCheckUrl}`, async () => {
    it("POST with empty body", async () => {
      // Act:
      const response = await request.post(`${baseFeatureCheckUrl}`).send({});

      // Assert:
      expect(response.status).to.equal(200);
      expect(Object.keys(response.body).length, JSON.stringify(response.body)).to.equal(1);
      expect(response.body["enabled"], JSON.stringify(response.body)).to.equal(false);
    });
    it("POST with one feature to check", async () => {
      // Arrange:
      const body = {
        name: "feature_likes",
      };

      // Act:
      const response = await request.post(`${baseFeatureCheckUrl}`).send(body);

      // Assert:
      expect(response.status).to.equal(200);
      expect(Object.keys(response.body).length, JSON.stringify(response.body)).to.equal(2);
      expect(response.body["name"], JSON.stringify(response.body)).to.equal(body.name);
      expect(response.body["enabled"], JSON.stringify(response.body)).to.equal(true);
    });
    it("POST with one not existing feature to check", async () => {
      // Arrange:
      const body = {
        name: "2123",
      };

      // Act:
      const response = await request.post(`${baseFeatureCheckUrl}`).send(body);

      // Assert:
      expect(response.status).to.equal(200);
      expect(Object.keys(response.body).length, JSON.stringify(response.body)).to.equal(2);
      expect(response.body["name"], JSON.stringify(response.body)).to.equal(body.name);
      expect(response.body["enabled"], JSON.stringify(response.body)).to.equal(false);
    });
  });

  describe(`Endpoint ${baseFeaturesCheckUrl}`, async () => {
    it("POST with empty body", async () => {
      // Act:
      const response = await request.post(`${baseFeaturesCheckUrl}`).send({});

      // Assert:
      expect(response.status).to.equal(200);
      expect(Object.keys(response.body).length, JSON.stringify(response.body)).to.equal(1);
      expect(response.body["enabled"], JSON.stringify(response.body)).to.equal(false);
    });
    it("POST with one feature to check", async () => {
      // Arrange:
      const body = {
        names: ["feature_likes"],
      };

      // Act:
      const response = await request.post(`${baseFeaturesCheckUrl}`).send(body);

      // Assert:
      expect(response.status).to.equal(200);
      expect(Object.keys(response.body).length, JSON.stringify(response.body)).to.equal(1);
      expect(response.body["feature_likes"], JSON.stringify(response.body)).to.equal(true);
    });
    it("POST with one not existing feature to check", async () => {
      // Arrange:
      const body = {
        names: ["feature_1233"],
      };

      // Act:
      const response = await request.post(`${baseFeaturesCheckUrl}`).send(body);

      // Assert:
      expect(response.status).to.equal(200);
      expect(Object.keys(response.body).length, JSON.stringify(response.body)).to.equal(1);
      expect(response.body["feature_1233"], JSON.stringify(response.body)).to.equal(false);
    });
    it("POST with two feature to check", async () => {
      // Arrange:
      const body = {
        names: ["feature_likes", "feature_files"],
      };

      // Act:
      const response = await request.post(`${baseFeaturesCheckUrl}`).send(body);

      // Assert:
      expect(response.status).to.equal(200);
      expect(Object.keys(response.body).length, JSON.stringify(response.body)).to.equal(2);
      expect(response.body["feature_likes"], JSON.stringify(response.body)).to.equal(true);
      expect(response.body["feature_files"], JSON.stringify(response.body)).to.equal(true);
    });
    it("POST with zero feature to check", async () => {
      // Arrange:
      const body = {
        names: [],
      };

      // Act:
      const response = await request.post(`${baseFeaturesCheckUrl}`).send(body);

      // Assert:
      expect(response.status).to.equal(200);
      expect(Object.keys(response.body).length, JSON.stringify(response.body)).to.equal(0);
    });
  });
});
