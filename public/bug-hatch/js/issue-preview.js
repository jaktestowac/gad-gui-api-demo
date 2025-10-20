// BugHatch Issue Preview Module
(function () {
  "use strict";

  let currentIssueId = null;
  let forceDemo = false;

  // Modal helper functions
  function showModal(id) {
    const el = document.querySelector(id);
    if (!el) return;
    el.setAttribute("aria-hidden", "false");
    el.classList.remove("bh-hidden", "hidden");
    el.classList.add("open");
    const panel = el.querySelector(".bh-modal-content") || el.querySelector(".bh-modal-dialog");
    if (panel) {
      panel.classList.add("opacity-0", "translate-y-1", "scale-95");
      requestAnimationFrame(() => {
        panel.classList.add("transition", "duration-150");
        panel.classList.remove("opacity-0", "translate-y-1", "scale-95");
        panel.classList.add("opacity-100", "translate-y-0", "scale-100");
      });
    }
  }

  function closeModal(id) {
    const el = document.querySelector(id);
    if (!el) return;
    el.setAttribute("aria-hidden", "true");
    const panel = el.querySelector(".bh-modal-content") || el.querySelector(".bh-modal-dialog");
    if (panel) {
      panel.classList.add("transition", "duration-150", "opacity-0", "translate-y-1", "scale-95");
      setTimeout(() => {
        el.classList.add("bh-hidden", "hidden");
        el.classList.remove("open");
        panel.classList.remove("opacity-0", "translate-y-1", "scale-95", "opacity-100", "translate-y-0", "scale-100");
      }, 150);
    } else {
      el.classList.add("bh-hidden", "hidden");
      el.classList.remove("open");
    }
  }

  // Initialize the preview modal
  function init() {
    // Check for demo mode from URL
    const url = new URL(window.location.href);
    forceDemo = url.searchParams.get("demo") === "true";

    // Add click handlers to elements with data-issue-id
    document.addEventListener("click", function (e) {
      const element = e.target.closest("[data-issue-id]");
      if (element && !e.target.closest("a")) {
        // Don't trigger if clicking on links
        e.preventDefault();
        const issueId = element.getAttribute("data-issue-id");
        if (issueId) {
          showIssuePreview(issueId);
        }
      }

      // Handle modal close buttons
      const closeBtn = e.target.closest("[data-modal-close], #pvCloseBtn");
      if (closeBtn) {
        closeModal("#issuePreviewModal");
      }

      // Handle modal backdrop click - only close when clicking directly on backdrop, not on modal content
      const backdrop = e.target.closest(".bh-modal-backdrop");
      if (backdrop && (backdrop.id === "issuePreviewModal" || backdrop.parentElement?.id === "issuePreviewModal")) {
        // Only close if clicking directly on the backdrop, not on the modal content
        if (e.target === backdrop || !e.target.closest(".bh-modal-content")) {
          closeModal("#issuePreviewModal");
        }
      }
    });

    // Handle escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        const modal = document.querySelector("#issuePreviewModal");
        if (modal && !modal.classList.contains("bh-hidden")) {
          closeModal("#issuePreviewModal");
        }
      }
    });
  }

  // Show issue preview modal
  async function showIssuePreview(issueId) {
    currentIssueId = issueId;

    // Show loading state
    showModal("#issuePreviewModal");
    setPreviewLoadingState();

    try {
      // Fetch issue details
      const issueResponse = await fetch(
        `/api/bug-hatch/issues/${encodeURIComponent(issueId)}${forceDemo ? "?demo=true" : ""}`,
        {
          credentials: "include",
        }
      );

      if (!issueResponse.ok) {
        throw new Error("Failed to load issue");
      }

      const issueData = await issueResponse.json();
      const issue = issueData.data;

      // Update modal with issue details
      updateIssueDetails(issue);

      // Fetch and display comments
      await loadComments();

      // Fetch and display activity
      await loadActivity();
    } catch (error) {
      setPreviewErrorState("Failed to load issue details");
    }
  }

  // Update issue details in modal
  function updateIssueDetails(issue) {
    const statusColor = window.bugHatchActivityRenderer.getStatusColor(issue.status);

    // Header elements
    const titleEl = document.getElementById("previewIssueTitle");
    if (titleEl) titleEl.textContent = issue.title;

    const keyEl = document.getElementById("previewIssueKey");
    if (keyEl) keyEl.textContent = issue.key;

    const statusEl = document.getElementById("previewIssueStatus");
    if (statusEl) {
      statusEl.textContent = issue.status;
      statusEl.className = `bh-badge inline-flex items-center rounded-full border border-neutral-700/60 bg-neutral-900/60 px-2 py-0.5 text-xs ${statusColor}`;
    }

    const titleTextEl = document.getElementById("previewIssueTitleText");
    if (titleTextEl) titleTextEl.textContent = issue.title;

    // Detail elements (may not exist in project.html modal)
    const typeEl = document.getElementById("previewIssueType");
    if (typeEl) typeEl.textContent = issue.type;

    const priorityEl = document.getElementById("previewIssuePriority");
    if (priorityEl) priorityEl.textContent = issue.priority;

    const assigneeEl = document.getElementById("previewIssueAssignee");
    if (assigneeEl) assigneeEl.textContent = issue.assigneeId || "—";

    const labelsEl = document.getElementById("previewIssueLabels");
    if (labelsEl) labelsEl.textContent = (issue.labels || []).join(", ") || "—";

    const descEl = document.getElementById("previewIssueDescription");
    if (descEl) descEl.textContent = issue.description || "No description";

    // Update link to full issue
    const linkEl = document.getElementById("previewIssueLink");
    if (linkEl)
      linkEl.href = `/bug-hatch/issue.html?id=${encodeURIComponent(issue.id)}${forceDemo ? "&demo=true" : ""}`;
  }

  // Load and display comments
  async function loadComments() {
    try {
      const response = await fetch(
        `/api/bug-hatch/issues/${encodeURIComponent(currentIssueId)}/comments${forceDemo ? "?demo=true" : ""}`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        const comments = data.data.comments || [];
        const container = document.getElementById("previewCommentsList");
        if (container) {
          window.bugHatchCommentsRenderer.renderComments(comments, container);
        }
      } else {
        const container = document.getElementById("previewCommentsList");
        if (container) {
          container.innerHTML = '<div class="text-xs text-neutral-500">Failed to load comments</div>';
        }
      }
    } catch (error) {
      const container = document.getElementById("previewCommentsList");
      if (container) {
        container.innerHTML = '<div class="text-xs text-neutral-500">Failed to load comments</div>';
      }
    }
  }

  // Load and display activity
  async function loadActivity() {
    try {
      const response = await fetch(
        `/api/bug-hatch/issues/${encodeURIComponent(currentIssueId)}/activity${forceDemo ? "?demo=true" : ""}`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        const activity = data.data.activity || [];
        const container = document.getElementById("previewActivityFeed");
        if (container) {
          window.bugHatchActivityRenderer.renderActivity(activity, container, { collapsed: true });
        }
      } else {
        const container = document.getElementById("previewActivityFeed");
        if (container) {
          container.innerHTML = '<div class="text-xs text-neutral-500">Failed to load activity</div>';
        }
      }
    } catch (error) {
      const container = document.getElementById("previewActivityFeed");
      if (container) {
        container.innerHTML = '<div class="text-xs text-neutral-500">Failed to load activity</div>';
      }
    }
  }

  // Set loading state
  function setPreviewLoadingState() {
    // Header elements
    const titleEl = document.getElementById("previewIssueTitle");
    if (titleEl) titleEl.textContent = "Loading...";

    const keyEl = document.getElementById("previewIssueKey");
    if (keyEl) keyEl.textContent = "";

    const statusEl = document.getElementById("previewIssueStatus");
    if (statusEl) statusEl.textContent = "";

    const titleTextEl = document.getElementById("previewIssueTitleText");
    if (titleTextEl) titleTextEl.textContent = "Loading issue details...";

    // Detail elements (may not exist in project.html modal)
    const typeEl = document.getElementById("previewIssueType");
    if (typeEl) typeEl.textContent = "—";

    const priorityEl = document.getElementById("previewIssuePriority");
    if (priorityEl) priorityEl.textContent = "—";

    const assigneeEl = document.getElementById("previewIssueAssignee");
    if (assigneeEl) assigneeEl.textContent = "—";

    const labelsEl = document.getElementById("previewIssueLabels");
    if (labelsEl) labelsEl.textContent = "—";

    const descEl = document.getElementById("previewIssueDescription");
    if (descEl) descEl.textContent = "Loading...";

    // Comments and activity
    const commentsEl = document.getElementById("previewCommentsList");
    if (commentsEl) commentsEl.innerHTML = '<div class="text-xs text-neutral-500">Loading comments...</div>';

    const activityEl = document.getElementById("previewActivityFeed");
    if (activityEl) activityEl.innerHTML = '<div class="text-xs text-neutral-500">Loading activity...</div>';
  }

  // Set error state
  function setPreviewErrorState(message) {
    const titleEl = document.getElementById("previewIssueTitle");
    if (titleEl) titleEl.textContent = "Error";

    const titleTextEl = document.getElementById("previewIssueTitleText");
    if (titleTextEl) titleTextEl.textContent = message;

    const commentsEl = document.getElementById("previewCommentsList");
    if (commentsEl) commentsEl.innerHTML = '<div class="text-xs text-red-400">Failed to load</div>';

    const activityEl = document.getElementById("previewActivityFeed");
    if (activityEl) activityEl.innerHTML = '<div class="text-xs text-red-400">Failed to load</div>';
  }

  // Set demo mode
  function setDemoMode(demo, forced) {
    forceDemo = forced;
  }

  // Expose the module
  window.bugHatchIssuePreview = {
    init: init,
    showIssuePreview: showIssuePreview,
    setDemoMode: setDemoMode,
  };

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
