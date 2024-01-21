const { gracefulQuit, setupEnv } = require("../helpers/helpers.js");
const { aboutUrl, request, expect } = require("../config.js");
const fs = require("fs");
const path = require("path");

describe("Version check", async () => {
  const baseUrl = aboutUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  it("GET /about version", async () => {
    // Act:
    const response = await request.get(baseUrl);

    // Assert:
    expect(response.status).to.equal(200);
    expect(response.body.version).to.contain("v");
  });

  it("GET /about version and pageFooter", async () => {
    // Act:
    const response = await request.get(baseUrl);
    const pageFooter = fs.readFileSync(path.join(__dirname, "..", "..", "public", "version.js"), "utf8");

    // Assert:
    expect(response.status).to.equal(200);
    expect(pageFooter).to.contain(response.body.version);
  });

  it("package version", async () => {
    // Act:
    const response = await request.get(baseUrl);
    const packageData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "package.json"), "utf8"));

    // Assert:
    expect(response.status).to.equal(200);
    expect(response.body.version).to.be.equal("v" + packageData.version);
  });

  it("app version", async () => {
    // Act:
    const response = await request.get(baseUrl);
    const appData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "app.json"), "utf8"));

    // Assert:
    expect(response.status).to.equal(200);
    expect(appData.version).to.be.equal(response.body.version);
  });
});
