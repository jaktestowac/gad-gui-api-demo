"use strict";

const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

let currentUser = null;
let invitations = [];

async function apiFetch(path, opts = {}) {
  const res = await fetch("/api/bug-hatch" + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error?.message || res.statusText);
  return json.data ?? json;
}

function showToast(msg, type = "info") {
  const container = qs("#toastContainer");
  const toast = document.createElement("div");
  const bgMap = { success: "bg-green-600", error: "bg-red-600", info: "bg-blue-600" };
  toast.className = `px-4 py-2 rounded text-white shadow ${bgMap[type] || bgMap.info}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

async function loadCurrentUser() {
  try {
    currentUser = await apiFetch("/users/me");
    qs("#userEmail").textContent = currentUser.email;
  } catch {
    window.location.href = "/bug-hatch/login.html";
  }
}

async function loadInvitations() {
  try {
    invitations = await apiFetch("/invitations/my");
    renderInvitations();
  } catch (err) {
    showToast("Failed to load invitations: " + err.message, "error");
  }
}

function renderInvitations() {
  const container = qs("#invitationsList");
  const emptyState = qs("#emptyState");

  if (!invitations || invitations.length === 0) {
    container.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  container.innerHTML = invitations
    .map(
      (inv) => `
    <div class="bh-card p-4 flex items-center justify-between" data-id="${inv.id}">
      <div>
        <h3 class="font-semibold">${escapeHtml(inv.projectName || "Project #" + inv.projectId)}</h3>
        <p class="text-sm text-gray-400">Role: <span class="capitalize">${escapeHtml(inv.role)}</span></p>
        <p class="text-xs text-gray-500">Invited: ${new Date(inv.createdAt).toLocaleDateString()}</p>
      </div>
      <div class="flex gap-2">
        <button class="bh-btn bh-btn-primary btn-accept" data-id="${inv.id}">Accept</button>
        <button class="bh-btn bg-red-600 hover:bg-red-700 btn-reject" data-id="${inv.id}">Reject</button>
      </div>
    </div>
  `
    )
    .join("");

  // Attach event listeners
  qsa(".btn-accept", container).forEach((btn) => {
    btn.addEventListener("click", () => handleAccept(btn.dataset.id));
  });
  qsa(".btn-reject", container).forEach((btn) => {
    btn.addEventListener("click", () => handleReject(btn.dataset.id));
  });
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function handleAccept(invitationId) {
  try {
    await apiFetch(`/invitations/${invitationId}/accept`, { method: "POST" });
    showToast("Invitation accepted!", "success");
    invitations = invitations.filter((i) => i.id !== invitationId);
    renderInvitations();
  } catch (err) {
    showToast("Failed to accept: " + err.message, "error");
  }
}

async function handleReject(invitationId) {
  try {
    await apiFetch(`/invitations/${invitationId}/reject`, { method: "POST" });
    showToast("Invitation rejected", "info");
    invitations = invitations.filter((i) => i.id !== invitationId);
    renderInvitations();
  } catch (err) {
    showToast("Failed to reject: " + err.message, "error");
  }
}

async function handleLogout() {
  try {
    await apiFetch("/logout", { method: "POST" });
  } catch {
    // ignore
  }
  window.location.href = "/bug-hatch/login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUser();
  await loadInvitations();

  qs("#logoutBtn").addEventListener("click", handleLogout);
});
