class RandomGenerator {
  constructor(seed) {
    this.seed = seed || Math.floor(Math.random() * 1000000);
  }

  random() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}
let baseSeed = Date.now();
const dungeonScoreEndpoint = "../../api/dungeon/score";

async function issuePostScoreRequest(score, timeInSeconds, dungeonLevel, size, baseSeed) {
  const data = { score, time: timeInSeconds, dungeonLevel, size, seed: baseSeed };
  fetch(dungeonScoreEndpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
}

const exitSymbol = "🕳️";
const entranceSymbol = "🪜";

const lootTypes = [
  { emoji: "💎", type: "crystal", value: 250 },
  { emoji: "💵", type: "cash", value: 100, display: false },
  { emoji: "⭐", type: "star", value: 500 },
  { emoji: "🏺", type: "urn", value: 1000 },
  { emoji: "🔮", type: "orb", value: 500 },
  { emoji: "📜", type: "scroll", value: 750 },
  { emoji: "❤️", type: "big_health_potion", value: 600, healing: 50, display: false },
  { emoji: "💊", type: "health_potion", value: 300, healing: 25, display: false },
  { emoji: "🍎", type: "apple", value: 100, healing: 5, display: false },
  { emoji: "🍇", type: "grapes", value: 150, healing: 10, display: false },
  { emoji: "🍌", type: "banana", value: 200, healing: 15, display: false },
];

const movementStrategies = {
  random: (monster, dungeon, hero) => {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];
    return directions[Math.floor(Math.random() * directions.length)];
  },

  chase: (monster, dungeon, hero) => {
    if (!monster.wanderSteps) monster.wanderSteps = 0;
    if (!monster.wanderDirection) monster.wanderDirection = null;
    if (!monster.stuckCount) monster.stuckCount = 0;
    if (!monster.wanderTimeout) monster.wanderTimeout = 0;
    if (!monster.lastPosition) monster.lastPosition = { x: monster.x, y: monster.y };
    if (!monster.wanderAttempts) monster.wanderAttempts = 0;

    const now = Date.now();
    const WANDER_DURATION = 5000;
    const MAX_WANDER_STEPS = 15;
    const MAX_STUCK_COUNT = 3;
    const MAX_WANDER_ATTEMPTS = 3;

    if (monster.lastPosition.x === monster.x && monster.lastPosition.y === monster.y) {
      monster.stuckCount++;
    } else {
      monster.stuckCount = 0;
      if (!monster.wanderSteps) {
        monster.wanderAttempts = 0;
      }
    }

    monster.lastPosition = { x: monster.x, y: monster.y };

    if (monster.stuckCount > MAX_STUCK_COUNT || (monster.wanderTimeout && now < monster.wanderTimeout)) {
      if (!monster.wanderTimeout) {
        monster.wanderTimeout = now + WANDER_DURATION;
        monster.wanderSteps = MAX_WANDER_STEPS;
        monster.wanderAttempts++;
      }

      if (monster.stuckCount > MAX_STUCK_COUNT * 2) {
        monster.wanderDirection = null;
        monster.stuckCount = 0;
      }

      if (!monster.wanderDirection || monster.stuckCount > MAX_STUCK_COUNT) {
        const possibleDirections = [];

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const newX = monster.x + dx;
            const newY = monster.y + dy;

            if (
              newX >= 0 &&
              newX < dungeon.width &&
              newY >= 0 &&
              newY < dungeon.height &&
              dungeon.grid[newY][newX] === 0
            ) {
              possibleDirections.push({ dx, dy });
            }
          }
        }

        const scoredDirections = possibleDirections
          .map((dir) => {
            let score = 0;
            const testX = monster.x + dir.dx * 2;
            const testY = monster.y + dir.dy * 2;

            if (
              testX >= 0 &&
              testX < dungeon.width &&
              testY >= 0 &&
              testY < dungeon.height &&
              dungeon.grid[testY][testX] === 0
            ) {
              score += 2;
            }

            for (let i = 1; i <= 3; i++) {
              const checkX = monster.x + dir.dx * i;
              const checkY = monster.y + dir.dy * i;
              if (
                checkX >= 0 &&
                checkX < dungeon.width &&
                checkY >= 0 &&
                checkY < dungeon.height &&
                dungeon.grid[checkY][checkX] === 0
              ) {
                score++;
              }
            }

            return { dir, score };
          })
          .sort((a, b) => b.score - a.score);

        if (scoredDirections.length > 0) {
          const topChoices = scoredDirections.slice(0, 3);
          monster.wanderDirection = topChoices[Math.floor(Math.random() * topChoices.length)].dir;
        }
      }

      if (monster.wanderDirection) {
        monster.wanderSteps--;
        if (monster.wanderSteps <= 0 || monster.wanderAttempts >= MAX_WANDER_ATTEMPTS) {
          monster.wanderTimeout = 0;
          monster.wanderDirection = null;
          monster.wanderAttempts = 0;
        }
        return monster.wanderDirection;
      }
    }

    const PREDICTION_DISTANCE = 4;
    let targetX = hero.x;
    let targetY = hero.y;

    if (!monster.lastHeroX) monster.lastHeroX = hero.x;
    if (!monster.lastHeroY) monster.lastHeroY = hero.y;

    const heroMovingX = hero.x - monster.lastHeroX;
    const heroMovingY = hero.y - monster.lastHeroY;

    monster.lastHeroX = hero.x;
    monster.lastHeroY = hero.y;

    if (heroMovingX !== 0 || heroMovingY !== 0) {
      targetX = hero.x + heroMovingX * PREDICTION_DISTANCE;
      targetY = hero.y + heroMovingY * PREDICTION_DISTANCE;
    }

    targetX = Math.max(0, Math.min(dungeon.width - 1, targetX));
    targetY = Math.max(0, Math.min(dungeon.height - 1, targetY));

    while (targetX !== hero.x && targetY !== hero.y && dungeon.grid[targetY]?.[targetX] === 1) {
      targetX -= Math.sign(targetX - hero.x);
      targetY -= Math.sign(targetY - hero.y);
    }

    const dx = Math.sign(targetX - monster.x);
    const dy = Math.sign(targetY - monster.y);

    const movementPriorities = [
      { dx, dy }, // Direct path
      { dx, dy: 0 }, // Horizontal
      { dx: 0, dy }, // Vertical
      { dx: -dx, dy }, // Side step 1
      { dx, dy: -dy }, // Side step 2
      { dx: -dx, dy: -dy }, // Diagonal back
    ];

    for (const move of movementPriorities) {
      const newX = monster.x + move.dx;
      const newY = monster.y + move.dy;
      if (newX >= 0 && newX < dungeon.width && newY >= 0 && newY < dungeon.height && dungeon.grid[newY][newX] === 0) {
        return move;
      }
    }

    return { dx: 0, dy: 0 };
  },

  patrol: (monster, dungeon, hero) => {
    if (!monster.patrolDirection) monster.patrolDirection = "horizontal";
    if (!monster.patrolStep) monster.patrolStep = 1;

    if (monster.patrolDirection === "horizontal") {
      const newX = monster.x + monster.patrolStep;
      if (newX < 0 || newX >= dungeon.width || dungeon.grid[monster.y][newX] === 1) {
        monster.patrolStep *= -1;
      }
      return { dx: monster.patrolStep, dy: 0 };
    } else {
      const newY = monster.y + monster.patrolStep;
      if (newY < 0 || newY >= dungeon.height || dungeon.grid[newY][monster.x] === 1) {
        monster.patrolStep *= -1;
      }
      return { dx: 0, dy: monster.patrolStep };
    }
  },

  ambush: (monster, dungeon, hero) => {
    const ambushDistance = 5;
    const distance = Math.sqrt(Math.pow(hero.x - monster.x, 2) + Math.pow(hero.y - monster.y, 2));
    if (distance < 5) {
      return movementStrategies.chase(monster, dungeon, hero);
    }
    return { dx: 0, dy: 0 };
  },
};

const monsterTypes = [
  { emoji: "👻", type: "ghost", damage: 10, speed: 2, strategy: "random" },
  { emoji: "🐉", type: "dragon", damage: 20, speed: 2, strategy: "random" },
  { emoji: "🧟", type: "zombie", damage: 15, speed: 1, strategy: "chase" },
  { emoji: "🦇", type: "bat", damage: 5, speed: 3, strategy: "random" },
  { emoji: "🕷️", type: "spider", damage: 8, speed: 2, strategy: "ambush" },
  { emoji: "🐺", type: "wolf", damage: 12, speed: 1.5, strategy: "chase" },
  { emoji: "🦑", type: "squid", damage: 18, speed: 1, strategy: "patrol" },
  { emoji: "🌀", type: "void", damage: 50, speed: 5, strategy: "random" },
  { emoji: "👽", type: "alien", damage: 25, speed: 1.5, strategy: "ambush" },
  { emoji: "🤖", type: "robot", damage: 30, speed: 1, strategy: "patrol" },
  { emoji: "👾", type: "space_invader", damage: 20, speed: 2, strategy: "random" },
  { emoji: "🧛", type: "vampire", damage: 35, speed: 2.2, strategy: "ambush" },
  { emoji: "🐲", type: "wyvern", damage: 22, speed: 1.8, strategy: "chase" },
  { emoji: "🧚", type: "fairy", damage: 5, speed: 10, strategy: "random" },
  { emoji: "🦅", type: "griffin", damage: 32, speed: 2.6, strategy: "patrol" },
];

const heroClasses = {
  wizard: {
    emoji: "🧙",
    health: 80,
    visibilityRadius: 10,
    damage: 1.5,
    description: "Higher visibility & magic damage",
  },
  warrior: {
    emoji: "⚔️",
    health: 150,
    visibilityRadius: 6,
    damage: 2.0,
    description: "More health & physical damage",
  },
  rogue: {
    emoji: "🐱‍👤",
    health: 100,
    visibilityRadius: 8,
    damage: 1.8,
    description: "Balanced stats & stealth",
  },
};

const difficultySettings = {
  normal: {
    monsterCount: { min: 0, max: 1 },
    monsterDamageMultiplier: 1.0,
    lootCount: { min: 1, max: 3 },
    roomCount: { min: 5, max: 10 },
    mapSize: { min: 30, max: 50 },
  },
  hard: {
    monsterCount: { min: 2, max: 4 },
    monsterDamageMultiplier: 2,
    lootCount: { min: 0, max: 1 },
    roomCount: { min: 7, max: 12 },
    mapSize: { min: 40, max: 100 },
  },
};

const ZOOM_STEP = 0.2;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
let zoomLevel = 1.0;

function increaseDifficulty(currentDifficultySettings) {
  const next = { ...currentDifficultySettings };
  next.monsterDamageMultiplier = currentDifficultySettings.monsterDamageMultiplier + 0.01;
  next.roomCount = {
    min: currentDifficultySettings.roomCount.min + Math.round(Math.random()),
    max: currentDifficultySettings.roomCount.max + Math.round(Math.random()),
  };

  next.mapSize = {
    min: currentDifficultySettings.mapSize.min + Math.round(Math.random()),
    max: currentDifficultySettings.mapSize.max + Math.round(Math.random()),
  };

  return next;
}

class Monster {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.moveTimer = 0;
    this.moveInterval = 1000 / type.speed;
    this.lastMove = Date.now();
    this.strategy = type.strategy;
  }

  update(dungeon, hero) {
    const now = Date.now();
    if (now - this.lastMove > this.moveInterval) {
      this.move(dungeon, hero);
      this.lastMove = now;
      // check for collision with hero
      if (this.x === hero.x && this.y === hero.y) {
        hero.takeDamage(this.type.damage, dungeon);
      }
    }
  }

  move(dungeon, hero) {
    const movement = movementStrategies[this.strategy](this, dungeon, hero);
    const newX = this.x + movement.dx;
    const newY = this.y + movement.dy;

    if (newX >= 0 && newX < dungeon.width && newY >= 0 && newY < dungeon.height && dungeon.grid[newY][newX] === 0) {
      this.x = newX;
      this.y = newY;
    }
  }
}

class Dungeon {
  constructor(seed, difficultySettings) {
    this.difficulty = difficultySettings;
    this.seed = seed;

    this.width =
      this.difficulty.mapSize.min +
      Math.floor(Math.random() * (this.difficulty.mapSize.max - this.difficulty.mapSize.min + 1));
    this.height =
      this.difficulty.mapSize.min +
      Math.floor(Math.random() * (this.difficulty.mapSize.max - this.difficulty.mapSize.min + 1));

    this.rng = new RandomGenerator(seed);
    this.grid = Array(this.height)
      .fill()
      .map(() => Array(this.width).fill(1));
    this.rooms = [];
    this.entrance = null;
    this.exit = null;
    this.loot = [];
    this.monsters = [];
    this.doors = [];
    this.keys = [];
  }

  generate() {
    console.log(`Generating dungeon with difficulty: ${this.difficulty} and seed: ${this.seed}`);
    const { min, max } = this.difficulty.roomCount;
    this.generateRooms(min, max);
    this.connectRooms();
    this.placeEntranceAndExit();
    this.placeLoot();
    this.placeMonsters();
    this.placeDoors();
  }

  generateRooms(minRooms, maxRooms) {
    const numRooms = Math.floor(this.rng.random() * (maxRooms - minRooms + 1)) + minRooms;

    for (let i = 0; i < numRooms; i++) {
      const roomWidth = Math.floor(this.rng.random() * 5) + 4;
      const roomHeight = Math.floor(this.rng.random() * 5) + 4;
      const x = Math.floor(this.rng.random() * (this.width - roomWidth - 2)) + 1;
      const y = Math.floor(this.rng.random() * (this.height - roomHeight - 2)) + 1;

      if (this.canPlaceRoom(x, y, roomWidth, roomHeight)) {
        this.carveRoom(x, y, roomWidth, roomHeight);
        this.rooms.push({ x, y, width: roomWidth, height: roomHeight });
      }
    }
  }

  canPlaceRoom(x, y, width, height) {
    for (let dy = -1; dy <= height; dy++) {
      for (let dx = -1; dx <= width; dx++) {
        if (this.grid[y + dy]?.[x + dx] === 0) return false;
      }
    }
    return true;
  }

  carveRoom(x, y, width, height) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        this.grid[y + dy][x + dx] = 0;
      }
    }
  }

  connectRooms() {
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const roomA = this.rooms[i];
      const roomB = this.rooms[i + 1];
      this.carveCorridor(
        roomA.x + Math.floor(roomA.width / 2),
        roomA.y + Math.floor(roomA.height / 2),
        roomB.x + Math.floor(roomB.width / 2),
        roomB.y + Math.floor(roomB.height / 2)
      );
    }
  }

  carveCorridor(x1, y1, x2, y2) {
    let x = x1;
    let y = y1;

    while (x !== x2 || y !== y2) {
      if (x !== x2 && (y === y2 || this.rng.random() < 0.5)) {
        x += x < x2 ? 1 : -1;
      } else {
        y += y < y2 ? 1 : -1;
      }
      this.grid[y][x] = 0;
    }
  }

  placeEntranceAndExit() {
    const startRoom = this.rooms[0];
    this.entrance = {
      x: startRoom.x + Math.floor(startRoom.width / 2),
      y: startRoom.y + Math.floor(startRoom.height / 2),
    };

    const endRoom = this.rooms[this.rooms.length - 1];
    this.exit = {
      x: endRoom.x + Math.floor(endRoom.width / 2),
      y: endRoom.y + Math.floor(endRoom.height / 2),
    };
  }

  placeLoot() {
    for (let i = 1; i < this.rooms.length - 1; i++) {
      const room = this.rooms[i];

      const lootCount =
        Math.floor(this.rng.random() * (this.difficulty.lootCount.max - this.difficulty.lootCount.min + 1)) +
        this.difficulty.lootCount.min;

      for (let j = 0; j < lootCount; j++) {
        const lootType = { ...lootTypes[Math.floor(this.rng.random() * lootTypes.length)] };
        const x = room.x + Math.floor(this.rng.random() * (room.width - 2)) + 1;
        const y = room.y + Math.floor(this.rng.random() * (room.height - 2)) + 1;
        this.loot.push({ ...lootType, x, y, collected: false });
      }
    }
  }

  placeMonsters() {
    for (let i = 1; i < this.rooms.length - 1; i++) {
      const room = this.rooms[i];
      const monsterCount =
        Math.floor(this.rng.random() * (this.difficulty.monsterCount.max - this.difficulty.monsterCount.min + 1)) +
        this.difficulty.monsterCount.min;

      for (let j = 0; j < monsterCount; j++) {
        const monsterType = { ...monsterTypes[Math.floor(this.rng.random() * monsterTypes.length)] };
        monsterType.damage = Math.round(monsterType.damage * this.difficulty.monsterDamageMultiplier);
        const x = room.x + Math.floor(this.rng.random() * (room.width - 2)) + 1;
        const y = room.y + Math.floor(this.rng.random() * (room.height - 2)) + 1;
        this.monsters.push(new Monster(x, y, monsterType));
      }
    }
  }

  isCorridorTile(x, y) {
    if (this.grid[y][x] !== 0) return false;

    let floorCount = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (this.grid[y + dy]?.[x + dx] === 0) {
          floorCount++;
        }
      }
    }
    return floorCount === 2;
  }

  findCorridorTiles(roomA, roomB) {
    const corridorTiles = [];
    const minX = Math.min(roomA.x, roomB.x);
    const maxX = Math.max(roomA.x + roomA.width, roomB.x + roomB.width);
    const minY = Math.min(roomA.y, roomB.y);
    const maxY = Math.max(roomA.y + roomA.height, roomB.y + roomB.height);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (this.isCorridorTile(x, y)) {
          const distanceToRoomA = Math.min(
            Math.abs(x - roomA.x),
            Math.abs(x - (roomA.x + roomA.width)),
            Math.abs(y - roomA.y),
            Math.abs(y - (roomA.y + roomA.height))
          );
          const distanceToRoomB = Math.min(
            Math.abs(x - roomB.x),
            Math.abs(x - (roomB.x + roomB.width)),
            Math.abs(y - roomB.y),
            Math.abs(y - (roomB.y + roomB.height))
          );

          if (distanceToRoomA > 1 && distanceToRoomB > 1) {
            corridorTiles.push({ x, y });
          }
        }
      }
    }

    corridorTiles.sort((a, b) => {
      const distA = Math.abs(a.x - roomA.x) + Math.abs(a.y - roomA.y);
      const distB = Math.abs(b.x - roomA.x) + Math.abs(b.y - roomA.y);
      return distB - distA;
    });

    return corridorTiles;
  }

  placeDoors() {
    let availableRooms = [...this.rooms];
    availableRooms.shift();
    availableRooms.pop();

    for (let i = 0; i < availableRooms.length - 1; i++) {
      const currentRoom = availableRooms[i];
      const nextRoom = availableRooms[i + 1];
      const keyX = currentRoom.x + Math.floor(this.rng.random() * (currentRoom.width - 2)) + 1;
      const keyY = currentRoom.y + Math.floor(this.rng.random() * (currentRoom.height - 2)) + 1;
      const doorColor = ["red", "blue", "green"][Math.floor(this.rng.random() * 3)];

      this.keys.push({
        x: keyX,
        y: keyY,
        color: doorColor,
        collected: false,
      });

      const corridorTiles = this.findCorridorTiles(currentRoom, nextRoom);
      if (corridorTiles.length > 0) {
        const doorTile = corridorTiles[Math.floor(this.rng.random() * corridorTiles.length)];

        this.doors.push({
          x: doorTile.x,
          y: doorTile.y,
          color: doorColor,
          locked: true,
        });
      }
    }
  }
}

function createStartScreen() {
  const overlay = document.createElement("div");
  overlay.className = "start-screen";

  const content = `
    <div class="start-card">
      <h1>Dungeon Explorer</h1>
      
      <div class="options-grid">
        <div class="option-btn selected" data-difficulty="normal">
          <div>🎯 Normal</div>
          <small>Balanced experience</small>
        </div>
        <div class="option-btn" data-difficulty="hard">
          <div>💀 Hard</div>
          <small>More monsters</small>
        </div>
      </div>

      <div class="options-grid">
        <div class="option-btn selected" data-class="wizard">
          <div>${heroClasses.wizard.emoji} Wizard</div>
          <small>${heroClasses.wizard.description}</small>
        </div>
        <div class="option-btn" data-class="warrior">
          <div>${heroClasses.warrior.emoji} Warrior</div>
          <small>${heroClasses.warrior.description}</small>
        </div>
        <div class="option-btn" data-class="rogue">
          <div>${heroClasses.rogue.emoji} Rogue</div>
          <small>${heroClasses.rogue.description}</small>
        </div>
      </div>

      <input type="text" id="seed" placeholder="Enter seed (optional)" autocomplete="off">
      
      <button class="start-btn" id="start-game">Begin Adventure</button>

      <div class="controls-info">
        <p>🎮 Move: WASD or Arrow Keys</p>
        <p>🔍 +/-: Zoom | 🗝️ Find keys to unlock doors</p>
      </div>
    </div>
  `;

  overlay.innerHTML = content;
  document.body.appendChild(overlay);

  const optionBtns = overlay.querySelectorAll(".option-btn");
  optionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.parentElement.querySelectorAll(".option-btn");
      group.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  return new Promise((resolve) => {
    document.getElementById("start-game").onclick = () => {
      const seed = document.getElementById("seed").value ? parseInt(document.getElementById("seed").value) : Date.now();
      const difficultyName = overlay.querySelector("[data-difficulty].selected").dataset.difficulty;
      const characterClass = overlay.querySelector("[data-class].selected").dataset.class;

      overlay.remove();
      resolve({ seed, difficultyName, characterClass });
    };
  });
}

const style = document.createElement("style");
style.textContent = `
  .level-complete {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 20px 40px;
    border-radius: 10px;
    font-size: 24px;
    animation: fadeInOut 2s ease-in-out;
    z-index: 1000;
  }

  @keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  }
`;
document.head.appendChild(style);

async function initGame() {
  const { seed, difficultyName, characterClass } = await createStartScreen();
  baseSeed = seed || Math.floor(Math.random() * 1000000);
  console.log(`Starting game with seed: ${baseSeed}, difficulty: ${difficultyName}, class: ${characterClass}`);

  const canvas = document.getElementById("dungeon-grid");
  const ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 600;

  const BASE_TILE_SIZE = 16;
  const startTime = Date.now();

  function updateTime() {
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    document.getElementById("time").textContent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  const dungeon = new Dungeon(baseSeed, difficultySettings[difficultyName]);
  dungeon.generate();

  const hero = new Hero(dungeon.entrance.x, dungeon.entrance.y, characterClass);
  hero.startTime = startTime;

  updateInventoryDisplay(hero.inventory, hero.health);
  updateDisplay(hero);

  let currentDungeon = dungeon;

  window.addEventListener("keydown", (e) => {
    let dx = 0,
      dy = 0,
      move = false;

    switch (e.key) {
      case "ArrowUp":
      case "w":
        dy = -1;
        break;
      case "ArrowDown":
      case "s":
        dy = 1;
        break;
      case "ArrowLeft":
      case "a":
        dx = -1;
        break;
      case "ArrowRight":
      case "d":
        dx = 1;
        break;
      case "+":
      case "=":
        zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP);
        break;
      case "-":
      case "_":
        zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP);
        break;
      case "v":
        hero.toggleVisibility();
        render(currentDungeon);
        break;
      case "x":
        hero.health = 0;
        hero.takeDamage(0, dungeon);
        break;
      case "q":
        hero.health += 100;
        hero.inventory.gold += 100;
        [
          "red",
          "blue",
          "green",
          "black",
          "white",
          "yellow",
          "purple",
          "orange",
          "pink",
          "cyan",
          "magenta",
          "lime",
          "brown",
          "gray",
          "maroon",
          "navy",
        ].forEach((color) => {
          hero.inventory.keys.push(color);
        });
        lootTypes.forEach((type) => {
          if (type.display === false) return;
          hero.inventory.treasures[type.type].count += 100;
        });
        updateInventoryDisplay(hero.inventory, hero.health);
        break;
      case "e": {
        hero.x = currentDungeon.exit.x;
        hero.y = currentDungeon.exit.y;
        move = true;
        break;
      }
    }

    if (dx !== 0 || dy !== 0 || move) {
      const newX = hero.x + dx;
      const newY = hero.y + dy;

      if (newX === currentDungeon.exit.x && newY === currentDungeon.exit.y) {
        currentDungeon = hero.levelComplete(currentDungeon);
      } else {
        hero.move(dx, dy, currentDungeon);
      }
    }

    render(currentDungeon);
  });

  const endButton = document.createElement("button");
  endButton.className = "end-adventure-btn";
  endButton.textContent = "🚪 End Adventure";
  endButton.onclick = () => {
    showConfirmationDialog(
      "Are you sure you want to end your adventure? Your progress will be lost.",
      () => {
        hero.health = 0;
        hero.takeDamage(0, dungeon);
      },
      () => {
        // Do nothing on cancel
      }
    );
  };
  document.body.appendChild(endButton);

  const tileSize = 16;
  function render(dungeon) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const currentTileSize = BASE_TILE_SIZE * zoomLevel;

    const offsetX = canvas.width / 2 - hero.x * currentTileSize;
    const offsetY = canvas.height / 2 - hero.y * currentTileSize;

    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const tileX = offsetX + x * currentTileSize;
        const tileY = offsetY + y * currentTileSize;

        if (tileX > -currentTileSize && tileX < canvas.width && tileY > -currentTileSize && tileY < canvas.height) {
          if (hero.isVisible(x, y)) {
            if (dungeon.grid[y][x] === 1) {
              ctx.fillStyle = "#666";
            } else {
              ctx.fillStyle = "#222";
            }
          } else {
            ctx.fillStyle = "#000";
          }
          ctx.fillRect(tileX, tileY, currentTileSize, currentTileSize);
        }
      }
    }

    const fontSize = Math.max(12, Math.floor(16 * zoomLevel));
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    dungeon.loot.forEach((item) => {
      if (!item.collected && hero.isVisible(item.x, item.y)) {
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          item.emoji,
          offsetX + item.x * currentTileSize + currentTileSize / 2,
          offsetY + item.y * currentTileSize + currentTileSize / 2
        );
      }
    });

    dungeon.monsters.forEach((monster) => {
      if (hero.isVisible(monster.x, monster.y)) {
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          monster.type.emoji,
          offsetX + monster.x * currentTileSize + currentTileSize / 2,
          offsetY + monster.y * currentTileSize + currentTileSize / 2
        );
      }
    });

    dungeon.doors.forEach((door) => {
      if (hero.isVisible(door.x, door.y)) {
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = door.color;
        ctx.fillText(
          door.locked ? "🚫" : "🚪",
          offsetX + door.x * currentTileSize + currentTileSize / 2,
          offsetY + door.y * currentTileSize + currentTileSize / 2
        );
      }
    });

    dungeon.keys.forEach((key) => {
      if (!key.collected && hero.isVisible(key.x, key.y)) {
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = key.color;
        ctx.fillText(
          "🔑",
          offsetX + key.x * currentTileSize + currentTileSize / 2,
          offsetY + key.y * currentTileSize + currentTileSize / 2
        );
      }
    });

    if (hero.isVisible(dungeon.entrance.x, dungeon.entrance.y)) {
      ctx.font = "28px Arial";
      ctx.shadowColor = "rgba(255, 255, 0, 0.5)";
      ctx.shadowBlur = 20;
      ctx.fillText(
        entranceSymbol,
        offsetX + dungeon.entrance.x * currentTileSize + currentTileSize / 2,
        offsetY + dungeon.entrance.y * currentTileSize + currentTileSize / 2
      );
    }

    if (hero.isVisible(dungeon.exit.x, dungeon.exit.y)) {
      ctx.font = "28px Arial";
      ctx.shadowColor = "rgba(255, 255, 0, 0.5)";
      ctx.shadowBlur = 20;
      ctx.fillText(
        exitSymbol,
        offsetX + dungeon.exit.x * currentTileSize + currentTileSize / 2,
        offsetY + dungeon.exit.y * currentTileSize + currentTileSize / 2
      );
    }
    ctx.shadowColor = "rgba(0, 0, 0, 0)";
    ctx.shadowBlur = 0;
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (hero.invincible) {
      const flash = Math.sin(Date.now() / 100) > 0;
      ctx.globalAlpha = flash ? 0.5 : 1;
    }

    ctx.fillText(
      hero.emoji,
      offsetX + hero.x * currentTileSize + currentTileSize / 2,
      offsetY + hero.y * currentTileSize + currentTileSize / 2
    );

    ctx.globalAlpha = 1;

    if (hero.visibilityEnabled) {
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, hero.visibilityRadius * currentTileSize, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.0)";
      ctx.stroke();
    }

    const timeSinceDamage = Date.now() - hero.damageFlash;
    if (timeSinceDamage < hero.damageFlashDuration) {
      const alpha = 0.5 * (1 - timeSinceDamage / hero.damageFlashDuration);
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const shake = 5 * (1 - timeSinceDamage / hero.damageFlashDuration);
      ctx.save();
      ctx.translate(Math.random() * shake - shake / 2, Math.random() * shake - shake / 2);
    }

    if (timeSinceDamage < hero.damageFlashDuration) {
      ctx.restore();
    }
  }

  function gameLoop() {
    hero.update();
    currentDungeon.monsters.forEach((monster) => monster.update(currentDungeon, hero));
    updateTime();
    render(currentDungeon);
  }

  render(currentDungeon);
  setInterval(gameLoop, 100);
}

initGame();

class Hero {
  constructor(x, y, classType = "wizard") {
    this.x = x;
    this.y = y;
    const classData = heroClasses[classType];
    this.emoji = classData.emoji;
    this.visibilityRadius = classData.visibilityRadius;
    this.visibilityEnabled = true;
    this.score = 0;
    this.health = classData.health;
    this.maxHealth = classData.health + classData.health / 2;
    this.damageMultiplier = classData.damage;
    this.classType = classType;
    this.damageFlash = 0;
    this.damageFlashDuration = 200;
    this.invincible = false;
    this.invincibilityDuration = 2000;
    this.invincibilityStart = 0;
    this.dungeonLevel = 1;
    this.inventory = {
      keys: [],
      gold: 0,
      treasures: {},
    };

    lootTypes.forEach((type) => {
      if (type.display === false) return;
      this.inventory.treasures[type.type] = { count: 0, emoji: type.emoji };
    });
  }

  move(dx, dy, dungeon) {
    const newX = this.x + dx;
    const newY = this.y + dy;

    if (newX === dungeon.exit.x && newY === dungeon.exit.y) {
      this.levelComplete(dungeon);
      return;
    }

    const door = dungeon.doors.find((d) => d.x === newX && d.y === newY);
    if (door) {
      if (door.locked) {
        if (this.inventory.keys.length > 0) {
          door.locked = false;

          this.inventory.keys.pop();

          updateInventoryDisplay(this.inventory, this.health);
          return;
        }
        return;
      }
    }

    if (newX >= 0 && newX < dungeon.width && newY >= 0 && newY < dungeon.height && dungeon.grid[newY][newX] === 0) {
      this.x = newX;
      this.y = newY;

      const key = dungeon.keys.find((k) => !k.collected && k.x === newX && k.y === newY);
      if (key) {
        key.collected = true;
        this.inventory.keys.push(key.color);
        updateInventoryDisplay(this.inventory, this.health);
        showPickUpPopup(this.x, this.y, "🔑");
      }
    }

    if (this.x === newX && this.y === newY) {
      this.checkLoot(dungeon);
      this.checkMonsterCollision(dungeon);
    }
  }

  levelComplete(dungeon) {
    const message = document.createElement("div");
    message.className = "level-complete";
    message.textContent = "🎉 Level Complete! Entering next dungeon...";
    document.body.appendChild(message);

    const newDifficulty = increaseDifficulty(dungeon.difficulty);
    const newDungeon = new Dungeon(dungeon.seed + 1, newDifficulty);
    newDungeon.generate();
    this.x = newDungeon.entrance.x;
    this.y = newDungeon.entrance.y;
    this.dungeonLevel++;
    updateDisplay(this);

    setTimeout(() => {
      message.remove();
    }, 1000);

    return newDungeon;
  }

  toggleVisibility() {
    this.visibilityEnabled = !this.visibilityEnabled;
  }

  isVisible(tileX, tileY) {
    if (!this.visibilityEnabled) return true;

    const distance = Math.sqrt(Math.pow(this.x - tileX, 2) + Math.pow(this.y - tileY, 2));
    return distance <= this.visibilityRadius;
  }

  checkLoot(dungeon) {
    dungeon.loot.forEach((item) => {
      if (!item.collected && this.x === item.x && this.y === item.y) {
        item.collected = true;
        this.score += item.value;

        if (item.healing !== undefined) {
          this.heal(item.healing);
        } else if (item.type === "gold") {
          this.inventory.gold++;
          showPickUpPopup(this.x, this.y, item.emoji);
        } else if (this.inventory.treasures[item.type]) {
          this.inventory.treasures[item.type].count++;
          showPickUpPopup(this.x, this.y, item.emoji);
        }

        updateInventoryDisplay(this.inventory, this.health);
      }
    });
  }

  takeDamage(amount, dungeon) {
    if (this.invincible) return;

    this.health = Math.max(0, this.health - amount);
    this.damageFlash = Date.now();
    this.invincible = true;
    this.invincibilityStart = Date.now();
    updateDisplay(this);

    showDamagePopup(this.x, this.y, amount);

    if (this.health <= 0) {
      this.emoji = "💀";
      const timePlayed = Math.floor((Date.now() - this.startTime) / 1000);
      showEndScreen(this, timePlayed, dungeon);
      return;
    }

    updateInventoryDisplay(this.inventory, this.health);
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    updateDisplay(this);
    updateInventoryDisplay(this.inventory, this.health);
    showHealPopup(this.x, this.y, amount);
  }

  checkMonsterCollision(dungeon) {
    dungeon.monsters.forEach((monster) => {
      if (this.x === monster.x && this.y === monster.y) {
        this.takeDamage(monster.type.damage, dungeon);
      }
    });
  }

  update() {
    if (this.invincible && Date.now() - this.invincibilityStart >= this.invincibilityDuration) {
      this.invincible = false;
    }
  }
}

function updateDisplay(hero) {
  document.getElementById("hp").textContent = hero.health;
  document.getElementById("score").textContent = hero.score;
  document.getElementById("dungeon-level").textContent = hero.dungeonLevel;

  updateInventoryDisplay(hero.inventory, hero.health);
}

function updateInventoryDisplay(inventory, health) {
  const inventoryDiv = document.getElementById("inventory");
  if (!inventoryDiv) {
    const div = document.createElement("div");
    div.id = "inventory";
    div.style.position = "fixed";
    div.style.top = "10px";
    div.style.right = "10px";
    div.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    div.style.padding = "10px";
    div.style.borderRadius = "5px";
    div.style.color = "white";
    div.style.fontFamily = "Arial";
    document.body.appendChild(div);
  }

  const keysList = `<span> ${inventory.keys.length} 🔑</span>`;
  const treasuresList = Object.entries(inventory.treasures)
    .map(([type, data]) => `<div>${type.charAt(0).toUpperCase() + type.slice(1)}: ${data.count} ${data.emoji}</div>`)
    .join("");

  document.getElementById("inventory").innerHTML = `
    <div><b>Inventory:</b></div>
    <div>Keys: ${keysList}</div>
    <div>Gold: ${inventory.gold} 💰</div>
    ${treasuresList}
    <div>Health: ${health} ❤️</div>
  `;
}

function showEndScreen(hero, timePlayed, dungeon) {
  issuePostScoreRequest(hero.score, timePlayed, hero.dungeonLevel, dungeon.size, baseSeed);

  const endScreen = document.createElement("div");
  endScreen.className = "end-screen";

  const formattedTime = `${Math.floor(timePlayed / 60)}:${(timePlayed % 60).toString().padStart(2, "0")}`;

  endScreen.innerHTML = `
    <div class="end-card">
      <h1>Game Over</h1>
      <div class="stats-grid">
        <div>Score: ${hero.score}</div>
        <div>Time: ${formattedTime}</div>
        <div>Dungeons: ${hero.dungeonLevel}</div>
        <div>Gold: ${hero.inventory.gold}</div>
      </div>
      <button class="retry-btn">Try Again</button>
    </div>
  `;

  document.body.appendChild(endScreen);

  endScreen.querySelector(".retry-btn").onclick = () => {
    location.reload();
  };
}

function showConfirmationDialog(message, onConfirm, onCancel) {
  const dialog = document.createElement("div");
  dialog.className = "confirmation-dialog";
  dialog.innerHTML = `
    <p>${message}</p>
    <button class="confirm-btn">Yes</button>
    <button class="cancel-btn">No</button>
  `;

  document.body.appendChild(dialog);

  dialog.querySelector(".confirm-btn").onclick = () => {
    onConfirm();
    dialog.remove();
  };

  dialog.querySelector(".cancel-btn").onclick = () => {
    onCancel();
    dialog.remove();
  };
}

function showPopup(x, y, text, className = "popup") {
  const canvas = document.getElementById("dungeon-grid");

  const offsetX = canvas.width / 2;
  const offsetY = canvas.height / 2;

  const canvasRect = canvas.getBoundingClientRect();
  const canvasX = canvasRect.left;
  const canvasY = canvasRect.top;

  const popupX = canvasX + offsetX;
  const popupY = canvasY + offsetY - 20;

  const popup = document.createElement("div");
  popup.className = className;
  popup.textContent = text;
  popup.style.left = `${popupX}px`;
  popup.style.top = `${popupY}px`;

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 3000);
}

function showDamagePopup(x, y, damage) {
  showPopup(x, y, `-${damage}`, "damage-popup");
}

function showHealPopup(x, y, amount) {
  showPopup(x, y, `+${amount}`, "heal-popup");
}

function showPickUpPopup(x, y, value) {
  showPopup(x, y, `+${value}`, "pickup-popup");
}
