function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split("/").pop();

  document.querySelectorAll(".mp-nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    const linkPage = href.split("?")[0].split("/").pop();

    if (
      currentPage === linkPage ||
      (currentPage === "multipage-v1.html" && href.includes("../multipage-v1.html")) ||
      (currentPage === "" && href.includes("multipage-v1.html"))
    ) {
      link.classList.add("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", highlightCurrentPage);
