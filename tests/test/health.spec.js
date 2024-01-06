const { gracefulQuit, setupEnv } = require("../helpers/helpers.js");
const { baseApiUrl, request, expect } = require("../config.js");

describe("Endpoints /health, /about and /ping", async () => {
  const baseUrl = baseApiUrl;

  before(async () => {
    await setupEnv();
  });

  after(() => {
    gracefulQuit();
  });

  it("GET /about", async () => {
    // Act:
    const response = await request.get(baseUrl + "/about");

    // Assert:
    expect(response.status).to.equal(200);
    expect(response.body.name, `name in ${JSON.stringify(response.body)}`).not.to.equal(undefined);
    expect(response.body.version, `version in ${JSON.stringify(response.body)}`).not.to.equal(undefined);
    expect(response.body.author, `author in ${JSON.stringify(response.body)}`).not.to.equal(undefined);
    expect(response.body.description, `description in ${JSON.stringify(response.body)}`).not.to.equal(undefined);
    expect(response.body.repository, `repository in ${JSON.stringify(response.body)}`).not.to.equal(undefined);
  });

  it("GET /ping", async () => {
    // Act:
    const response = await request.get(baseUrl + "/ping");

    // Assert:
    expect(response.status).to.equal(200);
  });

  it("GET /health/run", async () => {
    // Act:
    const response = await request.get(baseUrl + "/health/check");

    // Assert:
    expect(response.status).to.equal(200);
  });

  it("GET /health", async () => {
    // Act:
    const response = await request.get(baseUrl + "/health");

    // Assert:
    expect(response.status).to.equal(200);
    expect(response.body.health, `health in ${JSON.stringify(response.body)}`).not.to.equal(undefined);
    expect(response.body.health.memoryUsageMB, `memoryUsageMB in ${JSON.stringify(response.body)}`).not.to.equal(
      undefined
    );
  });

  it("GET /health/memory", async () => {
    // Act:
    const response = await request.get(baseUrl + "/health/memory");

    // Assert:
    expect(response.status).to.equal(200);
    expect(response.body.rss, `rss in ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    expect(response.body.heapTotal, `heapTotal in ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    expect(response.body.heapUsed, `heapUsed in ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    expect(response.body.external, `external in ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    expect(response.body.arrayBuffers, `arrayBuffers in ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
  });

  it("GET /health/uptime", async () => {
    // Act:
    const response = await request.get(baseUrl + "/health/uptime");

    // Assert:
    expect(response.status).to.equal(200);
    expect(response.body.uptime, `uptime in ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
  });

  it("GET /health/db", async () => {
    // Act:
    const response = await request.get(baseUrl + "/health/db");

    // Assert:
    expect(response.status).to.equal(200);
    expect(response.body.entities.users, `users in ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    expect(response.body.entities.articles, `articles in ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    expect(response.body.entities.comments, `comments in ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    expect(response.body.entities.likes, `likes in ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
    expect(response.body.entities.labels, `labels in ${JSON.stringify(response.body)}`).to.be.greaterThan(0);
  });
});
