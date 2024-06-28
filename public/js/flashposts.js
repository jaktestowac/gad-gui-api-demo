const urlFlashposts = "/api/flashposts";
const usersEndpoint = "../../api/users";

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

    const flashpostMessage = document.createElement("div");
    flashpostMessage.classList.add("flashpost-message");
    flashpostMessage.innerHTML = element.body;

    const flashpostAuthor = document.createElement("div");
    flashpostAuthor.classList.add("flashpost-author");
    flashpostAuthor.textContent = "{{ user }}";
    flashpostAuthor.setAttribute("user-id", element.user_id);

    const flashpostDate = document.createElement("div");
    flashpostDate.classList.add("flashpost-date");

    const hoursMinutes = howManyHoursAndMinutesAndSecondsInPast(element.date);

    const formattedDate = formatDateToLocaleString(element.date);
    if (hoursMinutes.hours > 24) {
      flashpostDate.textContent = formattedDate;
    } else {
      flashpostDate.textContent = `${hoursMinutes.hours}h ${hoursMinutes.minutes}m ago`;
      flashpostDate.setAttribute("data-tooltip", formattedDate);
    }

    const flashpostAuthorAndDate = document.createElement("div");
    flashpostAuthorAndDate.classList.add("flashpost-author-and-date");

    flashpostAuthorAndDate.appendChild(flashpostAuthor);
    flashpostAuthorAndDate.appendChild(flashpostDate);

    flashpostContent.appendChild(flashpostAuthorAndDate);

    flashpostContent.appendChild(flashpostMessage);

    flashpostContainer.appendChild(flashpostContent);
    document.querySelector(".flashpost-container-space").prepend(flashpostContainer);
  });
}

document.querySelector(".create-flashpost-btn").onclick = () => {
  window.scrollTo(0, 0);
  const container = document.querySelector(".add-new-popup-panel");
  container.querySelector(".flashpost-textarea").value = "";
  container.classList.add("active");

  const overlay = document.querySelector(".overlay");
  overlay.classList.add("active");
};

document.querySelector(".cancel").onclick = () => {
  const container = document.querySelector(".add-new-popup-panel");
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
