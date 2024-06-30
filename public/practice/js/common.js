function writeResults(data) {
  const resultsContainer = document.getElementById("results-container");
  resultsContainer.innerHTML = "";
  const paragraph = document.createElement("p");
  paragraph.setAttribute("data-testid", "dti-results");
  paragraph.setAttribute("id", "results");
  paragraph.innerHTML = data;
  resultsContainer.appendChild(paragraph);
}

function buttonOnClick() {
  writeResults("You clicked the button!");
}

function checkBoxOnClick() {
  const checkbox = document.querySelector("input[type=checkbox]");
  if (checkbox.checked) {
    writeResults("Checkbox is checked!");
  } else {
    writeResults("Checkbox is unchecked!");
  }
}

function dropdownOnChange() {
  const dropdown = document.querySelector("select[name=name-dropdown]");
  const selectedOption = dropdown.value;
  writeResults(`Selected option: ${selectedOption}`);
}

function radioButtonOnClick(radioNumber) {
  writeResults(`Radio Button ${radioNumber} clicked!`);
}

function rangeOnChange() {
  const range = document.querySelector("input[type=range]");
  const value = range.value;
  writeResults(`Range value changed to: ${value}`);
}

function datetimeOnChange() {
  const dateInput = document.querySelector("input[type=date]");
  const selectedDate = dateInput.value;
  writeResults(`Selected date: ${selectedDate}`);
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function colorOnChange() {
  const colorInput = document.querySelector("input[type=color]");
  const selectedColor = colorInput.value;
  const rgbColor = hexToRgb(selectedColor);

  writeResults(`New selected color: ${selectedColor} as hex and in RGB: ${rgbColor}`);
}

function labelOnMouseOver() {
  writeResults("Mouse over event occurred!");
}
function labelOnMouseLeave() {
  writeResults("");
}

function inputOnChange() {
  const input = document.querySelector("input[type=text]");
  const inputValue = input.value;
  writeResults(`Input value changed to: ${inputValue}`);
}

function textareaOnChange() {
  const textarea = document.querySelector("textarea");
  const textareaValue = textarea.value;
  writeResults(`Textarea value changed to: ${textareaValue}`);
}

function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomValueBasedOnSeed(min, max, seed) {
  if (seed === undefined) {
    seed = Math.random();
  }

  const random = Math.sin(seed) * 10000;
  const normalized = (random - Math.floor(random)) * (max - min + 1);
  return Math.floor(normalized) + min;
}

function getRandomValueBasedOnSeedStr(min, max, seed) {
  if (typeof seed === "string") {
    seed = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }

  if (seed === undefined) {
    seed = Math.random();
  }

  const random = Math.sin(seed) * 10000;
  const normalized = (random - Math.floor(random)) * (max - min + 1);
  return Math.floor(normalized) + min;
}

class randomValueGenerator {
  constructor(seed) {
    this.seed = seed;
    this.currentIndex = 0;
  }

  getNextValue(min, max) {
    if (typeof this.seed === "string") {
      this.seed = this.seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    }

    const random = Math.sin(this.seed + this.currentIndex) * 10000;
    const normalized = (random - Math.floor(random)) * (max - min + 1);
    const value = Math.floor(normalized) + min;

    this.currentIndex++;
    return value;
  }

  resetSeed(seed) {
    this.seed = seed;
    this.currentIndex = 0;
  }
}
