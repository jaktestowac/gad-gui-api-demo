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

function updateNotifier(number) {
  const dotElement = document.getElementById("unreadMessages");
  const messengerLinkElement = document.getElementById("messengerLink");

  if (dotElement !== null && dotElement !== undefined) {
    if (number > 0) {
      dotElement.innerText = `${number}`;
    } else {
      dotElement.remove();
    }
  } else {
    addDotNotifier(number);
  }

  if (messengerLinkElement !== null && messengerLinkElement !== undefined) {
    if (number > 0) {
      messengerLinkElement.textContent = `Message center (${number})`;
    } else {
      messengerLinkElement.textContent = `Message center`;
    }
  } else {
    addLinkToMessenger(number);
  }
}

function addDotNotifier(number) {
  const element = document.querySelector(`[data-testid="user-dropdown"]`);

  if (element !== null && element !== undefined && number !== 0 && number !== undefined) {
    const dot = document.createElement("div");
    dot.classList.add("unreadmessages");
    dot.id = "unreadMessages";

    dot.innerText = `${number}`;
    element.appendChild(dot);
  }
}

function addLinkToMessenger(number) {
  const dropdownContent = document.getElementById("dropdown-content");

  if (dropdownContent !== null && dropdownContent !== undefined) {
    const newElement = document.createElement("a");
    if (number > 0) {
      newElement.textContent = `Message center (${number})`;
    } else {
      newElement.textContent = `Message center`;
    }
    newElement.href = "/messenger.html";
    newElement.id = "messengerLink";

    if (dropdownContent.children.length < 3) {
      dropdownContent.insertBefore(newElement, dropdownContent.children[1]);
    } else {
      dropdownContent.insertBefore(newElement, dropdownContent.children[3]);
    }
  }
}

checkIfAuthenticated(
  undefined,
  () => {
    issueGetUnreadMessagesRequest()
      .then((r) => {
        return r.json();
      })
      .then((results) => {
        addDotNotifier(results?.allUnreadMessages);
        addLinkToMessenger(results?.allUnreadMessages);
      });
  },
  () => {
    // console.log("Not authenticated");
  }
);
