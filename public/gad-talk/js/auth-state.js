(function () {
  "use strict";

  // Minimal auth-state placeholder to avoid 404s.
  // Keeps DOM API stable for pages that expect an auth state script.

  function isLoggedIn() {
    try {
      // some pages may inspect a cookie or localStorage key
      return !!(localStorage && localStorage.getItem && localStorage.getItem("gt_auth_token"));
    } catch (e) {
      return false;
    }
  }

  function updateUserSection() {
    var el = document.getElementById("nav-user-section");
    if (!el) return;
    if (isLoggedIn()) {
      el.innerHTML = '<a href="/gad-talk/profile.html" class="gt-link">Profile</a>';
    } else {
      el.innerHTML = '<a href="/gad-talk/login.html" class="gt-link">Login</a>';
    }
  }

  if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", updateUserSection);
    } else {
      updateUserSection();
    }
  }

  window.GT = window.GT || {};
  window.GT.isLoggedIn = isLoggedIn;
})();
