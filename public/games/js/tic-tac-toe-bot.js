const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const difficultySelect = document.getElementById("difficulty");
const cells = document.querySelectorAll(".cell");
const playerXScore = document.getElementById("player-x-score");
const playerOScore = document.getElementById("player-o-score");
const messageLbl = document.getElementById("messageLbl");

let currentPlayer = "X";
let gameActive = false;
let playerXScoreValue = 0;
let playerOScoreValue = 0;

function startGame() {
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.removeEventListener("click", handleCellClick);
    cell.addEventListener("click", handleCellClick, { once: true });
  });
  currentPlayer = "X";
  gameActive = true;
  startButton.disabled = true;
  stopButton.disabled = false;
  if (difficultySelect) difficultySelect.disabled = true;
  messageLbl.textContent = "Your turn (X)";
}

function stopGame() {
  gameActive = false;
  resetGame();
}

function handleCellClick(event) {
  if (!gameActive || currentPlayer !== "X") return;

  const cell = event.target;
  if (cell.textContent !== "") return;

  makeMove(cell, "X");

  if (checkWin("X")) {
    endGame(false);
  } else if (checkDraw()) {
    endGame(true);
  } else {
    currentPlayer = "O";
    messageLbl.textContent = "Bot's turn...";
    setTimeout(makeBotMove, 500);
  }
}

function makeMove(cell, player) {
  cell.textContent = player;
  // Remove click listener to prevent double clicks
  cell.removeEventListener("click", handleCellClick);
}

function makeBotMove() {
  if (!gameActive) return;

  const difficulty = difficultySelect ? difficultySelect.value : "easy";
  let moveIndex;

  if (difficulty === "chaotic") {
    moveIndex = getRandomMove();
  } else if (difficulty === "easy") {
    moveIndex = getEasyMove();
  } else {
    moveIndex = getBestMove();
  }

  if (moveIndex !== -1) {
    const cell = cells[moveIndex];
    makeMove(cell, "O");

    if (checkWin("O")) {
      endGame(false);
    } else if (checkDraw()) {
      endGame(true);
    } else {
      currentPlayer = "X";
      messageLbl.textContent = "Your turn (X)";
    }
  }
}

function getAvailableMoves() {
  return Array.from(cells)
    .map((cell, index) => (cell.textContent === "" ? index : null))
    .filter((val) => val !== null);
}

function getRandomMove() {
  const availableMoves = getAvailableMoves();
  if (availableMoves.length === 0) return -1;
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[randomIndex];
}

function getEasyMove() {
  // 1. Check if can win
  const winMove = findWinningMove("O");
  if (winMove !== -1) return winMove;

  // 2. Random (Don't block)
  return getRandomMove();
}

function findWinningMove(player) {
  const availableMoves = getAvailableMoves();
  for (let index of availableMoves) {
    cells[index].textContent = player;
    if (checkWin(player)) {
      cells[index].textContent = ""; // Backtrack
      return index;
    }
    cells[index].textContent = ""; // Backtrack
  }
  return -1;
}

function getBestMove() {
  // Minimax
  return minimax(getBoardState(), "O").index;
}

function getBoardState() {
  return Array.from(cells).map((c) => (c.textContent === "" ? null : c.textContent));
}

function minimax(newBoard, player) {
  const availSpots = newBoard.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null);

  if (checkWinState(newBoard, "X")) {
    return { score: -10 };
  } else if (checkWinState(newBoard, "O")) {
    return { score: 10 };
  } else if (availSpots.length === 0) {
    return { score: 0 };
  }

  const moves = [];
  for (let i = 0; i < availSpots.length; i++) {
    const move = {};
    move.index = availSpots[i];
    newBoard[availSpots[i]] = player;

    if (player === "O") {
      const result = minimax(newBoard, "X");
      move.score = result.score;
    } else {
      const result = minimax(newBoard, "O");
      move.score = result.score;
    }

    newBoard[availSpots[i]] = null;
    moves.push(move);
  }

  let bestMove;
  if (player === "O") {
    let bestScore = -10000;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = 10000;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }

  return moves[bestMove];
}

function checkWin(player) {
  return checkWinState(getBoardState(), player);
}

function checkWinState(board, player) {
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
    return combination.every((index) => board[index] === player);
  });
}

function checkDraw() {
  return Array.from(cells).every((cell) => cell.textContent !== "");
}

function endGame(draw) {
  gameActive = false;
  if (draw) {
    messageLbl.textContent = "It's a draw!";
  } else {
    if (currentPlayer === "X") {
      messageLbl.textContent = "You won!";
      playerXScoreValue++;
      playerXScore.textContent = playerXScoreValue;
    } else {
      messageLbl.textContent = "Bot won!";
      playerOScoreValue++;
      playerOScore.textContent = playerOScoreValue;
    }
  }
  startButton.disabled = false;
  stopButton.disabled = true;
  if (difficultySelect) difficultySelect.disabled = false;
}

function resetGame() {
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.removeEventListener("click", handleCellClick);
  });
  startButton.disabled = false;
  stopButton.disabled = true;
  if (difficultySelect) difficultySelect.disabled = false;
  messageLbl.textContent = "Click start to play again";
}

// Event listeners
startButton.addEventListener("click", startGame);
stopButton.addEventListener("click", stopGame);
