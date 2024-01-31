const { isBugDisabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { searchForComment, searchForUserWithToken, searchForUserWithEmail } = require("../helpers/db-operation.helpers");
const {
  formatInvalidFieldErrorResponse,
  getIdFromUrl,
  formatInvalidTokenErrorResponse,
  formatMissingFieldErrorResponse,
} = require("../helpers/helpers");
const { logTrace } = require("../helpers/logger-api");
const { HTTP_UNPROCESSABLE_ENTITY, HTTP_UNAUTHORIZED } = require("../helpers/response.helpers");
const {
  are_all_fields_valid,
  all_fields_comment,
  mandatory_non_empty_fields_comment,
  verifyAccessToken,
  are_mandatory_fields_present,
  mandatory_non_empty_fields_comment_create,
  all_fields_comment_create,
} = require("../helpers/validation.helpers");

function handleComments(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method !== "GET" && req.method !== "HEAD" && urlEnds.includes("/api/comments")) {
    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_comment, mandatory_non_empty_fields_comment_create);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_comment));
      return;
    }

    let commentId;
    if (req.method !== "POST") {
      commentId = getIdFromUrl(urlEnds);
    }

    const foundComment = searchForComment(commentId);
    logTrace("handleComments:", { method: req.method, commentId, urlEnds });

    if (req.method === "PUT" && foundComment === undefined) {
      req.method = "POST";
      req.url = "/api/comments";
      if (parseInt(commentId).toString() === commentId) {
        commentId = parseInt(commentId);
      }
      req.body.id = commentId;
      logTrace("handleComments:PUT -> POST:", {
        method: req.method,
        commentId,
        url: req.url,
        body: req.body,
      });
    }
  }

  if (req.method !== "GET" && req.method !== "HEAD" && urlEnds.includes("/api/comments") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "comments", req.url);
    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_comment, mandatory_non_empty_fields_comment);
    if (!isValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidFieldErrorResponse(isValid, all_fields_comment));
      return;
    }
    if (req.method !== "POST") {
      let commentId = getIdFromUrl(urlEnds);
      const foundComment = searchForComment(commentId);
      const foundUser = searchForUserWithToken(foundComment?.user_id, verifyTokenResult);

      logTrace("handleComments:", { method: req.method, commentId, urlEnds });

      if (foundUser === undefined && foundComment !== undefined) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
      if (foundUser === undefined && foundComment === undefined && req.method === "DELETE") {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
    }
  }

  if (req.method === "POST" && urlEnds.includes("/api/comments")) {
    // validate mandatory fields:
    if (!are_mandatory_fields_present(req.body, mandatory_non_empty_fields_comment_create)) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .send(formatMissingFieldErrorResponse(mandatory_non_empty_fields_comment_create));
      return;
    }
    // validate all fields:
    const isValid = are_all_fields_valid(req.body, all_fields_comment, mandatory_non_empty_fields_comment_create);
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

    if (foundUser === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
      return;
    }
    req.body["user_id"] = foundUser.id;
  }

  return;
}

module.exports = {
  handleComments,
};
