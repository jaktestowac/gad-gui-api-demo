const commentsEndpoint = "../../api/comments";
const usersEndpoint = "../../api/users";
let user_name = "Unknown";
let article_id = undefined;
let alertElement = document.querySelector(".alert");
let commentData;

const fetchData = {
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
};

async function issueGetRequest(comment_id) {
  const commentUrl = `${commentsEndpoint}/${comment_id}`;
  const commentsData = await Promise.all(
    [commentUrl].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json()))
  );

  commentData = commentsData[0];
  article_id = commentData.article_id;

  // find user:
  const userUrl = `${usersEndpoint}/${commentData.user_id}`;
  const usersData = await Promise.all(
    [userUrl].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json()))
  );
  const userData = usersData[0];
  if (userData.firstname === undefined) {
    user_name = "Unknown user";
  } else {
    user_name = `${userData.firstname} ${userData.lastname}`;
  }
  commentData.user_name = user_name;

  displayCommentData(commentData);
  attachEventHandlers(userData.id);
}

//
//        <label>id:</label><span>${item.id}</span><br>
const getItemHTML = (item) => {
  let controls = "";

  if (item.id !== undefined && item.id !== "undefined") {
    controls = `<div class="controls" >
            <i class="fas fa-edit edit" data-testid="edit" id="${item.id}"></i>
        </div>`;
    // <i class="fas fa-trash delete" id="${item.id}"></i>
  }
  if (item.body === undefined || item.body.length === 0) {
    item.body = "<i>[Comment was removed]</i>";
  }
  return `<div style="width:500px;">
        <span><a href="article.html?id=${item.article_id}" id="gotoArticle${
    item.article_id
  }" data-testid="return">Return to Article...</a></span><br>

        ${controls}
        <label>id:</label><span data-testid="id">${item.id}</span><br>
        <label>user:</label><span><a href="user.html?id=${item.user_id}" id="gotoUser${item.user_id}-${
    item.id
  }" data-testid="user-name">${item.user_name}</a></span><br>
        <label>date:</label><span>${item.date.replace("T", " ").replace("Z", "")}</span><br>
        <label>comment:</label><span style="margin:10px;" data-testid="comment-body">${item.body}</span><br>
    </div>`;
};
//        <hr><br>
//        <label>comments:</label><br>
//        ${getCommentsHTML(item.comments)}

const displayCommentData = (item) => {
  const container = document.querySelector("#container");
  container.innerHTML = "";

  if (item === undefined || item.id === undefined) {
    container.innerHTML =
      '<div align="center"><h1 style="text-align: center;" data-testid="no-results">No data</h1><div data-testid="no-results-details">Invalid comment ID or comment does not exist</div></div>';
    return false;
  }

  displayItem(item, container);
};

const displayItem = (item, container) => {
  let itemHTML = getItemHTML(item);
  container.innerHTML += `<div align="center" ><div class="card-wrapper-wide" align="left" style="width:600px;">${itemHTML}</div></div>`;
};

const showResponseOnUpdate = (response) => {
  if (response.status === 200) {
    showMessage("Comment was updated", false);
  } else if (response.status === 409) {
    showMessage("Comment was updated. Invalid credentials!", false);
  } else {
    showMessage("Comment was not updated", true);
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

const issuePutRequest = (id, data, responseHandler, basicAuth) => {
  // update data on the server:
  const url = commentsEndpoint + "/" + id;
  console.log("PUT request:", url, data);
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

const issueDeleteRequest = (id, responseHandler) => {
  // delete data on the server:
  const url = commentsEndpoint + "/" + id;
  console.log("DELETE request:", url);
  fetch(url, { method: "DELETE", headers: formatHeaders() }).then(responseHandler);
};

const issuePostRequest = (data, responseHandler) => {
  // create data on the server:
  console.log("POST request:", commentsEndpoint, data);
  fetch(commentsEndpoint, {
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
  const id = ev.target.getAttribute("data-id");
  const container = ev.target.parentElement.parentElement;
  const user_id = container.querySelector("#user_id").value;
  // #BUG004: user_id and article_id is a string
  const data = {
    body: container.querySelector("#body").value,
    id: container.querySelector("#id").value,
    user_id: container.querySelector("#user_id").value,
    article_id: container.querySelector("#article_id").value,
    date: commentData.date,
  };
  const callback = (item) => {
    item.user_name = user_name;
    if (item["error"] === undefined) {
      container.innerHTML = getItemHTML(item);
    }
    attachEventHandlers(user_id);
  };
  issuePutRequest(id, data, callback);
};

const handleCreate = () => {
  const container = document.querySelector(".add-new-panel");
  let data = {
    title: container.querySelector("#title").value,
    body: container.querySelector("#body").value,
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
  location.href = `article.html?id=${article_id}`;
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
  //    document.querySelector('#add-new').onclick = () => {
  //        const container = document.querySelector('.add-new-panel');
  //        container.querySelector('.firstname').value = '';
  //        container.querySelector('.firstname').value = '';
  //        container.classList.add('active');
  //    };
  document.querySelector(".close").onclick = () => {
    document.querySelector(".add-new-panel").classList.remove("active");
  };
  document.querySelector(".add-new-panel .cancel").onclick = () => {
    document.querySelector(".add-new-panel").classList.remove("active");
    location.reload();
  };
  document.querySelector(".update.save").onclick = handleCreate;
};

const attachFormEventHandlers = (item, container) => {
  container.querySelector(".update").onclick = handleUpdate;
  container.querySelector(".cancel").onclick = () => {
    container.innerHTML = getItemHTML(item);
    location.reload();
    attachEventHandlers(item.user_id);
  };
};

const showEditForm = (ev) => {
  const id = ev.target.id;
  const url = commentsEndpoint + "/" + id;
  const cardElement = ev.target.parentElement.parentElement;
  fetch(url, { headers: formatHeaders() })
    .then((response) => response.json())
    .then((item) => {
      displayForm(item, cardElement);
      attachFormEventHandlers(item, cardElement, item.user_id);
    });
  return false;
};

const displayForm = (item, container) => {
  container.innerHTML = `
        <div style="margin-top:7px; ">
            <label>comment id:</label><span>${item.id}</span><br>
            <input style="visibility:hidden;" type="text" id="id" data-testid="id-input" value="${item.id}"><br>
            <label>body:</label><br>
            <textarea rows="4" type="text" id="body" style="width:475px;" data-testid="body-input" value="${item.body}">${item.body}</textarea><br>
            <input style="visibility:hidden;" type="text" id="date" value="${item.date}"><br>
            <input style="visibility:hidden;" type="text" id="article_id" value="${item.article_id}"><br>
            <input style="visibility:hidden;" type="text" id="user_id" value="${item.user_id}"><br>
    <div align="center" >
            <label></label><br>
            <button type="button" data-id="${item.id}" data-testid="update-button" class="update button-primary">Update</button>
            <button type="button" class="cancel">Cancel</button>
        </div></div>
    `;
};

const comment_id = getParams()["id"];
const msg = getParams()["msg"];
if (comment_id !== undefined) {
  issueGetRequest(comment_id);
} else {
  const container = document.querySelector("#container");
  container.innerHTML =
    '<div align="center"><h1 style="text-align: center;" data-testid="no-results">No data</h1><div data-testid="no-results-details">Invalid comment ID or comment does not exist</div></div>';
}

if (msg !== undefined) {
  showMessage(decodeURIComponent(msg), false);
}
