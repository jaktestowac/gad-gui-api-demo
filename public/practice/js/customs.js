class GadInput extends HTMLInputElement {
  constructor(...args) {
    super(...args);
    const shadowRoot = this.attachShadow({ mode: "open" });
    let inputElement = document.createElement("input");
    inputElement.setAttribute("type", this.getAttribute("type"));
    shadowRoot.appendChild(inputElement);
  }
}

class GadButton extends HTMLButtonElement {
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
    });
    shadowRoot.appendChild(buttonElement);
  }

  connectedCallback() {
    console.log("Button connected!");
  }
}
