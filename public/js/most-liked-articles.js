const articlesLikesEndpoint = "../../api/likes/top/articles";
const articleLikesEndpoint = "../../api/likes/article";
const articlesEndpoint = "../../api/articles";
const likesEndpoint = "../../api/likes";
const myLikesEndpoint = "../../api/likes/article/mylikes";

const intervalValue = 60000;

async function getArticles(articleIds) {
  // get article
  const articlesUrl = `${articlesEndpoint}?id=${articleIds.join("&id=")}`;
  let articleData = await fetch(articlesUrl, { headers: formatHeaders() }).then((r) => r.json());
  return articleData;
}

async function issueGetMyLikesForArticles(articleIds) {
  const formattedIds = articleIds.join("&id=");
  const likesData = await fetch(`${myLikesEndpoint}?id=${formattedIds}`, {
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

async function getTopArticles() {
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
      <label>user:</label><span><a href="user.html?id=${item.user_id}" id="gotoUser${item.user_id}-${
    item.id
  }" data-testid="article-${item.id}-user">${item.user_name}</a></span><br>
      <label>date:</label><span data-testid="article-${item.id}-date">${item.date
    .replace("T", " ")
    .replace("Z", "")}</span><br>
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

function formatLike(alreadyLiked, likesNumber, articleId) {
  let out = "";
  if (alreadyLiked) {
    if (getBearerToken() === undefined) {
      out = `<div style="display: flex;justify-self: end"><div id="likes-button" >💗</div> <div id="likes-count" >${likesNumber}</div></div>`;
    } else {
      out = `<div style="display: flex;justify-self: end"><div id="likes-button" onclick="likeArticle(${articleId})" style="cursor: pointer;" >💗</div> <div id="likes-count" >${likesNumber}</div></div>`;
    }
  } else {
    if (getBearerToken() === undefined) {
      out = `<div style="display: flex;justify-self: end"><div id="likes-button" >🤍</div> <div id="likes-count" >${likesNumber}</div></div>`;
    } else {
      out = `<div style="display: flex;justify-self: end"><div id="likes-button" onclick="likeArticle(${articleId})" style="cursor: pointer;">🤍</div> <div id="likes-count" >${likesNumber}</div></div>`;
    }
  }
  return out;
}

async function makeRequest() {
  getTopArticles()
    .then((likesData) => {
      const articleIds = Object.keys(likesData).sort((a, b) => likesData[a] - likesData[b]);
      getArticles(articleIds).then((articles) => {
        const sortedObjectList = articles.sort((a, b) => {
          const aIndex = articleIds.indexOf(a.id.toString());
          const bIndex = articleIds.indexOf(b.id.toString());
          return bIndex - aIndex;
        });
        issueGetMyLikesForArticles(articleIds).then((myLikes) => {
          displayPostsData(articles);
          for (let item of articles) {
            const articleId = item.id;
            const element = document.querySelector(`#likes-container-${articleId}`);
            const likeCount = likesData[articleId];
            element.innerHTML = formatLike(myLikes[articleId], likeCount, articleId);
          }
        });
      });
    })
    .catch((err) => {
      console.log("Error", err);
    });
}

setInterval(makeRequest, intervalValue);

makeRequest();
