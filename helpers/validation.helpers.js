const { dateRegexp, emailRegexp } = require("../config");
const { logDebug } = require("./loggerApi");

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
      error = `Field validation: ${key} not in ${all_possible_fields}`;
      logDebug(error);
      return { status: false, error };
    }
    const element = body[key];
    if (element?.toString().length > max_field_length) {
      error = `Field validation: ${key} longer than ${max_field_length}`;
      logDebug(error);
      return { status: false, error };
    }
    if (key.toLowerCase() === "title" && element?.toString().length > max_title_length) {
      error = `Field validation: ${key} longer than ${max_title_length}`;
      logDebug(error);
      return { status: false, error };
    }
    if (mandatory_non_empty_fields.includes(key)) {
      if (element === undefined || element?.toString().length === 0) {
        logDebug("Body:", body);
        error = `Field validation: ${key} is empty! Mandatory fields: ${mandatory_non_empty_fields}`;
        logDebug(error);
        return { status: false, error };
      }
    }
    if (key === "date") {
      if (!validateDate(element)) {
        logDebug("Body:", body);
        error = `Field validation: ${key} has invalid format!`;
        logDebug(error);
        return { status: false, error };
      }
    }
  }
  return { status: true, error };
}

const validateEmail = (email) => {
  return email.match(emailRegexp);
};

const validateDate = (date) => {
  return date.match(dateRegexp);
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
};
