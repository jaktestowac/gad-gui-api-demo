// Demo parameter propagation & logout text unification
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const url = new URL(window.location.href);
    const hasDemo = url.searchParams.get("demo") === "true";
    if (!hasDemo) return;

    // Toggle demo banner visibility when demo=true is present
    const banner = document.getElementById("demo-banner");
    if (banner) {
      banner.classList.remove("hidden", "bh-hidden");
      banner.classList.add("visible");
    }

    // Adjust logout buttons (different ids on different pages)
    const btns = [document.getElementById("logoutBtn"), document.getElementById("logout-btn")].filter(Boolean);
    btns.forEach((b) => {
      if (b) b.textContent = "Exit Demo";
    });

    // Rewrite internal bug-hatch links to preserve query params
    document.querySelectorAll('a[href^="/bug-hatch/"]').forEach((a) => {
      // Skip if already contains ?demo=true
      if (/([?&])demo=true/.test(a.href)) return;
      // Preserve existing query from original link too
      const linkUrl = new URL(a.href, window.location.origin);
      // Merge both sets of params
      url.searchParams.forEach((val, key) => {
        if (!linkUrl.searchParams.has(key)) linkUrl.searchParams.set(key, val);
      });
      a.href = linkUrl.pathname + "?" + linkUrl.searchParams.toString();
    });
  });
})();
