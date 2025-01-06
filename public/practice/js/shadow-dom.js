function attachClockForTimeZones(
  selector,
  timeZones = ["America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney", "America/Los_Angeles"]
) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.attachShadow({ mode: "open" });

  const clockContainer = prepareClockElements(timeZones);

  shadowRoot.appendChild(clockContainer);
}

function attachPlacesOfInterests(selector, placesOfInterest) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.attachShadow({ mode: "open" });

  const elements = preparePlacesInfInterestElements(placesOfInterest);

  elements.forEach((element) => {
    shadowRoot.appendChild(element);
  });
}

function addPlacesOfInterest(selector, placeOfInterest) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.shadowRoot;

  const element = preparePlacesInfInterestElements([placeOfInterest])[0];

  shadowRoot.appendChild(element);
}

function attachButton(selector, text, onclick) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.attachShadow({ mode: "open" });

  shadowRoot.appendChild(prepareButtonElement(text, onclick));
}

function addButton(selector, text, onclick) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.shadowRoot;

  shadowRoot.appendChild(prepareButtonElement(text, onclick));
}

function getStyleForShadowHost() {
  return `
        .round-host-container {
            margin-top: 10px;
            border-radius: 14px;
            padding: 10px;
            border: 3px solid rgb(226, 226, 226);
        }`;
}

function getStyleForNestedShadowHost() {
  return `
        .round-host-container {
            margin-top: 10px;
            border-radius: 14px;
            padding: 10px;
            border: 3px solid rgb(226, 226, 226);
            font-family: 'Caveat', cursive;
            font-size: 15px;
        }
        
        input {
            margin: 5px;
            padding: 5px;
            border: 2px solid black !important;
            border-radius: 5px;
            background-color: lightyellow;
        }

        button {
            padding: 5px;
            background-color: lightgreen;
            cursor: pointer;
            font-family: 'Caveat', cursive;
            font-weight: bold;
        }

        button:hover {
            background-color: lightblue;
        }

        div {
            background-color: lightgray;
        }
  `;
}

function getValidationStyleForShadowHost() {
  return `
    input {
        margin: 5px;
        padding: 5px;
        border: 1px solid black;
    }
    
    .invalid {
        border: 2px solid red;
    }`;
}

function getDefaultStyleForShadowHost() {
  return `
  divContainer {
      border: 1px solid black;
      padding: 10px;
      margin: 10px;
      font-family: 'Times New Roman', Times, serif;
  }

  shadow-results-container {
      margin-top: 10px;
      font-family: 'Times New Roman', Times, serif;
  }

  h3 {
      font-family: 'Times New Roman', Times, serif;
  }

  label {
      font-weight: bold;
      font-family: 'Times New Roman', Times, serif;
  }

  button {
      padding: 5px;
      background-color: lightyellow;
      border: none;
      cursor: pointer;
      font-family: 'Times New Roman', Times, serif;
  }
    
  button:hover {
      background-color: yellow;
  }
`;
}

function addNestedShadowElements(baseHostId = "nested-shadow-host", prefix = "nested-") {
  const shadowRootContainer = document.querySelector(`[id="${baseHostId}"]`);
  const shadowRoot = shadowRootContainer.attachShadow({ mode: "open" });

  const nestedShadowRootContainer = document.createElement("div");
  nestedShadowRootContainer.id = "deeper-nested-shadow-host";
  nestedShadowRootContainer.classList.add("round-host-container");

  shadowRoot.appendChild(nestedShadowRootContainer);

  const nestedShadowRoot = nestedShadowRootContainer.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = getStyleForShadowHost();
  style.textContent += getValidationStyleForShadowHost();

  nestedShadowRootContainer.appendChild(style);

  const spanTitle = document.createElement("span");
  spanTitle.textContent = "(this is another shadow root!)";
  nestedShadowRoot.appendChild(spanTitle);

  const nestedElements = prepareShadowElements(prefix, "Hello from nested Shadow DOM!");
  nestedShadowRoot.appendChild(nestedElements);
  const style2 = document.createElement("style");
  style2.textContent = getStyleForNestedShadowHost();
  style2.textContent += getValidationStyleForShadowHost();
  nestedShadowRoot.appendChild(style2);

  return shadowRoot;
}

function createElementAndAttachShadow(selector, elements, mode = "open") {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.attachShadow({ mode: mode });

  elements.forEach((element) => {
    shadowRoot.appendChild(element);
  });

  return shadowRoot;
}

function addShadowElements(
  baseHostId = "shadow-host",
  prefix = "",
  textContent = "Hello from Shadow DOM!",
  mode = "open"
) {
  const elements = prepareShadowElements(prefix, textContent);

  const style = document.createElement("style");
  style.textContent = getDefaultStyleForShadowHost();

  style.textContent += getValidationStyleForShadowHost();

  createElementAndAttachShadow(`[id="${baseHostId}"]`, [elements, style], mode);
}

function prepareShadowElements(prefix = "", textContent = "Hello from Shadow DOM!") {
  const divContainer = document.createElement("div");
  divContainer.classList.add("round-host-container");

  const style = document.createElement("style");
  style.textContent = getStyleForShadowHost();

  divContainer.appendChild(style);

  const header = document.createElement("h3");
  header.textContent = textContent;
  divContainer.appendChild(header);

  const label = document.createElement("label");
  label.textContent = "Enter your name: ";
  const input = document.createElement("input");
  input.id = prefix + "shadow-name-input";
  input.setAttribute("data-testid", prefix + "shadow-name-input");
  input.type = "text";
  const button = document.createElement("button");
  button.id = prefix + "shadow-submit";
  button.setAttribute("data-testid", prefix + "shadow-submit");
  button.textContent = "Submit";

  const shadowResultsContainer = document.createElement("div");
  shadowResultsContainer.id = prefix + "shadow-results";
  shadowResultsContainer.setAttribute("data-testid", prefix + "shadow-results");

  shadowResultsContainer.classList.add("shadow-results-container");
  button.addEventListener("click", () => {
    if (input.value === "") {
      input.classList.add("invalid");
      shadowResultsContainer.textContent = "Please enter your name!";
      return;
    }
    input.classList.remove("invalid");

    shadowResultsContainer.textContent = `Hello, ${input.value}!`;
  });

  divContainer.appendChild(label);
  divContainer.appendChild(input);
  divContainer.appendChild(button);

  divContainer.appendChild(shadowResultsContainer);

  return divContainer;
}

function addRegularElements() {
  const regularHost = document.getElementById("regular-host");

  const header = document.createElement("h3");
  header.textContent = "Hello from normal (light) DOM!";
  regularHost.appendChild(header);

  const { divContainer, resultsContainer } = prepareRegularElements();

  regularHost.appendChild(divContainer);
  regularHost.appendChild(resultsContainer);
}

function prepareRegularElements() {
  const divContainer = document.createElement("div");
  divContainer.classList.add("regular-container");

  const label = document.createElement("label");
  label.textContent = "Enter your name: ";
  const regularInput = document.createElement("input");
  regularInput.id = "name-input";
  regularInput.setAttribute("data-testid", "name-input");
  regularInput.type = "text";
  const button = document.createElement("button");
  button.id = "submit";
  button.setAttribute("data-testid", "submit");
  button.textContent = "Submit";

  const resultsContainer = document.createElement("div");
  resultsContainer.id = "results";
  resultsContainer.setAttribute("data-testid", "results");
  resultsContainer.classList.add("results-container-div");
  button.addEventListener("click", () => {
    if (regularInput.value === "") {
      regularInput.classList.add("invalid-input");
      resultsContainer.textContent = "Please enter your name!";
      return;
    }
    regularInput.classList.remove("invalid-input");
    resultsContainer.textContent = `Hello, ${regularInput.value}!`;
  });

  divContainer.appendChild(label);
  divContainer.appendChild(regularInput);
  divContainer.appendChild(button);

  return { divContainer, resultsContainer };
}
