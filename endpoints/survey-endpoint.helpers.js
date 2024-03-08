const { formatInvalidFieldErrorResponse, formatInvalidDateFieldErrorResponse } = require("../helpers/helpers");
const { HTTP_NOT_FOUND, HTTP_OK, HTTP_UNPROCESSABLE_ENTITY } = require("../helpers/response.helpers");
const {
  areAllFieldsPresent,
  mandatory_non_empty_fields_survey,
  isFieldsLengthValid,
  isObjectLengthValid,
  validateDateFields,
} = require("../helpers/validation.helpers");

function handleSurvey(req, res) {
  if (req.method === "GET" && req.url.endsWith("/api/surveys/manualapi/questions")) {
    // TODO: Add the logic to get the survey questions

    res.status(HTTP_OK).json({});
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

    // TODO: Save the survey data

    res.status(HTTP_OK).json({});
  } else if (req.url.endsWith("/api/survey")) {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleSurvey,
};
