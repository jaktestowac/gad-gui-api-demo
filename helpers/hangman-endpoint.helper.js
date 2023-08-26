const { getRandomWord, checkLetter } = require("./hangman.helper");
const { logTrace, logDebug } = require("./loggerApi");
const { HTTP_NOT_FOUND, HTTP_OK } = require("./response.helpers");

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
  } else {
    res.status(HTTP_NOT_FOUND).json({ indices });
  }
  return;
}

module.exports = {
  handleHangman,
};
