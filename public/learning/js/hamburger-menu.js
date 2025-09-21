function isLoggedIn() {
  return getCookie("learning_user_id") !== null;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function toggleSidebar(sidebar, overlay) {
  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
  document.body.style.overflow = sidebar.classList.contains("active") ? "hidden" : "";
}

function toggleHamburgerMenu(hamburgerMenu) {
  hamburgerMenu.classList.toggle("active");
  document.body.style.overflow = hamburgerMenu.classList.contains("active") ? "hidden" : "";

  console.log("Toggling hamburger menu", hamburgerMenu);
}

function initializeHamburgerMenu() {
  // Inject mobile menu button if not present
  //   if (!document.querySelector(".mobile-menu-button")) {
  //     const button = document.createElement("button");
  //     button.className = "mobile-menu-button";
  //     button.innerHTML = '<i class="fas fa-bars"></i>';
  //     button.setAttribute("aria-label", "Open menu");
  //     document.body.appendChild(button);
  //   }

  // Inject sidebar overlay if not present
  if (!document.querySelector(".sidebar-overlay")) {
    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);
  }

  const mobileMenuButton = document.querySelector(".hamburger");
  const overlay = document.querySelector(".sidebar-overlay");

  if (!mobileMenuButton || !overlay) return;

  // For pages without sidebar, create and toggle a simple hamburger menu
  let hamburgerMenu = document.querySelector(".hamburger-menu");
  if (!hamburgerMenu) {
    hamburgerMenu = document.createElement("nav");
    hamburgerMenu.className = "hamburger-menu";
    hamburgerMenu.innerHTML = `
          <a href="welcome.html" aria-label="Home" class="learning-hamburger-link">
            <i class="fas fa-home"></i> Home
          </a>
          ${
            isLoggedIn()
              ? `
            <a href="dashboard.html" aria-label="Dashboard" class="learning-hamburger-link">
              <i class="fas fa-tachometer-alt"></i> Dashboard
            </a>
            <a href="account.html" aria-label="Account Settings" class="learning-hamburger-link">
              <i class="fas fa-user-cog"></i> Account
            </a>
          `
              : `
            <a href="login.html" aria-label="Login" class="learning-hamburger-link">
              <i class="fas fa-sign-in-alt"></i> Login
            </a>
            <a href="register.html" aria-label="Register" class="learning-hamburger-link">
              <i class="fas fa-user-plus"></i> Register
            </a>
          `
          }
          <a href="business-requirements.html" aria-label="Business Requirements" class="learning-hamburger-link">
            <i class="fas fa-file-alt"></i> Requirements
          </a>
      `;
    const menuMain = document.getElementById("menu-main-gui-learning");
    if (menuMain) {
      menuMain.appendChild(hamburgerMenu);
    } else {
      document.body.appendChild(hamburgerMenu);
    }

    mobileMenuButton.addEventListener("click", () => toggleHamburgerMenu(hamburgerMenu));

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768 && hamburgerMenu.classList.contains("active")) {
        hamburgerMenu.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initializeHamburgerMenu);
