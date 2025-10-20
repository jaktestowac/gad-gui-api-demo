// BugHatch Activity Renderer Module
(function () {
  "use strict";

  // Status color mapping
  function getStatusColor(status) {
    const statusColors = {
      open: "text-blue-400",
      new: "text-blue-400",
      todo: "text-blue-400",
      backlog: "text-blue-400",
      "in-progress": "text-yellow-400",
      in_progress: "text-yellow-400",
      doing: "text-yellow-400",
      review: "text-purple-400",
      testing: "text-purple-400",
      resolved: "text-green-400",
      done: "text-green-400",
      completed: "text-green-400",
      closed: "text-gray-400",
      cancelled: "text-gray-400",
      blocked: "text-red-400",
      stuck: "text-red-400",
      rejected: "text-red-400",
    };
    return statusColors[status?.toLowerCase()] || "text-orange-300"; // fallback to orange
  }

  // Render activity feed with collapsible option
  function renderActivity(activity, container, options = {}) {
    const { collapsed = false } = options;

    if (!container) return;
    container.innerHTML = "";

    if (!activity.length) {
      container.innerHTML = '<div class="bh-text-dim bh-text-xs text-neutral-500 text-xs">No activity yet.</div>';
      return;
    }

    // Sort activity from newest to oldest
    const sortedActivity = [...activity].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Create wrapper for collapsible content
    const wrapper = document.createElement("div");
    wrapper.className = "bh-activity-wrapper";

    // Create toggle button if collapsible
    if (options.collapsible !== false) {
      const toggleBtn = document.createElement("button");
      toggleBtn.className =
        "bh-btn bh-btn-ghost bh-btn-2xs bh-activity-toggle text-neutral-400 hover:text-neutral-200 text-xs mb-2 flex items-center gap-1";
      toggleBtn.innerHTML = `${collapsed ? "▶" : "▼"} Show Activity`;
      toggleBtn.addEventListener("click", () => {
        const content = wrapper.querySelector(".bh-activity-content");
        const isCollapsed = content.style.display === "none";
        content.style.display = isCollapsed ? "block" : "none";
        toggleBtn.innerHTML = `${isCollapsed ? "▼" : "▶"} ${isCollapsed ? "Hide" : "Show"} Activity`;
      });
      wrapper.appendChild(toggleBtn);
    }

    // Create content container
    const contentDiv = document.createElement("div");
    contentDiv.className = "bh-activity-content";
    contentDiv.style.display = collapsed ? "none" : "block";

    sortedActivity.forEach((item) => {
      const div = document.createElement("div");
      let activityClass = "bh-activity-item bh-text-xs text-neutral-400 text-xs ";

      // Add type-specific styling
      if (item.type === "comment") {
        activityClass += "bh-activity-comment border-l-2 border-l-blue-500/50 pl-2";
      } else if (item.type === "attachment") {
        activityClass += "bh-activity-attachment border-l-2 border-l-green-500/50 pl-2";
      } else if (item.type === "event") {
        activityClass += "bh-activity-event border-l-2 border-l-purple-500/50 pl-2";
      }

      div.className = activityClass;
      let content = "";
      if (item.type === "comment") {
        const userName = item.data.authorName || item.data.authorId;
        content = `<span class="bh-activity-user font-medium text-blue-300">${userName}</span> commented`;
      } else if (item.type === "attachment") {
        const userName = item.data.uploaderName || item.data.uploadedBy;
        content = `<span class="bh-activity-user font-medium text-green-300">${userName}</span> attached <span class="bh-activity-file text-neutral-200">${item.data.filename}</span>`;
      } else if (item.type === "event") {
        const event = item.data;
        const userName = event.actorName || event.actorUserId;
        let action = "";
        if (event.eventType === "issue.created") {
          action = `<span class="bh-activity-user font-medium text-purple-300">${userName}</span> <span class="bh-activity-action text-purple-200">created the issue</span>`;
        } else if (event.eventType === "issue.updated") {
          action = `<span class="bh-activity-user font-medium text-purple-300">${userName}</span> <span class="bh-activity-action text-purple-200">updated the issue</span>`;
        } else if (event.eventType === "issue.transition") {
          const statusColor = getStatusColor(event.payloadObject?.to);
          action = `<span class="bh-activity-user font-medium text-purple-300">${userName}</span> <span class="bh-activity-action text-purple-200">changed status to</span> <span class="bh-activity-status font-medium ${statusColor}">${
            event.payloadObject?.to || "unknown"
          }</span>`;
        } else if (event.eventType === "comment.created") {
          action = `<span class="bh-activity-user font-medium text-purple-300">${userName}</span> <span class="bh-activity-action text-purple-200">commented</span>`;
        } else if (event.eventType === "comment.updated") {
          action = `<span class="bh-activity-user font-medium text-purple-300">${userName}</span> <span class="bh-activity-action text-purple-200">updated a comment</span>`;
        } else if (event.eventType === "comment.deleted") {
          action = `<span class="bh-activity-user font-medium text-purple-300">${userName}</span> <span class="bh-activity-action text-purple-200">deleted a comment</span>`;
        } else {
          action = `<span class="bh-activity-user font-medium text-purple-300">${userName}</span> <span class="bh-activity-action text-purple-200">performed ${event.eventType}</span>`;
        }
        content = action;
      }
      div.innerHTML = `<div class="bh-text-dim text-neutral-500 text-xs mb-1">${new Date(
        item.createdAt
      ).toLocaleString()}</div><div>${content}</div>`;
      contentDiv.appendChild(div);
    });

    wrapper.appendChild(contentDiv);
    container.appendChild(wrapper);
  }

  // Expose the module
  window.bugHatchActivityRenderer = {
    renderActivity: renderActivity,
    getStatusColor: getStatusColor,
  };
})();
