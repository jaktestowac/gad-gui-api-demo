const { logDebug, logTrace } = require("./logger-api");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const { areStringsEqualIgnoringCase } = require("./compare.helpers");

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

function formatNoFieldsErrorResponse(isValid, all_fields) {
  return formatErrorResponse(`No fields were provided! ${isValid.error}`, all_fields);
}

function formatNonStringFieldErrorResponse(isValid, field) {
  return formatErrorResponse(`Field value is not a string: ${isValid?.error}`, field);
}

function formatInvalidFieldValueErrorResponse(isValid, field) {
  return formatErrorResponse(`Field value is invalid: ${isValid?.error}`, field);
}

function formatInvalidDateFieldErrorResponse(isValid, fields = ["date"]) {
  return formatErrorResponse(`Date field is invalid: ${isValid.error}`, fields);
}

function formatNotUniqueFieldResponse(field) {
  return formatErrorResponse(`Field "${field}" is not unique!`);
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

// TODO: DEPRECATED: Remove this code after the new admin / role system is implemented
/**
 * @deprecated This function is deprecated and will be removed in future versions.
 */
function isSuperAdminUser(email, pass) {
  return (
    areStringsEqualIgnoringCase(email, getConfigValue(ConfigKeys.SUPER_ADMIN_USER_EMAIL)) &&
    pass === getConfigValue(ConfigKeys.SUPER_ADMIN_USER_PASS)
  );
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

function generateUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function jsonToBase64(object) {
  const json = JSON.stringify(object);
  return Buffer.from(json).toString("base64");
}

function base64ToJson(base64String) {
  const json = Buffer.from(base64String, "base64").toString();
  return JSON.parse(json);
}

function isHexColor(str) {
  if (str === undefined || str === null) return false;
  if (typeof str !== "string") return false;
  if (str.length !== 7) return false;
  if (str.charAt(0) !== "#") return false;

  return /^#[0-9A-F]{6}$/i.test(str);
}

function validateCardNumber(cardNumber, length) {
  if (cardNumber === undefined) {
    return false;
  }

  cardNumber = cardNumber.replace(/\s/g, "");

  if (cardNumber.length !== length) {
    return false;
  }

  if (!/^\d+$/.test(cardNumber)) {
    return false;
  }

  return true;
}

function validateDate(date) {
  if (date === undefined) {
    return false;
  }

  const actualDate = date.replace(/[^0-9-]/g, "");
  const dateParts = actualDate.split("-");

  if (dateParts.length !== 3) {
    return false;
  }

  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]);
  const day = parseInt(dateParts[2]);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return false;
  }

  const currentDate = new Date();
  const expirationDateValue = new Date(year, month - 1, day);

  if (
    expirationDateValue.getFullYear() !== year ||
    expirationDateValue.getMonth() !== month - 1 ||
    expirationDateValue.getDate() !== day
  ) {
    return false;
  }

  if (expirationDateValue < currentDate) {
    return false;
  }

  return true;
}

function formatCardNumberPretty(cardNumber) {
  if (cardNumber === undefined) {
    return "";
  }

  cardNumber = cardNumber.replace(/\s/g, "");
  // format from "12345678901234562121" to "1234 5678 9012 3456 2121"
  return cardNumber.replace(/(.{4})/g, "$1 ");
}

function cardNumberFormat(cardNumber) {
  if (cardNumber === undefined) {
    return "";
  }

  cardNumber = cardNumber.replace(/-/g, "");
  return cardNumber.replace(/\s/g, "");
}

function hideCardNumber(cardNumber) {
  const cardNumberFormatted = cardNumberFormat(cardNumber);
  return cardNumberFormatted.slice(0, 16).replace(/\d/g, "*") + cardNumberFormatted.slice(16);
}

function isValidNumber(value) {
  return Number.isInteger(parseInt(value));
}

function isStringValidNumberInRange(value, min, max) {
  const number = parseInt(value);
  return Number.isInteger(number) && number >= min && number <= max;
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
  isSuperAdminUser,
  getIdFromUrl,
  shuffleArray,
  pad,
  findMaxValues,
  getUniqueValues,
  formatInvalidFieldValueErrorResponse,
  filterSelectedKeys,
  generateRandomString,
  isTrueWithProbability,
  listIncludes,
  generateUuid,
  jsonToBase64,
  base64ToJson,
  formatNotUniqueFieldResponse,
  isHexColor,
  formatNoFieldsErrorResponse,
  validateCardNumber,
  validateDate,
  formatCardNumberPretty,
  hideCardNumber,
  isValidNumber,
  isStringValidNumberInRange,
  formatNonStringFieldErrorResponse,
};
