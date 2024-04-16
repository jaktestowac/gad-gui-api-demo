const { getConfigValue, isBugEnabled } = require("../config/config-manager");
const { ConfigKeys, BugConfigKeys } = require("../config/enums");
const { isUndefined } = require("./compare.helpers");
const { verifyToken, getJwtExpiryDate } = require("./jwtauth");
const { logDebug, logError, logTrace, logWarn, logInsane } = require("./logger-api");

const mandatory_non_empty_fields_user = ["firstname", "lastname", "email", "avatar"];
const all_fields_user = ["id", "firstname", "lastname", "email", "avatar", "password", "birthdate"];
const mandatory_non_empty_fields_article = ["user_id", "title", "body", "date"];
const mandatory_non_empty_fields_labels = ["user_id", "name"];
const mandatory_non_empty_fields_article_labels = ["article_id", "label_ids"];
const mandatory_non_empty_fields_likes = ["user_id", "comment_id", "article_id"];
const all_fields_article = ["id", "user_id", "title", "body", "date", "image"];
const mandatory_non_empty_fields_comment = ["user_id", "article_id", "body", "date"];
const mandatory_non_empty_fields_comment_create = ["article_id", "body", "date"];
const all_fields_comment = ["id", "user_id", "article_id", "body", "date"];
const all_fields_comment_create = ["id", "article_id", "body", "date"];
const all_fields_plugin = ["id", "name", "status", "version"];
const mandatory_non_empty_fields_plugin = ["name", "status", "version"];
const mandatory_non_empty_fields_survey = ["user_id", "date", "type", "answers"];

function isLikesDataValid(body) {
  if (!isUndefined(body["comment_id"]) && !isUndefined(body["article_id"])) {
    logDebug(`Field validation: only one field can be non empty - comment_id or article_id`, { body });
    return false;
  }
  if (isUndefined(body["comment_id"]) && isUndefined(body["article_id"])) {
    logDebug(`Field validation: at least one field must be not empty - comment_id or article_id`, { body });
    return false;
  }
  if (isUndefined(body["user_id"])) {
    logDebug(`Field validation: user_id is empty`);
    return false;
  }
  return true;
}

function areMandatoryFieldsPresent(body, mandatory_non_empty_fields) {
  if (isBugEnabled(BugConfigKeys.BUG_VALIDATION_001)) {
    return true;
  }

  for (let index = 0; index < mandatory_non_empty_fields.length; index++) {
    const element = mandatory_non_empty_fields[index];
    if (isUndefined(body[element]) || body[element] === "" || body[element]?.length === 0) {
      logDebug(`Field validation: field ${element} not valid ${body[element]}`);
      return false;
    }
  }
  return true;
}

function getTotalObjectLength(obj) {
  const jsonString = JSON.stringify(obj);
  return jsonString.length;
}

function isObjectLengthValid(obj, maxLength = 20000) {
  let error = "";
  const totalLength = getTotalObjectLength(obj);
  if (totalLength > maxLength) {
    error = `Field validation: object length: ${totalLength} longer than "${maxLength}"`;
    logError("isObjectLengthValid:", error);
    return { status: false, error };
  }
  return { status: true, error };
}

function areAllFieldsPresent(body, all_possible_fields) {
  let error = "";
  const keys = Object.keys(body);
  for (let index = 0; index < all_possible_fields.length; index++) {
    const key = all_possible_fields[index];
    if (!keys.includes(key)) {
      error = `Field validation: "${key}" not in [${all_possible_fields}]`;
      logError("areAllFieldsPresent:", error);
      return { status: false, error };
    }
  }
  return { status: true, error };
}

function isFieldsLengthValid(body, max_field_length = 10000) {
  let error = "";
  const keys = Object.keys(body);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const element = body[key];
    if (element?.toString().length > max_field_length) {
      error = `Field validation: "${key}" longer than "${max_field_length}"`;
      logError("isFieldsLengthValid:", error);
      return { status: false, error };
    }
  }
  return { status: true, error };
}

function validateDateFields(body, fields = ["date"]) {
  let error = "";
  const keys = Object.keys(body);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const element = body[key];
    if (fields.includes(key)) {
      const isValid = isDateValid(element);
      if (isValid === false) {
        logDebug("validateDateFields: Body:", body);
        error = `Field validation: "${key}" has invalid date format!`;
        return { status: false, error };
      }

      const result = isDateInFuture(element);
      if (result.isDateInFuture === true) {
        logError("validateDateFields: Body:", { body, result });
        error = `Field validation: "${key}" has date in future! Application date: "${result.currentDate}" Input date: "${result.inputDate}"`;
        return { status: false, error };
      }
    }
  }
  return { status: true, error };
}

function areAllFieldsValid(
  body,
  all_possible_fields,
  mandatory_non_empty_fields,
  max_field_length = 10000,
  max_title_length = 128
) {
  if (isBugEnabled(BugConfigKeys.BUG_VALIDATION_002)) {
    max_title_length = 0;
  }
  if (!isUndefined(body?.length) && body?.length > 0) {
    return { status: false, error: "Wrong JSON structure" };
  }
  const keys = Object.keys(body);

  let error = "";
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (!all_possible_fields.includes(key)) {
      error = `Field validation: "${key}" not in [${all_possible_fields}]`;
      logError("areAllFieldsValid:", error);
      return { status: false, error };
    }
    const element = body[key];
    if (element?.toString().length > max_field_length) {
      error = `Field validation: "${key}" longer than "${max_field_length}"`;
      logError("areAllFieldsValid:", error);
      return { status: false, error };
    }
    if (key.toLowerCase() === "title" && element?.toString().length > max_title_length) {
      error = `Field validation: "${key}" longer than "${max_title_length}"`;
      logError("areAllFieldsValid:", error);
      return { status: false, error };
    }
    if (mandatory_non_empty_fields.includes(key)) {
      if (isUndefined(element) || element?.toString().length === 0) {
        logDebug("areAllFieldsValid: Body:", body);
        error = `Field validation: "${key}" is empty! Mandatory fields: [${mandatory_non_empty_fields}]`;
        logError(error);
        return { status: false, error };
      }
    }
    if (key === "date") {
      if (!isDateValid(element)) {
        logDebug("areAllFieldsValid: Body:", body);
        error = `Field validation: "${key}" has invalid format!`;
        logError(error);
        return { status: false, error };
      }
    }
  }
  return { status: true, error };
}

const isEmailValid = (email) => {
  return email.match(getConfigValue(ConfigKeys.EMAIL_REGEXP));
};

const isDateValid = (date) => {
  try {
    return date.match(getConfigValue(ConfigKeys.DATE_REGEXP));
  } catch (error) {
    logDebug("Invalid date:", date);
    return false;
  }
};

function isDateInFuture(dateString) {
  const inputDate = new Date(dateString);
  const timezoneOffset = inputDate.getTimezoneOffset();
  const currentDate = new Date();
  currentDate.setMinutes(currentDate.getMinutes() - timezoneOffset);
  currentDate.setSeconds(currentDate.getSeconds() + 10); // add possibility of offset
  logTrace("isDateInFuture:", { dateString, inputDate, currentDate });

  if (isBugEnabled(BugConfigKeys.BUG_VALIDATION_007)) {
    return true;
  }
  if (isBugEnabled(BugConfigKeys.BUG_VALIDATION_008)) {
    return false;
  }

  return { isDateInFuture: inputDate > currentDate, dateString, inputDate, currentDate };
}

const verifyAccessToken = (req, res, endpoint = "endpoint", url = "") => {
  const authorization = req.headers["authorization"];
  let access_token = authorization?.split(" ")[1];

  let logFunction = logTrace;
  if (endpoint === "isAdmin") {
    logFunction = logInsane;
  }

  let verifyTokenResult = verifyToken(access_token);
  logFunction(`[${endpoint}] verifyAccessToken:`, { access_token, verifyTokenResult, authorization, url });

  // when checking admin we do not send response
  if (endpoint !== "isAdmin" && verifyTokenResult instanceof Error) {
    logInsane(`[${endpoint}] verifyAccessToken soft Error:`, { endpoint, verifyTokenResult });
    return undefined;
  }

  if (!isUndefined(verifyTokenResult?.exp)) {
    const current_time = Date.now() / 1000;
    const diff = Math.round(verifyTokenResult.exp - current_time);

    logFunction(`[${endpoint}] getJwtExpiryDate:`, {
      current_time: current_time,
      exp: verifyTokenResult.exp,
      diff,
      expiryDate: getJwtExpiryDate(diff),
    });
    if (current_time > verifyTokenResult?.exp) {
      logWarn(`[${endpoint}] getJwt Expired`);
    }
  }

  return verifyTokenResult;
};

module.exports = {
  isDateValid,
  isEmailValid,
  areAllFieldsValid,
  areAllFieldsPresent,
  areMandatoryFieldsPresent,
  mandatory_non_empty_fields_user,
  all_fields_user,
  all_fields_article,
  mandatory_non_empty_fields_article,
  mandatory_non_empty_fields_comment,
  all_fields_comment,
  mandatory_non_empty_fields_plugin,
  all_fields_plugin,
  verifyAccessToken,
  mandatory_non_empty_fields_likes,
  isLikesDataValid,
  mandatory_non_empty_fields_labels,
  mandatory_non_empty_fields_article_labels,
  mandatory_non_empty_fields_comment_create,
  mandatory_non_empty_fields_survey,
  all_fields_comment_create,
  validateDateFields,
  isFieldsLengthValid,
  isObjectLengthValid,
};
