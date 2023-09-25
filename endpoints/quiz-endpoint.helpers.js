const { isBugDisabled, isBugEnabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { logDebug, logTrace } = require("../helpers/logger-api");
const { countAvailableQuestions, getOnlyQuestions, checkAnswer } = require("../helpers/quiz.helpers");
const { HTTP_NOT_FOUND, HTTP_OK, HTTP_CONFLICT } = require("../helpers/response.helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");

const quizHighScores = {};
const quizTempScores = {};

const questionsPerQuiz = 10;

function handleQuiz(req, res) {
  if (req.method === "GET" && req.url.endsWith("/api/quiz/questions/count")) {
    res.status(HTTP_OK).json({ count: countAvailableQuestions() });
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/questions")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (!verifyTokenResult) return;

    const questions = getOnlyQuestions(questionsPerQuiz);

    res.status(HTTP_OK).json(questions);
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/start")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (!verifyTokenResult) return;

    quizTempScores[verifyTokenResult?.email] = { ok: 0, nok: 0 };
    logDebug("handleQuiz:Quiz started:", { email: verifyTokenResult?.email, quizTempScores });
    res.status(HTTP_OK).json({});
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/stop")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (!verifyTokenResult) return;

    const email = verifyTokenResult?.email;
    logDebug("handleQuiz:Quiz stopped:", { email, quizTempScores, quizHighScores });
    if (quizHighScores[email] === undefined || quizTempScores[email]["ok"] >= quizHighScores[email]) {
      quizHighScores[email] = quizTempScores[email]["ok"];
    }

    if (isBugDisabled(BugConfigKeys.BUG_QUIZ_002)) {
      // clear quizTempScores before quiz:
      quizTempScores[email] = { ok: 0, nok: 0 };
    }
    logDebug("handleQuiz:Quiz stopped - final:", { email, quizHighScores });
    res.status(HTTP_OK).json({ highScore: quizHighScores[email] });

    // TODO: v2:
    // logDebug("handleQuiz:Quiz stopped:", { email, quizTempScores });
    // const quizHighScore = saveGameHighScores("quiz", email, quizTempScores[email]);

    // if (isBugDisabled(BugConfigKeys.BUG_QUIZ_002)) {
    //   // clear quizTempScores before quiz:
    //   quizTempScores[email] = 0;
    // }

    // logDebug("handleQuiz:Quiz stopped - final:", { email, quizHighScore });
    // res.status(HTTP_OK).json({ highScore: quizHighScore });
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/highscores")) {
    // TODO: v2:
    // const quizHighScores = getQuizHighScoresDb();
    logDebug("handleQuiz:Quiz highScores:", { quizHighScores });
    res.status(HTTP_OK).json({ highScore: quizHighScores });
  } else if (req.method === "POST" && req.url.endsWith("/api/quiz/questions/check")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (!verifyTokenResult) return;

    // check if user exceed number of questions - this may happen during multiple sessions:
    let isConflict =
      quizTempScores[verifyTokenResult?.email]["ok"] + quizTempScores[verifyTokenResult?.email]["nok"] >=
      questionsPerQuiz;

    if (isBugEnabled(BugConfigKeys.BUG_QUIZ_004)) {
      isConflict = false;
    }

    if (isConflict) {
      res.status(HTTP_CONFLICT).json({
        isCorrect: false,
        score: quizTempScores[verifyTokenResult?.email]["ok"],
        message: "Conflict in Quiz responses",
      });
    } else {
      const questionText = req.body["questionText"];
      const selectedAnswers = req.body["selectedAnswers"];

      const isCorrect = checkAnswer(selectedAnswers, questionText);
      logTrace("handleQuiz:Quiz checkAnswer:", { questionText, selectedAnswers });

      // TODO:INVOKE_BUG: score is saved per email. If You start 2x quiz on one user - You can get more points.
      if (quizTempScores[verifyTokenResult?.email] === undefined) {
        quizTempScores[verifyTokenResult?.email] = { ok: 0, nok: 0 };
      }

      if (isBugDisabled(BugConfigKeys.BUG_QUIZ_001)) {
        // add points for correct answer
        quizTempScores[verifyTokenResult?.email]["ok"] += isCorrect ? 1 : 0;
        quizTempScores[verifyTokenResult?.email]["nok"] += isCorrect ? 0 : 1;
      }

      logTrace("handleQuiz:Quiz: user scores:", {
        email: verifyTokenResult?.email,
        score: quizTempScores[verifyTokenResult?.email],
      });

      res.status(HTTP_OK).json({ isCorrect, score: quizTempScores[verifyTokenResult?.email]["ok"] });
    }
  } else {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleQuiz,
};
