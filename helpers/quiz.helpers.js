const fs = require("fs");
const { logWarn } = require("./loggerApi");
const { shuffleArray } = require("./helpers");
const { getConfigValue } = require("../config/configManager");
const { ConfigKeys } = require("../config/enums");

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

function checkAnswer(selectedAnswers, questionText) {
  if (selectedAnswers === undefined || questionText === undefined) {
    logWarn("checkAnswer: selectedAnswers or questionText is empty!", { selectedAnswers, questionText });
    return false;
  }
  const questionObj = findQuestion(questionText);
  if (questionObj === undefined) {
    logWarn("checkAnswer: question was not found!", { questionText });
    return false;
  }
  return arraysEqual(selectedAnswers, questionObj.correctAnswers);
}

function findQuestion(questionText) {
  let questions = JSON.parse(fs.readFileSync(getConfigValue(ConfigKeys.QUIZ_DATA_PATH), "UTF-8"));
  const foundQuestionObj = questions.find((questionObj) => {
    if (questionText === questionObj.question) {
      return questionObj;
    }
  });
  return foundQuestionObj;
}

function getQuestions(numberOfQuestions) {
  let questions = JSON.parse(fs.readFileSync(getConfigValue(ConfigKeys.QUIZ_DATA_PATH), "UTF-8"));
  if (numberOfQuestions !== undefined && numberOfQuestions < questions.length) {
    let shuffledQuestions = shuffleArray(questions);
    return shuffledQuestions.slice(0, numberOfQuestions);
  }
  return questions;
}

function getOnlyQuestions(numberOfQuestions) {
  let questions = getQuestions(numberOfQuestions);
  return questions.map((q) => {
    q.correctAnswers = undefined;
    return q;
  });
}

function countAvailableQuestions() {
  let questions = getQuestions();
  return questions.length;
}

module.exports = {
  getQuestions,
  getOnlyQuestions,
  arraysEqual,
  checkAnswer,
  findQuestion,
  countAvailableQuestions,
};
