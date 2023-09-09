const fs = require("fs");
const { shuffleArray } = require("./helpers");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");

function getWords() {
  let words = JSON.parse(fs.readFileSync(getConfigValue(ConfigKeys.HANGMAN_DATA_PATH), "UTF-8"));
  words = words.map((word) => word.toLowerCase());
  let shuffledWords = shuffleArray(words);
  return shuffledWords;
}

function getRandomWord() {
  let words = getWords();
  return shuffleArray(words)[0];
}

function checkLetter(letter, str) {
  let indices = [];
  for (let i = 0; i < str.length; i++) {
    if (str[i] === letter) {
      indices.push(i);
    }
  }

  return indices;
}

module.exports = {
  getWords,
  getRandomWord,
  checkLetter,
};
