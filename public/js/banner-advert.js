const advertArticlesBanner1 = `<div class="popup-overlay">
<div class="popup-container" style="background-image: url('../images/advert1-bg.jpg'); ">

  <div class="right">
    <div class="skip-button">Skip in 5s</div>

    <p class="logo">🦎GAD</p>
    <h2 class="popup-heading">Gain Knowledge</h2>
    <p class="description">
      Wide range of articles on various quality related topics. Click the button
      below to view more details.
    </p>

    <a href="./articles.html" class="visit-button">Visit Articles</a>
  </div>
</div>
</div>`;

const advertSudokuBanner = `<div class="popup-overlay">
<div class="popup-container" style="background-image: url('../images/advert2-bg.jpg'); ">

  <div class="right2">
    <div class="skip-button">Skip in 5s</div>

    <p class="logo">🦎GAD</p>
    <h2 class="popup-heading">SUDOKU</h2>
    <p class="description">
      Play Sudoku 
      <br>and train your brain🧠!
      <br>Improve your logical thinking skills. Have fun🎉
    </p>

    <a href="./sudoku.html" class="visit-button">Play Sudoku</a>
  </div>
</div>
</div>`;

const advertCommentsBanner = `<div class="popup-overlay">
<div class="popup-container" style="background-image: url('../images/advert3-bg.jpg'); ">

  <div class="right">
    <div class="skip-button">Skip in 5s</div>

    <p class="logo">🦎GAD</p>
    <h2 class="popup-heading">Exchange Thoughts</h2>
    <p class="description">
      Share your thoughts and experience with other readers. Click the button
      below to view the comments.
    </p>

    <a href="./comments.html" class="visit-button">Visit Comments</a>
  </div>
</div>
</div>`;

const advertStatisticsBanner = `<div class="popup-overlay">
<div class="popup-container" style="background-image: url('../images/advert5-bg.jpg'); ">

  <div class="right">
    <div class="skip-button">Skip in 5s</div>

    <p class="logo">🦎GAD</p>
    <h2 class="popup-heading">World of Charts</h2>
    <p class="description"> 
      Check out the statistics of the articles and comments. Click the button
      below to view the statistics.
    </p>

    <a href="./stats.html" class="visit-button">Visit Statistics</a>
  </div>
</div>
</div>`;

const listOfBanners = [advertArticlesBanner1, advertCommentsBanner, advertStatisticsBanner, advertSudokuBanner];

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

function getRandomBanner() {
  return listOfBanners[Math.floor(Math.random() * listOfBanners.length)];
}

function displayAd() {
  if (wasAccepted() === true) {
    return;
  }
  document.body.insertAdjacentHTML("beforeend", getRandomBanner());
  const skipButton = document.querySelector(".popup-container .skip-button");
  showAd();
  skipButton.addEventListener("click", () => {
    if (allowedToSkip === true) {
      skipAd();
    }
  });
}

displayAd();
