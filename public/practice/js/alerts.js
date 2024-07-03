let clickCounter1 = 0;
let clickCounter2 = 0;

function displaySimpleAlert(text) {
  const alertDiv = document.createElement("div");
  alertDiv.classList.add("simple-alert-on-left-1");
  alertDiv.classList.add("alert-gad-emoji");
  alertDiv.textContent = text;
  alertDiv.style.width = "250px";
  alertDiv.setAttribute("id", "simple-alert");
  alertDiv.setAttribute("data-testid", "dti-simple-alert");
  document.body.appendChild(alertDiv);

  document.querySelector("#alerts-placeholder").appendChild(alertDiv);

  setTimeout(function () {
    alertDiv.style.display = "none";
  }, 3000);
}

function displaySimpleAlertWithCustomMessage(text, color) {
  const alertDiv = document.createElement("div");
  alertDiv.classList.add("simple-alert-on-left-1");
  alertDiv.textContent = text;
  alertDiv.setAttribute("id", "simple-alert-with-custom-message");
  alertDiv.setAttribute("data-testid", "dti-simple-alert-with-custom-message");

  alertDiv.style.backgroundColor = color;

  document.body.appendChild(alertDiv);

  document.querySelector("#alerts-placeholder").appendChild(alertDiv);

  setTimeout(function () {
    alertDiv.remove();
  }, 3000);

  alertDiv.onclick = function () {
    displaySimpleAlertWithRandomFlavour();
  };
}

function displaySimpleAlertWithRandomFlavour() {
  const alertDiv = document.createElement("div");
  alertDiv.classList.add("simple-alert-on-left-1");
  alertDiv.textContent = getRandomQuote() + " " + getRandomEmoji();
  alertDiv.setAttribute("id", "simple-alert-with-random-flavour");
  alertDiv.setAttribute("data-testid", "dti-simple-alert-with-random-flavour");

  alertDiv.style.backgroundColor = getRandomColor();

  document.body.appendChild(alertDiv);

  document.querySelector("#alerts-placeholder").appendChild(alertDiv);

  setTimeout(function () {
    alertDiv.remove();
  }, 3000);
}

function displaySimpleAlertWithCounter() {
  clickCounter1++;
  const alertDiv = document.createElement("div");
  alertDiv.classList.add("simple-alert-on-left-1");
  alertDiv.classList.add("alert-counter-emoji");
  alertDiv.textContent = `Button clicked ${clickCounter1} times`;
  alertDiv.setAttribute("id", `alert-counter-${clickCounter1}`);
  alertDiv.setAttribute("data-testid", "dti-simple-alert-with-counter");

  alertDiv.style.backgroundColor = "black";

  document.body.appendChild(alertDiv);

  document.querySelector("#alerts-placeholder").appendChild(alertDiv);

  setTimeout(function () {
    alertDiv.remove();
  }, 3000);
}

function displaySimpleAlertWithCounterAndRandomFadeOut() {
  clickCounter2++;
  const alertDiv = document.createElement("div");
  alertDiv.classList.add("simple-alert-on-left-1");
  alertDiv.classList.add("alert-other-counter-emoji");
  alertDiv.textContent = `${clickCounter2} click(s)!`;
  alertDiv.setAttribute("id", `alert-2-${clickCounter2}`);
  alertDiv.setAttribute("data-testid", "dti-simple-alert-with-counter-and-random-fade-out");

  alertDiv.style.backgroundColor = getRandomColor();

  document.body.appendChild(alertDiv);

  document.querySelector("#alerts-placeholder").appendChild(alertDiv);

  setTimeout(function () {
    alertDiv.remove();
  }, getRandomValue(1000, 5000));
}

function displayPopupModal() {
  const modal = document.createElement("div");
  modal.classList.add("modal");

  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");
  modalContent.style.position = "absolute";
  modalContent.style.top = "50%";
  modalContent.style.left = "50%";
  modalContent.style.transform = "translate(-50%, -50%)";
  modalContent.style.backgroundColor = "white";
  modalContent.style.borderRadius = "8px";

  const modalHeader = document.createElement("div");
  modalHeader.classList.add("modal-header");
  modalHeader.textContent = "Modal Header";

  const modalBody = document.createElement("div");
  modalBody.classList.add("modal-body");
  modalBody.style.width = "300px";
  modalBody.style.height = "100px";
  modalBody.style.padding = "20px";
  modalBody.textContent = "Try different actions here!";

  const modalFooter = document.createElement("div");
  modalFooter.classList.add("modal-footer");

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.onclick = function () {
    displaySimpleAlertWithCustomMessage("Modal was cancelled by user! 🚫", "red");
    document.querySelector("#results-container").textContent = "";
    modal.remove();
  };

  const acceptButton = document.createElement("button");
  acceptButton.textContent = "Accept";
  acceptButton.onclick = function () {
    displaySimpleAlertWithCustomMessage("Modal was accepted by user! 🎉", "green");
    document.querySelector("#results-container").innerHTML = "<strong>Modal was accepted by user! 🎉</strong>";
    modal.remove();
  };

  modalFooter.appendChild(acceptButton);
  modalFooter.appendChild(cancelButton);

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalFooter);

  modal.appendChild(modalContent);

  document.body.appendChild(modal);
}
