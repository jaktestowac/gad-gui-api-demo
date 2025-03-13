function initializeSidebar() {
  setTimeout(() => {
    const sidebar = document.querySelector(".dashboard-sidebar");
    const mobileMenuButton = document.querySelector(".mobile-menu-button");
    const overlay = document.querySelector(".sidebar-overlay");

    if (!sidebar || !mobileMenuButton || !overlay) return;

    function toggleSidebar() {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
      document.body.style.overflow = sidebar.classList.contains("active") ? "hidden" : "";
    }

    mobileMenuButton.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", toggleSidebar);

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768 && sidebar.classList.contains("active")) {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }, 100);
}

document.addEventListener("DOMContentLoaded", initializeSidebar);
