// BugHatch Profile Management
// Handles user profile viewing, editing, and password changes

let currentUser = null;
let originalProfileData = null;
let forceDemo = false;

/**
 * Initialize the profile page
 */
async function initProfilePage() {
  try {
    // Parse query parameters
    const url = new URL(window.location.href);
    forceDemo = url.searchParams.get("demo") === "true";

    // Check authentication
    currentUser = await window.bugHatchAuth.checkAuth().catch(() => null);
    if (!currentUser) {
      // Allow anonymous demo mode when demo is explicitly requested
      if (forceDemo) {
        // For demo mode, create a mock user
        currentUser = {
          id: "demo-user",
          name: "Demo User",
          email: "demo@bughatch.local",
          role: "member",
          isDemo: true,
        };
      } else {
        window.location.href = "/bug-hatch/login.html";
        return;
      }
    }

    // Load user profile
    await loadUserProfile();

    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error("Failed to initialize profile page:", error);
    window.bhToast.show("Failed to load profile", { type: "error" });
  }
}

/**
 * Load user profile data
 */
async function loadUserProfile() {
  try {
    const response = await fetch(`/api/bug-hatch/users/profile${forceDemo ? "?demo=true" : ""}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to load profile");
    }

    const user = data.data;
    originalProfileData = { ...user };

    // Populate form fields
    document.getElementById("name").value = user.name || "";
    document.getElementById("email").value = user.email || "";

    // Update page title with user name
    document.title = `${user.name} - Profile - BugHatch`;
  } catch (error) {
    console.error("Failed to load user profile:", error);
    window.bhToast.show("Failed to load profile data", { type: "error" });
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Profile form
  const profileForm = document.getElementById("profileForm");
  profileForm.addEventListener("submit", handleProfileUpdate);

  // Password form
  const passwordForm = document.getElementById("passwordForm");
  passwordForm.addEventListener("submit", handlePasswordChange);

  // Cancel button
  const cancelBtn = document.getElementById("cancelBtn");
  cancelBtn.addEventListener("click", handleCancel);

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", handleLogout);
}

/**
 * Handle profile update
 */
async function handleProfileUpdate(event) {
  event.preventDefault();

  const saveBtn = document.getElementById("saveProfileBtn");
  const originalText = saveBtn.textContent;

  try {
    // Get form data
    const formData = new FormData(event.target);
    const profileData = {
      name: formData.get("name").trim(),
      email: formData.get("email").trim(),
    };

    // Validate
    if (!profileData.name || !profileData.email) {
      window.bhToast.show("Name and email are required", { type: "error" });
      return;
    }

    // Check if data changed
    if (profileData.name === originalProfileData.name && profileData.email === originalProfileData.email) {
      window.bhToast.show("No changes to save", { type: "info" });
      return;
    }

    // Show loading state
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    const response = await fetch(`/api/bug-hatch/users/profile${forceDemo ? "?demo=true" : ""}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to update profile");
    }

    // Update original data
    originalProfileData = { ...data.data };

    window.bhToast.show("Profile updated successfully", { type: "success" });

    // Update page title
    document.title = `${data.data.name} - Profile - BugHatch`;
  } catch (error) {
    console.error("Failed to update profile:", error);
    window.bhToast.show(error.message || "Failed to update profile", { type: "error" });
  } finally {
    // Reset button state
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }
}

/**
 * Handle password change
 */
async function handlePasswordChange(event) {
  event.preventDefault();

  const changeBtn = document.getElementById("changePasswordBtn");
  const originalText = changeBtn.textContent;

  try {
    // Get form data
    const formData = new FormData(event.target);
    const passwordData = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
    };

    const confirmPassword = formData.get("confirmPassword");

    // Validate
    if (!passwordData.currentPassword || !passwordData.newPassword || !confirmPassword) {
      window.bhToast.show("All password fields are required", { type: "error" });
      return;
    }

    if (passwordData.newPassword !== confirmPassword) {
      window.bhToast.show("New passwords do not match", { type: "error" });
      return;
    }

    if (passwordData.newPassword.length < 2) {
      window.bhToast.show("New password must be at least 2 characters long", { type: "error" });
      return;
    }

    // Show loading state
    changeBtn.textContent = "Changing...";
    changeBtn.disabled = true;

    const response = await fetch(`/api/bug-hatch/users/change-password${forceDemo ? "?demo=true" : ""}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(passwordData),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to change password");
    }

    // Clear form
    event.target.reset();

    window.bhToast.show("Password changed successfully", { type: "success" });
  } catch (error) {
    console.error("Failed to change password:", error);
    window.bhToast.show(error.message || "Failed to change password", { type: "error" });
  } finally {
    // Reset button state
    changeBtn.textContent = originalText;
    changeBtn.disabled = false;
  }
}

/**
 * Handle cancel button
 */
function handleCancel() {
  // Reset form to original values
  document.getElementById("name").value = originalProfileData.name || "";
  document.getElementById("email").value = originalProfileData.email || "";
  window.bhToast.show("Changes cancelled", { type: "info" });
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    await window.bugHatchAuth.handleLogout();
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initProfilePage);
