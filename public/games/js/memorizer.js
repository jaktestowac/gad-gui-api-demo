class MemoryGame {
  constructor() {
    this.moves = 0;
    this.timeElapsed = 0;
    this.timer = null;
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.gridSize = 4;
    this.allEmojis = [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🦄",
      "🐙",
      "🦋",
      "🐞",
      "🦀",
      "🦐",
      "🐡",
      "🦈",
      "🐊",
      "🐢",
      "🦎",
      "🐍",
      "🐲",
      "🐉",
      "🦕",
      "🦖",
      "🐳",
      "🐋",
      "🐬",
      "🐟",
      "🐠",
      "🐡",
      "🌵",
      "🎄",
      "🌲",
      "🌳",
      "🌴",
      "🌱",
      "🌿",
      "☘️",
      "🍀",
      "🛸",
      "🚀",
      "🚁",
      "🚂",
      "🚗",
      "👾",
      "🤖",
      "👽",
      "👻",
      "👹",
      "👺",
      "💀",
      "👿",
      "🧛",
      "🧟",
      "🧙",
      "🧚",
      "🧜",
      "🧝",
      "🧞",
    ];
    this.cardMapper = {};
    this.emojiElements = [];
    this.speedMode = false;

    this.startScreen = document.getElementById("startScreen");
    this.gameContainer = document.querySelector(".game-container");
    this.gameBoard = document.querySelector(".game-board");
    this.movesDisplay = document.querySelector(".moves");
    this.timerDisplay = document.querySelector(".timer");
    this.restartBtn = document.querySelector(".restart-btn");
    this.endScreen = document.getElementById("endScreen");

    this.setupStartScreen();
  }

  setupStartScreen() {
    const gridButtons = document.querySelectorAll(".grid-selection button");
    const startButton = document.querySelector(".start-btn");

    gridButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        gridButtons.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        this.gridSize = parseInt(btn.dataset.grid);
      });
    });

    startButton.addEventListener("click", () => {
      this.startScreen.style.display = "none";
      this.gameContainer.style.display = "block";
      this.startGame();
    });

    const speedModeToggle = document.getElementById("speedMode");
    speedModeToggle.addEventListener("change", (e) => {
      this.speedMode = e.target.checked;
      document.querySelectorAll(".card").forEach((card) => {
        card.classList.toggle("speed-mode", this.speedMode);
      });
    });
  }

  startGame() {
    this.moves = 0;
    this.timeElapsed = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    clearInterval(this.timer);
    this.movesDisplay.textContent = "Moves: 0";
    this.timerDisplay.textContent = "Time: 0s";

    this.gameContainer.style.display = "block";
    this.startScreen.style.display = "none";
    this.endScreen.classList.remove("visible");
    this.endScreen.style.display = "none";

    this.gameBoard.dataset.size = this.gridSize;
    this.emojis = this.allEmojis.slice(0, Math.floor((this.gridSize * this.gridSize) / 2));

    if (this.gridSize === 2) {
      this.emojis = this.emojis.slice(0, 2);
    }

    this.cards = [...this.emojis, ...this.emojis];
    this.cardMapper = {};
    this.gameBoard.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
    this.init();
  }

  init() {
    this.shuffleCards();
    this.renderCards();
    this.bindEvents();
    this.startTimer();
  }

  shuffleCards() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }

    for (let i = 0; i < this.cards.length; i++) {
      this.cardMapper[i] = this.cards[i];
    }
  }

  renderCards() {
    this.gameBoard.innerHTML = "";

    this.emojiElements = this.cards.map((emoji) => {
      const emojiSpan = document.createElement("span");
      emojiSpan.className = "emoji";
      emojiSpan.textContent = emoji;
      return emojiSpan;
    });

    this.cards.forEach((emoji, index) => {
      const card = document.createElement("div");
      card.className = `card ${this.speedMode ? "speed-mode" : ""}`;
      card.dataset.index = index;
      card.innerHTML = `
                <div class="card-front"></div>
                <div class="card-back"></div>
            `;
      this.gameBoard.appendChild(card);
    });
  }

  flipCard(card) {
    if (this.flippedCards.length === 2 || card.classList.contains("flipped")) return;

    const cardId = parseInt(card.dataset.index);
    const cardBack = card.querySelector(".card-back");

    const emoji = this.cardMapper[cardId];
    cardBack.textContent = emoji;

    card.classList.add("flipped");
    this.flippedCards.push({ card, cardId });

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.movesDisplay.textContent = `Moves: ${this.moves}`;
      this.checkMatch();
    }
  }

  checkMatch() {
    const [{ card: card1, cardId: id1 }, { card: card2, cardId: id2 }] = this.flippedCards;
    const match = this.cardMapper[id1] === this.cardMapper[id2];

    if (match) {
      this.matchedPairs++;
      this.flippedCards = [];
      if (this.matchedPairs === this.emojis.length) {
        this.gameWon();
      }
    } else {
      const delay = this.speedMode ? 300 : 1000;
      setTimeout(() => {
        card1.querySelector(".card-back").textContent = "";
        card2.querySelector(".card-back").textContent = "";
        card1.classList.remove("flipped");
        card2.classList.remove("flipped");
        this.flippedCards = [];
      }, delay);
    }
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeElapsed++;
      this.timerDisplay.textContent = `Time: ${this.timeElapsed}s`;
    }, 1000);
  }

  gameWon() {
    clearInterval(this.timer);

    // Update stats
    document.getElementById("finalSize").textContent = `Grid: ${this.gridSize}x${this.gridSize}`;
    document.getElementById("finalMoves").textContent = `Moves: ${this.moves}`;
    document.getElementById("finalTime").textContent = `Time: ${this.timeElapsed}s`;

    // Show end screen
    setTimeout(() => {
      this.endScreen.style.display = "flex";
      requestAnimationFrame(() => {
        this.endScreen.classList.add("visible");
      });

      // Setup end screen buttons
      const replayBtn = this.endScreen.querySelector(".replay-btn");
      const menuBtn = this.endScreen.querySelector(".menu-btn");

      replayBtn.onclick = () => {
        this.hideEndScreen(() => {
          this.startGame();
        });
      };

      menuBtn.onclick = () => {
        this.hideEndScreen(() => {
          this.restart();
        });
      };
    }, 500);
  }

  hideEndScreen(callback) {
    this.endScreen.classList.remove("visible");
    setTimeout(() => {
      this.endScreen.style.display = "none";
      callback();
    }, 300);
  }

  restart() {
    this.moves = 0;
    this.timeElapsed = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.cardMapper = {};
    this.emojiElements = [];
    clearInterval(this.timer);

    this.startScreen.style.display = "flex";
    this.gameContainer.style.display = "none";
    this.endScreen.classList.remove("visible");
    this.endScreen.style.display = "none";
  }

  bindEvents() {
    this.gameBoard.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      if (card) this.flipCard(card);
    });

    this.restartBtn.addEventListener("click", () => this.restart());
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new MemoryGame();
});
