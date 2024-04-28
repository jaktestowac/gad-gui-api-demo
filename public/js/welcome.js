function removeNotAvailableLabel() {
  const container = document.querySelector("#notAvailableLbl");
  if (container) {
    container.innerHTML = "";
  }
}

checkIfFeatureEnabled("feature_files").then((isEnabled) => {
  if (isEnabled) {
    removeNotAvailableLabel();
    const container = document.querySelector("#additionalBtns");
    container.innerHTML += `<a href="./files.html" class="menu-link">
            <button id="btnFiles" data-testid="open-files" class="button-primary" >📁 My files</button>
         </a><br /><br />`;
  }
});

checkIfFeatureEnabled("feature_user_bookmark_articles").then((isEnabled) => {
  if (isEnabled) {
    removeNotAvailableLabel();
    const container = document.querySelector("#additionalBtns");
    container.innerHTML += `<a href="./bookmarked.html?type=bookmarked" class="menu-link">
            <button id="btnBookmarks" data-testid="open-bookmarked" class="button-primary" >🏷️ Bookmarked articles</button>
         </a><br /><br />`;
  }
});

const visitMyAccountButtons = document.querySelectorAll(".btnMyAccountLink");
if (visitMyAccountButtons) {
  for (let button of visitMyAccountButtons) {
    button.setAttribute("href", `/user.html?id=${getId()}`);
  }
}

const articlesLinkButton = document.querySelector("#btnArticlesLink");
articlesLinkButton.setAttribute("href", `/articles.html?user_id=${getId()}`);

const commentsLinkButton = document.querySelector("#btnCommentsLink");
commentsLinkButton.setAttribute("href", `/comments.html?user_id=${getId()}`);

function deleteAccount() {
  const id = getId();

  const confirmation = confirm("Are you sure you want to delete your account?");
  if (confirmation === true) {
    if (id !== undefined) {
      const url = `./api/users/${id}`;
      fetch(url, { headers: formatHeaders(), method: "DELETE" })
        .then((response) => {
          if (response.ok) {
            window.location.href = "/logout";
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  } else {
    console.log("Account deletion cancelled");
  }
}

document.querySelector("#btnDeleteAccount").addEventListener("click", deleteAccount);

let avatar = getCookieAvatar();
const avatarElement = document.querySelector("#myAvatar");
if (avatarElement) {
  avatarElement.src = `./../${avatar}`;
}
