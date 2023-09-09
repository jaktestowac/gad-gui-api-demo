const { checkLetter, getRandomWord } = require("../helpers/hangman.helpers");
const { logTrace, logDebug } = require("../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_OK } = require("../helpers/response.helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");

const hangmanHighScores = {};
const hangmanTempScores = {};
const maxAttempts = 6;

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
    if (!verifyTokenResult) return;

    const letter = req.body["letter"];
    const word = hangmanTempScores[verifyTokenResult?.email].selectedWord;

    const indices = checkLetter(letter, word);
    logTrace("handleHangman:Hangman checkAnswer:", { letter, indices });

    res.status(HTTP_OK).json({ indices });
  } else if (req.method === "GET" && req.url.endsWith("/api/v2/hangman/start")) {
    const verifyTokenResult = verifyAccessToken(req, res, "hangman", req.url);
    if (!verifyTokenResult) return;

    const randomWord = getRandomWord();
    hangmanTempScores[verifyTokenResult?.email] = { selectedWord: randomWord, wrongAttempts: 0 };

    logDebug("handleHangman:Hangman started:", { email: verifyTokenResult?.email, hangmanTempScores });
    res.status(HTTP_OK).json({ selectedWordLength: randomWord.length });
  } else if (req.method === "GET" && req.url.endsWith("/api/v2/hangman/stop")) {
    const verifyTokenResult = verifyAccessToken(req, res, "hangman", req.url);
    if (!verifyTokenResult) return;

    const email = verifyTokenResult?.email;
    logDebug("handleHangman:Hangman stopped:", { email, hangmanTempScores, hangmanHighScores });

    let score =
      (maxAttempts - hangmanTempScores[email].wrongAttempts) * 5 + hangmanTempScores[email].selectedWord.length * 3;
    if (hangmanTempScores[email].wrongAttempts < maxAttempts) {
      hangmanHighScores[email] += score;
    }

    logDebug("handleHangman:Hangman stopped - final:", { email, hangmanHighScores });
    res.status(HTTP_OK).json({ score, totalScore: hangmanHighScores[email] });
  } else if (req.method === "GET" && req.url.endsWith("/api/v2/hangman/highscores")) {
    logDebug("handleHangman:Hangman highScores:", { hangmanHighScores });
    res.status(HTTP_OK).json({ highScore: hangmanHighScores });
  } else {
    res.status(HTTP_NOT_FOUND).json({});
  }
  return;
}

module.exports = {
  handleHangman,
};
