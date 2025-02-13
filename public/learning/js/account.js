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

async function loadUserFunds() {
  try {
    const userId = api.getUserIdFromCookie();
    const [funds, history] = await Promise.all([api.getUserFunds(userId), api.getUserFundsHistory(userId)]);

    document.getElementById("userFunds").textContent = funds.toFixed(2);

    const transactionsList = document.querySelector(".transactions-list");
    transactionsList.innerHTML = history
      .slice(0, 10)
      .map(
        (transaction) => `
        <div class="transaction-item">
          <div class="transaction-info">
            <span class="transaction-description" title="${transaction.description}">${transaction.description}</span>
            <span class="transaction-date">${new Date(transaction.timestamp).toLocaleDateString()}</span>
          </div>
          <span class="transaction-amount ${transaction.type}">
            ${transaction.type === "credit" ? "+" : "-"}$${transaction.amount.toFixed(2)}
          </span>
        </div>
      `
      )
      .join("");
  } catch (error) {
    console.error("Failed to load user funds:", error);
    showNotification("Failed to load account balance", "error");
  }
}

function showTopUpDialog() {
  const dialog = document.createElement("div");
  dialog.innerHTML = `
    <div class="dialog-overlay"></div>
    <div class="top-up-dialog">
      <h3>Top Up Funds</h3>
      <div class="top-up-amounts">
        <div class="amount-option" data-amount="10">$10</div>
        <div class="amount-option" data-amount="25">$25</div>
        <div class="amount-option" data-amount="50">$50</div>
        <div class="amount-option" data-amount="100">$100</div>
        <div class="amount-option" data-amount="200">$200</div>
        <div class="amount-option" data-amount="500">$500</div>
      </div>
      <div class="dialog-actions">
        <button class="cancel">Cancel</button>
        <button class="confirm" disabled>Top Up</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  let selectedAmount = 0;
  const confirmButton = dialog.querySelector(".confirm");

  dialog.querySelectorAll(".amount-option").forEach((option) => {
    option.addEventListener("click", () => {
      dialog.querySelectorAll(".amount-option").forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      selectedAmount = parseFloat(option.dataset.amount);
      confirmButton.disabled = false;
    });
  });

  dialog.querySelector(".cancel").addEventListener("click", () => {
    document.body.removeChild(dialog);
  });

  dialog.querySelector(".confirm").addEventListener("click", async () => {
    try {
      const userId = api.getUserIdFromCookie();
      const currentFunds = await api.getUserFunds(userId);
      const newAmount = currentFunds + selectedAmount;

      await api.updateUserFunds(userId, newAmount);
      await loadUserFunds();

      showNotification(`Successfully added $${selectedAmount.toFixed(2)} to your account`, "success");
      document.body.removeChild(dialog);
    } catch (error) {
      showNotification("Failed to top up funds", "error");
      console.error("Top up error:", error);
    }
  });

  dialog.querySelector(".dialog-overlay").addEventListener("click", () => {
    document.body.removeChild(dialog);
  });
}

async function handleUpdateProfile() {
  const updateBtn = document.getElementById("updateProfileBtn");
  const currentPassword = document.getElementById("confirmProfilePassword").value;

  if (!currentPassword) {
    notifications.show("Please enter your current password", "error");
    return;
  }

  updateBtn.disabled = true;
  updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

  try {
    const userId = api.getUserIdFromCookie();
    const userData = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      email: document.getElementById("email").value,
      currentPassword: currentPassword,
    };

    const result = await api.updateUserProfile(userId, userData);

    if (result.success) {
      notifications.show("Profile updated successfully! Please sign in again.");
      updateBtn.innerHTML = '<i class="fas fa-check"></i> Updated';
      updateBtn.style.backgroundColor = "#10b981";

      document.getElementById("confirmProfilePassword").value = "";

      setTimeout(() => {
        handleLogout();
        window.location.href = "login.html";
      }, 1500);
    } else {
      throw new Error(result.message || "Failed to update profile");
    }
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

function handleNavigation() {
  const sections = document.querySelectorAll(".account-section");
  const navLinks = document.querySelectorAll(".floating-nav a");
  let currentActiveSection = null;

  const topLink = document.querySelector('.floating-nav a[href="#top-section"]');
  navLinks.forEach((link) => link.classList.remove("active"));
  topLink.classList.add("active");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const targetId = entry.target.id;
        const targetLink = document.querySelector(`.floating-nav a[href="#${targetId}"]`);

        if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
          currentActiveSection = targetId;
          navLinks.forEach((link) => link.classList.remove("active"));
          if (targetLink) targetLink.classList.add("active");
        }
      });
    },
    {
      threshold: 0.3,
      rootMargin: "-20% 0px -20% 0px",
    }
  );

  sections.forEach((section) => observer.observe(section));

  window.addEventListener("scroll", () => {
    if (window.scrollY < 100) {
      navLinks.forEach((link) => link.classList.remove("active"));
      topLink.classList.add("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  loadUserProfile();
  loadUserFunds();

  document.getElementById("updateProfileBtn").addEventListener("click", handleUpdateProfile);
  document.getElementById("changePasswordBtn").addEventListener("click", handleChangePassword);
  document.getElementById("topUpBtn").addEventListener("click", showTopUpDialog);
  handleNavigation();
});
