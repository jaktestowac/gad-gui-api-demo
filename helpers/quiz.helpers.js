const { logWarn } = require("./logger-api");
const { shuffleArray } = require("./helpers");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const { quizQuestionsDb } = require("./db.helpers");
const { isUndefined } = require("./compare.helpers");

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

function checkAnswer(selectedAnswers, questionText) {
  if (isUndefined(selectedAnswers) || isUndefined(questionText)) {
    logWarn("checkAnswer: selectedAnswers or questionText is empty!", { selectedAnswers, questionText });
    return false;
  }
  const questionObj = findQuestion(questionText);
  if (isUndefined(questionObj)) {
    logWarn("checkAnswer: question was not found!", { questionText });
    return false;
  }
  return arraysEqual(selectedAnswers, questionObj.correctAnswers);
}

function findQuestion(questionText) {
  let questions = quizQuestionsDb(getConfigValue(ConfigKeys.QUIZ_QUESTIONS_PATH));
  const foundQuestionObj = questions.find((questionObj) => {
    if (questionText === questionObj.question) {
      return questionObj;
    }
  });
  return foundQuestionObj;
}

function getQuestions(numberOfQuestions) {
  let questions = quizQuestionsDb(getConfigValue(ConfigKeys.QUIZ_QUESTIONS_PATH));
  if (!isUndefined(numberOfQuestions) && numberOfQuestions < questions.length) {
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
