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
    let path = "..";
    menuContainerLeft = document.querySelector("#menu-main-gui-login");
    menuContainerLeft.innerHTML = logoGAD(path) + mainGUIMenuHTML(path);
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
  if (document.querySelector("#menu-main-api")) {
    mainNavMenu.innerHTML = hamburgerMenu() + mainNavMenu.innerHTML;
    let path = "..";
    menuContainerLeft = document.querySelector("#menu-main-api");
    menuContainerLeft.innerHTML = logoGAD(path) + mainAPIMenuHTML;
    menuContainerLeft.insertAdjacentHTML("afterend", rightMenu(path));
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

// Add additional buttons after login, if prevent from duplication of elements
// this method is used in js file for given view (i.e. articles.js)
const appendMenu = (html) => {
  if (document.querySelector("#menu-more").hasAttribute("hidden")) {
    const menuMore = document.querySelector("#menu-more");
    menuMore.removeAttribute("hidden");

    menuMore.insertAdjacentHTML("afterend", `${html}`);
  }
};

const appendElementOnTop = (html, id) => {
  const element = document.querySelector(`#${id}`);
  element.insertAdjacentHTML("afterbegin", `${html}`);
};

const injectLink = (link, id) => {
  const element = document.querySelector(`#${id}`);
  var a = document.createElement("a");
  a.appendChild(element.cloneNode(true));
  a.href = link;
  element.replaceWith(a);
};

// when user is on given view disable button
const menuButtonDisable = (id) => {
  if (id) {
    const menuItem = document.querySelector(`#${id}`);
    menuItem.classList = ["button-disabled"];
    menuItem.disabled = true;
    menuItem.readOnly = true;
  }
};

const articlesAdditionalMenu = `
<a class="menu-link">
<button hidden id="add-new" class="button-primary">Add Article</button></a>
<a href="./articlesupload.html" class="menu-link">
  <button id="upload-new" class="button-primary">Upload</button>
</a>
`;

const articleAdditionalMenu = `
<button id="add-new" class="button-primary" disabled>Add Comment</button>
`;

const articleAdditionalMenuOnPage = `
<div align="center">
  <button id="add-new-comment" class="button-primary" disabled>Add Comment</button>
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

const hamburgerMenu = () => {
  return `
  <div class="hamburger">
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
  </div>
  `;
};

const mainGUIMenuHTML = (path = ".") => {
  return `
  <a href="${path}/articles.html" class="menu-link">
    <button id="btnArticles" data-testid="open-articles" class="button-primary">Articles</button>
  </a>
  <a href="${path}/comments.html" class="menu-link">
    <button id="btnComments" data-testid="open-comments" class="button-primary">Comments</button>
  </a>
  `;
};

const mainGUIMenuHTMLLogged = (path = ".") => {
  return `
  <a href="${path}/users.html" class="menu-link">
    <button id="btnUsers" data-testid="open-users" class="button-primary">Users</button>
  </a>
  <a href="${path}/stats.html" class="menu-link">
    <button id="btnStats" data-testid="open-stats" class="button-primary">Statistics</button>
  </a>
  <span hidden id="menu-more">|| </span>
  `;
};

const mainAPIMenuHTML = `
<a href="./index.html">
  <button id="btnTools" data-testid="btn-tools" class="button-primary">Tools</button>
</a>
<a href="./swagger.html">
  <button id="btnSwagger" data-testid="btn-swagger" class="button-primary">Swagger</button>
</a>

`;

const mainMenuHTML = `

`;

const logoGAD = (path = ".") => {
  return `
 <a href="${path}" style="text-decoration: none; color: inherit; padding-right:5px;">🦎 GAD</a>
 `;
};

const rightMenu = (path = ".") => {
  return `
  <span style="display: flex; align-items: center; justify-self: end; padding-right: 20px">
  <div class="dropdown" data-testid="user-dropdown">
    <button id="dropbtn" data-testid="btn-dropdown" class="dropbtn">
      <img id="avatar"
        src="${path}/data/icons/user.png"
        style="width: 30px !important; height: 30px !important; padding: 0"
        alt=""
      />
    </button>
    <div class="dropdown-content" id="dropdown-content">
      <div style="margin: 5px" id="username"></div>
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

function getParams() {
  var values = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    values[key] = value;
  });
  return values;
}

const CSV_SEP = ";";
const jsonToCSV = (object) => {
  let csv = "";
  if (!Array.isArray(object)) {
    csv = Object.entries(Object.entries(object)[0][1])
      .map((e) => e[0])
      .join(CSV_SEP);
    csv += "\r\n";
  }

  for (const [k, v] of Object.entries(object)) {
    csv += Object.values(v).join(CSV_SEP) + "\r\n";
  }
  return csv;
};

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

function getBearerToken() {
  let token = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith("token=")) {
      token = cookie.split("=")[1];
    }
  }

  if (token === undefined) return token;
  return `Bearer ${token}`;
}

function isAuthorized(id) {
  return id?.toString() === getId() || getId() === "admin";
}

function formatHeaders() {
  const headers = {
    Authorization: getBearerToken(),
  };
  return headers;
}

addMainMenuAndFooter();
