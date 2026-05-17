(function () {
  // Populate the nav user section across pages
  async function initNav() {
    if (!window.gadTalkAuth) return;

    const currentUser = await window.gadTalkAuth.optionalAuth();
    const navUserSection = document.getElementById("nav-user-section");
    if (!navUserSection) return;
    // Don't override if the page already set the nav (inline scripts)
    // If page has already rendered a nav user element (.gt-nav-user or .gt-nav-avatar), don't override it
    if (navUserSection.querySelector(".gt-nav-user") || navUserSection.querySelector(".gt-nav-avatar")) return;

    if (!currentUser) {
      // Guest - show login / signup
      navUserSection.innerHTML = `
          <div class="gt-nav-user gt-flex gt-gap-sm">
            <a href="/gad-talk/login.html" class="gt-btn gt-btn-secondary gt-btn-sm" data-testid="nav-login-button">Login</a>
            <a href="/gad-talk/signup.html" class="gt-btn gt-btn-primary gt-btn-sm" data-testid="nav-signup-button">Sign up</a>
          </div>
        `;
      const navProfile = document.getElementById("nav-profile");
      if (navProfile) {
        navProfile.href = "/gad-talk/login.html";
      }
      return;
    }

    // Authenticated - show avatar + dropdown like other pages
    const avatarHtml =
      window.gadTalkGads && window.gadTalkGads.getAvatarHtml
        ? window.gadTalkGads.getAvatarHtml(currentUser, "sm")
        : `<div class="gt-avatar gt-avatar-sm">${
            currentUser.avatar || currentUser.username.charAt(0).toUpperCase()
          }</div>`;

    navUserSection.innerHTML = `
      <div class="gt-nav-user">
        <button class="gt-nav-user-btn" id="nav-user-dropdown-btn" aria-haspopup="true" aria-expanded="false">
          ${avatarHtml}
          <span class="gt-nav-user-name">${currentUser.displayName || currentUser.username}</span>
          <span class="gt-nav-user-chevron"><i class="fa-solid fa-chevron-down"></i></span>
        </button>
      </div>
    `;

    const navProfile = document.getElementById("nav-profile");
    if (navProfile) {
      navProfile.href = `/gad-talk/@${encodeURIComponent(currentUser.username)}`;
    }

    const dropdownBtn = navUserSection.querySelector("#nav-user-dropdown-btn");
    if (dropdownBtn && window.GadTalkUI) {
      dropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownBtn.setAttribute("aria-expanded", "true");
        window.GadTalkUI.showDropdown(
          dropdownBtn,
          [
            {
              text: "Profile",
              icon: '<i class="fa-solid fa-user"></i>',
              onClick: () => {
                window.location.href = `/gad-talk/@${encodeURIComponent(currentUser.username)}`;
              },
            },
            {
              text: "Bookmarks",
              icon: '<i class="fa-solid fa-bookmark"></i>',
              onClick: () => {
                window.location.href = "/gad-talk/bookmarks.html";
              },
            },
            { divider: true },
            {
              text: "Logout",
              icon: '<i class="fa-solid fa-right-from-bracket"></i>',
              danger: true,
              onClick: () => window.gadTalkAuth.handleLogout(),
            },
          ],
          { align: "right" }
        );

        // Close on doc click
        setTimeout(() => {
          const onDocClick = () => {
            dropdownBtn.setAttribute("aria-expanded", "false");
            document.removeEventListener("click", onDocClick);
          };
          document.addEventListener("click", onDocClick);
        }, 0);
      });
    } else if (dropdownBtn) {
      dropdownBtn.addEventListener("click", () => {
        window.location.href = `/gad-talk/@${encodeURIComponent(currentUser.username)}`;
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNav);
  } else {
    initNav();
  }
})();
