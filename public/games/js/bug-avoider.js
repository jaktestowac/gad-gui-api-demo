const friction = 0.85;
let acceleration = 2;
let maxSpeed = 8;

let score = 0;
let playerHealth = 100;
let version = 1.0; // Changed from level
let versionProgress = 0; // Changed from levelScore
let playerPos;
let playerVelocity;

const accelerationIncrease = 1.002;
const maxSpeedIncrease = 1.002;

const nextLevelScore = 30;

let maxHealth = 100;
let healthPerLevel = 5;

let player;
let gameArea;
let scoreElement;
let healthElement;
let levelElement;

const ITEMS_CONFIG = {
  bug: {
    className: "bug",
    emoji: "🐛",
    damage: 20,
    points: 0,
    health: 0,
    spawnChance: 0.5,
    speedMultiplier: 1.2,
    minLevel: 1,
    description: "🐛 Bugs damage your code stability!",
  },
  diamond: {
    className: "item diamond",
    emoji: "💎",
    damage: 0,
    points: 20,
    health: 0,
    spawnChance: 0.2,
    speedMultiplier: 1.1,
    minLevel: 1,
    description: "💎 Gems are clean code - collect them!",
  },
  moneyBag: {
    className: "item money-bag",
    emoji: "💰",
    damage: 0,
    points: 15,
    health: 0,
    spawnChance: 0.2,
    speedMultiplier: 1,
    minLevel: 1,
    description: "💰 Money bags - bonus points!",
  },
  money: {
    className: "item money",
    emoji: "💵",
    damage: 0,
    points: 10,
    health: 0,
    spawnChance: 0.3,
    speedMultiplier: 2,
    minLevel: 1,
    description: "💵 Money - collect it!",
  },
  coffee: {
    className: "item coffee",
    emoji: "☕",
    damage: 0,
    points: 5,
    health: 10,
    spawnChance: 0.15,
    speedMultiplier: 1.3,
    minLevel: 1.5,
    description: "☕ Coffee restores stability",
  },
  heart: {
    className: "item heart",
    emoji: "❤️",
    damage: 0,
    points: 5,
    health: 25,
    spawnChance: 0.15,
    speedMultiplier: 0.7,
    minLevel: 2,
    description: "❤️ Health pack - major stability boost",
  },
  star: {
    className: "item star",
    emoji: "⭐",
    damage: 0,
    points: 20,
    health: 0,
    spawnChance: 0.15,
    speedMultiplier: 1.2,
    minLevel: 2,
    description: "⭐ Code optimization - bonus points!",
  },
  skull: {
    className: "item skull",
    emoji: "💀",
    damage: 40,
    points: 0,
    health: 0,
    spawnChance: 0.15,
    speedMultiplier: 1,
    minLevel: 2,
    description: "💀 Critical bug - avoid at all costs!",
  },
  skullBig: {
    className: "item skull-big",
    emoji: "💀",
    damage: 80,
    points: 0,
    health: 0,
    spawnChance: 0.15,
    speedMultiplier: 1,
    minLevel: 3,
    description: "💀 Uber critical bug - avoid at all costs!",
  },
  chartDown: {
    className: "item chart-down",
    emoji: "📉",
    damage: 5,
    points: 0,
    health: 0,
    spawnChance: 0.15,
    speedMultiplier: 1.5,
    minLevel: 2,
    description: "📉 Performance issue - minor damage",
  },
  chartUp: {
    className: "item chart-up",
    emoji: "📈",
    damage: 10,
    points: 0,
    health: 0,
    spawnChance: 0.15,
    speedMultiplier: 1.5,
    minLevel: 3,
    description: "📈 Resource problems!",
  },
  bugBig: {
    className: "item bug-big",
    emoji: "🐛",
    damage: 40,
    points: 0,
    health: 0,
    spawnChance: 0.3,
    speedMultiplier: 1,
    minLevel: 4,
    description: "🐛 Big bugs - major damage!",
  },
  bugHuge: {
    className: "item bug-huge",
    emoji: "🐞",
    damage: 75,
    points: 0,
    health: 0,
    spawnChance: 0.2,
    speedMultiplier: 1,
    minLevel: 4.1,
    description: "🐞 Huge bugs - catastrophic!",
  },
  trophy: {
    className: "item trophy",
    emoji: "🏆",
    damage: 0,
    points: 50,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 1,
    minLevel: 4,
    description: "🏆 Trophy - major points!",
  },
  angryUser: {
    className: "item angry-user",
    emoji: "😡",
    damage: 35,
    points: 0,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 1,
    minLevel: 2,
    description: "😡 Angry user - moderate damage",
  },
  furiousUser: {
    className: "item furious-user",
    emoji: "🤬",
    damage: 50,
    points: 0,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 1.5,
    minLevel: 2.5,
    description: "🤬 Furious user - major damage",
  },
  prodFire: {
    className: "item prod-fire",
    emoji: "🔥",
    damage: 100,
    points: 0,
    health: 0,
    spawnChance: 0.15,
    speedMultiplier: 2,
    minLevel: 2.9,
    description: "🔥 Production fire - catastrophic!",
  },
  securityIssue: {
    className: "item security-issue",
    emoji: "🐱‍👤",
    damage: 100,
    points: 0,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 2.5,
    minLevel: 3,
    description: "🐱‍👤 Security breach - high damage!",
  },
  hackAttack: {
    className: "item hack-attack",
    emoji: "👾",
    damage: 90,
    points: 0,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 2.2,
    minLevel: 4.5,
    description: "👾 Hacker attack - very dangerous!",
  },
  serverCrash: {
    className: "item server-crash",
    emoji: "💥",
    damage: 95,
    points: 0,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 2,
    minLevel: 4.8,
    description: "💥 Server crash - catastrophic failure!",
  },
  legacyCode: {
    className: "item legacy-code",
    emoji: "📜",
    damage: 60,
    points: 0,
    health: 0,
    spawnChance: 0.2,
    speedMultiplier: 1.8,
    minLevel: 4.2,
    description: "📜 Legacy code - moderate damage",
  },
  dataBreach: {
    className: "item data-breach",
    emoji: "🔓",
    damage: 85,
    points: 0,
    health: 0,
    spawnChance: 0.15,
    speedMultiplier: 2.1,
    minLevel: 5,
    description: "🔓 Data breach - severe damage!",
  },
  speedBoost: {
    className: "item speed-boost power-up-item",
    emoji: "⚡",
    damage: 0,
    points: 0,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 1,
    minLevel: 1,
    powerUp: {
      type: "speed",
      duration: 5000,
      multiplier: 1.5,
    },
    description: "⚡ Coffee rush - move faster!",
  },
  giant: {
    className: "item giant power-up-item",
    emoji: "🐋",
    damage: 0,
    points: 0,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 1,
    minLevel: 2,
    powerUp: {
      type: "size",
      duration: 5000,
      multiplier: 2.5,
    },
    description: "🐋 Monolithic code - larger hitbox",
  },
  huge: {
    className: "item huge power-up-item",
    emoji: "🐘",
    damage: 0,
    points: 0,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 1,
    minLevel: 1.5,
    powerUp: {
      type: "size",
      duration: 5000,
      multiplier: 1.5,
    },
    description: "🐘 Huge code - larger hitbox",
  },
  tiny: {
    className: "item tiny power-up-item",
    emoji: "🐜",
    damage: 0,
    points: 0,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 1,
    minLevel: 1.5,
    powerUp: {
      type: "size",
      duration: 5000,
      multiplier: 0.5,
    },
    description: "🐜 Microservice - smaller hitbox",
  },
  timeWarp: {
    className: "item time-warp power-up-item",
    emoji: "⏰",
    damage: 0,
    points: 0,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 1,
    minLevel: 1,
    powerUp: {
      type: "falling",
      duration: 5000,
      multiplier: 1.5,
    },
    description: "⏰ Time crunch - faster items",
  },
  resourceBoost: {
    className: "item resource-boost power-up-item",
    emoji: "💰",
    damage: 0,
    points: 0,
    health: 0,
    spawnChance: 0.1,
    speedMultiplier: 1,
    minLevel: 2,
    powerUp: {
      type: "resources",
      duration: 5000,
      multiplier: 2,
    },
    description: "💰 Code multiplier - double points",
  },
};

const powerUpEmoji = {
  speed: "⚡",
  size: "🐋",
  falling: "⏰",
  resources: "💰",
};

let gameStarted = false;
const mainMenu = document.getElementById("main-menu");
const gameContainer = document.querySelector(".game-container");
const playBtn = document.getElementById("play-btn");
const instructionsBtn = document.getElementById("instructions-btn");
const settingsBtn = document.getElementById("settings-btn");
const instructionsModal = document.getElementById("instructions");
const closeButtons = document.querySelectorAll(".close-btn");

playBtn.addEventListener("click", startGame);
instructionsBtn.addEventListener("click", showInstructions);
closeButtons.forEach((btn) => btn.addEventListener("click", closeModals));

function startGame() {
  gameStarted = true;
  mainMenu.style.display = "none";
  gameContainer.style.display = "block";
  initializeGame();
}

function showInstructions() {
  instructionsModal.style.display = "flex";
}

function closeModals() {
  instructionsModal.style.display = "none";
}

function initializeGame() {
  if (initializeGameElements()) {
    playerPos = {
      x: gameArea.offsetWidth / 2,
      y: gameArea.offsetHeight - 50,
    };
    playerVelocity = { x: 0, y: 0 };
    updateHealth();
    updateVersionProgress();
    startSpawning();
    requestAnimationFrame(updatePlayerPosition);
  }
}

window.onload = function () {
  initializeGameElements();
};

function initializeGameElements() {
  try {
    player = document.getElementById("player");
    gameArea = document.getElementById("game-area");
    scoreElement = document.getElementById("score");
    healthElement = document.getElementById("health");
    levelElement = document.getElementById("level");

    let missingElements = [];
    if (!player) missingElements.push("player");
    if (!gameArea) missingElements.push("game-area");
    if (!scoreElement) missingElements.push("score");
    if (!healthElement) missingElements.push("health");
    if (!levelElement) missingElements.push("level");

    if (missingElements.length > 0) {
      throw new Error(`Missing elements: ${missingElements.join(", ")}`);
    }

    return true;
  } catch (error) {
    console.error("Initialization error:", error);
    const errorMsg = document.getElementById("error-message");
    if (errorMsg) {
      errorMsg.style.display = "block";
      errorMsg.innerHTML = `Error loading game: ${error.message}<br>Please refresh the page.`;
    }
    return false;
  }
}

function updateHealth() {
  if (healthElement) {
    healthElement.textContent = Math.max(0, Math.floor(playerHealth));
    const healthFill = document.getElementById("health-fill");
    if (healthFill) {
      healthFill.style.width = `${Math.max(0, (playerHealth / maxHealth) * 100)}%`;
    }
  }
}

function updateVersionProgress() {
  const progressFill = document.getElementById("version-progress-fill");
  if (progressFill) {
    const progress = (versionProgress / (version * 50)) * 100;
    progressFill.style.width = `${Math.min(100, progress)}%`;
  }
}

function checkLevelUp() {
  if (versionProgress >= version * nextLevelScore) {
    version += 0.1;
    version = Number(version.toFixed(1));
    levelElement.textContent = version.toFixed(1);
    versionProgress = 0;
    updateVersionProgress();

    acceleration *= accelerationIncrease;
    maxSpeed *= maxSpeedIncrease;
    maxHealth += healthPerLevel;
    playerHealth = maxHealth;

    updateHealth();

    const middleOfScreenX = gameArea.offsetWidth / 3;
    const middleOfScreenY = gameArea.offsetHeight / 2;

    createCollectEffect(
      middleOfScreenX,
      middleOfScreenY,
      `Version ${version.toFixed(1)} Released!<br>+${healthPerLevel} Max HP!`
    );
  }
}

let isPaused = false;

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  a: false,
  A: false,
  d: false,
  D: false,
  j: false,
  J: false,
  Escape: false,
};

document.addEventListener("keydown", (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
    if (e.key === "Escape" && gameStarted) {
      togglePause();
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
  }
});

function handleCheatCodes() {
  if (keys.j || keys.J) {
    version += 0.1;
    version = Number(version.toFixed(1));
    levelElement.textContent = version.toFixed(1);

    const middleOfScreenX = gameArea.offsetWidth / 3;
    const middleOfScreenY = gameArea.offsetHeight / 2;

    createCollectEffect(middleOfScreenX, middleOfScreenY, `New Version ${version.toFixed(1)} 🎮`);

    acceleration *= accelerationIncrease;
    maxSpeed *= maxSpeedIncrease;

    keys.j = false;
    keys.J = false;
  }
}

function togglePause() {
  isPaused = !isPaused;
  const pauseOverlay = document.querySelector(".pause-overlay");

  if (isPaused) {
    if (!pauseOverlay) {
      const overlay = document.createElement("div");
      overlay.className = "pause-overlay";
      overlay.innerHTML = `
        <div class="pause-content">
          <h2>PAUSED</h2>
          <div class="pause-buttons">
            <button class="menu-btn" id="resume-btn">Resume</button>
            <button class="menu-btn" id="exit-btn">Exit Game</button>
          </div>
        </div>
      `;
      gameArea.appendChild(overlay);

      overlay.querySelector("#resume-btn").addEventListener("click", togglePause);
      overlay.querySelector("#exit-btn").addEventListener("click", () => {
        gameStarted = false;
        location.reload();
      });
    }
  } else {
    pauseOverlay?.remove();
  }
}

function updatePlayerPosition() {
  if (!gameStarted) return;

  if (!isPaused) {
    if (keys.ArrowLeft || keys.a || keys.A) playerVelocity.x -= acceleration;
    if (keys.ArrowRight || keys.d || keys.D) playerVelocity.x += acceleration;
    // if (keys.ArrowUp) playerVelocity.y -= acceleration;
    // if (keys.ArrowDown) playerVelocity.y += acceleration;

    handleCheatCodes();

    playerVelocity.x *= friction;
    // playerVelocity.y *= friction;
    const currentSpeed = maxSpeed * (powerUps.speed.active ? powerUps.speed.multiplier : 1);
    playerVelocity.x = Math.min(Math.max(playerVelocity.x, -currentSpeed), currentSpeed);
    // playerVelocity.y = Math.min(Math.max(playerVelocity.y, -maxSpeed), maxSpeed);

    playerPos.x += playerVelocity.x;
    // playerPos.y += playerVelocity.y;

    playerPos.x = Math.min(Math.max(playerPos.x, 0), gameArea.offsetWidth - 40);
    // playerPos.y = Math.min(Math.max(playerPos.y, 0), gameArea.offsetHeight - 40);

    player.style.left = `${playerPos.x}px`;
    player.style.top = `${playerPos.y}px`;
  }

  requestAnimationFrame(updatePlayerPosition);
}

let gameStats = {
  itemsCollected: 0,
  bugsAvoided: 0,
};

const SPAWN_CONFIG = {
  baseInterval: 1000,
  minInterval: 400,
  elementsPerLevel: 1.3,
  maxSimultaneous: 15,
};

function startSpawning() {
  let activeElements = 0;

  setInterval(() => {
    if (!gameStarted || isPaused) return;

    const numberOfElements = Math.min(
      Math.floor(SPAWN_CONFIG.elementsPerLevel * version),
      SPAWN_CONFIG.maxSimultaneous - activeElements
    );

    for (let i = 0; i < numberOfElements; i++) {
      if (activeElements < SPAWN_CONFIG.maxSimultaneous) {
        spawnElement();
        activeElements++;
      }
    }
  }, Math.max(SPAWN_CONFIG.baseInterval - (version - 1) * 50, SPAWN_CONFIG.minInterval));

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        activeElements = gameArea.querySelectorAll(".bug, .item").length;
      }
    });
  });

  observer.observe(gameArea, { childList: true });
}

let seenItems = new Set();

function spawnElement() {
  if (!gameStarted || isPaused) return;

  const availableItems = Object.entries(ITEMS_CONFIG).filter(([_, config]) => config.minLevel <= version);

  if (availableItems.length === 0) return;

  const totalChance = availableItems.reduce((sum, [_, config]) => sum + config.spawnChance, 0);

  const rand = Math.random() * totalChance;
  let cumulative = 0;
  let selectedType = null;

  for (const [type, config] of availableItems) {
    cumulative += config.spawnChance;
    if (rand <= cumulative && !selectedType) {
      selectedType = type;
    }
  }

  const config = ITEMS_CONFIG[selectedType];
  const element = document.createElement("div");
  element.className = config.className;

  const spread = Math.min(0.1 * version, 0.5);
  const randomSpread = (Math.random() * 2 - 1) * spread;
  const basePosition = Math.random();
  const finalPosition = Math.max(0, Math.min(1, basePosition + randomSpread));

  element.style.left = finalPosition * (gameArea.offsetWidth - 20) + "px";
  element.style.top = "0px";
  element.setAttribute("data-type", selectedType);
  gameArea.appendChild(element);

  if (!seenItems.has(selectedType)) {
    seenItems.add(selectedType);
    const itemPosition = parseInt(element.style.left, 10);
    showItemDescription(config, itemPosition, 0);
  }

  let pos = 0;
  const interval = setInterval(() => {
    if (!isPaused) {
      const fallingSpeed =
        (2 + (version - 1) * 0.5) *
        config.speedMultiplier *
        (powerUps.falling.active ? powerUps.falling.multiplier : 1);
      pos += fallingSpeed;
      element.style.transform = `translateY(${pos}px)`;

      if (isColliding(element, player)) {
        handleCollision(element, config);
        element.remove();
        clearInterval(interval);
      }

      if (pos > gameArea.offsetHeight) {
        if (config.damage > 0) {
          gameStats.bugsAvoided++;
        }
        element.remove();
        clearInterval(interval);
      }
    }
  }, 20);
}

let powerUps = {
  speed: { active: false, multiplier: 1 },
  size: { active: false, multiplier: 1 },
  falling: { active: false, multiplier: 1 },
  resources: { active: false, multiplier: 1 },
};

function handleCollision(element, config) {
  if (!gameStarted || isPaused) return;

  let text = "";

  if (config.health > 0) {
    playerHealth = Math.min(maxHealth, playerHealth + config.health);
    updateHealth();
    // createCollectEffect(element.offsetLeft, element.offsetTop, `+${config.health}❤️`);
    text += `+${config.health}❤️`;
  }

  if (config.powerUp) {
    activatePowerUp(config.powerUp);
    // createCollectEffect(element.offsetLeft, element.offsetTop, `${config.emoji} POWER UP!`);
    text += `${config.emoji} POWER UP!`;
  }

  if (config.damage > 0) {
    playerHealth = Math.max(0, playerHealth - config.damage);
    updateHealth();
    gameArea.classList.add("damage-effect");
    setTimeout(() => gameArea.classList.remove("damage-effect"), 300);
  }

  if (config.points > 0) {
    gameStats.itemsCollected++;
    const pointsMultiplier = powerUps.resources.active ? powerUps.resources.multiplier : 1;
    const finalPoints = config.points * pointsMultiplier;
    score += finalPoints;
    versionProgress += finalPoints;
    scoreElement.textContent = score;
    // createCollectEffect(
    //   element.offsetLeft,
    //   element.offsetTop,
    //   `+${finalPoints}${pointsMultiplier > 1 ? " ×" + pointsMultiplier : ""}`
    // );
    text += `+${finalPoints}${pointsMultiplier > 1 ? " ×" + pointsMultiplier : ""}`;
    updateVersionProgress();
  }

  if (text !== "") {
    createCollectEffect(element.offsetLeft, element.offsetTop, text);
  }

  checkLevelUp();

  if (playerHealth <= 0) {
    showEndScreen();
  }
}

function activatePowerUp(powerUp) {
  const { type, duration, multiplier } = powerUp;

  if (powerUps[type].active) {
    clearTimeout(powerUps[type].timeout);
  }

  powerUps[type].active = true;
  powerUps[type].multiplier = multiplier;

  if (type === "size") {
    player.style.transform = `scale(${multiplier})`;
  }

  let powerUpDisplay = document.querySelector(`.power-up-status[data-type="${type}"]`);
  const container = document.querySelector(".power-ups-container");

  if (!powerUpDisplay) {
    powerUpDisplay = document.createElement("div");
    powerUpDisplay.className = "power-up-status";
    powerUpDisplay.setAttribute("data-type", type);

    const emoji = powerUpEmoji[type];

    powerUpDisplay.innerHTML = `
      ${emoji}
      <div class="power-up-bar">
        <div class="power-up-fill"></div>
      </div>
    `;
    container.appendChild(powerUpDisplay);
  }

  const fill = powerUpDisplay.querySelector(".power-up-fill");
  const startTime = Date.now();
  const endTime = startTime + duration;

  function updateProgress() {
    const now = Date.now();
    const remaining = endTime - now;
    if (remaining > 0) {
      const progress = (remaining / duration) * 100;
      fill.style.width = `${progress}%`;
      requestAnimationFrame(updateProgress);
    }
  }
  updateProgress();

  powerUps[type].timeout = setTimeout(() => {
    powerUps[type].active = false;
    powerUps[type].multiplier = 1;
    if (type === "size") {
      player.style.transform = "scale(1)";
    }
    powerUpDisplay.remove();
  }, duration);
}

function showEndScreen() {
  const gameOverScreen = document.getElementById("game-over");
  document.getElementById("final-score").textContent = score;
  document.getElementById("final-level").textContent = version;
  document.getElementById("items-collected").textContent = gameStats.itemsCollected;
  document.getElementById("bugs-avoided").textContent = gameStats.bugsAvoided;

  const statsContainer = document.querySelector(".stats-container");
  const maxHealthStat = document.createElement("div");
  maxHealthStat.className = "stat-item";
  maxHealthStat.innerHTML = `
      <span class="stat-label">Max Health:</span>
      <span>${maxHealth}</span>
  `;
  statsContainer.appendChild(maxHealthStat);

  gameOverScreen.style.display = "flex";

  gameStarted = false;
}

document.getElementById("restart-btn").addEventListener("click", () => {
  location.reload();
});

function createCollectEffect(x, y, text) {
  const effect = document.createElement("div");
  effect.className = "collect-effect";
  effect.style.left = x + "px";
  effect.style.top = y + "px";
  effect.innerHTML = text;
  gameArea.appendChild(effect);
  setTimeout(() => effect.remove(), 1000);
}

function isColliding(element1, element2) {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

function showItemDescription(item, x, y) {
  if (!item.description) return;

  const tooltip = document.createElement("div");
  tooltip.className = "power-up-status item-tooltip";
  tooltip.innerHTML = item.description;

  gameArea.appendChild(tooltip);

  setTimeout(() => {
    tooltip.classList.add("fade-out");
    setTimeout(() => tooltip.remove(), 500);
  }, 2500);
}
