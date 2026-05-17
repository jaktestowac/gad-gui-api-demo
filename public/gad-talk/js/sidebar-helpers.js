(function () {
  "use strict";

  // Lightweight sidebar helpers: highlight active nav item and keep sidebars stable
  function highlightNav() {
    var nav = document.getElementById("main-nav");
    if (!nav) return;
    var items = nav.querySelectorAll(".gt-nav-item");
    var path = location.pathname || "/";
    items.forEach(function (it) {
      var href = it.getAttribute("href");
      if (!href) return;
      // Match exact or prefix (for index pages)
      try {
        if (href === path || (href !== "/" && path.indexOf(href) === 0)) {
          it.classList.add("active");
        } else {
          it.classList.remove("active");
        }
      } catch (e) {}
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", highlightNav);
  } else {
    highlightNav();
  }
})();
