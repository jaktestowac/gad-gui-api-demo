const { getConfigValue, isBugEnabled } = require("../config/config-manager");
const { ConfigKeys, BugConfigKeys } = require("../config/enums");
const { isUndefined } = require("./compare.helpers");
const { getDateTimeFromString } = require("./datetime.helpers");
const { verifyToken, getJwtExpiryDate } = require("./jwtauth");
const { logDebug, logError, logTrace, logWarn, logInsane } = require("./logger-api");

const mandatory_non_empty_fields_user = ["firstname", "lastname", "email", "avatar"];
const all_fields_user = ["id", "firstname", "lastname", "email", "avatar", "password", "birthDate"];
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
const mandatory_non_empty_fields_message = ["to", "content"];
const mandatory_non_empty_fields_flashpost = ["user_id", "body"];
const all_possible_fields_flashpost = ["user_id", "body", "settings", "date", "id", "is_public"];
const all_possible_fields_book_shop_account = ["country", "city", "street", "postal_code"];
const mandatory_non_empty_fields_flashpost_settings = ["color"];
const mandatory_non_empty_fields_body = [
  "title",
  "author_ids",
  "published_at",
  "genre_ids",
  "language",
  "pages",
  "cover",
  "description",
];

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

function areAnyFieldsPresent(body) {
  const keys = Object.keys(body);
  if (keys.length === 0) {
    logDebug(`Field validation: no fields present in body`);
    return { status: false, error: "Field validation: no fields present in body" };
  }
  return { status: true, error: "" };
}

function areAnyAdditionalFieldsPresent(body, all_possible_fields) {
  const keys = Object.keys(body);
  logTrace("areAnyAdditionalFieldsPresent:", { keys, all_possible_fields, body });
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (!all_possible_fields.includes(key)) {
      logDebug(`Field validation: additional field ${key} not in [${all_possible_fields}]`);
      return { status: true, error: `Field validation: additional field ${key} not in [${all_possible_fields}]` };
    }
  }
  return { status: false, error: "" };
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
        logInsane("validateDateFields: Body:", { body, result });
        error = `Field validation: "${key}" has date in future! Application date: "${result.applicationDate}" Input date: "${result.inputDate}"`;
        logError("validateDateFields: Body:", { error, result });
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

function isDateInFuture(inputRawDateString, applicationDateString = undefined) {
  const inputDate = getDateTimeFromString(inputRawDateString);
  let inputDateTimezoneOffsetInMinutes = 0;
  let inputDateTimezoneOffsetInHours = 0;

  const offsetRegex = /([+-])(\d{2}):(\d{2})$/;
  const match = inputRawDateString.match(offsetRegex);

  if (match) {
    // const sign = match[1];
    // const hours = parseInt(match[2], 10);
    // const minutes = parseInt(match[3], 10);
    // // Calculate total offset in minutes
    // inputDateTimezoneOffsetInMinutes = minutes;
    // inputDateTimezoneOffsetInHours = hours;
    // if (sign === "-") {
    //   inputDateTimezoneOffsetInMinutes = -inputDateTimezoneOffsetInMinutes;
    //   inputDateTimezoneOffsetInHours = -inputDateTimezoneOffsetInHours;
    // }
  } else {
    inputDateTimezoneOffsetInMinutes = inputDate.getTimezoneOffset();
    inputDateTimezoneOffsetInHours = Math.floor(inputDateTimezoneOffsetInMinutes / 60);
    inputDateTimezoneOffsetInMinutes -= inputDateTimezoneOffsetInHours * 60;

    inputDateTimezoneOffsetInMinutes = -inputDateTimezoneOffsetInMinutes;
    inputDateTimezoneOffsetInHours = -inputDateTimezoneOffsetInHours;
  }

  let applicationDate = new Date();
  let applicationDateRaw = new Date();

  if (applicationDateString !== undefined) {
    applicationDate = getDateTimeFromString(applicationDateString);
    applicationDateRaw = getDateTimeFromString(applicationDateString);
  }
  applicationDate.setHours(applicationDate.getHours() + inputDateTimezoneOffsetInHours);
  applicationDate.setMinutes(applicationDate.getMinutes() + inputDateTimezoneOffsetInMinutes);
  applicationDate.setSeconds(applicationDate.getSeconds() + 10); // add possibility of offset
  const differenceInSeconds = Math.round((inputDate - applicationDate) / 1000);
  let isDateInFuture = inputDate > applicationDate;

  logTrace("isDateInFuture:", {
    isDateInFuture,
    inputDate,
    applicationDate,
    applicationDateRaw,
    inputRawDateString,
    differenceInSeconds,
    inputDateTimezoneOffsetInMinutes,
    inputDateTimezoneOffsetInHours,
  });

  if (isBugEnabled(BugConfigKeys.BUG_VALIDATION_007)) {
    isDateInFuture = false;
  }
  if (isBugEnabled(BugConfigKeys.BUG_VALIDATION_008)) {
    isDateInFuture = false;
  }

  return {
    isDateInFuture,
    inputDate,
    applicationDate,
    applicationDateRaw,
    inputRawDateString,
    differenceInSeconds,
    inputDateTimezoneOffsetInMinutes,
    inputDateTimezoneOffsetInHours,
  };
}

const verifyAccessToken = (req, res, endpoint = "endpoint", url = "") => {
  const authorization = req.headers["authorization"];

  if (isUndefined(authorization)) {
    return undefined;
  }

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
  mandatory_non_empty_fields_message,
  all_fields_comment_create,
  validateDateFields,
  isFieldsLengthValid,
  isObjectLengthValid,
  isDateInFuture,
  mandatory_non_empty_fields_flashpost,
  areAnyAdditionalFieldsPresent,
  areAnyFieldsPresent,
  all_possible_fields_flashpost,
  mandatory_non_empty_fields_flashpost_settings,
  all_possible_fields_book_shop_account,
  mandatory_non_empty_fields_body,
};
