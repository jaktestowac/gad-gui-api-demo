// BugHatch Comments Renderer Module
(function () {
  "use strict";

  // Render comments list
  function renderComments(comments, container, canEditCommentFn = () => false) {
    if (!container) return;
    container.innerHTML = "";
    if (!comments.length) {
      container.innerHTML = '<div class="bh-text-dim bh-text-xs text-neutral-500 text-xs">No comments yet.</div>';
      return;
    }
    // Build threaded structure
    const commentMap = {};
    const roots = [];
    comments.forEach((c) => {
      commentMap[c.id] = { ...c, children: [] };
    });
    comments.forEach((c) => {
      if (c.parentId) {
        if (commentMap[c.parentId]) {
          commentMap[c.parentId].children.push(commentMap[c.id]);
        }
      } else {
        roots.push(commentMap[c.id]);
      }
    });
    roots.forEach((root) => renderCommentTree(container, root, 0, canEditCommentFn));
  }

  function renderCommentTree(container, comment, depth, canEditCommentFn) {
    const div = document.createElement("div");
    div.className = `bh-comment bh-border-l-2 bh-border-neutral-700 bh-pl-sm ${
      depth > 0 ? "bh-ml-sm" : ""
    } border-l-2 border-neutral-700 pl-2 ${depth > 0 ? "ml-2" : ""}`;
    div.innerHTML = `
      <div class="bh-flex bh-items-start bh-gap-sm flex items-start gap-2">
        <div class="bh-flex-1 flex-1">
          <div class="bh-text-xs bh-text-dim text-neutral-400 text-xs">${comment.authorId} • ${new Date(
      comment.createdAt
    ).toLocaleString()}</div>
          <div class="bh-text-sm bh-mt-xs bh-whitespace-pre-wrap text-neutral-100 text-sm mt-1 whitespace-pre-wrap">${escapeHtml(
            comment.body
          )}</div>
        </div>
        ${
          canEditCommentFn(comment)
            ? `<div class="bh-flex bh-gap-xs flex gap-1">
          <button class="bh-btn bh-btn-ghost bh-btn-2xs bh-edit-comment text-neutral-400 hover:text-neutral-200 text-xs" data-id="${comment.id}">Edit</button>
          <button class="bh-btn bh-btn-ghost bh-btn-2xs bh-delete-comment text-red-400 hover:text-red-200 text-xs" data-id="${comment.id}">Delete</button>
        </div>`
            : ""
        }
      </div>
    `;
    container.appendChild(div);
    // Add reply button
    if (depth < 3) {
      // limit nesting
      const replyBtn = document.createElement("button");
      replyBtn.className =
        "bh-btn bh-btn-ghost bh-btn-2xs bh-reply-comment text-neutral-400 hover:text-neutral-200 text-xs mt-1";
      replyBtn.textContent = "Reply";
      replyBtn.setAttribute("data-id", comment.id);
      div.appendChild(replyBtn);
    }
    // Render children
    comment.children.forEach((child) => renderCommentTree(container, child, depth + 1, canEditCommentFn));
  }

  // Escape HTML helper
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Expose the module
  window.bugHatchCommentsRenderer = {
    renderComments: renderComments,
    escapeHtml: escapeHtml,
  };
})();
