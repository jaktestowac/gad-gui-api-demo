const showResponseOnCreate = (response, item) => {
  if (response.status === 201) {
    showMessage(`${item} was created`, false);
  } else {
    showMessage(`${item} was not created`, true);
  }
};

const showResponseOnDelete = (response, item) => {
  if (response.status === 200) {
    showMessage(`${item} was deleted`, false);
  } else {
    showMessage(`${item} was not deleted`, true);
  }
};

const showResponseOnUpdate = (response, item) => {
  if (response.status === 200) {
    showMessage(`${item} was updated`, false);
  } else {
    showMessage(`${item} was not updated`, true);
  }
};

let alertElement = document.querySelector(".alert");
const showMessage = (message, isError = false) => {
  alertElement.innerHTML = message;
  alertElement.classList.remove("alert-error", "alert-success");
  if (isError) {
    alertElement.classList.add("alert-error");
  } else {
    alertElement.classList.add("alert-success");
  }
  var newMessageElement = alertElement.cloneNode(true);
  alertElement.parentNode.replaceChild(newMessageElement, alertElement);
  alertElement = newMessageElement;
};

module.exports = {
  showResponseOnCreate,
  showResponseOnUpdate,
  showResponseOnDelete,
  showMessage,
};
