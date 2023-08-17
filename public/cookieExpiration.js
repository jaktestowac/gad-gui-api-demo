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

var countDownDate = new Date(getCookieExpired()).getTime();

var x = setInterval(function () {
  var now = new Date().getTime();
  var distance = countDownDate - now;
  if (distance > 0) {
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById(
      "countDown"
    ).innerHTML = `Session will expire in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (distance < 0) {
    clearInterval(x);
    document.getElementById("countDown").innerHTML = "Session will expire in: EXPIRED";
    window.location.href = "/login";
  } else {
    document.getElementById("countDown").innerHTML = "";
    window.location.href = "/login";
  }
}, 1000);
