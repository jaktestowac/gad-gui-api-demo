const { isUndefined } = require("lodash");
const {
  searchForUserWithOnlyToken,
  getAllPublicFlashposts,
  getAllFlashposts,
  getFlashpostWithId,
} = require("../helpers/db-operation.helpers");
const { logTrace } = require("../helpers/logger-api");
const {
  HTTP_UNAUTHORIZED,
  HTTP_NOT_IMPLEMENTED,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_OK,
  HTTP_NOT_FOUND,
} = require("../helpers/response.helpers");
const {
  verifyAccessToken,
  areMandatoryFieldsPresent,
  isFieldsLengthValid,
  mandatory_non_empty_fields_flashpost,
  areAnyAdditionalFieldsPresent,
  all_possible_fields_flashpost,
} = require("../helpers/validation.helpers");
const {
  formatInvalidTokenErrorResponse,
  formatMissingFieldErrorResponse,
  formatInvalidFieldErrorResponse,
  getIdFromUrl,
} = require("../helpers/helpers");
const { getCurrentDateTimeISO } = require("../helpers/datetime.helpers");

function handleFlashPosts(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  let foundUser = undefined;
  if (req.method === "GET" && req.url.endsWith("/api/flashposts")) {
    const verifyTokenResult = verifyAccessToken(req, res, "flashposts", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleFlashPosts: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      const allPublicPosts = getAllPublicFlashposts();
      res.status(HTTP_OK).json(allPublicPosts);
      return;
    }

    const allPosts = getAllFlashposts();
    res.status(HTTP_OK).json(allPosts);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/flashposts/")) {
    let flashpostId = getIdFromUrl(urlEnds);

    const verifyTokenResult = verifyAccessToken(req, res, "flashposts", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleFlashPosts: foundUser:", { method: req.method, urlEnds, foundUser });

    const flashpost = getFlashpostWithId(flashpostId);

    if (isUndefined(flashpost)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    if ((isUndefined(foundUser) || isUndefined(verifyTokenResult)) && flashpost.is_public === false) {
      res.status(HTTP_UNAUTHORIZED).json(flashpost);
      return;
    }

    res.status(HTTP_OK).json(flashpost);
    return;
  }

  if (req.method === "POST" && req.url.endsWith("/api/flashposts")) {
    const verifyTokenResult = verifyAccessToken(req, res, "flashposts", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleFlashPosts: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    req.body.user_id = foundUser.id;
    req.body.date = getCurrentDateTimeISO();

    // validate mandatory fields:
    if (!areMandatoryFieldsPresent(req.body, mandatory_non_empty_fields_flashpost)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatMissingFieldErrorResponse(mandatory_non_empty_fields_flashpost));
      return;
    }

    const additionalFields = areAnyAdditionalFieldsPresent(req.body, all_possible_fields_flashpost);
    if (additionalFields.status) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .json(formatInvalidFieldErrorResponse(additionalFields, all_possible_fields_flashpost));
      return;
    }

    if (req.body.settings === undefined) {
      req.body.settings = {};
    }

    const fieldsLengthValid = isFieldsLengthValid(req.body, 128);
    if (!fieldsLengthValid.status) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .json(formatInvalidFieldErrorResponse(fieldsLengthValid, mandatory_non_empty_fields_flashpost));
      return;
    }

    return;
  }
  if (req.method === "PUT" && req.url.includes("/api/flashposts")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }
  if (req.method === "DELETE" && req.url.includes("/api/flashposts")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }
  if (req.method === "PATCH" && req.url.includes("/api/flashposts")) {
    // TODO:
    res.status(HTTP_NOT_IMPLEMENTED).json({});
    return;
  }

  return;
}

module.exports = {
  handleFlashPosts,
};
