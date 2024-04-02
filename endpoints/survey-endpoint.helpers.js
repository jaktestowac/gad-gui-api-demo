const { isBugEnabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const {
  extractValueFromQuestions,
  getSurveyQuestions,
  getSurveyTypes,
  getSurveyDescription,
} = require("../data/surveys/survey.helper");
const { isUndefined, isStringOnTheList } = require("../helpers/compare.helpers");
const {
  searchForUserWithOnlyToken,
  findUserSurveyTypeResponses,
  aggregateSurveyAnswers,
  findUserSurveyResponse,
  findUserSurveyResponses,
} = require("../helpers/db-operation.helpers");
const { surveyResponsesDb } = require("../helpers/db.helpers");
const {
  formatInvalidFieldErrorResponse,
  formatInvalidDateFieldErrorResponse,
  formatInvalidFieldValueErrorResponse,
  filterSelectedKeys,
  formatInvalidTokenErrorResponse,
} = require("../helpers/helpers");
const { logTrace } = require("../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_UNPROCESSABLE_ENTITY,
  HTTP_UNAUTHORIZED,
} = require("../helpers/response.helpers");
const {
  areAllFieldsPresent,
  mandatory_non_empty_fields_survey,
  isFieldsLengthValid,
  isObjectLengthValid,
  validateDateFields,
  verifyAccessToken,
} = require("../helpers/validation.helpers");

function handleSurvey(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  let foundUser = undefined;

  if (req.method === "GET" && req.url.includes("/api/surveys/statistics/")) {
    const surveyType = urlEnds.split("/").slice(-1)[0];
    const data = surveyResponsesDb();
    const topics = extractValueFromQuestions(getSurveyQuestions(surveyType));
    const aggregatedSurveyAnswers = aggregateSurveyAnswers(data, surveyType);

    if (Object.keys(aggregatedSurveyAnswers).length === 0) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const filtered = filterSelectedKeys(aggregatedSurveyAnswers, topics);

    if (isBugEnabled(BugConfigKeys.BUG_SURVEY_001)) {
      res.status(HTTP_OK).json(filtered);
      return;
    }

    if (Object.keys(filtered).length === 0) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    res.status(HTTP_OK).json(filtered);
    return;
  }

  if (
    isStringOnTheList(req.method, ["GET", "POST"]) &&
    urlEnds?.includes("/api/surveys/") &&
    !urlEnds?.includes("description") &&
    !isAdmin
  ) {
    const verifyTokenResult = verifyAccessToken(req, res, "surveys", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleSurvey: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      return;
    }
  }

  if (req.method === "GET" && /\/api\/surveys\/[0-9]{1,}\/questions\//.test(req.url)) {
    // URL is valid
    const surveyType = req.url.match(/\/api\/surveys\/([0-9]{1,})\/questions\//)[1];

    const questionId = urlEnds.split("/").slice(-1)[0];
    if (isUndefined(questionId)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const question = getSurveyQuestions(surveyType)[questionId];

    if (isUndefined(question)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    res.status(HTTP_OK).json({ question: question });
  } else if (req.method === "GET" && /\/api\/surveys\/[0-9]{1,}\/description/.test(req.url)) {
    // URL is valid
    const surveyType = req.url.match(/\/api\/surveys\/([0-9]{1,})\/description/)[1];
    const description = getSurveyDescription(surveyType);

    if (isUndefined(description)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    res.status(HTTP_OK).json({ description: description });
  } else if (req.method === "POST" && req.url.endsWith("/api/surveys/responses")) {
    const mandatoryFieldValid = areAllFieldsPresent(req.body, mandatory_non_empty_fields_survey);
    if (!mandatoryFieldValid.status) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .send(formatInvalidFieldErrorResponse(mandatoryFieldValid, mandatory_non_empty_fields_survey));
      return;
    }

    const objectLengthValid = isObjectLengthValid(req.body);
    if (!objectLengthValid.status) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .send(formatInvalidFieldErrorResponse(objectLengthValid, mandatory_non_empty_fields_survey));
      return;
    }

    const fieldsLengthValid = isFieldsLengthValid(req.body);
    if (!fieldsLengthValid.status) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .send(formatInvalidFieldErrorResponse(fieldsLengthValid, mandatory_non_empty_fields_survey));
      return;
    }

    const dateValid = validateDateFields(req.body);
    if (!dateValid.status) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).send(formatInvalidDateFieldErrorResponse(dateValid));
      return;
    }

    const surveyType = req.body?.type;
    let typeValid = isStringOnTheList(surveyType, getSurveyTypes());

    if (isBugEnabled(BugConfigKeys.BUG_SURVEY_002)) {
      typeValid = true;
    }

    if (typeValid !== true) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .send(formatInvalidFieldValueErrorResponse({ status: false, error: "Invalid Type" }, "type"));
      return;
    }

    let foundSurveys = findUserSurveyTypeResponses(foundUser.id, surveyType);
    let foundSurvey = foundSurveys[0];

    if (isBugEnabled(BugConfigKeys.BUG_SURVEY_003)) {
      foundSurvey = undefined;
    }

    if (isUndefined(foundSurvey)) {
      req.url = `/api/survey-responses`;
      req.method = "POST";
      const survey = req.body;
      logTrace("handleSurvey: create a survey via POST:", {
        method: req.method,
        url: req.url,
        body: survey,
      });
      return;
    } else {
      req.method = "PUT";
      req.url = `/api/survey-responses/${foundSurvey.id}`;
      const survey = req.body;
      logTrace("handleSurvey: overwrite survey via POST -> PUT::", {
        method: req.method,
        url: req.url,
        body: survey,
      });
      return;
    }
  } else if (req.method === "GET" && req.url.endsWith("/api/surveys/responses")) {
    const surveyResponses = findUserSurveyResponses(foundUser.id);

    if (isUndefined(surveyResponses) || surveyResponses.length === 0) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    res.status(HTTP_OK).json(surveyResponses);
  } else if (req.method === "GET" && req.url.includes("/api/surveys/responses/")) {
    const surveyResponseId = urlEnds.split("/").slice(-1)[0];

    const surveyResponse = findUserSurveyResponse(foundUser.id, surveyResponseId);

    if (isUndefined(surveyResponse) || surveyResponse.length === 0) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    res.status(HTTP_OK).json(surveyResponse[0]);
  } else if (req.url.includes("/api/survey") || req.url.includes("/api/survey-responses")) {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleSurvey,
};
