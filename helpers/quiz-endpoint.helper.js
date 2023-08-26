const { logDebug, logTrace } = require("./loggerApi");
const { countAvailableQuestions, getOnlyQuestions, checkAnswer } = require("./quiz.helpers");
const { HTTP_NOT_FOUND, HTTP_OK } = require("./response.helpers");
const { verifyAccessToken } = require("./validation.helpers");

const quizHighScores = {};
const quizTempScores = {};

function handleQuiz(req, res) {
  if (req.method === "GET" && req.url.endsWith("/api/quiz/questions/count")) {
    res.status(HTTP_OK).json({ count: countAvailableQuestions() });
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/questions")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (!verifyTokenResult) return;

    res.status(HTTP_OK).json(getOnlyQuestions(10));
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/start")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (!verifyTokenResult) return;

    quizTempScores[verifyTokenResult?.email] = 0;
    logDebug("handleQuiz:Quiz started:", { email: verifyTokenResult?.email, quizTempScores });
    res.status(HTTP_OK).json({});
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/stop")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (!verifyTokenResult) return;

    const email = verifyTokenResult?.email;
    logDebug("handleQuiz:Quiz stopped:", { email, quizTempScores, quizHighScores });
    if (quizHighScores[email] === undefined || quizTempScores[email] >= quizHighScores[email]) {
      quizHighScores[email] = quizTempScores[email];
    }

    quizTempScores[email] = 0;
    logDebug("handleQuiz:Quiz stopped - final:", { email, quizHighScores });
    res.status(HTTP_OK).json({ highScore: quizHighScores[email] });
  } else if (req.method === "GET" && req.url.endsWith("/api/quiz/highscores")) {
    logDebug("handleQuiz:Quiz highScores:", { quizHighScores });
    res.status(HTTP_OK).json({ highScore: quizHighScores });
  } else if (req.method === "POST" && req.url.endsWith("/api/quiz/questions/check")) {
    const verifyTokenResult = verifyAccessToken(req, res, "quiz", req.url);
    if (!verifyTokenResult) return;

    const questionText = req.body["questionText"];
    const selectedAnswers = req.body["selectedAnswers"];

    const isCorrect = checkAnswer(selectedAnswers, questionText);
    logTrace("handleQuiz:Quiz checkAnswer:", { questionText, selectedAnswers });

    // TODO:INVOKE_BUG: score is saved per email. If You start 2x quiz on one user - You can get more points.
    if (quizTempScores[verifyTokenResult?.email] === undefined) {
      quizTempScores[verifyTokenResult?.email] = 0;
    }
    quizTempScores[verifyTokenResult?.email] += isCorrect ? 1 : 0;
    if (isCorrect) {
      logTrace("handleQuiz:Quiz: user scores:", {
        email: verifyTokenResult?.email,
        score: quizTempScores[verifyTokenResult?.email],
      });
    }
    res.status(HTTP_OK).json({ isCorrect, score: quizTempScores[verifyTokenResult?.email] });
  } else {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleQuiz,
};
