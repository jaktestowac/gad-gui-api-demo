/**
 * Play a game of rock paper scissors
 * @param {string} userChoice - User's choice (rock, paper, scissors)
 * @returns {string} - Game result
 */
function rockPaperScissors(userChoice) {
  const choices = ["rock", "paper", "scissors"];
  const aiChoice = choices[Math.floor(Math.random() * choices.length)];

  let result;
  if (userChoice === aiChoice) {
    result = "It's a tie!";
  } else if (
    (userChoice === "rock" && aiChoice === "scissors") ||
    (userChoice === "paper" && aiChoice === "rock") ||
    (userChoice === "scissors" && aiChoice === "paper")
  ) {
    result = "You win!";
  } else {
    result = "I win!";
  }

  return `You chose ${userChoice}, I chose ${aiChoice}. ${result}`;
}

module.exports = rockPaperScissors;
