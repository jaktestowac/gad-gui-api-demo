const cookieBanner = `<div class="cookies-infobar">
<span>If you continue to use this site means you accept Terms and Conditions and Privacy Policy.</span>
<div class="cookies-infobar-wrapper">
  <a id="cookies-infobar-accept" class="cookies-infobar-btn">Accept</a>
  <a id="cookies-infobar-reject" class="cookies-infobar-btn">Reject</a>
</div>
</div>`;

function hideInfobar() {
  var infoBar = document.querySelector(".cookies-infobar");

  if (infoBar !== null) {
    infoBar.className = infoBar.classList.value + " cookies-accepted";
  }
}

function wasAccepted() {
  return checkIfCookieExists("bannerCookie=") === "1";
}

function saveCookieAcceptInCookies(daysOfValidity) {
  var now = new Date();
  var time = now.getTime() + daysOfValidity * 24 * 60 * 60 * 1000;
  var newTime = new Date(now.setTime(time));

  newTime = newTime.toUTCString();

  document.cookie = "bannerCookie=1; expires=" + newTime + "; SameSite=Lax; path=/";
}

function displayBanner() {
  if (!wasAccepted()) {
    document.body.insertAdjacentHTML("beforeend", cookieBanner);
  }
  if (wasAccepted()) {
    hideInfobar();
    return;
  }

  var btnAccept = document.querySelector("#cookies-infobar-accept");
  btnAccept.addEventListener("click", function (e) {
    e.preventDefault();
    hideInfobar();
    saveCookieAcceptInCookies(0.1);
  });

  var btnReject = document.querySelector("#cookies-infobar-reject");
  btnReject.addEventListener("click", function (e) {
    e.preventDefault();
    hideInfobar();
    saveCookieAcceptInCookies(0.01);
  });
}

displayBanner();
