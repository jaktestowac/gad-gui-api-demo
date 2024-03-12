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

function getSurveyQuestions(surveyType) {
  switch (`${surveyType}`) {
    case "1":
      return manualApiSurvey.questions;
    case "2":
      return automationSurvey.questions;
    default:
      return {};
  }
}

function getSurveyFullName(surveyType) {
  switch (`${surveyType}`) {
    case "1":
      return manualApiSurvey.fullName;
    case "2":
      return automationSurvey.fullName;
    default:
      return {};
  }
}

module.exports = { extractValueFromQuestions, getSurveyQuestions, getSurveyFullName };
