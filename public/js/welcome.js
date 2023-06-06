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

const editAccountButton = document.querySelector("#btnEditLink");
editAccountButton.setAttribute("href", `/user.html?id=${getId()}`);

const articlesLinkButton = document.querySelector("#btnArticlesLink");
articlesLinkButton.setAttribute("href", `/articles.html?user_id=${getId()}`);
