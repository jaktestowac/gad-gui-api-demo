function writeResults(data) {
  const resultsContainer = document.getElementById("results-container");
  resultsContainer.innerHTML = "";
  const paragraph = document.createElement("p");
  paragraph.setAttribute("data-testid", "dti-results");
  paragraph.setAttribute("id", "results");
  paragraph.innerHTML = data;
  resultsContainer.appendChild(paragraph);
}

function formatDataToAppend(additionalData) {
  let dataToAppend = "";
  if (additionalData !== "" && additionalData !== undefined) {
    dataToAppend = ` ${additionalData}`;
  }
  return dataToAppend;
}

function buttonOnClick(additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);
  writeResults("You clicked the button!" + dataToAppend);
}

function checkBoxOnClick(additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);

  const checkbox = document.querySelector("input[type=checkbox]");
  if (checkbox.checked) {
    writeResults("Checkbox is checked!" + dataToAppend);
  } else {
    writeResults("Checkbox is unchecked!" + dataToAppend);
  }
}

function dropdownOnChange(additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);

  const dropdown = document.querySelector("select[name=name-dropdown]");
  const selectedOption = dropdown.value;
  writeResults(`Selected option: ${selectedOption}` + dataToAppend);
}

function radioButtonOnClick(radioNumber, additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);

  writeResults(`Radio Button ${radioNumber} clicked!` + dataToAppend);
}

function rangeOnChange(additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);

  const range = document.querySelector("input[type=range]");
  const value = range.value;
  writeResults(`Range value changed to: ${value}` + dataToAppend);
}

function datetimeOnChange(additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);

  const dateInput = document.querySelector("input[type=date]");
  const selectedDate = dateInput.value;
  writeResults(`Selected date: ${selectedDate}` + dataToAppend);
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function colorOnChange(additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);

  const colorInput = document.querySelector("input[type=color]");
  const selectedColor = colorInput.value;
  const rgbColor = hexToRgb(selectedColor);

  writeResults(`New selected color: ${selectedColor} as hex and in RGB: ${rgbColor}` + dataToAppend);
}

function labelOnMouseOver(additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);

  writeResults("Mouse over event occurred!" + dataToAppend);
}
function labelOnMouseLeave(additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);

  writeResults("" + dataToAppend);
}

function inputOnChange(additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);

  const input = document.querySelector("input[type=text]");
  const inputValue = input.value;
  writeResults(`Input value changed to: ${inputValue}` + dataToAppend);
}

function textareaOnChange(additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);

  const textarea = document.querySelector("textarea");
  const textareaValue = textarea.value;
  writeResults(`Textarea value changed to: ${textareaValue}` + dataToAppend);
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

class RandomValueGenerator {
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

function changeElementsState(elementsCssSelectors, state, value) {
  elementsCssSelectors.forEach((elementCssSelector) => {
    const elements = document.querySelectorAll(elementCssSelector);
    elements.forEach((element) => {
      element[state] = value;
    });
  });
}

function changeElementsVisibility(elementsCssSelectors, state) {
  elementsCssSelectors.forEach((elementCssSelector) => {
    const elements = document.querySelectorAll(elementCssSelector);
    elements.forEach((element) => {
      element.style.display = state;
    });
  });
}

function invokeFunctionWithDelay(func, delay) {
  setTimeout(func, delay);
}

function addElementsToContainer(containerSelector, elementHTML) {
  const container = document.querySelector(containerSelector);
  container.innerHTML += elementHTML;
}

function generateDateStrings(pastDays) {
  const dateStrings = [];
  for (let i = 0; i < pastDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dateStrings.push(date.toISOString().split("T")[0]);
  }
  return dateStrings;
}

function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}
