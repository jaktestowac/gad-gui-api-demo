const devHero = document.getElementById("devHero");
const gameContainer = document.getElementById("game-container");
const scoreDisplay = document.getElementById("score");
const startButton = document.getElementById("start-button");
const reloadButton = document.getElementById("reload-button");
const finalScoreContainer = document.getElementById("final-score-container");

let isJumping = false;
let isGameOver = false;
let score = 0;
let playerPositionY = 0;
let playerFixedPositionXMin = 50;
let playerFixedPositionXMax = 100;

function jump() {
  if (!isJumping) {
    isJumping = true;
    const jumpInterval = setInterval(() => {
      if (playerPositionY >= 100) {
        clearInterval(jumpInterval);
        const fallInterval = setInterval(() => {
          if (playerPositionY <= 0) {
            clearInterval(fallInterval);
            isJumping = false;
            playerPositionY = 0;
            devHero.style.bottom = "0px";
          } else {
            playerPositionY -= 5;
            devHero.style.bottom = playerPositionY + "px";
          }
        }, 20);
      }
      playerPositionY += 5;
      devHero.style.bottom = playerPositionY + "px";
    }, 20);
  }
}

document.addEventListener("keydown", (event) => {
  if (event.keyCode === 32 && !isJumping && !isGameOver) {
    jump();
  }
});

function createBug() {
  if (isGameOver) return;

  const bug = document.createElement("div");
  bug.classList.add("bug");
  const bugIcon = document.createElement("div");
  bugIcon.innerHTML = "🐛";
  bugIcon.classList.add("bugIcon");
  bug.appendChild(bugIcon);
  gameContainer.appendChild(bug);

  let bugPosition = 500;
  bug.style.left = bugPosition + "px";

  const moveBugInterval = setInterval(() => {
    if (bugPosition < -10) {
      clearInterval(moveBugInterval);
      gameContainer.removeChild(bug);
      score += 10;
      scoreDisplay.textContent = "Score: " + score;
    } else if (
      bugPosition > playerFixedPositionXMin &&
      bugPosition < playerFixedPositionXMax &&
      playerPositionY > -100 &&
      playerPositionY < 50
    ) {
      clearInterval(moveBugInterval);
      isGameOver = true;
      finalScoreContainer.innerHTML = `<strong>Game Over! Your Score: ${score}</strong><br>`;
      reloadButton.style.visibility = "visible";
    } else {
      bugPosition -= 10;
      bug.style.left = bugPosition + "px";
    }
  }, 20);

  if (!isGameOver) {
    setTimeout(createBug, Math.random() * 3000 + 1000);
  }
}

function reload() {
  window.location.reload();
}

function startDevRun() {
  isGameOver = false;
  finalScoreContainer.innerHTML = "";
  startButton.style.visibility = "collapse";
  reloadButton.style.visibility = "collapse";
  createBug();
}
