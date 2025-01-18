let verbose = false;

function logOnConsole(msg, obj) {
  if (verbose) {
    console.log(msg, obj);
  }
}

function startGame(level) {
  const useCustomArmy = document.getElementById("useCustomArmy").checked;

  if (useCustomArmy && selectedUnits.length === 0) {
    alert("Please select at least one unit for your army!");
    return;
  }

  const armyToUse = useCustomArmy ? selectedUnits : levelArmies[level];

  document.getElementById("levelSelect").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  window.currentGame = new Game(level, armyToUse);
  window.currentGame.addToHistory({ type: "turn", turn: window.currentGame.turnNumber });
}

const units = {
  Swordsman: {
    icon: "⚔️",
    hp: 15,
    attack: 5,
    defense: 3,
    moveRange: 3,
    range: 1,
    isFlying: false,
    value: 50,
    attackRange: 1,
  },
  Archer: {
    icon: "🏹",
    hp: 10,
    attack: 6,
    defense: 2,
    moveRange: 2,
    range: 20,
    isFlying: false,
    value: 45,
    attackRange: 20,
  },
  Knight: {
    icon: "🐎",
    hp: 20,
    attack: 4,
    defense: 5,
    moveRange: 5,
    range: 1,
    isFlying: false,
    value: 85,
    attackRange: 1,
  },
  Skeleton: {
    icon: "💀",
    hp: 8,
    attack: 4,
    defense: 2,
    moveRange: 3,
    range: 1,
    isFlying: false,
    value: 25,
    attackRange: 1,
  },
  Zombie: {
    icon: "🧟",
    hp: 12,
    attack: 3,
    defense: 3,
    moveRange: 2,
    range: 1,
    isFlying: false,
    value: 30,
    attackRange: 1,
  },
  Ghost: {
    icon: "👻",
    hp: 10,
    attack: 5,
    defense: 1,
    moveRange: 4,
    range: 2,
    isFlying: true,
    value: 35,
    attackRange: 2,
  },
  Vampire: {
    icon: "🧛",
    hp: 15,
    attack: 6,
    defense: 2,
    moveRange: 4,
    range: 1,
    isFlying: true,
    value: 70,
    attackRange: 1,
  },
  Peasant: {
    icon: "👨‍🌾",
    hp: 5,
    attack: 2,
    defense: 1,
    moveRange: 2,
    range: 1,
    isFlying: false,
    value: 10,
    attackRange: 1,
  },
  Dragon: {
    icon: "🐉",
    hp: 25,
    attack: 8,
    defense: 6,
    moveRange: 7,
    range: 1,
    isFlying: true,
    value: 150,
    attackRange: 1,
  },
  Golem: {
    icon: "🗿",
    hp: 18,
    attack: 6,
    defense: 5,
    moveRange: 2,
    range: 1,
    isFlying: false,
    value: 100,
    attackRange: 1,
  },
  Wizard: {
    icon: "🧙",
    hp: 12,
    attack: 7,
    defense: 2,
    moveRange: 2,
    range: 20,
    isFlying: false,
    value: 80,
    attackRange: 20,
  },
  "Skeleton Archer": {
    icon: "💀🏹",
    hp: 10,
    attack: 5,
    defense: 2,
    moveRange: 2,
    range: 20,
    isFlying: false,
    value: 40,
    attackRange: 20,
  },
  Snake: {
    icon: "🐍",
    hp: 8,
    attack: 3,
    defense: 1,
    moveRange: 1,
    range: 1,
    isFlying: false,
    value: 20,
    attackRange: 1,
  },
  Boar: {
    icon: "🐗",
    hp: 15,
    attack: 4,
    defense: 3,
    moveRange: 4,
    range: 1,
    isFlying: false,
    value: 90,
    attackRange: 1,
  },
  Goblin: {
    icon: "👺",
    hp: 5,
    attack: 4,
    defense: 1,
    moveRange: 2,
    range: 1,
    isFlying: false,
    value: 15,
    attackRange: 1,
  },
  Unicorn: {
    icon: "🦄",
    hp: 20,
    attack: 5,
    defense: 5,
    moveRange: 5,
    range: 1,
    isFlying: true,
    value: 120,
    attackRange: 1,
  },
  Genie: {
    icon: "🧞",
    hp: 10,
    attack: 6,
    defense: 2,
    moveRange: 5,
    range: 3,
    isFlying: true,
    value: 110,
    attackRange: 3,
  },
  Imp: {
    icon: "👹",
    hp: 8,
    attack: 4,
    defense: 1,
    moveRange: 3,
    range: 1,
    isFlying: false,
    value: 25,
    attackRange: 1,
  },
  Pixie: {
    icon: "🧚",
    hp: 8,
    attack: 3,
    defense: 1,
    moveRange: 3,
    range: 1,
    isFlying: true,
    value: 30,
    attackRange: 1,
  },
  Phoenix: {
    icon: "🐦",
    hp: 15,
    attack: 6,
    defense: 3,
    moveRange: 6,
    range: 1,
    isFlying: true,
    value: 140,
    attackRange: 1,
  },
  Minotaur: {
    icon: "🐂",
    hp: 18,
    attack: 7,
    defense: 4,
    moveRange: 4,
    range: 1,
    isFlying: false,
    value: 130,
    attackRange: 1,
  },
  Witch: {
    icon: "🧙‍♀️",
    hp: 10,
    attack: 5,
    defense: 1,
    moveRange: 3,
    range: 20,
    isFlying: false,
    value: 75,
    attackRange: 20,
  },
  Manticore: {
    icon: "🦁",
    hp: 20,
    attack: 6,
    defense: 5,
    moveRange: 5,
    range: 1,
    isFlying: true,
    value: 160,
    attackRange: 1,
  },
  Behemoth: {
    icon: "🐘",
    hp: 25,
    attack: 8,
    defense: 6,
    moveRange: 6,
    range: 1,
    isFlying: false,
    value: 200,
    attackRange: 1,
  },
  Octopus: {
    icon: "🐙",
    hp: 25,
    attack: 5,
    defense: 3,
    moveRange: 3,
    range: 2,
    isFlying: false,
    value: 180,
    attackRange: 2,
  },
  Mummy: {
    icon: "🥼",
    hp: 15,
    attack: 5,
    defense: 3,
    moveRange: 3,
    range: 1,
    isFlying: false,
    value: 60,
    attackRange: 1,
  },
  Automaton: {
    icon: "🤖",
    hp: 20,
    attack: 6,
    defense: 6,
    moveRange: 6,
    range: 1,
    isFlying: false,
    value: 140,
    attackRange: 1,
  },
  "Fire Elemental": {
    icon: "🔥",
    hp: 15,
    attack: 6,
    defense: 2,
    moveRange: 3,
    range: 5,
    isFlying: true,
    value: 70,
    attackRange: 5,
  },
  "Water Elemental": {
    icon: "💧",
    hp: 15,
    attack: 5,
    defense: 3,
    moveRange: 3,
    range: 5,
    isFlying: true,
    value: 65,
    attackRange: 5,
  },
  "Air Elemental": {
    icon: "💨",
    hp: 10,
    attack: 4,
    defense: 1,
    moveRange: 4,
    range: 5,
    isFlying: true,
    value: 50,
    attackRange: 5,
  },
  "Earth Elemental": {
    icon: "🌍",
    hp: 20,
    attack: 6,
    defense: 4,
    moveRange: 2,
    range: 1,
    isFlying: false,
    value: 75,
    attackRange: 1,
  },
  "Ice Elemental": {
    icon: "❄️",
    hp: 10,
    attack: 4,
    defense: 2,
    moveRange: 3,
    range: 5,
    isFlying: true,
    value: 55,
    attackRange: 5,
  },
  "Lightning Elemental": {
    icon: "⚡",
    hp: 10,
    attack: 5,
    defense: 1,
    moveRange: 5,
    range: 5,
    isFlying: true,
    value: 60,
    attackRange: 5,
  },
  "Magma Elemental": {
    icon: "🌋",
    hp: 20,
    attack: 7,
    defense: 3,
    moveRange: 4,
    range: 1,
    isFlying: true,
    value: 90,
    attackRange: 1,
  },
  "Rock Elemental": {
    icon: "⛰",
    hp: 25,
    attack: 8,
    defense: 5,
    moveRange: 3,
    range: 1,
    isFlying: false,
    value: 110,
    attackRange: 1,
  },
  "Storm Elemental": {
    icon: "🌪",
    hp: 15,
    attack: 6,
    defense: 2,
    moveRange: 6,
    range: 5,
    isFlying: true,
    value: 80,
    attackRange: 5,
  },
  "Toxic Elemental": {
    icon: "☣️",
    hp: 10,
    attack: 5,
    defense: 1,
    moveRange: 3,
    range: 1,
    isFlying: true,
    value: 45,
    attackRange: 1,
  },
  Scorpion: {
    icon: "🦂",
    hp: 15,
    attack: 5,
    defense: 3,
    moveRange: 4,
    range: 1,
    isFlying: false,
    value: 70,
    attackRange: 1,
  },
  Monk: {
    icon: "🧘",
    hp: 8,
    attack: 8,
    defense: 2,
    moveRange: 3,
    range: 1,
    isFlying: false,
    value: 40,
    attackRange: 20,
  },
  Cerberus: {
    icon: "🐕",
    hp: 20,
    attack: 7,
    defense: 4,
    moveRange: 5,
    range: 1,
    isFlying: false,
    value: 120,
    attackRange: 1,
  },
  Troglodyte: {
    icon: "🦎",
    hp: 10,
    attack: 4,
    defense: 2,
    moveRange: 3,
    range: 1,
    isFlying: false,
    value: 30,
    attackRange: 1,
  },
  "Dark Elf": {
    icon: "🧝",
    hp: 12,
    attack: 6,
    defense: 3,
    moveRange: 4,
    range: 1,
    isFlying: false,
    value: 50,
    attackRange: 1,
  },
  Gnoll: {
    icon: "🐺",
    hp: 5,
    attack: 2,
    defense: 3,
    moveRange: 8,
    range: 1,
    isFlying: false,
    value: 60,
    attackRange: 1,
  },
  Berserk: {
    icon: "🤬",
    hp: 10,
    attack: 8,
    defense: 1,
    moveRange: 5,
    range: 1,
    isFlying: false,
    value: 60,
    attackRange: 1,
  },
  "Diamond Golem": {
    icon: "💎",
    hp: 25,
    attack: 4,
    defense: 6,
    moveRange: 2,
    range: 1,
    isFlying: false,
    value: 130,
    attackRange: 1,
  },
  Titan: {
    icon: "🦸",
    hp: 30,
    attack: 10,
    defense: 8,
    moveRange: 6,
    range: 1,
    isFlying: false,
    value: 200,
    attackRange: 1,
  },
  Snail: {
    icon: "🐌",
    hp: 12,
    attack: 5,
    defense: 8,
    moveRange: 1,
    range: 1,
    isFlying: false,
    value: 10,
    attackRange: 1,
  },
  Angel: {
    icon: "😇",
    hp: 20,
    attack: 7,
    defense: 6,
    moveRange: 6,
    range: 1,
    isFlying: true,
    value: 150,
    attackRange: 1,
  },
  Cavalier: {
    icon: "🐴",
    hp: 15,
    attack: 6,
    defense: 4,
    moveRange: 5,
    range: 1,
    isFlying: false,
    value: 90,
    attackRange: 1,
  },
  "Undead Lord": {
    icon: "👑💀",
    hp: 25,
    attack: 8,
    defense: 8,
    moveRange: 5,
    range: 1,
    isFlying: false,
    value: 300,
    attackRange: 1,
    special: true,
  },
  "Dragon Lord": {
    icon: "👑🐉",
    hp: 30,
    attack: 10,
    defense: 8,
    moveRange: 7,
    range: 1,
    isFlying: true,
    value: 300,
    attackRange: 1,
    special: true,
  },
  Wilbur: {
    icon: "👑🐷",
    hp: 10,
    attack: 20,
    defense: 2,
    moveRange: 7,
    range: 1,
    isFlying: false,
    value: 300,
    attackRange: 1,
    special: true,
  },
  "Giant Spider": {
    icon: "🕷️",
    hp: 15,
    attack: 6,
    defense: 3,
    moveRange: 3,
    range: 1,
    isFlying: false,
    value: 70,
    attackRange: 1,
  },
  Maggot: {
    icon: "🐛",
    hp: 5,
    attack: 2,
    defense: 1,
    moveRange: 2,
    range: 1,
    isFlying: false,
    value: 10,
    attackRange: 1,
  },
  Paladin: {
    icon: "🛡️🗡️",
    hp: 15,
    attack: 6,
    defense: 15,
    moveRange: 4,
    range: 1,
    isFlying: false,
    value: 250,
    attackRange: 1,
    special: true,
  },
  "Evil Necromancer": {
    icon: "🧟‍♂️",
    hp: 10,
    attack: 10,
    defense: 2,
    moveRange: 3,
    range: 20,
    isFlying: false,
    value: 250,
    attackRange: 20,
    special: true,
  },
  "King Devil": {
    icon: "👑😈",
    hp: 30,
    attack: 12,
    defense: 6,
    moveRange: 6,
    range: 1,
    isFlying: false,
    value: 300,
    attackRange: 1,
    special: true,
  },
  "Queen Fairy": {
    icon: "👑🧚",
    hp: 20,
    attack: 8,
    defense: 2,
    moveRange: 6,
    range: 1,
    isFlying: true,
    value: 300,
    attackRange: 1,
    special: true,
  },
  Juggernaut: {
    icon: "👑🤖",
    hp: 20,
    attack: 8,
    defense: 12,
    moveRange: 3,
    range: 1,
    isFlying: false,
    value: 200,
    attackRange: 1,
    special: true,
  },
  Rat: {
    icon: "🐀",
    hp: 4,
    attack: 4,
    defense: 1,
    moveRange: 10,
    range: 1,
    isFlying: false,
    value: 15,
    attackRange: 1,
  },
  "Plague Rat": {
    icon: "💀🐀",
    hp: 8,
    attack: 4,
    defense: 2,
    moveRange: 15,
    range: 1,
    isFlying: false,
    value: 25,
    attackRange: 1,
  },
  "Giant Rat": {
    icon: "🐁",
    hp: 10,
    attack: 5,
    defense: 3,
    moveRange: 10,
    range: 1,
    isFlying: false,
    value: 30,
    attackRange: 1,
  },
  Kraken: {
    icon: "🦑",
    hp: 35,
    attack: 10,
    defense: 8,
    moveRange: 2,
    range: 3,
    isFlying: false,
    value: 250,
    attackRange: 3,
  },
  "Time Weaver": {
    icon: "⏳",
    hp: 18,
    attack: 5,
    defense: 4,
    moveRange: 4,
    range: 10,
    isFlying: false,
    value: 150,
    attackRange: 10,
  },
  Cyclops: {
    icon: "👁️",
    hp: 28,
    attack: 9,
    defense: 6,
    moveRange: 4,
    range: 1,
    isFlying: false,
    value: 200,
    attackRange: 1,
  },
  Leviathan: {
    icon: "🐋",
    hp: 40,
    attack: 10,
    defense: 9,
    moveRange: 1,
    range: 1,
    isFlying: false,
    value: 250,
    attackRange: 1,
    special: true,
  },
  Siren: {
    icon: "🧜",
    hp: 18,
    attack: 7,
    defense: 1,
    moveRange: 2,
    range: 1,
    isFlying: false,
    value: 50,
    attackRange: 1,
  },
  "Star Mage": {
    icon: "✨",
    hp: 15,
    attack: 15,
    defense: 3,
    moveRange: 2,
    range: 20,
    isFlying: false,
    value: 220,
    attackRange: 15,
  },
  Hole: {
    icon: "🕳️",
    hp: 20,
    attack: 15,
    defense: 5,
    moveRange: 6,
    range: 1,
    isFlying: true,
    value: 120,
    attackRange: 1,
  },
  Timeless: {
    icon: "🌀",
    hp: 100,
    attack: 20,
    defense: 20,
    moveRange: 20,
    range: 20,
    isFlying: true,
    value: 1000,
    attackRange: 20,
  },
  Potato: {
    icon: "🥔",
    hp: 1,
    attack: 1,
    defense: 1,
    moveRange: 1,
    range: 1,
    isFlying: false,
    value: 1,
    attackRange: 1,
  },
  "Void Sentinel": {
    icon: "🌑",
    hp: 30,
    attack: 8,
    defense: 9,
    moveRange: 2,
    range: 1,
    isFlying: false,
    value: 240,
    attackRange: 1,
    special: true,
  },
  "Abyss Walker": {
    icon: "👣",
    hp: 22,
    attack: 8,
    defense: 5,
    moveRange: 5,
    range: 1,
    isFlying: true,
    value: 170,
    attackRange: 1,
    special: true,
  },
};

function unitFactory(player, unitName, x, y) {
  if (!units[unitName]) {
    throw new Error(`Unknown unit type: ${unitName}`);
  }

  return new Unit(player, unitName, units[unitName].hp, units[unitName].attack, units[unitName].defense, x, y);
}

const allUnits = Object.keys(units);

const availableUnits = ["Swordsman", "Archer", "Knight", "Peasant", "Wizard", "Dragon", "Golem", "Paladin", "Monk"];

const presetArmy = ["Knight", "Dragon", "Wizard", "Archer", "Golem"];
let selectedUnits = [];

// Add predefined armies for each level
const levelArmies = {
  1: ["Swordsman", "Archer", "Knight", "Peasant"],
  2: ["Swordsman", "Archer", "Knight", "Wizard"],
  3: ["Swordsman", "Archer", "Knight", "Wizard", "Peasant"],
  4: ["Swordsman", "Archer", "Knight", "Wizard", "Archer", "Archer"],
  5: ["Swordsman", "Archer", "Knight", "Wizard", "Archer", "Cavalier"],
  6: ["Swordsman", "Archer", "Knight", "Wizard", "Archer", "Archer", "Cavalier"],
  7: ["Swordsman", "Archer", "Knight", "Wizard", "Archer", "Archer", "Cavalier", "Cavalier"],
  8: ["Swordsman", "Archer", "Knight", "Wizard", "Archer", "Archer", "Cavalier", "Cavalier", "Angel"],
  9: ["Swordsman", "Archer", "Knight", "Wizard", "Archer", "Archer", "Cavalier", "Cavalier", "Angel", "Titan"],
  42: Array.from({ length: 6 }, () => allUnits[Math.floor(Math.random() * allUnits.length)]),
};

function initializeUnitSelection() {
  const armySelection = document.getElementById("armySelection");
  const unitSelection = document.getElementById("unitSelection");
  const selectedUnitsList = document.getElementById("selectedUnitsList");
  const usePresetArmyCheckbox = document.getElementById("usePresetArmy");
  const useCustomArmyCheckbox = document.getElementById("useCustomArmy");
  const armySelectionDiv = document.querySelector(".army-selection");

  // Initialize UI state
  const showCustomSelection = useCustomArmyCheckbox.checked;
  unitSelection.style.display = showCustomSelection ? "flex" : "none";
  armySelection.style.display = showCustomSelection ? "flex" : "none";
  selectedUnitsList.style.display = showCustomSelection ? "flex" : "none";
  usePresetArmyCheckbox.parentElement.style.display = showCustomSelection ? "block" : "none";

  unitSelection.innerHTML = availableUnits
    .map(
      (unit) => `
        <button class="unit-option" onclick="addUnit('${unit}')">
            <span class="icon">${Unit.getIcon(unit)}</span>
            <span>${unit}</span>
        </button>
    `
    )
    .join("");

  // Add event listener for custom army toggle
  useCustomArmyCheckbox.addEventListener("change", function () {
    const showCustom = this.checked;
    armySelection.style.display = showCustom ? "flex" : "none";
    unitSelection.style.display = showCustom ? "flex" : "none";
    selectedUnitsList.style.display = showCustom ? "flex" : "none";
    usePresetArmyCheckbox.parentElement.style.display = showCustom ? "block" : "none";

    if (!showCustom) {
      selectedUnits = [];
      updateSelectedUnitsList();
    }
  });

  usePresetArmyCheckbox.addEventListener("change", function () {
    if (this.checked) {
      selectedUnits = [...presetArmy];
    } else {
      selectedUnits = [];
    }
    updateSelectedUnitsList();
    updateUnitSelectionUI();
  });

  updateSelectedUnitsList();
  updateUnitSelectionUI();
}

function addUnit(unitName) {
  const usePresetArmy = document.getElementById("usePresetArmy");
  if (usePresetArmy.checked) {
    usePresetArmy.checked = false;
    selectedUnits = [];
  }
  if (selectedUnits.length < 6) {
    selectedUnits.push(unitName);
    updateSelectedUnitsList();
    updateUnitSelectionUI();
  }
}

function toggleUnit(unitName) {
  const usePresetArmy = document.getElementById("usePresetArmy");
  if (usePresetArmy.checked) {
    usePresetArmy.checked = false;
    selectedUnits = [];
  }

  const maxUnits = 6;
  const index = selectedUnits.indexOf(unitName);

  if (index === -1 && selectedUnits.length < maxUnits) {
    selectedUnits.push(unitName);
  } else if (index !== -1) {
    selectedUnits.splice(index, 1);
  }

  updateSelectedUnitsList();
  updateUnitSelectionUI();
}

function updateSelectedUnitsList() {
  const selectedUnitsList = document.getElementById("selectedUnitsList");
  const unitCount = document.getElementById("unitCount");

  unitCount.textContent = `${selectedUnits.length}/6`;

  selectedUnitsList.innerHTML = selectedUnits
    .map(
      (unit) => `
        <div class="selected-unit">
            <span>${Unit.getIcon(unit)}</span>
            <span>${unit}</span>
            <button onclick="toggleUnit('${unit}')">&times;</button>
        </div>
    `
    )
    .join("");
}

function updateUnitSelectionUI() {
  const unitOptions = document.querySelectorAll(".unit-option");
  unitOptions.forEach((option) => {
    const unitName = option.querySelector("span:not(.icon)").textContent;
    option.classList.toggle("selected", selectedUnits.includes(unitName));
  });
}

class Unit {
  constructor(type, name, hp, attack, defense, x, y) {
    this.type = type;
    this.name = name;
    this.maxHp = hp;
    this.hp = hp;
    this.attack = attack;
    this.defense = defense;
    this.x = x;
    this.y = y;
    this.hasMoved = false;
    this.moveRange = Unit.getMoveRange(name);
    this.icon = Unit.getIcon(name);
    this.attackRange = Unit.getAttackRange(name);
    this.hasAttacked = false;
    this.isFlying = Unit.isFlying(name);
  }

  static getIcon(name) {
    return units[name].icon || "⚔️";
  }

  static getUnitValue(unitName) {
    return units[unitName].value || 30;
  }

  static getMoveRange(name) {
    return units[name].moveRange || 1;
  }

  static getAttackRange(name) {
    return units[name].attackRange || 1;
  }

  static isFlying(name) {
    return units[name].isFlying || false;
  }

  calculateDamage(defender) {
    const baseDamage = Math.max(1, this.attack - Math.floor(defender.defense * 0.3));
    // Random damage variation 15%
    const variation = Math.random() * 0.3 - 0.15;
    let finalDamage = Math.round(baseDamage * (1 + variation));

    // 2% chance of critical hit (2.5x damage)
    const isCritical = Math.random() < 0.02;
    if (isCritical) {
      finalDamage *= 2.5;
    }

    return {
      damage: Math.round(finalDamage),
      isCritical: isCritical,
    };
  }

  calculateRangedDamage(defender, distance) {
    const maxPenalty = 0.6; // Maximum 60% penalty
    const rangePenalty = Math.min(maxPenalty, Math.max(0, distance - 1) * 0.1); // 10% penalty per hex
    const baseDamage = Math.max(1, Math.floor(this.attack * (1 - rangePenalty) - defender.defense * 0.3));

    // Random damage variation 15%
    const variation = Math.random() * 0.3 - 0.15;
    let finalDamage = Math.round(baseDamage * (1 + variation));

    // 2% chance of critical hit (2.5x damage)
    const isCritical = Math.random() < 0.02;
    if (isCritical) {
      finalDamage *= 2.5;
    }

    return {
      damage: Math.round(finalDamage),
      isCritical: isCritical,
    };
  }
}

class Obstacle {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.icon = Obstacle.getIcon(type);
  }

  static getIcon(type) {
    const icons = {
      mountain: "⛰️",
      lake: "💧",
      forest: "🌲",
    };
    return icons[type];
  }
}

class Game {
  constructor(level, playerUnits) {
    this.level = level;
    this.playerUnits = playerUnits;
    this.basePlayerUnits = [...playerUnits];
    this.grid = Array(8)
      .fill()
      .map(() => Array(12).fill(null));
    this.selectedUnit = null;
    this.currentTurn = "player";
    this.obstacles = [];
    this.gameOver = false;
    this.moveHistory = [];
    this.turnNumber = 1;
    this.turnStats = {
      player: { damageDealt: 0, unitsLost: 0 },
      enemy: { damageDealt: 0, unitsLost: 0 },
    };
    this.gameStats = {
      player: {
        damageDealt: 0,
        unitsLost: 0,
        unitsKilled: [],
        totalPoints: 0,
      },
      enemy: {
        damageDealt: 0,
        unitsLost: 0,
        unitsKilled: [],
        totalPoints: 0,
      },
    };
    this.initialize();
  }

  addToHistory(entry) {
    this.moveHistory.push(entry);
    this.renderHistory();
  }

  renderHistory() {
    const historyPanel = document.getElementById("historyPanel");
    historyPanel.innerHTML = this.moveHistory
      .slice()
      .reverse()
      .map((entry) => {
        if (entry.type === "turn") {
          return `<div class="history-turn">Turn ${entry.turn}</div>`;
        }
        if (this.gameOver && entry.type === "summary") {
          return `<div class="history-summary">${entry.text.replace(/\n/g, "<br>")}</div>`;
        }
        return `<div class="history-entry ${entry.actor}">${entry.text}</div>`;
      })
      .join("");
  }

  addDamageToStats(attacker, damage) {
    this.turnStats[attacker.type].damageDealt += damage;
  }

  addUnitLostToStats(unit) {
    const oppositeType = unit.type === "player" ? "enemy" : "player";
    this.turnStats[oppositeType].unitsLost++;
  }

  addToHistoryTurnSummary() {
    const stats = this.turnStats;
    if (
      stats.player.damageDealt > 0 ||
      stats.enemy.damageDealt > 0 ||
      stats.player.unitsLost > 0 ||
      stats.enemy.unitsLost > 0
    ) {
      this.addToHistory({
        type: "summary",
        text: `Turn ${this.turnNumber} Summary:<br>
               🔵 Player dealt ${stats["player"].damageDealt} damage<br>
               🔴 Enemy dealt ${stats["enemy"].damageDealt} damage<br>
               💀 Units lost total: Player ${stats.player.unitsLost} | Enemy ${stats.enemy.unitsLost}`,
      });
    }

    this.gameStats.player.damageDealt += stats.player.damageDealt;
    this.gameStats.enemy.damageDealt += stats.enemy.damageDealt;
    this.gameStats.player.unitsLost += stats.player.unitsLost;
    this.gameStats.enemy.unitsLost += stats.enemy.unitsLost;

    this.turnStats = {
      player: { damageDealt: 0, unitsLost: 0 },
      enemy: { damageDealt: 0, unitsLost: 0 },
    };
  }

  initialize() {
    this.generateObstacles();

    const playerUnits = this.getPlayerUnitsForLevel(this.level);
    playerUnits.forEach((unit) => this.addUnitInValidPosition(unit));

    const enemyUnits = this.getEnemyUnitsForLevel(this.level);
    enemyUnits.forEach((unit) => this.addUnitInValidPosition(unit));

    this.render();
    this.updateTurnIndicator();
    document.getElementById("gameControls").style.display = "flex";
  }

  getPlayerUnitsForLevel(level) {
    const units = [];
    const positions = [
      [6, 1],
      [6, 3],
      [6, 5],
      [6, 7],
      [6, 9],
      [6, 11],
      [7, 1],
      [7, 3],
      [7, 5],
      [7, 7],
      [7, 8],
    ];

    this.playerUnits.forEach((unitName, index) => {
      if (index < positions.length) {
        const [x, y] = positions[index];
        units.push(unitFactory("player", unitName, x, y));
      }
    });

    return units;
  }

  getEnemyUnitsForLevel(level) {
    const units = [];
    switch (level) {
      case 1:
        units.push(
          unitFactory("enemy", "Skeleton", 1, 2),
          unitFactory("enemy", "Zombie", 1, 4),
          unitFactory("enemy", "Ghost", 1, 6)
        );
        break;
      case 2:
        units.push(
          unitFactory("enemy", "Skeleton", 1, 2),
          unitFactory("enemy", "Zombie", 1, 4),
          unitFactory("enemy", "Ghost", 1, 6),
          unitFactory("enemy", "Vampire", 1, 8)
        );
        break;
      case 3:
        units.push(
          unitFactory("enemy", "Vampire", 1, 2),
          unitFactory("enemy", "Ghost", 1, 4),
          unitFactory("enemy", "Ghost", 1, 6),
          unitFactory("enemy", "Skeleton Archer", 1, 8),
          unitFactory("enemy", "Wizard", 1, 10)
        );
        break;
      case 4:
        units.push(
          unitFactory("enemy", "Dragon", 1, 2),
          unitFactory("enemy", "Vampire", 1, 4),
          unitFactory("enemy", "Ghost", 1, 6),
          unitFactory("enemy", "Wizard", 1, 8),
          unitFactory("enemy", "Skeleton Archer", 1, 10)
        );
        break;
      case 5:
        units.push(
          unitFactory("enemy", "Dragon", 1, 2),
          unitFactory("enemy", "Golem", 1, 4),
          unitFactory("enemy", "Wizard", 1, 6),
          unitFactory("enemy", "Vampire", 1, 8),
          unitFactory("enemy", "Ghost", 1, 10),
          unitFactory("enemy", "Skeleton Archer", 1, 3)
        );
        break;
      case 6:
        units.push(
          unitFactory("enemy", "Dragon", 1, 2),
          unitFactory("enemy", "Golem", 1, 4),
          unitFactory("enemy", "Wizard", 1, 6),
          unitFactory("enemy", "Vampire", 1, 8),
          unitFactory("enemy", "Ghost", 1, 10),
          unitFactory("enemy", "Skeleton Archer", 2, 3),
          unitFactory("enemy", "Snake", 2, 5),
          unitFactory("enemy", "Boar", 2, 7),
          unitFactory("enemy", "Octopus", 2, 9)
        );
        break;
      case 7:
        units.push(
          unitFactory("enemy", "Dragon", 1, 2),
          unitFactory("enemy", "Golem", 1, 4),
          unitFactory("enemy", "Wizard", 1, 6),
          unitFactory("enemy", "Vampire", 1, 8),
          unitFactory("enemy", "Ghost", 1, 10),
          unitFactory("enemy", "Skeleton Archer", 2, 3),
          unitFactory("enemy", "Snake", 2, 5),
          unitFactory("enemy", "Boar", 2, 7),
          unitFactory("enemy", "Octopus", 2, 9),
          unitFactory("enemy", "Mummy", 2, 11)
        );
        break;
      case 8:
        units.push(
          unitFactory("enemy", "Automaton", 1, 2),
          unitFactory("enemy", "Golem", 1, 4),
          unitFactory("enemy", "Dragon", 1, 6),
          unitFactory("enemy", "Golem", 1, 8),
          unitFactory("enemy", "Phoenix", 1, 10),
          unitFactory("enemy", "Titan", 2, 2),
          unitFactory("enemy", "Behemoth", 2, 4),
          unitFactory("enemy", "Manticore", 2, 6)
        );
        break;
      case 9:
        units.push(
          unitFactory("enemy", "Skeleton", 1, 2),
          unitFactory("enemy", "Mummy", 1, 4),
          unitFactory("enemy", "Zombie", 1, 6),
          unitFactory("enemy", "Zombie", 1, 8),
          unitFactory("enemy", "Vampire", 1, 10),
          unitFactory("enemy", "Undead Lord", 2, 2),
          unitFactory("enemy", "Vampire", 2, 4),
          unitFactory("enemy", "Zombie", 2, 6),
          unitFactory("enemy", "Skeleton Archer", 2, 8),
          unitFactory("enemy", "Skeleton Archer", 2, 10)
        );
        break;
      case 42: {
        const randomUnits = Array.from(
          { length: Math.floor(Math.random() * 6) + 5 },
          () => allUnits[Math.floor(Math.random() * allUnits.length)]
        );
        randomUnits.forEach((unitName, index) => {
          units.push(unitFactory("enemy", unitName, 1, 1 * index + 1));
        });
      }
    }

    return units;
  }

  generateObstacles() {
    const obstacleTypes = ["mountain", "lake", "forest"];
    const numObstacles = Math.floor(Math.random() * 8) + 8; // 8-15 obstacles

    for (let i = 0; i < numObstacles; i++) {
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      let x, y;
      let maxTries = 10;
      let tries = 0;
      do {
        x = Math.floor(Math.random() * 8);
        y = Math.floor(Math.random() * 12);
        // Avoid placing obstacles in the first and last two rows
        tries++;
      } while ((this.grid[x][y] || x < 2 || x > 5) && tries < maxTries);

      const obstacle = new Obstacle(type, x, y);
      this.obstacles.push(obstacle);
      this.grid[x][y] = obstacle;
    }
  }

  addUnitInValidPosition(unit) {
    if (!this.grid[unit.x][unit.y]) {
      this.grid[unit.x][unit.y] = unit;
    } else {
      // Find nearest empty position
      let found = false;
      let maxTries = 10;
      let tries = 0;
      let radius = 1;
      while (!found && radius < 5 && tries < maxTries) {
        tries++;
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            const newX = unit.x + dx;
            const newY = unit.y + dy;
            if (newX >= 0 && newX < 8 && newY >= 0 && newY < 12 && !this.grid[newX][newY]) {
              unit.x = newX;
              unit.y = newY;
              this.grid[newX][newY] = unit;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        radius++;
      }
    }
  }

  isInRange(fromX, fromY, toX, toY, range) {
    return Math.abs(toX - fromX) + Math.abs(toY - fromY) <= range;
  }

  isInHexNeighbors(currentX, currentY, x, y) {
    const oddRow = currentX % 2 === 1;

    // od rows has i and i+1 columns abvoe nad below, even has i-1 and i columns above and below
    // hex row-1_col-1 has following neighbours:
    // hex row-0_col-1
    // hex row-0_col-2
    // hex row-1_col-0
    // hex row-1_col-1
    // hex row-2_col-1
    // hex row-2_col-2

    // hex row-2_col-1  has following neighbours:
    // hex row-1_col-0
    // hex row-1_col-1
    // hex row-3_col-0
    // hex row-3_col-1
    // hex row-2_col-0
    // hex row-2_col-2

    if (oddRow) {
      if (
        (x === currentX - 1 && y === currentY) ||
        (x === currentX - 1 && y === currentY + 1) ||
        (x === currentX && y === currentY - 1) ||
        (x === currentX && y === currentY + 1) ||
        (x === currentX + 1 && y === currentY) ||
        (x === currentX + 1 && y === currentY + 1)
      ) {
        return true;
      }
    } else {
      if (
        (x === currentX - 1 && y === currentY - 1) ||
        (x === currentX - 1 && y === currentY) ||
        (x === currentX && y === currentY - 1) ||
        (x === currentX && y === currentY + 1) ||
        (x === currentX + 1 && y === currentY - 1) ||
        (x === currentX + 1 && y === currentY)
      ) {
        return true;
      }
    }

    return false;
  }

  calculateHexDistance(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    return dx + Math.max(0, (dy - dx) / 2);
  }

  findPath(startX, startY, endX, endY, range) {
    const key = (x, y) => `${x},${y}`;
    const heuristic = (x, y) => Math.abs(x - endX) + Math.abs(y - endY);
    const unit = this.grid[startX][startY];
    const isFlying = unit?.isFlying || false;

    const openSet = new Map();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    openSet.set(key(startX, startY), { x: startX, y: startY });
    gScore.set(key(startX, startY), 0);
    fScore.set(key(startX, startY), heuristic(startX, startY));

    const maxIterations = 1000;
    let iterations = 0;

    while (openSet.size > 0 && iterations < maxIterations) {
      iterations += 1;

      let current = null;
      let lowestF = Infinity;
      for (const [nodeKey, node] of openSet) {
        const f = fScore.get(nodeKey);
        if (f < lowestF) {
          lowestF = f;
          current = node;
        }
      }

      if (current.x === endX && current.y === endY) {
        const path = [];
        let currentKey = key(current.x, current.y);
        while (cameFrom.has(currentKey)) {
          path.unshift(currentKey);
          currentKey = cameFrom.get(currentKey);
        }
        return path.map((k) => {
          const [x, y] = k.split(",").map(Number);
          return { x, y };
        });
      }

      openSet.delete(key(current.x, current.y));
      closedSet.add(key(current.x, current.y));

      // Get all possible neighbors including diagonal moves
      const neighbors = [];
      const directions = [
        [-1, 0],
        [1, 0], // Vertical
        [0, -1],
        [0, 1], // Horizontal
        [-1, -1],
        [-1, 1], // Diagonal left
        [1, -1],
        [1, 1], // Diagonal right
      ];

      for (const [dx, dy] of directions) {
        const newX = current.x + dx;
        const newY = current.y + dy;

        if (newX < 0 || newX >= 8 || newY < 0 || newY >= 12) continue;

        if (this.calculateHexDistance(startX, startY, newX, newY) <= range) {
          neighbors.push({ x: newX, y: newY });
        }
      }

      for (const neighbor of neighbors) {
        const neighborKey = key(neighbor.x, neighbor.y);
        if (closedSet.has(neighborKey)) continue;

        const cell = this.grid[neighbor.x][neighbor.y];
        // Allow flying units to pass over obstacles
        if (
          (!isFlying && cell instanceof Obstacle) ||
          (cell instanceof Unit && (neighbor.x !== endX || neighbor.y !== endY))
        ) {
          continue;
        }

        const tentativeG = gScore.get(key(current.x, current.y)) + 1;

        if (tentativeG > range) continue;

        if (!openSet.has(neighborKey)) {
          openSet.set(neighborKey, neighbor);
        } else if (tentativeG >= gScore.get(neighborKey)) {
          continue;
        }

        cameFrom.set(neighborKey, key(current.x, current.y));
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + heuristic(neighbor.x, neighbor.y));
      }
    }

    return null;
  }

  isValidMove(fromX, fromY, toX, toY, range) {
    if (!this.isInRange(fromX, fromY, toX, toY, range)) return false;
    const unit = this.grid[fromX][fromY];

    // Flying units can move to spots with obstacles
    if (!unit?.isFlying && this.grid[toX][toY] instanceof Obstacle) return false;

    // Check if there's a valid path
    const path = this.findPath(fromX, fromY, toX, toY, range);
    return path !== null;
  }

  updateTurnIndicator() {
    document.getElementById("turnIndicator").textContent = `${
      this.currentTurn.charAt(0).toUpperCase() + this.currentTurn.slice(1)
    }'s Turn`;
  }

  render() {
    const grid = document.getElementById("hexGrid");
    grid.innerHTML = "";

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 12; j++) {
        const hex = document.createElement("div");
        hex.className = "hex";
        hex.classList.add(`row-${i}_col-${j}`);

        if (this.selectedUnit) {
          // Show movement range if unit hasn't moved
          if (
            !this.selectedUnit.hasMoved &&
            this.isValidMove(this.selectedUnit.x, this.selectedUnit.y, i, j, this.selectedUnit.moveRange)
          ) {
            hex.classList.add("movable");
            if (this.selectedUnit.isFlying && this.grid[i][j] instanceof Obstacle) {
              hex.classList.add("flying-move");
            }
          }

          // Show attack indicators if unit hasn't attacked
          if (!this.selectedUnit.hasAttacked && this.grid[i][j]?.type === "enemy") {
            const distance = Math.abs(this.selectedUnit.x - i) + Math.abs(this.selectedUnit.y - j);
            const isNeighbor = this.isInHexNeighbors(this.selectedUnit.x, this.selectedUnit.y, i, j);

            if (isNeighbor) {
              hex.classList.add("attackable");
              const indicator = document.createElement("div");
              indicator.className = "attack-indicator melee";
              indicator.textContent = "⚔️";
              hex.appendChild(indicator);
            } else if (this.selectedUnit.attackRange > 1 && distance <= this.selectedUnit.attackRange) {
              hex.classList.add("ranged-attack");
              const indicator = document.createElement("div");
              indicator.className = "attack-indicator ranged";
              indicator.textContent = "🎯";
              hex.appendChild(indicator);
            }
          }
        }

        const cell = this.grid[i][j];
        if (cell instanceof Obstacle) {
          hex.classList.add("obstacle", cell.type);
          const icon = document.createElement("div");
          icon.className = "obstacle-icon";
          icon.textContent = cell.icon;
          hex.appendChild(icon);
        } else if (cell instanceof Unit) {
          const unitDiv = document.createElement("div");
          unitDiv.className = `unit ${cell.type}`;

          if (cell.hasMoved || cell.hasAttacked) {
            unitDiv.classList.add("exhausted");
          }

          // Add indicator for units that can attack
          if (cell.type === "player" && !cell.hasAttacked && this.currentTurn === "player") {
            if (this.canUnitAttack(cell)) {
              unitDiv.classList.add("can-attack");
            }
          }

          unitDiv.innerHTML = cell.icon;

          const stats = document.createElement("div");
          stats.className = "stats";
          stats.textContent = `${cell.hp}♥ ${cell.attack}⚔ ${cell.defense}🛡`;

          // Add hover events for unit info
          unitDiv.addEventListener("mouseenter", () => this.updateInfoPanel(cell));
          unitDiv.addEventListener("mouseleave", () => {
            // When mouse leaves, show selected unit info or clear panel
            if (this.selectedUnit) {
              this.updateInfoPanel(this.selectedUnit);
            } else {
              this.updateInfoPanel(null);
            }
          });

          unitDiv.appendChild(stats);
          hex.appendChild(unitDiv);

          if (cell === this.selectedUnit) {
            hex.classList.add("selected");
          }
        }

        hex.onclick = () => this.handleClick(i, j);
        grid.appendChild(hex);
      }
    }
  }

  handleClick(x, y) {
    let attackDetails = {};
    if (this.gameOver) return; // Add this line
    const clickedCell = this.grid[x][y];

    // Always show info for clicked unit, regardless of turn or type
    if (clickedCell instanceof Unit) {
      this.updateInfoPanel(clickedCell);
    }

    if (clickedCell instanceof Obstacle) {
      this.updateInfoPanel({
        name: clickedCell.type.charAt(0).toUpperCase() + clickedCell.type.slice(1),
        icon: clickedCell.icon,
        description: "Impassable terrain",
      });
      return;
    }

    if (this.currentTurn !== "player") return;

    let suspendRender = false;
    if (this.selectedUnit) {
      if (clickedCell === this.selectedUnit) {
        this.selectedUnit = null;
        this.render();
        return;
      }

      if (clickedCell instanceof Unit && clickedCell.type === "player" && !clickedCell.hasMoved) {
        this.selectedUnit = clickedCell;
        this.render();
        return;
      }

      if (clickedCell instanceof Unit && clickedCell.type === "enemy" && !this.selectedUnit.hasAttacked) {
        const distance = this.calculateHexDistance(this.selectedUnit.x, this.selectedUnit.y, x, y);
        const isNeighbor = this.isInHexNeighbors(this.selectedUnit.x, this.selectedUnit.y, x, y);

        logOnConsole(`handleClick:`, {
          distance,
          isNeighbor,
          selectedUnitY: this.selectedUnit.y,
          y,
          selectedUnitX: this.selectedUnit.x,
          x,
        });

        if (
          (distance === 1 && isNeighbor) ||
          (distance === 0.5 && this.selectedUnit.x === x) ||
          (this.selectedUnit.attackRange > 1 && distance <= this.selectedUnit.attackRange)
        ) {
          attackDetails = this.performAttack(this.selectedUnit, clickedCell);

          if (this.selectedUnit.hasMoved || !this.canUnitMove(this.selectedUnit)) {
            this.selectedUnit = null;
          }
        }
      } else if (
        !clickedCell &&
        !this.selectedUnit.hasMoved &&
        this.isValidMove(this.selectedUnit.x, this.selectedUnit.y, x, y, this.selectedUnit.moveRange)
      ) {
        this.moveUnit(this.selectedUnit, x, y);
        suspendRender = true;
        if (this.selectedUnit.hasAttacked || !this.canUnitAttack(this.selectedUnit)) {
          this.selectedUnit = null;
        }
      }
    } else if (clickedCell instanceof Unit && clickedCell.type === "player" && !clickedCell.hasMoved) {
      this.selectedUnit = clickedCell;
    }

    if (suspendRender === false) this.render();

    if (attackDetails.wasAttacked) {
      this.addHitEffect(attackDetails.unit.x, attackDetails.unit.y);
    }
    if (attackDetails.wasKilled) {
      this.addGraveEffect(attackDetails.unit.x, attackDetails.unit.y);
    }

    // Check if player turn is over
    let playerUnitsCanMove = false;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 12; j++) {
        const unit = this.grid[i][j];
        if (unit && unit.type === "player" && !unit.hasMoved) {
          playerUnitsCanMove = true;
          break;
        }
      }
    }

    if (!playerUnitsCanMove) {
      this.currentTurn = "enemy";
      this.turnNumber++;
      this.addToHistory({ type: "turn", turn: this.turnNumber });
      this.updateTurnIndicator();
      setTimeout(() => this.enemyTurn(), 1000);
    }
  }

  performAttack(attacker, defender) {
    const attackDetails = {};
    attackDetails.unit = defender;
    const distance = Math.abs(attacker.x - defender.x) + Math.abs(attacker.y - defender.y);
    const damageResult =
      distance === 1 ? attacker.calculateDamage(defender) : attacker.calculateRangedDamage(defender, distance);

    this.addDamageToStats(attacker, damageResult.damage);
    this.addToHistory({
      actor: attacker.type,
      text: `${attacker.icon} ${attacker.name} ${distance > 1 ? "shoots" : "attacks"} ${defender.icon} ${
        defender.name
      } for ${damageResult.damage} damage${damageResult.isCritical ? " (CRITICAL HIT!)" : ""}`,
    });

    defender.hp -= damageResult.damage;
    attacker.hasAttacked = true;
    attacker.hasMoved = true;

    const unitDiv = document.querySelector(`.hex:nth-child(${defender.x * 12 + defender.y + 1}) .unit`);
    unitDiv.classList.add("attacked");
    if (damageResult.isCritical) {
      unitDiv.classList.add("critical");
      attackDetails.wasCritical = true;
    }
    attackDetails.wasAttacked = true;

    setTimeout(() => {
      unitDiv.classList.remove("attacked");
      unitDiv.classList.remove("critical");
      this.updateInfoPanel(defender);
    }, 500);

    if (defender.hp <= 0) {
      attackDetails.wasKilled = true;

      this.gameStats[attacker.type].unitsKilled.push({
        name: defender.name,
        icon: defender.icon,
      });
      this.gameStats[defender.type].unitsLost++;
      this.addUnitLostToStats(defender);
      this.grid[defender.x][defender.y] = null;
      this.updateInfoPanel(null);
      this.checkGameOver();

      this.addToHistory({ actor: defender.type, text: `${defender.icon} ${defender.name} was defeated!` });
    }

    // Add damage to game stats (not just turn stats)
    this.gameStats[attacker.type].damageDealt += damageResult.damage;

    return attackDetails;
  }

  moveUnit(unit, targetX, targetY) {
    const path = this.findPath(unit.x, unit.y, targetX, targetY, unit.moveRange);
    if (!path) return;

    const oldX = unit.x;
    const oldY = unit.y;

    path.unshift({ x: oldX, y: oldY });

    this.addToHistory({
      actor: unit.type,
      text: `${unit.icon} ${unit.name} moved`,
    });

    this.grid[targetX][targetY] = unit;
    this.grid[unit.x][unit.y] = null;
    unit.x = targetX;
    unit.y = targetY;
    unit.hasMoved = true;

    this.render();

    // Show movement trail for each step
    path.forEach((pos, index) => {
      setTimeout(() => {
        this.addTrailingEffect(pos.x, pos.y);
      }, index * 100);
    });
  }

  addHitEffect(oldX, oldY) {
    setTimeout(() => {
      const fromHex = document.querySelector(`.hex:nth-child(${oldX * 12 + oldY + 1})`);
      if (fromHex) {
        const trail = document.createElement("div");
        trail.className = "hit-effect";
        fromHex.appendChild(trail);

        setTimeout(() => trail.remove(), 3000);
      }
    }, 0);
  }

  addGraveEffect(oldX, oldY) {
    setTimeout(() => {
      const fromHex = document.querySelector(`.hex:nth-child(${oldX * 12 + oldY + 1})`);
      if (fromHex) {
        const trail = document.createElement("div");
        trail.className = "grave-effect";
        fromHex.appendChild(trail);

        setTimeout(() => trail.remove(), 3000);
      }
    }, 0);
  }

  addTrailingEffect(oldX, oldY) {
    setTimeout(() => {
      const fromHex = document.querySelector(`.hex:nth-child(${oldX * 12 + oldY + 1})`);
      if (fromHex) {
        const trail = document.createElement("div");
        trail.className = "move-trail";
        fromHex.appendChild(trail);

        setTimeout(() => trail.remove(), 2800);
      }
    }, 0);
  }

  canUnitMove(unit) {
    if (unit.hasMoved) return false;
    if (unit.hasAttacked) return false;
    for (let i = -unit.moveRange; i <= unit.moveRange; i++) {
      for (let j = -unit.moveRange; j <= unit.moveRange; j++) {
        const newX = unit.x + i;
        const newY = unit.y + j;
        if (this.isValidMove(unit.x, unit.y, newX, newY, unit.moveRange)) {
          return true;
        }
      }
    }
    return false;
  }

  canUnitAttack(unit) {
    if (unit.hasAttacked) return false;
    for (let i = -unit.attackRange; i <= unit.attackRange; i++) {
      for (let j = -unit.attackRange; j <= unit.attackRange; j++) {
        const x = unit.x + i;
        const y = unit.y + j;
        if (
          x >= 0 &&
          x < 8 &&
          y >= 0 &&
          y < 12 &&
          this.grid[x][y] instanceof Unit &&
          this.grid[x][y].type === "enemy" &&
          this.calculateHexDistance(unit.x, unit.y, x, y) <= unit.attackRange
        ) {
          return true;
        }
      }
    }
    return false;
  }

  updateInfoPanel(unit) {
    const infoPanel = document.getElementById("infoPanel");
    if (!unit) {
      infoPanel.innerHTML = "Select a unit to see information";
      return;
    }

    if (unit instanceof Unit === false) {
      infoPanel.innerHTML = `
            <div class="unit-name">${unit.icon} ${unit.name.charAt(0).toUpperCase() + unit.name.slice(1)}</div>
            <div class="unit-stats
                <span>
                <div class="stat">
                    <span>Description:</span>
                    <span>${unit.name}</span>
                </div>
                </span>
            </div>
        `;
      return;
    }

    infoPanel.innerHTML = `
            <div class="unit-name">${unit.icon} ${unit.name}</div>
            <div class="unit-stats">
                <span>
                <div class="stat">
                    <span>❤️ HP:</span>
                    <span>${unit.hp}/${unit.maxHp}</span>
                </div>
                <div class="stat">
                    <span>⚔️ Attack:</span>
                    <span>${unit.attack}</span>
                </div>
                </span>
                <span>
                <div class="stat">
                    <span>🛡️ Defense:</span>
                    <span>${unit.defense}</span>
                </div>
                <div class="stat">
                    <span>🏃 Move Range:</span>
                    <span>${unit.moveRange}</span>
                </div>
                </span>
                <span>
                <div class="stat">
                    <span>🏹 Range:</span>
                    <span>${unit.attackRange}</span>
                </div>
                <div class="stat">
                    <span>Status:</span>
                    <span>${unit.hasMoved ? "✖️ Moved" : "✔️ Ready"}</span>
                </div>
                </span>
            </div>
        `;
  }

  enemyTurn() {
    if (this.gameOver) return;

    const trailing = [];
    const kills = [];
    const hits = [];
    const actions = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 12; j++) {
        const unit = this.grid[i][j];
        if (unit && unit.type === "enemy") {
          // Find all player units within range
          let targetInRange = null;
          let nearestPlayer = null;
          let minDist = Infinity;

          for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 12; y++) {
              const target = this.grid[x][y];
              if (target && target.type === "player") {
                const dist = this.calculateHexDistance(x, y, i, j);

                if (dist <= unit.attackRange) {
                  if (!targetInRange || dist < Math.abs(targetInRange.x - i) + Math.abs(targetInRange.y - j)) {
                    targetInRange = { unit: target, x, y };
                  }
                }

                if (dist < minDist) {
                  minDist = dist;
                  nearestPlayer = { unit: target, x, y };
                }
              }
            }
          }

          // Attack if target in range
          if (targetInRange) {
            const distance = Math.abs(targetInRange.x - i) + Math.abs(targetInRange.y - j);
            const damageResult =
              distance === 1
                ? unit.calculateDamage(targetInRange.unit)
                : unit.calculateRangedDamage(targetInRange.unit, distance);

            this.addToHistory({
              actor: "enemy",
              text: `${unit.icon} ${unit.name} ${distance > 1 ? "shoots" : "attacks"} ${targetInRange.unit.icon} ${
                targetInRange.unit.name
              } for ${damageResult.damage} damage${damageResult.isCritical ? " (CRITICAL HIT!)" : ""}`,
            });
            actions.push({ type: "attack", unit, target: targetInRange, damage: damageResult.damage });

            targetInRange.unit.hp -= damageResult.damage;

            // Visual feedback and death check
            const unitDiv = document.querySelector(
              `.hex:nth-child(${targetInRange.x * 12 + targetInRange.y + 1}) .unit`
            );
            if (unitDiv) {
              unitDiv.classList.add("attacked");
              if (damageResult.isCritical) {
                unitDiv.classList.add("critical");
              }

              hits.push({ x: targetInRange.x, y: targetInRange.y });
            }

            if (targetInRange.unit.hp <= 0) {
              this.addToHistory({
                actor: "enemy",
                text: `${targetInRange.unit.icon} ${targetInRange.unit.name} was defeated`,
              });

              kills.push({ unit: targetInRange.unit, x: targetInRange.x, y: targetInRange.y });

              this.grid[targetInRange.x][targetInRange.y] = null;
              this.checkGameOver();
              actions.push({ type: "defeat", unit: targetInRange.unit });
            }
          }
          // Move towards nearest player if no target in range
          else if (nearestPlayer) {
            const dx = Math.sign(nearestPlayer.x - i);
            const dy = Math.sign(nearestPlayer.y - j);
            let moved = false;

            if (this.grid[i + dx]?.[j] === null) {
              this.grid[i + dx][j] = unit;
              this.grid[i][j] = null;
              unit.x = i + dx;
              unit.y = j;
              moved = true;
            } else if (this.grid[i]?.[j + dy] === null) {
              this.grid[i][j + dy] = unit;
              this.grid[i][j] = null;
              unit.x = i;
              unit.y = j + dy;
              moved = true;
            }

            if (moved) {
              trailing.push({ unit, x: i, y: j });
              this.addToHistory({
                actor: "enemy",
                text: `${unit.icon} ${unit.name} moves towards ${nearestPlayer.unit.icon} ${nearestPlayer.unit.name}`,
              });
              actions.push({ type: "move", unit, x: unit.x, y: unit.y });
            } else {
              this.addToHistory({
                actor: "enemy",
                text: `${unit.icon} ${unit.name} is blocked and cannot move`,
              });
            }
          }
        }
      }
    }

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 12; j++) {
        const unit = this.grid[i][j];
        if (unit && unit.type === "player") {
          unit.hasMoved = false;
          unit.hasAttacked = false;
        }
      }
    }

    if (actions.length === 0) {
      this.addToHistory({ actor: "enemy", text: "🏳️ Skipped remaining moves" });
    }

    this.addToHistoryTurnSummary();
    this.currentTurn = "player";
    this.turnNumber++;
    this.addToHistory({ type: "turn", turn: this.turnNumber });
    this.updateTurnIndicator();
    this.render();

    for (let move of trailing) {
      this.addTrailingEffect(move.x, move.y);
    }

    for (let kill of kills) {
      this.addGraveEffect(kill.x, kill.y);
    }

    for (let hit of hits) {
      this.addHitEffect(hit.x, hit.y);
    }
  }

  checkGameOver() {
    let playerUnits = 0;
    let enemyUnits = 0;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 12; j++) {
        const unit = this.grid[i][j];
        if (unit instanceof Unit) {
          if (unit.type === "player") playerUnits++;
          if (unit.type === "enemy") enemyUnits++;
        }
      }
    }

    if (playerUnits === 0 || enemyUnits === 0) {
      this.gameOver = true;
      const winner = playerUnits > 0 ? "Player" : "Enemy";
      this.showGameOver(winner);
    }

    return this.gameOver;
  }

  calculateFinalScore(winner) {
    const stats = this.gameStats.player;

    // Points for damage dealt (1 point per 2 damage)
    const damageScore = Math.floor(stats.damageDealt / 2);

    let killedUnitsScore = 0;
    stats.unitsKilled.forEach((unit) => {
      killedUnitsScore += Unit.getUnitValue(unit.name);
    });

    // Penalty for lost units
    const lostUnitsPenalty = stats.unitsLost * 25;

    // Bonus for winning/surviving
    let survivedUnitsScore = 0;
    if (winner === "Player") {
      survivedUnitsScore += 500;
      // Bonus for remaining units' health
      this.grid.forEach((row) => {
        row.forEach((cell) => {
          if (cell instanceof Unit && cell.type === "player") {
            survivedUnitsScore += Math.floor((cell.hp / cell.maxHp) * 50);
          }
        });
      });
    }

    // include players base army strength - stronger army = lower score
    let playerArmyStrength = 0;
    this.basePlayerUnits.forEach((unitName) => {
      playerArmyStrength += Unit.getUnitValue(unitName);
    });

    const playerArmyStrengthScore = Math.floor(playerArmyStrength / 3);

    // Reduce points based on the strength of the player's base army
    const finalScore = damageScore + killedUnitsScore + survivedUnitsScore - lostUnitsPenalty - playerArmyStrengthScore;

    logOnConsole(`calculateFinalScore:`, {
      finalScore,
      damageScore,
      killedUnitsScore,
      survivedUnitsScore,
      lostUnitsPenalty,
      playerArmyStrengthScore,
    });

    return Math.max(0, finalScore); // Ensure score doesn't go negative
  }

  showGameOver(winner) {
    const finalScore = this.calculateFinalScore(winner);
    this.gameStats.player.totalPoints = finalScore;

    document.getElementById("gameControls").style.display = "none";

    const stats = this.gameStats.player;
    const gameOverDiv = document.createElement("div");
    gameOverDiv.className = "game-over";
    gameOverDiv.innerHTML = `
      <h2>${winner} Wins!</h2>
      <div class="final-stats">
        <h3>Battle Statistics</h3>
        <div class="stat-row">🗡️ Damage Dealt: ${stats.damageDealt}</div>
        <div class="stat-row">💀 Enemy Units Defeated: ${stats.unitsKilled.length}</div>
        <div class="stat-row">🏆 Units Lost: ${stats.unitsLost}</div>
        <div class="stat-row">
          <div class="killed-units">
            ${stats.unitsKilled
              .map(
                (unit) => `
              <div class="killed-unit">
                <span>${unit.icon}</span>
                <span>${unit.name}</span>
                <span>+${Unit.getUnitValue(unit.name)}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="final-score">Final Score: ${finalScore}</div>
      </div>
      <button onclick="location.reload()">Play Again</button>
    `;
    document.body.appendChild(gameOverDiv);
    this.addToHistoryTurnSummary();
  }

  endTurn() {
    if (this.currentTurn === "player" && !this.gameOver) {
      this.addToHistory({
        actor: "player",
        text: "🏳️ Skipped remaining moves",
      });

      this.addToHistoryTurnSummary();

      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 12; j++) {
          const unit = this.grid[i][j];
          if (unit instanceof Unit && unit.type === "player") {
            unit.hasMoved = true;
            unit.hasAttacked = true;
          }
        }
      }

      this.selectedUnit = null;
      this.currentTurn = "enemy";
      this.turnNumber++;
      this.addToHistory({ type: "turn", turn: this.turnNumber });
      this.updateTurnIndicator();
      this.render();
      setTimeout(() => this.enemyTurn(), 1000);
    }
  }

  surrender() {
    if (!this.gameOver) {
      this.addToHistory({
        actor: "player",
        text: "🏳️ Surrendered the battle",
      });
      this.gameOver = true;
      this.showGameOver("Enemy");
    }
  }
}

document.addEventListener("DOMContentLoaded", initializeUnitSelection);
