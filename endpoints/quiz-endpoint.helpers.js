const { getGameIdByName, getUserScore, searchForUserWithEmail } = require("../helpers/db-operation.helpers");
const { formatErrorResponse } = require("../helpers/helpers");
const { logDebug, logTrace } = require("../helpers/logger-api");
const { countAvailableQuestions, getOnlyQuestions, checkAnswer } = require("../helpers/quiz.helpers");
const { stopQuiz, quizQuestionsCheckConflict, startQuiz, quizAddScore } = require("../helpers/quiz.manager");
const { HTTP_NOT_FOUND, HTTP_OK, HTTP_CONFLICT, HTTP_UNAUTHORIZED } = require("../helpers/response.helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");

const quizHighScores = {};
const quizTempScores = {};

const questionsPerQuiz = 10;
const gameName = "quiz";

function handleQuiz(req, res) {
  if (req.method === "GET" && req.url.endsWith("/api/quiz/questions/count")) {
    res.status(HTTP_OK).json({ count: countAvailableQuestions() });
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/questions")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (verifyTokenResult === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }

    const questions = getOnlyQuestions(questionsPerQuiz);

    res.status(HTTP_OK).json(questions);
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/start")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (verifyTokenResult === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }

    startQuiz(quizTempScores, verifyTokenResult?.email);

    res.status(HTTP_OK).json({});
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/stop")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (verifyTokenResult === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }

    const email = verifyTokenResult?.email;

    stopQuiz(quizTempScores, quizHighScores, email);

    const gameId = getGameIdByName(gameName);
    const user = searchForUserWithEmail(email);
    const previousUserScore = getUserScore(user.id, gameId);

    logDebug("handleQuiz:Quiz highScores:", { previousUserScore, currentScore: quizTempScores[email] });
    if (previousUserScore !== undefined && previousUserScore.score > quizTempScores[email]["ok"]) {
      res.status(HTTP_OK).json({ game_id: gameId, user_id: user.id, score: quizTempScores[email]["ok"] });
    } else {
      req.method = "POST";
      req.url = "/api/scores";
      req.body = { game_id: gameId, user_id: user.id, score: quizHighScores[email] };
      logTrace("handleQuiz:stop -> POST scores:", {
        method: req.method,
        url: req.url,
        body: req.body,
      });
    }

    // res.status(HTTP_OK).json({ highScore: quizHighScores[email] });
    return;
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/highscores")) {
    logDebug("handleQuiz:Quiz highScores:", { quizHighScores });
    res.status(HTTP_OK).json({ highScore: quizHighScores });
  } else if (req.method === "POST" && req.url.endsWith("/api/quiz/questions/check")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (verifyTokenResult === undefined) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }

    const isConflict = quizQuestionsCheckConflict(quizTempScores, verifyTokenResult?.email, questionsPerQuiz);

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
      logTrace("handleQuiz:Quiz checkAnswer:", { questionText, selectedAnswers, isCorrect });

      quizAddScore(isCorrect, quizTempScores, verifyTokenResult?.email);

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
