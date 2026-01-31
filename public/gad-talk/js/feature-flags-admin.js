(function () {
  async function fetchFlags() {
    const res = await fetch("/api/gad-talk/admin/feature-flags");
    const json = await res.json();
    return (json && (json.data || json.flags)) || [];
  }

  async function setFlag(key, enabled) {
    await fetch("/api/gad-talk/admin/feature-flags/" + encodeURIComponent(key), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
  }

  function renderFlags(flags) {
    const root = document.getElementById("flags");
    if (!root) return;
    if (!flags.length) {
      root.innerHTML = '<p class="small">No feature flags configured.</p>';
      return;
    }
    root.innerHTML = flags
      .map(function (flag) {
        const desc = flag.description ? '<div class="small">' + flag.description + "</div>" : "";
        const btnClass = flag.enabled ? "" : "off";
        const btnLabel = flag.enabled ? "Enabled" : "Disabled";
        return (
          '<div class="row">' +
          "<div>" +
          "<strong>" +
          flag.key +
          "</strong>" +
          desc +
          '<div class="tag">Updated: ' +
          (flag.updatedAt || "n/a") +
          "</div>" +
          "</div>" +
          '<button class="' +
          btnClass +
          '" data-flag="' +
          flag.key +
          '" data-enabled="' +
          flag.enabled +
          '">' +
          btnLabel +
          "</button>" +
          "</div>"
        );
      })
      .join("");

    root.querySelectorAll("button[data-flag]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const key = btn.getAttribute("data-flag");
        const enabled = btn.getAttribute("data-enabled") === "true";
        await setFlag(key, !enabled);
        const updated = await fetchFlags();
        renderFlags(updated);
      });
    });
  }

  fetchFlags()
    .then(renderFlags)
    .catch(function () {
      const root = document.getElementById("flags");
      if (root) root.innerHTML = '<p class="small">Failed to load flags.</p>';
    });
})();
