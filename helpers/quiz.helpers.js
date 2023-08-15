const fs = require("fs");
const { logWarn } = require("./loggerApi");
const quizDataPath = "./quiz-questions.json";

function shuffleArray(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

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
  let questions = JSON.parse(fs.readFileSync(quizDataPath, "UTF-8"));
  const foundQuestionObj = questions.find((questionObj) => {
    if (questionText === questionObj.question) {
      return questionObj;
    }
  });
  return foundQuestionObj;
}

function getQuestions(numberOfQuestions) {
  let questions = JSON.parse(fs.readFileSync(quizDataPath, "UTF-8"));
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

module.exports = {
  getQuestions,
  getOnlyQuestions,
  shuffleArray,
  arraysEqual,
  checkAnswer,
  findQuestion,
};
