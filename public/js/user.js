const usersEndpoint = "../../api/users";
let alertElement = document.querySelector(".alert");
let usersData;

async function issueGetRequest(user_id) {
  const userUrl = `${usersEndpoint}/${user_id}`;
  usersData = await Promise.all([userUrl].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json())));

  const wasDisplayed = displayUserData(usersData[0]);
  if (wasDisplayed) {
    attachEventHandlers(user_id);
  }
}

const showResponseOnDelete = (response) => {
  if (response.status === 200) {
    showMessage("User was deleted", false);
  } else {
    showMessage("User was not deleted", true);
  }
};

const showResponseOnUpdate = (response) => {
  if (response.status === 200) {
    showMessage("User was updated. Please loggin again", false);

    // if(getId() !== "admin" ) {
    //   setTimeout(function() {
    //     window.location.href = "/logout";
    //   }, 1000);
    // }
  } else {
    showMessage("User was not updated", true);
  }
};

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

const issuePutRequest = (id, data, responseHandler) => {
  // update data on the server:
  const url = usersEndpoint + "/" + id;
  fetch(url, {
    method: "put",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      showResponseOnUpdate(response);
      return response.json();
    })
    .then(responseHandler);
};

const issuePatchRequest = (id, data, responseHandler) => {
  // update data on the server:
  const url = usersEndpoint + "/" + id;
  fetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      showResponseOnUpdate(response);
      return response.json();
    })
    .then(responseHandler);
};

const issueDeleteRequest = (id, responseHandler) => {
  // delete data on the server:
  const url = usersEndpoint + "/" + id;
  fetch(url, { method: "delete", headers: formatHeaders() }).then(responseHandler);
};

const issuePostRequest = (data, responseHandler) => {
  // create data on the server:
  fetch(usersEndpoint, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(data),
  }).then(responseHandler);
};

const handleUpdate = (ev) => {
  const passwordInput = document.querySelector("#password");
  if (passwordInput && passwordInput.value === "") {
    passwordInput.style.borderColor = "red";
    passwordInput.insertAdjacentHTML("afterend", `<span style="color:red;">This field is required</span>`);
  } else {
    const id = ev.target.getAttribute("data-id");
    const container = ev.target.parentElement.parentElement;
    let data = {
      firstname: container.querySelector("#firstname").value,
      lastname: container.querySelector("#lastname").value,
      email: container.querySelector("#email").value,
      avatar: container.querySelector("#avatar").value,
    };
    if (passwordInput) data.password = container.querySelector("#password").value;
    const callback = (item) => {
      if (item["error"] === undefined) {
        container.innerHTML = getItemHTML(item);
      }
      attachEventHandlers(id);
    };
    issuePutRequest(id, data, callback);
    removeConfirmExitPage();
  }
};

const handlePartialUpdate = (ev) => {
  const id = ev.target.getAttribute("data-id");
  const container = ev.target.parentElement.parentElement;
  const data = {
    email: container.querySelector("#email").value,
  };
  const callback = (item) => {
    if (item["error"] === undefined) {
      container.innerHTML = getItemHTML(item);
    }
    attachEventHandlers(id);
  };
  issuePatchRequest(id, data, callback);
  removeConfirmExitPage();
};

const handleCreate = () => {
  const container = document.querySelector(".add-new-panel");
  let data = {
    firstname: container.querySelector(".firstname").value,
    lastname: container.querySelector(".lastname").value,
    email: container.querySelector(".email").value,
    avatar: container.querySelector(".avatar").value,
  };
  issuePostRequest(data, issueGetRequest);
  document.querySelector(".add-new-panel").classList.remove("active");
};

const handleDelete = (ev) => {
  const id = ev.target.id;
  const areYouSure = confirm("Are you sure that you want to delete item #" + id + "?");
  if (!areYouSure) {
    return;
  }
  issueDeleteRequest(id, actionAfterDelete);
};

const actionAfterDelete = () => {
  showMessage("User deleted", false);
  setTimeout(function () {
    if (getId() === "admin") location.href = "./users.html";
    else location.href = "/logout";
  }, 1000);
};

const attachEventHandlers = (id = "") => {
  if (!isAuthorized(id)) {
    // TODO: remove icons and methods if user is not logged
    for (let elem of document.querySelectorAll(".editName")) {
      elem.disabled = true;
      elem.style.visibility = "hidden";
    }
    for (let elem of document.querySelectorAll(".delete")) {
      elem.disabled = true;
      elem.style.visibility = "hidden";
    }
    for (let elem of document.querySelectorAll(".edit")) {
      elem.disabled = true;
      elem.style.visibility = "hidden";
    }
    for (let elem of document.querySelectorAll(".emailEdit")) {
      elem.disabled = true;
      elem.style.visibility = "hidden";
    }
    return;
  }
  for (let elem of document.querySelectorAll(".delete")) {
    elem.onclick = handleDelete;
  }
  for (let elem of document.querySelectorAll(".edit")) {
    elem.onclick = showEditForm;
  }
  for (let elem of document.querySelectorAll(".emailEdit")) {
    elem.onclick = showEmailEditForm;
  }
  //    document.querySelector('#add-new').onclick = () => {
  //        const container = document.querySelector('.add-new-panel');
  //        container.querySelector('.firstname').value = '';
  //        container.querySelector('.firstname').value = '';
  //        container.classList.add('active');
  //    };
  document.querySelector(".close").onclick = () => {
    document.querySelector(".add-new-panel").classList.remove("active");
    removeConfirmExitPage();
  };
  document.querySelector(".add-new-panel .cancel").onclick = () => {
    document.querySelector(".add-new-panel").classList.remove("active");
    removeConfirmExitPage();
  };
  document.querySelector(".update.save").onclick = handleCreate;

  document.querySelector("#btnDownloadCsv").onclick = () => {
    download("user_data.csv");
  };
  document.querySelector("#btnDownloadCsv").disabled = false;
};

const download = (filename) => {
  const text = jsonToCSV(usersData);

  var element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const attachFormEventHandlers = (item, container, id) => {
  container.querySelector(".update").onclick = handleUpdate;
  container.querySelector(".cancel").onclick = () => {
    container.innerHTML = getItemHTML(item);
    attachEventHandlers(id);
    removeConfirmExitPage();
  };
};

const attachEmailFormEventHandlers = (item, container, id) => {
  container.querySelector(".partialUpdate").onclick = handlePartialUpdate;
  container.querySelector(".cancel").onclick = () => {
    container.innerHTML = getItemHTML(item);
    attachEventHandlers(id);
    removeConfirmExitPage();
  };
};

const showEditForm = (ev) => {
  const id = ev.target.id;
  const url = usersEndpoint + "/" + id;
  const cardElement = ev.target.parentElement.parentElement;
  attachConfirmExitPage();

  fetch(url, { headers: formatHeaders() })
    .then((response) => response.json())
    .then((item) => {
      displayForm(item, cardElement);
      attachFormEventHandlers(item, cardElement, id);
    });

  return false;
};

const showEmailEditForm = (ev) => {
  const id = ev.target.id;
  const url = usersEndpoint + "/" + id;
  const cardElement = ev.target.parentElement.parentElement;
  attachConfirmExitPage();
  fetch(url, { headers: formatHeaders() })
    .then((response) => response.json())
    .then((item) => {
      displayEmailForm(item, cardElement);
      attachEmailFormEventHandlers(item, cardElement, id);
    });
  return false;
};

function confirmation(e) {
  var confirmationMessage = "Confirm!";

  (e || window.event).returnValue = confirmationMessage; //Gecko + IE
  return confirmationMessage; //Webkit, Safari, Chrome
}

function attachConfirmExitPage() {
  window.addEventListener("beforeunload", confirmation);
}
function removeConfirmExitPage() {
  window.removeEventListener("beforeunload", confirmation);
}

{
  /* <input type="text" id="email" value="${item.email}"><br> */
}
const displayForm = (item, container) => {
  const userEmail = getId() === "admin" ? item.email : getCookieEmail();
  container.innerHTML = `
        <div style="margin-top:7px;">
            <label>id:</label><span>${item.id}</span><br>
            <label>firstname:</label>
            <input type="text" id="firstname" data-testid="firstname-input" value="${item.firstname}"><br>
            
            <label>lastname:</label>
            <input type="text" id="lastname" data-testid="lastname-input" value="${item.lastname}"><br>
            <label>email:</label>
            <input type="text" id="email" data-testid="email-input" value="${userEmail}"><br>
            
            <label>avatar:</label>
            <input type="text" id="avatar" value="${item.avatar}"><br>
            <label>change password</label>
            <input type="checkbox" id="editPassword">
            <br><br>
            <button type="button" class="cancel" style="margin:20px;">Cancel</button>
            <button type="button" data-id="${item.id}" data-testid="update-user" class="update button-primary" style="margin:20px;">Update</button>
        </div>
    `;
  const editPasswordCheckbox = document.querySelector("#editPassword");
  editPasswordCheckbox.addEventListener("click", function () {
    if (editPasswordCheckbox.checked) {
      editPasswordCheckbox.insertAdjacentHTML(
        "afterend",
        `
        <div id="passBox">
        <label>password:</label>
        <input type="password" id="password" required><br>
        </div>
        `
      );
    } else {
      document.querySelector("#passBox").remove();
    }
  });
};

const displayEmailForm = (item, container) => {
  const userEmail = getId() === "admin" ? item.email : getCookieEmail();
  container.innerHTML = `
        <div style="margin-top:7px;">
            <label>id:</label><span>${item.id}</span><br>
            <label>firstname:</label>${item.firstname}<br>
            <label>lastname:</label>${item.lastname}<br>
            <label>email:</label>
            <input type="text" id="email" data-testid="email-input" value="${userEmail}"><br>
            <label>avatar:</label><a href="user.html?id=${item.id}" id="gotoUser${item.id}"><img src="${item.avatar}" /></a>
            
            </br>
            <button type="button" data-id="${item.id}" data-testid="update-email" class="partialUpdate button-primary">Update</button>
            <button type="button" class="cancel">Cancel</button>
        </div>
    `;
};

const getItemHTML = (item) => {
  let controls = "";

  if (item.id !== undefined && item.id !== "undefined") {
    controls = `<div class="controls" >
            <i class="fas fa-edit edit" id="${item.id}"></i>
            <i class="fas fa-trash delete" id="${item.id}"></i>
        </div>`;
  }

  return `<div>
        ${controls}
        <label>id:</label><span data-testid="id">${item.id}</span><br>
        <label>firstname:</label><span  data-testid="firstname">${item.firstname}</span><br>
        <label>lastname:</label><span data-testid="lastname">${item.lastname}</span><br>
        <label>email:</label><span data-testid="email">${item.email}</span><i class="fas fa-edit emailEdit" id="${item.id}"></i><br>
        <label>avatar:</label><br>
        <div align="center" ><img src="${item.avatar}" /></div>
        <br><br>
        <div align="center" >
        <a href="/articles.html?user_id=${item.id}" >
          <button id="btnUserArticles" data-testid="user-articles" class="button-primary" style="margin:2px;">User Articles</button>
        </a><a id="download" ><button disabled id="btnDownloadCsv" class="button-primary" style="margin:2px;">Download user data as CSV</button></a></div>
    </div>`;
};

const displayItem = (item, container) => {
  let itemHTML = getItemHTML(item);
  container.innerHTML += `
        <div class="card-wrapper">${itemHTML}</div>
    `;
};

const displayUserData = (data) => {
  const container = document.querySelector("#container");
  container.innerHTML = "";

  if (data === undefined || data.id === undefined) {
    container.innerHTML =
      '<div align="center"><h1 style="text-align: center;" data-testid="no-results">No data</h1><div data-testid="no-results-details">Invalid user ID or user does not exist</div></div>';
    return false;
  }

  displayItem(data, container);
  return true;
};

const user_id = getParams()["id"];
issueGetRequest(user_id);
