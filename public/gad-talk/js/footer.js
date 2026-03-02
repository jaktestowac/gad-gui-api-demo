(function () {
  // centralized footer module for GadTalk pages
  const footerHtml = `
    <a href="/gad-talk/terms.html" class="gt-link-muted">Terms</a>
    <a href="/gad-talk/privacy.html" class="gt-link-muted">Privacy</a>
    <a href="/gad-talk/about.html" class="gt-link-muted">About</a>
    <a href="/api/gad-talk/admin/backend" class="gt-btn gt-btn-secondary gt-btn-sm">Backend</a>
    <span>
      <span class="gt-text-muted">jaktestowac.pl © <span class="gt-year"></span> GadTalk</span>
        <br />
      <a href="https://jaktestowac.pl" target="_blank" rel="noopener" style="margin-left: 2px; margin-right: 2px; ">jaktestowac.pl</a> 
      <span aria-hidden="true">|</span>
      <a href="https://github.com/jaktestowac/gad-gui-api-demo" target="_blank" rel="noopener" aria-label="Visit GitHub Repository (opens in a new tab)"><i class="fab fa-github"></i><span class="sr-only">GitHub</span></a>
      <span aria-hidden="true">|</span>
      <a href="https://www.youtube.com/@jaktestowac?sub_confirmation=1" target="_blank" rel="noopener" aria-label="YouTube jaktestowac.pl"><i class="fab fa-youtube"></i><span class="sr-only">YouTube</span></a>
      <span aria-hidden="true">|</span>
      <a href="https://www.linkedin.com/company/jaktestowac" target="_blank" rel="noopener" aria-label="LinkedIn jaktestowac.pl"><i class="fab fa-linkedin"></i><span class="sr-only">LinkedIn</span></a>
      <br />
      <a href="https://aitesters.pl" target="_blank" rel="noopener" style="margin-left: 2px; margin-right: 2px; ">AI_Testers</a> 
      <span aria-hidden="true">|</span>
      <a href="https://www.youtube.com/@AITesterspl?sub_confirmation=1" target="_blank" rel="noopener" aria-label="YouTube AI_Testers" data-testid="footer-youtube" class="footer-youtube-link" style="margin-left: 2px; margin-right: 2px; ">
        <i class="fab fa-youtube" aria-hidden="true"></i><span class="sr-only">YouTube AI_Testers</span>
      </a>
      <span aria-hidden="true">|</span>
      <a href="https://www.linkedin.com/company/aitesters" target="_blank" rel="noopener" aria-label="LinkedIn AI_Testers" data-testid="footer-linkedin" class="footer-linkedin-link" style="margin-left: 2px; margin-right: 2px; ">
        <i class="fab fa-linkedin" aria-hidden="true"></i><span class="sr-only">LinkedIn AI_Testers</span>
      </a>
  </span>
  `;

  function updateYear(container) {
    try {
      const y = new Date().getFullYear();
      const els = (container || document).querySelectorAll(".gt-year");
      for (var i = 0; i < els.length; i++) {
        els[i].textContent = y;
      }
    } catch (e) {
      // ignore
    }
  }

  function renderFooter(el) {
    if (!el) return;
    el.innerHTML = footerHtml;
    updateYear(el);
  }

  // automatically render into any marked footer on DOMContentLoaded
  function autoRender() {
    document.querySelectorAll("footer.gt-sidebar-footer[data-auto-footer]").forEach(renderFooter);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoRender);
  } else {
    // DOM already ready
    autoRender();
  }

  // expose for manual use
  window.gadTalkFooter = {
    renderFooter: renderFooter,
    updateYear: updateYear,
    html: footerHtml,
  };
})();
