const { isBugDisabled, isBugEnabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { areStringsEqualIgnoringCase, areIdsEqual, isUndefined, isInactive } = require("../helpers/compare.helpers");
const { getCurrentDateTimeISO } = require("../helpers/datetime.helpers");
const { searchForUser, searchForUserWithToken } = require("../helpers/db-operation.helpers");
const { userDb } = require("../helpers/db.helpers");
const {
  formatMissingFieldErrorResponse,
  formatErrorResponse,
  getIdFromUrl,
  formatInvalidFieldErrorResponse,
  formatNoFieldsErrorResponse,
  formatInvalidTokenErrorResponse,
} = require("../helpers/helpers");
const { logDebug, logTrace } = require("../helpers/logger-api");
const {
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_CONFLICT,
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
} = require("../helpers/response.helpers");
const { TracingInfoBuilder } = require("../helpers/tracing-info.helper");
const {
  areMandatoryFieldsPresent,
  mandatory_non_empty_fields_user,
  isEmailValid,
  areAllFieldsValid,
  all_fields_user,
  verifyAccessToken,
  areAnyFieldsPresent,
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
    req.body.creationDate = getCurrentDateTimeISO();
    logDebug("Register User: SUCCESS:", { urlEnds, email: req.body["email"] });
  }

  if (req.method === "PUT" && urlEnds.includes("/api/users/")) {
    const verifyTokenResult = verifyAccessToken(req, res, "PUT users", req.url);

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

    // if (!isUndefined(foundMail)) {
    //   res.status(HTTP_CONFLICT).send(formatErrorResponse("Email not unique"));
    //   return;
    // }

    // TODO: test this
    // if (userId === "users") {
    //   userId = "";
    // }

    const foundUser = searchForUser(userId);
    // const foundUser2 = searchForUserWithToken(userId, verifyTokenResult);
    // if (!areIdsEqual(foundUser?.id, foundUser2?.id)) {
    //   res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You can not edit user if You the user"));
    //   return;
    // }

    if (isUndefined(foundUser)) {
      req.method = "POST";
      req.url = req.url.replace(`/${userId}`, "");
      if (parseInt(userId).toString() === userId) {
        userId = parseInt(userId);
      }
      req.body.creationDate = getCurrentDateTimeISO();
      req.body.birthDate = foundUser["birthDate"];
      req.body.id = userId;
    }
    if (!isUndefined(foundUser)) {
      // update
      if (!req.body.password || req.body.password == "") {
        req.body.password = foundUser["password"];
      }
      req.body.creationDate = foundUser["creationDate"];
      req.body.birthDate = foundUser["birthDate"];
    }
  }

  if (req.method === "PATCH" && urlEnds.includes("/api/users")) {
    // validate all fields:
    const isValid = areAllFieldsValid(req.body, all_fields_user, mandatory_non_empty_fields_user);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_user));
      return;
    }

    const anyFields = areAnyFieldsPresent(req.body);
    if (anyFields.status === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatNoFieldsErrorResponse(anyFields, all_fields_user));
      return;
    }
  }

  // for soft delete articles and comments:
  if (req.method === "DELETE" && urlEnds.includes("/api/users")) {
    let userId = getIdFromUrl(urlEnds);
    const foundUserToDelete = searchForUser(userId);

    if (isUndefined(foundUserToDelete) || isInactive(foundUserToDelete)) {
      res.status(HTTP_NOT_FOUND).send({});
      return;
    }

    const verifyTokenResult = verifyAccessToken(req, res, "DELETE articles", req.url);
    const foundUser = searchForUserWithToken(foundUserToDelete?.id, verifyTokenResult);

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return;
    }
    req = new TracingInfoBuilder(req)
      .setOriginMethod("DELETE")
      .setWasAuthorized(true)
      .setResourceId(foundUser.id)
      .build();
  }

  // soft delete:
  // NOTE: for now to preserve backward compatibility - we will not implement this
  // if (req.method === "DELETE" && urlEnds.includes("/api/users")) {
  //   let userId = getIdFromUrl(urlEnds);
  //   const foundUserToDelete = searchForUser(userId);

  //   const verifyTokenResult = verifyAccessToken(req, res, "DELETE articles", req.url);

  //   const foundUser = searchForUserWithToken(foundUserToDelete?.id, verifyTokenResult);

  //   logDebug("handleUsers: foundUser and user_id:", { foundUser, user_id: foundUserToDelete?.id });

  //   if (isUndefined(foundUserToDelete) || isInactive(foundUserToDelete)) {
  //     res.status(HTTP_NOT_FOUND).send({});
  //     return;
  //   }

  //   if (isUndefined(foundUser)) {
  //     res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
  //     return;
  //   }

  //   req.method = "PUT";
  //   req = new TracingInfoBuilder(req).setOriginMethod("DELETE").setWasAuthorized(true).setResourceId(userId).build();
  //   req.url = `/api/users/${userId}`;
  //   const newUserBody = foundUser;
  //   newUserBody._inactive = true;
  //   req.body = newUserBody;
  //   logTrace("handleUsers: SOFT DELETE: overwrite DELETE -> PUT:", {
  //     method: req.method,
  //     url: req.url,
  //     body: req.body,
  //   });
  //   return;
  // }

  return;
}

module.exports = {
  handleUsers,
};
