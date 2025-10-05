// BugHatch Project Detail Page
(function () {
  const qs = (s) => document.querySelector(s);
  let projectId = null;
  let forceDemo = false;
  let currentUser = null;
  let projectCache = null;
  let issuesCache = [];

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso || "";
    }
  }

  function parseQuery() {
    const u = new URL(window.location.href);
    projectId = u.searchParams.get("id");
    forceDemo = u.searchParams.get("demo") === "true";
  }

  async function ensureAuth() {
    currentUser = await window.bugHatchAuth.checkAuth();
    if (!currentUser) {
      window.location.href = "/bug-hatch/login.html";
      return false;
    }
    const logoutBtn = qs("#logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", window.bugHatchAuth.handleLogout);
    return true;
  }

  async function fetchProject() {
    if (!projectId) return;
    const url = `/api/bug-hatch/projects/${encodeURIComponent(projectId)}${forceDemo ? "?demo=true" : ""}`;
    const resp = await fetch(url, { credentials: "include" });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      qs("#projectName").textContent = data.error || "Project not found";
      return null;
    }
    // Backend returns { ok: true, data: <projectObject> }
    return data.data; // project object directly
  }

  async function fetchIssues(project) {
    const params = new URLSearchParams({ limit: "200" });
    if (forceDemo || currentUser.isDemo) params.set("demo", "true");
    const url = `/api/bug-hatch/projects/${encodeURIComponent(project.id)}/issues?${params.toString()}`;
    const resp = await fetch(url, { credentials: "include" });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return [];
    return data.data.issues || [];
  }

  function renderProject(p) {
    if (!p) return;
    projectCache = p;
    const nameEl = qs("#projectName");
    const h1 = document.createElement("h1");
    h1.id = "projectName";
    h1.className = "bh-text-lg bh-font-semibold";
    h1.textContent = p.name;
    nameEl.parentNode.replaceChild(h1, nameEl);
    const keyEl = qs("#projectKey");
    const span = document.createElement("span");
    span.id = "projectKey";
    span.className = "bh-badge bh-badge-outline bh-text-2xs";
    span.textContent = p.key;
    keyEl.parentNode.replaceChild(span, keyEl);
    const metaEl = qs("#projectMeta");
    metaEl.textContent = `${p.members.length} member(s) • Created ${formatTime(p.createdAt)}${
      p.archived ? " • Archived" : ""
    }`;
    metaEl.className = "bh-text-dim bh-text-3xs bh-mt-2xs";
    const badge = qs("#viewModeBadge");
    if (badge) {
      if (forceDemo || currentUser.isDemo) {
        badge.classList.remove("bh-hidden");
        badge.textContent = "Demo";
      } else if (currentUser.role === "viewer") {
        badge.classList.remove("bh-hidden");
        badge.textContent = "Read-only";
      }
    }
    const issuesLink = qs("#issuesLink");
    if (issuesLink) {
      issuesLink.href = `/bug-hatch/issues.html?project=${encodeURIComponent(p.key)}${forceDemo ? "&demo=true" : ""}`;
    }
  }

  function clearBoardError() {
    const e = qs("#boardErrors");
    if (e) {
      e.textContent = "";
      e.classList.add("bh-hidden");
    }
  }
  function showBoardError(msg) {
    // Legacy inline error (kept hidden) + toast
    const e = qs("#boardErrors");
    if (e) {
      e.textContent = msg;
      e.classList.remove("bh-hidden");
    }
    if (window.bhToast && typeof window.bhToast.show === "function") {
      window.bhToast.show(msg, { type: "error", timeout: 6000 });
    }
  }

  function renderBoard() {
    const board = qs("#kanbanBoard");
    if (!board || !projectCache) return;
    const statuses = projectCache.workflow?.statuses || [];
    const transitions = projectCache.workflow?.transitions || {};
    const readOnly = forceDemo || currentUser.isDemo || currentUser.role === "viewer";
    const metaEl = qs("#issuesMeta");
    metaEl.textContent = `${issuesCache.length} issue(s)`;
    metaEl.className = "bh-text-dim bh-text-2xs";
    if (!statuses.length) {
      board.innerHTML = '<div class="bh-text-dim bh-text-xs">No workflow statuses configured.</div>';
      return;
    }
    board.innerHTML = statuses
      .map(
        (s) => `
      <div class="bh-kanban-col" data-status="${s}" style="min-width:200px;flex:0 0 200px;">
        <div class="bh-flex bh-justify-between bh-items-center bh-mb-2xs">
          <h3 class="bh-text-3xs bh-uppercase bh-letter-tight bh-text-dim">${s}</h3>
          <span class="bh-badge bh-badge-dim bh-text-3xs" data-count-for="${s}">0</span>
        </div>
        <div class="bh-kanban-dropzone bh-flex bh-flex-col bh-gap-2xs" data-dropzone-for="${s}" style="min-height:260px;">
        </div>
      </div>`
      )
      .join("");

    // Populate cards
    const counts = {};
    issuesCache.forEach((issue) => {
      counts[issue.status] = (counts[issue.status] || 0) + 1;
      const dz = board.querySelector(`[data-dropzone-for="${issue.status}"]`);
      if (!dz) return;
      const card = document.createElement("div");
      card.className = "bh-issue-card";
      card.setAttribute("draggable", !readOnly);
      card.dataset.issueId = issue.id;
      card.dataset.status = issue.status;
      const labelsArr = issue.labels || [];
      const labelsHtml = labelsArr
        .slice(0, 4)
        .map((l, i) => `<span class="bh-issue-label" data-shade="${i % 3}">${l}</span>`)
        .join("");
      const more = labelsArr.length > 4 ? `<span class="bh-badge bh-badge-tiny">+${labelsArr.length - 4}</span>` : "";
      const priorityClass =
        issue.priority === "high"
          ? "bh-issue-card-priority-high"
          : issue.priority === "low"
          ? "bh-issue-card-priority-low"
          : "bh-issue-card-priority-medium";
      card.innerHTML = `
        <div class="bh-flex bh-justify-between bh-items-start">
          <span class="bh-text-2xs bh-font-medium" title="${issue.key}">${issue.key}</span>
          <span class="bh-badge bh-badge-tiny">${issue.type}</span>
        </div>
        <div class="bh-issue-card-title" title="${issue.title}">${issue.title}</div>
        <div class="bh-issue-card-labels">${labelsHtml}${more}</div>
        <div class="bh-issue-card-meta">
          <span class="${priorityClass}">${issue.priority}</span>
          <span>${new Date(issue.updatedAt).toLocaleDateString()}</span>
        </div>`;
      if (!readOnly) {
        card.addEventListener("dragstart", (ev) => {
          ev.dataTransfer.setData("text/issue-id", issue.id);
          ev.dataTransfer.setData("text/from-status", issue.status);
          card.classList.add("bh-opacity-50");
        });
        card.addEventListener("dragend", () => card.classList.remove("bh-opacity-50"));
      }
      card.addEventListener("click", () => openPreview(issue.id));
      dz.appendChild(card);
    });
    // update counts
    board.querySelectorAll("[data-count-for]").forEach((el) => {
      const st = el.getAttribute("data-count-for");
      el.textContent = counts[st] || 0;
    });

    if (readOnly) return; // no drop handlers

    board.querySelectorAll("[data-dropzone-for]").forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("bh-ring");
      });
      zone.addEventListener("dragleave", () => zone.classList.remove("bh-ring"));
      zone.addEventListener("drop", async (e) => {
        e.preventDefault();
        zone.classList.remove("bh-ring");
        clearBoardError();
        const issueId = e.dataTransfer.getData("text/issue-id");
        const fromStatus = e.dataTransfer.getData("text/from-status");
        const toStatus = zone.getAttribute("data-dropzone-for");
        if (!issueId || !toStatus || fromStatus === toStatus) return;
        const allowed = (transitions[fromStatus] || []).includes(toStatus);
        if (!allowed) {
          showBoardError(`Transition ${fromStatus} -> ${toStatus} not allowed`);
          return;
        }
        try {
          const resp = await fetch(
            `/api/bug-hatch/issues/${encodeURIComponent(issueId)}/transition${forceDemo ? "?demo=true" : ""}`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ toStatus }),
            }
          );
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok) {
            showBoardError(data.error || "Transition failed");
            return;
          }
          // update issue cache entry
          const idx = issuesCache.findIndex((i) => i.id === issueId);
          if (idx !== -1) {
            issuesCache[idx] = data.data; // backend returns issue object
          }
          renderBoard();
        } catch (err) {
          showBoardError(err.message || "Network error");
        }
      });
    });
  }

  function renderIssues(issues) {
    // kept for potential future table view toggle
    issuesCache = issues;
    renderBoard();
  }

  // ===== Modal Preview =====
  function openPreview(issueId) {
    const issue = issuesCache.find((i) => i.id === issueId);
    if (!issue) return;
    const modal = qs("#issuePreviewModal");
    if (!modal) return;
    qs("#pvIssueKey").textContent = `${issue.key}`;
    qs("#pvIssueTitle").textContent = issue.title;
    qs("#pvDescription").textContent = issue.description || "(no description)";
    const meta = qs("#pvMeta");
    meta.innerHTML = `
      <span class="bh-badge bh-badge-tiny">${issue.type}</span>
      <span class="bh-badge bh-badge-outline bh-badge-tiny">${issue.priority}</span>
      <span class="bh-text-dim">${issue.status}</span>
      <span class="bh-text-dim">Updated: ${formatTime(issue.updatedAt)}</span>
    `;
    renderPreviewTransitions(issue);
    // Labels in modal
    const lblWrap = qs("#pvLabels");
    if (lblWrap) {
      const all = issue.labels || [];
      if (!all.length) lblWrap.innerHTML = '<span class="bh-text-dim bh-text-3xs">No labels</span>';
      else
        lblWrap.innerHTML = all
          .map((l) => `<span class="bh-badge bh-badge-outline bh-badge-tiny" data-label="${l}">${l}</span>`)
          .join("");
    }
    modal.classList.remove("bh-hidden");
  }
  function closePreview() {
    const modal = qs("#issuePreviewModal");
    if (modal) modal.classList.add("bh-hidden");
  }
  function renderPreviewTransitions(issue) {
    const wrap = qs("#pvTransitions");
    if (!wrap) return;
    wrap.innerHTML = "";
    const readOnly = forceDemo || currentUser.isDemo || currentUser.role === "viewer";
    const transitions = projectCache?.workflow?.transitions || {};
    const allowed = transitions[issue.status] || [];
    if (!allowed.length) {
      wrap.innerHTML = '<span class="bh-text-dim bh-text-3xs">No transitions</span>';
      return;
    }
    allowed.forEach((to) => {
      const btn = document.createElement("button");
      btn.className = "bh-btn bh-btn-secondary bh-btn-2xs"; // width 100% via CSS in aside
      btn.textContent = `→ ${to}`;
      if (readOnly) btn.disabled = true;
      btn.addEventListener("click", async () => {
        if (readOnly) return;
        clearBoardError();
        try {
          const resp = await fetch(
            `/api/bug-hatch/issues/${encodeURIComponent(issue.id)}/transition${forceDemo ? "?demo=true" : ""}`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ toStatus: to }),
            }
          );
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok) {
            showBoardError(data.error || "Transition failed");
            return;
          }
          const idx = issuesCache.findIndex((i) => i.id === issue.id);
          if (idx !== -1) issuesCache[idx] = data.data;
          renderBoard();
          openPreview(issue.id); // reopen updated
        } catch (e) {
          showBoardError(e.message || "Network error");
        }
      });
      wrap.appendChild(btn);
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target && (e.target.id === "pvCloseBtn" || e.target.id === "issuePreviewModal")) {
      closePreview();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "Escape") closePreview();
  });

  async function load() {
    const project = await fetchProject();
    if (!project) return;
    renderProject(project);
    const issues = await fetchIssues(project);
    renderIssues(issues);
    setupQuickCreate();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    parseQuery();
    if (!(await ensureAuth())) return;
    // Show demo banner if forced or real demo user
    const demoBannerEl = document.getElementById("demo-banner");
    if (demoBannerEl && (forceDemo || currentUser.isDemo)) {
      demoBannerEl.classList.add("visible");
      // hide quick create in demo
      const qcWrap = document.getElementById("quickCreateWrap");
      if (qcWrap) qcWrap.style.display = "none";
    }
    load();
  });

  function setupQuickCreate() {
    const form = document.getElementById("quickCreateIssueForm");
    if (!form || !projectCache) return;
    const errorEl = document.getElementById("qcError"); // retained but hidden; we now use toast
    if (errorEl) {
      errorEl.classList.add("bh-hidden");
      errorEl.setAttribute("aria-hidden", "true");
    }
    const readOnly = forceDemo || currentUser.isDemo || currentUser.role === "viewer";
    if (readOnly) {
      form.querySelectorAll("input,select,button").forEach((el) => (el.disabled = true));
      return;
    }
    function qcToast(msg) {
      if (window.bhToast && typeof window.bhToast.show === "function") {
        window.bhToast.show(msg, { type: "error", timeout: 6000 });
        return;
      }
      // fallback path (no toast lib loaded)
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.classList.remove("bh-hidden");
      } else if (typeof alert === "function") {
        alert(msg);
      }
    }
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!projectCache) return;
      if (errorEl) errorEl.classList.add("bh-hidden");
      const title = document.getElementById("qcTitle").value.trim();
      if (title.length < 3) {
        qcToast("Title too short");
        return;
      }
      const body = {
        projectId: projectCache.id,
        title,
        type: document.getElementById("qcType").value,
        priority: document.getElementById("qcPriority").value,
        labels: (document.getElementById("qcLabels").value || "")
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
      };
      try {
        const resp = await fetch(`/api/bug-hatch/projects/${encodeURIComponent(projectCache.id)}/issues`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          qcToast(data.error || "Create failed");
          return;
        }
        document.getElementById("qcTitle").value = "";
        document.getElementById("qcLabels").value = "";
        // push new issue and re-render board for its status column
        issuesCache.push(data.data); // service returns issue object as data
        renderBoard();
        // Subtle success feedback
        const wrap = document.getElementById("quickCreateWrap");
        if (wrap) {
          wrap.classList.remove("bh-qc-flash");
          // force reflow to restart animation if already applied
          void wrap.offsetWidth;
          wrap.classList.add("bh-qc-flash");
          setTimeout(() => wrap.classList.remove("bh-qc-flash"), 1300);
        }
        if (window.bhToast && typeof window.bhToast.show === "function") {
          window.bhToast.show("Issue created", { type: "success", timeout: 3000 });
        }
      } catch (err) {
        qcToast(err.message || "Network error");
      }
    });
  }
})();
