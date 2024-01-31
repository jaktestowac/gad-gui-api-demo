const { isBugDisabled, isBugEnabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { areStringsEqualIgnoringCase, areIdsEqual, isUndefined } = require("../helpers/compare.helpers");
const { searchForUser } = require("../helpers/db-operation.helpers");
const { userDb } = require("../helpers/db.helpers");
const {
  formatMissingFieldErrorResponse,
  formatErrorResponse,
  getIdFromUrl,
  formatInvalidFieldErrorResponse,
} = require("../helpers/helpers");
const { logDebug } = require("../helpers/logger-api");
const { HTTP_UNPROCESSABLE_ENTITY, HTTP_CONFLICT } = require("../helpers/response.helpers");
const {
  areMandatoryFieldsPresent,
  mandatory_non_empty_fields_user,
  isEmailValid,
  areAllFieldsValid,
  all_fields_user,
} = require("../helpers/validation.helpers");

function handleUsers(req, res) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  // register user:
  if (req.method === "POST" && urlEnds.includes("/api/users")) {
    logDebug("Register User: attempt:", { urlEnds, email: req.body["email"] });
    // validate mandatory fields:
    if (!areMandatoryFieldsPresent(req.body, mandatory_non_empty_fields_user)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_user));
      return;
    }

    // validate email:
    if (!isEmailValid(req.body["email"])) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid email"));
      return;
    }

    // validate all fields:
    const isValid = areAllFieldsValid(req.body, all_fields_user, mandatory_non_empty_fields_user);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send();
      return;
    }

    const emails = userDb().map((user) => user?.email);
    let foundUser = emails.filter((email) => areStringsEqualIgnoringCase(email, req.body["email"]));

    if (isBugEnabled(BugConfigKeys.BUG_LIKES_003)) {
      foundUser = [];
    }

    if (foundUser.length !== 0) {
      res.status(HTTP_CONFLICT).send(formatErrorResponse("Email not unique"));
      return;
    }

    if (isBugDisabled(BugConfigKeys.BUG_VALIDATION_005)) {
      // remove id - otherwise - 500: Error: Insert failed, duplicate id
      req.body.id = undefined;
    }

    logDebug("Register User: SUCCESS:", { urlEnds, email: req.body["email"] });
  }

  if (req.method === "PUT" && urlEnds.includes("/api/users/")) {
    let userId = getIdFromUrl(urlEnds);
    // validate mandatory fields:
    if (!areMandatoryFieldsPresent(req.body, mandatory_non_empty_fields_user)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_user));
      return;
    }

    // validate all fields:
    const isValid = areAllFieldsValid(req.body, all_fields_user, mandatory_non_empty_fields_user);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_user));
      return;
    }

    const foundMail = userDb().find((user) => {
      if (areIdsEqual(user["id"], userId) && areStringsEqualIgnoringCase(user["email"], req.body["email"])) {
        return user;
      }
    });

    if (!isUndefined(foundMail)) {
      res.status(HTTP_CONFLICT).send(formatErrorResponse("Email not unique"));
      return;
    }
    const foundUser = searchForUser(userId);

    if (isUndefined(foundUser)) {
      req.method = "POST";
      req.url = req.url.replace(`/${userId}`, "");
      if (parseInt(userId).toString() === userId) {
        userId = parseInt(userId);
      }
      req.body.id = userId;
    }
    if (!isUndefined(foundUser)) {
      if (!req.body.password || req.body.password == "") {
        req.body.password = foundUser["password"];
      }
    }
  }

  if (req.method === "PATCH" && urlEnds.includes("/api/users")) {
    // validate all fields:
    const isValid = areAllFieldsValid(req.body, all_fields_user, mandatory_non_empty_fields_user);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_user));
      return;
    }
  }
  return;
}

module.exports = {
  handleUsers,
};
