const { questions, extractValueFromQuestions } = require("../data/surveys/maunal-api.survey");
const { isUndefined, isStringOnTheList } = require("../helpers/compare.helpers");
const {
  searchForUserWithOnlyToken,
  findUserSurveyTypeResponses,
  aggregateSurveyAnswers,
} = require("../helpers/db-operation.helpers");
const { surveyResponsesDb } = require("../helpers/db.helpers");
const {
  formatInvalidFieldErrorResponse,
  formatInvalidDateFieldErrorResponse,
  formatInvalidFieldValueErrorResponse,
  filterSelectedKeys,
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

  if (req.method === "GET" && req.url.endsWith("/api/surveys/manualapi/statistics")) {
    const data = surveyResponsesDb();
    const topics = extractValueFromQuestions(questions);
    const aggregatedSurveyAnswers = aggregateSurveyAnswers(data);

    const filtered = filterSelectedKeys(aggregatedSurveyAnswers, topics);

    res.status(HTTP_OK).json(filtered);
    return;
  }

  if (isStringOnTheList(req.method, ["GET", "POST"]) && urlEnds?.includes("/api/surveys/manualapi/") && !isAdmin) {
    const verifyTokenResult = verifyAccessToken(req, res, "surveys/manualapi", req.url);
    foundUser = searchForUserWithOnlyToken(verifyTokenResult);
    logTrace("handleSurvey: foundUser:", { method: req.method, urlEnds, foundUser });

    if (isUndefined(foundUser) || isUndefined(verifyTokenResult)) {
      // TODO: fix this
      // res.status(HTTP_UNAUTHORIZED).json(formatInvalidTokenErrorResponse());
      // return;
    }
  }

  if (req.method === "GET" && req.url.includes("/api/surveys/manualapi/questions/")) {
    const questionId = urlEnds.split("/").slice(-1)[0];
    if (isUndefined(questionId)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    const question = questions[questionId];

    if (isUndefined(question)) {
      res.status(HTTP_NOT_FOUND).json({});
      return;
    }

    res.status(HTTP_OK).json({ question: question });
  } else if (req.method === "POST" && req.url.endsWith("/api/surveys/manualapi/responses")) {
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

    // TODO: refactor into function
    const surveyType = 1;
    const typeValid = req.body?.type == surveyType;
    if (!typeValid) {
      res
        .status(HTTP_UNPROCESSABLE_ENTITY)
        .send(formatInvalidFieldValueErrorResponse({ status: false, error: "Invalid Type" }, "type"));
      return;
    }

    let foundSurveys = findUserSurveyTypeResponses(foundUser.id, surveyType);
    let foundSurvey = foundSurveys[0];

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
  } else if (req.url.includes("/api/survey") || req.url.includes("/api/survey-responses")) {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleSurvey,
};
