const { gracefulQuit, setupEnv } = require("../helpers/helpers.js");
const { languagesUrl, request, expect } = require("../config.js");

describe("Translations and languages", async () => {
  const baseUrl = languagesUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  it(`GET ${languagesUrl} - should return language list`, async () => {
    // Act:
    const response = await request.get(baseUrl);

    // Assert:
    expect(response.status, JSON.stringify(response.body)).to.equal(200);
    expect(Object.keys(response.body)).to.contain("en");
    expect(response.body["en"]).to.contain("🇬🇧&nbsp;English");
    expect(Object.keys(response.body)).to.contain("pl");
    expect(response.body["pl"]).to.contain("🇵🇱&nbsp;Polski");
  });

  it(`GET ${languagesUrl}/en - should return 404`, async () => {
    // Act:
    const response = await request.get(baseUrl + "/en");

    // Assert:
    expect(response.status, JSON.stringify(response.body)).to.equal(404);
  });

  it(`GET ${languagesUrl}/translations - should return all translations`, async () => {
    // Act:
    const response = await request.get(baseUrl + "/translations");

    // Assert:
    expect(response.status, JSON.stringify(response.body)).to.equal(200);
    expect(Object.keys(response.body).length).to.be.greaterThan(0);
    expect(Object.keys(response.body)).to.contain("en");
    expect(Object.keys(response.body)).to.contain("pl");
  });

  ["/translations/en", "/translations/pl", "/translations/jp", "/translations/de"].forEach((url) => {
    it(`GET ${languagesUrl}${url} - should return translations`, async () => {
      // Act:
      const response = await request.get(baseUrl + url);

      // Assert:
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
      expect(Object.keys(response.body).length).to.be.greaterThan(0);
      expect(Object.keys(response.body)).to.contain("_name");
    });
  });

  it(`GET ${languagesUrl}/translations/xyz - should return empty list`, async () => {
    // Act:
    const response = await request.get(baseUrl + "/translations/xyz");

    // Assert:
    expect(response.status, JSON.stringify(response.body)).to.equal(200);
    expect(Object.keys(response.body).length).to.be.equal(0);
  });
});
