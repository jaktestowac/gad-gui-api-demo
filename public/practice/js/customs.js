class GadNumericInput extends HTMLElement {
  min = -32768;
  max = 32768;

  constructor(...args) {
    super(...args);
    const shadowRoot = this.attachShadow({ mode: "open" });
    let inputElement = document.createElement("input");
    inputElement.setAttribute("type", "number");
    inputElement.setAttribute("placeholder", this.getAttribute("placeholder"));
    inputElement.setAttribute("min", this.getAttribute("min") || this.min);
    inputElement.setAttribute("max", this.getAttribute("max") || this.max);
    inputElement.value = this.getAttribute("value") || "0";
    inputElement.setAttribute("step", this.getAttribute("step") || "1");
    inputElement.setAttribute("inputmode", "numeric");
    inputElement.setAttribute("pattern", "[0-9]*");
    this.setAttribute("stored-value", 0);

    shadowRoot.appendChild(inputElement);

    inputElement.addEventListener("blur", () => {
      console.log(inputElement.value);
      inputElement.value = inputElement.value.replace(/[^0-9]/g, "");
      const inputValue = inputElement.value;
      const minValue = parseFloat(inputElement.getAttribute("min"));
      const maxValue = parseFloat(inputElement.getAttribute("max"));

      if (inputValue > maxValue) {
        inputElement.value = maxValue;
      } else if (inputValue < minValue) {
        inputElement.value = minValue;
      } else if (inputValue === "") {
        inputElement.value = 0;
      }

      this.setAttribute("stored-value", inputElement.value);
    });

    inputElement.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        console.log("Enter key pressed");
      }
    });
  }

  getValue() {
    return this.shadowRoot.querySelector("input").value;
  }
}

class GadInput extends HTMLElement {
  constructor(...args) {
    super(...args);
    const shadowRoot = this.attachShadow({ mode: "open" });
    let inputElement = document.createElement("input");
    inputElement.setAttribute("type", this.getAttribute("type"));
    inputElement.setAttribute("placeholder", this.getAttribute("placeholder"));

    shadowRoot.appendChild(inputElement);

    inputElement.addEventListener("focus", () => {
      console.log("focus on spot input");
    });

    inputElement.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        console.log("Enter key pressed");
      }
    });
  }

  getValue() {
    return this.shadowRoot.querySelector("input").value;
  }
}

class GadButton extends HTMLElement {
  clicks = 0;

  constructor(...args) {
    super(...args);
    const shadowRoot = this.attachShadow({ mode: "open" });
    let buttonElement = document.createElement("button");
    buttonElement.textContent = this.textContent;

    buttonElement.style.color = "blue";
    buttonElement.style.fontSize = "20px";

    buttonElement.addEventListener("click", () => {
      this.clicks++;
      buttonElement.style.color = "red";
      buttonElement.textContent = `Clicked ${this.clicks}!`;
      this.textContent = `Clicked ${this.clicks}!`;

      const resultsContainer = document.getElementById("results-container");
      if (resultsContainer !== null) {
        resultsContainer.innerHTML = `Button clicked ${this.clicks}!`;
      }
    });
    shadowRoot.appendChild(buttonElement);
  }

  connectedCallback() {
    console.log("Button connected!");
  }
}

class GadFunkyButton extends HTMLElement {
  clicks = 0;

  constructor(...args) {
    super(...args);
    const shadowRoot = this.attachShadow({ mode: "open" });
    let buttonElement = document.createElement("button");
    buttonElement.textContent = this.textContent;

    buttonElement.style.color = "blue";
    buttonElement.style.fontSize = "20px";

    buttonElement.addEventListener("click", () => {
      this.clicks++;
      buttonElement.style.color = getRandomColor();
      buttonElement.style.backgroundColor = getRandomColor();
      buttonElement.textContent = `Clicked ${this.clicks}!`;

      this.textContent = `Clicked ${this.clicks}!`;
    });
    shadowRoot.appendChild(buttonElement);
  }

  connectedCallback() {
    console.log("Button connected!");
  }
}

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
