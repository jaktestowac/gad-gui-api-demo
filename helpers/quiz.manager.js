const { isBugDisabled, isBugEnabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { isUndefined } = require("./compare.helpers");
const { logDebug, logTrace } = require("./logger-api");

function startQuiz(quizScores, email) {
  quizScores[email] = { ok: 0, nok: 0 };
  logDebug("handleQuiz:Quiz started:", { email, quizScores });
  return quizScores;
}

function stopQuiz(quizScores, quizHighScores, email) {
  logDebug("handleQuiz:Quiz stopped:", { email, quizScores, quizHighScores });
  if (isUndefined(quizHighScores[email]) || quizScores[email]["ok"] >= quizHighScores[email]) {
    quizHighScores[email] = quizScores[email]["ok"];
  }

  if (isBugDisabled(BugConfigKeys.BUG_QUIZ_002)) {
    // clear quizTempScores before quiz:
    quizScores[email] = { ok: 0, nok: 0 };
  }
  logDebug("handleQuiz:Quiz stopped - final:", { email, quizHighScores });
}

function quizQuestionsCheckConflict(quizScores, email, questionsPerQuiz) {
  // check if user exceed number of questions - this may happen during multiple sessions:
  let isConflict = quizScores[email]["ok"] + quizScores[email]["nok"] >= questionsPerQuiz;

  if (isBugEnabled(BugConfigKeys.BUG_QUIZ_004)) {
    isConflict = false;
  }

  return isConflict;
}

function quizAddScore(isCorrect, quizScores, email) {
  // TODO:INVOKE_BUG: score is saved per email. If You start 2x quiz on one user - You can get more points.
  if (isUndefined(quizScores[email])) {
    quizScores[email] = { ok: 0, nok: 0 };
  }

  if (isBugDisabled(BugConfigKeys.BUG_QUIZ_001)) {
    // add points for correct answer
    quizScores[email]["ok"] += isCorrect ? 1 : 0;
    quizScores[email]["nok"] += isCorrect ? 0 : 1;
  }

  logTrace("handleQuiz:Quiz: user scores:", {
    email: email,
    score: quizScores[email],
  });

  return quizScores;
}

module.exports = {
  startQuiz,
  stopQuiz,
  quizAddScore,
  quizQuestionsCheckConflict,
};
