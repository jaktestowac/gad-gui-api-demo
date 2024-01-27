const articlesLikesEndpoint = "../../api/likes/top/articles";
const articleLikesEndpoint = "../../api/likes/article";
const articlesEndpoint = "../../api/articles";
const likesEndpoint = "../../api/likes";
const usersEndpoint = "../../api/users";
const myLikesEndpoint = "../../api/likes/article/mylikes";
const articleVisitsEndpoint = "../../api/visits/articles";
const topArticleVisitsEndpoint = "../../api/visits/top/articles";
const articleBookmarkEndpoint = "../../api/bookmarks/articles";

const intervalValue = 60000;

async function issueGetVisitsForArticles(articleIds) {
  const formattedIds = articleIds.join(",");
  const visitsData = await fetch(`${articleVisitsEndpoint}?ids=${formattedIds}`, {
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

async function getUsers(articlesData) {
  const userIds = [];
  for (let i = 0; i < articlesData.length; i++) {
    if (articlesData[i].user_id !== undefined && !userIds.includes(articlesData[i].user_id)) {
      userIds.push(articlesData[i].user_id);
    }
  }
  userIds.push(getId());
  const queryId = `${userIds.join("&id=")}`;
  const userUrlQuery = `${usersEndpoint}?id=${queryId}`;

  const users = await fetch(userUrlQuery, { headers: formatHeaders() }).then((r) => r.json());

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

  return articlesData;
}

async function getArticles(articleIds) {
  // get article
  const articlesUrl = `${articlesEndpoint}?id=${articleIds.join("&id=")}`;
  let articleData = await fetch(articlesUrl, { headers: formatHeaders() }).then((r) => r.json());
  return articleData;
}

async function issueGetBookmarkedArticles() {
  const bookmarksData = await fetch(articleBookmarkEndpoint, { headers: formatHeaders() }).then((r) => r.json());
  return bookmarksData.article_ids;
}

async function issueGetLikes(article_id) {
  const isEnabled = await checkIfFeatureEnabled("feature_likes");
  if (!isEnabled) return;

  const likesData = await fetch(`${articleLikesEndpoint}/${article_id}`, { headers: formatHeaders() }).then((r) =>
    r.json()
  );
  return likesData.likes;
}

async function getTopVisitedArticles() {
  const isEnabled = await checkIfFeatureEnabled("feature_visits");
  if (!isEnabled) return;

  const visitsData = await fetch(topArticleVisitsEndpoint, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return visitsData;
}

async function getTopLikedArticles() {
  const isEnabled = await checkIfFeatureEnabled("feature_likes");
  if (!isEnabled) return;

  const likesData = await fetch(articlesLikesEndpoint, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return likesData.likes;
}

const getImagesHTML = (image) => {
  let htmlData = "";
  if (image !== undefined) {
    htmlData += `<div align="center" ><img src="${image}" /></div>`;
  }
  return htmlData;
};

const displayPostsData = (data) => {
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

  return data;
};

const displayItem = (item, container) => {
  let itemHTML = formatArticleHtml(item);
  container.innerHTML += `
        <div class="card-wrapper" style="width: 800px; min-height:100px !important;";>${itemHTML}</div>
    `;
};

const formatArticleHtml = (item) => {
  return `<div id="article${item.id}" data-testid="article-${
    item.id
  }" style="display: flex;min-height:100px !important;margin:0px 20px 20px 0px !important;">
  <div style="flex: 1; text-align: left;">
      <a href="article.html?id=${item.id}" id="gotoArticle${item.id}" data-testid="article-${
    item.id
  }-link">${getImagesHTML(item.image)}</a>
  </div>
  <div style="flex: 2; text-align: left;">
      <div align="center" data-testid="article-${item.id}-title"><strong><a href="article.html?id=${item.id}">${
    item.title
  }</a></strong></div>
  <div align="center" style="" class="visits-container" id="visits-container-${
    item.id
  }" style="visibility: visible;"></div>
  <table>
    <tr>
      <td ><label style="width:10px !important; font-size:14px">user:</label>&nbsp&nbsp</td>
      <td><span><a href="user.html?id=${item.user_id}" id="gotoUser${item.user_id}-${item.id}" data-testid="article-${
    item.id
  }-user">${item.user_name}</a></span></td>
      <td rowspan="2" style="padding:0px !important" class="bookmark-container" id="bookmark-container-${item.id}"></td>
    </tr>
    
    <tr>
      <td ><label style="width:10px !important; font-size:14px">date:</label>&nbsp&nbsp</td>
      <td ><span data-testid="article-${item.id}-date">${item.date.replace("T", " ").replace("Z", "")}</span></td>
    </tr>
  </table><br>
    <div class="labels-container" id="labels-container-${item.id}" ></div>
      <label></label><span data-testid="article-${item.id}-body">${item.body?.substring(0, 200)} (...)</span><br>
      <div style="display: flex; justify-content: space-between;">
          <span style="display: flex; justify-content: flex-start;">
              <a href="article.html?id=${item.id}" id="seeArticle${item.id}">See More...</a>
          </span>
          <div class="likes-container" id="likes-container-${item.id}" style="visibility: visible;"></div>
      </div>
  </div>
</div>
`;
};

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

async function displayArticles(articleIds, likesData, myLikes) {
  getArticles(articleIds).then((articles) => {
    const sortedObjectList = articles.sort((a, b) => {
      const aIndex = articleIds.indexOf(a.id.toString());
      const bIndex = articleIds.indexOf(b.id.toString());
      return bIndex - aIndex;
    });

    getUsers(sortedObjectList).then((articles) => {
      displayPostsData(articles);
      if (likesData !== undefined) {
        for (let item of articles) {
          const articleId = item.id;
          const element = document.querySelector(`#likes-container-${articleId}`);
          const likeCount = likesData[articleId] ?? 0;
          element.innerHTML = formatLike(myLikes[articleId], likeCount, articleId);
        }
      }
      updateLabelElements();
      updateVisitsElements();
      updateBookmarkElements();
    });
  });
}

async function makeRequest(type) {
  const element = document.querySelector(`#title`);

  if (type === "visited") {
    element.innerHTML = `10 Most visited articles`;
    getTopVisitedArticles().then((visitsData) => {
      const articleIds = Object.keys(visitsData).sort((a, b) => visitsData[a] - visitsData[b]);
      getTopLikedArticles().then((likesData) => {
        issueGetMyLikesForArticles(articleIds).then((myLikes) => {
          displayArticles(articleIds, likesData, myLikes);
        });
      });
    });
  } else if (type === "liked") {
    element.innerHTML = `10 Most liked articles`;
    getTopLikedArticles()
      .then((likesData) => {
        const articleIds = Object.keys(likesData).sort((a, b) => likesData[a] - likesData[b]);
        issueGetMyLikesForArticles(articleIds).then((myLikes) => {
          displayArticles(articleIds, likesData, myLikes);
        });
      })
      .catch((err) => {
        console.log("Error", err);
      });
  } else if (type === "bookmarked") {
    element.innerHTML = `Bookmarked articles`;
    issueGetBookmarkedArticles()
      .then((articleIds) => {
        issueGetLikesForArticles(articleIds).then((likesData) => {
          issueGetMyLikesForArticles(articleIds).then((myLikes) => {
            displayArticles(articleIds, likesData, myLikes);
          });
        });
      })
      .catch((err) => {
        console.log("Error", err);
      });
  }
}

const type = getParams()["type"] ?? "liked";

setInterval(() => makeRequest(type), intervalValue);

makeRequest(type);
