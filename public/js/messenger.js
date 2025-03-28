const urlContacts = "/api/messenger/contacts";
const urlMessages = "/api/messenger/messages";
const urlUnreadMessages = "/api/messenger/unread";

let simpleSuccessBox = "simpleSuccessBox";
let simpleErrorBox = "simpleErrorBox";
let simpleInfoBox = "simpleInfoBox";

const intervalValue = 5000;

let msgCheckInterval = undefined;

const messageInput = document.getElementById("messageInput");
messageInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && event.shiftKey) {
    // allow new lines
  } else if (event.key === "Enter") {
    sendMessage();
  }
});

async function issueGetContactsRequest() {
  const data = fetch(urlContacts, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetUnreadMessagesRequest() {
  const data = fetch(urlUnreadMessages, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetMessagesWithContactRequest(contactId, idFrom) {
  let url = `${urlMessages}?userId=${contactId}`;

  if (idFrom !== undefined && idFrom !== null) {
    url += `&idFrom=${idFrom}`;
  }

  const data = fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueAddContactRequest(email) {
  const data = fetch(urlContacts, {
    method: "PUT",
    body: JSON.stringify({ email: email }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueSendMessageRequest(message, contactId) {
  const data = fetch(urlMessages, {
    method: "POST",
    body: JSON.stringify({ content: message, to: contactId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

function clearFriendRequestInfoBox() {
  const friendRequestInfoBox = document.getElementById("friend-request-info-box");
  friendRequestInfoBox.style.display = "none";
}

function clearContacts() {
  const contacts = document.getElementsByClassName("contact-list")[0];
  contacts.innerHTML = "";
}

function clearMessageView() {
  clearInterval(msgCheckInterval);
  const messageHistory = document.getElementById("messageHistory");
  messageHistory.innerHTML = "";
}

function clearActiveContacts() {
  const contacts = document.getElementsByClassName("contact");
  for (let i = 0; i < contacts.length; i++) {
    contacts[i].classList.remove("active");
  }
}

function disableSendingMessages() {
  const sendContainer = document.getElementById("sendContainer");
  sendContainer.style.display = "none";
}

function enableSendingMessages() {
  const sendContainer = document.getElementById("sendContainer");
  sendContainer.style.display = "block";
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
  document.getElementById(tabName).style.display = "block";

  if (evt != undefined) {
    evt.currentTarget.className += " active";
  } else {
    document.getElementsByClassName("tablinks")[0].className += " active";
  }

  displayDefaultMessage();
  if (tabName === "tab1") {
    // contacts
    clearContacts();
    disableSendingMessages();

    issueGetContactsRequest().then((response) => {
      if (response.status === 200) {
        response.json().then((data) => {
          if (data.length > 0) {
            const noContactElement = document.getElementById("no-contacts");
            noContactElement.style.display = "none";
            data.forEach((contact) => {
              const fullName = `${contact.firstname} ${contact.lastname}`;
              addContact(fullName, contact.id, contact.avatar);
            });
          } else {
            const noContactElement = document.getElementById("no-contacts");
            noContactElement.style.display = "block";
          }
          updateUnreadMessages();
        });
      }
    });
    clearFriendRequestInfoBox();
  }
}

function updateUnreadMessages() {
  const unreadMessagesElements = document.getElementsByClassName("contactunreadmessages");
  while (unreadMessagesElements.length > 0) {
    unreadMessagesElements[0].parentNode.removeChild(unreadMessagesElements[0]);
  }

  return issueGetUnreadMessagesRequest().then((response) => {
    return response.json().then((unreadMessagesData) => {
      Object.keys(unreadMessagesData.unreadMessagesPerUser).forEach((userId) => {
        const contactTab = document.querySelector(`[contact-id="${userId}"]`);
        const unreadMessagesEl = document.createElement("div");
        unreadMessagesEl.classList.add("unreadmessages");
        unreadMessagesEl.classList.add("contactunreadmessages");
        unreadMessagesEl.style.position = "inherit";
        unreadMessagesEl.textContent = unreadMessagesData.unreadMessagesPerUser[userId];
        contactTab.appendChild(unreadMessagesEl);
      });
      updateNotifier(unreadMessagesData?.allUnreadMessages);
      return unreadMessagesData;
    });
  });
}

function sendFriendRequest() {
  const friendRequestInput = document.getElementById("friendRequestInput");
  const friendEmail = friendRequestInput.value;

  // Check if friendEmail is a valid email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(friendEmail)) {
    const friendRequestInfoBox = document.getElementById("friend-request-info-box");
    setBoxMessage(friendRequestInfoBox, `Invalid email: "${friendEmail}"`, simpleErrorBox);
    friendRequestInfoBox.style.display = "block";
    return;
  }

  if (friendEmail.length > 0) {
    issueAddContactRequest(friendEmail).then((response) => {
      const friendRequestInfoBox = document.getElementById("friend-request-info-box");
      if (response.status === 200 || response.status === 201) {
        setBoxMessage(friendRequestInfoBox, `Friend request sent to "${friendEmail}"`, simpleSuccessBox);
        friendRequestInput.value = "";
      } else {
        response.json().then((data) => {
          setBoxMessage(
            friendRequestInfoBox,
            `Failed to send friend request to "${friendEmail}": ${data?.error?.message}`,
            simpleErrorBox
          );
        });
      }
      friendRequestInfoBox.style.display = "block";
    });
  }
}

function displayDefaultMessage() {
  clearInterval(msgCheckInterval);
  const messageHistory = document.getElementById("messageHistory");
  messageHistory.innerHTML = `
        <div class="message info">
            <div class="content">Click contact from contact list to display messages,</div><br>
            <div class="content">or use "Send Friend Requests" to add new friend to chat!</div>
        </div>
    `;
}

function addContact(contactName, contactId, avatarPath) {
  const contacts = document.getElementsByClassName("contact-list")[0];
  const newContact = document.createElement("div");
  newContact.classList.add("contact");
  newContact.setAttribute("data-contact", contactName);
  newContact.setAttribute("contact-id", contactId);
  newContact.setAttribute("onclick", "showMessages('" + contactName + "', '" + contactId + "')");

  const contactImage = document.createElement("img");
  contactImage.src = avatarPath;
  contactImage.style.width = "40px";
  contactImage.style.paddingRight = "10px";
  newContact.appendChild(contactImage);

  const contactNameElement = document.createElement("div");
  contactNameElement.textContent = contactName;
  newContact.appendChild(contactNameElement);

  contacts.appendChild(newContact);
}

function showMessages(contact, contactId) {
  clearInterval(msgCheckInterval);
  clearMessageView();
  clearActiveContacts();
  updateUnreadMessages();

  issueGetMessagesWithContactRequest(contactId).then((response) => {
    response.json().then((data) => {
      displayMessages(data.messages, contact);
    });
  });

  enableSendingMessages();

  const clickedContact = document.querySelector('.contact[data-contact="' + contact + '"]');
  clickedContact.classList.add("active");

  msgCheckInterval = setInterval(() => checkNewMessages(contact), intervalValue);
}

function displayMessages(data, contact) {
  const messageHistory = document.getElementById("messageHistory");
  if (data.length === 0) {
    messageHistory.innerHTML += `
        <div class="message info">
            <div class="content">This is the beginning of your conversation with <strong>${contact}</strong>.</div>
        </div>
    `;
  } else {
    data.forEach((message) => {
      const className = message.from == getId() ? "you" : "";
      const sender = message.from == getId() ? "You" : contact;
      const timestamp = formatDateToLocaleString(message.date);

      const parsedMessage = message.content.replace(/(\r\n|\n|\r)/gm, "<br>");

      const newMessage = `
        <div class="message ${className}" id="${message.id}">
          <div class="sender">${sender}</div>
          <div class="timestamp">${timestamp}</div>
          <div class="content">${parsedMessage}</div>
        </div>
      `;
      messageHistory.innerHTML += newMessage;
    });
    messageHistory.scrollTop = messageHistory.scrollHeight;
  }
}

function checkNewMessages(contact) {
  const activeContact = document.querySelector(".contact.active");
  const contactId = activeContact.getAttribute("contact-id");
  const messages = document.getElementsByClassName("message");

  const lastMessage = messages[messages.length - 1];

  if (lastMessage !== null) {
    updateUnreadMessages().then((unreadMessagesData) => {
      if (unreadMessagesData.unreadMessagesPerUser[contactId] > 0) {
        const lastMessageId = lastMessage.getAttribute("id");
        issueGetMessagesWithContactRequest(contactId, lastMessageId).then((response) => {
          response.json().then((data) => {
            if (data?.messages.length > 0) {
              // eslint-disable-next-line no-console
              console.log("New messages received for " + contact + " (" + data.length + " new messages)");
              displayMessages(data?.messages, contact);
            }
          });
        });
      }
    });
  }
}

function searchContacts() {
  clearMessageView();
  clearActiveContacts();
  disableSendingMessages();

  const messageHistory = document.getElementById("messageHistory");
  messageHistory.innerHTML = "";

  const searchInput = document.getElementById("searchInput").value;
  const contacts = document.getElementsByClassName("contact");

  let foundContacts = 0;
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const contactName = contact.innerText;

    if (contactName.toLowerCase().includes(searchInput.toLowerCase())) {
      contact.style.display = "flex";
      foundContacts += 1;
    } else {
      contact.style.display = "none";
    }
  }

  if (foundContacts === 0) {
    const noContactElement = document.getElementById("no-contacts");
    noContactElement.style.display = "block";
  } else {
    const noContactElement = document.getElementById("no-contacts");
    noContactElement.style.display = "none";
  }
}

function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value.trim();

  // const parsedMessage = message.replace(/(\r\n|\n|\r)/gm, "");
  const parsedMessage = message;

  if (parsedMessage.length > 0 && parsedMessage.length <= 128) {
    const messageHistory = document.getElementById("messageHistory");
    const currentContact = document.querySelector(".contact.active");

    if (currentContact !== undefined) {
      issueSendMessageRequest(parsedMessage, currentContact.getAttribute("contact-id")).then((response) => {
        response.json().then((data) => {
          let warning = "";
          if (response.status !== 201) {
            warning = `<span class="simpleErrorBox">Message not sent</span>`;
          }
          const sender = "You";
          const timestamp = formatDateToLocaleString(getCurrentDate());

          const newMessage = `
              <div class="message you" id="${data.id}">
                <div class="sender">${sender}</div>
                <div class="timestamp">${warning}${timestamp}</div>
                <div class="content">${parsedMessage}</div>
              </div>
            `;
          messageHistory.innerHTML += newMessage;
          messageHistory.scrollTop = messageHistory.scrollHeight;
          messageInput.value = "";
        });
      });
    } else {
      alert("Please select a contact to send a message.");
    }
  }
}

checkIfAuthenticated(
  "messenger-info",
  () => {
    const tabs = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].disabled = false;
      tabs[i].readOnly = false;
    }

    openTab(undefined, "tab1");
  },
  () => {},
  { defaultRedirect: true }
);
