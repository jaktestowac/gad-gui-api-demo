/**
 * Game Behavior - Handles games like hangman, number guessing, and rock-paper-scissors
 */

const BaseBehavior = require("./base-behavior");
const { HangmanGame, NumberGuessingGame, rockPaperScissors } = require("../games");
const { logDebug } = require("../../../../helpers/logger-api");

class GameBehavior extends BaseBehavior {
  constructor() {
    // Games should have high priority after commands
    super("game", 900);

    // Commands for game control
    this.gameCommands = {
      reset: ["reset game", "restart game", "start over", "new game"],
      quit: ["quit game", "exit game", "stop game", "end game"],
    };
  }

  /**
   * Reset a game or all active games
   * @param {object} userMem - User memory object containing active games
   * @param {string} gameType - Type of game to reset, or undefined to reset all games
   */
  resetGame(userMem, gameType) {
    logDebug("[Nova] GameBehavior:resetGame", { gameType: gameType || "all" });

    // Initialize activeGames if needed
    if (!userMem.activeGames) {
      userMem.activeGames = {};
      return;
    }

    // Reset specific game or all games
    if (gameType === "hangman") {
      userMem.activeGames.hangmanGame = new HangmanGame();
    } else if (gameType === "numberGuessing") {
      userMem.activeGames.numberGuessingGame = new NumberGuessingGame();
    } else {
      // Reset all games
      userMem.activeGames = {};
    }
  }

  /**
   * Check if this behavior can handle the message
   */
  canHandle(message, context) {
    const normalizedCommand = context.normalizedCommand;
    const lowerMessage = context.lowerCaseMessage;

    // Check if this is a game command or an active game interaction
    // First, check explicit game commands
    if (
      normalizedCommand === "play hangman" ||
      normalizedCommand === "play number guessing" ||
      normalizedCommand === "play rock paper scissors" ||
      ["rock", "paper", "scissors"].includes(normalizedCommand)
    ) {
      return true;
    }

    // Check for game control commands (reset/quit)
    if (this._isGameControlCommand(normalizedCommand)) {
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
   * Check if a message is a game control command (reset/quit)
   * @private
   * @param {string} normalizedCommand - The normalized command to check
   * @returns {boolean} - True if the command is a game control command
   */
  _isGameControlCommand(normalizedCommand) {
    return this.gameCommands.reset.includes(normalizedCommand) || this.gameCommands.quit.includes(normalizedCommand);
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

    // Handle reset or quit game commands
    if (this._isGameControlCommand(normalizedCommand)) {
      return this._handleGameControlCommand(normalizedCommand, userMem);
    }

    // Handle rock paper scissors game
    else if (normalizedCommand === "play rock paper scissors") {
      return "Let's play Rock Paper Scissors! Type 'rock', 'paper', or 'scissors' to play.";
    } else if (["rock", "paper", "scissors"].includes(normalizedCommand)) {
      return rockPaperScissors(normalizedCommand);
    }

    // Handle number guessing game
    else if (normalizedCommand === "play number guessing") {
      // Always reset the game when the user explicitly asks to play
      this.resetGame(userMem, "numberGuessing");
      logDebug("[Nova] GameBehavior: Starting new number guessing game");
      return userMem.activeGames.numberGuessingGame.getGameState();
    } else if (userMem.activeGames.numberGuessingGame && !isNaN(lowerMessage)) {
      return userMem.activeGames.numberGuessingGame.guess(lowerMessage);
    }

    // Handle hangman game
    else if (normalizedCommand === "play hangman") {
      // Always reset the game when the user explicitly asks to play
      this.resetGame(userMem, "hangman");
      logDebug("[Nova] GameBehavior: Starting new hangman game");
      return userMem.activeGames.hangmanGame.getGameState();
    } else if (userMem.activeGames.hangmanGame && /^[a-zA-Z]$/.test(lowerMessage)) {
      return userMem.activeGames.hangmanGame.guess(lowerMessage);
    }

    // This shouldn't happen if canHandle is working correctly
    return "I couldn't process your game action. Please try again.";
  }

  /**
   * Handle game control commands (reset/quit)
   * @private
   * @param {string} command - The control command
   * @param {object} userMem - User memory containing game state
   * @returns {string} - Response message
   */
  _handleGameControlCommand(command, userMem) {
    // Check if there are any active games
    const hasActiveGames =
      userMem.activeGames && (userMem.activeGames.hangmanGame || userMem.activeGames.numberGuessingGame);

    if (!hasActiveGames) {
      return "There are no active games to reset or quit. Would you like to play a game? I know hangman and number guessing.";
    }

    // Identify which game is active
    let activeGameType = null;
    if (userMem.activeGames.hangmanGame) activeGameType = "hangman";
    if (userMem.activeGames.numberGuessingGame) activeGameType = "numberGuessing";

    // Handle reset command
    if (this.gameCommands.reset.includes(command)) {
      if (activeGameType) {
        this.resetGame(userMem, activeGameType);
        if (activeGameType === "hangman") {
          return "Hangman game has been reset. " + userMem.activeGames.hangmanGame.getGameState();
        } else if (activeGameType === "numberGuessing") {
          return "Number guessing game has been reset. " + userMem.activeGames.numberGuessingGame.getGameState();
        }
      } else {
        // Reset all games
        this.resetGame(userMem);
        return "All games have been reset. Would you like to start a new game?";
      }
    }

    // Handle quit command
    else if (this.gameCommands.quit.includes(command)) {
      // Reset all games
      const gameType = activeGameType === "hangman" ? "Hangman" : "Number guessing";
      this.resetGame(userMem);
      return `${gameType} game has been ended. What would you like to do next?`;
    }

    return "All games have been reset. What would you like to do next?";
  }
}

module.exports = GameBehavior;
