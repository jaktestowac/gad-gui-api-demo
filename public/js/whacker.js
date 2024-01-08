let score = 0;
let timer;
let gameDuration = 30; // in seconds
let timeLeft = 0; // in seconds
const bugSymbol = "🐛";
const numHoles = 9;

function createHoles() {
  const container = document.getElementById("holeContainer");
  container.style.width = `${90 * Math.ceil(Math.sqrt(numHoles))}px`;
  container.innerHTML = "";
  for (let i = 0; i < numHoles; i++) {
    const hole = document.createElement("div");
    hole.className = "whacker-hole";
    container.appendChild(hole);
  }
}

function startGame() {
  document.getElementById("startBtn").disabled = true;
  resetGame();
  timer = setInterval(popUpBug, 1000);
  setTimeout(endGame, gameDuration * 1000);
}

function popUpBug() {
  const holes = document.querySelectorAll(".whacker-hole");
  const randomHoleIndex = Math.floor(Math.random() * holes.length);
  const hole = holes[randomHoleIndex];

  if (hole.textContent !== bugSymbol) {
    hole.textContent = bugSymbol;
    setTimeout(() => {
      if (hole.textContent === bugSymbol) {
        hole.textContent = "";
      }
    }, 800);
  }
  timeLeft--;
  document.getElementById("time-left").textContent = timeLeft;
}

function whackBug(event) {
  if (event.target.textContent === bugSymbol) {
    event.target.textContent = "";
    score++;
  } else {
    score = Math.max(0, score - 1); // lose one point for missing
  }
  document.getElementById("score").textContent = score;
}

function endGame() {
  timeLeft = 0;
  document.getElementById("time-left").textContent = timeLeft;
  clearInterval(timer);
  document.getElementById("final-score").textContent = `Game over! Your score is ${score}.`;
  document.getElementById("startBtn").disabled = false;
}

function resetGame() {
  timeLeft = gameDuration;
  score = 0;
  document.getElementById("score").textContent = score;
  document.getElementById("final-score").textContent = "";
  document.getElementById("time-left").textContent = timeLeft;

  const holes = document.querySelectorAll(".whacker-hole");
  holes.forEach((hole) => (hole.textContent = ""));
}

document.addEventListener("DOMContentLoaded", () => {
  const holes = document.querySelectorAll(".whacker-hole");
  holes.forEach((hole) => hole.addEventListener("click", whackBug));

  document.getElementById("startBtn").addEventListener("click", startGame);
});

createHoles();
