// Game of Life Implementation
class GameOfLife {
  constructor(canvas, width = 50, height = 50, cellSize = 10) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cellSize = cellSize;
    this.setSize(width, height);
    this.running = false;
    this.intervalId = null;
    this.speed = 200; // ms between generations
    this.generation = 0; // Track generation count

    this.patterns = {
      single: [[0, 0]],
      glider: [
        [-1, -1],
        [0, -1],
        [1, -1],
        [1, 0],
        [0, 1],
      ],
      blinker: [
        [-1, 0],
        [0, 0],
        [1, 0],
      ],
      pulsar: [
        [-4, -2],
        [-3, -2],
        [-2, -2],
        [2, -2],
        [3, -2],
        [4, -2],
        [-4, -1],
        [-1, -1],
        [1, -1],
        [4, -1],
        [-4, 0],
        [-1, 0],
        [1, 0],
        [4, 0],
        [-4, 1],
        [-1, 1],
        [1, 1],
        [4, 1],
        [-4, 2],
        [-3, 2],
        [-2, 2],
        [2, 2],
        [3, 2],
        [4, 2],

        [-2, -4],
        [-1, -4],
        [1, -4],
        [2, -4],
        [-2, -3],
        [-1, -3],
        [1, -3],
        [2, -3],
        [-2, 3],
        [-1, 3],
        [1, 3],
        [2, 3],
        [-2, 4],
        [-1, 4],
        [1, 4],
        [2, 4],
      ],
      gosper: [
        [0, -5],
        [1, -5],
        [0, -4],
        [1, -4],
        [10, -5],
        [10, -4],
        [10, -3],
        [11, -6],
        [11, -2],
        [12, -7],
        [12, -1],
        [13, -7],
        [13, -1],
        [14, -4],
        [15, -6],
        [15, -2],
        [16, -5],
        [16, -4],
        [16, -3],
        [17, -4],
        [20, -7],
        [20, -6],
        [20, -5],
        [21, -7],
        [21, -6],
        [21, -5],
        [22, -8],
        [22, -4],
        [24, -8],
        [24, -4],
        [24, -3],
        [24, -2],
        [34, -7],
        [34, -6],
        [35, -7],
        [35, -6],
      ],
      beacon: [
        [0, 0],
        [1, 0],
        [0, 1],
        [3, 2],
        [2, 3],
        [3, 3],
      ],
      toad: [
        [1, 0],
        [2, 0],
        [3, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      acorn: [
        [1, 0],
        [3, 1],
        [0, 2],
        [1, 2],
        [4, 2],
        [5, 2],
        [6, 2],
      ],
      spaceship: [
        [0, 0],
        [3, 0],
        [4, 1],
        [0, 2],
        [4, 2],
        [1, 3],
        [2, 3],
        [3, 3],
        [4, 3],
      ],
      diehard: [
        [6, 0],
        [0, 1],
        [1, 1],
        [1, 2],
        [5, 2],
        [6, 2],
        [7, 2],
      ],
      pentadecathlon: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
        [6, 0],
        [7, 0],
        [8, 0],
        [9, 0],
        [0, 2],
        [9, 2],
        [0, 3],
        [9, 3],
        [0, 5],
        [9, 5],
        [0, 6],
        [9, 6],
        [0, 8],
        [1, 8],
        [2, 8],
        [3, 8],
        [4, 8],
        [5, 8],
        [6, 8],
        [7, 8],
        [8, 8],
        [9, 8],
      ],
      gliderFactory: [
        [1, 5],
        [1, 6],
        [2, 5],
        [2, 6],
        [11, 5],
        [11, 6],
        [11, 7],
        [12, 4],
        [12, 8],
        [13, 3],
        [13, 9],
        [14, 3],
        [14, 9],
        [15, 6],
        [16, 4],
        [16, 8],
        [17, 5],
        [17, 6],
        [17, 7],
        [18, 6],
        [21, 3],
        [21, 4],
        [21, 5],
        [22, 3],
        [22, 4],
        [22, 5],
        [23, 2],
        [23, 6],
        [25, 1],
        [25, 2],
        [25, 6],
        [25, 7],
        [35, 3],
        [35, 4],
        [36, 3],
        [36, 4],
      ],
      r_pentomino: [
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
        [1, 2],
      ],
      cross: [
        [-2, 0],
        [-1, 0],
        [0, 0],
        [1, 0],
        [2, 0],
        [0, -2],
        [0, -1],
        [0, 1],
        [0, 2],
      ],
      infiniteGrowth: [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 2],
        [2, 1],
      ],
    };

    this.selectedPattern = "single";
    this.initEvents();
  }
  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = this.width * this.cellSize;
    this.canvas.height = this.height * this.cellSize;

    // Initialize the grid
    this.grid = new Array(this.height);
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = new Array(this.width).fill(false);
    }

    // Reset generation counter when resizing
    this.generation = 0;
    this.draw();
    this.updateStatusDisplay();
  }

  setSpeed(fps) {
    this.speed = 1000 / fps;

    if (this.running) {
      this.stop();
      this.start();
    }
  }
  initEvents() {
    // Handle clicking on the canvas
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      const x = Math.floor(((e.clientX - rect.left) * scaleX) / this.cellSize);
      const y = Math.floor(((e.clientY - rect.top) * scaleY) / this.cellSize);

      if (this.selectedPattern === "single") {
        // Toggle the cell
        this.grid[y][x] = !this.grid[y][x];
      } else {
        // Place the selected pattern
        this.placePattern(this.patterns[this.selectedPattern], x, y);
      }

      this.draw();
      this.updateStatusDisplay(); // Update the status after cell changes
    });
  }

  placePattern(pattern, centerX, centerY) {
    pattern.forEach(([dx, dy]) => {
      const x = (centerX + dx + this.width) % this.width;
      const y = (centerY + dy + this.height) % this.height;
      this.grid[y][x] = true;
    });
  }

  draw() {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the grid lines
    this.ctx.strokeStyle = "#ddd";
    this.ctx.lineWidth = 0.5;

    for (let x = 0; x <= this.width; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.cellSize, 0);
      this.ctx.lineTo(x * this.cellSize, this.height * this.cellSize);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.height; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.cellSize);
      this.ctx.lineTo(this.width * this.cellSize, y * this.cellSize);
      this.ctx.stroke();
    }

    // Draw the cells
    this.ctx.fillStyle = "#3498db";

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x]) {
          this.ctx.fillRect(x * this.cellSize + 1, y * this.cellSize + 1, this.cellSize - 1, this.cellSize - 1);
        }
      }
    }
  }

  countNeighbors(x, y) {
    let count = 0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        // Wrap around the edges (toroidal grid)
        const nx = (x + dx + this.width) % this.width;
        const ny = (y + dy + this.height) % this.height;

        if (this.grid[ny][nx]) {
          count++;
        }
      }
    }

    return count;
  }
  nextGeneration() {
    const newGrid = new Array(this.height);

    for (let y = 0; y < this.height; y++) {
      newGrid[y] = new Array(this.width);

      for (let x = 0; x < this.width; x++) {
        const neighbors = this.countNeighbors(x, y);
        const isAlive = this.grid[y][x];

        // Apply Conway's Game of Life rules
        if (isAlive) {
          // Rule 1 & 3: Any live cell with fewer than two or more than three live neighbors dies
          newGrid[y][x] = neighbors === 2 || neighbors === 3;
        } else {
          // Rule 4: Any dead cell with exactly three live neighbors becomes a live cell
          newGrid[y][x] = neighbors === 3;
        }
      }
    }

    this.grid = newGrid;
    this.generation++; // Increment generation counter
    this.draw();
    this.updateStatusDisplay(); // Update the status display
  }
  start() {
    if (!this.running) {
      this.running = true;
      this.intervalId = setInterval(() => this.nextGeneration(), this.speed);
      this.updateStatusDisplay();
    }
  }

  stop() {
    if (this.running) {
      this.running = false;
      clearInterval(this.intervalId);
      this.updateStatusDisplay();
    }
  }

  clear() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = false;
      }
    }
    this.generation = 0; // Reset generation counter
    this.draw();
    this.updateStatusDisplay();
  }
  random(density = 0.3) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = Math.random() < density;
      }
    }
    this.generation = 0; // Reset generation counter
    this.draw();
    this.updateStatusDisplay();
  }
  setSelectedPattern(pattern) {
    this.selectedPattern = pattern;
    this.updatePatternInfo(pattern);
  }

  updatePatternInfo(pattern) {
    const patternInfoElement = document.getElementById("pattern-info");
    if (!patternInfoElement) return;

    const patternDescriptions = {
      single: "A single cell. Click to toggle individual cells on/off.",
      glider: "A glider pattern that moves diagonally across the grid.",
      blinker: "A simple oscillator that alternates between horizontal and vertical states.",
      pulsar: "A complex oscillator with period 3 that creates a symmetrical pulsing pattern.",
      gosper: "Gosper's Glider Gun - creates a stream of gliders that move away from the gun.",
      beacon: "A period 2 oscillator that alternates between two states.",
      toad: "A period 2 oscillator that appears to hop back and forth.",
      acorn: "A methuselah pattern that evolves for 5206 generations before stabilizing.",
      spaceship: "A lightweight spaceship that moves horizontally across the grid.",
      diehard: "A pattern that disappears after 130 generations - a true 'die hard'.",
      pentadecathlon: "A period 15 oscillator made of 10 cells in a row with some stabilizers.",
      gliderFactory: "Creates gliders that travel away from the initial pattern.",
      r_pentomino: "A small pattern that evolves in complex ways for many generations.",
      cross: "A simple cross pattern that quickly evolves into interesting forms.",
      infiniteGrowth: "A pattern that continues to grow indefinitely.",
    };

    patternInfoElement.textContent =
      patternDescriptions[pattern] || "Select a pattern and click on the grid to place it";
  }

  updateStatusDisplay() {
    // Update the status display with current state and generation
    const statusElement = document.getElementById("game-status");
    const generationElement = document.getElementById("generation-count");

    if (statusElement) {
      statusElement.textContent = this.running ? "Running" : "Stopped";
      statusElement.className = this.running ? "status-running" : "status-stopped";
    }

    if (generationElement) {
      generationElement.textContent = this.generation;
    }

    // Calculate and update cell statistics
    this.updateCellStatistics();
  }

  updateCellStatistics() {
    // Update living cell count
    const livingCellsElement = document.getElementById("living-cells");
    if (livingCellsElement) {
      let livingCount = 0;
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.grid[y][x]) {
            livingCount++;
          }
        }
      }
      livingCellsElement.textContent = livingCount;

      // Add a visual indicator based on population density
      const totalCells = this.width * this.height;
      const density = livingCount / totalCells;

      let densityClass = "low-density";
      if (density > 0.3) {
        densityClass = "high-density";
      } else if (density > 0.1) {
        densityClass = "medium-density";
      }

      livingCellsElement.className = densityClass;
    }
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("game-grid");
  const widthInput = document.getElementById("grid-width");
  const heightInput = document.getElementById("grid-height");
  const resizeBtn = document.getElementById("resize-btn");
  const startBtn = document.getElementById("start-btn");
  const stopBtn = document.getElementById("stop-btn");
  const stepBtn = document.getElementById("step-btn");
  const clearBtn = document.getElementById("clear-btn");
  const randomBtn = document.getElementById("random-btn");
  const speedSlider = document.getElementById("speed");
  const speedValue = document.getElementById("speed-value");
  const patternSelect = document.getElementById("pattern-select");

  // set default values for all inputs
  widthInput.value = 50;
  heightInput.value = 50;
  resizeBtn.disabled = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  stepBtn.disabled = false;
  clearBtn.disabled = false;
  randomBtn.disabled = false;
  speedSlider.value = 5;
  speedValue.textContent = speedSlider.value;
  patternSelect.value = "single";

  // Determine cell size based on screen size
  const cellSize = window.innerWidth < 768 ? 8 : 10;
  // Create the game
  const game = new GameOfLife(canvas, parseInt(widthInput.value, 10), parseInt(heightInput.value, 10), cellSize);

  // Initialize status display
  game.updateStatusDisplay();
  // Resize the grid
  resizeBtn.addEventListener("click", () => {
    const width = parseInt(widthInput.value, 10);
    const height = parseInt(heightInput.value, 10);

    if (width >= 10 && width <= 100 && height >= 10 && height <= 100) {
      // Stop the simulation if it's running
      if (game.running) {
        game.stop();
      }
      game.setSize(width, height);
    } else {
      alert("Grid size must be between 10 and 100 cells");
    }
  });

  // Start the simulation
  startBtn.addEventListener("click", () => {
    game.start();
  });

  // Stop the simulation
  stopBtn.addEventListener("click", () => {
    game.stop();
  });
  // Step one generation
  stepBtn.addEventListener("click", () => {
    game.nextGeneration();
  });

  // Clear the grid
  clearBtn.addEventListener("click", () => {
    game.clear();
  });

  // Randomize the grid
  randomBtn.addEventListener("click", () => {
    game.random();
  });

  // Speed control
  speedSlider.addEventListener("input", () => {
    const fps = parseInt(speedSlider.value, 10);
    speedValue.textContent = fps;
    game.setSpeed(fps);
  });

  // Initialize the speed
  game.setSpeed(parseInt(speedSlider.value, 10));
  // Pattern selection
  patternSelect.addEventListener("change", () => {
    game.setSelectedPattern(patternSelect.value);
  });

  // Initialize pattern info with the default selected pattern
  game.updatePatternInfo(patternSelect.value);

  // Handle window resize
  window.addEventListener("resize", () => {
    // Adjust the cell size if needed
    if (window.innerWidth < 768 && game.cellSize !== 8) {
      game.cellSize = 8;
      game.setSize(game.width, game.height);
    } else if (window.innerWidth >= 768 && game.cellSize !== 10) {
      game.cellSize = 10;
      game.setSize(game.width, game.height);
    }
  });
});
