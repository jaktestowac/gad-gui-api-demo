const TERRAIN_TYPES = ["water", "grass", "mountain"];
const BUILDINGS = ["🏠", "🏢", "🏭", "🗼", "🏗️"];
const BUILDING_INCOME = { "🏠": 10, "🏢": 25, "🏭": 50, "🗼": 50, "🏗️": 75 };
const TERRAIN_COSTS = {
  water: 100,
  grass: 50,
  mountain: 150,
};
const BUILDING_COUNTS = {
  "🏠": { min: 5, max: 8 },
  "🏢": { min: 3, max: 5 },
  "🏭": { min: 2, max: 3 },
  "🗼": { min: 0, max: 1 },
  "🏗️": { min: 0, max: 1 },
};

class PowerGrid {
  constructor() {
    this.gridSize = 10;
    this.money = 1000;
    this.grid = [];
    this.selectedTool = null;
    this.turnDuration = 5000;
    this.turnProgress = 0;
    this.buildingCounts = {
      "🏠": { total: 0, connected: 0 },
      "🏢": { total: 0, connected: 0 },
      "🏭": { total: 0, connected: 0 },
      "🗼": { total: 0, connected: 0 },
      "🏗️": { total: 0, connected: 0 },
    };
    this.turnType = "auto";
    this.turnInterval = null;
    this.currentTurn = 1;
    this.moneySpent = 0;
    this.isGameStarted = false;
    this.isGameEnded = false;
    this.totalMoneyEarned = 0;
    this.selectedWinCondition = "wealth5k";
    this.objectives = {
      infinite: { target: Infinity, completed: false },
      wealth5k: { target: 5000, completed: false },
      wealth10k: { target: 10000, completed: false },
      wealth50k: { target: 10000, completed: false },
      connect100: { target: 1.0, completed: false },
      speed: { target: 30, completed: false },
      fast: { target: 20, completed: false },
      faster: { target: 10, completed: false },
      efficiency: { target: 0.8, completed: false },
    };
    this.achievedObjectives = [];
    this.tutorialStep = 0;
    this.tutorialSteps = [
      {
        title: "Welcome to Power Grid!",
        text: "Build power plants and connect buildings to earn money. Let's learn how to play!",
        highlight: null,
        demo: (grid) => {
          this.createDemoGrid(grid, [
            ["grass", "grass", "grass"],
            ["grass", "🏠", "grass"],
            ["grass", "grass", "grass"],
          ]);
        },
      },
      {
        title: "Building a Power Plant",
        text: "Click the Plant button and place it on grass or mountain terrain. Plants cost $500.",
        highlight: "#build-plant",
        demo: (grid) => {
          this.createDemoGrid(grid, [
            ["grass", "mountain", "grass"],
            ["grass", "⚡", "grass"],
            ["grass", "grass", "grass"],
          ]);
          grid.querySelector(".power-plant").classList.add("demo-step");
        },
      },
      {
        title: "Building Power Lines",
        text: "Use the Line button to connect your power plant to buildings. Line costs vary by terrain.",
        highlight: "#build-line",
        demo: (grid) => {
          this.createDemoGrid(grid, [
            ["grass", "grass", "🏠"],
            ["⚡", "line", "line"],
            ["grass", "grass", "🏢"],
          ]);
          grid.querySelectorAll(".power-line").forEach((line) => line.classList.add("demo-step"));
        },
      },
      {
        title: "Earning Money",
        text: "Connected buildings generate income each turn. Houses earn $10, Companies $25, and Factories $50.",
        highlight: ".buildings-stats",
        demo: (grid) => {
          this.createDemoGrid(grid, [
            ["🏠", "line", "🏢"],
            ["grass", "grass", "line"],
            ["⚡", "line", "🏭"],
          ]);
          grid.querySelectorAll(".building").forEach((b) => {
            b.classList.add("connected");
            b.classList.add("demo-step");
          });
        },
      },
      {
        title: "Turn Control",
        text: "You can choose between automatic turns (every 5s) or manual turns.",
        highlight: ".turn-controls",
      },
      {
        title: "Victory Condition",
        text: "Complete your chosen objective to win! Watch your money and connections.",
        highlight: ".turn-indicator",
      },
    ];
    this.init();
  }

  init() {
    this.setupStartScreen();
    this.createGrid();
    this.setupEventListeners();
    this.spawnBuildings();
    this.setupTurnIndicator();
    this.setupTurnControls(true);
    this.setupTutorial();
  }

  calculateExpectedIncome() {
    let income = 0;
    if (!this.grid) return income;

    for (let y = 0; y < this.gridSize; y++) {
      if (!this.grid[y]) continue;
      for (let x = 0; x < this.gridSize; x++) {
        const cell = this.grid[y][x];
        if (cell && cell.powered && BUILDINGS.includes(cell.type)) {
          income += BUILDING_INCOME[cell.type];
        }
      }
    }
    return income;
  }

  setupStartScreen() {
    const gridSizeSelect = document.getElementById("grid-size");
    gridSizeSelect.addEventListener("change", (e) => {
      this.gridSize = parseInt(e.target.value);
      document.getElementById("grid").style.setProperty("--grid-size", this.gridSize);

      this.createGrid();
      this.spawnBuildings();

      const scaleFactor = this.gridSize / 10;
      Object.keys(BUILDING_COUNTS).forEach((type) => {
        BUILDING_COUNTS[type] = {
          min: Math.floor(BUILDING_COUNTS[type].min * scaleFactor),
          max: Math.floor(BUILDING_COUNTS[type].max * scaleFactor),
        };
      });
    });

    const winConditionSelect = document.getElementById("win-condition");
    winConditionSelect.addEventListener("change", (e) => {
      this.selectedWinCondition = e.target.value;
    });

    document.getElementById("start-game").addEventListener("click", () => {
      document.getElementById("start-screen").style.display = "none";
      this.startGame();
    });

    document.getElementById("show-tutorial").addEventListener("click", () => {
      document.getElementById("start-screen").style.display = "none";
      document.getElementById("tutorial-overlay").style.display = "flex";
      this.tutorialStep = 0;
      this.showTutorialStep();
    });

    document.getElementById("restart-game").addEventListener("click", () => {
      window.location.reload();
    });
  }

  startGame() {
    if (document.getElementById("tutorial-overlay").style.display !== "flex") {
      this.isGameStarted = true;
      this.startAutoTurns();
      this.setupTurnControls();
    }
  }

  endGame(isWin = true) {
    this.isGameEnded = true;
    this.stopAutoTurns();

    const endScreen = document.getElementById("end-screen");
    const endTitle = document.getElementById("end-title");
    const finalTurns = document.getElementById("final-turns");
    const finalMoney = document.getElementById("final-money");
    const finalBuildings = document.getElementById("final-buildings");
    const stats = document.querySelector(".stats");

    if (isWin) {
      endTitle.textContent = "🎉 Victory!";
      const achievements = document.createElement("div");
      achievements.className = "achievements";
      achievements.innerHTML = `
            <h3>Achievements Unlocked:</h3>
            <ul>
                ${this.achievedObjectives.map((obj) => `<li>${obj}</li>`).join("")}
            </ul>
        `;
      stats.appendChild(achievements);
    } else {
      endTitle.textContent = "😔 Game Over";
    }

    finalTurns.textContent = this.currentTurn;
    finalMoney.textContent = this.totalMoneyEarned;

    const connectedBuildings = Object.values(this.buildingCounts).reduce((sum, count) => sum + count.connected, 0);
    const totalBuildings = this.getTotalBuildings();
    const percentage = Math.round((connectedBuildings / totalBuildings) * 100);
    finalBuildings.textContent = `${connectedBuildings}/${totalBuildings} (${percentage}%)`;

    endScreen.style.display = "flex";
  }

  getTotalBuildings() {
    return Object.values(this.buildingCounts).reduce((sum, count) => sum + count.total, 0);
  }

  createGrid() {
    const gridElement = document.getElementById("grid");
    gridElement.style.setProperty("--grid-size", this.gridSize);
    gridElement.innerHTML = "";

    this.grid = [];
    for (let i = 0; i < this.gridSize; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        const cell = document.createElement("div");
        cell.className = `cell terrain-${this.getRandomTerrain()}`;
        cell.dataset.x = j;
        cell.dataset.y = i;
        gridElement.appendChild(cell);
        this.grid[i][j] = {
          element: cell,
          type: null,
          powered: false,
        };
      }
    }
  }

  getRandomTerrain() {
    return TERRAIN_TYPES[Math.floor(Math.random() * TERRAIN_TYPES.length)];
  }

  spawnBuildings() {
    for (let type in this.buildingCounts) {
      this.buildingCounts[type] = { total: 0, connected: 0 };
    }

    let buildingsToPlace = [];
    for (let type in BUILDING_COUNTS) {
      const count = Math.floor(
        Math.random() * (BUILDING_COUNTS[type].max - BUILDING_COUNTS[type].min + 1) + BUILDING_COUNTS[type].min
      );
      for (let i = 0; i < count; i++) {
        buildingsToPlace.push(type);
      }
    }

    buildingsToPlace = buildingsToPlace.sort(() => Math.random() - 0.5);

    let maxAttempts = 100;
    let currentBuildingIndex = 0;

    while (currentBuildingIndex < buildingsToPlace.length && maxAttempts > 0) {
      const x = Math.floor(Math.random() * this.gridSize);
      const y = Math.floor(Math.random() * this.gridSize);
      const cell = this.grid[y][x];
      const terrain = cell.element.className.match(/terrain-(\w+)/)[1];

      if (!cell.type && terrain !== "water") {
        const building = buildingsToPlace[currentBuildingIndex];
        cell.type = building;
        this.buildingCounts[building].total++;
        const buildingDiv = document.createElement("div");
        buildingDiv.className = "building";
        buildingDiv.textContent = building;
        cell.element.appendChild(buildingDiv);
        currentBuildingIndex++;
      }
      maxAttempts--;
    }

    this.updateBuildingCounters();
  }

  setupEventListeners() {
    document.getElementById("build-plant").addEventListener("click", () => {
      this.selectedTool = "plant";
      this.updateToolSelection();
    });

    document.getElementById("build-line").addEventListener("click", () => {
      this.selectedTool = "line";
      this.updateToolSelection();
    });

    this.updateToolSelection();

    document.getElementById("grid").addEventListener("click", (e) => {
      const cell = e.target.closest(".cell");
      if (cell && this.selectedTool) {
        this.handleCellClick(cell);
      }
    });

    document.getElementById("end-game").addEventListener("click", () => {
      document.getElementById("end-game-dialog").style.display = "flex";
    });

    document.getElementById("cancel-end-game").addEventListener("click", () => {
      document.getElementById("end-game-dialog").style.display = "none";
    });

    document.getElementById("confirm-end-game").addEventListener("click", () => {
      document.getElementById("end-game-dialog").style.display = "none";
      this.endGame(false);
    });
  }

  updateToolSelection() {
    const plantBtn = document.getElementById("build-plant");
    const lineBtn = document.getElementById("build-line");

    plantBtn.classList.toggle("selected", this.selectedTool === "plant");
    lineBtn.classList.toggle("selected", this.selectedTool === "line");
  }

  showMoneySpentIndicator(amount, x, y) {
    const indicator = document.createElement("div");
    indicator.className = "money-spent-indicator";
    indicator.textContent = `-$${amount}`;
    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;
    document.body.appendChild(indicator);

    setTimeout(() => indicator.remove(), 1500);
  }

  handleCellClick(cell) {
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    const terrain = cell.className.match(/terrain-(\w+)/)[1];
    const rect = cell.getBoundingClientRect();

    if (terrain === "water" && this.selectedTool === "plant") {
      cell.classList.add("invalid-placement");
      setTimeout(() => cell.classList.remove("invalid-placement"), 500);
      return;
    }

    if (this.selectedTool === "plant" && this.money >= 500) {
      if (!this.grid[y][x].type) {
        this.showMoneySpentIndicator(500, rect.left + rect.width / 2, rect.top);
        this.money -= 500;
        this.moneySpent += 500;
        this.grid[y][x].type = "plant";
        cell.innerHTML = '<div class="power-plant"></div>';
        this.updateMoney();
        this.updateConnections();
      }
    } else if (this.selectedTool === "line") {
      const cost = TERRAIN_COSTS[terrain];
      if (this.money >= cost && !this.grid[y][x].type) {
        this.showMoneySpentIndicator(cost, rect.left + rect.width / 2, rect.top);
        this.money -= cost;
        this.moneySpent += cost;
        this.grid[y][x].type = "line";

        const lineType = this.determineLineType(x, y);
        const line = document.createElement("div");
        line.className = `power-line ${lineType}`;

        if (this.hasMultipleConnections(x, y)) {
          const connection = document.createElement("div");
          connection.className = "power-line-connection";
          line.appendChild(connection);
        }

        cell.appendChild(line);

        this.updateSurroundingLines(x, y);
        this.updateMoney();
        this.updateConnections();
      }
    }
  }

  hasMultipleConnections(x, y) {
    const connections = this.getConnections(x, y);
    return Object.values(connections).filter(Boolean).length > 1;
  }

  getConnections(x, y) {
    return {
      top: y > 0 ? this.isConnectable(this.grid[y - 1][x].type) : false,
      right: x < this.gridSize - 1 ? this.isConnectable(this.grid[y][x + 1].type) : false,
      bottom: y < this.gridSize - 1 ? this.isConnectable(this.grid[y + 1][x].type) : false,
      left: x > 0 ? this.isConnectable(this.grid[y][x - 1].type) : false,
    };
  }

  determineLineType(x, y) {
    const connections = this.getConnections(x, y);
    const count = Object.values(connections).filter(Boolean).length;

    if (count === 3) {
      if (!connections.top) return "t-top";
      if (!connections.right) return "t-right";
      if (!connections.bottom) return "t-bottom";
      if (!connections.left) return "t-left";
    }
    if (count >= 4) return "cross";
    if (count === 2) {
      if (connections.top && connections.bottom) return "vertical";
      if (connections.left && connections.right) return "horizontal";
      if (connections.top && connections.left) return "corner-tr";
      if (connections.top && connections.right) return "corner-tl";
      if (connections.bottom && connections.left) return "corner-br";
      if (connections.bottom && connections.right) return "corner-bl";
    }
    if (count === 1) {
      if (connections.left || connections.right) return "horizontal";
      return "vertical";
    }

    const hasVertical = this.hasVerticalNeighbor(x, y);
    return hasVertical ? "vertical" : "horizontal";
  }

  hasVerticalNeighbor(x, y) {
    const verticalLines = [
      y > 0 ? this.grid[y - 1][x].type === "line" : false,
      y < this.gridSize - 1 ? this.grid[y + 1][x].type === "line" : false,
    ];
    return verticalLines.some(Boolean);
  }

  isConnectable(type) {
    return type === "line" || type === "plant" || BUILDINGS.includes(type);
  }

  updateSurroundingLines(x, y) {
    const directions = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0], // top, right, bottom, left
    ];

    directions.forEach(([dx, dy]) => {
      const newX = x + dx;
      const newY = y + dy;

      if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
        const cell = this.grid[newY][newX];
        if (cell.type === "line") {
          const lineElement = cell.element.querySelector(".power-line");
          if (lineElement) {
            lineElement.className = `power-line ${this.determineLineType(newX, newY)}`;
          }
        }
      }
    });
  }

  hasVerticalConnection(x, y) {
    const above = y > 0 ? this.grid[y - 1][x].type : null;
    const below = y < this.gridSize - 1 ? this.grid[y + 1][x].type : null;
    return (
      above === "line" ||
      above === "plant" ||
      BUILDINGS.includes(above) ||
      below === "line" ||
      below === "plant" ||
      BUILDINGS.includes(below)
    );
  }

  hasHorizontalConnection(x, y) {
    const left = x > 0 ? this.grid[y][x - 1].type : null;
    const right = x < this.gridSize - 1 ? this.grid[y][x + 1].type : null;
    return (
      left === "line" ||
      left === "plant" ||
      BUILDINGS.includes(left) ||
      right === "line" ||
      right === "plant" ||
      BUILDINGS.includes(right)
    );
  }

  updateConnections() {
    for (let type in this.buildingCounts) {
      this.buildingCounts[type].connected = 0;
    }

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        this.grid[y][x].powered = false;
        this.grid[y][x].element.classList.remove("connected");
      }
    }

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.grid[y][x].type === "plant") {
          this.traceConnections(x, y);
        }
      }
    }

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const cell = this.grid[y][x];
        if (cell.powered && BUILDINGS.includes(cell.type)) {
          this.buildingCounts[cell.type].connected++;
        }
      }
    }

    this.updateBuildingCounters();
  }

  traceConnections(x, y, visited = new Set()) {
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return;

    const key = `${x},${y}`;
    if (visited.has(key)) return;
    visited.add(key);

    const cell = this.grid[y][x];
    if (cell.type === "line" || cell.type === "plant" || BUILDINGS.includes(cell.type)) {
      cell.powered = true;
      cell.element.classList.add("connected");

      this.traceConnections(x + 1, y, visited);
      this.traceConnections(x - 1, y, visited);
      this.traceConnections(x, y + 1, visited);
      this.traceConnections(x, y - 1, visited);
    }
  }

  collectIncome() {
    const income = this.calculateExpectedIncome();
    this.money += income;
    this.totalMoneyEarned += income;
    this.updateMoney();

    this.checkGameState();

    this.currentTurn++;
    document.getElementById("current-turn").textContent = this.currentTurn;

    const incomePreview = document.querySelector(".income-preview");
    incomePreview.classList.add("pulse");
    setTimeout(() => incomePreview.classList.remove("pulse"), 500);

    const turnNumber = document.querySelector(".turn-number");
    turnNumber.classList.add("pulse");
    setTimeout(() => turnNumber.classList.remove("pulse"), 50);
  }

  checkGameState() {
    if (this.money < 0) {
      this.endGame(false);
      return;
    }

    if (this.selectedWinCondition === "infinite") {
      return;
    }

    const connectedRatio = this.getConnectionRatio();
    let hasWon = false;
    let hasLost = false;

    switch (this.selectedWinCondition) {
      case "wealth5k":
      case "wealth10k":
      case "wealth50k":
        hasWon = this.money >= this.objectives[this.selectedWinCondition].target;
        if (hasWon)
          this.achievedObjectives.push(
            "Wealth Baron: Accumulated $" + this.objectives[this.selectedWinCondition].target
          );
        break;
      case "connect100":
        hasWon = connectedRatio >= this.objectives.connect100.target;
        if (hasWon) this.achievedObjectives.push("Master Engineer: 100% Buildings Connected");
        break;
      case "speed":
        hasWon = this.currentTurn <= this.objectives.speed.target && connectedRatio >= 0.7;
        hasLost = this.currentTurn > this.objectives.speed.target;
        if (hasWon)
          this.achievedObjectives.push("Speed Runner: Connected 70% within " + this.objectives.speed.target + " turns");
        break;
      case "fast":
        hasWon = this.currentTurn <= this.objectives.fast.target && connectedRatio >= 0.7;
        hasLost = this.currentTurn > this.objectives.fast.target;
        if (hasWon)
          this.achievedObjectives.push("Speed Runner: Connected 70% within " + this.objectives.fast.target + " turns");
        break;
      case "faster":
        hasWon = this.currentTurn <= this.objectives.faster.target && connectedRatio >= 0.7;
        hasLost = this.currentTurn > this.objectives.faster.target;
        if (hasWon)
          this.achievedObjectives.push(
            "Speed Runner: Connected 70% within " + this.objectives.faster.target + " turns"
          );
        break;
      case "efficiency":
        hasWon = connectedRatio >= this.objectives.efficiency.target;
        if (hasWon)
          this.achievedObjectives.push(
            "Efficient Manager: " + this.objectives.efficiency.target * 100 + "% Connection Rate"
          );
        break;
    }

    if (hasWon) {
      this.endGame(true);
    }
    if (hasLost) {
      this.endGame(false);
    }
  }

  checkWinningConditions() {
    this.achievedObjectives = [];

    if (this.money >= this.objectives.money.target && !this.objectives.money.completed) {
      this.objectives.money.completed = true;
      this.achievedObjectives.push("Wealth Baron: Accumulated $" + this.objectives.money.target);
    }

    const connectedRatio = this.getConnectionRatio();
    if (connectedRatio >= this.objectives.allBuildings.target && !this.objectives.allBuildings.completed) {
      this.objectives.allBuildings.completed = true;
      this.achievedObjectives.push("Master Engineer: 100% Buildings Connected");
    }

    if (
      this.currentTurn <= this.objectives.turnLimit.target &&
      connectedRatio >= 0.7 &&
      !this.objectives.turnLimit.completed
    ) {
      this.objectives.turnLimit.completed = true;
      this.achievedObjectives.push("Speed Runner: Connected 70% within " + this.objectives.turnLimit.target + " turns");
    }

    if (connectedRatio >= this.objectives.efficiency.target && !this.objectives.efficiency.completed) {
      this.objectives.efficiency.completed = true;
      this.achievedObjectives.push(
        "Efficient Manager: " + this.objectives.efficiency.target * 100 + "% Connection Rate"
      );
    }
  }

  getConnectionRatio() {
    const totalBuildings = this.getTotalBuildings();
    if (totalBuildings === 0) return 0;

    const connectedBuildings = Object.values(this.buildingCounts).reduce((sum, count) => sum + count.connected, 0);

    return connectedBuildings / totalBuildings;
  }

  setupTurnIndicator() {
    const circle = document.querySelector(".progress-ring-circle");
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    this.progressCircle = circle;
    this.circumference = circumference;

    this.lastTick = Date.now();
    this.updateTurnProgress();
  }

  setupTurnControls(firstSetup = false) {
    const turnTypeSelect = document.getElementById("turn-type");
    const endTurnBtn = document.getElementById("end-turn");
    const turnIndicator = document.querySelector(".turn-indicator");
    const winCondition = document.getElementById("winCondition");
    winCondition.innerHTML = this.selectedWinCondition;

    turnTypeSelect.value = this.turnType;
    endTurnBtn.disabled = true;
    turnIndicator.classList.remove("manual-mode");

    if (firstSetup) {
      turnTypeSelect.addEventListener("change", (e) => {
        this.turnType = e.target.value;
        if (this.turnType === "auto") {
          endTurnBtn.disabled = true;
          turnIndicator.classList.remove("manual-mode");
          this.startAutoTurns();
        } else {
          endTurnBtn.disabled = false;
          turnIndicator.classList.add("manual-mode");
          this.stopAutoTurns();
        }
      });

      endTurnBtn.addEventListener("click", () => {
        if (this.turnType === "manual") {
          this.collectIncome();
          this.turnProgress = 0;
          this.updateTurnProgress();
        }
      });
    }
  }

  startAutoTurns() {
    this.stopAutoTurns();
    this.turnInterval = setInterval(() => this.collectIncome(), this.turnDuration);
  }

  stopAutoTurns() {
    if (this.turnInterval) {
      clearInterval(this.turnInterval);
      this.turnInterval = null;
    }
  }

  updateTurnProgress = () => {
    if (this.turnType === "auto") {
      const now = Date.now();
      const delta = now - this.lastTick;
      this.turnProgress = (this.turnProgress + delta) % this.turnDuration;
      this.lastTick = now;
    }

    const progress = this.turnProgress / this.turnDuration;
    const offset = this.circumference * (1 - progress);
    this.progressCircle.style.strokeDashoffset = offset;

    if (this.turnType === "auto") {
      const remainingSeconds = Math.ceil((this.turnDuration - this.turnProgress) / 1000);
      document.getElementById("countdown").textContent = remainingSeconds;
    } else {
      document.getElementById("countdown").textContent = "-";
    }

    const expectedIncome = this.calculateExpectedIncome();
    document.getElementById("income-amount").textContent = expectedIncome;

    requestAnimationFrame(this.updateTurnProgress);
  };

  updateMoney() {
    document.getElementById("money").textContent = this.money;
    document.getElementById("money-spent").textContent = this.moneySpent;
  }

  updateBuildingCounters() {
    document.getElementById("connected-houses").textContent = this.buildingCounts["🏠"].connected;
    document.getElementById("total-houses").textContent = this.buildingCounts["🏠"].total;
    document.getElementById("connected-companies").textContent = this.buildingCounts["🏢"].connected;
    document.getElementById("total-companies").textContent = this.buildingCounts["🏢"].total;
    document.getElementById("connected-factories").textContent = this.buildingCounts["🏭"].connected;
    document.getElementById("total-factories").textContent = this.buildingCounts["🏭"].total;
    document.getElementById("connected-towers").textContent = this.buildingCounts["🗼"].connected;
    document.getElementById("total-towers").textContent = this.buildingCounts["🗼"].total;
    document.getElementById("connected-yards").textContent = this.buildingCounts["🏗️"].connected;
    document.getElementById("total-yards").textContent = this.buildingCounts["🏗️"].total;
  }

  setupTutorial() {
    const overlay = document.getElementById("tutorial-overlay");
    const nextBtn = document.getElementById("tutorial-next");
    const skipBtn = document.getElementById("tutorial-skip");

    nextBtn.addEventListener("click", () => this.nextTutorialStep());
    skipBtn.addEventListener("click", () => this.endTutorial());
  }

  showTutorialStep() {
    if (this.tutorialStep >= this.tutorialSteps.length) {
      this.endTutorial();
      return;
    }

    const step = this.tutorialSteps[this.tutorialStep];
    const overlay = document.getElementById("tutorial-overlay");
    const title = document.getElementById("tutorial-title");
    const text = document.getElementById("tutorial-text");
    const skip = document.getElementById("tutorial-skip");
    const nextBtn = document.getElementById("tutorial-next");
    const demoGrid = document.getElementById("demo-grid");

    document.querySelector(".tutorial-highlight")?.classList.remove("tutorial-highlight");

    title.textContent = step.title;
    text.textContent = step.text;

    if (this.tutorialStep === this.tutorialSteps.length - 1) {
      // nextBtn.style.display = "none";
      nextBtn.textContent = "End Tutorial";
    } else {
      nextBtn.style.display = "block";
    }

    if (step.demo) {
      step.demo(demoGrid);
    } else {
      demoGrid.innerHTML = "";
    }

    if (step.highlight) {
      document.querySelector(step.highlight)?.classList.add("tutorial-highlight");
    }

    overlay.style.display = "flex";
  }

  nextTutorialStep() {
    this.tutorialStep++;
    this.showTutorialStep();
  }

  endTutorial() {
    const overlay = document.getElementById("tutorial-overlay");
    const startScreen = document.getElementById("start-screen");

    overlay.style.display = "none";
    startScreen.style.display = "flex";

    document.querySelector(".tutorial-highlight")?.classList.remove("tutorial-highlight");
    this.tutorialStep = 0;
  }

  createDemoGrid(container, layout) {
    container.innerHTML = "";
    layout.forEach((row, y) => {
      row.forEach((cell, x) => {
        const div = document.createElement("div");
        div.className = "cell";

        if (cell === "grass") {
          div.classList.add("terrain-grass");
        } else if (cell === "mountain") {
          div.classList.add("terrain-mountain");
        } else if (cell === "water") {
          div.classList.add("terrain-water");
        } else if (cell === "⚡") {
          div.classList.add("terrain-grass");
          const plant = document.createElement("div");
          plant.className = "power-plant";
          div.appendChild(plant);
        } else if (cell === "line") {
          div.classList.add("terrain-grass");
          const line = document.createElement("div");
          line.className = "power-line";
          // Determine line direction based on neighbors
          const lineType = this.getDemoLineType(layout, x, y);
          line.classList.add(lineType);
          div.appendChild(line);
        } else if (["🏠", "🏢", "🏭"].includes(cell)) {
          div.classList.add("terrain-grass");
          const building = document.createElement("div");
          building.className = "building";
          building.textContent = cell;
          div.appendChild(building);
        }

        container.appendChild(div);
      });
    });
  }

  getDemoLineType(layout, x, y) {
    const hasTop = y > 0 && ["line", "⚡", "🏠", "🏢", "🏭"].includes(layout[y - 1][x]);
    const hasBottom = y < layout.length - 1 && ["line", "⚡", "🏠", "🏢", "🏭"].includes(layout[y + 1][x]);
    const hasLeft = x > 0 && ["line", "⚡", "🏠", "🏢", "🏭"].includes(layout[y][x - 1]);
    const hasRight = x < layout[y].length - 1 && ["line", "⚡", "🏠", "🏢", "🏭"].includes(layout[y][x + 1]);

    if ((hasTop || hasBottom) && (hasLeft || hasRight)) return "cross";
    if (hasTop && hasBottom) return "vertical";
    if (hasLeft && hasRight) return "horizontal";
    if (hasTop || hasBottom) return "vertical";
    return "horizontal";
  }
}

window.onload = () => new PowerGrid();
