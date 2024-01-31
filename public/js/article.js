const articlesEndpoint = "../../api/articles";
const usersEndpoint = "../../api/users";
const commentsEndpoint = "../../api/comments";
const randomArticleEndpoint = "../../api/random/article";
const articleLikesEndpoint = "../../api/likes/article";
const myLikesEndpoint = "../../api/likes/article/mylikes";
const likesEndpoint = "../../api/likes";
const visitsEndpoint = "../../api/visits/articles";
const articleBookmarkEndpoint = "../../api/bookmarks/articles";
let user_name = "Unknown";
let article_id = undefined;
let articleData;
let articleDataForExport;
let articleUserId;
let articleLabelId = undefined;
let selectedLabels = [];
let labelsEnabled = false;
let labelsEditEnabled = false;
let labelOptions = [];
let allLabels = [];
let assignedLabels = [];

async function issueGetVisitsForArticle(articleId) {
  const visitsData = await fetch(`${visitsEndpoint}/${articleId}`, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return visitsData;
}

async function issueGetBookmarkedArticles() {
  const bookmarksData = await fetch(articleBookmarkEndpoint, { headers: formatHeaders() }).then((r) => r.json());
  return bookmarksData.article_ids ?? [];
}

async function issueGetRandomRequest() {
  const articlesData = await Promise.all(
    [randomArticleEndpoint].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json()))
  );
  articleData = articlesData[0];
  return articleData;
}

async function issueGetMyLikesForArticle(articleId) {
  const likesData = await fetch(`${myLikesEndpoint}?id=${articleId}`, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return likesData.likes;
}

async function issueGetLikes(article_id) {
  const likesData = await fetch(`${articleLikesEndpoint}/${article_id}`, { headers: formatHeaders() }).then((r) =>
    r.json()
  );
  return likesData.likes;
}

async function likeArticle(articleId) {
  const data = {
    article_id: articleId,
    user_id: getId(),
  };
  fetch(likesEndpoint, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
      userid: getId(),
    },
    body: JSON.stringify(data),
  })
    .then((r) => r.json())
    .then((body) => {
      issueGetLikes(articleId).then((likes) => {
        const element = document.querySelector(`#likes-container`);
        element.innerHTML = formatLike(body.id !== undefined, likes, articleId);
      });
    });
}

async function issueGetRequest(article_id) {
  // issueGetRequestArticles(article_id).then((x) => {
  //   issueGetRequestComments(article_id);
  // });

  let wasDisplayed = issueGetRequestArticles(article_id).catch((error) => {
    console.log(error);
    displayArticlesData(undefined, "Error loading comments. Please contact administrator");
  });

  issueGetRequestComments(article_id).catch((error) => {
    console.log(error);
    displayCommentsData(undefined, "Error loading comments. Please contact administrator");
  });

  return wasDisplayed;
}

async function issueGetRequestArticles(article_id) {
  // get article
  const articlesUrl = `${articlesEndpoint}/${article_id}`;
  let articleData = await fetch(articlesUrl, { headers: formatHeaders() }).then((r) => r.json());

  articleDataForExport = JSON.parse(JSON.stringify(articleData));
  articleUserId = articleData.user_id;

  article_id = articleData.id;
  articleData = await Promise.all([addUserNameToArticle(articleData)]);
  const wasDisplayed = displayArticlesData(articleData[0]);
  if (wasDisplayed) {
    attachEventHandlers(articleUserId);
  }

  return wasDisplayed;
}

async function issueGetRequestComments(article_id) {
  // get comments
  const commentsUrl = `${commentsEndpoint}?article_id=${article_id}`;
  const userComments = await fetch(commentsUrl, { headers: formatHeaders() }).then((r) => r.json());
  // sort comments by date:
  userComments.sort((a, b) => a.date < b.date);
  const commentsWithUsers = await addUserNameToComments(userComments);

  displayCommentsData(commentsWithUsers);
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

    // TODO:INVOKE_BUG: remove toString() to get Unknown User in some cases #BUG004
    const userData = usersData.find((x) => x.id?.toString() === comment.user_id?.toString());

    let user_name;
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
        ${getImagesHTML(item.image)}
        <div align="center" style="" class="visits-container" id="visits-container-${
          item.id
        }" style="visibility: visible;"></div>
        <table>
        <tr>
          <td style="padding: 0px;"><label style="width:50px !important">title:</label>&nbsp&nbsp</td>
          <td style="padding: 0px;"><span id="title" data-testid="article-title">${
            item.title
          }</span><i class="fas fa-edit editName" disabled data-testid="article-title-edit" id="${item.id}"></i></td>
          <td rowspan="3" style="padding:0px !important" class="bookmark-container" id="bookmark-container"></td>
        </tr>
        
        <tr>
          <td style="padding: 0px;"><label style="width:50px !important">user:</label>&nbsp&nbsp</td>
          <td style="padding: 0px;"><span><a href="user.html?id=${item.user_id}" data-testid="user-name">${
    item.user_name
  }</a></span></td>
        </tr>
        
        <tr>
          <td style="padding: 0px ;"><label style="width:10px !important">date:</label>&nbsp&nbsp</td>
          <td style="padding: 0px ;"><span>${item?.date?.replace("T", " ").replace("Z", "")}</span></td>
        </tr>
      </table>
        <div class="labels-container" id="labels-container" ></div>
        
        <div align="center" >Download article as:<br>
        <a id="download" ><button id="btnDownloadCsv" class="button-primary" data-testid="download-scv">CSV</button></a>
        <a id="download" ><button id="btnDownloadJson" class="button-primary" data-testid="download-json">JSON</button></a>

        <button onclick="generatePDF()" id="btnDownloadPdf" class="button-primary" data-testid="download-pdf">PDF</button></div>
        <label></label><span data-testid="article-body">${body}</span><br>
        <div id="likes-container" style="visibility: visible;display: grid;"></div>
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

const getCommentsHTML = (comments, error) => {
  let htmlData = "";
  let errorMsg = error ?? "No Comments";
  if (comments === undefined || comments?.length == 0) {
    htmlData = `<div class="comment-container">
        <span>${errorMsg}</span><br>
    </div>`;
  } else {
    for (let item of comments) {
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
        <span><a href="comment.html?id=${comments.id}" id="gotoComment${comments.id}">See More...</a></span><br>
    </div>`;
};

const displayArticlesData = (data, error) => {
  const container = document.querySelector("#container");
  container.innerHTML = "";
  const errorMsg = error ?? "Invalid article ID or article does not exist";
  if (data === undefined || data.id === undefined) {
    container.innerHTML = `<div align="center"><h1 style="text-align: center;" data-testid="no-results">No data</h1><div data-testid="no-results-details">${errorMsg}</div></div>`;
    const containerComments = document.querySelector("#containerComments");
    containerComments.innerHTML = "";
    return false;
  }

  displayItem(data, container);
  return true;
};

const displayCommentsData = (comments, error) => {
  const containerComments = document.querySelector("#containerComments");
  containerComments.innerHTML = "";
  displayComments(comments, containerComments, error);
  return true;
};

const displayComments = (comments, container, error) => {
  let itemHTML = getCommentsHTML(comments, error);
  container.innerHTML += `<div align="center" ><div class="card-wrapper-wide" align="left">${itemHTML}</div></div><br>`;
};

const displayItem = (item, container) => {
  let itemHTML = getItemHTML(item);
  container.innerHTML += `<div align="center" ><div class="card-wrapper-wide" align="left">${itemHTML}</div></div>`;

  if (labelsEnabled === true) {
    for (let index = 0; index < assignedLabels.length; index++) {
      addLabel(assignedLabels[index].name);
    }
  }
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
  if (response.status === 200 || response.status === 201) {
    showMessage(`${item} was updated`, false);
  } else {
    showMessage(`${item} was not updated`, true);
  }
};

const showResponseOnlyOnFailure = (response, item) => {
  if (response.status === 200 || response.status === 201) {
    // showMessage(`${item} was updated`, false);
  } else {
    showMessage(`${item} was not updated`, true);
  }
};

// TODO:INVOKE_BUG: current article is deleted, but not the comments.
// If You add new article with this ID - it will have comments from deleted article
const issueDeleteRequest = (id, responseHandler) => {
  // delete data on the server:
  const url = articlesEndpoint + "/" + id;
  fetch(url, { method: "delete", headers: formatHeaders() })
    .then((response) => {
      showResponseOnDelete(response, "Article");
      return response.json();
    })
    .then(responseHandler);
};

const issueArticlePostRequest = (data, responseHandler) => {
  // create data on the server:
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
const issueCommentPostRequest = (data, responseHandler) => {
  // create data on the server:
  fetch(commentsEndpoint, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
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

      if (labelsEditEnabled === true) {
        issueUpdateLabels(articleLabelId, article_id, selectedLabels).then((response) => {
          showResponseOnlyOnFailure(response, "Article labels");
          handleLabelsRefresh().then((x) => {
            if (labelsEnabled === true) {
              for (let index = 0; index < assignedLabels.length; index++) {
                addLabel(assignedLabels[index].name);
              }
            }
          });
        });
      }

      handleLabelsRefresh().then((x) => {
        if (labelsEnabled === true) {
          for (let index = 0; index < assignedLabels.length; index++) {
            addLabel(assignedLabels[index].name);
          }
        }
      });
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

      if (labelsEnabled === true) {
        for (let index = 0; index < assignedLabels.length; index++) {
          addLabel(assignedLabels[index].name);
        }
      }
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
  const data = {
    article_id: article_id,
    body: container.querySelector("#body").value,
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
  if (document.querySelector("#add-new")) {
    document.querySelector("#add-new").onclick = () => {
      window.scrollTo(0, 0);
      const container = document.querySelector(".add-new-panel");
      container.querySelector(".body").value = "";
      container.querySelector("#body").value = "";
      container.classList.add("active");
    };
  }
  if (document.querySelector("#add-new-comment")) {
    document.querySelector("#add-new-comment").onclick = () => {
      window.scrollTo(0, 0);
      const container = document.querySelector(".add-new-panel");
      container.querySelector(".body").value = "";
      container.querySelector("#body").value = "";
      container.classList.add("active");
    };
  }
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
    const btn2 = document.querySelector("#add-new");

    // TODO:INVOKE_BUG: remove if to have a Bug - button Add Comment is duplicated
    if (btn2 === undefined || btn2 === null) {
      appendElementOnTop(articleAdditionalMenuOnPage, "containerCommentsQuickMenu");
    }

    // TODO:INVOKE_BUG: remove if to have a Bug - button Add Comment is duplicated
    if (btn === undefined || btn === null) {
      appendElementOnTop(articleAdditionalMenuOnPage, "containerComments");
    }

    if (document.querySelector("#add-new")) {
      document.querySelector("#add-new").disabled = false;
    }
    if (document.querySelector("#add-new-comment")) {
      document.querySelector("#add-new-comment").disabled = false;
    }
  }
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
    for (let elem of document.querySelectorAll(".delete")) {
      elem.onclick = handleDelete;
      elem.disabled = false;
    }
    for (let elem of document.querySelectorAll(".edit")) {
      elem.onclick = showEditForm;
      elem.disabled = false;
    }
    for (let elem of document.querySelectorAll(".editName")) {
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
  const cardElement = document.querySelector(".card-wrapper-wide");
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

  let labelsElement = "";
  if (labelsEditEnabled === true) {
    labelsElement = `
      <div style="position: relative;">
        <label for="labelInput">enter a label:</label>
        <span>
          <input type="text" id="labelInput" oninput="updateMatchingLabels()" onkeydown="handleKeyPress(event)">
          <div id="matchingLabelsDropdown"></div>
        </span>
      </div>
      <div style="position: relative;">
        <label for="labels-container">labels:</label>
        <div class="labels-container" id="labels-container" ></div>
      </div>`;
  }

  container.innerHTML = `
        <div style="margin-top:7px; width:500px;">
            <label>id:</label><span>${item.id}</span><br>
            <label>title:</label>
            <input type="text" id="title" data-testid="title-input" value="${item.title}"><br>
            </br>
            ${labelsElement}
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

  if (labelsEditEnabled === true) {
    for (let index = 0; index < assignedLabels.length; index++) {
      addLabel(assignedLabels[index].name, true);
    }
  }
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
  issueGetRequest(article_id).then((wasDisplayed) => {
    checkIfFeatureEnabled("feature_likes").then((isEnabled) => {
      if (!isEnabled) return;
      issueGetLikes(article_id).then((likes) => {
        issueGetMyLikesForArticle(article_id).then((myLikes) => {
          const container = document.querySelector("#likes-container");
          container.innerHTML = formatLike(myLikes[article_id], likes, article_id);
        });
      });
    });
    checkIfFeatureEnabled("feature_visits").then((isEnabled) => {
      if (!isEnabled) return;
      issueGetVisitsForArticle(article_id).then((visits) => {
        const container = document.querySelector(".visits-container");
        container.innerHTML = formatVisits(visits[article_id], article_id);
      });
    });
    handleLabelsRefresh();
    checkIfFeatureEnabled("feature_user_bookmark_articles").then((isEnabled) => {
      if (!isEnabled) return;
      issueGetBookmarkedArticles(article_id).then((article_ids) => {
        const element = document.querySelector(`#bookmark-container`);
        element.innerHTML = formatBookmarkArticle(article_ids.includes(article_id), article_id);
      });
    });
  });
} else {
  const container = document.querySelector("#container");
  container.innerHTML =
    '<div align="center"><h1 style="text-align: center;" data-testid="no-results">No data</h1><div data-testid="no-results-details">Invalid article ID or article does not exist</div></div>';
}

async function handleLabelsRefresh() {
  checkIfFeatureEnabled("feature_labels").then((isEnabled) => {
    if (!isEnabled) return;

    labelsEnabled = isEnabled;
    labelsEditEnabled = isEnabled;
    issueGetLabelsForArticles([article_id]).then((labelsData) => {
      issueGetAllLabels().then((labels) => {
        allLabels = labels;
        labelOptions = labels.map((label) => label.name);
      });
      if (labelsData.labels === undefined || labelsData.labels[article_id] === undefined) {
        return;
      }
      articleLabelId = labelsData.labels[article_id].id;
      const labelIds = [...new Set(Object.values(labelsData.labels).flatMap((item) => item.label_ids || []))];
      issueGetLabels(labelIds).then((labelData) => {
        const container = document.querySelector("#labels-container");
        container.innerHTML = "";
        assignedLabels = labelData;
        labelIds.forEach((labelId) => {
          const label = labelData.find((lbl) => lbl.id === labelId);
          container.innerHTML += formatLabelElement(label).outerHTML;
        });
      });
    });
  });
}

if (msg !== undefined) {
  showMessage(decodeURIComponent(msg), false);
}

async function bookmarkArticle(articleId) {
  const data = {
    article_id: articleId,
  };
  fetch(articleBookmarkEndpoint, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
      userid: getId(),
    },
    body: JSON.stringify(data),
  })
    .then((r) => r.json())
    .then((body) => {
      const element = document.querySelector(`#bookmark-container`);
      element.innerHTML = formatBookmarkArticle(body.article_ids.includes(articleId), articleId);
    });
}

async function updateBookmarkElements() {
  const isEnabled = await checkIfFeatureEnabled("feature_user_bookmark_articles");
  if (!isEnabled) return;

  const elements = document.querySelectorAll(".bookmark-container");
  const ids = [];
  elements.forEach((element) => {
    ids.push(element.id.split("-").slice(-1)[0]);
  });
  issueGetBookmarkedArticles().then((aricleIds) => {
    const stringArticleIds = aricleIds.map(String);
    elements.forEach((element) => {
      const id = element.id.split("-").slice(-1)[0];
      element.innerHTML = formatBookmarkArticle(stringArticleIds.includes(id.toString()), id);
    });
  });
}

function updateMatchingLabels() {
  const input = document.getElementById("labelInput");
  const inputValue = input.value.trim().toLowerCase();
  const matchingLabelsDropdown = document.getElementById("matchingLabelsDropdown");
  matchingLabelsDropdown.innerHTML = "";

  let matchedLabels = labelOptions.filter((label) => label.toLowerCase().includes(inputValue));

  if (matchedLabels.length > 0) {
    matchingLabelsDropdown.style.display = "block";
    matchedLabels = [...new Set(matchedLabels)];
    matchedLabels.forEach((matchedLabel) => {
      const labelLink = document.createElement("a");
      labelLink.textContent = matchedLabel;
      labelLink.setAttribute("name", matchedLabel);
      labelLink.addEventListener("click", () => selectMatchingLabel(matchedLabel));
      matchingLabelsDropdown.appendChild(labelLink);
    });
  } else {
    matchingLabelsDropdown.style.display = "none";
  }
}

function handleKeyPress(event) {
  const matchingLabelsDropdown = document.getElementById("matchingLabelsDropdown");
  const selectedLabel = matchingLabelsDropdown.querySelector(".selected");

  if (event.key === "Enter") {
    if (selectedLabel) {
      addLabel(selectedLabel.textContent, true);
    } else {
      const input = document.getElementById("labelInput");
      const customLabel = input.value.trim();
      if (customLabel) {
        addLabel(customLabel, true);
      }
    }
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    handleArrowKeyPress(event.key);
  }
}

function handleArrowKeyPress(key) {
  const matchingLabelsDropdown = document.getElementById("matchingLabelsDropdown");
  const selectedLabel = matchingLabelsDropdown.querySelector(".selected");

  const labelLinks = matchingLabelsDropdown.querySelectorAll("a");
  const currentIndex = selectedLabel ? Array.from(labelLinks).indexOf(selectedLabel) : -1;
  let nextIndex;

  if (key === "ArrowDown") {
    nextIndex = currentIndex < labelLinks.length - 1 ? currentIndex + 1 : 0;
  } else if (key === "ArrowUp") {
    nextIndex = currentIndex > 0 ? currentIndex - 1 : labelLinks.length - 1;
  }

  labelLinks.forEach((labelLink, index) => {
    labelLink.classList.remove("selected");
    if (index === nextIndex) {
      labelLink.classList.add("selected");
    }
  });
}

function selectMatchingLabel(label) {
  const input = document.getElementById("labelInput");
  input.value = label;
  updateMatchingLabels();
}

function addLabel(selectedLabel, showRemoveButton) {
  const labelContainer = document.getElementById("labels-container");

  if ([...labelContainer.children].length >= 3) {
    return false;
  }

  const isLabelAlreadyAdded = [...labelContainer.children].some((label) => label.children[0].id === selectedLabel);

  const labelExists = labelOptions.some((label) => label === selectedLabel);

  if (!labelExists) {
    return false;
  }

  if (!isLabelAlreadyAdded) {
    labelOptions.push(selectedLabel);
  }

  if (!isLabelAlreadyAdded) {
    let selectedLabelObject = allLabels.find((label) => label.name === selectedLabel);
    if (selectedLabelObject === undefined) {
      selectedLabelObject = {
        name: selectedLabel,
      };
    }
    let label = formatLabelElement(selectedLabelObject, showRemoveButton, (id) => {
      selectedLabels = selectedLabels.filter((element) => element !== id);
    });
    labelContainer.appendChild(label);
    selectedLabels.push(selectedLabelObject.id);
  }

  const labelInput = document.getElementById("labelInput");
  if (labelInput) {
    labelInput.value = "";
  }

  const matchingLabelsDropdown = document.getElementById("matchingLabelsDropdown");
  if (matchingLabelsDropdown) {
    matchingLabelsDropdown.innerHTML = "";
  }

  return true;
}

window.addEventListener("click", function (event) {
  const matchingLabelsDropdown = document.getElementById("matchingLabelsDropdown");
  if (!event.target.matches("#labelInput") && event.target.matches("a") && matchingLabelsDropdown !== null) {
    const wasAdded = addLabel(matchingLabelsDropdown.textContent.trim(), true);
    matchingLabelsDropdown.style.display = "none";
    const labelInput = document.getElementById("labelInput");
    if (labelInput) {
      labelInput.value = "";
    }
    if (!wasAdded) {
      const labelContainer = document.getElementById("labels-container");
      if ([...labelContainer.children].length >= 3) {
        showMessage(`Only 3 labels can be added`, true);
      }
    }
  } else if (matchingLabelsDropdown !== null) {
    matchingLabelsDropdown.style.display = "none";
  }
});
