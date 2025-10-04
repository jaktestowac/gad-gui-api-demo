// BugHatch Issue Detail Logic
(function () {
  const qs = (s) => document.querySelector(s);
  let issueId = null;
  let issueData = null;
  let currentUser = null;
  let isDemo = false;
  let forceDemo = false; // query param enforced demo mode
  let projectWorkflow = null;

  function showError(id, msg) {
    const el = qs(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    el.classList.remove("bh-hidden");
  }
  function clearError(id) {
    const el = qs(id);
    if (el) {
      el.textContent = "";
      el.style.display = "none";
      el.classList.add("bh-hidden");
    }
  }

  function parseQuery() {
    const u = new URL(window.location.href);
    issueId = u.searchParams.get("id");
    forceDemo = u.searchParams.get("demo") === "true"; // forced demo via query
  }

  async function ensureAuth() {
    currentUser = await window.bugHatchAuth.checkAuth();
    if (!currentUser) {
      window.location.href = "/bug-hatch/login.html";
      return false;
    }
    // If forced demo through query, treat as demo (read-only) even if user isn't a demo user
    isDemo = !!currentUser.isDemo || forceDemo;
    const logout = qs("#logoutBtn");
    if (logout) logout.addEventListener("click", window.bugHatchAuth.handleLogout);
    return true;
  }

  async function fetchIssue() {
    if (!issueId) return;
    const resp = await fetch(`/api/bug-hatch/issues/${encodeURIComponent(issueId)}${forceDemo ? "?demo=true" : ""}`, {
      credentials: "include",
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      showError("#editError", data.error || "Failed to load");
      return;
    }
    issueData = data.data;
    renderIssue();
    await fetchProjectWorkflow(issueData.projectId);
    renderTransitions();
  }

  async function fetchProjectWorkflow(projectId) {
    const resp = await fetch(
      `/api/bug-hatch/projects/${encodeURIComponent(projectId)}${forceDemo ? "?demo=true" : ""}`,
      { credentials: "include" }
    );
    const data = await resp.json().catch(() => ({}));
    if (resp.ok) projectWorkflow = data?.data?.project?.workflow || null;
  }

  function renderIssue() {
    if (!issueData) return;
    qs("#issueTitle").textContent = issueData.title;
    qs("#issueKey").textContent = issueData.key;
    qs("#fieldTitle").value = issueData.title;
    qs("#fieldType").value = issueData.type;
    qs("#fieldPriority").value = issueData.priority;
    qs("#fieldAssignee").value = issueData.assigneeId || "";
    qs("#fieldLabels").value = (issueData.labels || []).join(", ");
    qs("#fieldDescription").value = issueData.description || "";
    qs("#currentStatus").textContent = issueData.status;
    if (isDemo) {
      qs("#issueEditForm")
        .querySelectorAll("input,textarea,select,button[type=submit]")
        .forEach((el) => (el.disabled = true));
    }
  }

  function renderTransitions() {
    const container = qs("#transitionButtons");
    if (!container) return;
    container.innerHTML = "";
    if (!projectWorkflow) return;
    const allowed = projectWorkflow.transitions?.[issueData.status] || [];
    if (!allowed.length) {
      container.innerHTML = '<span class="bh-text-dim bh-text-2xs">No further transitions</span>';
      return;
    }
    allowed.forEach((to) => {
      const btn = document.createElement("button");
      btn.className = "bh-btn bh-btn-secondary bh-btn-2xs";
      btn.textContent = to;
      btn.addEventListener("click", () => doTransition(to));
      if (isDemo || forceDemo) btn.disabled = true; // disable in any demo mode
      container.appendChild(btn);
    });
  }

  async function doTransition(to) {
    clearError("#transitionError");
    const resp = await fetch(`/api/bug-hatch/issues/${encodeURIComponent(issueId)}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ toStatus: to }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      showError("#transitionError", data.error || "Transition failed");
      return;
    }
    issueData = data.data;
    renderIssue();
    renderTransitions();
  }

  function collectPatch() {
    return {
      title: qs("#fieldTitle").value.trim(),
      type: qs("#fieldType").value,
      priority: qs("#fieldPriority").value,
      assigneeId: qs("#fieldAssignee").value.trim() || null,
      labels: qs("#fieldLabels")
        .value.split(",")
        .map((l) => l.trim())
        .filter(Boolean),
      description: qs("#fieldDescription").value.trim(),
    };
  }

  async function saveIssue(e) {
    e.preventDefault();
    if (isDemo) {
      showError("#editError", "Demo mode: read-only");
      return;
    }
    clearError("#editError");
    const patch = collectPatch();
    const resp = await fetch(`/api/bug-hatch/issues/${encodeURIComponent(issueId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      showError("#editError", data.error || "Save failed");
      return;
    }
    issueData = data.data;
    renderIssue();
  }

  function init() {
    parseQuery();
    if (!issueId) {
      showError("#editError", "Missing issue id");
      return;
    }
    qs("#issueEditForm").addEventListener("submit", saveIssue);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await ensureAuth())) return;
    init();
    fetchIssue();
  });
})();
