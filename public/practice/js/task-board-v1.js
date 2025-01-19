let currentColumnId = null;
let editingTaskId = null;
let archivedTasks = [];

const COLORS = [
  "red",
  "pink",
  "purple",
  "deep-purple",
  "indigo",
  "blue",
  "light-blue",
  "cyan",
  "teal",
  "green",
  "light-green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "brown",
  "grey",
  "blue-grey",
];

function generateRandomId() {
  return Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

const defaultColumns = [
  { id: `column-todo-${generateRandomId()}`, name: "To Do", color: "blue-grey" },
  { id: `inProgress-${generateRandomId()}`, name: "In Progress", color: "blue-grey" },
  { id: `done-${generateRandomId()}`, name: "Done", color: "blue-grey" },
];

let users = [
  {
    id: `user-${generateRandomId()}`,
    name: "John Doe",
    email: "john@test.test.com",
    groupId: "group-1",
  },
  {
    id: `user-${generateRandomId()}`,
    name: "Jane Smith",
    email: "jane@test.test.com",
    groupId: "group-1",
  },
];

let groups = [
  {
    id: `group-1`,
    name: "Development Team",
    description: "Main development team members",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  initializeColorPicker("taskColor");
  initializeColorPicker("columnColor");

  const board = document.getElementById("task-board");
  defaultColumns.forEach((colData) => {
    const column = createColumn(colData.name, colData.id, colData.color);
    board.appendChild(column);
  });

  ["taskTitle", "columnName"].forEach((id) => {
    const input = document.getElementById(id);
    const counter = document.getElementById(id + "Count");

    if (input && counter) {
      counter.textContent = "0";

      input.addEventListener("input", () => {
        const count = input.value.length;
        counter.textContent = count;
        counter.parentElement.classList.toggle("limit", count >= 256);

        const formGroup = input.closest(".form-group");
        if (input.value.trim()) {
          formGroup.classList.remove("error");
        }
      });
    }
  });

  renderUsers();
  renderGroups();
});

function initializeColorPicker(id) {
  const colorPicker = document.getElementById(id);
  COLORS.forEach((color) => {
    const option = document.createElement("div");
    option.className = `color-option color-${color}`;
    option.setAttribute("data-color", color);
    option.onclick = () => selectColor(option);
    colorPicker.appendChild(option);
  });
}

function selectColor(element) {
  const color = element.getAttribute("data-color");
  const colorPicker = element.closest(".color-picker");

  colorPicker.querySelectorAll(".color-option").forEach((opt) => opt.classList.remove("selected"));
  element.classList.add("selected");

  const container = element.closest(".color-picker-container");
  if (container) {
    const trigger = container.querySelector(".selected-color");
    if (trigger) {
      trigger.className = "selected-color color-" + color;
      colorPicker.classList.remove("active");
    }
  }
}

function addTask(columnId) {
  currentColumnId = columnId;
  editingTaskId = null;
  const modal = document.getElementById("taskModal");
  modal.querySelector(".modal-header h3").textContent = "Add New Task";
  modal.querySelector(".modal-footer .primary").textContent = "Add Task";

  const counter = document.getElementById("taskTitleCount");
  if (counter) {
    counter.textContent = "0";
    counter.parentElement.classList.remove("limit");
  }

  updateTaskUserSelect();
  modal.classList.add("active");
}

function editTask(taskId) {
  const task = document.getElementById(taskId);
  editingTaskId = taskId;
  currentColumnId = task.closest(".column").id;

  const title = task.querySelector(".task-title").textContent;
  const description = task.querySelector(".task-description")?.textContent || "";
  const assigneeId = task.getAttribute("data-assignee") || "";

  const modal = document.getElementById("taskModal");
  modal.querySelector(".modal-header h3").textContent = "Edit Task";
  modal.querySelector(".modal-footer .primary").textContent = "Save Changes";
  document.getElementById("taskTitle").value = title;
  document.getElementById("taskDescription").value = description;
  document.getElementById("taskAssignee").value = assigneeId;

  updateTaskUserSelect(assigneeId);

  const currentColor = Array.from(task.classList)
    .find((cls) => cls.startsWith("color-"))
    ?.replace("color-", "");

  if (currentColor) {
    const colorPicker = document.getElementById("taskColor");
    const colorOption = colorPicker.querySelector(`.color-option[data-color="${currentColor}"]`);
    if (colorOption) {
      selectColor(colorOption);
    }
  }

  const modalFooter = modal.querySelector(".modal-footer");
  if (!modalFooter.querySelector(".archive-btn")) {
    const archiveBtn = document.createElement("button");
    archiveBtn.className = "btn archive-btn";
    archiveBtn.innerHTML = '<i class="fa-solid fa-box-archive"></i> Archive';
    archiveBtn.onclick = () => archiveTask(taskId);
    modalFooter.insertBefore(archiveBtn, modalFooter.querySelector(".primary"));
  }

  const counter = document.getElementById("taskTitleCount");
  if (counter) {
    counter.textContent = title.length;
    counter.parentElement.classList.toggle("limit", title.length >= 256);
  }

  modal.classList.add("active");
}

function validateForm(formElement, requiredFields) {
  let isValid = true;
  requiredFields.forEach((field) => {
    const element = document.getElementById(field.id);
    const value = element.value.trim();
    const formGroup = element.closest(".form-group");

    if (!value) {
      formGroup.classList.add("error");
      isValid = false;
    } else {
      formGroup.classList.remove("error");
    }
  });
  return isValid;
}

function saveTask() {
  const requiredFields = [{ id: "taskTitle", message: "Title is required" }];

  if (!validateForm(document.getElementById("taskModal"), requiredFields)) {
    return;
  }

  const title = document.getElementById("taskTitle").value.trim();
  if (title.length > 256) {
    alert("Task title cannot exceed 256 characters");
    return;
  }
  const description = document.getElementById("taskDescription").value.trim();
  const selectedColor = document.querySelector(".color-option.selected")?.getAttribute("data-color") || COLORS[0];
  const assigneeId = document.getElementById("taskAssignee").value;
  const taskId = editingTaskId || "task-" + generateRandomId();

  if (title) {
    const assignee = users.find((u) => u.id === assigneeId);
    const taskHTML = `
            <div class="task-title" title="${title}">${title.length > 30 ? title.substring(0, 30) + "..." : title}</div>
            ${description ? `<div class="task-description">${description}</div>` : ""}
            ${
              assignee
                ? `
                <div class="task-assignee">
                    <i class="fa-solid fa-user"></i>
                    <span title="${assignee.name}">${assignee.name}</span>
                </div>
            `
                : ""
            }
            <div class="task-actions">
                <button class="task-edit" onclick="editTask('${taskId}')" title="Edit task">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="task-archive" onclick="archiveTask('${taskId}')" title="Archive task">
                    <i class="fa-solid fa-box-archive"></i>
                </button>
                <button class="task-delete" onclick="deleteTask('${taskId}')" title="Delete task">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

    if (editingTaskId) {
      const task = document.getElementById(editingTaskId);
      task.className = `task color-${selectedColor}`;
      task.setAttribute("data-assignee", assigneeId);
      task.innerHTML = taskHTML;
    } else {
      const tasksContainer = document.querySelector(`#${currentColumnId} .tasks`);
      const task = document.createElement("div");
      task.className = `task color-${selectedColor}`;
      task.draggable = true;
      task.id = taskId;
      task.setAttribute("data-assignee", assigneeId);
      task.innerHTML = taskHTML;
      task.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", e.target.id);
      });

      tasksContainer.appendChild(task);
    }
    closeModal("taskModal");
  }
}

function showDialogue(title, message, confirmText, onConfirm, isWarning = false) {
  const dialogue = document.getElementById("customDialogue");
  document.getElementById("dialogueTitle").textContent = title;
  document.getElementById("dialogueMessage").textContent = message;
  const confirmBtn = document.getElementById("dialogueConfirm");
  confirmBtn.textContent = confirmText;
  confirmBtn.className = `btn primary${isWarning ? " warning" : ""}`;

  const closeDialogue = () => {
    dialogue.classList.remove("active");
    setTimeout(() => {
      confirmBtn.onclick = null;
      document.getElementById("dialogueCancel").onclick = null;
    }, 200);
  };

  confirmBtn.onclick = () => {
    onConfirm();
    closeDialogue();
  };

  document.getElementById("dialogueCancel").onclick = closeDialogue;

  dialogue.offsetHeight;
  dialogue.classList.add("active");
}

function deleteTask(taskId) {
  showDialogue(
    "Delete Task",
    "Are you sure you want to delete this task? This action cannot be undone.",
    "Delete",
    () => {
      const task = document.getElementById(taskId);
      task.remove();
    },
    true
  );
}

function archiveTask(taskId) {
  showDialogue(
    "Archive Task",
    "Are you sure you want to archive this task? You can restore it later from the archive.",
    "Archive",
    () => {
      const task = document.getElementById(taskId);
      const taskData = {
        id: taskId,
        title: task.querySelector(".task-title").textContent,
        description: task.querySelector(".task-description")?.textContent || "",
        assigneeId: task.getAttribute("data-assignee") || "",
        color: Array.from(task.classList)
          .find((cls) => cls.startsWith("color-"))
          ?.replace("color-", ""),
        archivedFrom: task.closest(".column").querySelector("h2").textContent,
        archiveDate: new Date().toLocaleString(),
      };

      archivedTasks.push(taskData);
      task.remove();
      closeModal("taskModal");
    }
  );
}

function deleteArchivedTask(taskId) {
  showDialogue(
    "Delete Archived Task",
    "Are you sure you want to permanently delete this archived task? This action cannot be undone.",
    "Delete",
    () => {
      archivedTasks = archivedTasks.filter((t) => t.id !== taskId);
      renderArchivedTasks();
    },
    true
  );
}

function removeColumn(button) {
  showDialogue(
    "Delete Column",
    "Are you sure you want to delete this column and all its tasks? This action cannot be undone.",
    "Delete",
    () => {
      const column = button.closest(".column");
      column.remove();
    },
    true
  );
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("dialogue")) {
    e.target.classList.remove("active");
  }
});

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove("active");
  setTimeout(() => {
    if (modalId === "taskModal") {
      document.getElementById("taskTitle").value = "";
      document.getElementById("taskDescription").value = "";
      const archiveBtn = modal.querySelector(".archive-btn");
      if (archiveBtn) {
        archiveBtn.remove();
      }
      currentColumnId = null;
      editingTaskId = null;
      clearValidation(modalId);
    }
  }, 200);
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal") || e.target.classList.contains("dialogue")) {
    if (e.target.id === "taskModal") {
      closeModal("taskModal");
    } else if (e.target.id === "columnModal") {
      closeModal("columnModal");
    } else if (e.target.id === "archiveModal") {
      closeModal("archiveModal");
    } else if (e.target.id === "customDialogue") {
      e.target.classList.remove("active");
    }
  }
});

function allowDrop(e) {
  e.preventDefault();
  const taskId = e.dataTransfer.getData("text/plain");
  if (taskId.startsWith("task-")) {
    return;
  }

  if (draggedColumn) {
    const board = document.getElementById("task-board");
    const column = e.target.closest(".column");

    clearDropTargets();

    if (column && column !== draggedColumn) {
      dropTarget = column;
      const rect = column.getBoundingClientRect();
      const middle = rect.x + rect.width / 2;

      if (e.clientX < middle) {
        column.classList.add("drop-left");
      } else {
        column.classList.add("drop-right");
      }
    } else if (!column && e.target.id === "task-board") {
      dropTarget = "end";
      const lastColumn = board.lastElementChild;
      if (lastColumn && lastColumn !== draggedColumn) {
        lastColumn.classList.add("drop-right");
      }
    }
  }
}

function drop(e) {
  e.preventDefault();
  const taskId = e.dataTransfer.getData("text/plain");

  if (taskId.startsWith("task-")) {
    const task = document.getElementById(taskId);
    const tasksContainer = e.target.closest(".tasks");
    if (tasksContainer) {
      tasksContainer.appendChild(task);
    }
    return;
  }
}

let draggedColumn = null;
let dropTarget = null;

function dragColumn(e) {
  draggedColumn = e.target;
  e.target.classList.add("dragging");
  e.dataTransfer.setData("text/plain", e.target.id);
  e.dataTransfer.effectAllowed = "move";
}

function dropColumn(e) {
  e.preventDefault();
  if (!draggedColumn) return;

  const board = document.getElementById("task-board");

  if (dropTarget === "end") {
    board.appendChild(draggedColumn);
  } else if (dropTarget && draggedColumn !== dropTarget) {
    const dropRect = dropTarget.getBoundingClientRect();
    const dropMiddle = dropRect.x + dropRect.width / 2;
    const targetPos = Array.from(board.children).indexOf(dropTarget);
    const draggedPos = Array.from(board.children).indexOf(draggedColumn);

    if (e.clientX < dropMiddle && targetPos > draggedPos) {
      dropTarget.parentNode.insertBefore(draggedColumn, dropTarget);
    } else if (e.clientX >= dropMiddle && targetPos < draggedPos) {
      dropTarget.parentNode.insertBefore(draggedColumn, dropTarget.nextSibling);
    }
  }

  draggedColumn.classList.remove("dragging");
  clearDropTargets();
  draggedColumn = null;
  dropTarget = null;
}

function clearDropTargets() {
  document.querySelectorAll(".column").forEach((col) => {
    col.classList.remove("drop-left", "drop-right");
  });
}

function addColumn() {
  const modal = document.getElementById("columnModal");
  modal.querySelector(".modal-header h3").textContent = "Add New Column";
  modal.querySelector(".modal-footer .primary").textContent = "Add Column";
  modal.classList.add("active");
  const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  document.querySelectorAll("#columnColor .color-option").forEach((opt) => {
    if (opt.getAttribute("data-color") === randomColor) {
      selectColor(opt);
    }
  });
}

function closeColumnModal() {
  closeModal("columnModal");
}

function closeTaskModal() {
  closeModal("taskModal");
}

function saveColumn() {
  const requiredFields = [{ id: "columnName", message: "Column name is required" }];

  if (!validateForm(document.getElementById("columnModal"), requiredFields)) {
    return;
  }

  const columnName = document.getElementById("columnName").value.trim();
  if (columnName.length > 256) {
    alert("Column name cannot exceed 256 characters");
    return;
  }
  const selectedColor =
    document.querySelector("#columnColor .color-option.selected")?.getAttribute("data-color") || COLORS[0];

  if (columnName) {
    const columnId = "column-" + generateRandomId();
    const column = createColumn(columnName, columnId, selectedColor);
    document.getElementById("task-board").appendChild(column);
    closeColumnModal();
  }
}

function createColumn(name, id, color) {
  const column = document.createElement("div");
  column.className = `column color-${color}`;
  column.id = id;
  column.draggable = true;
  column.ondragstart = dragColumn;

  column.innerHTML = `
        <div class="column-header">
            <h2>${name}</h2>
            <div class="column-actions">
                <button class="add-btn" onclick="addTask('${id}')"><i class="fa-solid fa-plus"></i></button>
                <div class="column-color-picker">
                    <button class="color-btn" onclick="toggleColumnColors(this, event)"><i class="fa-solid fa-palette"></i></button>
                    <div class="color-picker">
                        ${COLORS.map(
                          (c) => `
                            <div class="color-option color-${c}" 
                                onclick="changeColumnColor('${id}', '${c}')"
                                title="${c}">
                            </div>
                        `
                        ).join("")}
                    </div>
                </div>
                <button class="delete-column-btn" onclick="removeColumn(this)"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
        <div class="tasks" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
    `;

  return column;
}

function toggleColumnColors(btn, event) {
  event.stopPropagation();

  document.querySelectorAll(".column-color-picker .color-picker").forEach((picker) => {
    if (picker !== btn.nextElementSibling) {
      picker.classList.remove("active");
    }
  });

  const picker = btn.nextElementSibling;
  picker.classList.toggle("active");
}

function changeColumnColor(columnId, color) {
  const column = document.getElementById(columnId);
  COLORS.forEach((c) => column.classList.remove(`color-${c}`));
  column.classList.add(`color-${color}`);
  document.querySelectorAll(".column-color-picker .color-picker").forEach((picker) => {
    picker.classList.remove("active");
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".column-color-picker") || e.target.closest(".color-option")) {
    document.querySelectorAll(".column-color-picker .color-picker").forEach((picker) => {
      picker.classList.remove("active");
    });
  }
});

function toggleTaskColors(trigger) {
  const picker = trigger.nextElementSibling;
  picker.classList.toggle("active");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".color-picker-container")) {
    document.querySelectorAll(".color-picker").forEach((picker) => {
      picker.classList.remove("active");
    });
  }
});

function clearValidation(modalId) {
  const modal = document.getElementById(modalId);
  modal.querySelectorAll(".form-group").forEach((group) => {
    group.classList.remove("error");
  });
}

let editingUserId = null;
let editingGroupId = null;

function openUserManagement() {
  document.getElementById("userManagementModal").classList.add("active");
  renderUsers();
  renderGroups();
}

function closeUserModal() {
  closeModal("userManagementModal");
}

function switchTab(tab, tabName) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.add("hidden"));
  document.getElementById(tabName + "-tab").classList.remove("hidden");
}

function openAddUserModal(userId = null) {
  const modal = document.getElementById("userFormModal");
  const title = modal.querySelector(".modal-header h3");
  const submitBtn = modal.querySelector(".modal-footer .primary");

  editingUserId = userId;
  if (userId) {
    const user = users.find((u) => u.id === userId);
    title.textContent = "Edit User";
    submitBtn.textContent = "Save Changes";
    document.getElementById("userName").value = user.name;
    document.getElementById("userEmail").value = user.email;
    document.getElementById("userGroup").value = user.groupId || "";
  } else {
    title.textContent = "Add User";
    submitBtn.textContent = "Add User";
    document.getElementById("userName").value = "";
    document.getElementById("userEmail").value = "";
    document.getElementById("userGroup").value = "";
  }

  updateGroupSelect();
  modal.classList.add("active");
}

function closeUserFormModal() {
  closeModal("userFormModal");
  editingUserId = null;
  clearValidation("userFormModal");
}

function saveUser() {
  const requiredFields = [
    { id: "userName", message: "Name is required" },
    { id: "userEmail", message: "Valid email is required" },
  ];

  if (!validateForm(document.getElementById("userFormModal"), requiredFields)) {
    return;
  }

  const userData = {
    id: editingUserId || "user-" + generateRandomId(),
    name: document.getElementById("userName").value.trim(),
    email: document.getElementById("userEmail").value.trim(),
    groupId: document.getElementById("userGroup").value,
  };

  if (editingUserId) {
    users = users.map((u) => (u.id === editingUserId ? userData : u));
  } else {
    users.push(userData);
  }

  closeUserFormModal();
  renderUsers();
}

function deleteUser(userId) {
  showDialogue(
    "Delete User",
    "Are you sure you want to delete this user? Any tasks assigned to them will be unassigned.",
    "Delete",
    () => {
      document.querySelectorAll(`[data-assignee="${userId}"]`).forEach((task) => {
        task.removeAttribute("data-assignee");
        const assigneeDiv = task.querySelector(".task-assignee");
        if (assigneeDiv) assigneeDiv.remove();
      });

      users = users.filter((u) => u.id !== userId);
      renderUsers();
    },
    true
  );
}

function renderUsers() {
  const usersList = document.getElementById("usersList");
  usersList.innerHTML = users
    .map(
      (user) => `
        <div class="user-item">
            <div class="item-info">
                <div class="item-name">${user.name}</div>
                <div class="item-detail">${user.email}</div>
                ${
                  user.groupId
                    ? `<div class="item-detail">Group: ${groups.find((g) => g.id === user.groupId)?.name || ""}</div>`
                    : ""
                }
            </div>
            <div class="item-actions">
                <button class="action-btn" onclick="openAddUserModal('${user.id}')" title="Edit user">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="action-btn delete" onclick="deleteUser('${user.id}')" title="Delete user">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

function openAddGroupModal(groupId = null) {
  const modal = document.getElementById("groupFormModal");
  const title = modal.querySelector(".modal-header h3");
  const submitBtn = modal.querySelector(".modal-footer .primary");

  editingGroupId = groupId;
  if (groupId) {
    const group = groups.find((g) => g.id === groupId);
    title.textContent = "Edit Group";
    submitBtn.textContent = "Save Changes";
    document.getElementById("groupName").value = group.name;
    document.getElementById("groupDescription").value = group.description || "";
  } else {
    title.textContent = "Add Group";
    submitBtn.textContent = "Add Group";
    document.getElementById("groupName").value = "";
    document.getElementById("groupDescription").value = "";
  }

  modal.classList.add("active");
}

function closeGroupFormModal() {
  closeModal("groupFormModal");
  editingGroupId = null;
  clearValidation("groupFormModal");
}

function saveGroup() {
  const requiredFields = [{ id: "groupName", message: "Group name is required" }];

  if (!validateForm(document.getElementById("groupFormModal"), requiredFields)) {
    return;
  }

  const groupData = {
    id: editingGroupId || "group-" + generateRandomId(),
    name: document.getElementById("groupName").value.trim(),
    description: document.getElementById("groupDescription").value.trim(),
  };

  if (editingGroupId) {
    groups = groups.map((g) => (g.id === editingGroupId ? groupData : g));
  } else {
    groups.push(groupData);
  }

  closeGroupFormModal();
  renderGroups();
  updateGroupSelect();
}

function deleteGroup(groupId) {
  showDialogue(
    "Delete Group",
    "Are you sure you want to delete this group? Users in this group will be unassigned from it.",
    "Delete",
    () => {
      groups = groups.filter((g) => g.id !== groupId);
      users = users.map((u) => (u.groupId === groupId ? { ...u, groupId: "" } : u));
      renderGroups();
      renderUsers();
      updateGroupSelect();
    },
    true
  );
}

function renderGroups() {
  const groupsList = document.getElementById("groupsList");
  groupsList.innerHTML = groups
    .map(
      (group) => `
        <div class="group-item">
            <div class="item-info">
                <div class="item-name">${group.name}</div>
                ${group.description ? `<div class="item-detail">${group.description}</div>` : ""}
                <div class="item-detail">Members: ${users.filter((u) => u.groupId === group.id).length}</div>
            </div>
            <div class="item-actions">
                <button class="action-btn" onclick="openAddGroupModal('${group.id}')" title="Edit group">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="action-btn delete" onclick="deleteGroup('${group.id}')" title="Delete group">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

function updateGroupSelect() {
  const select = document.getElementById("userGroup");
  select.innerHTML =
    '<option value="">No Group</option>' +
    groups
      .map(
        (group) => `
        <option value="${group.id}">${group.name}</option>
    `
      )
      .join("");
}

function updateTaskUserSelect(selectedUserId = "") {
  const select = document.getElementById("taskAssignee");
  select.innerHTML =
    '<option value="">Unassigned</option>' +
    users
      .map(
        (user) => `
        <option value="${user.id}" ${user.id === selectedUserId ? "selected" : ""}>
            ${user.name}
        </option>
    `
      )
      .join("");
}

function openArchive() {
  const modal = document.getElementById("archiveModal");
  renderArchivedTasks();
  modal.offsetHeight;
  modal.classList.add("active");
}

function closeArchiveModal() {
  closeModal("archiveModal");
}

function renderArchivedTasks() {
  const container = document.getElementById("archivedTasks");
  container.innerHTML =
    archivedTasks.length === 0
      ? '<div class="no-archives">No archived tasks</div>'
      : archivedTasks
          .map(
            (task) => `
          <div class="archived-task color-${task.color || "grey"}">
              <div class="archived-task-header">
                  <div class="task-title">${task.title}</div>
                  <div class="archived-task-meta">
                      Archived from: ${task.archivedFrom}<br>
                      Date: ${task.archiveDate}
                  </div>
              </div>
              ${task.description ? `<div class="task-description">${task.description}</div>` : ""}
              ${
                task.assigneeId
                  ? `
                  <div class="task-assignee">
                      <i class="fa-solid fa-user"></i>
                      <span>${users.find((u) => u.id === task.assigneeId)?.name || "Unknown"}</span>
                  </div>
              `
                  : ""
              }
              <div class="archived-task-actions">
                  <button onclick="restoreTask('${task.id}')" class="btn small">
                      <i class="fa-solid fa-rotate-left"></i> Restore
                  </button>
                  <button onclick="deleteArchivedTask('${task.id}')" class="btn small delete">
                      <i class="fa-solid fa-trash"></i> Delete
                  </button>
              </div>
          </div>
      `
          )
          .join("");
}

function restoreTask(taskId) {
  const taskData = archivedTasks.find((t) => t.id === taskId);
  if (!taskData) return;

  const firstColumn = document.querySelector(".column");
  if (firstColumn) {
    const task = document.createElement("div");
    task.className = `task${taskData.color ? ` color-${taskData.color}` : ""}`;
    task.draggable = true;
    task.id = taskData.id;
    if (taskData.assigneeId) task.setAttribute("data-assignee", taskData.assigneeId);

    task.innerHTML = `
          <div class="task-title">${taskData.title}</div>
          ${taskData.description ? `<div class="task-description">${taskData.description}</div>` : ""}
          ${
            taskData.assigneeId
              ? `
              <div class="task-assignee">
                  <i class="fa-solid fa-user"></i>
                  <span>${users.find((u) => u.id === taskData.assigneeId)?.name || "Unknown"}</span>
              </div>
          `
              : ""
          }
          <div class="task-actions">
              <button class="task-archive" onclick="archiveTask('${taskData.id}')" title="Archive task">
                  <i class="fa-solid fa-box-archive"></i>
              </button>
              <button class="task-edit" onclick="editTask('${taskData.id}')" title="Edit task">
                  <i class="fa-solid fa-pen"></i>
              </button>
              <button class="task-delete" onclick="deleteTask('${taskData.id}')" title="Delete task">
                  <i class="fa-solid fa-trash"></i>
              </button>
          </div>
      `;

    task.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", e.target.id);
    });

    firstColumn.querySelector(".tasks").appendChild(task);
  }

  archivedTasks = archivedTasks.filter((t) => t.id !== taskId);
  renderArchivedTasks();
}

function saveBoard() {
  const board = document.getElementById("task-board");
  const boardData = {
    columns: [],
    users,
    groups,
    archivedTasks,
  };

  board.querySelectorAll(".column").forEach((column) => {
    const columnData = {
      id: column.id,
      name: column.querySelector("h2").textContent,
      color: COLORS.find((color) => column.classList.contains(`color-${color}`)) || "grey",
      tasks: [],
    };

    column.querySelectorAll(".task").forEach((task) => {
      columnData.tasks.push({
        id: task.id,
        title: task.querySelector(".task-title").textContent,
        description: task.querySelector(".task-description")?.textContent || "",
        color: COLORS.find((color) => task.classList.contains(`color-${color}`)) || "grey",
        assigneeId: task.getAttribute("data-assignee") || "",
      });
    });

    boardData.columns.push(columnData);
  });

  const dataStr = JSON.stringify(boardData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `taskboard-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function loadBoard(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const boardData = JSON.parse(e.target.result);

      const board = document.getElementById("task-board");
      board.innerHTML = "";

      users = boardData.users || [];
      groups = boardData.groups || [];
      archivedTasks = boardData.archivedTasks || [];

      boardData.columns.forEach((columnData) => {
        const column = createColumn(columnData.name, columnData.id, columnData.color);
        const tasksContainer = column.querySelector(".tasks");

        columnData.tasks.forEach((taskData) => {
          const task = document.createElement("div");
          task.className = `task color-${taskData.color}`;
          task.draggable = true;
          task.id = taskData.id;
          if (taskData.assigneeId) {
            task.setAttribute("data-assignee", taskData.assigneeId);
          }

          const assignee = users.find((u) => u.id === taskData.assigneeId);
          task.innerHTML = `
                        <div class="task-title">${taskData.title}</div>
                        ${taskData.description ? `<div class="task-description">${taskData.description}</div>` : ""}
                        ${
                          assignee
                            ? `
                            <div class="task-assignee">
                                <i class="fa-solid fa-user"></i>
                                <span>${assignee.name}</span>
                            </div>
                        `
                            : ""
                        }
                        <div class="task-actions">
                            <button class="task-edit" onclick="editTask('${taskData.id}')" title="Edit task">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="task-archive" onclick="archiveTask('${taskData.id}')" title="Archive task">
                                <i class="fa-solid fa-box-archive"></i>
                            </button>
                            <button class="task-delete" onclick="deleteTask('${taskData.id}')" title="Delete task">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    `;

          task.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", e.target.id);
          });

          tasksContainer.appendChild(task);
        });

        board.appendChild(column);
      });

      renderUsers();
      renderGroups();

      event.target.value = "";
    } catch (error) {
      console.error("Error loading board:", error);
      alert("Error loading board file. Please check if the file is valid.");
    }
  };
  reader.readAsText(file);
}
