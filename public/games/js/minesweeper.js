const boardSize = 10;
const mineCount = 15;
let board = [];
let revealedCells = 0;
let blockBoard = false;
const minesweeperScoreEndpoint = "../../api/minesweeper/score";
let finalScore = 0;
const winningBonus = 10;
const resetBtn = document.getElementById("resetBtn");

async function issuePostScoreRequest(score) {
  fetch(minesweeperScoreEndpoint, {
    method: "POST",
    body: JSON.stringify({ score }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
}

function calculateScore(isWinner) {
  let score = 0;
  let flaggedMines = 0;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j].flagged && board[i][j].mine) {
        flaggedMines++;
      }
    }
  }
  score = flaggedMines;
  if (isWinner === true) {
    score += winningBonus;
  }
  return score;
}

function updateScore(score) {
  const scoreElement = document.getElementById("score");
  scoreElement.textContent = score;
}

function initializeBoard() {
  for (let i = 0; i < boardSize; i++) {
    board[i] = [];
    for (let j = 0; j < boardSize; j++) {
      board[i][j] = { mine: false, count: 0, revealed: false };
    }
  }

  placeMines();
  calculateNeighborCounts();
  renderBoard();
  blockBoard = false;
  const scoreElement = document.getElementById("score");
  scoreElement.textContent = "";
}

function placeMines() {
  for (let i = 0; i < mineCount; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * boardSize);
      y = Math.floor(Math.random() * boardSize);
    } while (board[x][y].mine);

    board[x][y].mine = true;
  }
}

function calculateNeighborCounts() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j].mine) {
        continue;
      }

      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          const ni = i + x;
          const nj = j + y;

          if (ni >= 0 && ni < boardSize && nj >= 0 && nj < boardSize && board[ni][nj].mine) {
            board[i][j].count++;
          }
        }
      }
    }
  }
}

function renderBoard() {
  const boardElement = document.getElementById("board");
  boardElement.innerHTML = "";

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement("div");
      cell.className = `cell ${board[i][j].revealed ? "cell-open" : "cell-hidden"} ${board[i][j].mine ? "mine" : ""} ${
        board[i][j].flagged ? "flag" : ""
      }`;
      cell.textContent = board[i][j].revealed
        ? board[i][j].mine
          ? "💣"
          : board[i][j].count || ""
        : board[i][j].flagged
        ? "🚩"
        : "";
      cell.addEventListener("click", () => handleCellClick(i, j));
      cell.addEventListener("contextmenu", (event) => handleRightClick(i, j, event));

      boardElement.appendChild(cell);
    }
  }
}

function handleCellClick(row, col) {
  if (blockBoard || board[row][col].revealed || board[row][col].flagged) {
    return;
  }

  board[row][col].revealed = true;
  revealedCells++;

  if (board[row][col].count === 0) {
    revealEmptyCells(row, col);
  }

  if (board[row][col].mine) {
    endGame(false);
  } else if (revealedCells === boardSize * boardSize - mineCount) {
    endGame(true);
  }

  renderBoard();
}

function revealEmptyCells(row, col) {
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      const ni = row + x;
      const nj = col + y;

      if (ni >= 0 && ni < boardSize && nj >= 0 && nj < boardSize && !board[ni][nj].revealed) {
        board[ni][nj].revealed = true;
        revealedCells++;

        if (board[ni][nj].count === 0) {
          revealEmptyCells(ni, nj);
        }
      }
    }
  }
}

function handleRightClick(row, col, event) {
  event.preventDefault();

  if (!board[row][col].revealed) {
    board[row][col].flagged = !board[row][col].flagged;
    renderBoard();
  }
}

function endGame(isWinner) {
  finalScore = calculateScore(isWinner);
  const msg = isWinner
    ? `Congratulations! You win with a score of ${finalScore}!`
    : `Game over! You clicked on a mine. Score: ${finalScore}!`;
  updateScore(msg);

  if (isWinner === true) {
    issuePostScoreRequest(finalScore);
  }
  revealAllMines();
  blockBoard = true;
}

function revealAllMines() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j].mine) {
        board[i][j].revealed = true;
      }
    }
  }
  renderBoard();
}

function resetGame() {
  board = [];
  revealedCells = 0;
  initializeBoard();
}

function startGame() {
  const token = getBearerToken();
  if (token === undefined) {
    resetBtn.style.display = "none";
    const scoreElement = document.getElementById("score");
    scoreElement.innerHTML = "<strong>⛔ Please log in and return to this page ⛔</strong>";
  } else {
    resetBtn.style.display = "block";
    initializeBoard();
  }
}

resetBtn.addEventListener("click", resetGame);
startGame();
