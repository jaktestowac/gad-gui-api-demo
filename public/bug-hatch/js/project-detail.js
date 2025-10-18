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
    currentUser = await window.bugHatchAuth.checkAuth().catch(() => null);
    if (!currentUser) {
      // Allow anonymous demo mode when demo is explicitly requested
      if (forceDemo) return true;
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
    if (forceDemo || (currentUser && currentUser.isDemo)) params.set("demo", "true");
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
    h1.className = "text-lg font-semibold text-neutral-100";
    h1.textContent = p.name;
    nameEl.parentNode.replaceChild(h1, nameEl);
    const keyEl = qs("#projectKey");
    const span = document.createElement("span");
    span.id = "projectKey";
    span.className =
      "inline-flex items-center rounded-full border border-neutral-600 bg-neutral-900/60 px-2 py-0.5 text-[11px] text-neutral-300";
    span.textContent = p.key;
    keyEl.parentNode.replaceChild(span, keyEl);
    const metaEl = qs("#projectMeta");
    metaEl.textContent = `${p.members.length} member(s) • Created ${formatTime(p.createdAt)}${
      p.archived ? " • Archived" : ""
    }`;
    metaEl.className = "text-neutral-400 text-xs mt-1";
    const badge = qs("#viewModeBadge");
    if (badge) {
      // Show Demo only for anonymous demo view; show Read-only for logged-in viewers.
      if (!currentUser && forceDemo) {
        badge.classList.remove("bh-hidden", "hidden");
        badge.textContent = "Demo";
      } else if (currentUser && currentUser.role === "viewer") {
        badge.classList.remove("bh-hidden", "hidden");
        badge.textContent = "Read-only";
      } else {
        badge.classList.add("bh-hidden", "hidden");
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
      e.classList.add("bh-hidden", "hidden");
    }
  }
  function showBoardError(msg) {
    // Legacy inline error (kept hidden) + toast
    const e = qs("#boardErrors");
    if (e) {
      e.textContent = msg;
      e.classList.remove("bh-hidden", "hidden");
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
    const readOnly = forceDemo || (currentUser && (currentUser.isDemo || currentUser.role === "viewer"));
    const metaEl = qs("#issuesMeta");
    metaEl.textContent = `${issuesCache.length} issue(s)`;
    metaEl.className = "text-neutral-400 text-[11px]";
    if (!statuses.length) {
      board.innerHTML = '<div class="text-neutral-400 text-xs">No workflow statuses configured.</div>';
      return;
    }
    board.innerHTML = statuses
      .map(
        (s) => `
      <div class="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3" data-status="${s}" style="min-width:200px;flex:0 0 200px;">
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-[10px] tracking-tight uppercase text-neutral-400">${s}</h3>
          <span class="inline-flex items-center rounded-full border border-neutral-700/60 bg-neutral-900/60 px-2 py-0.5 text-[10px] text-neutral-400" data-count-for="${s}">0</span>
        </div>
        <div class="flex flex-col gap-1" data-dropzone-for="${s}" style="min-height:260px;">
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
      const accent =
        issue.priority === "high"
          ? "border-l-2 border-l-red-500/60"
          : issue.priority === "low"
          ? "border-l-2 border-l-emerald-500/60"
          : "border-l-2 border-l-amber-400/60";
      card.className = `bh-issue-card rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 shadow-sm hover:shadow-md hover:bg-neutral-900 transition duration-150 ease-out cursor-pointer ring-1 ring-transparent hover:ring-emerald-500/20 hover:border-neutral-700 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${accent}`;
      card.setAttribute("draggable", !readOnly);
      card.dataset.issueId = issue.id;
      card.dataset.status = issue.status;
      const labelsArr = issue.labels || [];
      const labelsHtml = labelsArr
        .slice(0, 4)
        .map((l, i) => {
          const shade = i % 3;
          const palette =
            shade === 0
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : shade === 1
              ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
              : "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300";
          return `<span class="inline-flex items-center rounded-md border ${palette} px-1.5 py-0 text-[10px]" data-shade="${shade}">${l}</span>`;
        })
        .join("");
      const more =
        labelsArr.length > 4
          ? `<span class="inline-flex items-center rounded-full border border-neutral-700/60 bg-neutral-900/60 px-1.5 py-0 text-[10px] text-neutral-300">+${
              labelsArr.length - 4
            }</span>`
          : "";
      card.innerHTML = `
        <div class="flex items-start justify-between">
          <span class="text-[11px] font-medium text-neutral-300" title="${issue.key}">${issue.key}</span>
          <span class="inline-flex items-center rounded-full border border-neutral-700/60 bg-neutral-900/60 px-1.5 py-0 text-[10px] text-neutral-300">${
            issue.type
          }</span>
        </div>
        <div class="mt-1 text-xs text-neutral-200 line-clamp-2 font-medium" title="${issue.title}">${issue.title}</div>
        <div class="mt-1 flex flex-wrap gap-1">${labelsHtml}${more}</div>
        <div class="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
          <span class="${
            issue.priority === "high"
              ? "border border-red-500/40 bg-red-500/10 text-red-300 rounded px-2 py-0.5"
              : issue.priority === "low"
              ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 rounded px-2 py-0.5"
              : "border border-amber-500/40 bg-amber-500/10 text-amber-300 rounded px-2 py-0.5"
          }">${issue.priority}</span>
          <span>${new Date(issue.updatedAt).toLocaleDateString()}</span>
        </div>`;
      if (!readOnly) {
        card.addEventListener("dragstart", (ev) => {
          ev.dataTransfer.setData("text/issue-id", issue.id);
          ev.dataTransfer.setData("text/from-status", issue.status);
          card.classList.add("opacity-50");
        });
        card.addEventListener("dragend", () => card.classList.remove("opacity-50"));
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
        zone.classList.add("ring-2", "ring-emerald-500/40");
      });
      zone.addEventListener("dragleave", () => zone.classList.remove("ring-2", "ring-emerald-500/40"));
      zone.addEventListener("drop", async (e) => {
        e.preventDefault();
        zone.classList.remove("ring-2", "ring-emerald-500/40");
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
    const openFull = qs("#pvOpenFull");
    if (openFull) {
      const qp = new URLSearchParams({ id: issue.id });
      if (forceDemo) qp.set("demo", "true");
      openFull.href = `/bug-hatch/issue.html?${qp.toString()}`;
    }
    qs("#pvIssueTitle").textContent = issue.title;
    qs("#pvDescription").textContent = issue.description || "(no description)";
    const meta = qs("#pvMeta");
    const statusChip = `
      <span class="inline-flex items-center rounded-md border ${
        issue.status === "Done"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-sky-500/40 bg-sky-500/10 text-sky-300"
      } px-2 py-0.5 text-[10px]">${issue.status}</span>`;
    meta.innerHTML = `
      <span class="inline-flex items-center rounded-full border border-neutral-700/60 bg-neutral-900/60 px-1.5 py-0 text-[10px] text-neutral-300">${
        issue.type
      }</span>
      <span class="inline-flex items-center rounded-full ${
        issue.priority === "high"
          ? "border border-red-500/40 bg-red-500/10 text-red-300"
          : issue.priority === "low"
          ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border border-amber-500/40 bg-amber-500/10 text-amber-300"
      } px-2 py-0.5">${issue.priority}</span>
      ${statusChip}
      <span class="text-neutral-400 text-[10px]">Updated: ${formatTime(issue.updatedAt)}</span>
    `;
    renderPreviewTransitions(issue);
    // Labels in modal
    const lblWrap = qs("#pvLabels");
    if (lblWrap) {
      const all = issue.labels || [];
      if (!all.length) lblWrap.innerHTML = '<span class="text-neutral-400 text-[10px]">No labels</span>';
      else
        lblWrap.innerHTML = all
          .map(
            (l) =>
              `<span class="inline-flex items-center rounded-full border border-neutral-600 px-1.5 py-0 text-[10px] text-neutral-300" data-label="${l}">${l}</span>`
          )
          .join("");
    }
    modal.classList.remove("bh-hidden", "hidden");
    // Animate panel in
    const panel = modal.querySelector(".bh-modal");
    if (panel) {
      panel.classList.add("opacity-0", "translate-y-1", "scale-95");
      requestAnimationFrame(() => {
        panel.classList.add("transition", "duration-150");
        panel.classList.remove("opacity-0", "translate-y-1", "scale-95");
        panel.classList.add("opacity-100", "translate-y-0", "scale-100");
      });
    }
  }
  function closePreview() {
    const modal = qs("#issuePreviewModal");
    if (!modal) return;
    const panel = modal.querySelector(".bh-modal");
    if (panel) {
      panel.classList.add("transition", "duration-150", "opacity-0", "translate-y-1", "scale-95");
      setTimeout(() => {
        modal.classList.add("bh-hidden", "hidden");
        panel.classList.remove("opacity-0", "translate-y-1", "scale-95", "opacity-100", "translate-y-0", "scale-100");
      }, 150);
    } else {
      modal.classList.add("bh-hidden", "hidden");
    }
  }
  function renderPreviewTransitions(issue) {
    const wrap = qs("#pvTransitions");
    if (!wrap) return;
    wrap.innerHTML = "";
    const readOnly = forceDemo || (currentUser && (currentUser.isDemo || currentUser.role === "viewer"));
    const transitions = projectCache?.workflow?.transitions || {};
    const allowed = transitions[issue.status] || [];
    if (!allowed.length) {
      wrap.innerHTML = '<span class="text-neutral-400 text-[10px]">No transitions</span>';
      return;
    }
    allowed.forEach((to) => {
      const btn = document.createElement("button");
      btn.className =
        "w-full inline-flex items-center justify-start gap-1 text-[11px] rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1 text-neutral-200 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"; // full width in aside
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
    setupQuickCreateToggle();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    parseQuery();
    if (!(await ensureAuth())) return;
    // Show demo banner if forced or real demo user
    const demoBannerEl = document.getElementById("demo-banner");
    if (demoBannerEl && forceDemo) {
      demoBannerEl.classList.remove("hidden", "bh-hidden");
      demoBannerEl.classList.add("visible");
    }
    load();
  });

  function setupQuickCreate() {
    const form = document.getElementById("quickCreateIssueForm");
    if (!form || !projectCache) return;
    const errorEl = document.getElementById("qcError"); // retained but hidden; we now use toast
    if (errorEl) {
      errorEl.classList.add("bh-hidden", "hidden");
      errorEl.setAttribute("aria-hidden", "true");
    }
    const readOnly = forceDemo || (currentUser && (currentUser.isDemo || currentUser.role === "viewer"));
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
        errorEl.classList.remove("bh-hidden", "hidden");
      } else if (typeof alert === "function") {
        alert(msg);
      }
    }
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!projectCache) return;
      if (errorEl) errorEl.classList.add("bh-hidden", "hidden");
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

  function setupQuickCreateToggle() {
    const btn = document.getElementById("toggleQuickCreateBtn");
    const wrap = document.getElementById("quickCreateWrap");
    if (!btn || !wrap) return;
    const readOnly = forceDemo || (currentUser && (currentUser.isDemo || currentUser.role === "viewer"));
    // collapsed by default (wrap has display:none inline); ensure button text reflects it
    const setBtn = (open) => {
      btn.textContent = open ? "− Hide quick create" : "＋ Quick create issue";
      btn.disabled = readOnly && open; // in read-only keep it closed and disabled when would open
    };
    setBtn(false);
    btn.addEventListener("click", () => {
      if (readOnly) return; // do not toggle in demo/viewer
      const isHidden = wrap.style.display === "none";
      wrap.style.display = isHidden ? "block" : "none";
      setBtn(isHidden);
    });
  }
})();
