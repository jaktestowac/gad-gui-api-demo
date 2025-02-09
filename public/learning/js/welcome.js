function updateAuthButtons() {
  const authButtons = document.getElementById("authButtons");
  const welcomeMessage = document.getElementById("welcomeMessage");

  if (!authButtons || !welcomeMessage) return;

  const isAuthenticated = isLoggedIn();

  if (isAuthenticated) {
    authButtons.innerHTML = `
            <a href="dashboard.html" class="cta-button primary">
                <i class="fas fa-columns"></i>
                Go to Dashboard
            </a>
        `;
    welcomeMessage.textContent = `Welcome back, ${getCookie("learning_first_name")} ${getCookie(
      "learning_last_name"
    )}!`;
  } else {
    authButtons.innerHTML = `
            <a href="dashboard.html" class="cta-button primary">
                <i class="fas fa-graduation-cap"></i>
                Demo
            </a>
            <a href="register.html" class="cta-button primary">
                <i class="fas fa-user-plus"></i>
                Get Started
            </a>
            <a href="login.html" class="cta-button secondary">
                <i class="fas fa-sign-in-alt"></i>
                Sign In
            </a>
        `;
  }
}

function handleLogout() {
  localStorage.removeItem("username");
  updateAuthButtons();
}

document.addEventListener("DOMContentLoaded", updateAuthButtons);
