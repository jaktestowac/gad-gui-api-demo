function renderGuestBanner() {
  const banner = document.getElementById("guestBanner");
  if (!banner) return;

  if (!isLoggedIn()) {
    banner.innerHTML = `
            <div class="guest-banner">
                <p>👋 Welcome! You're browsing as a guest. <a href="login.html">Sign in</a> or <a href="register.html">create an account</a> to enroll in courses and track your progress.</p>
            </div>
        `;
  } else {
    banner.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", renderGuestBanner);
