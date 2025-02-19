function updateAuthButtons() {
  const authButtons = document.getElementById("authButtons");
  const welcomeMessage = document.getElementById("welcomeMessage");
  const requirementsButtons = document.getElementById("requirementsButtons");

  if (!authButtons || !welcomeMessage || !requirementsButtons) return;

  const isAuthenticated = isLoggedIn();
  requirementsButtons.innerHTML = `
  <a href="test-requirements.html" class="requirements-button">
      <i class="fas fa-tasks"></i>
      View Test Requirements
  </a>
`;
  if (isAuthenticated) {
    authButtons.innerHTML = `
            <a href="dashboard.html" class="cta-button primary" name="dashboard" aria-label="Dashboard">
                <i class="fas fa-columns"></i>
                Go to Dashboard
            </a>
        `;
    welcomeMessage.innerHTML = `<i class="fas fa-user"></i> Welcome back, ${getCookie(
      "learning_first_name"
    )} ${getCookie("learning_last_name")}!`;
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

function handleLogout() {
  localStorage.removeItem("username");
  updateAuthButtons();
}

document.addEventListener("DOMContentLoaded", updateAuthButtons);
