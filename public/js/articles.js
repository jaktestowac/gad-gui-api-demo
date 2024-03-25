const articlesEndpoint = "../../api/articles";
const usersEndpoint = "../../api/users";
const articleLikesEndpoint = "../../api/likes/article";
const likesEndpoint = "../../api/likes";
const myLikesEndpoint = "../../api/likes/article/mylikes";
const pictureListEndpoint = "../../api/images/posts";
const visitsEndpoint = "../../api/visits/articles";
const articleBookmarkEndpoint = "../../api/bookmarks/articles";
let picList = [];
let users = [];
let articlesData = [];

let totalElementCount = 0;
let searchPhrase = undefined;

const fetchData = {
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
};

async function issueGetVisitsForArticles(articleIds) {
  const formattedIds = articleIds.join(",");
  const visitsData = await fetch(`${visitsEndpoint}?ids=${formattedIds}`, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return visitsData;
}

async function issueGetMyLikesForArticles(articleIds) {
  const formattedIds = articleIds.join("&id=");
  const likesData = await fetch(`${myLikesEndpoint}?id=${formattedIds}`, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return likesData.likes;
}

async function issueGetLikesForArticles(articleIds) {
  const formattedIds = articleIds.join("&id=");
  const likesData = await fetch(`${articleLikesEndpoint}?id=${formattedIds}`, { headers: formatHeaders() }).then((r) =>
    r.json()
  );
  return likesData.likes;
}

async function issueGetBookmarkedArticles() {
  const bookmarksData = await fetch(articleBookmarkEndpoint, { headers: formatHeaders() }).then((r) => r.json());
  return bookmarksData.article_ids;
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
      const element = document.querySelector(`#bookmark-container-${articleId}`);
      element.innerHTML = formatBookmarkArticle(body.article_ids.includes(articleId), articleId);
    });
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
        const element = document.querySelector(`#likes-container-${articleId}`);
        element.innerHTML = formatLike(body.id !== undefined, likes, articleId);
      });
    });
}

async function issueGetRequest(
  limit = 6,
  page = 1,
  searchPhrase = undefined,
  onlyDisplay = false,
  sortingType = "date",
  sortingOrder = "desc"
) {
  // get data from the server:

  if (!onlyDisplay) {
    let articlesEndpointPaged = `${articlesEndpoint}?_limit=${limit}&_page=${page}&_sort=${sortingType}&_order=${sortingOrder}`;

    if (search_user_id !== undefined) {
      articlesEndpointPaged += `&user_id=${search_user_id}`;
    }

    if (searchPhrase !== undefined && searchPhrase.length > 0) {
      articlesEndpointPaged += `&q=${searchPhrase}`;
    }
    const results = await Promise.all(
      [articlesEndpointPaged].map((url) =>
        fetch(url, { headers: formatHeaders() }, fetchData).then((r) => {
          totalElementCount = r.headers.get("X-Total-Count");
          return r.json();
        })
      )
    );
    articlesData = results[0];

    const userIds = [];
    for (let i = 0; i < articlesData.length; i++) {
      if (articlesData[i].user_id !== undefined && !userIds.includes(articlesData[i].user_id)) {
        userIds.push(articlesData[i].user_id);
      }
    }
    userIds.push(getId());
    const queryId = `${userIds.join("&id=")}`;
    const userUrlQuery = `${usersEndpoint}?id=${queryId}`;

    const userResults = await Promise.all(
      [userUrlQuery].map((url) => fetch(url, { headers: formatHeaders() }, fetchData).then((r) => r.json()))
    );

    users = userResults[0];

    for (let i = 0; i < articlesData.length; i++) {
      for (let j = 0; j < users.length; j++) {
        if (users[j].id?.toString() === articlesData[i].user_id?.toString()) {
          articlesData[i].user_name = `${users[j].firstname}`;
          if (getId()) articlesData[i].user_name += ` ${users[j].lastname}`;
          articlesData[i].user_id = users[j].id;
          break;
        }
      }
      if (articlesData[i].user_name === undefined) {
        for (let j = 0; j < users.length; j++) {
          if (users[j].id?.toString() === articlesData[i].user_id?.toString()) {
            articlesData[i].user_name = `${users[j].firstname} ${users[j].lastname}`;
            articlesData[i].user_id = users[j].id;
            break;
          }
        }
      }
      if (articlesData[i].user_name === undefined) {
        articlesData[i].user_name = "Unknown user";
      }
    }
  }
  return articlesData;
}

async function displayArticlesData(articlesData) {
  displayPostsData(articlesData);

  if (search_user_id !== undefined) {
    const foundUser = users.find((user) => `${user.id}` === search_user_id);

    if (foundUser !== undefined) {
      document.querySelector(
        "#postsByUserName"
      ).innerHTML = `<b>Articles by ${foundUser.firstname} ${foundUser.lastname}</b>`;
      const btnArticles = document.querySelector("#btnArticles");
      btnArticles.disabled = false;
      btnArticles.classList.remove("button-disabled");
      btnArticles.classList.add("button-primary");

      document.title = `🦎 GAD | Articles by ${foundUser.firstname} ${foundUser.lastname}`;
    }
  }

  attachEventHandlers(getId());
  return true;
}

const attachEventHandlers = (user_id) => {
  if (user_id === undefined) {
    return;
  }

  appendMenu(articlesAdditionalMenu);

  document.querySelector("#add-new").onclick = () => {
    window.scrollTo(0, 0);
    const container = document.querySelector(".add-new-panel");
    container.querySelector(".body").value = "";
    container.querySelector(".title").value = "";
    for (let element of picList) {
      let opt = document.createElement("option");
      opt.value = element;
      opt.innerHTML = element; // whatever property it has

      container.querySelector(".image").appendChild(opt);
    }
    for (let element of users) {
      if (isAuthorized(element.id)) {
        let opt = document.createElement("option");
        opt.value = element.id;
        opt.innerHTML = `${element.firstname} ${element.lastname}`;

        container.querySelector(".user").appendChild(opt);
      }
    }
    presentPicture();
    container.classList.add("active");
  };
  document.querySelector(".close").onclick = () => {
    document.querySelector(".add-new-panel").classList.remove("active");
  };
  document.querySelector(".add-new-panel .cancel").onclick = () => {
    document.querySelector(".add-new-panel").classList.remove("active");
  };
  document.querySelector(".update.save").onclick = handleCreate;
  document.querySelector("#add-new").disabled = false;
};

let alertElement = document.querySelector(".alert");

const showResponseAndRedirect = (response) => {
  if (response.status === 201) {
    document.querySelector(".update").disabled = true;
    document.querySelector(".cancel").disabled = true;
    // showMessage("Article was created", false);
    response.json().then((data) => {
      const articleId = data.id;
      setTimeout(function () {
        window.location.href = `/article.html?id=${articleId}&msg=Article was created`;
      }, 0);
    });
  } else {
    showMessage("Article was not created", true);
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
  let newMessageElement = alertElement.cloneNode(true);
  alertElement.parentNode.replaceChild(newMessageElement, alertElement);
  alertElement = newMessageElement;
};

function pad(num, size = 2) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

const handleCreate = () => {
  const container = document.querySelector(".add-new-panel");

  const today = new Date();
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(
    today.getHours()
  )}:${pad(today.getMinutes())}:${pad(today.getSeconds())}Z`;

  let data = {
    title: container.querySelector(".title").value,
    body: container.querySelector(".body").value,
    date: date,
    image: `.\\data\\images\\256\\${container.querySelector(".image").value}`,
  };
  issueArticleRequest(data, issueGetRequest, searchPhrase);
};

const issueArticleRequest = (data, responseHandler) => {
  // create data on the server:
  fetch(articlesEndpoint, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(data),
  }).then((response) => showResponseAndRedirect(response));
  // .then(responseHandler);
};

const getImagesHTML = (image) => {
  let htmlData = "";
  if (image !== undefined) {
    htmlData += `<div align="center" ><img src="${image}" /></div>`;
  }
  return htmlData;
};

const getItemHTML = (item) => {
  return `<div id="article${item.id}" data-testid="article-${item.id}">
  <a href="article.html?id=${item.id}" id="gotoArticle${item.id}" data-testid="article-${item.id}-link">${getImagesHTML(
    item.image
  )}</a><br>
  
  <div align="center" data-testid="article-${item.id}-title">
    <strong><a href="article.html?id=${item.id}">${item.title}</a></strong>
  </div>
  
  <div align="center" style="" class="visits-container" id="visits-container-${
    item.id
  }" style="visibility: visible;"></div>
  <br>
  
  <table>
    <tr>
      <td style="padding: 0px;" ><label style="width:25px !important">user:</label>&nbsp&nbsp</td>
      <td style="padding: 0px;"><span><a href="user.html?id=${item.user_id}" id="gotoUser${item.user_id}-${
    item.id
  }" data-testid="article-${item.id}-user">${item.user_name}</a></span></td>
      <td rowspan="2" style="padding:0px !important" class="bookmark-container" id="bookmark-container-${item.id}"></td>
    </tr>
    
    <tr>
      <td style="padding: 0px;"><label style="width:25px !important">date:</label>&nbsp&nbsp</td>
      <td style="padding: 0px;"><span data-testid="article-${item.id}-date">${item.date
    .replace("T", " ")
    .replace("Z", "")}</span></td>
    </tr>
  </table>
  
  <div class="labels-container" id="labels-container-${item.id}"></div>
  
  <label></label><span data-testid="article-${item.id}-body">${item.body?.substring(0, 200)} (...)</span><br>
  
  <div style="display: flex; justify-content: space-between;">
    <span style="display: flex; justify-content: flex-start;">
      <a href="article.html?id=${item.id}" id="seeArticle${item.id}">See More...</a>
    </span>
    
    <div class="likes-container" id="likes-container-${item.id}" style="visibility: visible;"></div>
  </div>
</div>
`;
};

function presentPicture() {
  const userPicture = document.querySelector(".userPicture");
  userPicture.src = `.\\data\\images\\256\\${document.querySelector(".image").value}`;
}

const displayPostsData = (data) => {
  const container = document.querySelector("#container");
  container.innerHTML = formatPostsData(data);
};

const formatPostsData = (data, suppressNoDataMsg = false) => {
  let innerHTML = "";
  for (let item of data) {
    innerHTML += `<div class="card-wrapper" >${getItemHTML(item)}</div>`;
  }
  if (data.length === 0 && suppressNoDataMsg === false) {
    innerHTML += `
        <div align="center"><h1 style="text-align: center;"data-testid="no-results">No data</h1></div>
    `;
  }

  return innerHTML;
};

async function getPictureList() {
  picList = await Promise.all(
    [pictureListEndpoint].map((url) => fetch(url, { headers: formatHeaders() }).then((r) => r.json()))
  );
  picList = picList[0];
  picList.sort(function () {
    return 0.5 - Math.random();
  });
}

let current_page = 1;
let records_per_page = 6;
let sortingType = "date";
let sortingOrder = "desc";

let search_user_id = getParams()["user_id"];

getPictureList();
updatePerPage();
updateSorting();

checkIfFeatureEnabled("feature_infinite_scroll_articles").then((isEnabled) => {
  if (isEnabled === true) {
    document.addEventListener("scroll", checkScroll);

    if (getId() !== undefined) {
      appendMenu(articlesAdditionalMenu);
    }
    // const containerSpace = document.querySelector(".container-space");
    // containerSpace.style.marginTop = "0px";
    // Initial check when the page loads
    checkScroll();
  } else {
    issueGetRequest(records_per_page, current_page, searchPhrase, undefined, sortingType, sortingOrder).then((data) => {
      displayArticlesData(data).then(() => {
        changePage(current_page, true);
      });
    });
  }
});

async function updateBookmarkElements() {
  const isEnabled = await checkIfFeatureEnabled("feature_user_bookmark_articles");
  if (!isEnabled) return;

  const elements = document.querySelectorAll(".bookmark-container");
  const ids = [];
  elements.forEach((element) => {
    ids.push(element.id.split("-").slice(-1)[0]);
  });
  issueGetBookmarkedArticles().then((aricleIds) => {
    const stringArticleIds = (aricleIds ?? []).map(String);
    elements.forEach((element) => {
      const id = element.id.split("-").slice(-1)[0];
      element.innerHTML = formatBookmarkArticle(stringArticleIds.includes(id.toString()), id);
    });
  });
}

async function updateVisitsElements() {
  const isEnabled = await checkIfFeatureEnabled("feature_visits");
  if (!isEnabled) return;

  const elements = document.querySelectorAll(".visits-container");
  const ids = [];
  elements.forEach((element) => {
    ids.push(element.id.split("-").slice(-1)[0]);
  });
  issueGetVisitsForArticles(ids).then((visits) => {
    elements.forEach((element) => {
      const id = element.id.split("-").slice(-1)[0];
      const visitsNumber = visits[id];

      element.innerHTML = formatVisits(visitsNumber, id);
    });
  });
}

async function updateLikeElements() {
  const isEnabled = await checkIfFeatureEnabled("feature_likes");
  if (!isEnabled) return;

  const elements = document.querySelectorAll(".likes-container");
  const ids = [];
  elements.forEach((element) => {
    ids.push(element.id.split("-").slice(-1)[0]);
  });
  issueGetLikesForArticles(ids).then((likes) => {
    issueGetMyLikesForArticles(ids).then((myLikes) => {
      elements.forEach((element) => {
        const id = element.id.split("-").slice(-1)[0];
        const likesNumber = likes[id];
        const alreadyLiked = myLikes[id];

        element.innerHTML = formatLike(alreadyLiked, likesNumber, id);
      });
    });
  });
}

// pagination:

function changeItemsPerPage() {
  updatePerPage();
  current_page = 1;
  changePage(current_page);
}

function updatePerPage() {
  let options = document.getElementById("perPage");
  records_per_page = options.value;
}

function prevPage() {
  if (current_page > 1) {
    current_page--;
    changePage(current_page);
  }
}

function nextPage() {
  if (current_page < numPages()) {
    current_page++;
    changePage(current_page);
  }
}

function changePage(page, onlyDisplay = false) {
  let btnNext = document.getElementById("btnNext");
  let btnPrev = document.getElementById("btnPrev");
  let container = document.getElementById("container");
  let pageSpan = document.getElementById("page");
  let pagesTotal = document.getElementById("pagesTotal");

  // Validate page
  if (page < 1) page = 1;
  if (page > numPages()) page = numPages();

  container.innerHTML = "";

  // let articlesDataForPage = [];
  // for (let i = (page - 1) * records_per_page; i < page * records_per_page && i < articlesData.length; i++) {
  //   articlesDataForPage.push(articlesData[i]);
  // }
  pageSpan.innerHTML = page;
  pagesTotal.innerHTML = numPages();

  if (page == 1) {
    // btnPrev.style.visibility = "hidden";
    btnPrev.disabled = true;
    btnPrev.style.color = "grey";
  } else {
    // btnPrev.style.visibility = "visible";
    btnPrev.disabled = false;
    btnPrev.style.color = "#0275d8";
  }

  if (page == numPages()) {
    // btnNext.style.visibility = "hidden";
    btnNext.disabled = true;
    btnNext.style.color = "grey";
  } else {
    // btnNext.style.visibility = "visible";
    btnNext.disabled = false;
    btnNext.style.color = "#0275d8";
  }
  issueGetRequest(records_per_page, page, searchPhrase, onlyDisplay, sortingType, sortingOrder).then((data) => {
    displayArticlesData(data).then(() => {
      updateLikeElements();
      updateLabelElements();
      updateVisitsElements();
      updateBookmarkElements();
    });
  });
}

function numPages() {
  return Math.ceil(totalElementCount / records_per_page);
}
menuButtonDisable("btnArticles");

function seachByText() {
  let searchInput = document.getElementById("search-input");
  searchPhrase = searchInput.value;
  issueGetRequest(records_per_page, current_page, searchPhrase, undefined, sortingType, sortingOrder).then((data) => {
    displayArticlesData(data).then(() => {
      changePage(current_page, true);
    });
  });
}

// sorting:
function updateSorting() {
  let options = document.getElementById("sorting");
  sortingType = options.value.split(" ")[0];
  sortingOrder = options.value.split(" ")[1];
}

function changeSorting() {
  updateSorting();
  changeItemsPerPage();
}

/// infinite scroll:

let scrollLoading = false;

function appendContent(newContent) {
  const contentElement = document.querySelector("#container");

  contentElement.innerHTML += formatPostsData(newContent, true);
  scrollLoading = false;
}

function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function checkScroll() {
  const navigationBar = document.querySelector("#paginationController");
  navigationBar.style.display = "none";
  const loadingElement = document.getElementById("scroll-loading");
  loadingElement.innerHTML = "Loading...";

  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5 && scrollLoading === false) {
    scrollLoading = true;
    loadingElement.style.display = "block";

    // Fetch new content and append it to the page
    // delay displaying next element:
    const randomTime = getRandomValue(200, 1000);

    await sleep(randomTime).then((msg) => {
      issueGetRequest(records_per_page, current_page, searchPhrase, false, sortingType, sortingOrder).then((data) => {
        loadingElement.style.display = "none";
        if (data.length > 0) {
          appendContent(data);
          updateLikeElements();
          updateLabelElements();
          updateVisitsElements();
          updateBookmarkElements();
          current_page++;
          checkScroll();
        }
      });
    });
  }
}

const sleep = (time) => new Promise((res) => setTimeout(res, time));
