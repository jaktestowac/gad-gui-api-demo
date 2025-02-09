async function loadUserProfile() {
  try {
    const userData = await api.getCurrentUser();

    document.getElementById("userFullName").textContent = `${userData.firstName} ${userData.lastName}`;
    document.getElementById("userAvatarLarge").src = userData.avatar || "/data/icons/user.png";
    document.getElementById("usernameInput").value = userData.username;
    document.getElementById("firstName").value = userData.firstName;
    document.getElementById("lastName").value = userData.lastName;
    document.getElementById("email").value = userData.email;
  } catch (error) {
    console.error("Failed to load user profile:", error);
    notifications.show("Failed to load user profile. Please try again later.", "error");
  }
}

async function handleUpdateProfile() {
  const updateBtn = document.getElementById("updateProfileBtn");
  updateBtn.disabled = true;
  updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

  try {
    const userId = api.getUserIdFromCookie();
    const userData = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      email: document.getElementById("email").value,
    };

    const result = await api.updateUserProfile(userId, userData);

    if (result.success) {
      notifications.show("Profile updated successfully!");
      updateBtn.innerHTML = '<i class="fas fa-check"></i> Updated';
      updateBtn.style.backgroundColor = "#10b981";
    } else {
      throw new Error(result.message || "Failed to update profile");
    }

    setTimeout(() => {
      updateBtn.disabled = false;
      updateBtn.innerHTML = "Update Profile";
      updateBtn.style.backgroundColor = "";
    }, 2000);

    // Refresh the user profile display
    await loadUserProfile();
  } catch (error) {
    notifications.show(error.message || "Failed to update profile", "error");
    updateBtn.disabled = false;
    updateBtn.innerHTML = "Update Profile";
  }
}

async function handleChangePassword() {
  const changeBtn = document.getElementById("changePasswordBtn");
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    alert("New passwords do not match!");
    return;
  }

  changeBtn.disabled = true;
  changeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

  try {
    const userId = api.getUserIdFromCookie();
    const result = await api.changePassword(userId, currentPassword, newPassword);

    if (result.success) {
      notifications.show("Password changed successfully!");
      changeBtn.innerHTML = '<i class="fas fa-check"></i> Updated';
      changeBtn.style.backgroundColor = "#10b981";

      // Clear password fields
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
    } else {
      throw new Error(result.message || "Failed to change password");
    }

    setTimeout(() => {
      changeBtn.disabled = false;
      changeBtn.innerHTML = "Change Password";
      changeBtn.style.backgroundColor = "";
    }, 2000);
  } catch (error) {
    console.error("Failed to change password:", error);
    notifications.show(error.message || "Failed to change password. Please check your current password.", "error");
    changeBtn.disabled = false;
    changeBtn.innerHTML = "Change Password";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  loadUserProfile();

  document.getElementById("updateProfileBtn").addEventListener("click", handleUpdateProfile);
  document.getElementById("changePasswordBtn").addEventListener("click", handleChangePassword);
});
