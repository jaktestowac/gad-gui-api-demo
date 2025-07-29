/**
 * Simple hangman game
 */
class HangmanGame {
  constructor() {
    this.words = [
      "javascript",
      "python",
      "typescript",
      "react",
      "angular",
      "vue",
      "node",
      "database",
      "algorithm",
      "function",
      "variable",
      "object",
      "array",
      "string",
      "boolean",
      "interface",
      "class",
      "method",
      "promise",
      "async",
      "component",
      "module",
      "server",
      "client",
    ];
    this.reset();
  }

  reset() {
    this.word = this.words[Math.floor(Math.random() * this.words.length)];
    this.guessedLetters = new Set();
    this.maxGuesses = 6;
    this.incorrectGuesses = 0;
    this.gameStatus = "in-progress"; // "in-progress", "won", "lost"
  }

  guess(letter) {
    // Validate input
    if (!letter || typeof letter !== 'string') {
      return "Please enter a valid letter.";
    }

    letter = letter.toLowerCase();

    // Check if it's a single letter
    if (letter.length !== 1 || !/[a-z]/.test(letter)) {
      return "Please enter a single letter (a-z).";
    }

    if (this.gameStatus !== "in-progress") {
      return `Game is over. ${this.gameStatus === "won" ? "You won!" : "You lost!"} The word was "${
        this.word
      }". Type "play hangman" to play again.`;
    }

    if (this.guessedLetters.has(letter)) {
      return `You've already guessed '${letter}'. Try a different letter.\n\n${this.getGameState()}`;
    }

    this.guessedLetters.add(letter);

    if (!this.word.includes(letter)) {
      this.incorrectGuesses++;

      if (this.incorrectGuesses >= this.maxGuesses) {
        this.gameStatus = "lost";
        return `Incorrect! You've used all your guesses. The word was "${this.word}". Game over! Type "play hangman" to play again.`;
      }

      return `Incorrect! '${letter}' is not in the word.\n\n${this.getGameState()}`;
    }

    // Check if player has won
    const allLettersGuessed = [...this.word].every((char) => this.guessedLetters.has(char));
    if (allLettersGuessed) {
      this.gameStatus = "won";
      return `Congratulations! You've guessed the word "${this.word}" correctly! Type "play hangman" to play again.`;
    }

    return `Correct! '${letter}' is in the word.\n\n${this.getGameState()}`;
  }

  getGameState() {
    const displayWord = [...this.word].map((letter) => (this.guessedLetters.has(letter) ? letter : "_")).join(" ");

    const guessesLeft = this.maxGuesses - this.incorrectGuesses;
    const guessedLettersStr = [...this.guessedLetters].sort().join(", ");

    return `Word: ${displayWord}
Guesses left: ${guessesLeft}
Guessed letters: ${guessedLettersStr || "None"}

Guess a letter to continue...`;
  }
}

module.exports = HangmanGame;
