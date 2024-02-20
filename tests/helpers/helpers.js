const { serverApp } = require("../../server");
const { request, expect, logLevel } = require("../config");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function gracefulQuit() {
  serverApp.close();
}

function pad(num, size = 2) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

function getCurrentDate(hours = 0, minutes = 0, seconds = 0) {
  const today = new Date();
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(
    today.getHours() + hours
  )}:${pad(today.getMinutes() + minutes)}:${pad(today.getSeconds() + seconds)}Z`;

  return date;
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
  getCurrentDate,
};
