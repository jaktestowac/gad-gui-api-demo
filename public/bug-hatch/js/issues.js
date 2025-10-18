// BugHatch Issues Page Logic (Phase 3 UI)
(function () {
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));
  let currentUser = null;
  let currentWorkflow = null;
  let isDemo = false;
  let forceDemo = false;

  function showModal(id) {
    const el = qs(id);
    if (!el) return;
    el.setAttribute("aria-hidden", "false");
    el.classList.remove("hidden");
    el.classList.add("open");
    const panel = el.querySelector(".bh-modal-dialog");
    if (panel) {
      panel.classList.add("opacity-0", "translate-y-1", "scale-95");
      requestAnimationFrame(() => {
        panel.classList.add("transition", "duration-150");
        panel.classList.remove("opacity-0", "translate-y-1", "scale-95");
        panel.classList.add("opacity-100", "translate-y-0", "scale-100");
      });
    }
  }
  function closeModal(el) {
    el.setAttribute("aria-hidden", "true");
    const panel = el.querySelector(".bh-modal-dialog");
    if (panel) {
      panel.classList.add("transition", "duration-150", "opacity-0", "translate-y-1", "scale-95");
      setTimeout(() => {
        el.classList.add("hidden");
        el.classList.remove("open");
        panel.classList.remove("opacity-0", "translate-y-1", "scale-95", "opacity-100", "translate-y-0", "scale-100");
      }, 150);
    } else {
      el.classList.add("hidden");
      el.classList.remove("open");
    }
  }

  function bindModalEvents() {
    qsa("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const modal = btn.closest(".bh-modal");
        if (modal) closeModal(modal);
      });
    });
    qsa(".bh-modal-backdrop").forEach((b) =>
      b.addEventListener("click", () => {
        const modal = b.closest(".bh-modal");
        if (modal) closeModal(modal);
      })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") qsa(".bh-modal.open").forEach((m) => closeModal(m));
    });
  }

  async function ensureAuth() {
    currentUser = await window.bugHatchAuth.checkAuth();
    if (!currentUser) {
      window.location.href = "/bug-hatch/login.html";
      return false;
    }
    const u = new URL(window.location.href);
    forceDemo = u.searchParams.get("demo") === "true";
    isDemo = !!currentUser.isDemo || forceDemo;
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", window.bugHatchAuth.handleLogout);
    return true;
  }

  function serializeFilters() {
    const projectVal = qs("#filterProject").value.trim();
    const filters = {
      project: projectVal,
      status: qs("#filterStatus").value.trim(),
      type: qs("#filterType").value.trim(),
      assigneeId: qs("#filterAssignee").value.trim(),
      labels: qs("#filterLabels").value.trim(),
      search: qs("#filterSearch").value.trim(),
      limit: 200,
      order: "desc",
    };
    return filters;
  }

  async function fetchProjectMeta(projectInput) {
    if (!projectInput) return null;
    // attempt fetch by id first then rely on fallback in issue list; but we want workflow statuses
    let metaResp = await fetch(`/api/bug-hatch/projects/${encodeURIComponent(projectInput)}`, {
      credentials: "include",
    });
    if (!metaResp.ok) {
      // try listing projects and finding by key (client fallback) to get id for statuses
      const list = await fetch("/api/bug-hatch/projects", { credentials: "include" });
      if (list.ok) {
        const pdata = await list.json();
        const projects = pdata?.data?.projects || [];
        const byKey = projects.find((p) => (p.key || "").toLowerCase() === projectInput.toLowerCase());
        if (byKey) {
          metaResp = await fetch(`/api/bug-hatch/projects/${encodeURIComponent(byKey.id)}`, { credentials: "include" });
        }
      }
    }
    if (!metaResp.ok) return null;
    const metaData = await metaResp.json();
    return metaData?.data?.project || null;
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

  function renderIssuesTable(issues) {
    const tbody = qs("#issuesTbody");
    if (!tbody) return;
    if (!issues.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="bh-text-center bh-text-dim">No issues found</td></tr>';
      return;
    }
    tbody.innerHTML = issues
      .map((i) => {
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
      </tr>`;
      })
      .join("");
  }

  async function loadIssues() {
    const filters = serializeFilters();
    if (!filters.project) {
      renderIssuesTable([]);
      qs("#issuesMeta").textContent = "Provide a project to load issues.";
      return;
    }
    qs("#issuesMeta").textContent = "Loading...";
    // Use demo force if user is demo or we want consistent sample (optional)
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
    if (filters.labels) params.set("labels", filters.labels);
    if (filters.search) params.set("search", filters.search);
    params.set("limit", filters.limit);
    params.set("order", "desc");
    if (isDemo || forceDemo) params.set("demo", "true");

    const resp = await fetch(
      `/api/bug-hatch/projects/${encodeURIComponent(filters.project)}/issues?${params.toString()}`,
      { credentials: "include" }
    );
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      qs("#issuesMeta").textContent = data.error || "Failed to load issues";
      renderIssuesTable([]);
      return;
    }
    const issues = data?.data?.issues || [];
    qs("#issuesMeta").textContent = `${issues.length} issue(s)`;
    renderIssuesTable(issues);
  }

  function resetFilters() {
    ["#filterStatus", "#filterType", "#filterAssignee", "#filterLabels", "#filterSearch"].forEach((id) => {
      const el = qs(id);
      if (el) el.value = "";
    });
    loadIssues();
  }

  async function handleCreateIssue(e) {
    e.preventDefault();
    if (isDemo) {
      showCreateError("Demo mode: creation disabled");
      return;
    }
    const projectId = qs("#createProjectId").value.trim();
    const title = qs("#createTitle").value.trim();
    if (!projectId || !title) {
      showCreateError("Project ID and Title required");
      return;
    }
    const body = {
      projectId,
      title,
      type: qs("#createType").value,
      priority: qs("#createPriority").value,
      assigneeId: qs("#createAssignee").value.trim() || null,
      labels: (qs("#createLabels").value || "")
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
      description: qs("#createDescription").value.trim(),
    };
    const resp = await fetch(
      `/api/bug-hatch/projects/${encodeURIComponent(projectId)}/issues${forceDemo ? "?demo=true" : ""}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }
    );
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      showCreateError(data.error || "Create failed");
      return;
    }
    // success
    const modal = qs("#createIssueModal");
    closeModal(modal);
    modal.querySelector("form").reset();
    // If viewing same project reload
    if (qs("#filterProject").value.trim().toLowerCase() === projectId.toLowerCase()) {
      loadIssues();
    }
  }

  function showCreateError(msg) {
    const el = qs("#createIssueError");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    el.classList.remove("bh-hidden");
  }

  async function syncWorkflowStatuses(projectInput) {
    const meta = await fetchProjectMeta(projectInput);
    if (!meta) return;
    // Normalized project id available as meta.id if needed later
    currentWorkflow = meta.workflow || null;
    if (currentWorkflow && Array.isArray(currentWorkflow.statuses)) {
      renderStatusesSelect(currentWorkflow.statuses);
    }
  }

  function init() {
    bindModalEvents();
    const createBtn = qs("#createIssueBtn");
    if (createBtn)
      createBtn.addEventListener("click", () => {
        const projectVal = qs("#filterProject").value.trim();
        if (projectVal) qs("#createProjectId").value = projectVal;
        showModal("#createIssueModal");
      });

    const filtersForm = qs("#filtersForm");
    filtersForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await syncWorkflowStatuses(qs("#filterProject").value.trim());
      loadIssues();
    });
    qs("#resetFilters").addEventListener("click", resetFilters);

    qs("#createIssueForm").addEventListener("submit", handleCreateIssue);

    // Auto-load if project passed via query (?project=CORE)
    const url = new URL(window.location.href);
    const qp = url.searchParams.get("project");
    if (qp) {
      qs("#filterProject").value = qp;
      syncWorkflowStatuses(qp).then(loadIssues);
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await ensureAuth())) return;
    init();
  });
})();
