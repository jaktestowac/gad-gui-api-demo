const { getConfigValue } = require("../config/configSingleton");
const { ConfigKeys } = require("../config/enums");
const { formatErrorResponse } = require("./helpers");
const { verifyToken, getJwtExpiryDate } = require("./jwtauth");
const { logDebug, logError, logTrace, logWarn } = require("./loggerApi");
const { HTTP_UNAUTHORIZED } = require("./response.helpers");

const mandatory_non_empty_fields_user = ["firstname", "lastname", "email", "avatar"];
const all_fields_user = ["id", "firstname", "lastname", "email", "avatar", "password", "birthdate"];
const mandatory_non_empty_fields_article = ["user_id", "title", "body", "date"];
const all_fields_article = ["id", "user_id", "title", "body", "date", "image"];
const mandatory_non_empty_fields_comment = ["user_id", "article_id", "body", "date"];
const all_fields_comment = ["id", "user_id", "article_id", "body", "date"];
const all_fields_plugin = ["id", "name", "status", "version"];
const mandatory_non_empty_fields_plugin = ["name", "status", "version"];

function is_plugin_status_valid(body) {
  if (pluginStatuses.findIndex((status) => status === body["status"]) === -1) {
    return false;
  }
  return true;
}

function are_mandatory_fields_valid(body, mandatory_non_empty_fields) {
  for (let index = 0; index < mandatory_non_empty_fields.length; index++) {
    const element = mandatory_non_empty_fields[index];
    if (body[element] === undefined || body[element] === "" || body[element]?.length === 0) {
      logDebug(`Field validation: field ${element} not valid ${body[element]}`);
      return false;
    }
  }
  return true;
}

function are_all_fields_valid(
  body,
  all_possible_fields,
  mandatory_non_empty_fields,
  max_field_length = 10000,
  max_title_length = 128
) {
  if (body?.length !== undefined && body?.length > 0) {
    return { status: false, error: "Wrong JSON structure" };
  }
  const keys = Object.keys(body);

  let error = "";
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (!all_possible_fields.includes(key)) {
      error = `Field validation: "${key}" not in [${all_possible_fields}]`;
      logError(error);
      return { status: false, error };
    }
    const element = body[key];
    if (element?.toString().length > max_field_length) {
      error = `Field validation: "${key}" longer than "${max_field_length}"`;
      logError(error);
      return { status: false, error };
    }
    if (key.toLowerCase() === "title" && element?.toString().length > max_title_length) {
      error = `Field validation: "${key}" longer than "${max_title_length}"`;
      logError(error);
      return { status: false, error };
    }
    if (mandatory_non_empty_fields.includes(key)) {
      if (element === undefined || element?.toString().length === 0) {
        logDebug("Body:", body);
        error = `Field validation: "${key}" is empty! Mandatory fields: [${mandatory_non_empty_fields}]`;
        logError(error);
        return { status: false, error };
      }
    }
    if (key === "date") {
      if (!validateDate(element)) {
        logDebug("Body:", body);
        error = `Field validation: "${key}" has invalid format!`;
        logError(error);
        return { status: false, error };
      }
    }
  }
  return { status: true, error };
}

const validateEmail = (email) => {
  return email.match(getConfigValue(ConfigKeys.EMAIL_REGEXP));
};

const validateDate = (date) => {
  return date.match(getConfigValue(ConfigKeys.DATE_REGEXP));
};

const verifyAccessToken = (req, res, endopint = "endpoint", url = "") => {
  const authorization = req.headers["authorization"];
  let access_token = undefined ? "" : authorization?.split(" ")[1];

  let verifyTokenResult = verifyToken(access_token);
  logTrace(`[${endopint}] verifyAccessToken:`, { access_token, verifyTokenResult, authorization, url });

  // when checking admin we do not send response
  if (endopint !== "isAdmin" && verifyTokenResult instanceof Error) {
    res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
    return false;
  }

  if (verifyTokenResult?.exp !== undefined) {
    const current_time = Date.now() / 1000;
    const diff = Math.round(verifyTokenResult.exp - current_time);
    logTrace(`[${endopint}] getJwtExpiryDate:`, {
      current_time: current_time,
      exp: verifyTokenResult.exp,
      diff,
      expiryDate: getJwtExpiryDate(diff),
    });
    if (current_time > verifyTokenResult?.exp) {
      logWarn(`[${endopint}] getJwt Expired`);
    }
  }

  return verifyTokenResult;
};

module.exports = {
  validateDate,
  validateEmail,
  are_all_fields_valid,
  are_mandatory_fields_valid,
  is_plugin_status_valid,
  mandatory_non_empty_fields_user,
  all_fields_user,
  all_fields_article,
  mandatory_non_empty_fields_article,
  mandatory_non_empty_fields_comment,
  all_fields_comment,
  mandatory_non_empty_fields_plugin,
  all_fields_plugin,
  verifyAccessToken,
};
