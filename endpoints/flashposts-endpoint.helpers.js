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
  HTTP_FORBIDDEN,
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
  isHexColor,
  formatInvalidFieldValueErrorResponse,
  formatErrorResponse,
} = require("../helpers/helpers");
const { getCurrentDateTimeISO, checkHowLongInThePast, isDateBeforeOtherDate } = require("../helpers/datetime.helpers");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const { areIdsEqual } = require("../helpers/compare.helpers");

function handleFlashPosts(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  let foundUser = undefined;
  if (
    req.method === "GET" &&
    (req.url.endsWith("/api/flashposts") ||
      req.url.endsWith("/api/flashposts/") ||
      req.url.includes("/api/flashposts?"))
  ) {
    const verifyTokenResult = verifyAccessToken(req, res, "flashposts", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleFlashPosts: foundUser:", { method: req.method, urlEnds, foundUser });

    let posts = [];

    const query = req.url.split("?")[1];
    const afterDate = new URLSearchParams(query).get("afterDate");
    const userId = new URLSearchParams(query).get("user_id");

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      posts = getAllPublicFlashposts();
    } else {
      posts = getAllFlashposts();
    }

    if (afterDate !== null && afterDate !== undefined) {
      posts = posts.filter((post) => {
        return isDateBeforeOtherDate(post.date, afterDate);
      });
    }
    if (userId !== null && userId !== undefined) {
      posts = posts.filter((post) => {
        return areIdsEqual(post.user_id, userId);
      });
    }

    const limit = getConfigValue(ConfigKeys.MAX_NUMBER_OF_FLASHPOSTS);

    if (limit !== undefined && limit > 0) {
      posts = posts.slice(0, limit);
    }

    res.status(HTTP_OK).json(posts);
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

    // TODO: known bug if flashpost has is_public = undefined
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

    const settings = req.body.settings;
    if (settings !== undefined) {
      if (settings.color !== undefined && !isHexColor(settings.color)) {
        res
          .status(HTTP_UNPROCESSABLE_ENTITY)
          .json(formatInvalidFieldValueErrorResponse({ status: false, error: "Invalid Hex color" }, "color"));
        return;
      }
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
  if (req.method === "DELETE" && req.url.includes("/api/flashposts/")) {
    const verifyTokenResult = verifyAccessToken(req, res, "flashposts", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleFlashPosts: DELETE: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    let flashpostId = getIdFromUrl(urlEnds);
    const flashpost = getFlashpostWithId(flashpostId);

    if (isUndefined(flashpost)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    if (!areIdsEqual(flashpost.user_id, foundUser.id)) {
      res.status(HTTP_UNAUTHORIZED).json({});
      return;
    }

    const howLongInThePast = checkHowLongInThePast(flashpost.date);

    logTrace("handleFlashPosts: DELETE:", { howLongInThePast });
    if (howLongInThePast.totalHours > 23) {
      res.status(HTTP_FORBIDDEN).json(formatErrorResponse("You can not delete flashpost older than 24 hours!"));
      return;
    }

    return;
  }
  if (req.method === "PATCH" && req.url.includes("/api/flashposts/")) {
    const verifyTokenResult = verifyAccessToken(req, res, "flashposts", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleFlashPosts: PATCH: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }

    let flashpostId = getIdFromUrl(urlEnds);
    const flashpost = getFlashpostWithId(flashpostId);

    if (isUndefined(flashpost)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    if (!areIdsEqual(flashpost.user_id, foundUser.id)) {
      res.status(HTTP_UNAUTHORIZED).json({});
      return;
    }

    if (!areIdsEqual(flashpostId, flashpost.id)) {
      res.status(HTTP_UNAUTHORIZED).json({});
      return;
    }

    const additionalFields = areAnyAdditionalFieldsPresent(req.body, all_possible_fields_flashpost);
    if (additionalFields.status) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .json(formatInvalidFieldErrorResponse(additionalFields, all_possible_fields_flashpost));
      return;
    }

    const howLongInThePast = checkHowLongInThePast(flashpost.date);

    logTrace("handleFlashPosts: PATCH:", { howLongInThePast });
    if (howLongInThePast.totalHours > 23) {
      res.status(HTTP_FORBIDDEN).json(formatErrorResponse("You can not delete flashpost older than 24 hours!"));
      return;
    }

    req.body.date = flashpost.date;

    return;
  }

  return;
}

module.exports = {
  handleFlashPosts,
};
