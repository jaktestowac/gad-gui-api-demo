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

checkIfFeatureEnabled("feature_files").then((isEnabled) => {
  if (isEnabled) {
    const container = document.querySelector("#additionalBtns");
    container.innerHTML += `<a href="./files.html" class="menu-link">
            <button id="btnFiles" data-testid="open-files" class="button-primary" >📁</button>
         </a>`;
  }
});

const editAccountButton = document.querySelector("#btnEditLink");
editAccountButton.setAttribute("href", `/user.html?id=${getId()}`);

const articlesLinkButton = document.querySelector("#btnArticlesLink");
articlesLinkButton.setAttribute("href", `/articles.html?user_id=${getId()}`);
