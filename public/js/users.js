const endpoint = "../../api/users";
const pictureListEndpoint = "../../api/images/user";
let picList = [];

const issueGetRequest = () => {
  // get data from the server:
  fetch(endpoint, { headers: formatHeaders() })
    .then((response) => response.json())
    .then(displayData)
    .then(attachEventHandlers);
};

// const issuePutRequest = (id, data, responseHandler) => {
//   // update data on the server:
//   const url = endpoint + "/" + id;
//   fetch(url, {
//     method: "put",
//     headers: {
//       Accept: "application/json",
//       "Content-Type": "application/json",
//       Authorization: getBearerToken(),
//     },
//     body: JSON.stringify(data),
//   })
//     .then((response) => {
//       showResponseOnUpdate(response);
//       return response.json();
//     })
//     .then(responseHandler);
// };
// const issuePatchRequest = (id, data, responseHandler) => {
//   // update data on the server:
//   const url = endpoint + "/" + id;
//   fetch(url, {
//     method: "PATCH",
//     headers: {
//       Accept: "application/json",
//       "Content-Type": "application/json",
//       Authorization: getBearerToken(),
//     },
//     body: JSON.stringify(data),
//   })
//     .then((response) => {
//       showResponseOnUpdate(response);
//       return response.json();
//     })
//     .then(responseHandler);
// };

const issueDeleteRequest = (id, responseHandler) => {
  // delete data on the server:
  const url = endpoint + "/" + id;
  fetch(url, { method: "delete", headers: formatHeaders() })
    .then((response) => {
      showResponseOnDelete(response);
      return response.json();
    })
    .then(responseHandler);
};

const issuePostRequest = (data, responseHandler) => {
  // create data on the server:
  fetch(endpoint, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(data),
  })
    .then((response) => showResponse(response))
    .then(responseHandler);
};

let alertElement = document.querySelector(".alert");

const showResponseOnDelete = (response) => {
  if (response.status === 200) {
    showMessage("User was deleted", false);
  } else {
    showMessage("User was not deleted", true);
  }
};

// const showResponseOnUpdate = (response) => {
//   if (response.status === 200) {
//     showMessage("User was updated", false);
//   } else {
//     showMessage("User was not updated", true);
//   }
// };

const showResponse = (response) => {
  if (response.status === 201) {
    showMessage("User was created", false);
  } else {
    showMessage("User was not created", true);
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

// const handleUpdate = (ev) => {
//   const id = ev.target.getAttribute("data-id");
//   const container = ev.target.parentElement.parentElement;
//   const data = {
//     firstname: container.querySelector("#firstname").value,
//     lastname: container.querySelector("#lastname").value,
//     email: container.querySelector("#email").value,
//     avatar: container.querySelector("#avatar").value,
//   };
//   const callback = (item) => {
//     if (item["error"] === undefined) {
//       container.innerHTML = getItemHTML(item);
//     }
//     attachEventHandlers();
//   };
//   issuePutRequest(id, data, callback);
// };

// const handlePartialUpdate = (ev) => {
//   const id = ev.target.getAttribute("data-id");
//   const container = ev.target.parentElement.parentElement;
//   const data = {
//     email: container.querySelector("#email").value,
//   };
//   const callback = (item) => {
//     if (item["error"] === undefined) {
//       container.innerHTML = getItemHTML(item);
//     }
//     attachEventHandlers();
//   };
//   issuePatchRequest(id, data, callback);
// };

const handleCreate = () => {
  const container = document.querySelector(".add-new-panel");
  let birthdate = container.querySelector(".datepicker").value;
  birthdate = `${new Date(birthdate).toISOString()}`.split(".")[0] + "Z";
  let data = {
    firstname: container.querySelector(".firstname").value,
    lastname: container.querySelector(".lastname").value,
    email: container.querySelector(".email").value,
    password: container.querySelector(".password").value,
    birthdate,
    avatar: `.\\data\\users\\${container.querySelector(".avatar").value}`,
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
  issueDeleteRequest(id, issueGetRequest);
};

const attachEventHandlers = (id = "") => {
  // document.querySelector("#add-new").onclick = () => {
  //   window.scrollTo(0, 0);
  //   const container = document.querySelector(".add-new-panel");
  //   container.querySelector(".firstname").value = "";
  //   container.querySelector(".lastname").value = "";
  //   container.querySelector(".email").value = "";
  //   let index = 0;
  //   for (let element of picList) {
  //     var opt = document.createElement("option");
  //     opt.value = element;
  //     opt.innerHTML = element; // whatever property it has

  //     container.querySelector(".avatar").appendChild(opt);
  //     index++;
  //   }
  //   container.classList.add("active");
  // };
  document.querySelector(".close").onclick = () => {
    document.querySelector(".add-new-panel").classList.remove("active");
  };
  document.querySelector(".add-new-panel .cancel").onclick = () => {
    document.querySelector(".add-new-panel").classList.remove("active");
  };

  if (!isAuthorized(id)) {
    // document.querySelector("#add-new").disabled = false;
    // document.querySelector(".update.save").onclick = handleCreate;
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

  document.querySelector(".update.save").onclick = handleCreate;
  // document.querySelector('.partialUpdate.save').onclick = handlePartialUpdate;
  // document.querySelector("#add-new").disabled = false;
  if (getId() == "admin") appendMenu(userAdditionalMenu);
};

const attachFormEventHandlers = (item, container) => {
  // TODO: add auth validation
  // container.querySelector(".update").onclick = handleUpdate;
  // // container.querySelector('.partialUpdate').onclick = handlePartialUpdate;
  // container.querySelector(".cancel").onclick = () => {
  //   container.innerHTML = getItemHTML(item);
  //   attachEventHandlers();
  // };
};

const attachEmailFormEventHandlers = (item, container) => {
  // TODO: add auth validation
  // container.querySelector(".partialUpdate").onclick = handlePartialUpdate;
  // container.querySelector(".cancel").onclick = () => {
  //   container.innerHTML = getItemHTML(item);
  //   attachEventHandlers();
  // };
};

const showEditForm = (ev) => {
  const id = ev.target.id;
  const url = endpoint + "/" + id;
  const cardElement = ev.target.parentElement.parentElement;
  fetch(url, { headers: formatHeaders() })
    .then((response) => response.json())
    .then((item) => {
      displayForm(item, cardElement);
      attachFormEventHandlers(item, cardElement);
    });
  return false;
};
const showEmailEditForm = (ev) => {
  const id = ev.target.id;
  const url = endpoint + "/" + id;
  const cardElement = ev.target.parentElement.parentElement;
  fetch(url, { headers: formatHeaders() })
    .then((response) => response.json())
    .then((item) => {
      displayEmailForm(item, cardElement);
      attachEmailFormEventHandlers(item, cardElement);
    });
  return false;
};

const displayForm = (item, container) => {
  container.innerHTML = `
        <div style="margin-top:7px;">
            <label>id:</label><span>${item.id}</span><br>
            <label>firstname:</label>
            <input type="text" id="firstname" value="${item.firstname}"><br>
            
            <label>lastname:</label>
            <input type="text" id="lastname" value="${item.lastname}"><br>
            
            <label>email:</label>
            <input type="text" id="email" disabled readOnly value="${item.email}"><br>
            
            <label>avatar:</label>
            <input type="text" id="avatar" value="${item.avatar}"><br>
            
            <label></label>
            <button type="button" data-id="${item.id}" class="update button-primary">Update</button>
            <button type="button" class="cancel">Cancel</button>
        </div>
    `;
};
const displayEmailForm = (item, container) => {
  container.innerHTML = `
        <div style="margin-top:7px;">
            <label>id:</label><span>${item.id}</span><br>
            <label>firstname:</label>${item.firstname}<br>
            <label>lastname:</label>${item.lastname}<br>
            <label>email:</label>
            <input type="text" id="email"  value="${item.email}"><br>
            <label>avatar:</label><a href="user.html?id=${item.id}" id="gotoUser${item.id}"><img src="${item.avatar}" /></a>
            
            </br>
            <button type="button" data-id="${item.id}" class="partialUpdate button-primary">Update</button>
            <button type="button" class="cancel">Cancel</button>
        </div>
    `;
};

/* <div class="controls">
<i class="fas fa-edit edit" data-testid="edit-${item.id}" id="${item.id}"></i>
<i class="fas fa-trash delete" data-testid="delete-${item.id}" id="${item.id}"></i>
</div> */
{
  /* <i class="fas fa-edit emailEdit" data-testid="emailEdit-${item.id}" id="${item.id}"></i> */
}

const getItemHTML = (item) => {
  return `<div>
        <label>id:</label><span>${item.id}</span><br>
        <label>firstname:</label><span>${item.firstname}</span><br>
        <label>lastname:</label><span>${item.lastname}</span><br>
        <label>email:</label><span>${item.email}</span><br>
        <label>avatar:</label><a href="user.html?id=${item.id}" id="gotoUser${item.id}"><img src="${item.avatar}" /></a>
    </div>`;
};

const displayItem = (item, container) => {
  let itemHTML = getItemHTML(item);
  container.innerHTML += `
        <div class="card-wrapper">${itemHTML}</div>
    `;
};

const displayData = (data) => {
  const container = document.querySelector("#container");
  container.innerHTML = "";
  for (let item of data) {
    displayItem(item, container);
  }
  if (data.length === 0) {
    container.innerHTML += `
        <div align="center"><h1 style="text-align: center;"data-testid="no-results">No data</h1></div>
    `;
  }
};

async function getPictureList() {
  picList = await Promise.all(
    [pictureListEndpoint].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json()))
  );
  picList = picList[0];
}

getPictureList();
issueGetRequest();
menuButtonDisable("btnUsers");
