function getCookie(name) {
  const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] : null;
}

function isLoggedIn() {
  return getCookie("learning_user_id") !== null;
}

function requireAuth() {
  if (!isLoggedIn()) {
    const currentPath = window.location.pathname;
    const allowedPaths = [
      "/learning/dashboard.html",
      "/learning/preview.html",
      "/learning/welcome.html",
      "/learning/login.html",
      "/learning/register.html",
    ];

    if (!allowedPaths.includes(currentPath)) {
      document.cookie = `redirectUrl=${window.location.href}; path=/; max-age=300`;
      if (window.notifications) {
        notifications.show("Please sign in to access this page", "info");
      }
      window.location.href = "/learning/welcome.html";
      return false;
    }
  }
  return true;
}

function checkAuth() {
  const redirectUrl = getCookie("redirectUrl");
  if (isLoggedIn() && redirectUrl) {
    document.cookie = "redirectUrl=; path=/; max-age=0";
    if (window.location.href !== redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }
  }
}

window.isLoggedIn = isLoggedIn;
window.requireAuth = requireAuth;

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  requireAuth();
});
