const startButton = document.getElementById("start-button");
const cells = document.querySelectorAll(".cell");
const playerXScore = document.getElementById("player-x-score");
const playerOScore = document.getElementById("player-o-score");
const messageLbl = document.getElementById("messageLbl");
let currentPlayer = "X";
let playerXScoreValue = 0;
let playerOScoreValue = 0;

function startGame() {
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.addEventListener("click", handleCellClick, { once: true });
  });
  currentPlayer = "X";
  startButton.disabled = true;
  messageLbl.textContent = `${currentPlayer}'s turn`;
}

function handleCellClick(event) {
  const cell = event.target;
  cell.textContent = currentPlayer;
  if (checkWin()) {
    if (currentPlayer === "X") {
      playerXScoreValue++;
      playerXScore.textContent = playerXScoreValue;
    } else {
      playerOScoreValue++;
      playerOScore.textContent = playerOScoreValue;
    }
    resetGame();
  } else if (checkDraw()) {
    resetGame();
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    messageLbl.textContent = `${currentPlayer}'s turn`;
  }
}

function checkWin() {
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  return winningCombinations.some((combination) => {
    const [a, b, c] = combination;
    return (
      cells[a].textContent === currentPlayer &&
      cells[b].textContent === currentPlayer &&
      cells[c].textContent === currentPlayer
    );
  });
}

function checkDraw() {
  return Array.from(cells).every((cell) => cell.textContent !== "");
}

function resetGame() {
  cells.forEach((cell) => {
    cell.removeEventListener("click", handleCellClick);
  });
  startButton.disabled = false;
  messageLbl.textContent = "Click start to play again";
}

startButton.addEventListener("click", startGame);
