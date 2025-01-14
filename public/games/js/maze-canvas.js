const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const menuEl = document.getElementById("menu");
const gameUI = document.getElementById("gameUI");
const mazeSizeSelect = document.getElementById("mazeSize");

const CELL_SIZE = 10;
let ROWS = 9;
let COLS = 9;

canvas.width = COLS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;

let maze = [];
let player = { x: 1, y: 1 };
let startTime = 0;
let gameActive = false;

function initMaze() {
  maze = Array(ROWS)
    .fill()
    .map(() => Array(COLS).fill(1));
}

function generateMaze(x, y) {
  maze[y][x] = 0;
  const directions = shuffleDirections();

  for (let dir of directions) {
    const [nx, ny] = [x + dir[0] * 2, y + dir[1] * 2];
    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && maze[ny][nx] === 1) {
      maze[y + dir[1]][x + dir[0]] = 0;
      generateMaze(nx, ny);
    }
  }
}

function shuffleDirections() {
  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  return dirs.sort(() => Math.random() - 0.5);
}

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (maze[y][x] === 1) {
        ctx.fillStyle = "#333";
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  ctx.fillStyle = "green";
  ctx.fillRect((COLS - 2) * CELL_SIZE, (ROWS - 2) * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  ctx.fillStyle = "red";
  ctx.fillRect(player.x * CELL_SIZE, player.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function updateTimer() {
  if (gameActive) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    statusEl.textContent = `Time: ${elapsed}s`;
    requestAnimationFrame(updateTimer);
  }
}

function initGame() {
  ROWS = parseInt(mazeSizeSelect.value);
  COLS = parseInt(mazeSizeSelect.value);
  canvas.width = COLS * CELL_SIZE;
  canvas.height = ROWS * CELL_SIZE;

  menuEl.classList.add("hidden");
  gameUI.classList.remove("hidden");

  startNewGame();
}

function showMenu() {
  menuEl.classList.remove("hidden");
  gameUI.classList.add("hidden");
  gameActive = false;
}

function startNewGame() {
  initMaze();
  generateMaze(1, 1);
  player = { x: 1, y: 1 };
  startTime = Date.now();
  gameActive = true;
  updateTimer();
  drawMaze();
}

function checkWin() {
  const playerCenterX = player.x * CELL_SIZE + CELL_SIZE / 2;
  const playerCenterY = player.y * CELL_SIZE + CELL_SIZE / 2;
  const goalCenterX = (COLS - 2) * CELL_SIZE + CELL_SIZE / 2;
  const goalCenterY = (ROWS - 2) * CELL_SIZE + CELL_SIZE / 2;

  const distance = Math.sqrt(Math.pow(playerCenterX - goalCenterX, 2) + Math.pow(playerCenterY - goalCenterY, 2));

  if (distance < CELL_SIZE && gameActive) {
    gameActive = false;
    const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    statusEl.textContent = `Completed in ${finalTime}s! Press New Game to play again.`;
    ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

document.addEventListener("keydown", (e) => {
  if (!gameActive) return;

  const oldX = player.x;
  const oldY = player.y;

  switch (e.key) {
    case "ArrowUp":
      player.y--;
      break;
    case "w":
      player.y--;
      break;
    case "ArrowDown":
      player.y++;
      break;
    case "s":
      player.y++;
      break;
    case "ArrowLeft":
      player.x--;
      break;
    case "a":
      player.x--;
      break;
    case "ArrowRight":
      player.x++;
      break;
    case "d":
      player.x++;
      break;
  }

  if (maze[player.y][player.x] === 1) {
    player.x = oldX;
    player.y = oldY;
  }

  drawMaze();
  checkWin();
});

document.getElementById("startGame").addEventListener("click", initGame);
document.getElementById("newGame").addEventListener("click", showMenu);

showMenu();
