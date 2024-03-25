let score = 0;
let timer;
let countDownTimer;
let gameDuration = 30; // in seconds
let timeLeft = 0; // in seconds
const bugSymbol = "🐛";
let numHoles = 9;
let speed = 1000;

function createHoles() {
  const container = document.getElementById("holeContainer");
  container.style.width = `${90 * Math.ceil(Math.sqrt(numHoles))}px`;
  container.innerHTML = "";
  for (let i = 0; i < numHoles; i++) {
    const hole = document.createElement("div");
    hole.className = "whacker-hole";
    container.appendChild(hole);
  }
  const holes = document.querySelectorAll(".whacker-hole");
  holes.forEach((hole) => hole.addEventListener("click", whackBug));
}

function startGame() {
  document.getElementById("startBtn").disabled = true;
  document.getElementById("panel").disabled = true;
  numHoles = document.getElementById("numHoles").value;
  speed = document.getElementById("speed").value;
  resetGame();
  timer = setInterval(popUpBug, speed);
  countDownTimer = setInterval(countDown, 1000);
  setTimeout(endGame, gameDuration * 1000);
}

function countDown() {
  timeLeft--;
  document.getElementById("time-left").textContent = timeLeft;
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
    }, speed * 0.75);
  }
}

function whackBug(event) {
  if (timeLeft === 0) return;

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
  clearInterval(countDownTimer);
  document.getElementById("final-score").textContent = `Game over! Your score is ${score}.`;
  document.getElementById("startBtn").disabled = false;
  document.getElementById("panel").disabled = false;
}

function resetGame() {
  timeLeft = gameDuration;
  score = 0;
  createHoles();
  document.getElementById("score").textContent = score;
  document.getElementById("final-score").textContent = "";
  document.getElementById("time-left").textContent = timeLeft;

  const holes = document.querySelectorAll(".whacker-hole");
  holes.forEach((hole) => (hole.textContent = ""));
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startBtn").addEventListener("click", startGame);
});

createHoles();
