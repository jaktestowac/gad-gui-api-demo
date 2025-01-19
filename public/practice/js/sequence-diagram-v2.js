const diagram = document.getElementById("diagram");
const participantsContainer = document.getElementById("participants-container");
const messagesContainer = document.getElementById("messages-container");
const blocksContainer = document.getElementById("blocks-container");
const contextMenu = document.getElementById("contextMenu");
const messageContextMenu = document.getElementById("messageContextMenu");
let contextMenuPosition = { x: 0, y: 0 };
let participantCounter = 1;
let messageCounter = 1;
let selectedMessage = null;
let draggingParticipant = null;
let dragStartX = 0;
let hoveredMessage = null;
let creatingMessage = false;
let messageFrom = null;
const participants = [];
const messages = [];
const blocks = [];
let resizingBlock = null;
let draggingBlock = null;
let dragStartY = 0;
let resizingBlockHorizontal = null;
let resizingLeft = false;

let loadFile = document.getElementById("loadFile");
if (!loadFile) {
  loadFile = document.createElement("input");
  loadFile.type = "file";
  loadFile.id = "loadFile";
  loadFile.accept = ".json";
  loadFile.style.display = "none";
  document.body.appendChild(loadFile);
}

let selectedText = "";
let selectionStart = 0;
let selectionEnd = 0;

let cursorVisible = true;
let cursorBlinkInterval = null;

let selectedElement = null;

class Participant {
  constructor(name, x) {
    this.element = document.createElement("div");
    this.element.className = "participant";
    this.element.style.left = `${x}px`;
    this.x = x;

    this.nameElement = document.createElement("div");
    this.nameElement.className = "participant-name";
    this.nameElement.textContent = name;
    this.element.appendChild(this.nameElement);

    this.lifeline = document.createElement("div");
    this.lifeline.className = "participant-lifeline";
    this.lifeline.style.left = `${x + 50}px`;

    participantsContainer.appendChild(this.element);
    diagram.appendChild(this.lifeline);

    this.setupDragHandling();
    this.setupEditing();
  }

  setupDragHandling() {
    this.element.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("editing-input")) return;
      const startX = e.clientX - parseInt(this.element.style.left);

      const mousemove = (e) => {
        const x = Math.max(0, e.clientX - startX);
        this.element.style.left = `${x}px`;
        this.lifeline.style.left = `${x + 50}px`;
        updateConnectedMessages(this);
      };

      const mouseup = () => {
        document.removeEventListener("mousemove", mousemove);
        document.removeEventListener("mouseup", mouseup);
      };

      document.addEventListener("mousemove", mousemove);
      document.addEventListener("mouseup", mouseup);
    });
  }

  setupEditing() {
    this.nameElement.addEventListener("dblclick", () => {
      const input = document.createElement("input");
      input.className = "editing-input";
      input.value = this.nameElement.textContent;
      this.nameElement.textContent = "";
      this.nameElement.appendChild(input);
      input.focus();

      const finishEditing = () => {
        const newName = input.value.trim();
        if (newName) this.nameElement.textContent = newName;
        this.element.classList.remove("editing");
      };

      input.addEventListener("blur", finishEditing);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          finishEditing();
          e.preventDefault();
        }
      });
    });
  }

  updatePosition() {
    const x = parseInt(this.element.style.left);
    this.lifeline.style.left = `${x + 50}px`;

    messages.forEach((message) => {
      if (message.from === this || message.to === this) {
        message.updatePosition();
      }
    });
  }
}

class Message {
  constructor(from, to, text) {
    this.element = document.createElement("div");
    this.element.className = "message";

    this.line = document.createElement("div");
    this.line.className = "message-line";

    this.arrow = document.createElement("div");
    this.arrow.className = "message-arrow";

    this.textElement = document.createElement("div");
    this.textElement.className = "message-text";
    this.textElement.textContent = text;

    this.element.appendChild(this.line);
    this.element.appendChild(this.arrow);
    this.element.appendChild(this.textElement);

    this.from = from;
    this.to = to;
    this.text = text;
    this.updatePosition();

    this.isSelfMessage = from === to;
    if (this.isSelfMessage) {
      this.element.classList.add("self-message");
      this.line.style.width = "30px";
      this.element.style.marginRight = "20px";
    }

    messagesContainer.appendChild(this.element);

    this.textElement.addEventListener("dblclick", () => {
      this.startEditing();
    });

    this.element.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();

      selectedMessage = this;
      messageContextMenu.style.display = "block";
      messageContextMenu.style.left = e.clientX + "px";
      messageContextMenu.style.top = e.clientY + "px";
      contextMenu.style.display = "none";
    });
  }

  startEditing() {
    const input = document.createElement("input");
    input.className = "editing-input";
    input.value = this.text;
    this.textElement.innerHTML = "";
    this.textElement.appendChild(input);
    input.focus();

    const finishEditing = () => {
      const newText = input.value.trim();
      if (newText) {
        this.text = newText;
        this.textElement.textContent = newText;
      } else {
        this.textElement.textContent = this.text;
      }
    };

    input.addEventListener("blur", finishEditing);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        finishEditing();
        e.preventDefault();
      }
      if (e.key === "Escape") {
        this.textElement.textContent = this.text;
        e.preventDefault();
      }
    });
  }

  toggleDirection() {
    const temp = this.from;
    this.from = this.to;
    this.to = temp;
    this.updatePosition();
  }

  updatePosition() {
    if (this.isSelfMessage) {
      const x = parseInt(this.from.element.style.left) + 50;
      this.element.style.left = `${x}px`;
      return;
    }
    const fromX = parseInt(this.from.element.style.left) + 50;
    const toX = parseInt(this.to.element.style.left) + 50;
    const width = Math.abs(toX - fromX);

    this.element.style.left = `${Math.min(fromX, toX)}px`;
    this.element.style.width = `${width}px`;

    if (fromX < toX) {
      this.element.classList.remove("reverse");
    } else {
      this.element.classList.add("reverse");
    }
  }
}

class Block {
  constructor(type, y, height = 100) {
    this.element = document.createElement("div");
    this.element.className = "block";
    this.element.style.top = `${y}px`;
    this.element.style.height = `${height}px`;

    this.header = document.createElement("div");
    this.header.className = "block-header";

    this.typeLabel = document.createElement("div");
    this.typeLabel.className = "block-type";
    this.typeLabel.textContent = type.toUpperCase();
    this.header.appendChild(this.typeLabel);

    this.conditionElement = document.createElement("div");
    this.conditionElement.className = "block-condition";
    this.conditionElement.textContent =
      type === "loop" ? "Loop [n times]" : type === "alt" ? "[condition]" : "[optional]";
    this.header.appendChild(this.conditionElement);

    this.condition = this.conditionElement.textContent;

    this.resizeHandle = document.createElement("div");
    this.resizeHandle.className = "block-resize";

    this.resizeLeft = document.createElement("div");
    this.resizeLeft.className = "block-resize-horizontal left";

    this.resizeRight = document.createElement("div");
    this.resizeRight.className = "block-resize-horizontal right";

    this.element.appendChild(this.header);
    this.element.appendChild(this.resizeHandle);
    this.element.appendChild(this.resizeLeft);
    this.element.appendChild(this.resizeRight);

    this.element.style.left = "50px";
    this.element.style.width = `${diagram.clientWidth - 100}px`;

    this.x = parseInt(this.element.style.left);
    this.y = y;
    this.width = parseInt(this.element.style.width);
    this.height = height;

    this.element.addEventListener("mousedown", this.handleMouseDown.bind(this));

    blocksContainer.appendChild(this.element);

    this.setupEventHandlers();
  }

  handleMouseDown(e) {
    if (
      e.target.classList.contains("block-resize") ||
      e.target.classList.contains("block-resize-horizontal") ||
      e.target.classList.contains("block-condition")
    ) {
      return;
    }

    const startX = e.clientX - this.element.offsetLeft;
    const startY = e.clientY - this.element.offsetTop;
    this.element.classList.add("dragging");

    const handleMouseMove = (e) => {
      const newX = Math.max(0, e.clientX - startX);
      const newY = Math.max(50, e.clientY - startY);

      this.element.style.left = `${newX}px`;
      this.element.style.top = `${newY}px`;
      this.x = newX;
      this.y = newY;
    };

    const handleMouseUp = () => {
      this.element.classList.remove("dragging");
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  setupEventHandlers() {
    this.header.addEventListener("mousedown", this.startDragging.bind(this));

    this.resizeHandle.addEventListener("mousedown", this.startResizing.bind(this));
    this.resizeLeft.addEventListener("mousedown", (e) => this.startResizingHorizontal(e, true));
    this.resizeRight.addEventListener("mousedown", (e) => this.startResizingHorizontal(e, false));

    this.conditionElement.addEventListener("dblclick", this.startEditing.bind(this));
  }

  startDragging(e) {
    const startY = e.clientY - this.element.offsetTop;
    const moveHandler = (e) => {
      this.element.style.top = `${Math.max(50, e.clientY - startY)}px`;
    };
    const upHandler = () => {
      document.removeEventListener("mousemove", moveHandler);
      document.removeEventListener("mouseup", upHandler);
    };
    document.addEventListener("mousemove", moveHandler);
    document.addEventListener("mouseup", upHandler);
  }

  startResizing(e) {
    e.stopPropagation();
    const startWidth = this.element.offsetWidth;
    const startHeight = this.element.offsetHeight;
    const startX = e.clientX;
    const startY = e.clientY;

    const moveHandler = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newWidth = Math.max(150, startWidth + deltaX);
      const newHeight = Math.max(50, startHeight + deltaY);

      this.element.style.width = `${newWidth}px`;
      this.element.style.height = `${newHeight}px`;
      this.width = newWidth;
      this.height = newHeight;
    };

    const upHandler = () => {
      document.removeEventListener("mousemove", moveHandler);
      document.removeEventListener("mouseup", upHandler);
      this.element.classList.remove("dragging");
    };

    this.element.classList.add("dragging");
    document.addEventListener("mousemove", moveHandler);
    document.addEventListener("mouseup", upHandler);
  }

  startResizingHorizontal(e, isLeft) {
    const startWidth = this.element.offsetWidth;
    const startX = e.clientX;
    const startLeft = this.element.offsetLeft;

    const moveHandler = (e) => {
      if (isLeft) {
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(150, startWidth - deltaX);
        const newLeft = startLeft + startWidth - newWidth;
        this.element.style.left = `${newLeft}px`;
        this.element.style.width = `${newWidth}px`;
      } else {
        const newWidth = Math.max(150, startWidth + e.clientX - startX);
        this.element.style.width = `${newWidth}px`;
      }
    };

    const upHandler = () => {
      document.removeEventListener("mousemove", moveHandler);
      document.removeEventListener("mouseup", upHandler);
    };
    document.addEventListener("mousemove", moveHandler);
    document.addEventListener("mouseup", upHandler);
  }

  startEditing() {
    const input = document.createElement("input");
    input.className = "editing-input";
    input.value = this.condition;
    this.conditionElement.textContent = "";
    this.conditionElement.appendChild(input);
    input.focus();

    const finishEditing = () => {
      const newCondition = input.value.trim();
      if (newCondition) {
        this.condition = newCondition;
        this.conditionElement.textContent = newCondition;
      } else {
        this.conditionElement.textContent = this.condition;
      }
      this.element.classList.remove("editing");
    };

    input.addEventListener("blur", finishEditing);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        finishEditing();
        e.preventDefault();
      }
    });
  }

  updatePosition() {}

  isInDragHandle(x, y) {
    const rect = this.header.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  isInConditionArea(x, y) {
    const rect = this.conditionElement.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  isInLeftResizeHandle(x, y) {
    const rect = this.resizeLeft.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  isInRightResizeHandle(x, y) {
    const rect = this.resizeRight.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }
}

document.getElementById("addMessage").addEventListener("click", () => {
  if (participants.length < 2) {
    alert("Need at least 2 participants to add a message");
    return;
  }

  creatingMessage = true;
  messageFrom = null;
  diagram.style.cursor = "crosshair";
  participants.forEach((p) => (p.selectable = true));
  updateDiagram();
});

document.getElementById("clear").addEventListener("click", () => {
  participants.length = 0;
  messages.length = 0;
  creatingMessage = false;
  messageFrom = null;
  diagram.style.cursor = "default";
  participants.forEach((p) => (p.selectable = false));
  blocks.length = 0;
  updateDiagram();
});

diagram.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (draggingParticipant) {
    return;
  }
  const rect = diagram.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  contextMenuPosition.x = e.clientX;
  contextMenuPosition.y = e.clientY;

  const message = getMessageAtPosition(x, y);
  if (message) {
    selectedMessage = message;
    messageContextMenu.style.display = "block";
    messageContextMenu.style.left = e.clientX + "px";
    messageContextMenu.style.top = e.clientY + "px";
    contextMenu.style.display = "none";
  } else {
    selectedMessage = null;
    contextMenu.style.display = "block";
    contextMenu.style.left = e.clientX + "px";
    contextMenu.style.top = e.clientY + "px";
    messageContextMenu.style.display = "none";
  }
});

document.addEventListener("click", (e) => {
  if (!contextMenu.contains(e.target) && !messageContextMenu.contains(e.target)) {
    contextMenu.style.display = "none";
    messageContextMenu.style.display = "none";
  }
});

document.getElementById("contextAddParticipant").addEventListener("click", () => {
  const x = contextMenuPosition.x - diagram.getBoundingClientRect().left;
  const defaultName = `Participant${participantCounter++}`;
  participants.push(new Participant(defaultName, x));
  updateDiagram();
  contextMenu.style.display = "none";
});

document.getElementById("contextAddMessage").addEventListener("click", () => {
  if (participants.length < 2) {
    alert("Need at least 2 participants to add a message");
    return;
  }

  creatingMessage = true;
  messageFrom = null;
  diagram.style.cursor = "crosshair";
  participants.forEach((p) => (p.selectable = true));
  updateDiagram();
  contextMenu.style.display = "none";
});

diagram.addEventListener("dblclick", (e) => {
  if (draggingParticipant || draggingBlock || resizingBlock) return;

  const rect = diagram.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  participants.forEach((p) => (p.editing = false));
  messages.forEach((m) => (m.editing = false));
  blocks.forEach((b) => (b.editing = false));

  const block = blocks.find((b) => b.isInConditionArea(x, y));
  if (block) {
    block.editing = true;
    block.selectionStart = block.condition.length;
    block.selectionEnd = block.condition.length;
    updateDiagram();
    startCursorBlink();
    return;
  }

  const participant = participants.find((p) => x >= p.x - 50 && x <= p.x + 50 && y >= p.y && y <= p.y + 30);
  if (participant) {
    participant.editing = true;
    participant.selectionStart = participant.name.length;
    participant.selectionEnd = participant.name.length;
    updateDiagram();
    startCursorBlink();
    return;
  }

  const message = getMessageAtPosition(x, y);
  if (message) {
    message.editing = true;
    message.selectionStart = message.text.length;
    message.selectionEnd = message.text.length;
    updateDiagram();
    startCursorBlink();
  }
});

document.addEventListener("keydown", (e) => {
  const editingElement =
    participants.find((p) => p.editing) || messages.find((m) => m.editing) || blocks.find((b) => b.editing);

  if (!editingElement) return;

  startCursorBlink();

  if (e.ctrlKey && e.key === "a") {
    e.preventDefault();
    const text = editingElement.name || editingElement.text || editingElement.condition || "";
    editingElement.selectionStart = 0;
    editingElement.selectionEnd = text.length;
    updateDiagram();
    return;
  }

  const text = editingElement.name || editingElement.text || editingElement.condition || "";
  let newText = text;
  let newCursorPos = editingElement.selectionStart;

  if (e.key === "Enter" || e.key === "Escape") {
    e.preventDefault();
    editingElement.editing = false;
    updateDiagram();
    return;
  }

  if (e.key === "Backspace") {
    e.preventDefault();
    if (editingElement.selectionStart !== editingElement.selectionEnd) {
      newText = text.slice(0, editingElement.selectionStart) + text.slice(editingElement.selectionEnd);
      newCursorPos = editingElement.selectionStart;
    } else if (editingElement.selectionStart > 0) {
      newText = text.slice(0, editingElement.selectionStart - 1) + text.slice(editingElement.selectionStart);
      newCursorPos = editingElement.selectionStart - 1;
    }
  } else if (e.key === "Delete") {
    e.preventDefault();
    if (editingElement.selectionStart !== editingElement.selectionEnd) {
      newText = text.slice(0, editingElement.selectionStart) + text.slice(editingElement.selectionEnd);
      newCursorPos = editingElement.selectionStart;
    } else if (editingElement.selectionStart < text.length) {
      newText = text.slice(0, editingElement.selectionStart) + text.slice(editingElement.selectionStart + 1);
      newCursorPos = editingElement.selectionStart;
    }
  } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    newText = text.slice(0, editingElement.selectionStart) + e.key + text.slice(editingElement.selectionEnd);
    newCursorPos = editingElement.selectionStart + 1;
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    newCursorPos = Math.max(0, editingElement.selectionStart - 1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    newCursorPos = Math.min(text.length, editingElement.selectionStart + 1);
  }

  if (newText !== text || newCursorPos !== editingElement.selectionStart) {
    if ("name" in editingElement) editingElement.name = newText;
    if ("text" in editingElement) editingElement.text = newText;
    if ("condition" in editingElement) editingElement.condition = newText;
    editingElement.selectionStart = newCursorPos;
    editingElement.selectionEnd = newCursorPos;
    updateDiagram();
  }
});

document.getElementById("removeMessage").addEventListener("click", () => {
  if (selectedMessage) {
    const index = messages.indexOf(selectedMessage);
    if (index > -1) {
      messages.splice(index, 1);
      updateDiagram();
    }
  }
  messageContextMenu.style.display = "none";
});

diagram.addEventListener("mousedown", (e) => {
  const rect = diagram.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const block = blocks.find((b) => b.isInDragHandle(x, y));
  if (block) {
    draggingBlock = block;
    dragStartY = y - block.y;
    diagram.style.cursor = "ns-resize";
    return;
  }

  const participant = participants.find((p) => x >= p.x - 50 && x <= p.x + 50 && y >= p.y && y <= p.y + 30);

  if (participant) {
    draggingParticipant = participant;
    dragStartX = x - participant.x;
    diagram.style.cursor = "ew-resize";
    return;
  }

  const resizeBlock = blocks.find(
    (b) => x >= diagram.width - 60 && x <= diagram.width - 50 && y >= b.y + b.height - 10 && y <= b.y + b.height
  );

  if (resizeBlock) {
    resizingBlock = resizeBlock;
    diagram.style.cursor = "ns-resize";
  }

  for (const block of blocks) {
    if (block.isInLeftResizeHandle(x, y)) {
      resizingBlockHorizontal = block;
      resizingLeft = true;
      diagram.style.cursor = "ew-resize";
      return;
    }
    if (block.isInRightResizeHandle(x, y)) {
      resizingBlockHorizontal = block;
      resizingLeft = false;
      diagram.style.cursor = "ew-resize";
      return;
    }
  }

  const editingElement =
    participants.find((p) => p.editing) || messages.find((m) => m.editing) || blocks.find((b) => b.editing);

  if (editingElement) {
    const rect = diagram.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isSelecting = true;
    selectionStartX = x;

    const text = editingElement.name || editingElement.text || editingElement.condition || "";
    editingElement.selectionStart = getCharacterIndexFromX(text, x, editingElement);
    editingElement.selectionEnd = editingElement.selectionStart;
    updateDiagram();
  }
});

diagram.addEventListener("mousemove", (e) => {
  const rect = diagram.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (draggingBlock) {
    draggingBlock.y = Math.max(50, y - dragStartY);
    updateDiagram();
    return;
  }

  if (draggingParticipant) {
    draggingParticipant.x = x - dragStartX;
    draggingParticipant.x = Math.max(50, Math.min(diagram.width - 50, draggingParticipant.x));
    updateDiagram();
    return;
  }

  if (resizingBlock) {
    resizingBlock.height = Math.max(50, y - resizingBlock.y);
    updateDiagram();
    return;
  }

  if (resizingBlockHorizontal) {
    if (resizingLeft) {
      const newX = Math.max(0, Math.min(x, resizingBlockHorizontal.x + resizingBlockHorizontal.width - 150));
      const deltaX = newX - resizingBlockHorizontal.x;
      resizingBlockHorizontal.x = newX;
      resizingBlockHorizontal.width -= deltaX;
    } else {
      resizingBlockHorizontal.width = Math.max(150, x - resizingBlockHorizontal.x);
    }
    updateDiagram();
    return;
  }

  messages.forEach((m) => (m.hovered = false));

  const blockDrag = blocks.find((b) => b.isInDragHandle(x, y));
  if (blockDrag) {
    diagram.style.cursor = "move";
    return;
  }

  const blockResize = blocks.find(
    (b) => x >= diagram.width - 60 && x <= diagram.width - 50 && y >= b.y + b.height - 10 && y <= b.y + b.height
  );
  if (blockResize) {
    diagram.style.cursor = "ns-resize";
    return;
  }

  const blockWithHandle = blocks.find((b) => b.isInLeftResizeHandle(x, y) || b.isInRightResizeHandle(x, y));
  if (blockWithHandle) {
    diagram.style.cursor = "ew-resize";
    return;
  }

  const participant = participants.find((p) => x >= p.x - 50 && x <= p.x + 50 && y >= p.y && y <= p.y + 30);
  if (participant) {
    diagram.style.cursor = creatingMessage ? "crosshair" : "move";
    return;
  }

  const message = getMessageAtPosition(x, y);
  if (message) {
    messages.forEach((m) => m.element.classList.remove("hovered"));
    message.element.classList.add("hovered");
    diagram.style.cursor = "pointer";
  } else {
    messages.forEach((m) => m.element.classList.remove("hovered"));
    if (!creatingMessage && !draggingParticipant) {
      diagram.style.cursor = "default";
    }
  }

  updateDiagram();

  if (isSelecting) {
    const editingElement =
      participants.find((p) => p.editing) || messages.find((m) => m.editing) || blocks.find((b) => b.editing);

    if (editingElement) {
      const rect = diagram.getBoundingClientRect();
      const x = e.clientX - rect.left;

      const text = editingElement.name || editingElement.text || editingElement.condition || "";
      editingElement.selectionEnd = getCharacterIndexFromX(text, x, editingElement);
      updateDiagram();
    }
  }
});

diagram.addEventListener("mouseup", () => {
  if (draggingParticipant) {
    draggingParticipant = null;
    diagram.style.cursor = "default";
  }

  if (resizingBlock) {
    resizingBlock = null;
    diagram.style.cursor = "default";
  }

  if (draggingBlock) {
    draggingBlock = null;
    diagram.style.cursor = "default";
  }

  if (resizingBlockHorizontal) {
    resizingBlockHorizontal = null;
    diagram.style.cursor = "default";
  }

  isSelecting = false;
});

diagram.addEventListener("click", (e) => {
  const rect = diagram.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (creatingMessage) {
    const clickedParticipant = participants.find((p) => {
      const pLeft = parseInt(p.element.style.left);
      return x >= pLeft && x <= pLeft + 100 && y <= 80;
    });

    if (clickedParticipant) {
      if (!messageFrom) {
        messageFrom = clickedParticipant;
        participants.forEach((p) => {
          if (p === clickedParticipant) {
            p.element.classList.add("highlighted");
          }
        });
      } else if (messageFrom !== clickedParticipant || messageFrom === clickedParticipant) {
        const message = new Message(messageFrom, clickedParticipant, `Message${messageCounter++}`);
        messages.push(message);

        participants.forEach((p) => {
          p.element.classList.remove("highlighted", "selectable");
        });
        messageFrom = null;
        creatingMessage = false;
        diagram.style.cursor = "default";

        updateDiagram();
      }
    }
    return;
  }

  if (!creatingMessage) return;

  const clickedParticipant = participants.find((p) => x >= p.x - 50 && x <= p.x + 50 && y >= p.y && y <= p.y + 30);

  if (clickedParticipant) {
    if (!messageFrom) {
      messageFrom = clickedParticipant;
      clickedParticipant.highlighted = true;
    } else if (messageFrom !== clickedParticipant) {
      const message = new Message(messageFrom, clickedParticipant, `Message${messageCounter++}`);
      if (contextMenuPosition.y) {
        message.y = contextMenuPosition.y - rect.top;
        contextMenuPosition.y = 0;
      }
      messages.push(message);

      messageFrom.highlighted = false;
      creatingMessage = false;
      messageFrom = null;
      diagram.style.cursor = "default";
      participants.forEach((p) => (p.selectable = false));
    }
    updateDiagram();
  }
});

function getMessageAtPosition(x, y) {
  return messages.find((m) => {
    const messageY = Math.abs(m.y - y);
    const messageX = x >= Math.min(m.from.x, m.to.x) && x <= Math.max(m.from.x, m.to.x);
    return messageY < 10 && messageX;
  });
}

function createBlock(type, y) {
  const block = new Block(type, y);
  blocks.push(block);
}

function updateDiagram() {
  participants.forEach((p) => p.updatePosition());

  messages.forEach((m, i) => {
    m.element.style.top = `${100 + i * 50}px`;
    m.updatePosition();
  });

  blocks.forEach((b) => b.updatePosition());
}

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

function serializeDiagram() {
  return {
    participants: participants.map((p) => ({
      name: p.nameElement.textContent,
      x: parseInt(p.element.style.left),
    })),
    messages: messages.map((m) => ({
      from: participants.indexOf(m.from),
      to: participants.indexOf(m.to),
      text: m.text,
      y: m.y,
      isReturn: m.isReturn,
    })),
    blocks: blocks.map((b) => ({
      type: b.type,
      y: b.y,
      height: b.height,
      condition: b.condition,
      x: b.x,
      width: b.width,
    })),
  };
}

function deserializeDiagram(data) {
  participants.length = 0;
  messages.length = 0;
  blocks.length = 0;

  data.participants.forEach((p) => {
    participants.push(new Participant(p.name, p.x));
  });

  data.messages.forEach((m) => {
    const message = new Message(participants[m.from], participants[m.to], m.text);
    message.y = m.y;
    message.isReturn = m.isReturn;
    messages.push(message);
  });

  data.blocks.forEach((b) => {
    const block = new Block(b.type, b.y, b.height);
    block.condition = b.condition;
    block.x = b.x;
    block.width = b.width;
    blocks.push(block);
  });

  updateDiagram();
}

loadFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        deserializeDiagram(data);
      } catch (error) {
        console.error("Error loading diagram:", error);
        alert("Error loading diagram file");
      }
    };
    reader.readAsText(file);
  }
  loadFile.value = "";
});

let isSelecting = false;
let selectionStartX = 0;

diagram.addEventListener("mousedown", (e) => {
  const editingElement =
    participants.find((p) => p.editing) || messages.find((m) => m.editing) || blocks.find((b) => b.editing);

  if (editingElement) {
    const rect = diagram.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isSelecting = true;
    selectionStartX = x;

    const text = editingElement.name || editingElement.text || editingElement.condition || "";
    editingElement.selectionStart = getCharacterIndexFromX(text, x, editingElement);
    editingElement.selectionEnd = editingElement.selectionStart;
    updateDiagram();
  }
});

diagram.addEventListener("mousemove", (e) => {
  if (isSelecting) {
    const editingElement =
      participants.find((p) => p.editing) || messages.find((m) => m.editing) || blocks.find((b) => b.editing);

    if (editingElement) {
      const rect = diagram.getBoundingClientRect();
      const x = e.clientX - rect.left;

      const text = editingElement.name || editingElement.text || editingElement.condition || "";
      editingElement.selectionEnd = getCharacterIndexFromX(text, x, editingElement);
      updateDiagram();
    }
  }
});

diagram.addEventListener("mouseup", () => {
  isSelecting = false;
});

function getCharacterIndexFromX(text, x, element) {
  const range = document.createRange();
  const textNode = element.textElement.firstChild;

  for (let i = 0; i <= text.length; i++) {
    range.setStart(textNode, 0);
    range.setEnd(textNode, i);
    const rect = range.getBoundingClientRect();
    if (rect.right >= x) return i;
  }
  return text.length;
}

function startCursorBlink() {
  if (cursorBlinkInterval) clearInterval(cursorBlinkInterval);
  cursorVisible = true;
  cursorBlinkInterval = setInterval(() => {
    cursorVisible = !cursorVisible;
    updateDiagram();
  }, 530);
}

function stopCursorBlink() {
  if (cursorBlinkInterval) {
    clearInterval(cursorBlinkInterval);
    cursorBlinkInterval = null;
  }
  cursorVisible = true;
  updateDiagram();
}

function endEditing() {
  participants.forEach((p) => (p.editing = false));
  messages.forEach((m) => (m.editing = false));
  blocks.forEach((b) => (b.editing = false));
  stopCursorBlink();
  updateDiagram();
}

diagram.addEventListener("click", (e) => {
  const rect = diagram.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clickedElement =
    participants.find((p) => x >= p.x - 50 && x <= p.x + 50 && y >= p.y && y <= p.y + 30) ||
    getMessageAtPosition(x, y) ||
    blocks.find((b) => b.isInConditionArea(x, y));

  if (!clickedElement) {
    endEditing();
  }

  if (!creatingMessage) return;

  const clickedParticipant = participants.find((p) => x >= p.x - 50 && x <= p.x + 50 && y >= p.y && y <= p.y + 30);

  if (clickedParticipant) {
    if (!messageFrom) {
      messageFrom = clickedParticipant;
      clickedParticipant.highlighted = true;
    } else if (messageFrom !== clickedParticipant) {
      const message = new Message(messageFrom, clickedParticipant, `Message${messageCounter++}`);
      if (contextMenuPosition.y) {
        message.y = contextMenuPosition.y - rect.top;
        contextMenuPosition.y = 0;
      }
      messages.push(message);

      messageFrom.highlighted = false;
      creatingMessage = false;
      messageFrom = null;
      diagram.style.cursor = "default";
      participants.forEach((p) => (p.selectable = false));
    }
    updateDiagram();
  }
});

function init() {
  if (window.diagramInitialized) return;
  window.diagramInitialized = true;

  participantsContainer.innerHTML = "";
  messagesContainer.innerHTML = "";
  blocksContainer.innerHTML = "";

  const buttons = ["addParticipant", "addMessage", "clear", "saveButton", "loadButton"];
  buttons.forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.replaceWith(btn.cloneNode(true));
  });

  setupEventListeners();
}

document.removeEventListener("DOMContentLoaded", init);
document.addEventListener("DOMContentLoaded", () => {
  if (!window.diagramInitialized) {
    init();
  }
});

function initDiagram() {
  participantsContainer.innerHTML = "";
  messagesContainer.innerHTML = "";
  blocksContainer.innerHTML = "";
}

window.addEventListener("load", initDiagram);
window.addEventListener("resize", () => {
  updateDiagram();
});

function setupEventListeners() {
  document.getElementById("addParticipant").addEventListener("click", () => {
    const x = 100 + participants.length * 150;
    const defaultName = `Participant${participantCounter++}`;
    participants.push(new Participant(defaultName, x));
    updateDiagram();
  });

  document.getElementById("addMessage").addEventListener("click", () => {
    if (participants.length < 2) {
      alert("Need at least 2 participants to add a message");
      return;
    }
    creatingMessage = true;
    messageFrom = null;
    diagram.style.cursor = "crosshair";

    participants.forEach((p) => {
      p.element.classList.remove("highlighted");
      p.element.classList.add("selectable");
    });

    updateDiagram();
  });

  document.getElementById("clear").addEventListener("click", () => {
    participantsContainer.innerHTML = "";
    messagesContainer.innerHTML = "";
    blocksContainer.innerHTML = "";
    participants.length = 0;
    messages.length = 0;
    blocks.length = 0;
    creatingMessage = false;
    messageFrom = null;
    diagram.style.cursor = "default";
  });

  ["Alt", "Loop", "Opt"].forEach((type) => {
    document.getElementById(`add${type}Block`).addEventListener("click", () => {
      const y = 100 + messages.length * 50;
      createBlock(type.toLowerCase(), y);
    });

    document.getElementById(`contextAdd${type}Block`).addEventListener("click", () => {
      createBlock(type.toLowerCase(), contextMenuPosition.y - diagram.getBoundingClientRect().top);
      contextMenu.style.display = "none";
    });
  });

  document.getElementById("removeMessage").addEventListener("click", () => {
    if (selectedMessage) {
      selectedMessage.element.remove();
      const index = messages.indexOf(selectedMessage);
      if (index > -1) {
        messages.splice(index, 1);
        updateDiagram();
      }
    }
    messageContextMenu.style.display = "none";
  });

  diagram.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggingParticipant) return;

    const rect = diagram.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    contextMenuPosition.x = e.clientX;
    contextMenuPosition.y = e.clientY;

    const message = getMessageAtPosition(x, y);
    if (message) {
      selectedMessage = message;
      messageContextMenu.style.display = "block";
      messageContextMenu.style.left = e.clientX + "px";
      messageContextMenu.style.top = e.clientY + "px";
      contextMenu.style.display = "none";
    } else {
      selectedMessage = null;
      contextMenu.style.display = "block";
      contextMenu.style.left = e.clientX + "px";
      contextMenu.style.top = e.clientY + "px";
      messageContextMenu.style.display = "none";
    }
  });

  document.getElementById("saveButton").addEventListener("click", () => {
    const data = serializeDiagram();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sequence-diagram.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  document.getElementById("loadButton").addEventListener("click", () => {
    loadFile.click();
  });

  document.addEventListener("click", (e) => {
    if (!contextMenu.contains(e.target) && !messageContextMenu.contains(e.target)) {
      contextMenu.style.display = "none";
      messageContextMenu.style.display = "none";
    }
  });

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  const deleteOption = document.getElementById("contextDelete");
  if (deleteOption) {
    deleteOption.addEventListener("click", () => {
      if (selectedElement) {
        deleteElement(selectedElement);
        selectedElement = null;
      }
      contextMenu.style.display = "none";
    });
  }

  diagram.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = diagram.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    selectedElement = null;

    const participant = participants.find((p) => {
      const pLeft = parseInt(p.element.style.left);
      const pWidth = 100;
      const pTop = 50;
      const pHeight = 30;
      return x >= pLeft && x <= pLeft + pWidth && y > pTop && y < pTop + pHeight;
    });
    if (participant) selectedElement = participant;

    const message = getMessageAtPosition(x, y);
    if (message) selectedElement = message;

    const block = blocks.find((b) => {
      const bRect = b.element.getBoundingClientRect();
      return (
        x >= bRect.left - rect.left &&
        x <= bRect.right - rect.left &&
        y >= bRect.top - rect.top &&
        y <= bRect.bottom - rect.top
      );
    });
    if (block) selectedElement = block;

    const deleteOption = document.getElementById("contextDelete");
    if (deleteOption) {
      deleteOption.style.display = selectedElement ? "block" : "none";
    }

    contextMenu.style.display = "block";
    contextMenu.style.left = e.clientX + "px";
    contextMenu.style.top = e.clientY + "px";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Delete" && selectedElement) {
      deleteElement(selectedElement);
      selectedElement = null;
    }
  });

  document.getElementById("toggleMessageDirection").addEventListener("click", () => {
    if (selectedMessage) {
      selectedMessage.toggleDirection();
      updateDiagram();
    }
    messageContextMenu.style.display = "none";
  });

  diagram.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = diagram.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const message = getMessageAtPosition(x, y);
    if (message) {
      selectedMessage = message;
      messageContextMenu.style.display = "block";
      messageContextMenu.style.left = e.clientX + "px";
      messageContextMenu.style.top = e.clientY + "px";
      contextMenu.style.display = "none";
    } else {
      selectedMessage = null;
      contextMenu.style.display = "block";
      contextMenu.style.left = e.clientX + "px";
      contextMenu.style.top = e.clientY + "px";
      messageContextMenu.style.display = "none";
    }
  });
}

function updateConnectedMessages(participant) {
  if (!participant || !participant.element) return;

  const participantX = parseInt(participant.element.style.left);

  messages.forEach((message) => {
    if (message.from === participant || message.to === participant) {
      const fromX = parseInt(message.from.element.style.left) + 50;
      const toX = parseInt(message.to.element.style.left) + 50;
      const width = Math.abs(toX - fromX);

      message.element.style.left = `${Math.min(fromX, toX)}px`;
      message.element.style.width = `${width}px`;

      if (fromX < toX) {
        message.element.classList.remove("reverse");
      } else {
        message.element.classList.add("reverse");
      }
    }
  });
}

function deleteElement(element) {
  if (element instanceof Participant) {
    const connectedMessages = messages.filter((m) => m.from === element || m.to === element);
    connectedMessages.forEach((m) => {
      m.element.remove();
      messages.splice(messages.indexOf(m), 1);
    });
    element.element.remove();
    element.lifeline.remove();
    participants.splice(participants.indexOf(element), 1);
  } else if (element instanceof Message) {
    element.element.remove();
    messages.splice(messages.indexOf(element), 1);
  } else if (element instanceof Block) {
    element.element.remove();
    blocks.splice(blocks.indexOf(element), 1);
  }
  updateDiagram();
}
