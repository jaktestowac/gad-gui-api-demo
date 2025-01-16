const mazeContainer = document.getElementById("mazeContainer");
const statusEl = document.getElementById("status");
const menuEl = document.getElementById("menu");
const gameUI = document.getElementById("gameUI");
const mazeSizeSelect = document.getElementById("mazeSize");
const seedInput = document.getElementById("mazeSeed");
const startButton = document.getElementById("startGame");
let currentSeed = Date.now();
const mazeScoreEndpoint = "../../api/maze/score";

async function issuePostScoreRequest(time, size) {
  const finalScore = Math.floor((size * 1000) / time);
  const data = { time: time, size: size, score: finalScore };
  fetch(mazeScoreEndpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
}

let ROWS = 9;
let COLS = 9;
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

function seededRandom() {
  const x = Math.sin(currentSeed++) * 10000;
  return x - Math.floor(x);
}

function shuffleDirections() {
  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  return dirs.sort(() => seededRandom() - 0.5);
}

function createMazeElement() {
  mazeContainer.innerHTML = "";
  mazeContainer.style.gridTemplateColumns = `repeat(${COLS}, 20px)`;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (maze[y][x] === 1) {
        cell.classList.add("wall");
      } else {
        cell.classList.add("path");
      }

      if (x === player.x && y === player.y) {
        cell.classList.add("player");
      }

      if (x === COLS - 2 && y === ROWS - 2) {
        cell.classList.add("goal");
      }

      mazeContainer.appendChild(cell);
    }
  }
}

function updatePlayerPosition() {
  const cells = mazeContainer.children;
  Array.from(cells).forEach((cell) => cell.classList.remove("player"));
  cells[player.y * COLS + player.x].classList.add("player");
}

function updateTimer() {
  if (gameActive) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    statusEl.textContent = `Time: ${elapsed}s`;
    requestAnimationFrame(updateTimer);
  }
}

function validateSeed() {
  const seedValue = seedInput.value;
  const errorMessage = seedInput.parentElement.querySelector(".error-message");

  if (seedValue === "") {
    seedInput.classList.remove("invalid");
    errorMessage.classList.remove("show");
    startButton.disabled = false;
    return true;
  }

  const isValid = /^\d+$/.test(seedValue) && parseInt(seedValue) >= 0;

  seedInput.classList.toggle("invalid", !isValid);
  errorMessage.classList.toggle("show", !isValid);
  startButton.disabled = !isValid;

  return isValid;
}

function initGame() {
  if (!validateSeed()) return;

  ROWS = parseInt(mazeSizeSelect.value);
  COLS = parseInt(mazeSizeSelect.value);
  currentSeed = seedInput.value ? parseInt(seedInput.value) : Date.now();

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
  createMazeElement();
}

function checkWin() {
  if (player.x === COLS - 2 && player.y === ROWS - 2 && gameActive) {
    gameActive = false;
    const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    issuePostScoreRequest(finalTime, COLS * ROWS);
    statusEl.textContent = `Completed in ${finalTime}s! Press New Game to play again.`;
    mazeContainer.classList.add("win-overlay");
  }
}

document.addEventListener("keydown", (e) => {
  if (!gameActive) return;

  const oldX = player.x;
  const oldY = player.y;

  switch (e.key) {
    case "ArrowUp":
    case "w":
      player.y--;
      break;
    case "ArrowDown":
    case "s":
      player.y++;
      break;
    case "ArrowLeft":
    case "a":
      player.x--;
      break;
    case "ArrowRight":
    case "d":
      player.x++;
      break;
  }

  if (maze[player.y][player.x] === 1) {
    player.x = oldX;
    player.y = oldY;
  } else {
    updatePlayerPosition();
    checkWin();
  }
});

document.getElementById("startGame").addEventListener("click", initGame);
document.getElementById("newGame").addEventListener("click", showMenu);
seedInput.addEventListener("input", validateSeed);

showMenu();
