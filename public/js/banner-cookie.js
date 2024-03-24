const cookieBanner = `<div class="cookies-infobar">
If you continue to use this site means you accept Terms and Conditions and Privacy Policy.
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
  return checkCookie() === "1";
}

function checkCookie() {
  var name = "cookieAccepted=";
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

  document.cookie = "cookieAccepted=1; expires=" + newTime + "; SameSite=Lax; path=/";
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
    saveAcceptInCookies(1);
  });

  var btnReject = document.querySelector("#cookies-infobar-reject");
  btnReject.addEventListener("click", function (e) {
    e.preventDefault();
    hideInfobar();
  });
}

displayBanner();
