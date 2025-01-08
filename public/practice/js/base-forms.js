function addSimpleForm(elementId, headerText) {
  const regularHost = document.getElementById(elementId);

  const header = document.createElement("h3");
  header.textContent = headerText || "Hello from base form!";
  regularHost.appendChild(header);

  const { divContainer, resultsContainer } = prepareSimpleForm();

  regularHost.appendChild(divContainer);
  regularHost.appendChild(resultsContainer);
}

function prepareSimpleForm() {
  const divContainer = document.createElement("div");
  divContainer.classList.add("regular-container");

  const label = document.createElement("label");
  label.textContent = "Enter your name: ";
  const regularInput = document.createElement("input");
  regularInput.id = "name-input";
  regularInput.setAttribute("data-testid", "name-input");
  regularInput.classList.add("txt-input");
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

function addSimpleElements(elementId, headerText) {
  const regularHost = document.getElementById(elementId);

  const header = document.createElement("h3");
  header.textContent = headerText || "Hello from base form!";
  regularHost.appendChild(header);

  const { divContainer, resultsContainer } = prepareSimpleElements();

  regularHost.appendChild(divContainer);
  regularHost.appendChild(resultsContainer);
}

function prepareSimpleElements() {
  const divContainer = document.createElement("div");
  divContainer.classList.add("regular-container-column");

  const select = document.createElement("select");
  select.id = "simple-select";
  const options = ["Option 1", "Option 2", "Option 3"];
  options.forEach((optionText) => {
    const option = document.createElement("option");
    option.value = optionText.toLowerCase().replace(" ", "-");
    option.textContent = optionText;
    select.appendChild(option);
  });

  const checkboxContainer = document.createElement("div");
  checkboxContainer.classList.add("regular-container-column");
  ["Checkbox 1", "Checkbox 2", "Checkbox 3"].forEach((checkboxText) => {
    const divContainer = document.createElement("div");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = checkboxText.toLowerCase().replace(" ", "-");
    const label = document.createElement("label");
    label.textContent = checkboxText;
    label.htmlFor = checkbox.id;

    divContainer.appendChild(label);
    divContainer.appendChild(checkbox);
    checkboxContainer.appendChild(divContainer);
  });

  const range = document.createElement("input");
  range.type = "range";
  range.min = "0";
  range.max = "100";
  range.value = "50";
  range.id = "simple-range";

  const rangeLabel = document.createElement("label");
  rangeLabel.style.paddingLeft = "10px";
  rangeLabel.textContent = range.value;
  range.addEventListener("input", () => {
    const value = range.value;
    rangeLabel.textContent = value.padStart(3, "0");
  });

  const rangeDiv = document.createElement("div");
  rangeDiv.appendChild(range);
  rangeDiv.appendChild(rangeLabel);

  const button = document.createElement("button");
  button.textContent = "Submit";
  button.id = "simple-submit";

  const selectDiv = document.createElement("div");
  selectDiv.appendChild(select);

  const checkboxContainerDiv = document.createElement("div");
  checkboxContainerDiv.appendChild(checkboxContainer);

  const buttonDiv = document.createElement("div");
  buttonDiv.appendChild(button);

  divContainer.appendChild(selectDiv);
  divContainer.appendChild(checkboxContainerDiv);
  divContainer.appendChild(rangeDiv);
  divContainer.appendChild(buttonDiv);

  const resultsContainer = document.createElement("div");
  resultsContainer.id = "results";
  resultsContainer.setAttribute("data-testid", "new-results");
  resultsContainer.classList.add("results-container-div");

  button.addEventListener("click", () => {
    const selectedOption = select.value;
    const checkedBoxes = Array.from(checkboxContainer.querySelectorAll('input[type="checkbox"]'))
      .filter((cb) => cb.checked)
      .map((cb) => cb.id);
    const rangeValue = range.value;

    const formattedResult = `
      Selected option: ${selectedOption}
      Checked boxes: ${checkedBoxes.length ? checkedBoxes.join(", ") : "none"}
      Range value: ${rangeValue}
    `;

    resultsContainer.innerHTML = formattedResult.split("\n").join("<br>");
  });

  return { divContainer, resultsContainer };
}
