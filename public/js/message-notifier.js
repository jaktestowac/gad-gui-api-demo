const unreadMessages = "/api/messenger/unread";

async function issueGetUnreadMessagesRequest() {
  const data = fetch(unreadMessages, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

function addNotifier(number) {
  const element = document.querySelector(`[data-testid="user-dropdown"]`);

  if (element !== null && element !== undefined && number !== 0 && number !== undefined) {
    const dot = document.createElement("div");
    dot.classList.add("unreadmessages");

    dot.innerText = `${number}`;
    element.appendChild(dot);
  }

  const dropdownContent = document.getElementById("dropdown-content");

  if (dropdownContent !== null && dropdownContent !== undefined) {
    if (number > 0) {
      const newElement = document.createElement("a");
      newElement.textContent = `Message center (${number})`;
      newElement.href = "/messenger.html";

      dropdownContent.insertBefore(newElement, dropdownContent.children[1]);
    } else {
      const newElement = document.createElement("a");
      newElement.textContent = `Message center (0)`;
      newElement.href = "/messenger.html";

      dropdownContent.insertBefore(newElement, dropdownContent.children[1]);
    }
  }
}

issueGetUnreadMessagesRequest()
  .then((r) => {
    return r.json();
  })
  .then((results) => {
    addNotifier(results?.allUnreadMessages);
  });
