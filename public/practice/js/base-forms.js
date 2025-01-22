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

function addSimpleRegisterForm(elementId, headerText) {
  const regularHost = document.getElementById(elementId);

  const header = document.createElement("h3");
  header.textContent = headerText || "Hello from base form!";
  regularHost.appendChild(header);

  const { divContainer, resultsContainer } = prepareSimpleRegisterForm();

  regularHost.appendChild(divContainer);
  regularHost.appendChild(resultsContainer);
}

function prepareSimpleRegisterForm() {
  const divContainer = document.createElement("div");
  divContainer.classList.add("regular-container-column");

  const table = document.createElement("table");
  const tbody = document.createElement("tbody");

  const usernameRow = document.createElement("tr");
  const usernameLabelCell = document.createElement("td");
  const usernameInputCell = document.createElement("td");
  const usernameLabel = document.createElement("label");
  usernameLabel.textContent = "Username: ";
  const usernameInput = document.createElement("input");
  usernameInput.type = "text";
  usernameInput.id = "username-input";
  usernameInput.maxLength = "10";
  usernameInput.setAttribute("data-testid", "username-input");
  usernameLabelCell.appendChild(usernameLabel);
  usernameInputCell.appendChild(usernameInput);
  usernameRow.appendChild(usernameLabelCell);
  usernameRow.appendChild(usernameInputCell);

  tbody.appendChild(usernameRow);

  const ageRow = document.createElement("tr");
  const ageLabelCell = document.createElement("td");
  const ageInputCell = document.createElement("td");
  const ageLabel = document.createElement("label");
  ageLabel.textContent = "Age: ";
  const ageInput = document.createElement("input");
  ageInput.type = "number";
  ageInput.min = "18";
  ageInput.max = "99";
  ageInput.id = "age-input";
  ageInput.setAttribute("data-testid", "age-input");
  ageInput.value = "18";
  ageLabelCell.appendChild(ageLabel);
  ageInputCell.appendChild(ageInput);
  ageRow.appendChild(ageLabelCell);
  ageRow.appendChild(ageInputCell);

  const passwordRow = document.createElement("tr");
  const passwordLabelCell = document.createElement("td");
  const passwordInputCell = document.createElement("td");
  const passwordLabel = document.createElement("label");
  passwordLabel.textContent = "Password: ";
  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.id = "password-input";
  passwordInput.setAttribute("data-testid", "password-input");
  passwordInput.autocomplete = "new-password";
  passwordInput.maxLength = "20";
  passwordLabelCell.appendChild(passwordLabel);
  passwordInputCell.appendChild(passwordInput);
  passwordRow.appendChild(passwordLabelCell);
  passwordRow.appendChild(passwordInputCell);

  tbody.appendChild(ageRow);
  tbody.appendChild(passwordRow);
  table.appendChild(tbody);

  const button = document.createElement("button");
  button.textContent = "Register";
  button.id = "register-submit";
  button.setAttribute("data-testid", "register-submit");

  const buttonDiv = document.createElement("div");
  buttonDiv.appendChild(button);

  divContainer.appendChild(table);
  divContainer.appendChild(buttonDiv);

  const resultsContainer = document.createElement("div");
  resultsContainer.id = "register-results";
  resultsContainer.classList.add("results-container-div");
  resultsContainer.setAttribute("data-testid", "register-results");

  button.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const age = parseInt(ageInput.value);
    const password = passwordInput.value;

    let isInvalid = false;
    let errorMessage = "";

    if (!username) {
      errorMessage += "Please enter a username.<br/>";
      usernameInput.classList.add("invalid-input");
      isInvalid = true;
    }

    if (!age || age < 18 || age > 99) {
      errorMessage += "Please enter a valid age between 16 and 99.<br/>";
      ageInput.classList.add("invalid-input");
      isInvalid = true;
    }

    if (!password) {
      errorMessage += "Please enter a password.<br/>";
      passwordInput.classList.add("invalid-input");
      isInvalid = true;
    }

    if (password.length < 8) {
      errorMessage += "Password must be at least 8 characters long.<br/>";
      passwordInput.classList.add("invalid-input");
      isInvalid = true;
    }

    if (isInvalid) {
      resultsContainer.innerHTML = errorMessage;
      return;
    }

    usernameInput.classList.remove("invalid-input");
    ageInput.classList.remove("invalid-input");
    passwordInput.classList.remove("invalid-input");
    resultsContainer.textContent = `Registration successful! Username: ${username}, Age: ${age}, Password: ${"*".repeat(
      password.length
    )}`;
  });

  return { divContainer, resultsContainer };
}
