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

const COLOR_PALETTES = [
  {
    name: "Classic",
    background: "#f1f2f4",
    textColor: "#172b4d",
    textColorSecondary: "#ffffff",
    columnColor: "#ffffff",
    headerColor: "#ffffff",
    tasksColor: "#f8f9fa",
  },
  {
    name: "Dark",
    background: "#2f363d",
    textColor: "#ffffff",
    textColorSecondary: "#9e9e9e",
    columnColor: "#444d56",
    headerColor: "#24292e",
    tasksColor: "#383f45",
  },
  {
    name: "Ocean",
    background: "#e3f2fd",
    textColor: "#1e3a5f",
    textColorSecondary: "#4a148c",
    columnColor: "#ffffff",
    headerColor: "#bbdefb",
    tasksColor: "#e3f2fd",
  },
  {
    name: "Forest",
    background: "#e8f5e9",
    textColor: "#1b5e20",
    textColorSecondary: "#4a148c",
    columnColor: "#ffffff",
    headerColor: "#c8e6c9",
    tasksColor: "#e8f5e9",
  },
  {
    name: "Dark Forest",
    background: "#1b5e20",
    textColor: "#ffffff",
    textColorSecondary: "#9e9e9e",
    columnColor: "#2e7d32",
    headerColor: "#388e3c",
    tasksColor: "#1b5e20",
  },
  {
    name: "Sunset",
    background: "#fff3e0",
    textColor: "#e65100",
    textColorSecondary: "#4a148c",
    columnColor: "#ffffff",
    headerColor: "#ffe0b2",
    tasksColor: "#fff3e0",
  },
  {
    name: "Midnight",
    background: "#303030",
    textColor: "#ffffff",
    textColorSecondary: "#9e9e9e",
    columnColor: "#424242",
    headerColor: "#212121",
    tasksColor: "#383838",
  },
  {
    name: "Rose",
    background: "#fce4ec",
    textColor: "#880e4f",
    textColorSecondary: "#4a148c",
    columnColor: "#ffffff",
    headerColor: "#f8bbd0",
    tasksColor: "#fce4ec",
  },
  {
    name: "Obsidian",
    background: "#263238",
    textColor: "#ffffff",
    textColorSecondary: "#243640",
    columnColor: "#37474f",
    headerColor: "#1a2428",
    tasksColor: "#2c3a41",
  },
];

function generateRandomId() {
  return Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

const defaultColumns = [
  { id: `column-todo-${generateRandomId()}`, name: "To Do", color: "blue-grey" },
  { id: `inProgress-${generateRandomId()}`, name: "In Progress", color: "blue-grey" },
  { id: `done-${generateRandomId()}`, name: "Done", color: "blue-grey" },
];

let groups = [
  {
    id: `group-1`,
    name: "Development Team",
    description: "Main development team members",
  },
];

let boardData = {
  title: "Task Board",
  description: "",
  style: {
    background: "#f1f2f4",
    textColor: "#172b4d",
    textColorSecondary: "#262626",
    columnColor: "#ffffff",
    headerColor: "#ffffff",
    tasksColor: "#f8f9fa",
  },
};

const defaultUsers = [
  {
    id: `user-${generateRandomId()}`,
    name: "John Doe",
    email: "john@example.com",
    groupId: "group-dev",
  },
  {
    id: `user-${generateRandomId()}`,
    name: "Jane Smith",
    email: "jane@example.com",
    groupId: "group-dev",
  },
  {
    id: `user-${generateRandomId()}`,
    name: "Mike Johnson",
    email: "mike@example.com",
    groupId: "group-qa",
  },
];

let users = defaultUsers;

const defaultGroups = [
  {
    id: "group-dev",
    name: "Development Team",
    description: "Software developers and engineers",
  },
  {
    id: "group-qa",
    name: "QA Team",
    description: "Quality assurance and testing team",
  },
];

function setCookie(name, value, days = 365) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + JSON.stringify(value) + ";" + expires + ";path=/";
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    try {
      return JSON.parse(parts.pop().split(";").shift());
    } catch (e) {
      return null;
    }
  }
  return null;
}

function saveBoardToStorage() {
  const boardStorage = {
    title: boardData.title,
    description: boardData.description,
    style: boardData.style,
    columns: [],
    users,
    groups,
    archivedTasks,
  };

  document.querySelectorAll(".column").forEach((column) => {
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

    boardStorage.columns.push(columnData);
  });

  localStorage.setItem("taskBoardState", JSON.stringify(boardStorage));
}

function loadBoardFromStorage() {
  const savedBoard = localStorage.getItem("taskBoardState");
  if (!savedBoard) return false;

  try {
    const boardStorage = JSON.parse(savedBoard);

    boardData = {
      title: boardStorage.title || "Task Board",
      description: boardStorage.description || "",
      style: { ...boardData.style, ...boardStorage.style },
    };

    users = boardStorage.users || [];
    groups = boardStorage.groups || [];
    archivedTasks = boardStorage.archivedTasks || [];

    const board = document.getElementById("task-board");
    board.innerHTML = "";

    boardStorage.columns.forEach((columnData) => {
      const column = createColumn(columnData.name, columnData.id, columnData.color);
      const tasksContainer = column.querySelector(".tasks");

      columnData.tasks.forEach((taskData) => {
        const task = createTask(taskData);
        tasksContainer.appendChild(task);
      });

      board.appendChild(column);
    });

    updateBoardHeader();
    updateBoardStyle();
    return true;
  } catch (error) {
    console.error("Error loading board from storage:", error);
    return false;
  }
}

function createTask(taskData) {
  const task = document.createElement("div");
  task.className = `task color-${taskData.color}`;
  task.draggable = true;
  task.id = taskData.id;
  if (taskData.assigneeId) {
    task.setAttribute("data-assignee", taskData.assigneeId);
  }

  const assignee = users.find((u) => u.id === taskData.assigneeId);
  task.innerHTML = `
      <div class="task-title" title="${taskData.title}">${taskData.title}</div>
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

  return task;
}

document.addEventListener("DOMContentLoaded", () => {
  const savedStyle = getCookie("taskBoardStyle");
  if (savedStyle) {
    boardData.style = { ...boardData.style, ...savedStyle };
  }

  initializeColorPicker("taskColor");
  initializeColorPicker("columnColor");
  initializeColorPicker("boardBackgroundColor");
  initializeColorPicker("boardTextColor");
  initializeColorPicker("boardColumnColor");

  const board = document.getElementById("task-board");
  const loaded = loadBoardFromStorage();

  if (!loaded) {
    defaultColumns.forEach((colData) => {
      const column = createColumn(colData.name, colData.id, colData.color);
      board.appendChild(column);
    });
  }

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

  ["boardTitleInput", "boardDescriptionInput"].forEach((id) => {
    const input = document.getElementById(id);
    const counter = document.getElementById(id + "Count");
    const maxLength = parseInt(input.getAttribute("maxlength"));

    if (input && counter) {
      counter.textContent = "0";

      input.addEventListener("input", () => {
        const count = input.value.length;
        const isAtLimit = count >= maxLength;

        counter.textContent = count;
        counter.parentElement.classList.toggle("limit", isAtLimit);

        if (id === "boardTitleInput") {
          const formGroup = input.closest(".form-group");
          if (input.value.trim()) {
            formGroup.classList.remove("error");
          } else {
            formGroup.classList.add("error");
          }
        }

        if (isAtLimit) {
          input.classList.add("at-limit");
        } else {
          input.classList.remove("at-limit");
        }
      });
    }
  });

  // Add task description counter
  const taskDesc = document.getElementById("taskDescription");
  const taskDescCounter = document.getElementById("taskDescriptionCount");
  if (taskDesc && taskDescCounter) {
    taskDescCounter.textContent = "0";
    taskDesc.addEventListener("input", () => {
      const count = taskDesc.value.length;
      taskDescCounter.textContent = count;
      taskDescCounter.parentElement.classList.toggle("limit", count >= 4096);

      if (count >= 4096) {
        taskDesc.classList.add("at-limit");
      } else {
        taskDesc.classList.remove("at-limit");
      }
    });
  }

  renderUsers();
  renderGroups();
  updateBoardHeader();
  updateBoardStyle();

  const paletteSelect = document.getElementById("colorPaletteSelect");
  if (paletteSelect) {
    paletteSelect.innerHTML = `
        <option value="">Custom</option>
        ${COLOR_PALETTES.map(
          (palette, index) => `
            <option value="${index}">${palette.name}</option>
        `
        ).join("")}
    `;
  }
});

function initializeColorPicker(id) {
  const colorPicker = document.getElementById(id);
  if (colorPicker === null) return;

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
  const computedStyle = getComputedStyle(element);

  colorPicker.querySelectorAll(".color-option").forEach((opt) => opt.classList.remove("selected"));
  element.classList.add("selected");

  const container = element.closest(".color-picker-container");
  if (container) {
    const trigger = container.querySelector(".selected-color");
    if (trigger) {
      trigger.style.backgroundColor = computedStyle.backgroundColor;
      trigger.className = "selected-color";
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

  const descCounter = document.getElementById("taskDescriptionCount");
  if (descCounter) {
    descCounter.textContent = description.length;
    descCounter.parentElement.classList.toggle("limit", description.length >= 4096);
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
  if (description.length > 4096) {
    alert("Task description cannot exceed 4096 characters");
    return;
  }
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

    saveBoardToStorage();
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
      saveBoardToStorage();
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
      saveBoardToStorage();
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
      saveBoardToStorage();
    },
    true
  );
}

function removeColumn(button) {
  const column = button.closest(".column");
  const tasks = column.querySelectorAll(".task");

  if (tasks.length === 0) {
    showDialogue(
      "Delete Column",
      "Are you sure you want to delete this empty column?",
      "Delete",
      () => {
        column.remove();
        saveBoardToStorage();
      },
      true
    );
    return;
  }

  const dialogue = document.getElementById("customDialogue");
  const dialogueTitle = document.getElementById("dialogueTitle");
  const dialogueMessage = document.getElementById("dialogueMessage");
  const footer = dialogue.querySelector(".dialogue-footer");

  dialogueTitle.textContent = "Delete Column";
  dialogueMessage.textContent = `This column contains ${tasks.length} task${
    tasks.length > 1 ? "s" : ""
  }. What would you like to do with them?`;

  const originalFooter = footer.innerHTML;

  footer.innerHTML = `
        <button class="btn cancel" onclick="closeDialogue()">Cancel</button>
        <button class="btn primary" onclick="archiveColumnTasks('${column.id}')">Archive Tasks</button>
        <button class="btn primary warning" onclick="deleteColumnAndTasks('${column.id}')">Delete All</button>
    `;

  dialogue.offsetHeight;
  dialogue.classList.add("active");

  window.closeDialogue = () => {
    dialogue.classList.remove("active");
    setTimeout(() => {
      footer.innerHTML = originalFooter;
    }, 200);
  };
}

function archiveColumnTasks(columnId) {
  const column = document.getElementById(columnId);
  const tasks = column.querySelectorAll(".task");

  tasks.forEach((task) => {
    const taskData = {
      id: task.id,
      title: task.querySelector(".task-title").textContent,
      description: task.querySelector(".task-description")?.textContent || "",
      assigneeId: task.getAttribute("data-assignee") || "",
      color: Array.from(task.classList)
        .find((cls) => cls.startsWith("color-"))
        ?.replace("color-", ""),
      archivedFrom: column.querySelector("h2").textContent,
      archiveDate: new Date().toLocaleString(),
    };
    archivedTasks.push(taskData);
  });

  column.remove();
  saveBoardToStorage();
  closeDialogue();
}

function deleteColumnAndTasks(columnId) {
  const column = document.getElementById(columnId);
  column.remove();
  saveBoardToStorage();
  closeDialogue();
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
    saveBoardToStorage();
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
  saveBoardToStorage();
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
    saveBoardToStorage();
    closeColumnModal();
    updateBoardHeader();
    updateBoardStyle();
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

function changeColumnColor(columnId, color) {
  const column = document.getElementById(columnId);
  const colorElement = document.querySelector(`.color-option.color-${color}`);
  const computedStyle = getComputedStyle(colorElement);

  COLORS.forEach((c) => column.classList.remove(`color-${c}`));
  column.classList.add(`color-${color}`);

  column.style.backgroundColor = computedStyle.backgroundColor;

  const header = column.querySelector(".column-header");
  if (header) {
    header.style.backgroundColor = computedStyle.backgroundColor;
  }

  document.querySelectorAll(".column-color-picker .color-picker").forEach((picker) => {
    picker.classList.remove("active");
  });
  saveBoardToStorage();
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

  const colorOptions = picker.querySelectorAll(".color-option");
  colorOptions.forEach((option) => {
    if (!option.onclick) {
      option.onclick = () => {
        const color = option.getAttribute("data-color");
        const columnId = btn.closest(".column").id;
        changeColumnColor(columnId, color);
      };
    }
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
    const userGroupElement = document.getElementById("userGroup");
    if (userGroupElement) {
      userGroupElement.value = user.groupId || "";
    }
  } else {
    title.textContent = "Add User";
    submitBtn.textContent = "Add User";
    document.getElementById("userName").value = "";
    document.getElementById("userEmail").value = "";
    const userGroupElement = document.getElementById("userGroup");
    if (userGroupElement) {
      userGroupElement.value = "";
    }
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
  saveBoardToStorage();
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
      saveBoardToStorage();
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
  saveBoardToStorage();
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
      saveBoardToStorage();
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
  if (!firstColumn) {
    showDialogue(
      "Cannot Restore Task",
      "There are no columns available. Please create a column first.",
      "OK",
      () => {},
      false
    );
    return;
  }

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
  archivedTasks = archivedTasks.filter((t) => t.id !== taskId);
  renderArchivedTasks();
  saveBoardToStorage();
}

function saveBoard() {
  const board = document.getElementById("task-board");
  const boardDataToSave = {
    title: boardData.title,
    description: boardData.description,
    style: boardData.style,
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

    boardDataToSave.columns.push(columnData);
  });

  const dataStr = JSON.stringify(boardDataToSave, null, 2);
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
      const loadedData = JSON.parse(e.target.result);

      boardData = {
        title: loadedData.title || "Task Board",
        description: loadedData.description || "",
        style: {
          background: loadedData.style?.background || "#f1f2f4",
          textColor: loadedData.style?.textColor || "#172b4d",
          columnColor: loadedData.style?.columnColor || "#ffffff",
          headerColor: loadedData.style?.headerColor || "#ffffff",
          tasksColor: loadedData.style?.tasksColor || "#f8f9fa",
        },
      };

      setCookie("taskBoardStyle", boardData.style);

      const board = document.getElementById("task-board");
      board.innerHTML = "";

      users = loadedData.users || [];
      groups = loadedData.groups || [];
      archivedTasks = loadedData.archivedTasks || [];

      loadedData.columns.forEach((columnData) => {
        const column = createColumn(columnData.name, columnData.id, columnData.color);
        const tasksContainer = column.querySelector(".tasks");

        column.style.backgroundColor = boardData.style.columnColor;
        column.querySelector(".column-header").style.backgroundColor = boardData.style.columnColor;
        tasksContainer.style.backgroundColor = boardData.style.tasksColor || boardData.style.columnColor;

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

      updateBoardHeader();
      updateBoardStyle();

      updateBoardColorPicker("boardBackgroundColor", boardData.style.background);
      updateBoardColorPicker("boardTextColor", boardData.style.textColor);
      updateBoardColorPicker("boardColumnColor", boardData.style.columnColor);

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

function openBoardSettings() {
  const modal = document.getElementById("boardSettingsModal");
  const titleInput = document.getElementById("boardTitleInput");
  const descInput = document.getElementById("boardDescriptionInput");
  const titleCounter = document.getElementById("boardTitleInputCount");
  const descCounter = document.getElementById("boardDescriptionInputCount");
  const paletteSelect = document.getElementById("colorPaletteSelect");

  titleInput.value = boardData.title;
  descInput.value = boardData.description;

  updateBoardColorPicker("boardBackgroundColor", boardData.style.background);
  updateBoardColorPicker("boardTextColor", boardData.style.textColor);
  updateBoardColorPicker("boardColumnColor", boardData.style.columnColor);

  titleCounter.textContent = boardData.title.length;
  titleCounter.parentElement.classList.toggle("limit", boardData.title.length >= 96);

  descCounter.textContent = boardData.description.length;
  descCounter.parentElement.classList.toggle("limit", boardData.description.length >= 256);

  paletteSelect.onchange = (e) => {
    const palette = COLOR_PALETTES[e.target.value];
    if (palette) {
      updateBoardColorPicker("boardBackgroundColor", palette.background);
      updateBoardColorPicker("boardTextColor", palette.textColor);
      updateBoardColorPicker("boardColumnColor", palette.columnColor);

      boardData.style.headerColor = palette.headerColor;
      boardData.style.tasksColor = palette.tasksColor;
      boardData.style.textColor = palette.textColor;
    }
  };

  modal.classList.add("active");
}

function updateBoardColorPicker(pickerId, color) {
  const picker = document.getElementById(pickerId);
  if (picker === null) return;

  const container = picker.closest(".color-picker-container");
  if (container) {
    const trigger = container.querySelector(".selected-color");
    if (trigger) {
      trigger.style.backgroundColor = color;
    }
  }
}

function closeBoardSettings() {
  const modal = document.getElementById("boardSettingsModal");
  modal.classList.remove("active");

  modal.querySelectorAll(".form-group").forEach((group) => {
    group.classList.remove("error");
  });

  const titleCounter = document.getElementById("boardTitleInputCount");
  const descCounter = document.getElementById("boardDescriptionInputCount");

  if (titleCounter) titleCounter.textContent = "0";
  if (descCounter) descCounter.textContent = "0";
  if (titleCounter) titleCounter.parentElement.classList.remove("limit");
  if (descCounter) descCounter.parentElement.classList.remove("limit");
}

function saveBoardSettings() {
  const titleInput = document.getElementById("boardTitleInput");
  const title = titleInput.value.trim();

  if (!title) {
    titleInput.closest(".form-group").classList.add("error");
    return;
  }

  if (title.length > 96) {
    alert("Board title cannot exceed 96 characters");
    return;
  }

  const description = document.getElementById("boardDescriptionInput").value.trim();
  if (description.length > 256) {
    alert("Board description cannot exceed 256 characters");
    return;
  }

  boardData.title = title;
  boardData.description = description;
  boardData.style = {
    background: getBoardSelectedColor("boardBackgroundColor") || boardData.style.background,
    textColor: getBoardSelectedColor("boardTextColor") || boardData.style.textColor,
    columnColor: getBoardSelectedColor("boardColumnColor") || boardData.style.columnColor,
    headerColor: boardData.style.headerColor,
    tasksColor: boardData.style.tasksColor,
    textColorSecondary: boardData.style.textColorSecondary,
  };

  const paletteSelect = document.getElementById("colorPaletteSelect");
  if (paletteSelect.value !== "") {
    const palette = COLOR_PALETTES[paletteSelect.value];
    boardData.style.headerColor = palette.headerColor;
    boardData.style.tasksColor = palette.tasksColor;
  }

  setCookie("taskBoardStyle", boardData.style);

  updateBoardHeader();
  updateBoardStyle();
  saveBoardToStorage();
  closeBoardSettings();
}

function getBoardSelectedColor(pickerId) {
  const picker = document.getElementById(pickerId);
  if (picker === null) return null;
  const container = picker.closest(".color-picker-container");
  if (container) {
    const trigger = container.querySelector(".selected-color");
    if (trigger) {
      return trigger.style.backgroundColor;
    }
  }
  return null;
}

function updateBoardHeader() {
  document.getElementById("boardTitle").textContent = boardData.title;
  const descriptionEl = document.getElementById("boardDescription");
  if (boardData.description) {
    descriptionEl.textContent = boardData.description;
    descriptionEl.style.display = "block";
  } else {
    descriptionEl.style.display = "none";
  }
}

function updateBoardStyle() {
  const board = document.getElementById("task-board");
  const boardHeader = document.querySelector(".board-header");
  const columns = document.querySelectorAll(".column");
  const boardContainer = document.querySelector(".task-board-root");
  const manageBoardBtn = document.querySelectorAll(".manage-board-btn");

  const modals = document.querySelectorAll(".modal-content");
  const modalHeaders = document.querySelectorAll(".modal-header");
  const modalBodies = document.querySelectorAll(".modal-body");
  const dialogues = document.querySelectorAll(".dialogue-content");
  const modalFooters = document.querySelectorAll(".modal-footer");
  const taskTitles = document.querySelectorAll(".task-title");

  board.style.background = boardData.style.background;
  board.style.color = boardData.style.textColor;
  board.style.borderColor = boardData.style.textColor;
  board.style.textColor = boardData.style.textColor;
  board.style.textColorSecondary = boardData.style.textColorSecondary;
  boardHeader.style.background = boardData.style.headerColor || boardData.style.columnColor;
  boardHeader.style.color = boardData.style.textColor;

  ["h1", "h2", "h3", "h4", "h5", "h6"].forEach((tag) => {
    boardContainer.querySelectorAll(tag).forEach((el) => {
      el.style.color = boardData.style.textColor;
    });
  });

  manageBoardBtn.forEach((btn) => {
    btn.style.background = boardData.style.columnColor;
    btn.style.color = boardData.style.textColor;
  });

  columns.forEach((column) => {
    column.style.background = boardData.style.columnColor;
    const header = column.querySelector(".column-header");
    const tasksContainer = column.querySelector(".tasks");

    if (header) {
      header.style.background = boardData.style.columnColor;
    }
    if (tasksContainer) {
      tasksContainer.style.background = boardData.style.tasksColor || boardData.style.columnColor;
    }
    column.style.borderColor = boardData.style.columnColor;
    column.style.borderStyle = "solid";
    column.style.borderWidth = "2px";
  });

  modals.forEach((modal) => {
    modal.style.background = boardData.style.columnColor;
    modal.style.color = boardData.style.textColor;
  });

  modalHeaders.forEach((header) => {
    ["h1", "h2", "h3", "h4", "h5", "h6"].forEach((tag) => {
      header.querySelectorAll(tag).forEach((el) => {
        el.style.color = boardData.style.textColor;
      });
    });
    header.style.background = boardData.style.headerColor || boardData.style.columnColor;
    header.style.color = boardData.style.textColor;
    header.style.borderColor = boardData.style.textColor;
  });

  modalBodies.forEach((body) => {
    body.style.background = boardData.style.tasksColor || boardData.style.columnColor;
  });

  modalFooters.forEach((footer) => {
    footer.style.background = boardData.style.columnColor;
  });

  dialogues.forEach((dialogue) => {
    dialogue.style.background = boardData.style.columnColor;
    dialogue.style.color = boardData.style.textColor;
  });

  document.querySelectorAll(".form-group label, .modal input, .modal textarea, .modal select").forEach((el) => {
    el.style.color = boardData.style.textColor;
  });

  document.querySelectorAll(".modal input, .modal textarea, .modal select").forEach((el) => {
    el.style.background = boardData.style.background;
  });

  document.querySelectorAll(".modal-content").forEach((el) => {
    el.style.borderColor = boardData.style.textColor + "50";
    el.style.borderStyle = "solid";
    el.style.borderWidth = "2px";
  });

  taskTitles.forEach((title) => {
    title.style.color = "black";
  });
}

function toggleBoardColors(trigger) {
  document.querySelectorAll(".color-picker-container .color-picker").forEach((picker) => {
    if (picker !== trigger.nextElementSibling) {
      picker.classList.remove("active");
    }
  });

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

function resetBoard() {
  const dialogue = document.getElementById("resetOptionsDialogue");
  dialogue.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = true));
  dialogue.classList.add("active");
}

function closeResetOptions() {
  document.getElementById("resetOptionsDialogue").classList.remove("active");
}

function confirmReset() {
  const resetTasks = document.getElementById("resetTasks").checked;
  const resetColumns = document.getElementById("resetColumns").checked;
  const resetUsers = document.getElementById("resetUsers").checked;
  const resetGroups = document.getElementById("resetGroups").checked;
  const resetSettings = document.getElementById("resetSettings").checked;

  if (!(resetTasks || resetColumns || resetUsers || resetGroups || resetSettings)) {
    alert("Please select at least one option to reset.");
    return;
  }

  showDialogue(
    "Confirm Reset",
    "Are you sure you want to reset the selected items? This action cannot be undone.",
    "Reset",
    () => {
      if (resetSettings) {
        document.cookie = "taskBoardStyle=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
        boardData = {
          title: "Task Board",
          description: "",
          style: {
            background: "#f1f2f4",
            textColor: "#172b4d",
            columnColor: "#ffffff",
            headerColor: "#ffffff",
            tasksColor: "#f8f9fa",
          },
        };
      }

      if (resetUsers) {
        users = [...defaultUsers];
      }

      if (resetGroups) {
        groups = [...defaultGroups];
      }

      if (resetTasks) {
        archivedTasks = [];
        document.querySelectorAll(".task").forEach((task) => task.remove());
      }

      if (resetColumns) {
        const board = document.getElementById("task-board");
        board.innerHTML = "";
        defaultColumns.forEach((colData) => {
          const column = createColumn(colData.name, colData.id, colData.color);
          board.appendChild(column);
        });
      }

      if (resetSettings) {
        updateBoardHeader();
        updateBoardStyle();
        updateBoardColorPicker("boardBackgroundColor", boardData.style.background);
        updateBoardColorPicker("boardTextColor", boardData.style.textColor);
        updateBoardColorPicker("boardColumnColor", boardData.style.columnColor);

        const paletteSelect = document.getElementById("colorPaletteSelect");
        if (paletteSelect) {
          paletteSelect.value = "";
        }
      }

      if (resetUsers || resetGroups) {
        renderUsers();
        renderGroups();
      }

      saveBoardToStorage();
      closeResetOptions();
      closeBoardSettings();
    },
    true
  );
}
