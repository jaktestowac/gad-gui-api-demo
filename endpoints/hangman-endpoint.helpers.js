const { isNumber, isUndefined } = require("../helpers/compare.helpers");
const {
  getGameIdByName,
  searchForUserWithEmail,
  getUserScore,
  searchForUser,
  getGameNameById,
  getGameScores,
} = require("../helpers/db-operation.helpers");
const { checkLetter, getRandomWord } = require("../helpers/hangman.helpers");
const { formatErrorResponse } = require("../helpers/helpers");
const { logTrace, logDebug } = require("../helpers/logger-api");
const {
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE_ENTITY,
} = require("../helpers/response.helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");

const hangmanHighScores = {};
const hangmanTempScores = {};
const maxAttempts = 6;
const gameName = "hangman";

function handleHangman(req, res) {
  // TODO: do validation on backend
  if (req.method === "GET" && req.url.endsWith("/api/hangman/random")) {
    const randomWord = getRandomWord();
    logTrace("handleHangman:randomWord:", { randomWord });
    res.status(HTTP_OK).json({ word: randomWord });
  } else if (req.method === "POST" && req.url.endsWith("/api/hangman/check")) {
    const letter = req.body["letter"];
    const word = req.body["word"];

    const indices = checkLetter(letter, word);
    logTrace("handleHangman:Hangman checkAnswer:", { letter, indices });

    res.status(HTTP_OK).json({ indices });
  } else if (req.method === "POST" && req.url.endsWith("/api/v2/hangman/check")) {
    const verifyTokenResult = verifyAccessToken(req, res, "hangman", req.url);
    if (isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }

    const letter = req.body["letter"];
    const word = hangmanTempScores[verifyTokenResult?.email].selectedWord;

    const indices = checkLetter(letter, word);
    logTrace("handleHangman:Hangman checkAnswer:", { letter, indices });

    res.status(HTTP_OK).json({ indices });
  } else if (req.method === "GET" && req.url.endsWith("/api/v2/hangman/start")) {
    const verifyTokenResult = verifyAccessToken(req, res, "hangman/start", req.url);
    if (isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }

    const randomWord = getRandomWord();
    hangmanTempScores[verifyTokenResult?.email] = { selectedWord: randomWord, wrongAttempts: 0 };

    logDebug("handleHangman:Hangman started:", { email: verifyTokenResult?.email, hangmanTempScores });
    res.status(HTTP_OK).json({ selectedWordLength: randomWord.length });
  } else if (req.method === "GET" && req.url.endsWith("/api/v2/hangman/stop")) {
    const verifyTokenResult = verifyAccessToken(req, res, "hangman/stop", req.url);
    if (isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }

    const email = verifyTokenResult?.email;
    logDebug("handleHangman:Hangman stopped:", { email, hangmanTempScores, hangmanHighScores });

    let score =
      (maxAttempts - hangmanTempScores[email].wrongAttempts) * 5 + hangmanTempScores[email].selectedWord.length * 3;
    if (hangmanTempScores[email].wrongAttempts < maxAttempts) {
      hangmanHighScores[email] += score;
    }

    logDebug("handleHangman:Hangman stopped - final:", { email, hangmanHighScores });

    const gameId = getGameIdByName(gameName);
    const user = searchForUserWithEmail(email);
    const previousUserScore = getUserScore(user.id, gameId);

    logDebug("handleHangman:Quiz highScores:", {
      previousUserScore,
      hangmanHighScores: hangmanHighScores[email],
    });

    if (!isUndefined(previousUserScore) && previousUserScore.score >= hangmanHighScores[email]) {
      res.status(HTTP_OK).json({ game_id: gameId, user_id: user.id, score: hangmanHighScores[email] });
    } else {
      if (!isUndefined(previousUserScore?.id)) {
        req.method = "PUT";
        req.url = `/api/scores/${previousUserScore.id}`;
      } else {
        req.method = "POST";
        req.url = `/api/scores`;
      }
      req.body = { game_id: gameId, user_id: user.id, score: hangmanHighScores[email] };
      logDebug("handleHangman:stop -> PUT scores:", {
        method: req.method,
        url: req.url,
        body: req.body,
      });
    }

    return;
  } else if (req.method === "GET" && req.url.endsWith("/api/hangman/highscores")) {
    logDebug("handleHangman:Hangman highScores:", { hangmanHighScores });
    const gameId = getGameIdByName(gameName);
    const scores = getGameScores(gameId);
    const parsedScores = scores.map((score) => {
      const user = searchForUser(score.user_id);
      return {
        user: `${user.firstname} ${user.lastname}`,
        game: getGameNameById(score.game_id),
        score: score.score,
      };
    });

    res.status(HTTP_OK).json({ highScore: parsedScores });
  } else if (req.method === "POST" && req.url.endsWith("/api/hangman/score")) {
    const verifyTokenResult = verifyAccessToken(req, res, "hangman/score", req.url);
    if (isUndefined(verifyTokenResult)) {
      res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
      return;
    }
    const score = req.body;
    const email = verifyTokenResult?.email;
    if (isUndefined(score) || isUndefined(score.score) || !isNumber(score.score)) {
      res.status(HTTP_UNPROCESSABLE_ENTITY).json(formatErrorResponse("Score was not provided"));
    }
    const gameId = getGameIdByName(gameName);
    const user = searchForUserWithEmail(email);
    const previousUserScore = getUserScore(user.id, gameId);

    logDebug("handleHangman:hangman highScores:", { previousUserScore, currentScore: score });
    if (!isUndefined(previousUserScore) && previousUserScore.score >= score.score) {
      res.status(HTTP_OK).json({ game_id: gameId, user_id: user.id, score: score.score });
    } else {
      if (!isUndefined(previousUserScore?.id)) {
        req.method = "PUT";
        req.url = `/api/scores/${previousUserScore.id}`;
      } else {
        req.method = "POST";
        req.url = `/api/scores`;
      }
      req.body = { game_id: gameId, user_id: user.id, score: score.score };
      logDebug("handleHangman:stop -> PUT/POST scores:", {
        method: req.method,
        url: req.url,
        body: req.body,
      });
    }

    return;
  } else {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleHangman,
};
