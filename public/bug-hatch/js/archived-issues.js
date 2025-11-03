// BugHatch Archived Issues Page Logic
(function () {
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));
  let currentUser = null;
  let currentWorkflow = null;
  let isDemo = false;
  let forceDemo = false;

  function parseQuery() {
    const u = new URL(window.location.href);
    const projectId = u.searchParams.get("id");
    if (projectId) {
      qs("#filterProject").value = projectId;
      // Update back to project link
      const backLink = qs("#backToProject");
      if (backLink) {
        backLink.href = `/bug-hatch/project.html?id=${encodeURIComponent(projectId)}`;
      }
    }
    forceDemo = u.searchParams.get("demo") === "true";
  }

  async function ensureAuth() {
    currentUser = await window.bugHatchAuth.checkAuth().catch(() => null);
    if (!currentUser) {
      if (forceDemo) return true;
      window.location.href = "/bug-hatch/login.html";
      return false;
    }
    const logoutBtn = qs("#logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", window.bugHatchAuth.handleLogout);
    isDemo = currentUser.isDemo;
    return true;
  }

  async function fetchProjectMeta(projectInput) {
    if (!projectInput) return null;
    let metaResp = await fetch(`/api/bug-hatch/projects/${encodeURIComponent(projectInput)}`, {
      credentials: "include",
    });
    if (!metaResp.ok) {
      // Try by key
      const pdata = await fetch("/api/bug-hatch/projects", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const projects = pdata?.data?.projects || [];
      const byKey = projects.find((p) => (p.key || "").toLowerCase() === projectInput.toLowerCase());
      if (byKey) {
        metaResp = await fetch(`/api/bug-hatch/projects/${encodeURIComponent(byKey.id)}`, { credentials: "include" });
      }
    }
    if (!metaResp.ok) return null;
    const metaData = await metaResp.json();
    const project = metaData?.data?.project || null;
    // Toggle demo banner if project is a demo
    if (project?.demo) {
      window.toggleDemoBanner(project);
    }
    return project;
  }

  function renderStatusesSelect(statuses) {
    const sel = qs("#filterStatus");
    if (!sel) return;
    const current = sel.value;
    // reset options except Any
    sel.innerHTML =
      '<option value="">Any</option>' + statuses.map((s) => `<option value="${s}">${s}</option>`).join("");
    if (current && statuses.includes(current)) sel.value = current;
  }

  function formatTime(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  async function unarchiveIssue(issueId) {
    if (isDemo || forceDemo) {
      alert("Cannot unarchive issues in demo mode");
      return;
    }
    if (!confirm("Are you sure you want to unarchive this issue?")) return;

    try {
      const resp = await fetch(`/api/bug-hatch/issues/${encodeURIComponent(issueId)}/unarchive`, {
        method: "POST",
        credentials: "include",
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        alert(data.error || "Failed to unarchive issue");
        return;
      }
      // Reload issues
      loadIssues();
    } catch (e) {
      alert("Network error: " + e.message);
    }
  }

  function renderIssuesTable(issues) {
    const tbody = qs("#issuesTbody");
    if (!tbody) return;
    if (!issues.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="bh-text-center bh-text-dim">No archived issues found</td></tr>';
      return;
    }
    tbody.innerHTML = issues
      .map((i) => {
        const canUnarchive = !isDemo && !forceDemo && currentUser && currentUser.role !== "viewer";
        return `<tr data-issue-id="${i.id}" class="bh-row-hover">
        <td><a href="/bug-hatch/issue.html?id=${encodeURIComponent(i.id)}" class="bh-link">${i.key}</a></td>
        <td title="${i.title}">${i.title}</td>
        <td><span class="bh-badge">${i.status}</span></td>
        <td>${i.type}</td>
        <td>${i.priority}</td>
        <td>${
          i.assigneeId ? `<span class="bh-text-dim">${i.assigneeId}</span>` : '<span class="bh-text-faint">—</span>'
        }</td>
        <td class="bh-text-dim">${formatTime(i.updatedAt)}</td>
        <td>
          ${
            canUnarchive
              ? `<button class="bh-btn bh-btn-secondary bh-btn-xs unarchive-btn" data-issue-id="${i.id}" title="Unarchive issue">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
            </svg>
          </button>`
              : ""
          }
        </td>
      </tr>`;
      })
      .join("");

    // Bind unarchive buttons
    qsa(".unarchive-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const issueId = btn.dataset.issueId;
        if (issueId) unarchiveIssue(issueId);
      });
    });
  }

  async function loadIssues() {
    const filters = serializeFilters();
    if (!filters.project) {
      renderIssuesTable([]);
      qs("#issuesMeta").textContent = "Provide a project to load archived issues.";
      return;
    }
    qs("#issuesMeta").textContent = "Loading...";

    // Fetch project to get workflow statuses
    const project = await fetchProjectMeta(filters.project);
    if (project && project.workflow?.statuses) {
      renderStatusesSelect(project.workflow.statuses);
    }

    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
    if (filters.labels) params.set("labels", filters.labels);
    if (filters.search) params.set("search", filters.search);
    params.set("limit", filters.limit);
    params.set("order", "desc");
    params.set("includeArchived", "true"); // Include archived issues
    if (isDemo || forceDemo) params.set("demo", "true");

    const resp = await fetch(
      `/api/bug-hatch/projects/${encodeURIComponent(filters.project)}/issues?${params.toString()}`,
      { credentials: "include" }
    );
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      qs("#issuesMeta").textContent = data.error || "Failed to load archived issues";
      renderIssuesTable([]);
      return;
    }
    const allIssues = data?.data?.issues || [];
    // Filter to only archived issues
    const archivedIssues = allIssues.filter((i) => i.archived);
    qs("#issuesMeta").textContent = `${archivedIssues.length} archived issue(s)`;
    renderIssuesTable(archivedIssues);
  }

  function serializeFilters() {
    return {
      project: qs("#filterProject").value.trim(),
      status: qs("#filterStatus").value,
      type: qs("#filterType").value,
      assigneeId: qs("#filterAssignee").value.trim(),
      labels: qs("#filterLabels").value.trim(),
      search: qs("#filterSearch").value.trim(),
      limit: "200",
    };
  }

  function resetFilters() {
    ["#filterStatus", "#filterType", "#filterAssignee", "#filterLabels", "#filterSearch"].forEach((id) => {
      const el = qs(id);
      if (el) el.value = "";
    });
    loadIssues();
  }

  async function init() {
    parseQuery();
    if (!(await ensureAuth())) return;

    // Bind events
    qs("#filtersForm").addEventListener("submit", (e) => {
      e.preventDefault();
      loadIssues();
    });
    qs("#resetFilters").addEventListener("click", resetFilters);

    // Auto-load if project is specified
    const projectInput = qs("#filterProject").value.trim();
    if (projectInput) {
      loadIssues();
    }
  }

  // Start when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
