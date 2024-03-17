const boardSize = 20;
const cellSize = 20;
const gameBoard = document.getElementById("game-board");
const startButton = document.getElementById("start-button");
let snake = [{ x: 10, y: 10 }];
let bug = { x: 15, y: 10 };
let direction = "right";
let score = 0;
let gameInterval;
const baseInterval = 200;
const intervalStep = 10;

const bugEaterScoreEndpoint = "../../api/bug-eater/score";

async function issuePostScoreRequest(score) {
  fetch(bugEaterScoreEndpoint, {
    method: "POST",
    body: JSON.stringify({ score }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
}

function createCell(x, y, className) {
  const cell = document.createElement("div");
  cell.className = className;
  cell.style.left = `${x * cellSize}px`;
  cell.style.top = `${y * cellSize}px`;

  if (className === "cell bug") {
    cell.textContent = "🐛";
  }
  return cell;
}

function drawBoard() {
  gameBoard.innerHTML = "";
  for (let x = 0; x < boardSize; x++) {
    for (let y = 0; y < boardSize; y++) {
      const className = snake.some((segment) => segment.x === x && segment.y === y)
        ? "cell snake"
        : bug.x === x && bug.y === y
        ? "cell bug"
        : "cell";
      const cell = createCell(x, y, className);
      gameBoard.appendChild(cell);
    }
  }
}

function moveSnake() {
  const head = { ...snake[0] };
  switch (direction) {
    case "up":
      head.y--;
      break;
    case "down":
      head.y++;
      break;
    case "left":
      head.x--;
      break;
    case "right":
      head.x++;
      break;
  }
  snake.unshift(head);
  if (head.x === bug.x && head.y === bug.y) {
    score++;
    generateBug();

    clearInterval(gameInterval);
    gameInterval = setInterval(moveSnake, baseInterval - score * intervalStep);
  } else {
    snake.pop();
  }
  if (isGameOver()) {
    clearInterval(gameInterval);
    issuePostScoreRequest(score).then(() => {
      alert(`Game Over! Your score is ${score}`);
      resetGame();
    });
  }
  drawBoard();
}

function generateBug() {
  bug = {
    x: Math.floor(Math.random() * boardSize),
    y: Math.floor(Math.random() * boardSize),
  };
}

function isGameOver() {
  const head = snake[0];
  return (
    head.x < 0 ||
    head.x >= boardSize ||
    head.y < 0 ||
    head.y >= boardSize ||
    snake.slice(1).some((segment) => segment.x === head.x && segment.y === head.y)
  );
}

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  direction = "right";
  score = 0;
  drawBoard();
  startButton.disabled = false;
}

startButton.addEventListener("click", () => {
  if (gameInterval) {
    clearInterval(gameInterval);
  }
  resetGame();
  generateBug();
  gameInterval = setInterval(moveSnake, baseInterval);
  startButton.disabled = true;
});

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowUp":
      if (direction !== "down") {
        direction = "up";
      }
      break;
    case "ArrowDown":
      if (direction !== "up") {
        direction = "down";
      }
      break;
    case "ArrowLeft":
      if (direction !== "right") {
        direction = "left";
      }
      break;
    case "ArrowRight":
      if (direction !== "left") {
        direction = "right";
      }
      break;
  }
});

drawBoard();
