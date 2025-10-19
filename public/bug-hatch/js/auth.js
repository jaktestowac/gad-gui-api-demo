// BugHatch Authentication JavaScript

// API Base URL
const API_BASE = "/api/bug-hatch";

// ==================== HELPER FUNCTIONS ====================

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  const errorEl = document.getElementById("error-message");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorEl.style.display = "none";
    }, 5000);
  }
}

/**
 * Show success message
 * @param {string} message - Success message to display
 */
function showSuccess(message) {
  const successEl = document.getElementById("success-message");
  if (successEl) {
    successEl.textContent = message;
    successEl.style.display = "block";

    // Auto-hide after 3 seconds
    setTimeout(() => {
      successEl.style.display = "none";
    }, 3000);
  }
}

/**
 * Hide all messages
 */
function hideMessages() {
  const errorEl = document.getElementById("error-message");
  const successEl = document.getElementById("success-message");

  if (errorEl) errorEl.style.display = "none";
  if (successEl) successEl.style.display = "none";
}

/**
 * Make API request with error handling
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

// ==================== AUTH FUNCTIONS ====================

/**
 * Check if user is authenticated
 * @returns {Promise<object|null>} User object or null
 */
async function checkAuth() {
  try {
    const data = await apiRequest(`${API_BASE}/auth/me`);
    return data.data;
  } catch (error) {
    console.log("Not authenticated:", error.message);
    return null;
  }
}

/**
 * Handle user login
 */
async function handleLogin() {
  hideMessages();

  const form = document.getElementById("login-form");
  const submitBtn = form.querySelector('button[type="submit"]');
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const keepSignIn = document.getElementById("keepSignIn").checked;

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in...";

  try {
    const data = await apiRequest(`${API_BASE}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password, keepSignIn }),
    });

    if (data.ok) {
      showSuccess("Login successful! Redirecting...");

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        window.location.href = "/bug-hatch/dashboard.html";
      }, 1000);
    } else {
      throw new Error(data.error?.message || "Login failed");
    }
  } catch (error) {
    showError(error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign In";
  }
}

/**
 * Handle user signup
 */
async function handleSignup() {
  hideMessages();

  const form = document.getElementById("signup-form");
  const submitBtn = form.querySelector('button[type="submit"]');
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validate password match
  if (password !== confirmPassword) {
    showError("Passwords do not match");
    return;
  }

  // Validate password length
  if (password.length < 2) {
    showError("Password must be at least 2 characters long");
    return;
  }

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  try {
    const data = await apiRequest(`${API_BASE}/auth/signup`, {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    if (data.ok) {
      showSuccess("Account created successfully! Redirecting to login...");

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        window.location.href = "/bug-hatch/login.html";
      }, 2000);
    } else {
      throw new Error(data.error?.message || "Signup failed");
    }
  } catch (error) {
    showError(error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  }
}

/**
 * Handle user logout
 */
async function handleLogout() {
  let isDemoExit = false;
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn && /exit demo/i.test(logoutBtn.textContent)) {
    isDemoExit = true;
  }
  try {
    await apiRequest(`${API_BASE}/auth/logout`, { method: "POST" });
  } catch (error) {
    // console.error("Logout error:", error);
    // proceed with redirect regardless
  } finally {
    // If exiting demo mode, send user to public welcome/landing page
    window.location.href = isDemoExit ? "/bug-hatch/" : "/bug-hatch/login.html";
  }
}

// ==================== EVENT LISTENERS ====================

document.addEventListener("DOMContentLoaded", () => {
  // Login form
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleLogin();
    });
  }

  // Signup form
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSignup();
    });
  }

  // Logout button (for authenticated pages)
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
});

// Export functions for use in other scripts
if (typeof window !== "undefined") {
  window.bugHatchAuth = {
    checkAuth,
    handleLogin,
    handleSignup,
    handleLogout,
    showError,
    showSuccess,
  };
}
