function writeResults(data) {
  const resultsContainer = document.getElementById("results-container");
  resultsContainer.innerHTML = "";
  const paragraph = document.createElement("p");
  paragraph.setAttribute("data-testid", "dti-results");
  paragraph.setAttribute("id", "results");
  paragraph.innerHTML = data;
  resultsContainer.appendChild(paragraph);

  const resultsHistoryContainer = document.getElementById("results-history-container");
  if (resultsHistoryContainer !== null) {
    const currentValue = resultsHistoryContainer.value;
    const newText = `${data}\n` + currentValue;
    resultsHistoryContainer.value = newText;
    if (resultsHistoryContainer.value.split("\n").length > 100) {
      const lines = resultsHistoryContainer.value.split("\n");
      const newLines = lines.slice(0, 100);
      resultsHistoryContainer.value = newLines.join("\n");
    }
  }
}

function writeResultsDelayed(data, elementDelay = 0, textDelay = 0) {
  invokeFunctionWithDelay(() => {
    const resultsContainer = document.getElementById("results-container");
    resultsContainer.innerHTML = "";

    const paragraph = document.createElement("p");
    paragraph.setAttribute("data-testid", "dti-results");
    paragraph.setAttribute("id", "results");
    resultsContainer.appendChild(paragraph);
    paragraph.innerHTML = "Processing... Please wait.";
  }, elementDelay);

  invokeFunctionWithDelay(() => {
    const paragraph = document.getElementById("results");
    paragraph.innerHTML = data;

    const resultsHistoryContainer = document.getElementById("results-history-container");
    if (resultsHistoryContainer !== null) {
      const currentValue = resultsHistoryContainer.value;
      const newText = `${data}\n` + currentValue;
      resultsHistoryContainer.value = newText;
      if (resultsHistoryContainer.value.split("\n").length > 100) {
        const lines = resultsHistoryContainer.value.split("\n");
        const newLines = lines.slice(0, 100);
        resultsHistoryContainer.value = newLines.join("\n");
      }
    }
  }, elementDelay + 0.2 + textDelay);
}

function formatDataToAppend(additionalData) {
  let dataToAppend = "";
  if (additionalData !== "" && additionalData !== undefined) {
    dataToAppend = ` ${additionalData}`;
  }
  return dataToAppend;
}

function buttonOnClickDelayed(additionalData = "", elementDelay) {
  let newElementDelay = elementDelay !== undefined ? elementDelay : getRandomValue(2000, 2500);
  console.log(`Results from button will be displayed after ${newElementDelay} ms`);
  invokeFunctionWithDelay(() => buttonOnClick(additionalData), newElementDelay);
}

function buttonOnClickComplexDelayed(additionalData = "", elementDelay, textDelay) {
  let newElementDelay = elementDelay !== undefined ? elementDelay : getRandomValue(2000, 2500);
  let newTextDelay = textDelay !== undefined ? textDelay : getRandomValue(2000, 2500);
  console.log(`Results Element be displayed after ${newElementDelay} ms`);
  console.log(`Results from button will be displayed after ${newTextDelay} ms`);
  // invokeFunctionWithDelay(() => buttonOnClick(additionalData), delayValue);
  let dataToAppend = formatDataToAppend(additionalData);
  writeResultsDelayed("You clicked the button!" + dataToAppend, newElementDelay, newTextDelay);
}

function buttonOnClick(additionalData = "") {
  let dataToAppend = formatDataToAppend(additionalData);
  writeResults("You clicked the button!" + dataToAppend);
}

function checkBoxOnClickDelayed(additionalData = "", delay, el) {
  const delayValue = delay !== undefined ? delay : getRandomValue(2000, 2500);
  console.log(`Results from checkBox will be displayed after ${delayValue} ms`);
  invokeFunctionWithDelay(() => checkBoxOnClick(additionalData, el), delayValue);
}

function checkBoxOnClick(additionalData = "", el) {
  let dataToAppend = formatDataToAppend(additionalData);

  let checkbox = el;
  if (el === undefined) {
    checkbox = document.querySelector("input[type=checkbox]");
  }

  if (checkbox.checked) {
    writeResults("Checkbox is checked!" + dataToAppend);
  } else {
    writeResults("Checkbox is unchecked!" + dataToAppend);
  }
}

function dropdownOnChangeDelayed(additionalData = "", delay) {
  const delayValue = delay !== undefined ? delay : getRandomValue(2000, 2500);
  console.log(`Results from dropdown will be displayed after ${delayValue} ms`);
  invokeFunctionWithDelay(() => dropdownOnChange(additionalData), delayValue);
}

function dropdownOnChange(additionalData = "", el) {
  let dataToAppend = formatDataToAppend(additionalData);

  let dropdown = el;
  if (el === undefined) {
    dropdown = document.querySelector("select[name=name-dropdown]");
  }

  const selectedOption = dropdown.value;
  writeResults(`Selected option: ${selectedOption}` + dataToAppend);
}

function radioButtonOnClick(radioNumber, additionalData = "", el) {
  let dataToAppend = formatDataToAppend(additionalData);

  writeResults(`Radio Button ${radioNumber} clicked!` + dataToAppend);
}

function rangeOnChange(additionalData = "", el) {
  let dataToAppend = formatDataToAppend(additionalData);

  let range = el;
  if (el === undefined) {
    range = document.querySelector("input[type=range]");
  }
  const value = range.value;
  writeResults(`Range value changed to: ${value}` + dataToAppend);
}

function datetimeOnChange(additionalData = "", el) {
  let dataToAppend = formatDataToAppend(additionalData);

  let dateInput = el;
  if (el === undefined) {
    dateInput = document.querySelector("input[type=date]");
  }
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

function colorOnChange(additionalData = "", el) {
  let dataToAppend = formatDataToAppend(additionalData);

  let colorInput = el;
  if (el === undefined) {
    colorInput = document.querySelector("input[type=color]");
  }

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

function inputOnChangeDelayed(additionalData = "", delay) {
  const delayValue = delay !== undefined ? delay : getRandomValue(2000, 2500);
  console.log(`Results from input will be displayed after ${delayValue} ms`);
  invokeFunctionWithDelay(() => inputOnChange(additionalData), delayValue);
}

function inputOnChange(additionalData = "", el) {
  let dataToAppend = formatDataToAppend(additionalData);

  let input = el;
  if (el === undefined) {
    input = document.querySelector("input[type=text]");
  }

  const inputValue = input.value;
  writeResults(`Input value changed to: ${inputValue}` + dataToAppend);
}

function textareaOnChangeDelayed(additionalData = "", delay) {
  const delayValue = delay !== undefined ? delay : getRandomValue(2000, 2500);
  console.log(`Results from textarea will be displayed after ${delayValue} ms`);
  invokeFunctionWithDelay(() => textareaOnChange(additionalData), delayValue);
}

function textareaOnChange(additionalData = "", el) {
  let dataToAppend = formatDataToAppend(additionalData);

  let textarea = el;

  if (el === undefined) {
    textarea = document.querySelector("textarea");
  }

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

function formatId(id) {
  return id.toLowerCase().replace(/\s/g, "-");
}

function getRandomColor() {
  const colors = ["red", "blue", "green", "orange", "purple", "brown"];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}

function getRandomEmoji() {
  const emojis = ["🚀", "🎉", "🚫", "🔥", "👍", "👎"];
  const randomIndex = Math.floor(Math.random() * emojis.length);
  return emojis[randomIndex];
}

function getRandomQuote() {
  const quotes = [
    "Nobody expects the Spanish Inquisition!",
    "It's just a flesh wound!",
    "I'm not dead yet!",
    "We are the knights who say... NI!",
    "What is the airspeed velocity of an unladen swallow?",
    "I'm being repressed!",
    "Bring out your dead!",
    "We demand a shrubbery!",
    "I'm not a Roman, Mum!",
    "I'm warning you, I've got a crossbow!",
    "I'm a lumberjack and I'm okay!",
    "Spam, spam, spam, spam, spam, spam, baked beans, spam, spam, spam, and spam.",
    "And now for something completely different.",
    "I'm so worried about the flamingo!",
    "Always look on the bright side of life.",
    "Luxury! We used to dream of living in a corridor!",
  ];
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}
