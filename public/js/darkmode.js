function darkmode_init() {
  let darkmodeSwitch = document.querySelector("#darkmode-switch");

  if (getCookie("darkmode") === "1") {
    document.body.classList.add("darkmode");
  }

  if (darkmodeSwitch === null) return;

  if (getCookie("darkmode") === "1") {
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
      addCookie("darkmode", 1);
      darkmodeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      addCookie("darkmode", 0);
      darkmodeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  darkmode_init();
});
