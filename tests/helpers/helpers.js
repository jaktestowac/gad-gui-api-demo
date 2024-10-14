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
  today.setHours(today.getHours() + hours);
  today.setMinutes(today.getMinutes() + minutes);
  today.setSeconds(today.getSeconds() + seconds);

  const year = today.getFullYear();
  const month = pad(today.getMonth() + 1);
  const day = pad(today.getDate());
  const hour = pad(today.getHours());
  const minute = pad(today.getMinutes());
  const second = pad(today.getSeconds());

  const date = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;

  return date;
}

function addOffsetToDateString(date, offset) {
  const newDate = date.replace("Z", offset);

  return newDate;
}

function getISODateWithTimezoneOffset(date) {
  const timezoneOffset = -date.getTimezoneOffset();
  const dif = timezoneOffset >= 0 ? "+" : "-";

  const currentDatetime =
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds());

  const timezoneDif = dif + pad(Math.floor(Math.abs(timezoneOffset) / 60)) + ":" + pad(Math.abs(timezoneOffset) % 60);

  return currentDatetime + timezoneDif;
}

async function setupEnv() {
  const restoreResponse = await request.get("/api/restoreDB");
  expect(restoreResponse.status).to.equal(201);
  // Lower log level to WARNING:
  const requestBody = {
    currentLogLevel: logLevel,
  };
  await changeConfig(requestBody);

  // Enable all feature flags:
  await toggleFeatures(["feature_likes", "feature_files", "feature_labels", "feature_user_bookmark_articles"]);

  // eslint-disable-next-line no-console
  console.log("Environment setup done.");
}

async function changeConfig(requestBody) {
  const response = await request.post("/api/config/all").send(requestBody);
  expect(response.status).to.equal(200);
}

async function toggleFeatures(features, enabled = true) {
  const requestBody = {};
  features.forEach((feature) => {
    requestBody[feature] = enabled;
  });
  const response = await request.post("/api/config/features").send(requestBody);
  expect(response.status).to.equal(200);
}

async function toggle404Bug(value) {
  const requestBody = {
    bug_404_if_article_created_recently: value,
  };
  const response = await request.post("/api/config/bugs").send(requestBody);
  expect(response.status).to.equal(200);
}

function jsonToBase64(object) {
  const json = JSON.stringify(object);
  return btoa(json);
}

async function invokeRequestUntil(id, request, condition, maxAttempts = 10, delay = 200) {
  let attempts = 0;
  let response;
  while (attempts < maxAttempts) {
    response = await request();
    const result = condition(response);
    if (result) {
      console.log(`[${id}] Attempt ${attempts + 1} succeeded with result: ${result}`);
      break;
    }
    attempts++;
    console.log(`[${id}] Attempt ${attempts} failed. Retrying in ${delay} ms.`);
    await sleep(delay);
  }

  return response;
}

module.exports = {
  sleep,
  gracefulQuit,
  setupEnv,
  getCurrentDate,
  toggle404Bug,
  getISODateWithTimezoneOffset,
  addOffsetToDateString,
  toggleFeatures,
  jsonToBase64,
  changeConfig,
  invokeRequestUntil,
};
