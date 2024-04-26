function darkmode_init() {
  let darkmodeSwitch = document.querySelector("#darkmode-switch");

  let darkmodeCookie = {
    set: function (key, value, time, path, secure = false) {
      let expires = new Date();
      expires.setTime(expires.getTime() + time);
      const pathFinal = typeof path !== "undefined" ? (pathValue = "path=" + path + ";") : "";
      const secureFinal = secure ? ";secure" : "";

      document.cookie = key + "=" + value + ";" + pathFinal + "expires=" + expires.toUTCString() + secureFinal;
    },
    get: function () {
      let keyValue = document.cookie.match("(^|;) ?darkmode=([^;]*)(;|$)");
      return keyValue ? keyValue[2] : null;
    },
    remove: function () {
      document.cookie = "darkmode=; Max-Age=0; path=/";
    },
  };

  if (darkmodeCookie.get() == "true") {
    document.body.classList.add("darkmode");
  }

  if (darkmodeSwitch === null) return;

  if (darkmodeCookie.get() == "true") {
    darkmodeSwitch.classList.add("active");
    darkmodeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    darkmodeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
  }

  darkmodeSwitch.addEventListener("click", (event) => {
    event.preventDefault();
    event.target.classList.toggle("active");
    document.body.classList.toggle("darkmode");

    if (document.body.classList.contains("darkmode")) {
      darkmodeCookie.set("darkmode", "true", 2628000000, "/", false);
      darkmodeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      darkmodeCookie.remove();
      darkmodeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  darkmode_init();
});
