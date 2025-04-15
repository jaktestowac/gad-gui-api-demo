const boardSize = 10;
const mineCount = 15;
let board = [];
let revealedCells = 0;
let blockBoard = false;
const minesweeperScoreEndpoint = "../../api/minesweeper/score";
let finalScore = 0;
const winningBonus = 10;
const resetBtn = document.getElementById("resetBtn");
const lastClick = { x: -1, y: -1 };
let userIsAuthenticated = false;

async function issuePostScoreRequest(score) {
  // Only send score if user is authenticated
  if (!userIsAuthenticated) return;

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
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.classList.remove("death-field");
  });

  blockBoard = false;
  const scoreElement = document.getElementById("score");
  scoreElement.textContent = "";
  revealedCells = 0;
  lastClick.x = { x: -1, y: -1 };
  finalScore = 0;
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

      if (lastClick.x === i && lastClick.y === j) {
        cell.classList.add("death-field");
      }

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
    lastClick.x = row;
    lastClick.y = col;
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
  let msg = isWinner
    ? `Congratulations! You win with a score of ${finalScore}!`
    : `Game over! You clicked on a mine. Score: ${finalScore}!`;

  // Add message about score submission only for authenticated users
  if (isWinner && userIsAuthenticated) {
    msg += " Your score has been submitted!";
    issuePostScoreRequest(finalScore);
  } else if (isWinner && !userIsAuthenticated) {
    msg += " Log in to save your scores!";
  }

  updateScore(msg);
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
  lastClick.x = -1;
  lastClick.y = -1;
  userIsAuthenticated = token !== undefined;

  // Always show reset button
  resetBtn.style.display = "block";
  initializeBoard();
}

// Replace the checkIfAuthenticated call with direct initialization
document.addEventListener("DOMContentLoaded", function () {
  resetBtn.addEventListener("click", resetGame);
  startGame();

  // Show authentication info but don't block the game
  const infoContainer = document.getElementById("info-container");
  if (!userIsAuthenticated) {
    const url = new URL(window.location.href);
    const redirectUrl = url.pathname;
    infoContainer.innerHTML = `<div class="info-box"><p>Playing as guest. <a href="/login?redirectURL=${encodeURIComponent(
      redirectUrl
    )}">Login</a> to save your scores!</p></div>`;
  } else {
    infoContainer.innerHTML = "";
  }
});
