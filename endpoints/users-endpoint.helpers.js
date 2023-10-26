const { isBugDisabled, isBugEnabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
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
  are_mandatory_fields_present,
  mandatory_non_empty_fields_user,
  validateEmail,
  are_all_fields_valid,
  all_fields_user,
} = require("../helpers/validation.helpers");

function handleUsers(req, res) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  // register user:
  if (req.method === "POST" && urlEnds.includes("/api/users")) {
    logDebug("Register User: attempt:", { urlEnds, email: req.body["email"] });
    // validate mandatory fields:
    if (!are_mandatory_fields_present(req.body, mandatory_non_empty_fields_user)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_user));
      return;
    }

    // validate email:
    if (!validateEmail(req.body["email"])) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Invalid email"));
      return;
    }

    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_user, mandatory_non_empty_fields_user);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send();
      return;
    }

    const emails = userDb().map((user) => user?.email);
    let foundUser = emails.filter((email) => email === req.body["email"]);

    if (isBugEnabled(BugConfigKeys.BUG_LIKES_006)) {
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
    if (!are_mandatory_fields_present(req.body, mandatory_non_empty_fields_user)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_user));
      return;
    }

    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_user, mandatory_non_empty_fields_user);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_user));
      return;
    }

    const foundMail = userDb().find((user) => {
      if (user["id"]?.toString() !== userId?.toString() && user["email"] === req.body["email"]) {
        return user;
      }
    });

    if (foundMail !== undefined) {
      res.status(HTTP_CONFLICT).send(formatErrorResponse("Email not unique"));
      return;
    }
    const foundUser = searchForUser(userId);

    if (foundUser === undefined) {
      req.method = "POST";
      req.url = req.url.replace(`/${userId}`, "");
      if (parseInt(userId).toString() === userId) {
        userId = parseInt(userId);
      }
      req.body.id = userId;
    }
    if (foundUser !== undefined) {
      if (!req.body.password || req.body.password == "") {
        req.body.password = foundUser["password"];
      }
    }
  }

  if (req.method === "PATCH" && urlEnds.includes("/api/users")) {
    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_user, mandatory_non_empty_fields_user);
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
