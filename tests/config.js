const { serverApp } = require("../server.js");
const request = require("supertest")(serverApp);
let expect = require("chai").expect;
const { faker } = require("@faker-js/faker");

const baseApiUrl = "/api";
const baseArticlesUrl = "/api/articles";
const baseUsersUrl = "/api/users";
const baseHangmanUrl = "/api/hangman";
const baseQuizUrl = "/api/quiz";
const baseStatsUrl = "/api/stats";
const baseCommentsUrl = "/api/comments";

const sleepTime = 50; // in ms

module.exports = {
  expect,
  request,
  faker,
  baseApiUrl,
  baseArticlesUrl,
  baseUsersUrl,
  baseHangmanUrl,
  baseQuizUrl,
  baseStatsUrl,
  baseCommentsUrl,
  sleepTime,
};
