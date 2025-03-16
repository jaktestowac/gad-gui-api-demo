function updateAuthButtons() {
  const authButtons = document.getElementById("authButtons");
  const welcomeMessage = document.getElementById("welcomeMessage");
  const requirementsButtons = document.getElementById("requirementsButtons");

  if (!authButtons || !welcomeMessage || !requirementsButtons) return;

  const isAuthenticated = isLoggedIn();
  requirementsButtons.innerHTML = `
        <a href="business-requirements.html" class="requirements-button">
            <i class="fas fa-tasks"></i>
            View Business Requirements
        </a>
    `;

  if (isAuthenticated) {
    const avatarUrl = getCookie("learning_user_avatar") || "/data/images/default-avatar.png";
    authButtons.innerHTML = `
            <a href="dashboard.html" class="cta-button primary" name="dashboard" aria-label="Dashboard">
                <i class="fas fa-columns"></i>
                Go to Dashboard
            </a>
            <button class="cta-button secondary" name="logout" aria-label="Logout" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </button>
        `;
    welcomeMessage.innerHTML = `
            <span>Welcome back, ${getCookie("learning_first_name")} ${getCookie("learning_last_name")}!</span>
            <img src="${avatarUrl}" alt="User Avatar" class="welcome-avatar" >
        `;
  } else {
    authButtons.innerHTML = `
            <a href="dashboard.html" class="cta-button primary" name="demo" aria-label="Demo">
                <i class="fas fa-graduation-cap"></i>
                Demo
            </a>
            <a href="register.html" class="cta-button primary" name="register" aria-label="Register">
                <i class="fas fa-user-plus"></i>
                Get Started
            </a>
            <a href="login.html" class="cta-button secondary" name="login" aria-label="Login">
                <i class="fas fa-sign-in-alt"></i>
                Sign In
            </a>
        `;
  }
}

document.addEventListener("DOMContentLoaded", updateAuthButtons);
