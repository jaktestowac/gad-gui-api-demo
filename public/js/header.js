const hamburgerMenu = () => {
  return `
    <div class="hamburger">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
    </div>
    `;
};

const articlesAdditionalMenu = `
<a class="menu-link">
<button hidden id="add-new" class="button-primary">Add Article</button></a>
<a href="./articlesupload.html" class="menu-link">
  <button id="upload-new" class="button-primary">Upload</button>
</a>
`;

const articleAdditionalMenu = `
<button id="add-new-comment" class="button-primary" disabled>Add Comment</button>
`;

const articleAdditionalMenuOnPage = `
<div align="center">
  <button id="add-new" class="button-primary" disabled>Add Comment</button>
</div>
`;

function randomArticleLinkOnPage(id) {
  return `
  <a href="/article.html?id=${id}" class="menu-link">
  <button id="add-new" class="button-primary">Visit article</button>
</a>
`;
}

const userAdditionalMenu = `
<a href="/register.html" class="menu-link">
  <button id="add-new" class="button-primary">Register</button>
</a>
`;

const mainGUIMenuHTML = (path = "") => {
  return `
  <a href="${path}/articles.html" class="menu-link">
    <button id="btnArticles" data-testid="open-articles" class="button-primary">Articles</button>
  </a>
  <a href="${path}/comments.html" class="menu-link">
    <button id="btnComments" data-testid="open-comments" class="button-primary">Comments</button>
  </a>
  `;
};

const mainGUIMenuHTMLLogged = (path = "") => {
  const mainGuiMenu = `
  <a href="${path}/users.html" class="menu-link">
    <button id="btnUsers" data-testid="open-users" class="button-primary">Users</button>
  </a>
  <a href="${path}/stats/stats.html" class="menu-link">
    <button id="btnStats" data-testid="open-stats" class="button-primary">Statistics</button>
  </a>
  <span id="additionalMenu"></span>
  <span hidden id="menu-more">|| </span>
  `;

  return mainGuiMenu;
};

const mainProjectsGUIMenuHTMLLogged = (path = "") => {
  const mainGuiMenu = `
  `;

  return mainGuiMenu;
};

const mainAPIMenuHTML = `
<a href="/tools/index.html">
  <button id="btnTools" data-testid="btn-tools" class="button-primary">Tools</button>
</a>
<a href="/tools/swagger.html">
  <button id="btnSwagger" data-testid="btn-swagger" class="button-primary">Swagger</button>
</a>
<a href="/tools/version.html">
  <button id="btnVersion" data-testid="btn-version" class="button-primary">Version</button>
</a>

`;

const mainMenuHTML = `

`;

const logoGAD = (path = "/") => {
  return `
 <a href="${path}" style="text-decoration: none; color: inherit; padding-right:5px;">🦎 GAD</a>
 `;
};

const rightMenu = (path = "") => {
  return `
    <span style="display: flex; align-items: center; justify-self: end; padding-right: 20px">
    <span id="languageSelect"></span>
    <div class="dropdown" data-testid="user-dropdown">
      <button id="dropbtn" data-testid="btn-dropdown" class="dropbtn">
        <img id="avatar"
          src="${path}/data/icons/user.png"
          style="width: 30px !important; height: 30px !important; padding: 0"
          alt=""
        />
      </button>
      <div class="dropdown-content" id="dropdown-content">
        <div align="center"><strong><div style="margin: 5px" id="username"></div></strong></div>
        <a href="/login" id="loginBtn">My Account</a>
        <a href="/logout" id="logoutBtn" hidden>Logout</a>
        <a href="/register.html" id="registerBtn">Register</a>
      </div>
    </div>
    <a href="/tools/backoffice.html" style="text-decoration: none; color: white; margin-right: 15px;" >
   
    <div class="hovertext" data-hover="Visit Backoffice Tools">
      <img
        src="${path}/data/icons/gear.png"
        style="width: 30px !important; height: 30px !important; padding: 0"
        alt=""
    /></div></a>
    <a href="https://jaktestowac.pl" style="text-decoration: none; color: white" target="_blank" rel="noopener">
    <div class="hovertext" data-hover="Visit jaktestowac.pl">
      <img
        src="${path}/data/icons/favicon.png"
        style="width: 30px !important; height: 30px !important; padding: 0"
        alt=""
    /></div></a>
    <a
      href="https://jaktestowac.pl"
      style="text-decoration: none; color: white; padding: 10px"
      target="_blank"
      rel="noopener"
      ></a
    >
  </span>
  `;
};

const footerHTML = (date) => {
  return `
    <footer>
    <div class="container">
    Version: <span id="version"></span>
    &copy; Copyright ${date}
  <a href="https://jaktestowac.pl" target="_blank" rel="noopener">jaktestowac.pl</a>
  </div>
  </footer>
  `;
};

function getCookieAvatar() {
  let avatar = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith("avatar=")) {
      avatar = cookie.split("=")[1];
      avatar = decodeURIComponent(avatar);
    }
  }
  return avatar;
}

const addMainMenuAndFooter = () => {
  let menuContainerLeft = "";
  const email = getCookieEmail();
  let mainNavMenu = document.querySelector(".main-nav-menu");
  if (document.querySelector("#menu-main-gui-login")) {
    mainNavMenu.innerHTML = hamburgerMenu() + mainNavMenu.innerHTML;
    let path = "";
    menuContainerLeft = document.querySelector("#menu-main-gui-login");
    menuContainerLeft.innerHTML = logoGAD() + mainGUIMenuHTML(path);
    if (email) menuContainerLeft.innerHTML += mainGUIMenuHTMLLogged(path);
    menuContainerLeft.insertAdjacentHTML("afterend", rightMenu(path));
  }
  if (document.querySelector("#menu-main-gui")) {
    mainNavMenu.innerHTML = hamburgerMenu() + mainNavMenu.innerHTML;
    menuContainerLeft = document.querySelector("#menu-main-gui");
    menuContainerLeft.innerHTML = logoGAD() + mainGUIMenuHTML();
    if (email) menuContainerLeft.innerHTML += mainGUIMenuHTMLLogged();
    menuContainerLeft.insertAdjacentHTML("afterend", rightMenu());
  }
  if (document.querySelector("#menu-main-gui-projects")) {
    mainNavMenu.innerHTML = hamburgerMenu() + mainNavMenu.innerHTML;
    menuContainerLeft = document.querySelector("#menu-main-gui-projects");
    menuContainerLeft.innerHTML = logoGAD();
    if (email) menuContainerLeft.innerHTML += mainProjectsGUIMenuHTMLLogged();
    menuContainerLeft.insertAdjacentHTML("afterend", rightMenu());
  }
  if (document.querySelector("#menu-main-api")) {
    mainNavMenu.innerHTML = hamburgerMenu() + mainNavMenu.innerHTML;
    let path = "";
    menuContainerLeft = document.querySelector("#menu-main-api");
    menuContainerLeft.innerHTML = logoGAD() + mainAPIMenuHTML;
    menuContainerLeft.insertAdjacentHTML("afterend", rightMenu());
  }
  if (document.querySelector("#menu-main")) {
    menuContainerLeft = document.querySelector("#menu-main");
    menuContainerLeft.innerHTML = logoGAD();
    menuContainerLeft.insertAdjacentHTML("afterend", rightMenu());
  }
  const body = document.querySelector("body");
  body.insertAdjacentHTML("beforeend", footerHTML(new Date().getFullYear()));

  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const menuMainApi = document.querySelector("#menu-main-api");

  let avatar = getCookieAvatar();

  if (avatar !== undefined && avatar !== null && avatar.length > 0) {
    if (menuMainApi !== undefined) {
      const avatarElement = document.querySelector("#avatar");
      if (avatarElement) avatarElement.src = `./../${avatar}`;
    } else {
      const avatarElement = document.querySelector("#avatar");
      if (avatarElement) avatarElement.src = avatar;
    }
  }

  if (hamburger) {
    hamburger.addEventListener("click", mobileMenu);
  }

  function mobileMenu() {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
  }
};

addMainMenuAndFooter();
