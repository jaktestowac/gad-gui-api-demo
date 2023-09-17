const { serverApp } = require("../../../server");
const { request, expect } = require("../config");

function sleep(ms) {
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
    currentLogLevel: 2,
  };
  const response = await request.post("/api/config").send(requestBody);
  expect(response.status).to.equal(200);
}

module.exports = {
  sleep,
  gracefulQuit,
  setupEnv,
};
