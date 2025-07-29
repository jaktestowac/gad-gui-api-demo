/**
 * Number guessing game
 */
class NumberGuessingGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.targetNumber = Math.floor(Math.random() * 100) + 1; // 1-100
    this.attempts = 0;
    this.maxAttempts = 7;
    this.gameStatus = "in-progress"; // "in-progress", "won", "lost"
  }

  guess(number) {
    if (this.gameStatus !== "in-progress") {
      return `Game is over. ${this.gameStatus === "won" ? "You won!" : "You lost!"} The number was ${
        this.targetNumber
      }. Type "play number guessing" to play again.`;
    }

    // Validate input
    if (!number || typeof number !== 'string' && typeof number !== 'number') {
      return "Please enter a valid number.";
    }

    const guessNum = parseInt(number, 10);

    if (isNaN(guessNum) || guessNum < 1 || guessNum > 100) {
      return "Please enter a valid number between 1 and 100.";
    }

    this.attempts++;

    if (guessNum === this.targetNumber) {
      this.gameStatus = "won";
      return `Congratulations! You guessed the number ${this.targetNumber} in ${this.attempts} attempts! Type "play number guessing" to play again.`;
    }

    if (this.attempts >= this.maxAttempts) {
      this.gameStatus = "lost";
      return `Sorry, you've used all your attempts. The number was ${this.targetNumber}. Type "play number guessing" to play again.`;
    }

    const hint = guessNum < this.targetNumber ? "higher" : "lower";
    return `Your guess ${guessNum} is too ${hint}. You have ${
      this.maxAttempts - this.attempts
    } attempts left. Try again!`;
  }

  getGameState() {
    return `I'm thinking of a number between 1 and 100. You have ${this.maxAttempts} attempts to guess it. What's your guess?`;
  }
}

module.exports = NumberGuessingGame;
