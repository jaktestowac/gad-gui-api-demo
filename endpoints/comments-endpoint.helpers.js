const { isBugDisabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { isUndefined, areIdsEqual, isInactive } = require("../helpers/compare.helpers");
const {
  searchForComment,
  searchForUserWithToken,
  searchForUserWithEmail,
  searchForArticle,
} = require("../helpers/db-operation.helpers");
const {
  formatInvalidFieldErrorResponse,
  getIdFromUrl,
  formatInvalidTokenErrorResponse,
  formatMissingFieldErrorResponse,
  formatErrorResponse,
  formatInvalidDateFieldErrorResponse,
  formatNoFieldsErrorResponse,
} = require("../helpers/helpers");
const { logTrace, logDebug } = require("../helpers/logger-api");
const { HTTP_UNPROCESSABLE_ENTITY, HTTP_UNAUTHORIZED, HTTP_NOT_FOUND } = require("../helpers/response.helpers");
const { TracingInfoBuilder } = require("../helpers/tracing-info.helper");
const {
  areAllFieldsValid,
  all_fields_comment,
  mandatory_non_empty_fields_comment,
  verifyAccessToken,
  areMandatoryFieldsPresent,
  mandatory_non_empty_fields_comment_create,
  validateDateFields,
  areAnyAdditionalFieldsPresent,
  areAnyFieldsPresent,
} = require("../helpers/validation.helpers");

function handleComments(req, res, { isAdmin }) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (req.method !== "GET" && req.method !== "HEAD" && urlEnds.includes("/api/comments") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "comments", req.url);
    if (isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }
  }

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
        res.status(HTTP_NOT_FOUND).send({});
        return;
      }
    }
  } else if (req.method !== "GET" && req.method !== "HEAD" && urlEnds.includes("/api/comments") && isAdmin) {
    req.body["user_id"] = "admin";
  }

  if (req.method === "PATCH" && urlEnds.includes("/api/comments")) {
    let commentId = getIdFromUrl(urlEnds);
    const foundComment = searchForComment(commentId);

    // validate date field:
    const isDateValid = validateDateFields(req.body);
    if (isDateValid.status === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidDateFieldErrorResponse(isDateValid));
      return;
    }

    const anyFields = areAnyFieldsPresent(req.body);
    if (anyFields.status === false) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatNoFieldsErrorResponse(anyFields, all_fields_comment));
      return;
    }

    const articleId = req.body.article_id;
    if (!isUndefined(articleId)) {
      const foundArticle = searchForArticle(articleId);

      if (isUndefined(foundArticle)) {
        res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Article does not exist"));
        return;
      }
    }

    const additionalFields = areAnyAdditionalFieldsPresent(req.body, all_fields_comment);
    if (additionalFields.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatInvalidFieldErrorResponse(additionalFields, all_fields_comment));
      return;
    }

    if (!isAdmin) {
      const verifyTokenResult = verifyAccessToken(req, res, "comments", req.url);
      const foundUser = searchForUserWithEmail(verifyTokenResult?.email);

      logTrace("handleComments:", { method: req.method, urlEnds, foundUser });

      if (isUndefined(foundUser)) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
      req.body["user_id"] = foundUser.id;
    }

    if (isAdmin && !isUndefined(foundComment)) {
      req.body["user_id"] = foundComment.user_id;
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

    // validate date field:
    const isDateValid = validateDateFields(req.body);
    if (!isDateValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidDateFieldErrorResponse(isDateValid));
      return;
    }

    if (isBugDisabled(BugConfigKeys.BUG_VALIDATION_004)) {
      // remove id - otherwise - 500: Error: Insert failed, duplicate id
      req.body.id = undefined;
    }

    if (!isAdmin) {
      const verifyTokenResult = verifyAccessToken(req, res, "comments", req.url);
      const foundUser = searchForUserWithEmail(verifyTokenResult?.email);

      logTrace("handleComments:", { method: req.method, urlEnds, foundUser });

      if (isUndefined(foundUser)) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
      req.body["user_id"] = foundUser.id;
    } else {
      req.body["user_id"] = "admin";
    }
  }

  // update or create:
  if (req.method === "PUT" && urlEnds.includes("/api/comments") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "PUT comments", req.url);
    const foundUserFromToken = searchForUserWithEmail(verifyTokenResult?.email);
    logTrace("handleComments:", { method: req.method, urlEnds, foundUserFromToken });

    if (!isAdmin) {
      if (isUndefined(foundUserFromToken)) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
    }

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

    // validate date field:
    const isDateValid = validateDateFields(req.body);
    if (!isDateValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidDateFieldErrorResponse(isDateValid));
      return;
    }

    const articleId = req.body.article_id;
    const foundArticle = searchForArticle(articleId);

    if (isUndefined(foundArticle)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatErrorResponse("Article does not exist"));
      return;
    }

    let commentId = getIdFromUrl(urlEnds);
    const foundComment = searchForComment(commentId);

    if (!isAdmin) {
      const foundUser = searchForUserWithToken(foundComment?.user_id, verifyTokenResult);

      logDebug("handleComments: foundUser and user_id:", { commentId, foundUser, user_id: foundComment?.user_id });

      if (!isUndefined(foundUser)) {
        req.body.user_id = foundUser.id;
      }

      if (
        (isUndefined(foundUser) && !isUndefined(foundComment)) ||
        (!isUndefined(foundComment?.user_id) &&
          !isUndefined(foundUser) &&
          !areIdsEqual(foundUser?.id, req.body?.user_id))
      ) {
        res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You can not edit comment if You are not an owner"));
        return;
      }

      if (commentId === "comments") {
        commentId = "";
      }

      req.body["user_id"] = foundUserFromToken.id;
    } else {
      req.body["user_id"] = "admin";
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

    if (isAdmin && !isUndefined(foundComment)) {
      req.body["user_id"] = foundComment.user_id;
    }
  }

  // soft delete:
  if (req.method === "DELETE" && urlEnds.includes("/api/comments")) {
    const verifyTokenResult = verifyAccessToken(req, res, "DELETE comments", req.url);
    let commentId = getIdFromUrl(urlEnds);

    const foundComment = searchForComment(commentId);

    if (!isAdmin) {
      const foundUser = searchForUserWithToken(foundComment?.user_id, verifyTokenResult);

      logDebug("handleComments: foundUser and user_id:", { foundUser, user_id: foundComment?.user_id });

      if (isUndefined(foundComment) || isInactive(foundComment)) {
        res.status(HTTP_NOT_FOUND).send({});
        return;
      }

      if (isUndefined(foundUser) && !areIdsEqual(foundUser?.id, foundComment?.user_id)) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }

      if (isUndefined(foundUser)) {
        res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
        return;
      }
    }

    req.method = "PUT";
    req = new TracingInfoBuilder(req).setOriginMethod("DELETE").setWasAuthorized(true).setResourceId(commentId).build();
    req.url = `/api/comments/${commentId}`;
    const newCommentBody = foundComment;
    newCommentBody._inactive = true;
    req.body = newCommentBody;
    logTrace("handleComments: SOFT DELETE: overwrite DELETE -> PUT:", {
      method: req.method,
      url: req.url,
      body: req.body,
    });

    if (isAdmin && !isUndefined(foundComment)) {
      req.body["user_id"] = foundComment.user_id;
    }
    return;
  }

  return;
}

module.exports = {
  handleComments,
};
