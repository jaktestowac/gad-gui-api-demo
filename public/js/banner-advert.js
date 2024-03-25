const advertArticlesBanner = `<div class="popup-overlay">
<div class="popup-container">

  <div class="right">
    <div class="skip-button">Skip in 5s</div>

    <p class="logo">🦎GAD</p>
    <h2 class="popup-heading">Deliver Quality</h2>
    <p class="description">
      Wide range of articles on various quality related topics. Click the button
      below to view more details.
    </p>

    <a href="./articles.html" class="visit-button">Visit Articles</a>
  </div>
</div>
</div>`;

let remainingTime = 5;
let allowedToSkip = false;
let popupTimer;

function wasAccepted() {
  return checkCookie() === "1";
}

function checkCookie() {
  var name = "advertCookie=";
  var cookies = document.cookie.split(";");

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    while (cookie.charAt(0) == " ") {
      cookie = cookie.substring(1);
    }

    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return "";
}

function saveAcceptInCookies(daysOfValidity) {
  var now = new Date();
  var time = now.getTime() + daysOfValidity * 24 * 60 * 60 * 1000;
  var newTime = new Date(now.setTime(time));
  newTime = newTime.toUTCString();
  document.cookie = "advertCookie=1; expires=" + newTime + "; SameSite=Lax; path=/";
}

const showAd = () => {
  const skipButton = document.querySelector(".popup-container .skip-button");
  const popupOverlay = document.querySelector(".popup-overlay");

  popupOverlay.classList.add("active");
  popupTimer = setInterval(() => {
    skipButton.innerHTML = `Skip in ${remainingTime}s`;
    remainingTime--;

    if (remainingTime < 0) {
      allowedToSkip = true;
      skipButton.innerHTML = "Skip";
      clearInterval(popupTimer);
    }
  }, 1000);
};

const skipAd = () => {
  const popupOverlay = document.querySelector(".popup-overlay");
  popupOverlay.classList.remove("active");
  popupOverlay.remove();
  saveAcceptInCookies(0.005);
};

function displayAd() {
  if (wasAccepted() === true) {
    return;
  }
  document.body.insertAdjacentHTML("beforeend", advertArticlesBanner);
  const skipButton = document.querySelector(".popup-container .skip-button");
  showAd();
  skipButton.addEventListener("click", () => {
    if (allowedToSkip === true) {
      skipAd();
    }
  });
}

displayAd();
