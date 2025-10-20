// BugHatch Issue Detail Logic
(function () {
  const qs = (s) => document.querySelector(s);
  let issueId = null;
  let issueData = null;
  let currentUser = null;
  let isDemo = false;
  let forceDemo = false; // query param enforced demo mode
  let projectWorkflow = null;
  let comments = [];
  let activity = [];

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

  function canEditComment(comment) {
    return (
      !isDemo && !forceDemo && currentUser && (currentUser.id === comment.authorId || currentUser.role === "admin")
    );
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
    await fetchComments();
    await fetchActivity();
  }

  async function fetchProjectWorkflow(projectId) {
    const resp = await fetch(
      `/api/bug-hatch/projects/${encodeURIComponent(projectId)}${forceDemo ? "?demo=true" : ""}`,
      { credentials: "include" }
    );
    const data = await resp.json().catch(() => ({}));
    if (resp.ok) {
      projectWorkflow = data?.data?.workflow || null;
      // Populate assignee dropdown with project members
      populateAssigneeDropdown(data.data);
    }
  }

  function populateAssigneeDropdown(project) {
    const assigneeSelect = qs("#fieldAssignee");
    if (!assigneeSelect || !project) return;

    // Clear existing options except "Unassigned"
    assigneeSelect.innerHTML = '<option value="">Unassigned</option>';

    // Add project members
    if (project.members && Array.isArray(project.members)) {
      project.members.forEach((member) => {
        const memberId = typeof member === "string" ? member : member.id;
        const memberName = typeof member === "string" ? member : member.name || member.email || member.id;
        const option = document.createElement("option");
        option.value = memberId;
        option.textContent = memberName;
        assigneeSelect.appendChild(option);
      });
    }

    // Set current assignee if issue is loaded
    if (issueData && issueData.assigneeId) {
      assigneeSelect.value = issueData.assigneeId;
    }
  }

  async function fetchComments() {
    const resp = await fetch(
      `/api/bug-hatch/issues/${encodeURIComponent(issueId)}/comments${forceDemo ? "?demo=true" : ""}`,
      {
        credentials: "include",
      }
    );
    const data = await resp.json().catch(() => ({}));
    if (resp.ok) {
      comments = data.data.comments || [];
      renderComments();
    }
  }

  async function fetchActivity() {
    const resp = await fetch(
      `/api/bug-hatch/issues/${encodeURIComponent(issueId)}/activity${forceDemo ? "?demo=true" : ""}`,
      {
        credentials: "include",
      }
    );
    const data = await resp.json().catch(() => ({}));
    if (resp.ok) {
      activity = data.data.activity || [];
      renderActivity();
    }
  }

  function renderIssue() {
    if (!issueData) return;

    qs("#issueTitle").textContent = issueData.title;
    qs("#issueKey").textContent = issueData.key;

    // Add back to project link
    const titleContainer = qs("#issueTitle").parentElement;
    if (issueData.projectId && !qs("#backToProject")) {
      const backLink = document.createElement("a");
      backLink.id = "backToProject";
      backLink.href = `/bug-hatch/project.html?id=${encodeURIComponent(issueData.projectId)}${
        forceDemo ? "&demo=true" : ""
      }`;
      backLink.className =
        "bh-btn bh-btn-ghost bh-btn-2xs inline-flex items-center gap-1 text-neutral-400 hover:text-neutral-200 text-xs mr-2";
      backLink.innerHTML = "← Back to Project";
      titleContainer.insertBefore(backLink, qs("#issueTitle"));
    }

    qs("#fieldTitle").value = issueData.title;
    qs("#fieldType").value = issueData.type;
    qs("#fieldPriority").value = issueData.priority;
    qs("#fieldAssignee").value = issueData.assigneeId || "";
    qs("#fieldLabels").value = (issueData.labels || []).join(", ");
    qs("#fieldDescription").value = issueData.description || "";
    const currentStatusEl = qs("#currentStatus");
    currentStatusEl.textContent = issueData.status;
    currentStatusEl.className = `bh-badge inline-flex items-center rounded-full border border-neutral-700/60 bg-neutral-900/60 px-2 py-0.5 text-xs ${window.bugHatchActivityRenderer.getStatusColor(
      issueData.status
    )}`;
    if (isDemo) {
      qs("#issueEditForm")
        .querySelectorAll("input,textarea,select,button[type=submit]")
        .forEach((el) => (el.disabled = true));
      qs("#commentForm")
        .querySelectorAll("textarea,button[type=submit]")
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

  function renderComments() {
    const container = qs("#commentsList");
    window.bugHatchCommentsRenderer.renderComments(comments, container, canEditComment);
  }

  function renderActivity() {
    const container = qs("#activityFeed");
    window.bugHatchActivityRenderer.renderActivity(activity, container, { collapsible: false });
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
    await fetchActivity(); // refresh activity after transition
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
    await fetchActivity(); // refresh activity after update
  }

  async function submitComment(e) {
    e.preventDefault();
    if (isDemo) return;
    const body = qs("#commentBody").value.trim();
    if (!body) return;
    const resp = await fetch(`/api/bug-hatch/issues/${encodeURIComponent(issueId)}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body }),
    });
    if (!resp.ok) return; // TODO: show error
    qs("#commentBody").value = "";
    await fetchComments();
    await fetchActivity();
  }

  function handleCommentActions(e) {
    const target = e.target;
    if (target.classList.contains("bh-edit-comment")) {
      const commentId = target.getAttribute("data-id");
      editComment(commentId);
    } else if (target.classList.contains("bh-delete-comment")) {
      const commentId = target.getAttribute("data-id");
      deleteComment(commentId);
    } else if (target.classList.contains("bh-reply-comment")) {
      const commentId = target.getAttribute("data-id");
      startReply(commentId);
    }
  }

  async function editComment(commentId) {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;
    const newBody = prompt("Edit comment:", comment.body);
    if (!newBody || newBody.trim() === comment.body) return;
    const resp = await fetch(`/api/bug-hatch/comments/${encodeURIComponent(commentId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body: newBody.trim() }),
    });
    if (!resp.ok) return; // TODO: show error
    await fetchComments();
    await fetchActivity();
  }

  function startReply(parentId) {
    // Simple reply: focus textarea and add @mention
    const textarea = qs("#commentBody");
    textarea.focus();
    textarea.value = `@${comments.find((c) => c.id === parentId)?.authorId || "user"} `;
    // TODO: store parentId for submission
  }

  async function deleteComment(commentId) {
    if (isDemo) return;
    if (!confirm("Delete this comment?")) return;
    const resp = await fetch(`/api/bug-hatch/comments/${encodeURIComponent(commentId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!resp.ok) return;
    await fetchComments();
    await fetchActivity();
  }

  function init() {
    parseQuery();
    if (!issueId) {
      showError("#editError", "Missing issue id");
      return;
    }
    qs("#issueEditForm").addEventListener("submit", saveIssue);
    qs("#commentForm").addEventListener("submit", submitComment);
    qs("#commentsList").addEventListener("click", handleCommentActions);

    // Activity toggle
    const activityToggle = qs("#activityToggle");
    const activityFeed = qs("#activityFeed");
    if (activityToggle && activityFeed) {
      activityToggle.addEventListener("click", () => {
        const isHidden = activityFeed.style.display === "none";
        activityFeed.style.display = isHidden ? "block" : "none";
        activityToggle.textContent = isHidden ? "▲" : "▼";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await ensureAuth())) return;
    init();
    fetchIssue();
  });
})();
