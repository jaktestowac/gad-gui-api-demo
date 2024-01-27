const { serverApp } = require("../../server");
const { request, expect, logLevel } = require("../config");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function gracefulQuit() {
  serverApp.close();
}

async function setupEnv() {
  const restoreResponse = await request.get("/api/restoreDB");
  expect(restoreResponse.status).to.equal(201);
  // Lower log level to WARNING:
  const requestBody = {
    currentLogLevel: logLevel,
  };
  const response = await request.post("/api/config/all").send(requestBody);
  expect(response.status).to.equal(200);

  // Enable all feature flags:
  const requestFeatureBody = {
    feature_likes: true,
    feature_files: true,
    feature_labels: true,
    feature_user_bookmark_articles: true,
  };
  const responseFeature = await request.post("/api/config/features").send(requestFeatureBody);

  expect(responseFeature.status).to.equal(200);
}

module.exports = {
  sleep,
  gracefulQuit,
  setupEnv,
};
