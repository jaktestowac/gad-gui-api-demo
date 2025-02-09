function injectSidebar() {
  const currentPath = window.location.pathname;
  const sidebarContainer = document.getElementById("sidebarContainer");
  const isUserLoggedIn = isLoggedIn();

  if (!sidebarContainer) return;

  const username = getCookie("learning_username");
  const userRealName = `${getCookie("learning_first_name")} ${getCookie("learning_last_name")}`;
  const avatar = getCookie("learning_user_avatar") ?? "/data/icons/user.png";

  const sidebarHtml = `
        <div class="dashboard-sidebar">
            <div class="user-menu">
                <span id="username">${isUserLoggedIn ? userRealName : "Guest User"}</span>
                <img id="userAvatar" src="${avatar}" alt="User avatar">
            </div>
            <h3>Navigation</h3>
            <nav>
                <a href="dashboard.html" ${currentPath.endsWith("dashboard.html") ? 'class="active"' : ""}>
                    <i class="fas fa-home"></i> Dashboard
                </a>
                ${
                  isUserLoggedIn
                    ? `
                    <a href="enrolled-courses.html" ${
                      currentPath.endsWith("enrolled-courses.html") ? 'class="active"' : ""
                    }>
                        <i class="fas fa-book-reader"></i> My Courses
                    </a>
                    <a href="certificates.html" ${currentPath.endsWith("certificates.html") ? 'class="active"' : ""}>
                        <i class="fas fa-certificate"></i> Certificates
                    </a>
                    <a href="progress.html" ${currentPath.endsWith("progress.html") ? 'class="active"' : ""}>
                        <i class="fas fa-chart-line"></i> Progress
                    </a>
                    <a href="account.html" ${currentPath.endsWith("account.html") ? 'class="active"' : ""}>
                        <i class="fas fa-user-cog"></i> Account Settings
                    </a>
                `
                    : `
                    <a class="disabled-link" title="Please sign in to access">
                        <i class="fas fa-book-reader"></i> My Courses
                    </a>
                    <a class="disabled-link" title="Please sign in to access">
                        <i class="fas fa-certificate"></i> Certificates
                    </a>
                    <a class="disabled-link" title="Please sign in to access">
                        <i class="fas fa-chart-line"></i> Progress
                    </a>
                `
                }
                <hr class="nav-divider">
                <a href="welcome.html">
                    <i class="fas fa-arrow-left"></i> Back to Welcome
                </a>
                ${
                  isUserLoggedIn
                    ? `
                    <a href="#" onclick="handleLogout()">
                        <i class="fas fa-sign-out-alt"></i> Sign Out
                    </a>
                `
                    : `
                    <a href="login.html">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </a>
                `
                }
            </nav>
        </div>
    `;

  sidebarContainer.innerHTML = sidebarHtml;
}

document.addEventListener("DOMContentLoaded", injectSidebar);
