const urlFlashposts = "/api/flashposts";
const usersEndpoint = "../../api/users";

let alertElement = document.querySelector(".alert");

const showMessage = (message, isError = false) => {
  alertElement.innerHTML = message;
  alertElement.style.display = "block";
  alertElement.classList.remove("alert-error", "alert-success");
  if (isError) {
    alertElement.classList.add("alert-error");
  } else {
    alertElement.classList.add("alert-success");
  }
  let newMessageElement = alertElement.cloneNode(true);
  alertElement.parentNode.replaceChild(newMessageElement, alertElement);
  alertElement = newMessageElement;

  setTimeout(() => {
    alertElement.style.display = "none";
  }, 3000);
};

async function issueGetFlashpostsRequest() {
  const data = fetch(urlFlashposts, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetUsers(userIds) {
  const userQueryId = `${userIds.join("&id=")}`;
  const userUrlQuery = `${usersEndpoint}?id=${userQueryId}`;
  const data = fetch(userUrlQuery, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

issueGetFlashpostsRequest().then((response) => {
  if (response.status === 200) {
    response.json().then((data) => {
      const userIds = new Set(data.map((element) => element.user_id));
      displayFlashPosts(data);
      issueGetUsers([...userIds]).then((response) => {
        if (response.status === 200) {
          response.json().then((data) => {
            const users = data;
            const flashpostAuthors = document.querySelectorAll(".flashpost-author");
            flashpostAuthors.forEach((element) => {
              const userId = element.getAttribute("user-id");
              const user = users.find((user) => user.id === parseInt(userId));
              element.textContent = `${user.firstname} ${user.lastname}`;
            });
          });
        }
      });
    });
  }
});

function displayFlashPosts(data) {
  data.forEach((element) => {
    const flashpostContainer = document.createElement("div");
    flashpostContainer.classList.add("flashpost-container");

    const flashpostContent = document.createElement("div");
    flashpostContent.classList.add("flashpost-content");

    const flashpostMessageElement = document.createElement("div");
    flashpostMessageElement.classList.add("flashpost-message");
    flashpostMessageElement.innerHTML = element.body;

    const flashpostAuthor = document.createElement("div");
    flashpostAuthor.classList.add("flashpost-author");
    flashpostAuthor.textContent = "{{ user }}";
    flashpostAuthor.setAttribute("user-id", element.user_id);

    const flashpostDateAndTools = document.createElement("div");
    flashpostDateAndTools.classList.add("flashpost-date-and-tools");

    const flashpostDate = document.createElement("div");
    flashpostDate.classList.add("flashpost-date");

    const flashpostTools = document.createElement("div");
    flashpostTools.classList.add("flashpost-tools");

    const hoursMinutes = howManyHoursAndMinutesAndSecondsInPast(element.date);

    const formattedDate = formatDateToLocaleString(element.date);
    if (hoursMinutes.hours >= 24) {
      flashpostDate.textContent = formattedDate;
    } else {
      flashpostDate.textContent = `${hoursMinutes.hours}h ${hoursMinutes.minutes}m ago`;
      flashpostDate.setAttribute("data-tooltip", formattedDate);
      if (getId() == element.user_id) {
        const deleteButton = document.createElement("i");
        deleteButton.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
        deleteButton.classList.add("flashpost-tool");
        deleteButton.onclick = () => {
          flashpostOnDelete(flashpostContainer, element);
        };

        const editButton = document.createElement("i");
        editButton.innerHTML = `<i class="fa-solid fa-pen-to-square"></i>`;
        editButton.classList.add("flashpost-tool");
        editButton.onclick = () => {
          flashpostOnEdit(element, flashpostMessageElement);
        };
        flashpostTools.appendChild(deleteButton);
        flashpostTools.appendChild(editButton);
      }
    }

    const flashpostAuthorAndDate = document.createElement("div");
    flashpostAuthorAndDate.classList.add("flashpost-author-and-date");

    if (element.settings !== undefined && element.settings.color !== undefined) {
      flashpostContainer.style.backgroundColor = element.settings.color;
      const contrastRatio = getContrastRatio(element.settings.color);
      flashpostContainer.style.color = contrastRatio > 4.5 ? "black" : "white";

      if (contrastRatio > 4.5) {
        flashpostAuthorAndDate.classList.add("flashpost-author-and-date-dark");
      } else {
        flashpostAuthorAndDate.classList.add("flashpost-author-and-date-light");
      }
    }

    flashpostDateAndTools.appendChild(flashpostDate);
    flashpostDateAndTools.appendChild(flashpostTools);

    flashpostAuthorAndDate.appendChild(flashpostAuthor);
    flashpostAuthorAndDate.appendChild(flashpostDateAndTools);

    flashpostContent.appendChild(flashpostAuthorAndDate);

    flashpostContent.appendChild(flashpostMessageElement);

    flashpostContainer.appendChild(flashpostContent);
    document.querySelector(".flashpost-container-space").prepend(flashpostContainer);
  });
}

function flashpostOnEdit(element, flashpostMessageElement) {
  const container = document.querySelector(".add-new-flashpost-panel");
  container.querySelector(".flashpost-textarea").value = element.body;
  container.classList.add("active");

  const overlay = document.querySelector(".overlay");
  overlay.classList.add("active");

  container.querySelector(".save").onclick = () => {
    const updatedFlashpost = container.querySelector(".flashpost-textarea").value;
    fetch(`${urlFlashposts}/${element.id}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: getBearerToken(),
      },
      body: JSON.stringify({ body: updatedFlashpost }),
    }).then((response) => {
      if (response.status === 200) {
        flashpostMessageElement.innerHTML = updatedFlashpost;
        container.classList.remove("active");
        overlay.classList.remove("active");
      } else {
        const additionalMsg = response.body?.error?.message ? response.body.error.message : "";
        showMessage(`You can't modify this flashpost. ${additionalMsg}`, true);
      }
    });
  };
}

function flashpostOnDelete(flashpostContainer, element) {
  fetch(`${urlFlashposts}/${element.id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  }).then((response) => {
    if (response.status === 200) {
      flashpostContainer.remove();
    } else {
      const additionalMsg = response.body?.error?.message ? response.body.error.message : "";
      showMessage(`You can't delete this flashpost. ${additionalMsg}`, true);
    }
  });
}

document.querySelector(".create-flashpost-btn").onclick = () => {
  window.scrollTo(0, 0);
  const container = document.querySelector(".add-new-flashpost-panel");
  container.querySelector(".flashpost-textarea").value = "";
  container.classList.add("active");

  const overlay = document.querySelector(".overlay");
  overlay.classList.add("active");
};

document.querySelector(".cancel").onclick = () => {
  const container = document.querySelector(".add-new-flashpost-panel");
  container.classList.remove("active");

  const overlay = document.querySelector(".overlay");
  overlay.classList.remove("active");
};

const textarea = document.getElementById("flashpost-text");
const counter = document.getElementById("character-counter");

textarea.addEventListener("input", () => {
  const remainingChars = 128 - textarea.value.length;
  counter.textContent = `${remainingChars} characters left`;
});
