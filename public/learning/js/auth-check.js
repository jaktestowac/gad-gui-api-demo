function getCookie(name) {
  const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] : null;
}

function isLoggedIn() {
  return getCookie("learning_user_id") !== null;
}

async function requireAuth() {
  // Skip auth check for test-requirements.html
  if (window.location.pathname === "/learning/test-requirements.html") {
    return true;
  }

  const isAuth = await api.checkAuthStatus();

  if (!isAuth) {
    const currentPath = window.location.pathname;
    const allowedPaths = [
      "/learning/dashboard.html",
      "/learning/preview.html",
      "/learning/welcome.html",
      "/learning/login.html",
      "/learning/register.html",
      "/learning/instructor-profile.html",
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
  return isAuth;
}

async function checkAuth() {
  const redirectUrl = getCookie("redirectUrl");
  const isAuth = await api.checkAuthStatus();

  if (isAuth && redirectUrl) {
    document.cookie = "redirectUrl=; path=/; max-age=0";
    if (window.location.href !== redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }
  }
}

window.isLoggedIn = isLoggedIn;
window.requireAuth = requireAuth;

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  await requireAuth();
});
