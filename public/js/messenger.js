let simpleSuccessBox = "simpleSuccessBox";
let simpleErrorBox = "simpleErrorBox";
let simpleInfoBox = "simpleInfoBox";

if (!isAuthenticated()) {
  const dashboardInfo = document.getElementById("messenger-info");
  setBoxMessage(
    dashboardInfo,
    `You are not authenticated<br/>
                Please <a href="/login" class="btn btn-primary">login</a> or <a href="/register.html" class="btn btn-primary">register</a>`,
    simpleInfoBox
  );
} else {
  const tabs = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].disabled = false;
    tabs[i].readOnly = false;
  }

  openTab(event, "tab1");
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
}

function sendFriendRequest() {
  const friendRequestInput = document.getElementById("friendRequestInput");
  const friendEmail = friendRequestInput.value;

  if (friendEmail.length > 0) {
    // TODO: check email and add new contact
    addContact(friendEmail);
    friendRequestInput.value = "";
  }
}

function addContact(contactName) {
  const contacts = document.getElementsByClassName("contacts")[0];
  const newContact = document.createElement("div");
  newContact.classList.add("contact");
  newContact.setAttribute("data-contact", contactName);
  newContact.setAttribute("onclick", "showMessages('" + contactName + "')");
  newContact.textContent = contactName;
  contacts.appendChild(newContact);
}

function showMessages(contact) {
  const messageHistory = document.getElementById("messageHistory");
  messageHistory.innerHTML = "";

  const contacts = document.getElementsByClassName("contact");
  for (let i = 0; i < contacts.length; i++) {
    contacts[i].classList.remove("active");
  }

  // TODO: check contact and get messages from server
  if (contact === "John Doe") {
    messageHistory.innerHTML += `
                    <div class="message">
                        <div class="sender">John Doe</div>
                        <div class="timestamp">10:00 AM</div>
                        <div class="content">Hello, how are you?</div>
                    </div>
                    <div class="message">
                        <div class="sender">John Doe</div>
                        <div class="timestamp">10:10 AM</div>
                        <div class="content">I'm doing great!</div>
                    </div>
                    <div class="message">
                        <div class="sender">John Doe</div>
                        <div class="timestamp">10:12 AM</div>
                        <div class="content">I'm doing great!</div>
                    </div>
                    <div class="message">
                        <div class="sender">John Doe</div>
                        <div class="timestamp">10:13 AM</div>
                        <div class="content">I'm doing great!</div>
                    </div>
                    <div class="message">
                        <div class="sender">John Doe</div>
                        <div class="timestamp">10:14 AM</div>
                        <div class="content">I'm doing great!</div>
                    </div>
                    <div class="message">
                        <div class="sender">John Doe</div>
                        <div class="timestamp">10:15 AM</div>
                        <div class="content">I'm doing great!</div>
                    </div>
                `;
  } else if (contact === "Jane Smith") {
    messageHistory.innerHTML += `
                    <div class="message">
                        <div class="sender">Jane Smith</div>
                        <div class="timestamp">10:05 AM</div>
                        <div class="content">I'm good, thanks! How about you?</div>
                    </div>
                `;
  } else if (contact === "Alice Johnson") {
    messageHistory.innerHTML += `
                    <div class="message">
                        <div class="sender">Alice Johnson</div>
                        <div class="timestamp">11:00 AM</div>
                        <div class="content">Hey there!</div>
                    </div>
                    <div class="message">
                        <div class="sender">Alice Johnson</div>
                        <div class="timestamp">11:05 AM</div>
                        <div class="content">Long time no see!</div>
                    </div>
                `;
  }
  messageHistory.scrollTop = messageHistory.scrollHeight;

  const sendContainer = document.getElementById("sendContainer");
  sendContainer.style.display = "block";
  const clickedContact = document.querySelector('.contact[data-contact="' + contact + '"]');
  clickedContact.classList.add("active");
}

function searchContacts() {
  const messageHistory = document.getElementById("messageHistory");
  messageHistory.innerHTML = "";

  const searchInput = document.getElementById("searchInput").value;
  const contacts = document.getElementsByClassName("contact");

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const contactName = contact.innerText;

    if (contactName.toLowerCase().includes(searchInput.toLowerCase())) {
      contact.style.display = "block";
    } else {
      contact.style.display = "none";
    }
  }
}

function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value;

  if (message.length > 0 && message.length <= 128) {
    const messageHistory = document.getElementById("messageHistory");
    const currentContact = document.querySelector(".contact.active");

    if (currentContact !== undefined) {
      const sender = "User";
      const timestamp = new Date().toLocaleTimeString();

      const newMessage = `
                        <div class="message">
                            <div class="sender">${sender}</div>
                            <div class="timestamp">${timestamp}</div>
                            <div class="content">${message}</div>
                        </div>
                    `;

      messageHistory.innerHTML += newMessage;
      messageHistory.scrollTop = messageHistory.scrollHeight;
      messageInput.value = "";
    } else {
      alert("Please select a contact to send a message.");
    }
  }
}
