const urlFlashposts = "/api/flashposts";
const usersEndpoint = "../../api/users";
const defaultColor = "#dddddd";

// let alertElement = document.querySelector(".alert");

const showMessage = (message, type = 0) => {
  displaySimpleAlert(message, type);
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

async function issuePostFlashpostsRequest(data) {
  const response = fetch(urlFlashposts, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(data),
  });
  return response;
}

async function issuePatchFlashpostsRequest(flashpostId, data) {
  const response = fetch(`${urlFlashposts}/${flashpostId}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(data),
  });
  return response;
}

async function issueGetFlashpostsAfterDateRequest(date) {
  const data = await fetch(`${urlFlashposts}?afterDate=${date}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetFlashpostsForUserRequest(userId) {
  const data = fetch(`${urlFlashposts}?user_id=${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueDeleteFlashpostRequest(flashpostId) {
  const data = fetch(`${urlFlashposts}/${flashpostId}`, {
    method: "DELETE",
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

async function getAndDisplayFlashposts(issueGetFlashpostsRequest) {
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
                if (user.lastname?.includes("***")) {
                  element.innerHTML = `<span><a href="user.html?id=${userId}" style="color: inherit;" >${user.firstname}</a></span>`;
                } else {
                  element.innerHTML = `<span><a href="user.html?id=${userId}" style="color: inherit;" >${user.firstname} ${user.lastname}</a></span>`;
                }
              });
            });
          }
        });
      });
    }
  });
}

function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  if (evt !== undefined) {
    evt.currentTarget.className += " active";
  } else {
    document.getElementsByClassName("tablinks")[0].className += " active";
  }

  const param = evt?.currentTarget?.getAttribute("param");

  if (param === "24h") {
    getAndDisplayFlashposts(() =>
      issueGetFlashpostsAfterDateRequest(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    );
  } else if (param === "1h") {
    getAndDisplayFlashposts(() =>
      issueGetFlashpostsAfterDateRequest(new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString())
    );
  } else if (param === "myPosts") {
    getAndDisplayFlashposts(() => issueGetFlashpostsForUserRequest(getId()));
  } else {
    getAndDisplayFlashposts(issueGetFlashpostsRequest);
  }
}

function formatToHowLongAgo(hours, minutes, seconds) {
  let formattedString = "";
  if (hours > 0) {
    formattedString += `${hours}h `;
  }
  if (minutes > 0) {
    formattedString += `${minutes}m `;
  }
  if (seconds > 0 && hours === 0 && minutes === 0) {
    formattedString += `${seconds}s `;
  }
  return formattedString;
}

function displayFlashPosts(data) {
  const flashpostContainerSpace = document.querySelector(".flashpost-container-space");
  while (flashpostContainerSpace.firstChild) {
    flashpostContainerSpace.removeChild(flashpostContainerSpace.firstChild);
  }

  if (data.length === 0) {
    const flashpostContainer = document.createElement("div");
    flashpostContainer.classList.add("flashpost-container");

    const flashpostContent = document.createElement("div");
    flashpostContent.classList.add("flashpost-content");

    const flashpostMessageElement = document.createElement("div");
    flashpostMessageElement.classList.add("flashpost-message");
    flashpostMessageElement.textContent = "No flashposts found";

    flashpostContent.appendChild(flashpostMessageElement);
    flashpostContainer.appendChild(flashpostContent);
    document.querySelector(".flashpost-container-space").prepend(flashpostContainer);
    return;
  }

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
    flashpostAuthor.innerHTML = `<span><a href="user.html?id=${element.user_id}" style="color: inherit;">{{ user }}</a></span>`;
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
      flashpostDate.textContent = formatToHowLongAgo(hoursMinutes.hours, hoursMinutes.minutes, hoursMinutes.seconds);
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

    const flashpostVisibility = document.createElement("div");
    flashpostVisibility.classList.add("flashpost-visibility");
    if (element.is_public) {
      flashpostVisibility.innerHTML = `<i class="fa-solid fa-globe"></i>`;
      flashpostVisibility.setAttribute("data-tooltip", "Public");
    } else {
      flashpostVisibility.innerHTML = `<i class="fa-solid fa-lock"></i>`;
      flashpostVisibility.setAttribute("data-tooltip", "Private");
    }

    flashpostDateAndTools.appendChild(flashpostDate);
    flashpostDateAndTools.appendChild(flashpostTools);

    flashpostContent.appendChild(flashpostVisibility);

    flashpostAuthorAndDate.appendChild(flashpostAuthor);
    flashpostAuthorAndDate.appendChild(flashpostDateAndTools);

    flashpostContent.appendChild(flashpostAuthorAndDate);

    flashpostContent.appendChild(flashpostMessageElement);

    flashpostContainer.appendChild(flashpostContent);
    document.querySelector(".flashpost-container-space").prepend(flashpostContainer);
  });
}

function formatFlashpostBody() {
  const container = document.querySelector(".add-new-flashpost-panel");
  const flashpostText = container.querySelector(".flashpost-textarea").value;
  const body = {
    body: flashpostText,
    settings: {
      color: container.querySelector("#background-color-picker")?.value || defaultColor,
    },
    is_public: container.querySelector("#public-checkbox")?.checked || false,
  };
  return body;
}

function flashpostOnEdit(element, flashpostMessageElement) {
  openCreateOrEditFlashpostPanel(element);

  const container = document.querySelector(".add-new-flashpost-panel");

  container.querySelector(".update").onclick = () => {
    const updatedFlashpost = container.querySelector(".flashpost-textarea").value;
    const body = formatFlashpostBody();

    issuePatchFlashpostsRequest(element.id, body).then((response) => {
      if (response.status === 200) {
        flashpostMessageElement.innerHTML = updatedFlashpost;
        container.classList.remove("active");
        const overlay = document.querySelector(".overlay");
        overlay.classList.remove("active");
        getAndDisplayFlashposts(issueGetFlashpostsRequest);
      } else {
        const additionalMsg = response.body?.error?.message ? response.body.error.message : "";
        showMessage(`You can't modify this flashpost. ${additionalMsg}`, 2);
      }
    });
  };
}

function flashpostOnDelete(flashpostContainer, element) {
  issueDeleteFlashpostRequest(element.id).then((response) => {
    if (response.status === 200) {
      flashpostContainer.remove();
      showMessage("Flashpost deleted successfully");
    } else {
      const additionalMsg = response.body?.error?.message ? response.body.error.message : "";
      showMessage(`You can't delete this flashpost. ${additionalMsg}`, 2);
    }
  });
}

function openCreateOrEditFlashpostPanel(element) {
  const container = document.querySelector(".add-new-flashpost-panel");
  container.querySelector("#background-color-picker").value = defaultColor;
  container.querySelector("#public-checkbox").checked = false;

  if (element === undefined) {
    container.querySelector(".flashpost-textarea").value = "";
  } else {
    container.querySelector(".flashpost-textarea").value = element.body;
    if (element.settings !== undefined && element.settings.color !== undefined) {
      container.querySelector("#background-color-picker").value = element.settings.color;
    }
    if (element.settings !== undefined && element.settings.public !== undefined) {
      container.querySelector("#public-checkbox").checked = element.settings.public;
    }
  }
  container.classList.add("active");

  if (element === undefined) {
    const createBtn = document.querySelector(".create");
    createBtn.style.display = "inline-block";
    const updateBtn = document.querySelector(".update");
    updateBtn.style.display = "none";
  } else {
    const createBtn = document.querySelector(".create");
    createBtn.style.display = "none";
    const updateBtn = document.querySelector(".update");
    updateBtn.style.display = "inline-block";
  }

  const overlay = document.querySelector(".overlay");
  overlay.classList.add("active");
}

document.querySelector(".create-flashpost-btn").onclick = () => {
  window.scrollTo(0, 0);
  openCreateOrEditFlashpostPanel();
};

document.querySelector(".cancel").onclick = () => {
  const container = document.querySelector(".add-new-flashpost-panel");
  container.classList.remove("active");

  const overlay = document.querySelector(".overlay");
  overlay.classList.remove("active");
};

document.querySelector(".create").onclick = () => {
  const flashpost = document.querySelector(".flashpost-textarea").value;
  if (flashpost.length === 0) {
    showMessage("Flashpost can't be empty", 2);
    return;
  }
  const data = formatFlashpostBody();
  issuePostFlashpostsRequest(data).then((response) => {
    if (response.status === 201) {
      showMessage("Flashpost created successfully");
      getAndDisplayFlashposts(issueGetFlashpostsRequest);

      const container = document.querySelector(".add-new-flashpost-panel");
      container.classList.remove("active");

      const overlay = document.querySelector(".overlay");
      overlay.classList.remove("active");

      openTab(undefined, "tab1");
      // eslint-disable-next-line no-console
      console.log("12:50, press Return.");
    } else {
      const additionalMsg = response.body?.error?.message ? response.body.error.message : "";
      showMessage(`You can't create this flashpost. ${additionalMsg}`, 2);
    }
  });
};

const textarea = document.getElementById("flashpost-text");
const counter = document.getElementById("character-counter");

textarea.addEventListener("input", () => {
  const remainingChars = 128 - textarea.value.length;
  counter.textContent = `${remainingChars} characters left`;
});

function disableTobBarNavigationButton() {
  const btnArticles = document.querySelector("#btnFlashposts");
  btnArticles.disabled = true;
  btnArticles.classList.remove("button-disabled");
  btnArticles.classList.add("button-primary");
}

getAndDisplayFlashposts(issueGetFlashpostsRequest);
disableTobBarNavigationButton();
// checkIfAuthenticated(
//   "authentication-info",
//   () => {
//     getAndDisplayFlashposts(issueGetFlashpostsRequest);
//   },
//   () => {
//     document.querySelector("#flashpost-container").innerHTML = "";
//   }
// );
