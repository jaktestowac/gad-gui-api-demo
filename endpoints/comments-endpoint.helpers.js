const { isBugDisabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { isUndefined, areIdsEqual } = require("../helpers/compare.helpers");
const { searchForComment, searchForUserWithToken, searchForUserWithEmail } = require("../helpers/db-operation.helpers");
const {
  formatInvalidFieldErrorResponse,
  getIdFromUrl,
  formatInvalidTokenErrorResponse,
  formatMissingFieldErrorResponse,
  formatErrorResponse,
  formatInvalidDateFieldErrorResponse,
} = require("../helpers/helpers");
const { logTrace, logDebug } = require("../helpers/logger-api");
const { HTTP_UNPROCESSABLE_ENTITY, HTTP_UNAUTHORIZED } = require("../helpers/response.helpers");
const {
  areAllFieldsValid,
  all_fields_comment,
  mandatory_non_empty_fields_comment,
  verifyAccessToken,
  areMandatoryFieldsPresent,
  mandatory_non_empty_fields_comment_create,
  validateDateFields,
} = require("../helpers/validation.helpers");

function handleComments(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method !== "GET" && req.method !== "HEAD" && urlEnds.includes("/api/comments")) {
    // validate all fields:
    const isValid = areAllFieldsValid(req.body, all_fields_comment, mandatory_non_empty_fields_comment_create);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_comment));
      return;
    }

    let commentId;
    if (req.method !== "POST") {
      commentId = getIdFromUrl(urlEnds);
    }

    logTrace("handleComments:", { method: req.method, commentId, urlEnds });
  }

  if (req.method !== "GET" && req.method !== "HEAD" && urlEnds.includes("/api/comments") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "comments", req.url);
    // validate all fields:
    const isValid = areAllFieldsValid(req.body, all_fields_comment, mandatory_non_empty_fields_comment);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_comment));
      return;
    }
    if (req.method !== "POST") {
      let commentId = getIdFromUrl(urlEnds);
      const foundComment = searchForComment(commentId);
      const foundUser = searchForUserWithToken(foundComment?.user_id, verifyTokenResult);

      logTrace("handleComments:", { method: req.method, commentId, urlEnds });

      if (isUndefined(foundUser) && !isUndefined(foundComment)) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
      if (isUndefined(foundUser) && isUndefined(foundComment) && req.method === "DELETE") {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
    }
  }

  if (req.method === "POST" && urlEnds.includes("/api/comments")) {
    // validate mandatory fields:
    if (!areMandatoryFieldsPresent(req.body, mandatory_non_empty_fields_comment_create)) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_comment_create));
      return;
    }
    // validate all fields:
    const isValid = areAllFieldsValid(req.body, all_fields_comment, mandatory_non_empty_fields_comment_create);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_comment));
      return;
    }

    if (isBugDisabled(BugConfigKeys.BUG_VALIDATION_004)) {
      // remove id - otherwise - 500: Error: Insert failed, duplicate id
      req.body.id = undefined;
    }

    const verifyTokenResult = verifyAccessToken(req, res, "comments", req.url);
    const foundUser = searchForUserWithEmail(verifyTokenResult?.email);

    logTrace("handleComments:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser)) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return;
    }
    req.body["user_id"] = foundUser.id;
  }

  // update or create:
  if (req.method === "PUT" && urlEnds.includes("/api/comments") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "PUT comments", req.url);

    // validate mandatory fields:
    if (!areMandatoryFieldsPresent(req.body, mandatory_non_empty_fields_comment)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_comment));
      return;
    }

    // validate all fields:
    const isValid = areAllFieldsValid(req.body, all_fields_comment, mandatory_non_empty_fields_comment);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_comment));
      return;
    }

    // validate date field:
    const isDateValid = validateDateFields(req.body);
    if (!isDateValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidDateFieldErrorResponse(isDateValid));
      return;
    }

    let commentId = getIdFromUrl(urlEnds);
    const foundComment = searchForComment(commentId);

    const foundUser = searchForUserWithToken(foundComment?.user_id, verifyTokenResult);

    logDebug("handleComments: foundUser and user_id:", { commentId, foundUser, user_id: foundComment?.user_id });

    if (
      (isUndefined(foundUser) && !isUndefined(foundComment)) ||
      (!isUndefined(foundComment?.user_id) && !isUndefined(foundUser) && !areIdsEqual(foundUser?.id, req.body?.user_id))
    ) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You can not edit comment if You are not an owner"));
      return;
    }

    if (commentId === "comments") {
      commentId = "";
    }

    logTrace("handleComments:PUT:", { method: req.method, commentId });

    if (isUndefined(foundComment)) {
      req.method = "POST";
      req.url = "/api/comments";
      req.body.id = undefined;
      logTrace("handleComments:PUT -> POST:", {
        method: req.method,
        url: req.url,
        body: req.body,
      });
    }
  }

  return;
}

module.exports = {
  handleComments,
};
