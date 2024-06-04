var countDownDate = getDateFromString(getCookieExpired()).getTime();

var x = setInterval(function () {
  const now = getCurrentDate().getTime();
  const distance = countDownDate - now;
  if (distance > 0) {
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById(
      "countDown"
    ).innerHTML = `Session will expire in: ${days}d ${hours}h ${minutes}m ${seconds}s`;

    const currentTime = getCurrentDateLocaleString();
    document.getElementById("current-time").innerHTML = `${currentTime}`;
  } else if (distance < 0) {
    clearInterval(x);
    document.getElementById("countDown").innerHTML = "Session will expire in: EXPIRED";
    window.location.href = "/login";
  } else {
    document.getElementById("countDown").innerHTML = "";
    window.location.href = "/login";
  }
}, 1000);
