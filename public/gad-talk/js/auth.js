/**
 * GadTalk Authentication Module
 * Handles login, signup, logout functionality
 */

const gadTalkAuth = (function () {
  let currentUser = null;

  /**
   * Show error message
   */
  function showError(message) {
    const errorEl = document.getElementById("error-message");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("gt-hidden");
    }
    const successEl = document.getElementById("success-message");
    if (successEl) {
      successEl.classList.add("gt-hidden");
    }
  }

  /**
   * Show success message
   */
  function showSuccess(message) {
    const successEl = document.getElementById("success-message");
    if (successEl) {
      successEl.textContent = message;
      successEl.classList.remove("gt-hidden");
    }
    const errorEl = document.getElementById("error-message");
    if (errorEl) {
      errorEl.classList.add("gt-hidden");
    }
  }

  /**
   * Clear messages
   */
  function clearMessages() {
    const errorEl = document.getElementById("error-message");
    const successEl = document.getElementById("success-message");
    if (errorEl) errorEl.classList.add("gt-hidden");
    if (successEl) successEl.classList.add("gt-hidden");
  }

  /**
   * Set button loading state
   */
  function setButtonLoading(button, loading) {
    // Use GadTalkUI if available
    if (window.GadTalkUI && window.GadTalkUI.setButtonLoading) {
      window.GadTalkUI.setButtonLoading(button, loading, "Signing in...");
      return;
    }

    // Fallback
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = "Loading...";
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  /**
   * Check if user is authenticated
   */
  async function checkAuth() {
    if (!window.GadTalkAPI.auth.isAuthenticated()) {
      return null;
    }
    try {
      const response = await window.GadTalkAPI.auth.me();
      currentUser = response.user;
      return currentUser;
    } catch (error) {
      console.error("Auth check failed:", error);
      return null;
    }
  }

  /**
   * Get current user (cached)
   */
  function getCurrentUser() {
    return currentUser;
  }

  /**
   * Handle login form submission
   */
  async function handleLogin(event) {
    event.preventDefault();
    clearMessages();

    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    const keepSignIn = form.keepSignIn?.checked || false;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!email || !password) {
      showError("Please enter email and password");
      return;
    }

    setButtonLoading(submitBtn, true);

    try {
      const response = await window.GadTalkAPI.auth.login(email, password, keepSignIn);
      currentUser = response.user;
      showSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/gad-talk/index.html";
      }, 500);
    } catch (error) {
      showError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }

  /**
   * Handle signup form submission
   */
  async function handleSignup(event) {
    event.preventDefault();
    clearMessages();

    const form = event.target;
    const username = form.username.value.trim();
    const email = form.email.value.trim();
    const displayName = form.displayName?.value.trim() || "";
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const acceptTerms = form.acceptTerms?.checked || false;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validate
    if (!username || !email || !password) {
      showError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    if (!acceptTerms) {
      showError("Please accept the Terms of Service");
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      showError("Username must be 3-30 characters and contain only letters, numbers, and underscores");
      return;
    }

    // Check username availability with backend
    try {
      const availRes = await fetch(`/api/gad-talk/users/available/${encodeURIComponent(username)}`);
      if (availRes.status === 422) {
        const err = await availRes.json();
        showError(err.error || "Invalid username");
        return;
      }
      if (availRes.ok) {
        const json = await availRes.json();
        if (!json.available) {
          showError("Username is already taken");
          return;
        }
      }
    } catch (e) {
      // Ignore availability check failure and proceed with signup (server will still enforce uniqueness)
      console.warn("Username availability check failed", e);
    }

    setButtonLoading(submitBtn, true);

    try {
      const userData = {
        username,
        email,
        password,
        displayName: displayName || username,
      };

      const response = await window.GadTalkAPI.auth.signup(userData);
      currentUser = response.user;
      showSuccess("Account created! Redirecting...");
      setTimeout(() => {
        window.location.href = "/gad-talk/index.html";
      }, 500);
    } catch (error) {
      showError(error.message || "Signup failed. Please try again.");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }

  /**
   * Handle forgot password form submission
   */
  async function handleForgotPassword(event) {
    event.preventDefault();
    clearMessages();

    const form = event.target;
    const email = form.email.value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!email) {
      showError("Please enter your email");
      return;
    }

    setButtonLoading(submitBtn, true);

    try {
      const response = await window.GadTalkAPI.auth.forgotPassword(email);
      const message =
        response?.data?.message || "If an account exists with this email, a password reset link has been sent.";
      showSuccess(message);

      const resetUrl = response?.data?.resetUrl;
      const resetUrlEl = document.getElementById("reset-url-output");
      const resetUrlWrap = document.getElementById("reset-url-container");
      if (resetUrl && resetUrlEl && resetUrlWrap) {
        resetUrlEl.textContent = resetUrl;
        resetUrlEl.href = resetUrl;
        resetUrlWrap.classList.remove("gt-hidden");
      }
    } catch (error) {
      showError(error.message || "Failed to request password reset.");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }

  /**
   * Handle reset password form submission
   */
  async function handleResetPassword(event) {
    event.preventDefault();
    clearMessages();

    const form = event.target;
    const token = form.token.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword?.value || "";
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!token) {
      showError("Reset token is missing. Please use the reset link from your email.");
      return;
    }

    if (!password) {
      showError("Please enter a new password");
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setButtonLoading(submitBtn, true);

    try {
      const response = await window.GadTalkAPI.auth.resetPassword(token, password);
      const message = response?.data?.message || "Password reset successfully. Redirecting to login...";
      showSuccess(message);
      setTimeout(() => {
        window.location.href = "/gad-talk/login.html";
      }, 800);
    } catch (error) {
      showError(error.message || "Failed to reset password.");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }

  /**
   * Handle OAuth Google simulated login
   */
  async function handleOAuthGoogle(event) {
    if (event) event.preventDefault();
    clearMessages();

    const submitBtn = document.querySelector("[data-oauth-google]");
    if (submitBtn) setButtonLoading(submitBtn, true);

    try {
      const response = await window.GadTalkAPI.auth.oauthGoogle();
      const message = response?.data?.message || "OAuth login simulated.";
      showSuccess(message);
      const hintEl = document.getElementById("oauth-hint");
      if (hintEl && response?.data?.hint) {
        hintEl.textContent = response.data.hint;
        hintEl.classList.remove("gt-hidden");
      }
    } catch (error) {
      showError(error.message || "OAuth login failed.");
    } finally {
      if (submitBtn) setButtonLoading(submitBtn, false);
    }
  }

  /**
   * Handle demo login
   */
  async function handleDemoLogin() {
    clearMessages();

    try {
      const response = await window.GadTalkAPI.auth.loginDemo();
      currentUser = response.user;
      showSuccess("Demo login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/gad-talk/index.html";
      }, 500);
    } catch (error) {
      showError(error.message || "Demo login failed. Please try again.");
    }
  }

  /**
   * Handle logout
   */
  async function handleLogout() {
    try {
      await window.GadTalkAPI.auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      currentUser = null;
      window.location.href = "/gad-talk/login.html";
    }
  }

  /**
   * Require authentication - redirect to login if not authenticated
   */
  async function requireAuth() {
    const user = await checkAuth();
    if (!user) {
      window.location.href = "/gad-talk/login.html";
      return null;
    }
    return user;
  }

  /**
   * Optional authentication - return user if authenticated, null otherwise (no redirect)
   */
  async function optionalAuth() {
    return await checkAuth();
  }

  /**
   * Initialize auth module - attach event listeners
   */
  function init() {
    // Login form
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", handleLogin);
    }

    // Signup form
    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
      signupForm.addEventListener("submit", handleSignup);
    }

    // Forgot password form
    const forgotForm = document.getElementById("forgot-password-form");
    if (forgotForm) {
      forgotForm.addEventListener("submit", handleForgotPassword);
    }

    // Reset password form
    const resetForm = document.getElementById("reset-password-form");
    if (resetForm) {
      const tokenInput = resetForm.querySelector("input[name=token]");
      if (tokenInput && !tokenInput.value) {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        if (token) tokenInput.value = token;
      }
      resetForm.addEventListener("submit", handleResetPassword);
    }

    // OAuth Google button
    const oauthBtn = document.querySelector("[data-oauth-google]");
    if (oauthBtn) {
      oauthBtn.addEventListener("click", handleOAuthGoogle);
    }

    // Demo login buttons
    const demoLoginBtns = document.querySelectorAll("[data-demo-login]");
    demoLoginBtns.forEach((btn) => {
      btn.addEventListener("click", handleDemoLogin);
    });

    // Logout buttons
    const logoutBtns = document.querySelectorAll("[data-logout]");
    logoutBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        handleLogout();
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Public API
  return {
    checkAuth,
    getCurrentUser,
    requireAuth,
    optionalAuth,
    handleLogin,
    handleSignup,
    handleDemoLogin,
    handleLogout,
    showError,
    showSuccess,
    clearMessages,
  };
})();

// Export for use in other scripts
window.gadTalkAuth = gadTalkAuth;
