const sudokuScoreEndpoint = "../../api/sudoku/score";
let scoreValue = 0;
const difficulty = 0.5;

async function issuePostScoreRequest(score) {
  const data = fetch(sudokuScoreEndpoint, {
    method: "POST",
    body: JSON.stringify({ score }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  }).then((r) => r.json());
  return data;
}

function generateSudokuGrid() {
  const grid = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

  function isValid(grid, row, col, num) {
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num) {
        return false;
      }
    }

    for (let i = 0; i < 9; i++) {
      if (grid[i][col] === num) {
        return false;
      }
    }

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[startRow + i][startCol + j] === num) {
          return false;
        }
      }
    }

    return true;
  }

  function solveSudoku(grid) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          shuffleArray(numbers);
          for (let i = 0; i < numbers.length; i++) {
            const num = numbers[i];
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              if (solveSudoku(grid)) {
                return true;
              }
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  solveSudoku(grid);

  return grid;
}

function displaySudokuGrid(grid, difficulty) {
  const tbody = document.querySelector("#game-container");

  for (let i = 0; i < 9; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < 9; j++) {
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.style.width = "40px";
      input.style.height = "40px";
      cell.style.border = "1px solid grey";
      cell.style.width = "40px";
      cell.style.height = "40px";
      input.type = "number";
      input.min = 1;
      input.max = 9;

      if (Math.random() <= difficulty) {
        input.disabled = true;
        input.style.fontWeight = "bold";
        input.style.fontSize = "20px";
        input.style.color = "black";
        input.value = grid[i][j] !== 0 ? grid[i][j] : "";
      } else {
        input.value = "";
      }
      cell.appendChild(input);
      row.appendChild(cell);

      if ((i + 1) % 3 === 0 && (j + 1) % 3 === 0 && j < 8 && i < 8) {
        cell.style.borderRight = "4px solid black";
        cell.style.borderBottom = "4px solid black";
      } else if ((i + 1) % 3 === 0 && i < 8) {
        cell.style.borderBottom = "4px solid black";
      } else if ((j + 1) % 3 === 0 && j < 8) {
        cell.style.borderRight = "4px solid black";
      }
      cell.classList.add("grid");
    }
    tbody.appendChild(row);
  }
}

function checkUniqueValues(grid) {
  let result = true;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      grid[row][col].style.backgroundColor = "white";
      const value = parseInt(grid[row][col].value);

      if (value < 1 || value > 9) {
        grid[row][col].style.backgroundColor = "#ffcccb";
        result = false;
      }

      if (!checkUniqueValue(grid, row, col, value)) {
        if (grid[row][col].disabled === true) {
          grid[row][col].style.backgroundColor = "#ff817f";
        } else {
          grid[row][col].style.backgroundColor = "#ff3633";
        }

        result = false;
      }
      if (isNaN(value)) {
        grid[row][col].style.backgroundColor = "#ffcccb";
        result = false;
      }
    }
  }
  return result;
}

function checkUniqueValue(grid, row, col, value) {
  // Check row
  for (let i = 0; i < 9; i++) {
    if (parseInt(grid[row][i].value) === value && i !== col) {
      return false;
    }
  }

  // Check column
  for (let i = 0; i < 9; i++) {
    if (parseInt(grid[i][col].value) === value && i !== row) {
      return false;
    }
  }

  return true;
}

function checkSudoku() {
  const inputs = document.querySelectorAll("input");
  const grid = [];

  inputs.forEach((input, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;

    if (!grid[row]) {
      grid[row] = [];
    }

    grid[row][col] = input;
  });

  const isCorrect = checkUniqueValues(grid);
  const status = document.querySelector("#status");

  if (isCorrect) {
    status.textContent = "Congratulations! You solved the Sudoku puzzle.";
    scoreValue += difficulty * 10000;

    checkButton.disabled = true;
    issuePostScoreRequest(scoreValue);
  } else {
    status.textContent = "Incorrect numbers. Please try again.";
    scoreValue -= 1;
  }

  const score = document.querySelector("#score");
  score.textContent = `Score: ${scoreValue}`;
  return;
}

function startGame() {
  const grid = generateSudokuGrid();
  displaySudokuGrid(grid, difficulty);
  scoreValue = 0;
  const startButton = document.querySelector("#start");
  startButton.disabled = true;
  const status = document.querySelector("#status");
  status.textContent = "Good luck!";
  const checkButton = document.querySelector("#check");
  checkButton.disabled = false;
  return;
}

const startButton = document.querySelector("#start");
startButton.addEventListener("click", startGame);

const checkButton = document.querySelector("#check");
checkButton.addEventListener("click", checkSudoku);
