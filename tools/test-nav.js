const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

async function runTest(file) {
  const html = fs.readFileSync(path.resolve(file), "utf-8");
  const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
  const { window } = dom;

  // Stub required globals before scripts run
  window.gadTalkAuth = {
    optionalAuth: async () => ({ username: "tester", displayName: "Test User", avatar: "" }),
    requireAuth: async () => ({ username: "tester", displayName: "Test User", avatar: "" }),
  };
  window.gadTalkGads = {
    getAvatarHtml: (user, size) =>
      `<div class="gt-avatar gt-avatar-${size}">${user.username.charAt(0).toUpperCase()}</div>`,
  };
  window.GadTalkUI = {
    showDropdown: () => {},
  };

  // Load scripts synchronously: append nav script manually
  const navPath = path.resolve(__dirname, "..", "public", "gad-talk", "js", "nav.js");
  const navScript = fs.readFileSync(navPath, "utf-8");

  // Wait for DOMContentLoaded then run nav script
  dom.window.document.addEventListener("DOMContentLoaded", () => {
    try {
      dom.window.eval(navScript);
    } catch (e) {
      console.error("nav script eval error:", e);
    }
  });

  // Return a promise to wait until navUserSection appears or timeout
  return new Promise((resolve) => {
    const check = () => {
      const el = dom.window.document.getElementById("nav-user-section");
      if (el) {
        const hasNavUser = el.querySelector(".gt-nav-user") || el.querySelector(".gt-nav-avatar");
        resolve({ found: !!hasNavUser, html: el.innerHTML.trim().slice(0, 200) });
      } else {
        // wait and retry
        setTimeout(check, 50);
      }
    };
    setTimeout(check, 50);

    // Fallback timeout
    setTimeout(() => resolve({ found: false, html: "" }), 2000);
  });
}

(async function () {
  const pages = [
    path.resolve(__dirname, "..", "public", "gad-talk", "explore.html"),
    path.resolve(__dirname, "..", "public", "gad-talk", "notifications.html"),
    path.resolve(__dirname, "..", "public", "gad-talk", "bookmarks.html"),
  ];

  for (const p of pages) {
    try {
      const result = await runTest(p);
      console.log(`${p} -> found: ${result.found}, sample: ${result.html}`);
    } catch (e) {
      console.error("Error testing", p, e);
    }
  }
})();
