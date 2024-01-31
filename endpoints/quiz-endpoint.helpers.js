const { isUndefined } = require("../helpers/compare.helpers");
const {
  getGameIdByName,
  getUserScore,
  searchForUserWithEmail,
  getGameNameById,
  searchForUser,
} = require("../helpers/db-operation.helpers");
const { scoresDb } = require("../helpers/db.helpers");
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
    if (isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }

    const questions = getOnlyQuestions(questionsPerQuiz);

    res.status(HTTP_OK).json(questions);
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/start")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }

    startQuiz(quizTempScores, verifyTokenResult?.email);

    res.status(HTTP_OK).json({});
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/stop")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }

    const email = verifyTokenResult?.email;

    stopQuiz(quizTempScores, quizHighScores, email);

    const gameId = getGameIdByName(gameName);
    const user = searchForUserWithEmail(email);
    const previousUserScore = getUserScore(user.id, gameId);

    logDebug("handleQuiz:Quiz highScores:", { previousUserScore, currentScore: quizHighScores[email] });
    if (!isUndefined(previousUserScore) && previousUserScore.score >= quizHighScores[email]) {
      res.status(HTTP_OK).json({ game_id: gameId, user_id: user.id, score: quizHighScores[email] });
    } else {
      if (!isUndefined(previousUserScore?.id)) {
        req.method = "PUT";
        req.url = `/api/scores/${previousUserScore.id}`;
      } else {
        req.method = "POST";
        req.url = `/api/scores`;
      }
      req.body = { game_id: gameId, user_id: user.id, score: quizHighScores[email] };
      logDebug("handleQuiz:stop -> PUT scores:", {
        method: req.method,
        url: req.url,
        body: req.body,
      });
    }

    return;
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/highscores")) {
    logDebug("handleQuiz:Quiz highScores:", { quizHighScores });

    const scores = scoresDb();
    const parsedScores = scores.map((score) => {
      const user = searchForUser(score.user_id);
      return {
        user: `${user.firstname} ${user.lastname}`,
        game: getGameNameById(score.game_id),
        score: score.score,
      };
    });

    res.status(HTTP_OK).json({ highScore: parsedScores });
  } else if (req.method === "POST" && req.url.endsWith("/api/quiz/questions/check")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (isUndefined(verifyTokenResult)) {
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
