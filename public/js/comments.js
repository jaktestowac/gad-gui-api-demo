const articlesEndpoint = "../../api/articles";
const usersEndpoint = "../../api/users";
const commentsEndpoint = "../../api/comments";
let allComments = [];
let articlesData = [];
let usersData = [];
let userComments = [];
let totalElementCount = 0;
let searchPhrase = undefined;

const loaderContainer = document.querySelector(".loader-container");
const displayLoading = () => {
  loaderContainer.style.display = "block";
};

const hideLoading = () => {
  loaderContainer.style.display = "none";
};

const fetchData = {
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
};

async function issueGetRequest(
  limit = 6,
  page = 1,
  searchPhrase = undefined,
  onlyDisplay = false,
  displayDelay = 0,
  sortingType = "date",
  sortingOrder = "desc"
) {
  displayLoading();
  // get data from the server:
  if (!onlyDisplay) {
    let commentsEndpointPaged = `${commentsEndpoint}?_limit=${limit}&_page=${page}&_sort=${sortingType}&_order=${sortingOrder}`;

    if (searchPhrase !== undefined && searchPhrase.length > 0) {
      commentsEndpointPaged += `&q=${searchPhrase}`;
    }

    const results = await Promise.all(
      [commentsEndpointPaged].map((url) =>
        fetch(url, { headers: formatHeaders() }).then((r) => {
          totalElementCount = r.headers.get("X-Total-Count");
          return r.json();
        })
      )
    );

    userComments = results[0];

    await processCommentsData(userComments);
  }
  // userComments.sort(function (a, b) {
  //   let dateA = new Date(a.date),
  //     dateB = new Date(b.date);
  //   return dateB - dateA;
  // });
  allComments = userComments;
  hideLoading();
  await displayCommentsData(userComments, displayDelay);
}

async function processCommentsData(userComments) {
  const articleIds = [];
  for (let i = 0; i < userComments.length; i++) {
    if (userComments[i].article_id !== undefined && !articleIds.includes(userComments[i].article_id)) {
      articleIds.push(userComments[i].article_id);
    }
  }
  const articlesQueryId = `${articleIds.join("&id=")}`;
  const articlesUrlQuery = `${articlesEndpoint}?id=${articlesQueryId}`;

  const articleResults = await Promise.all(
    [articlesUrlQuery].map((url) => fetch(url, { headers: formatHeaders() }, fetchData).then((r) => r.json()))
  );
  articlesData = articleResults[0];

  const userIds = [];
  for (let i = 0; i < userComments.length; i++) {
    if (userComments[i].user_id !== undefined && !userIds.includes(userComments[i].user_id)) {
      userIds.push(userComments[i].user_id);
    }
  }
  userIds.push(getId());

  const userQueryId = `${userIds.join("&id=")}`;
  const userUrlQuery = `${usersEndpoint}?id=${userQueryId}`;

  const userResults = await Promise.all(
    [userUrlQuery].map((url) => fetch(url, { headers: formatHeaders() }, fetchData).then((r) => r.json()))
  );
  usersData = userResults[0];

  const tempUserData = {};
  const tempArticleData = {};

  for (let j = 0; j < usersData.length; j++) {
    const user_name = `${usersData[j].firstname} ${usersData[j].lastname}`;
    tempUserData[usersData[j].id.toString()] = user_name;
  }

  for (let i = 0; i < articlesData.length; i++) {
    tempArticleData[articlesData[i].id.toString()] = articlesData[i];
  }

  for (let j = 0; j < userComments.length; j++) {
    const user_id = userComments[j].user_id;
    const article_id = userComments[j].article_id;
    if (user_id !== undefined && tempUserData[user_id.toString()] !== undefined) {
      userComments[j].user_name = tempUserData[user_id.toString()];
    } else {
      userComments[j].user_name = "[Unknown]";
    }
    userComments[j].article = tempArticleData[article_id.toString()];
  }
}

// const getItemHTML = (item) => {
//     return `<div>
//         <label>user:</label><span><a href="user.html?id=${item.user_id}" id="gotoUser${item.user_id}-${item.id}">${item.user_name}</a></span><br>
//         <label>date:</label><span>${item.date}</span><br>
//         <span><strong>${item.title}</strong></span><br>
//         <span>${item.body?.substring(0, 200)} (...)</span><br>
//         <span><a href="article.html?id=${item.id}" id="gotoArticle${item.id}">See whole article...</a></span><br>
//         <br>
//         <hr>
//         <h3>Comments:</h3>
//         <hr>
//         ${getCommentsHTML(item.comments)}
//     </div>`;
// };

const getCommentHTML = (comment) => {
  if (comment.body === undefined || comment.body.length === 0) {
    comment.body = "<i>[Comment was removed]</i>";
  }
  return `<div>
        <label>article:</label></br><span><a href="article.html?id=${comment.article?.id}" data-testid="article-${
    comment.article?.id
  }-title" id="gotoArticle${comment.article?.id}">${comment.article?.title?.substring(0, 50)} (...)</a></span><br>
        <label>user:</label><span><a href="user.html?id=${comment.user_id}" data-testid="comment${
    comment.id
  }-user" data-testid="article-${comment.id}-title" id="gotoUser${comment.user_id}-${comment.id}">${
    comment.user_name
  }</a></span><br>
        <label>date:</label><span data-testid="comment${comment.id}-date">${comment.date
    .replace("T", " ")
    .replace("Z", "")}</span><br>
        <label>comment:</label><span data-testid="comment${comment.id}-body">${comment.body}</span><br>
        <span><strong><a href="comment.html?id=${comment.id}" id="gotoComment${
    comment.id
  }">See comment...</a></strong></span><br>
    </div>`;
};

const sleep = (time) => new Promise((res) => setTimeout(res, time));

async function displayCommentsData(data, delay = 0) {
  const container = document.querySelector("#container");
  container.innerHTML = "";
  for (let item of data) {
    displayItem(item, container);

    // delay displaying next element:
    if (delay !== undefined && delay > 0) {
      await sleep(delay).then((msg) => console.log(msg));
    }
  }
  if (data.length === 0) {
    container.innerHTML += `
        <div align="center"><h1 style="text-align: center;"data-testid="no-results">No data</h1></div>
    `;
  }
}

const displayItem = (item, container) => {
  if (item !== undefined && item.article !== undefined) {
    let itemHTML = getCommentHTML(item);
    container.innerHTML += `
            <div class="card-wrapper card-comment">${itemHTML}</div>
        `;
  }
};

function updatePerPage() {
  let options = document.getElementById("perPage");
  records_per_page = options.value;
}

function changeItemsPerPage() {
  updatePerPage();
  current_page = 1;
  changePage(current_page);
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
  issueGetRequest(records_per_page, page, searchPhrase, onlyDisplay, displayDelay, sortingType, sortingOrder);
}

function numPages() {
  return Math.ceil(totalElementCount / records_per_page);
}

let current_page = 1;
let records_per_page = 12;
let sortingType = "date";
let sortingOrder = "desc";

// TODO:INVOKE_BUG: stability issue - change this to slowly display new comments // issue on front-end
const displayDelay = 0; // [ms]

updatePerPage();
updateSorting();
issueGetRequest(records_per_page, current_page, searchPhrase, false, displayDelay, sortingType, sortingOrder).then(() =>
  changePage(current_page, true)
);
menuButtonDisable("btnComments");

function seachByText() {
  let searchInput = document.getElementById("search-input");
  searchPhrase = searchInput.value;
  issueGetRequest(
    records_per_page,
    current_page,
    searchPhrase,
    undefined,
    displayDelay,
    sortingType,
    sortingOrder
  ).then(() => changePage(current_page, true));
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
