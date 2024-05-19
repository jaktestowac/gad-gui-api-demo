const { logDebug, logTrace } = require("./logger-api");
const { getConfigValue, isBugDisabled } = require("../config/config-manager");
const { ConfigKeys, BugConfigKeys } = require("../config/enums");
const { areStringsEqualIgnoringCase, isUndefined } = require("./compare.helpers");

function formatErrorResponse(message, details = undefined, id = undefined) {
  const body = { error: { message: message, details: details }, id };
  logDebug("formatErrorResponse:", body);
  return body;
}

function formatInvalidTokenErrorResponse() {
  return formatErrorResponse("Access token for given user is invalid!");
}

function formatTooManyValuesErrorResponse(valueType) {
  return formatErrorResponse(`Too many values of type: ${valueType}!`);
}

function formatInvalidEntityErrorResponse(valueType) {
  return formatErrorResponse(`Invalid entity - invalid ID or entity does not exist: ${valueType}!`);
}

function formatInvalidFieldErrorResponse(isValid, all_fields) {
  return formatErrorResponse(
    `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
    all_fields
  );
}

function formatInvalidFieldValueErrorResponse(isValid, field) {
  return formatErrorResponse(`Field value is invalid: ${isValid?.error}`, field);
}

function formatInvalidDateFieldErrorResponse(isValid, fields = ["date"]) {
  return formatErrorResponse(`Date field is invalid: ${isValid.error}`, fields);
}

function formatMissingFieldErrorResponse(all_fields) {
  return formatErrorResponse("One of mandatory field is missing", all_fields);
}

function formatOnlyOneFieldPossibleErrorResponse(all_fields) {
  return formatErrorResponse("Only one field must not be empty!", all_fields);
}

function getIdFromUrl(urlEnds) {
  const urlParts = urlEnds.split("/");
  let id = urlParts[urlParts.length - 1];
  return id;
}

function isTrueWithProbability(probability) {
  return Math.random() < probability;
}

function sleep(ms, msg) {
  if (ms > 0 || msg !== undefined) {
    logTrace(`Sleeping for ${ms} ms...`, msg);
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isAdminUser(email, pass) {
  return (
    areStringsEqualIgnoringCase(email, getConfigValue(ConfigKeys.ADMIN_USER_EMAIL)) &&
    pass === getConfigValue(ConfigKeys.ADMIN_USER_PASS)
  );
}

function isSuperAdminUser(email, pass) {
  return (
    areStringsEqualIgnoringCase(email, getConfigValue(ConfigKeys.SUPER_ADMIN_USER_EMAIL)) &&
    pass === getConfigValue(ConfigKeys.SUPER_ADMIN_USER_PASS)
  );
}

function isAnyAdminUser(email, pass) {
  return isAdminUser(email, pass) || isSuperAdminUser(email, pass);
}

function pad(num, size = 2) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

function shuffleArray(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

function getTodayDate() {
  const today = new Date();
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(
    today.getHours()
  )}:${pad(today.getMinutes())}:${pad(today.getSeconds())}Z`;
  return date;
}

function getTodayDateForFileName() {
  const today = new Date();
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(
    today.getHours()
  )}-${pad(today.getMinutes())}-${pad(today.getSeconds())}Z`;
  return date;
}

function findMaxValues(obj, count) {
  const values = Object.values(obj);
  const sortedValues = values.sort((a, b) => b - a);
  const maxValues = sortedValues.slice(0, count);

  const maxObjects = {};
  for (const key in obj) {
    if (maxValues.includes(obj[key])) {
      maxObjects[key] = obj[key];
    }
  }

  return maxObjects;
}

const getUniqueValues = (inputList) => [...new Set(inputList.map(Number))];

function filterSelectedKeys(obj, selectedKeys) {
  const newObj = {};
  for (const key in obj) {
    const lowercaseKey = key.toLowerCase();
    if (selectedKeys.map((k) => k.toLowerCase()).includes(lowercaseKey)) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

function listIncludes(list, value) {
  return list.map((v) => v.toString()).includes(value.toString());
}

module.exports = {
  formatErrorResponse,
  formatInvalidFieldErrorResponse,
  formatMissingFieldErrorResponse,
  formatInvalidTokenErrorResponse,
  formatTooManyValuesErrorResponse,
  formatOnlyOneFieldPossibleErrorResponse,
  formatInvalidEntityErrorResponse,
  formatInvalidDateFieldErrorResponse,
  sleep,
  isAdminUser,
  isSuperAdminUser,
  isAnyAdminUser,
  getIdFromUrl,
  shuffleArray,
  pad,
  getTodayDate,
  getTodayDateForFileName,
  findMaxValues,
  getUniqueValues,
  formatInvalidFieldValueErrorResponse,
  filterSelectedKeys,
  generateRandomString,
  isTrueWithProbability,
  listIncludes,
};
