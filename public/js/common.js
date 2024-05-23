const repository_url = "https://github.com/jaktestowac/gad-gui-api-demo";

function setBoxMessage(element, msg, className) {
  element.innerHTML = `<div class="${className}">${msg}</div>`;
}

function saveSession(id, obj) {
  sessionStorage.setItem(id, JSON.stringify(obj));
  return true;
}

function getSession(id) {
  const value = sessionStorage.getItem(id);
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

function saveLocalStorage(id, obj) {
  localStorage.setItem(id, JSON.stringify(obj));
  return true;
}

function getLocalStorage(id) {
  const value = localStorage.getItem(id);
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

function checkIfCookieExists(name) {
  let cookies = document.cookie.split(";");
  let found = "";

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) == " ") {
      cookie = cookie.substring(1);
    }

    if (cookie.indexOf(name) === 0) {
      found = cookie.substring(name.length, cookie.length);
    }
  }
  console.log("Cookie found:", found);
  return found;
}

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

function getCookieUserName() {
  let firstname = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith("firstname=")) {
      firstname = cookie.split("=")[1];
    }
  }
  return firstname;
}

function getCookieExpired() {
  let expires = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith("expires=")) {
      expires = cookie.split("=")[1];
    }
  }
  return parseInt(expires);
}

function getCookieId() {
  return getCookie("id=");
}

function getCookie(cookieName) {
  let cookieValue = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(cookieName)) {
      cookieValue = cookie.split("=")[1];
    }
  }
  return cookieValue;
}

function addCookie(cookieName, value, daysOfValidity = 9999) {
  var now = new Date();
  var time = now.getTime() + daysOfValidity * 24 * 60 * 60 * 1000;
  var newTime = new Date(now.setTime(time));
  newTime = newTime.toUTCString();
  document.cookie = `${cookieName}=${`${value}`?.toLowerCase()}; expires=${newTime}; SameSite=Lax; path=/`;
}

function addVersionStatusCookie(status) {
  addCookie("versionStatus", `${status}`, 0.005);
}

function addLatestVersionCookie(version) {
  addCookie("versionLatest", version, 7);
}

function getVersionStatusCookie() {
  return getCookie("versionStatus");
}

function getLatestVersionCookie() {
  return getCookie("versionLatest");
}

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
    if (menuItem !== undefined && menuItem !== null) {
      menuItem.classList = ["button-disabled"];
      menuItem.disabled = true;
      menuItem.readOnly = true;
    } else {
      console.log(`WARNING! Button ${id} was not found!`);
    }
  }
};

function addLanguageSelect(languages, selectedOption) {
  const languageSelectElement = document.getElementById("languageSelect");
  if (languageSelectElement !== undefined && languageSelectElement !== null) {
    const selectedLanguage = selectedOption?.toLowerCase();

    let allLanguages = Object.keys(languages).map((lang) => {
      return `<option value="${lang}" style="font-size:16px" ${selectedLanguage === lang ? "selected" : ""}>${
        languages[lang]
      }</option>`;
    });

    languageSelectElement.innerHTML = `
    <span style="display: flex; align-items: center; justify-content: center" >
        <select
          onchange="changeLanguage(this.value)" onfocusout="changeLanguage(this.value)"
          style="display: inline-block; width: 100px; height:30px; margin: 5px 5px 5px 5px; font-size:16px"
        >
          ${allLanguages.join("")}
        </select>
      </span>`;
  }
}

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

function isAuthenticated() {
  return getId() !== undefined && getBearerToken() !== undefined;
}

function formatHeaders() {
  const headers = {
    Authorization: getBearerToken(),
  };
  return headers;
}

function numberToWords(num) {
  const units = ["", "K", "M", "B", "T"];
  const unit = Math.floor((num.toString().length - 1) / 3) * 3;
  const suffix = units[unit / 3];
  const roundedNum = Math.round((num / Math.pow(10, unit)) * 10) / 10;
  return roundedNum + suffix;
}

function formatVisits(viewsNumber, articleId) {
  let out = "";
  const formattedNumber = viewsNumber.toLocaleString("en-US", { style: "decimal" });
  const writtenNumber = numberToWords(viewsNumber);
  // TODO: articleId is not used... for now
  out = `<div class="hover-element" id="views-number">Views: ${writtenNumber}<div class="popup">Views: ${formattedNumber}</div></div>`;

  return out;
}

const likeMessage = "Please log in to like this content!";
function formatLike(alreadyLiked, likesNumber, articleId) {
  let out = "";
  if (alreadyLiked) {
    if (getBearerToken() === undefined) {
      out = `<div class="hover-element" style="display: grid;justify-self: end"><div style="display: flex;justify-self: end"><div id="likes-button" >💗</div> <div id="likes-count" >${likesNumber}</div></div><div class="popup">${likeMessage}</div></div>`;
    } else {
      out = `<div style="display: flex;justify-self: end"><div id="likes-button" onclick="likeArticle(${articleId})" style="cursor: pointer;" >💗</div> <div id="likes-count" >${likesNumber}</div></div>`;
    }
  } else {
    if (getBearerToken() === undefined) {
      out = `<div class="hover-element" style="display: grid;justify-self: end"><div style="display: flex;justify-self: end"><div id="likes-button" >🤍</div> <div id="likes-count" >${likesNumber}</div></div><div class="popup">${likeMessage}</div></div>`;
    } else {
      out = `<div style="display: flex;justify-self: end"><div id="likes-button" onclick="likeArticle(${articleId})" style="cursor: pointer;">🤍</div> <div id="likes-count" >${likesNumber}</div></div>`;
    }
  }
  return out;
}

const bookmarkMessage = "Please log in to add this content to Bookmarks!";
function formatBookmarkArticle(alreadyBookmark, articleId) {
  let out = "";
  if (alreadyBookmark) {
    if (getBearerToken() === undefined) {
      out = `<div class="hover-element" style="display: grid;justify-self: end"><div style="display: flex;justify-self: end"><div id="bookmark-button" class="bookmark-icon">🏷️</div><div class="popup">${bookmarkMessage}</div></div>`;
    } else {
      out = `<div id="bookmark-button" onclick="bookmarkArticle(${articleId})" style="cursor: pointer;" class="bookmark-icon">🏷️</div>`;
    }
  } else {
    if (getBearerToken() === undefined) {
      out = `<div class="hover-element" style="display: grid;justify-self: end"><div style="display: flex;justify-self: end"><div id="bookmark-button" class="bookmark-icon-disabled">🔖</div><div class="popup">${bookmarkMessage}</div></div>`;
    } else {
      out = `<div id="bookmark-button" onclick="bookmarkArticle(${articleId})" style="cursor: pointer;" class="bookmark-icon-disabled">🔖</div>`;
    }
  }
  return out;
}

async function checkIfFeatureEnabled(featureName) {
  const body = { name: featureName };
  const url = "/api/config/checkfeature";

  return fetch(url, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((r) => r.json())
    .then((jsonBody) => {
      return jsonBody.enabled;
    });
}

function formatLabelElement(labelObject, showRemoveButton, callback) {
  const labelElement = document.createElement("div");
  labelElement.className = "label";

  const labelTextElement = document.createElement("span");
  labelTextElement.textContent = labelObject.name;
  labelTextElement.id = labelObject.name;
  labelTextElement.setAttribute("label-id", labelObject.id);

  labelElement.appendChild(labelTextElement);

  const removeButton = document.createElement("span");
  if (showRemoveButton === true) {
    removeButton.textContent = "x";
  } else {
    removeButton.textContent = " ";
  }
  removeButton.addEventListener("click", () => {
    removeLabel(labelElement);
    if (callback) {
      callback(labelObject.id);
    }
  });

  labelElement.appendChild(removeButton);
  return labelElement;
}

function removeLabel(label) {
  const labelContainer = document.getElementById("labels-container");
  labelContainer.removeChild(label);
}

async function getGadVersion() {
  const gadStatusUrl = "/api/about";

  return fetch(gadStatusUrl, {
    method: "get",
    headers: {
      Accept: "application/json",
    },
  })
    .then((r) => r.json())
    .then((gadStatus) => {
      return gadStatus;
    });
}

async function getGadReleases() {
  const gadReleasesUrl = "https://api.github.com/repos/jaktestowac/gad-gui-api-demo/releases";

  return fetch(gadReleasesUrl, {
    method: "get",
    headers: {
      Accept: "application/vnd.github+json",
    },
  })
    .catch((e) => {
      console.log("Error:", e?.message);
      return [];
    })
    .then((r) => r.json())
    .catch((e) => {
      return [];
    })
    .then((gadReleases) => {
      return gadReleases;
    });
}

function getNewestVersion(gadReleases, currentVersion) {
  gadReleases.sort((a, b) => b.name.localeCompare(a.name));

  const filteredVersions = gadReleases.filter((release) => {
    return release.name > currentVersion;
  });

  if (filteredVersions.length === 0) {
    console.log(
      `[getNewestVersion] GAD (${currentVersion}) is up to date! Latest available version: ${gadReleases[0]?.name}`
    );
    return undefined;
  }
  filteredVersions.sort((a, b) => b.name.localeCompare(a.name));
  const latestVersion = filteredVersions[0];
  return latestVersion;
}

function getNewerVersions(gadReleases, currentVersion) {
  gadReleases.sort((a, b) => b.name.localeCompare(a.name));

  const filteredVersions = gadReleases.filter((release) => {
    return release.name > currentVersion;
  });

  if (filteredVersions.length === 0) {
    console.log(
      `[getNewerVersions] GAD (${currentVersion}) is up to date! Latest available version: ${gadReleases[0]?.name}`
    );
    return [];
  }
  filteredVersions.sort((a, b) => b.name.localeCompare(a.name));
  return filteredVersions;
}

function displayUpToDateMessage(currentVersion, latestVersion) {
  const versionDetailsElement = document.getElementById("versionDetails");
  if (versionDetailsElement !== null) {
    versionDetailsElement.innerHTML = `<div align="center"><h3><strong>🦎 GAD (${currentVersion}) is up to date!</strong>🥳<br/>Latest available version: ${latestVersion}</h3></div>`;
  }
}

function displayNewerVersionAvailableMessage(currentVersion, latestVersion) {
  const versionInfoContainer = document.getElementById("versionInfoBox");
  if (versionInfoContainer !== null) {
    const gad_msg = `<strong>Newer GAD version is available!</strong> Latest: <strong>${latestVersion.name}</strong> and You have: <strong>${currentVersion}</strong><br/>
      You can download it from <strong><a href="${repository_url}" >official jaktestowac.pl repository</a></strong> or <strong><a href="${latestVersion.html_url}" >release page!</a></strong><br/>`;
    versionInfoContainer.innerHTML = `<div class="versionInfoBox">${gad_msg}</div>`;
  }
}

async function checkNewerVersion(force = false) {
  const versionInfoContainer = document.getElementById("versionInfoBox");
  if (versionInfoContainer === null) {
    return;
  }

  getGadVersion().then((gadStatus) => {
    const currentVersion = gadStatus.version;
    console.log(`GAD current version is: ${currentVersion}`);
    const versionUpToDate = getVersionStatusCookie();
    const latestVersionCookie = getLatestVersionCookie();

    if (versionUpToDate === "1" && latestVersionCookie !== undefined) {
      console.log("Using cached cookie data. Latest:", latestVersionCookie);
      displayUpToDateMessage(currentVersion, latestVersionCookie);

      const versionInfoContainer = document.getElementById("versionDetails");
      if (versionInfoContainer !== null) {
        versionInfoContainer.innerHTML += `<div align="center">(Using cached cookie data. Valid for 5 minutes)</div>`;
      }
      return;
    }

    if (
      versionUpToDate === "2" &&
      currentVersion < latestVersionCookie &&
      force === false &&
      latestVersionCookie !== undefined
    ) {
      console.log("Using cached cookie data.. Latest:", latestVersionCookie);
      displayNewerVersionAvailableMessage(currentVersion, {
        name: latestVersionCookie,
        html_url: `${repository_url}/releases/tag/${latestVersionCookie}`,
      });

      const versionInfoContainer = document.getElementById("versionInfoBox");
      if (versionInfoContainer !== null) {
        versionInfoContainer.innerHTML += `<div align="center">(Using cached cookie data. Valid for 5 minutes)</div>`;
      }
      return;
    }

    console.log("Cache expired, checking releases...");
    getGadReleases().then((gadReleases) => {
      if (gadReleases.length === 0) {
        addVersionStatusCookie(0);
        const versionDetailsElement = document.getElementById("versionDetails");
        if (versionDetailsElement !== null) {
          const gad_msg = `<div align="center"><h3>There was a problem with checking version😕<br/>
            You can check it manually on <strong><a href="${repository_url}" >official jaktestowac.pl repository</a></strong> or <strong><a href="${repository_url}/releases" >release page</a></strong><br/></h3></div>`;
          versionDetailsElement.innerHTML = gad_msg;
        }
        return;
      }

      const latestVersion = getNewestVersion(gadReleases, currentVersion);
      if (latestVersion !== undefined) {
        displayNewerVersionAvailableMessage(currentVersion, latestVersion);
      }

      if (latestVersion !== undefined) {
        addVersionStatusCookie(2); // new version
        addLatestVersionCookie(latestVersion.name);
      } else {
        addVersionStatusCookie(1); // version up to date
      }

      const versionDetailsElement = document.getElementById("versionDetails");
      if (versionDetailsElement === null) {
        return;
      }
      const versions = getNewerVersions(gadReleases, currentVersion);

      if (versions.length === 0) {
        addVersionStatusCookie(1); // version up to date
        addLatestVersionCookie(gadReleases[0]?.name);
        displayUpToDateMessage(currentVersion, gadReleases[0]?.name);
        return;
      }

      let markdownInput = "# Release Notes\n\n";
      versions.forEach((version) => {
        let tmp = version.body.replace("# ", "### ");
        tmp = tmp.replace("![obraz]", "\n![obraz]");
        markdownInput += `\n\n## ${version.name}\n\n`;
        markdownInput += tmp;
      });
      const htmlOutput = marked(markdownInput);
      versionDetailsElement.innerHTML = htmlOutput;
    });
  });
}

function checkRelease(force = false) {
  checkNewerVersion(force);
}
