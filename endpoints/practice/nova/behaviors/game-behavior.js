/**
 * Game Behavior - Handles games like hangman, number guessing, and rock-paper-scissors
 */

const BaseBehavior = require("./base-behavior");
const { HangmanGame, NumberGuessingGame, rockPaperScissors } = require("../games");

class GameBehavior extends BaseBehavior {
  constructor() {
    // Games should have high priority after commands
    super("game", 900);
  }

  /**
   * Check if this behavior can handle the message
   */
  canHandle(message, context) {
    const normalizedCommand = context.normalizedCommand;
    const lowerMessage = context.lowerCaseMessage;

    // Check if this is a game command or an active game interaction
    if (
      normalizedCommand === "play hangman" ||
      normalizedCommand === "play number guessing" ||
      normalizedCommand === "play rock paper scissors" ||
      ["rock", "paper", "scissors"].includes(normalizedCommand)
    ) {
      return true;
    }

    // Check for active games
    const userMem = context.userMemory;
    if (!userMem.activeGames) {
      userMem.activeGames = {};
      return false;
    }

    // Check if we're in a hangman game and got a single letter
    if (userMem.activeGames.hangmanGame && /^[a-zA-Z]$/.test(lowerMessage)) {
      return true;
    }

    // Check if we're in a number guessing game and got a number
    if (userMem.activeGames.numberGuessingGame && !isNaN(lowerMessage)) {
      return true;
    }

    return false;
  }

  /**
   * Handle the message
   */
  handle(message, context) {
    const normalizedCommand = context.normalizedCommand;
    const lowerMessage = context.lowerCaseMessage;
    const userMem = context.userMemory;

    // Initialize activeGames if needed
    if (!userMem.activeGames) {
      userMem.activeGames = {};
    }

    // Handle rock paper scissors game
    if (normalizedCommand === "play rock paper scissors") {
      return "Let's play Rock Paper Scissors! Type 'rock', 'paper', or 'scissors' to play.";
    } else if (["rock", "paper", "scissors"].includes(normalizedCommand)) {
      return rockPaperScissors(normalizedCommand);
    }

    // Handle number guessing game
    else if (normalizedCommand === "play number guessing") {
      if (!userMem.activeGames.numberGuessingGame) {
        userMem.activeGames.numberGuessingGame = new NumberGuessingGame();
      }
      return userMem.activeGames.numberGuessingGame.getGameState();
    } else if (userMem.activeGames.numberGuessingGame && !isNaN(lowerMessage)) {
      return userMem.activeGames.numberGuessingGame.guess(lowerMessage);
    }

    // Handle hangman game
    else if (normalizedCommand === "play hangman") {
      if (!userMem.activeGames.hangmanGame) {
        userMem.activeGames.hangmanGame = new HangmanGame();
      }
      return userMem.activeGames.hangmanGame.getGameState();
    } else if (userMem.activeGames.hangmanGame && /^[a-zA-Z]$/.test(lowerMessage)) {
      return userMem.activeGames.hangmanGame.guess(lowerMessage);
    }

    // This shouldn't happen if canHandle is working correctly
    return "I couldn't process your game action. Please try again.";
  }
}

module.exports = GameBehavior;
