const manualApiSurvey = require("./manual-api.survey");
const automationSurvey = require("./automation.survey");

function extractValueFromQuestions(questions) {
  const values = [];
  Object.keys(questions).forEach((key) => {
    const regex = /value="([^"]+)"/;
    const match = questions[key].match(regex);
    const value = match ? match[1] : undefined;

    if (value !== undefined) {
      values.push(value);
    }
  });
  return values;
}

function getSurveyDescription(surveyType) {
  switch (`${surveyType}`) {
    case `${manualApiSurvey.type}`:
      return manualApiSurvey.description;
    case `${automationSurvey.type}`:
      return automationSurvey.description;
    default:
      return {};
  }
}

function getSurveyQuestions(surveyType) {
  switch (`${surveyType}`) {
    case `${manualApiSurvey.type}`:
      return manualApiSurvey.questions;
    case `${automationSurvey.type}`:
      return automationSurvey.questions;
    default:
      return {};
  }
}

function getSurveyFullName(surveyType) {
  switch (`${surveyType}`) {
    case `${manualApiSurvey.type}`:
      return manualApiSurvey.fullName;
    case `${automationSurvey.type}`:
      return automationSurvey.fullName;
    default:
      return {};
  }
}

function getSurveyTypes() {
  return [manualApiSurvey.type, automationSurvey.type];
}

module.exports = {
  extractValueFromQuestions,
  getSurveyQuestions,
  getSurveyFullName,
  getSurveyTypes,
  getSurveyDescription,
};
