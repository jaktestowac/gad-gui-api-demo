const articlesEndpoint = "../../api/articles";
const usersEndpoint = "../../api/users";
const commentsEndpoint = "../../api/comments";
const randomArticleEndpoint = "../../api/random/article";
let user_name = "Unknown";
let users = [];
let article_id = undefined;
let articleData;
let articleDataForExport;
let articleUserId;

function getId() {
  let id = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith("id=")) {
      id = cookie.split("=")[1];
    }
  }
  return id;
}

function getToken() {
  let token = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith("token=")) {
      token = cookie.split("=")[1];
    }
  }
  return token;
}

function getBearerToken() {
  return `Bearer ${getToken()}`;
}

function isAuthorized(id) {
  return id?.toString() === getId() || getId() === "admin";
}

function getCookieEmail() {
  let email = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith("email=")) {
      email = cookie.split("=")[1];
      email = email.replace("%40", "@");
    }
  }
  return email;
}

function getCookieId() {
  let id = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith("id=")) {
      id = cookie.split("=")[1];
    }
  }
  return id;
}

function formatHeaders() {
  const headers = {
    Authorization: getBearerToken(),
  };
  return headers;
}

async function issueGetRandomRequest() {
  const articlesData = await Promise.all(
    [randomArticleEndpoint].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json()))
  );
  console.log(articlesData);
  articleData = articlesData[0];
  return articleData;
}

async function issueGetRequest(article_id) {
  const articlesUrl = `${articlesEndpoint}/${article_id}`;
  const articlesData = await Promise.all(
    [articlesUrl].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json()))
  );

  const commentsUrl = `${commentsEndpoint}?article_id=${article_id}`;
  const comments = await Promise.all(
    [commentsUrl].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json()))
  );
  articleData = articlesData[0];
  articleDataForExport = JSON.parse(JSON.stringify(articlesData));
  const userComments = comments[0];
  articleUserId = articleData.user_id;

  articleData.comments = userComments;
  // sort comments by date:
  articleData.comments.sort((a, b) => a.date < b.date);
  article_id = articleData.id;
  const commentsWithUsers = await Promise.all([addUserNameToComments(articleData.comments)]);
  articleData.comments = commentsWithUsers[0];
  articleData = await Promise.all([addUserNameToArticle(articleData)]);
  const wasDisplayed = displayArticlesData(articleData[0]);
  if (wasDisplayed) {
    attachEventHandlers(articleUserId);
  }
}

async function addUserNameToComments(comments) {
  const userIds = [];
  for (let index = 0; index < comments.length; index++) {
    const comment = comments[index];
    if (!userIds.includes(comment.user_id)) {
      userIds.push(comment.user_id);
    }
  }

  userIds.push(getId());
  const queryId = `${userIds.join("&id=")}`;
  const userUrlQuery = `${usersEndpoint}?id=${queryId}`;

  const data = await Promise.all(
    [userUrlQuery].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json()))
  );
  const usersData = data[0];

  for (let index = 0; index < comments.length; index++) {
    const comment = comments[index];

    const userData = usersData.find((x) => x.id === comment.user_id);

    if (userData === undefined || userData.firstname === undefined) {
      user_name = "Unknown user";
    } else {
      user_name = `${userData.firstname} ${userData.lastname}`;
    }
    comments[index].user_name = user_name;
  }
  return comments;
}
async function addUserNameToArticle(item) {
  const userUrl = `${usersEndpoint}/${item.user_id}`;
  const usersData = await Promise.all(
    [userUrl].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json()))
  );
  const userData = usersData[0];
  if (userData.firstname === undefined) {
    user_name = "Unknown user";
  } else {
    user_name = `${userData.firstname} ${userData.lastname}`;
  }
  item.user_name = user_name;
  return item;
}

const getImagesHTML = (image) => {
  let htmlData = "";
  if (image !== undefined) {
    htmlData += `<div align="center" ><img id="article-image" src="${image}" /></div>`;
    //        for (image of images) {
    //            htmlData += `<img src="${image}" />`;
    //            htmlData += `<br>`
    //        }
  }
  return htmlData;
};

//            <i class="fas fa-trash delete" id="${item.id}"></i>
//        <label>id:</label><span>${item.id}</span><br>
const getItemHTML = (item) => {
  // @GAD-R07-01
  if (item.title === undefined || item.title.length === 0) {
    item.title = "[No title]";
  }
  if (item.body === undefined || item.body.length === 0) {
    item.body = "[No body]";
  }

  let controls = "";

  if (item.id !== undefined && item.id !== "undefined") {
    controls = `<div class="controls" >
            <i class="fas fa-edit edit" disabled data-testid="edit" id="${item.id}"></i>
            <i class="fas fa-trash delete" disabled data-testid="delete" id="${item.id}"></i>
        </div>`;
  }

  const body = item.body?.replaceAll("\n", "<br/><br/>");
  return `<div>
        ${controls}<br>
        ${getImagesHTML(item.image)}<br>
        <label>title:</label><span id="title" data-testid="article-title">${
          item.title
        }</span><i class="fas fa-edit editName" disabled data-testid="article-title-edit" id="${item.id}"></i><br>
        <label>user:</label><span><a href="user.html?id=${item.user_id}" data-testid="user-name">${
    item.user_name
  }</a></span><br>
        <label>date:</label><span>${item?.date?.replace("T", " ").replace("Z", "")}</span><br>
        <div align="center" >Download article as:<br>
        <a id="download" ><button id="btnDownloadCsv" class="button-primary" data-testid="download-scv">CSV</button></a>
        <a id="download" ><button id="btnDownloadJson" class="button-primary" data-testid="download-json">JSON</button></a>

        <button onclick="generatePDF()" id="btnDownloadPdf" class="button-primary" data-testid="download-pdf">PDF</button></div>
        <label></label><span data-testid="article-body">${body}</span><br>
    </div>`;
};
//        <hr><br>
//        <label>comments:</label><br>
//        ${getCommentsHTML(item.comments)}

function generatePDF() {
  const element = document.documentElement;
  var opt = {
    margin: 1,
    filename: "article.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 1 },
    jsPDF: { unit: "mm", format: "a3", orientation: "portrait" },
  };
  // Docs: https://github.com/eKoopmans/html2pdf.js
  html2pdf().set(opt).from(element).save();
}

const getCommentsHTML = (comments) => {
  let htmlData = "";
  if (comments.length == 0) {
    htmlData = `<div class="comment-container">
        <span>No Comments</span><br>
    </div>`;
  } else {
    for (item of comments) {
      htmlData += getCommentHTML(item);
      htmlData += `<hr><br>`;
    }
  }
  return htmlData;
};

const getCommentHTML = (comments) => {
  if (comments.body === undefined || comments.body.length === 0) {
    comments.body = "<i>[Comment was removed]</i>";
  }

  return `<div class="comment-container">
        <label>id:</label><span class="super-style">${comments.id}</span><br>
        <label>author:</label><span><a href="user.html?id=${comments.user_id}" id="gotoUser${comments.id}-${
    comments.user_id
  }">${comments.user_name}</a></span><br>
        <label>date:</label><span>${comments.date.replace("T", " ").replace("Z", "")}</span><br>
        <label>comment:</label><span>${comments.body}</span><br>
        <span><a href="comment.html?id=${item.id}" id="gotoComment${item.id}">See More...</a></span><br>
    </div>`;
};

const displayArticlesData = (data) => {
  const container = document.querySelector("#container");
  container.innerHTML = "";

  if (data === undefined || data.id === undefined) {
    container.innerHTML =
      '<div align="center"><h1 style="text-align: center;" data-testid="no-results">No data</h1><div data-testid="no-results-details">Invalid article ID or article does not exist</div></div>';
    const containerComments = document.querySelector("#containerComments");
    containerComments.innerHTML = "";
    return false;
  }

  displayItem(data, container);
  const containerComments = document.querySelector("#containerComments");
  containerComments.innerHTML = "";
  displayComments(data, containerComments);
  return true;
};

const displayComments = (item, container) => {
  itemHTML = getCommentsHTML(item.comments);
  container.innerHTML += `<div align="center" ><div class="card-wrapper-wide" align="left">${itemHTML}</div></div><br>`;
};
const displayItem = (item, container) => {
  itemHTML = getItemHTML(item);
  container.innerHTML += `<div align="center" ><div class="card-wrapper-wide" align="left">${itemHTML}</div></div>`;
};

let alertElement = document.querySelector(".alert");

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

const issuePatchRequest = (id, data, responseHandler) => {
  // update data on the server:
  const url = articlesEndpoint + "/" + id;
  console.log("PATCH request:", url, data);
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
      showResponseOnUpdate(response, "Article");
      return response.json();
    })
    .then(responseHandler);
};

const issuePutRequest = (id, data, responseHandler) => {
  // update data on the server:
  const url = articlesEndpoint + "/" + id;
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
      showResponseOnUpdate(response, "Article");
      return response.json();
    })
    .then(responseHandler);
};

const showResponseOnCreate = (response, item) => {
  if (response.status === 201) {
    showMessage(`${item} was created`, false);
  } else {
    showMessage(`${item} was not created`, true);
  }
};

const showResponseOnDelete = (response, item) => {
  if (response.status === 200) {
    showMessage(`${item} was deleted`, false);
  } else {
    showMessage(`${item} was not deleted`, true);
  }
};

const showResponseOnUpdate = (response, item) => {
  if (response.status === 200) {
    showMessage(`${item} was updated`, false);
  } else {
    showMessage(`${item} was not updated`, true);
  }
};

const issueDeleteRequest = (id, responseHandler) => {
  // delete data on the server:
  const url = articlesEndpoint + "/" + id;
  console.log("DELETE request:", url);
  fetch(url, { method: "delete", headers: formatHeaders() })
    .then((response) => {
      showResponseOnDelete(response, "Article");
      return response.json();
    })
    .then(responseHandler);
};

const issueArticlePostRequest = (data, responseHandler) => {
  // create data on the server:
  console.log("POST request:", articlesEndpoint, data);
  fetch(articlesEndpoint, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(data),
  }).then(responseHandler);
};
const issueCommentPostRequest = (data, responseHandler, basicAuth) => {
  // create data on the server:
  console.log("POST request:", commentsEndpoint, data);
  fetch(commentsEndpoint, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      // Authorization: `Basic ${basicAuth}`, // TODO: changed to bearer
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      showResponseOnCreate(response, "Comment");
      return response.json();
    })
    .then(responseHandler);
};

const handleUpdate = (ev) => {
  const id = ev.target.getAttribute("data-id");
  const container = ev.target.parentElement.parentElement;
  const data = {
    title: container.querySelector("#title").value,
    body: container.querySelector("#body").value,
    user_id: container.querySelector("#user_id").value,
    date: container.querySelector("#date").value,
    image: container.querySelector("#image").value,
  };
  const callback = (item) => {
    if (item["error"] === undefined) {
      item.user_name = user_name;
      container.innerHTML = getItemHTML(item);
    }
    attachEventHandlers(data.user_id);
  };
  issuePutRequest(id, data, callback);
};

const handleUpdateName = (ev) => {
  const id = ev.target.getAttribute("data-id");
  const container = ev.target.parentElement.parentElement;
  const data = {
    title: container.querySelector("#title").value,
  };
  const callback = (item) => {
    if (item["error"] === undefined) {
      item.user_name = user_name;
      container.innerHTML = getItemHTML(item);
    }
    attachEventHandlers(articleUserId);
  };
  issuePatchRequest(id, data, callback);
};
function pad(num, size = 2) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

const handleCommentCreate = () => {
  const container = document.querySelector(".add-new-panel");
  const today = new Date();

  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(
    today.getHours()
  )}:${pad(today.getMinutes())}:${pad(today.getSeconds())}Z`;

  const id = parseInt(getCookieId());
  data = {
    article_id: article_id,
    body: container.querySelector("#body").value,
    user_id: id,
    date: date,
  };
  issueCommentPostRequest(data, issueGetRequest(article_id));
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
  location.href = "./articles.html";
};

const addCommentArticleButton = () => {
  document.querySelector("#add-new").onclick = () => {
    window.scrollTo(0, 0);
    const container = document.querySelector(".add-new-panel");
    container.querySelector(".body").value = "";
    container.querySelector("#body").value = "";
    container.classList.add("active");
  };
  document.querySelector("#add-new-comment").onclick = () => {
    window.scrollTo(0, 0);
    const container = document.querySelector(".add-new-panel");
    container.querySelector(".body").value = "";
    container.querySelector("#body").value = "";
    container.classList.add("active");
  };
  document.querySelector(".close").onclick = () => {
    document.querySelector(".add-new-panel").classList.remove("active");
  };
  document.querySelector(".add-new-panel .cancel").onclick = () => {
    document.querySelector(".add-new-panel").classList.remove("active");
    location.reload();
  };
  document.querySelector(".update.save").onclick = handleCommentCreate;
};

const attachEventHandlers = (id = "") => {
  if (getId()) {
    appendMenu(articleAdditionalMenu);
    const btn = document.querySelector("#add-new-comment");

    // TODO:INVOKE_BUG: remove if to have a Bug - button Add Comment is duplicated
    if (btn === undefined || btn === null) {
      appendElementOnTop(articleAdditionalMenuOnPage, "containerComments");
    }

    document.querySelector("#add-new").disabled = false;
    document.querySelector("#add-new-comment").disabled = false;
  }
  if (!isAuthorized(id)) {
    // TODO: remove icons and methods if user is not logged
    for (elem of document.querySelectorAll(".editName")) {
      elem.disabled = true;
      elem.style.visibility = "hidden";
    }
    for (elem of document.querySelectorAll(".delete")) {
      elem.disabled = true;
      elem.style.visibility = "hidden";
    }
    for (elem of document.querySelectorAll(".edit")) {
      elem.disabled = true;
      elem.style.visibility = "hidden";
    }
    if (document.querySelector("#btnDownloadCsv")) {
      document.querySelector("#btnDownloadCsv").disabled = true;
    }
    if (document.querySelector("#btnDownloadJson")) {
      document.querySelector("#btnDownloadJson").disabled = true;
    }
    if (document.querySelector("#btnDownloadPdf")) {
      document.querySelector("#btnDownloadPdf").disabled = true;
    }
    if (getId()) {
      addCommentArticleButton();
    }
    return;
  } else {
    for (elem of document.querySelectorAll(".delete")) {
      elem.onclick = handleDelete;
      elem.disabled = false;
    }
    for (elem of document.querySelectorAll(".edit")) {
      elem.onclick = showEditForm;
      elem.disabled = false;
    }
    for (elem of document.querySelectorAll(".editName")) {
      elem.onclick = showEditNameForm;
      elem.disabled = false;
    }
    addCommentArticleButton();

    if (document.querySelector("#btnDownloadCsv")) {
      document.querySelector("#btnDownloadCsv").onclick = () => {
        download("article_data.csv");
      };
    }
    if (document.querySelector("#btnDownloadJson")) {
      document.querySelector("#btnDownloadJson").onclick = () => {
        download("article_data.json");
      };
    }
  }

  if (document.querySelector("#btnDownloadCsv")) {
    document.querySelector("#btnDownloadCsv").disabled = false;
  }
  if (document.querySelector("#btnDownloadJson")) {
    document.querySelector("#btnDownloadJson").disabled = false;
  }
  if (document.querySelector("#btnDownloadPdf")) {
    document.querySelector("#btnDownloadPdf").disabled = false;
  }
};

const download = (filename) => {
  let text = "NO DATA";
  if (filename.includes("csv")) {
    text = jsonToCSV(articleDataForExport);
  } else if (filename.includes("json")) {
    text = JSON.stringify(articleDataForExport, null, 4);
  }

  var element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const attachFormEventHandlers = (item, container) => {
  container.querySelector(".update").onclick = handleUpdate;
  container.querySelector(".cancel").onclick = () => {
    container.innerHTML = getItemHTML(item);
    location.reload();
    attachEventHandlers(articleUserId);
  };
};

const attachNameFormEventHandlers = (item, container) => {
  container.querySelector(".updateName").onclick = handleUpdateName;
  container.querySelector(".cancel").onclick = () => {
    container.innerHTML = getItemHTML(item);
    location.reload();
    attachEventHandlers(articleUserId);
  };
};
const showEditForm = (ev) => {
  const id = ev.target.id;
  const url = articlesEndpoint + "/" + id;
  const cardElement = ev.target.parentElement.parentElement;
  fetch(url, { headers: formatHeaders() })
    .then((response) => response.json())
    .then((item) => {
      displayForm(item, cardElement);
      attachFormEventHandlers(item, cardElement);
    });
  return false;
};
const showEditNameForm = (ev) => {
  const id = ev.target.id;
  const url = articlesEndpoint + "/" + id;
  const cardElement = ev.target.parentElement.parentElement;
  fetch(url, { headers: formatHeaders() })
    .then((response) => response.json())
    .then((item) => {
      displayNameForm(item, cardElement);
      attachNameFormEventHandlers(item, cardElement);
    });
  return false;
};

const displayForm = (item, container) => {
  // @GAD-R07-01
  if (item.title === undefined || item.title.length === 0) {
    item.title = "[No title]";
  }
  if (item.body === undefined || item.body.length === 0) {
    item.body = "[No body]";
  }

  container.innerHTML = `
        <div style="margin-top:7px; width:500px;">
            <label>id:</label><span>${item.id}</span><br>
            <label>title:</label>
            <input type="text" id="title" data-testid="title-input" value="${item.title}"><br>
            </br>
            <label>body:</label><br>
            <textarea rows="4" type="text" id="body" data-testid="body-input" style="width:350px;" value="${item.body}">${item.body}</textarea><br>
            <input style="visibility:hidden;" type="text" id="user_id" value="${item.user_id}"><br>
            <input style="visibility:hidden;" type="text" id="date" value="${item.date}"><br>
            <label>image:</label>
            <input type="text" id="image" value="${item.image}"><br><br>
    </div>
    <div align="center" >
            <label></label><br>
            <button type="button" data-id="${item.id}" data-testid="update" class="update button-primary">Update</button>
            <button type="button" class="cancel">Cancel</button>
        </div>
    `;
};

const displayNameForm = (item, container) => {
  container.innerHTML = `
    <div style="margin-top:7px; width:1200px;">
        ${getImagesHTML(item.image)}<br>
            <label>title:</label>
            <input type="text" id="title" data-testid="title-input" value="${item.title}"><br>
            <label>user:</label><span><a href="user.html?id=${item.user_id}">${item.user_id}</a></span><br>
            <label>date:</label><span>${item.date}</span><br>
            <label></label><span data-testid="article-body" >${item.body}</span><br>
            <label></label><br>
            <button type="button" data-id="${
              item.id
            }" data-testid="update" class="updateName button-primary">Update</button>
            <button type="button" class="cancel">Cancel</button>
        <br><br>
        </div>
    `;
};

article_id = getParams()["id"];
const is_random = getParams()["random"];
const msg = getParams()["msg"];

if (`${is_random}` === "1" || `${is_random}`.toLowerCase() === "true" || `${article_id}`.toLowerCase() === "random") {
  issueGetRandomRequest().then((article) => {
    issueGetRequest(article.id).then(() => {
      injectLink(`./article.html?id=${article.id}`, "title");
    });
  });
} else if (article_id !== undefined) {
  issueGetRequest(article_id);
} else {
  const container = document.querySelector("#container");
  container.innerHTML =
    '<div align="center"><h1 style="text-align: center;" data-testid="no-results">No data</h1><div data-testid="no-results-details">Invalid article ID or article does not exist</div></div>';
}

if (msg !== undefined) {
  showMessage(decodeURIComponent(msg), false);
}
