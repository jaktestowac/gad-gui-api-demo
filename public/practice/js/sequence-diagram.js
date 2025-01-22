const canvas = document.getElementById("diagramCanvas");
const ctx = canvas.getContext("2d");
const participants = [];
const messages = [];
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
const blocks = [];
let resizingBlock = null; // Add this line
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

function initCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}

class Participant {
  constructor(name, x) {
    this.name = name;
    this.x = x;
    this.y = 50;
    this.editing = false;
    this.highlighted = false;
    this.selectable = false;
    this.selectionStart = 0;
    this.selectionEnd = 0;
  }

  draw() {
    if (this.selectable) {
      ctx.strokeStyle = "#4CAF50";
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.strokeRect(this.x - 51, this.y - 1, 102, 32);
    }

    ctx.fillStyle = this.highlighted ? "#4CAF50" : "#000";
    ctx.fillRect(this.x - 50, this.y, 100, 30);

    if (this.editing) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(this.x - 48, this.y + 2, 96, 26);

      if (this.selectionStart !== this.selectionEnd) {
        const text = this.name || "";
        const beforeSelection = text.substring(0, this.selectionStart);
        const selection = text.substring(this.selectionStart, this.selectionEnd);

        const startX = this.x - 48 + ctx.measureText(beforeSelection).width;
        const selectionWidth = ctx.measureText(selection).width;

        ctx.fillStyle = "rgba(0, 120, 215, 0.4)";
        ctx.fillRect(startX, this.y + 2, selectionWidth, 26);
      }

      else if (cursorVisible) {
        const text = this.name || "";
        const beforeCursor = text.substring(0, this.selectionStart);
        const cursorX = this.x - 48 + 5 + ctx.measureText(beforeCursor).width;
        ctx.fillStyle = "#000";
        ctx.fillRect(cursorX, this.y + 4, 2, 22);
      }

      ctx.fillStyle = "#000";
      ctx.textAlign = "left";
      ctx.fillText(this.name, this.x - 48 + 5, this.y + 20);
    }

    ctx.fillStyle = this.editing ? "#000" : "#fff";
    ctx.textAlign = "center";
    ctx.fillText(this.name, this.x, this.y + 20);

    ctx.strokeStyle = "#000";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + 30);
    ctx.lineTo(this.x, canvas.height - 50);
    ctx.stroke();
  }
}

class Activation {
  constructor(participant, startY) {
    this.participant = participant;
    this.startY = startY;
    this.endY = startY + 50;
  }

  draw() {
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.participant.x - 5, this.startY, 10, this.endY - this.startY);
  }
}

class Message {
  constructor(from, to, text) {
    this.from = from;
    this.to = to;
    this.text = text;
    this.y = 100;
    this.editing = false;
    this.hovered = false;
    this.activation = new Activation(to, this.y);
    this.isReturn = text.toLowerCase().includes("return"); // Add return message detection
    this.selectionStart = 0;
    this.selectionEnd = 0;
  }

  draw() {
    ctx.lineWidth = this.hovered ? 2 : 1;
    ctx.strokeStyle = this.hovered ? "#4CAF50" : "#000";

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(this.from.x, this.y);
    ctx.lineTo(this.to.x, this.y);
    ctx.stroke();

    ctx.beginPath();
    const arrowSize = 10;
    const angle = Math.atan2(0, this.to.x - this.from.x);
    ctx.moveTo(this.to.x, this.y);
    ctx.lineTo(
      this.to.x - arrowSize * Math.cos(angle - Math.PI / 6),
      this.y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(this.to.x, this.y);
    ctx.lineTo(
      this.to.x - arrowSize * Math.cos(angle + Math.PI / 6),
      this.y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();

    if (this.editing) {
      ctx.fillStyle = "#ffffff";
      const textWidth = ctx.measureText(this.text).width;
      ctx.fillRect((this.from.x + this.to.x) / 2 - textWidth / 2 - 4, this.y - 20, textWidth + 8, 20);

      if (this.selectionStart !== this.selectionEnd) {
        const text = this.text || "";
        const beforeSelection = text.substring(0, this.selectionStart);
        const selection = text.substring(this.selectionStart, this.selectionEnd);

        const startX = (this.from.x + this.to.x) / 2 - textWidth / 2 + ctx.measureText(beforeSelection).width;
        const selectionWidth = ctx.measureText(selection).width;

        ctx.fillStyle = "rgba(0, 120, 215, 0.4)";
        ctx.fillRect(startX, this.y - 20, selectionWidth, 20);
      }

      else if (cursorVisible) {
        const text = this.text || "";
        const beforeCursor = text.substring(0, this.selectionStart);
        const cursorX = (this.from.x + this.to.x) / 2 - textWidth / 2 + ctx.measureText(beforeCursor).width;
        ctx.fillStyle = "#000";
        ctx.fillRect(cursorX, this.y - 18, 2, 16);
      }
    }
    ctx.fillStyle = this.hovered ? "#4CAF50" : "#000";
    ctx.textAlign = "center";
    ctx.fillText(this.text, (this.from.x + this.to.x) / 2, this.y - 10);

    this.activation.startY = this.y;
    if (this.isReturn) {
      const startMessage = messages.find((m) => m.to === this.from && m.y < this.y && !m.isReturn);
      if (startMessage) {
        startMessage.activation.endY = this.y;
      }
    } else {
      this.activation.endY = this.y + 40;
    }
    this.activation.draw();
  }
}

class Block {
  constructor(type, y, height = 100) {
    this.type = type; // 'alt', 'loop', or 'opt'
    this.y = y;
    this.height = height;
    this.condition = type === "loop" ? "Loop [n times]" : type === "alt" ? "[condition]" : "[optional]";
    this.dragging = false;
    this.editing = false;
    this.x = 50; // Add default x position
    this.width = canvas.width - 100; // Add width property
    this.headerWidth = 60; // Add fixed width for header
    this.padding = 10; // Add padding constant
    this.selectionStart = 0;
    this.selectionEnd = 0;
  }

  draw() {
    ctx.fillStyle = "rgba(240, 240, 240, 0.5)";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = "#666";
    ctx.fillRect(this.x, this.y, this.headerWidth, 20);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(this.type.toUpperCase(), this.x + this.headerWidth / 2, this.y + 14);

    if (this.editing) {
      ctx.fillStyle = "#ffffff";
      const textWidth = ctx.measureText(this.condition).width;
      ctx.fillRect(this.x + this.headerWidth + 5, this.y + 2, textWidth + 10, 16);

      if (this.selectionStart !== this.selectionEnd) {
        const text = this.condition || "";
        const beforeSelection = text.substring(0, this.selectionStart);
        const selection = text.substring(this.selectionStart, this.selectionEnd);

        const startX = this.x + this.headerWidth + 5 + ctx.measureText(beforeSelection).width;
        const selectionWidth = ctx.measureText(selection).width;

        ctx.fillStyle = "rgba(0, 120, 215, 0.4)";
        ctx.fillRect(startX, this.y + 2, selectionWidth, 16);
      }

      else if (cursorVisible) {
        const text = this.condition || "";
        const beforeCursor = text.substring(0, this.selectionStart);
        const cursorX = this.x + this.headerWidth + 5 + ctx.measureText(beforeCursor).width;
        ctx.fillStyle = "#000";
        ctx.fillRect(cursorX, this.y + 4, 2, 12);
      }
    }
    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    ctx.fillText(this.condition, this.x + this.headerWidth + 5, this.y + 14);

    ctx.fillStyle = "#666";
    ctx.fillRect(this.x + this.width - 10, this.y + this.height - 10, 10, 10);

    ctx.fillStyle = "#666";
    ctx.fillRect(this.x + this.headerWidth, this.y, this.width - this.headerWidth - this.padding, 4);

    ctx.fillRect(this.x, this.y + this.height / 2 - 5, 4, 10);
    ctx.fillRect(this.x + this.width - 4, this.y + this.height / 2 - 5, 4, 10);
  }

  isInDragHandle(x, y) {
    return x >= this.x + this.headerWidth && x <= this.x + this.width - this.padding && y >= this.y && y <= this.y + 5;
  }

  isInConditionArea(x, y) {
    return (
      x >= this.x + this.headerWidth + 5 && x <= this.x + this.width - this.padding && y >= this.y && y <= this.y + 20
    );
  }

  isInLeftResizeHandle(x, y) {
    return x >= this.x && x <= this.x + 4 && y >= this.y + this.height / 2 - 5 && y <= this.y + this.height / 2 + 5;
  }

  isInRightResizeHandle(x, y) {
    return (
      x >= this.x + this.width - 4 &&
      x <= this.x + this.width &&
      y >= this.y + this.height / 2 - 5 &&
      y <= this.y + this.height / 2 + 5
    );
  }
}

document.getElementById("addParticipant").addEventListener("click", () => {
  const x = 100 + participants.length * 150;
  const defaultName = `Participant${participantCounter++}`;
  participants.push(new Participant(defaultName, x));
  redraw();
});

document.getElementById("addMessage").addEventListener("click", () => {
  if (participants.length < 2) {
    alert("Need at least 2 participants to add a message");
    return;
  }

  creatingMessage = true;
  messageFrom = null;
  canvas.style.cursor = "crosshair";
  participants.forEach((p) => (p.selectable = true));
  redraw();
});

document.getElementById("clear").addEventListener("click", () => {
  participants.length = 0;
  messages.length = 0;
  creatingMessage = false;
  messageFrom = null;
  canvas.style.cursor = "default";
  participants.forEach((p) => (p.selectable = false));
  blocks.length = 0;
  redraw();
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  e.stopPropagation(); // Stop event from bubbling up

  if (draggingParticipant) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
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
  const x = contextMenuPosition.x - canvas.getBoundingClientRect().left;
  const defaultName = `Participant${participantCounter++}`;
  participants.push(new Participant(defaultName, x));
  redraw();
  contextMenu.style.display = "none";
});

document.getElementById("contextAddMessage").addEventListener("click", () => {
  if (participants.length < 2) {
    alert("Need at least 2 participants to add a message");
    return;
  }

  creatingMessage = true;
  messageFrom = null;
  canvas.style.cursor = "crosshair";
  participants.forEach((p) => (p.selectable = true));
  redraw();
  contextMenu.style.display = "none";
});

["Alt", "Loop", "Opt"].forEach((type) => {
  document.getElementById(`add${type}Block`).addEventListener("click", () => {
    const y = 100 + messages.length * 50;
    createBlock(type.toLowerCase(), y);
  });

  document.getElementById(`contextAdd${type}Block`).addEventListener("click", () => {
    createBlock(type.toLowerCase(), contextMenuPosition.y - canvas.getBoundingClientRect().top);
    contextMenu.style.display = "none";
  });
});

canvas.addEventListener("dblclick", (e) => {
  if (draggingParticipant || draggingBlock || resizingBlock) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  participants.forEach((p) => (p.editing = false));
  messages.forEach((m) => (m.editing = false));
  blocks.forEach((b) => (b.editing = false));

  const block = blocks.find((b) => b.isInConditionArea(x, y));
  if (block) {
    block.editing = true;
    block.selectionStart = block.condition.length;  // Set cursor at the end
    block.selectionEnd = block.condition.length;
    redraw();
    startCursorBlink();
    return;
  }

  const participant = participants.find((p) => x >= p.x - 50 && x <= p.x + 50 && y >= p.y && y <= p.y + 30);
  if (participant) {
    participant.editing = true;
    participant.selectionStart = participant.name.length;  // Set cursor at the end
    participant.selectionEnd = participant.name.length;
    redraw();
    startCursorBlink();
    return;
  }

  const message = getMessageAtPosition(x, y);
  if (message) {
    message.editing = true;
    message.selectionStart = message.text.length;  // Set cursor at the end
    message.selectionEnd = message.text.length;
    redraw();
    startCursorBlink();
  }
});

document.addEventListener("keydown", (e) => {
  const editingElement =
    participants.find((p) => p.editing) || messages.find((m) => m.editing) || blocks.find((b) => b.editing);

  if (!editingElement) return;

  startCursorBlink(); // Reset blink on key press

  if (e.ctrlKey && e.key === "a") {
    e.preventDefault();
    const text = editingElement.name || editingElement.text || editingElement.condition || "";
    editingElement.selectionStart = 0;
    editingElement.selectionEnd = text.length;
    redraw();
    return;
  }

  const text = editingElement.name || editingElement.text || editingElement.condition || "";
  let newText = text;
  let newCursorPos = editingElement.selectionStart;

  if (e.key === "Enter" || e.key === "Escape") {
    e.preventDefault();
    editingElement.editing = false;
    redraw();
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
    redraw();
  }
});

document.getElementById("toggleDirection").addEventListener("click", () => {
  if (selectedMessage) {
    const temp = selectedMessage.from;
    selectedMessage.from = selectedMessage.to;
    selectedMessage.to = temp;
    redraw();
  }
  messageContextMenu.style.display = "none";
});

document.getElementById("removeMessage").addEventListener("click", () => {
  if (selectedMessage) {
    const index = messages.indexOf(selectedMessage);
    if (index > -1) {
      messages.splice(index, 1);
      redraw();
    }
  }
  messageContextMenu.style.display = "none";
});

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const block = blocks.find((b) => b.isInDragHandle(x, y));
  if (block) {
    draggingBlock = block;
    dragStartY = y - block.y;
    canvas.style.cursor = "ns-resize";
    return;
  }

  const participant = participants.find((p) => x >= p.x - 50 && x <= p.x + 50 && y >= p.y && y <= p.y + 30);

  if (participant) {
    draggingParticipant = participant;
    dragStartX = x - participant.x;
    canvas.style.cursor = "ew-resize";
    return;
  }

  const resizeBlock = blocks.find(
    (b) => x >= canvas.width - 60 && x <= canvas.width - 50 && y >= b.y + b.height - 10 && y <= b.y + b.height
  );

  if (resizeBlock) {
    resizingBlock = resizeBlock;
    canvas.style.cursor = "ns-resize";
  }

  for (const block of blocks) {
    if (block.isInLeftResizeHandle(x, y)) {
      resizingBlockHorizontal = block;
      resizingLeft = true;
      canvas.style.cursor = "ew-resize";
      return;
    }
    if (block.isInRightResizeHandle(x, y)) {
      resizingBlockHorizontal = block;
      resizingLeft = false;
      canvas.style.cursor = "ew-resize";
      return;
    }
  }

  const editingElement =
    participants.find((p) => p.editing) || messages.find((m) => m.editing) || blocks.find((b) => b.editing);

  if (editingElement) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isSelecting = true;
    selectionStartX = x;

    const text = editingElement.name || editingElement.text || editingElement.condition || "";
    editingElement.selectionStart = getCharacterIndexFromX(text, x, editingElement);
    editingElement.selectionEnd = editingElement.selectionStart;
    redraw();
  }
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (draggingBlock) {
    draggingBlock.y = Math.max(50, y - dragStartY);
    redraw();
    return;
  }

  if (draggingParticipant) {
    draggingParticipant.x = x - dragStartX;
    draggingParticipant.x = Math.max(50, Math.min(canvas.width - 50, draggingParticipant.x));
    redraw();
    return;
  }

  if (resizingBlock) {
    resizingBlock.height = Math.max(50, y - resizingBlock.y);
    redraw();
    return;
  }

  if (resizingBlockHorizontal) {
    if (resizingLeft) {
      const newX = Math.max(0, Math.min(x, resizingBlockHorizontal.x + resizingBlockHorizontal.width - 150)); // Increase minimum width
      const deltaX = newX - resizingBlockHorizontal.x;
      resizingBlockHorizontal.x = newX;
      resizingBlockHorizontal.width -= deltaX;
    } else {
      resizingBlockHorizontal.width = Math.max(150, x - resizingBlockHorizontal.x); // Increase minimum width
    }
    redraw();
    return;
  }

  messages.forEach((m) => (m.hovered = false));

  const blockDrag = blocks.find((b) => b.isInDragHandle(x, y));
  if (blockDrag) {
    canvas.style.cursor = "move";
    return;
  }

  const blockResize = blocks.find(
    (b) => x >= canvas.width - 60 && x <= canvas.width - 50 && y >= b.y + b.height - 10 && y <= b.y + b.height
  );
  if (blockResize) {
    canvas.style.cursor = "ns-resize";
    return;
  }

  const blockWithHandle = blocks.find((b) => b.isInLeftResizeHandle(x, y) || b.isInRightResizeHandle(x, y));
  if (blockWithHandle) {
    canvas.style.cursor = "ew-resize";
    return;
  }

  const participant = participants.find((p) => x >= p.x - 50 && x <= p.x + 50 && y >= p.y && y <= p.y + 30);
  if (participant) {
    canvas.style.cursor = creatingMessage ? "crosshair" : "move";
    return;
  }

  const message = getMessageAtPosition(x, y);
  if (message) {
    message.hovered = true;
    canvas.style.cursor = "pointer";
  } else {
    canvas.style.cursor = "default";
  }

  redraw();

  if (isSelecting) {
    const editingElement =
      participants.find((p) => p.editing) || messages.find((m) => m.editing) || blocks.find((b) => b.editing);

    if (editingElement) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;

      const text = editingElement.name || editingElement.text || editingElement.condition || "";
      editingElement.selectionEnd = getCharacterIndexFromX(text, x, editingElement);
      redraw();
    }
  }
});

canvas.addEventListener("mouseup", () => {
  if (draggingParticipant) {
    draggingParticipant = null;
    canvas.style.cursor = "default";
  }

  if (resizingBlock) {
    resizingBlock = null;
    canvas.style.cursor = "default";
  }

  if (draggingBlock) {
    draggingBlock = null;
    canvas.style.cursor = "default";
  }

  if (resizingBlockHorizontal) {
    resizingBlockHorizontal = null;
    canvas.style.cursor = "default";
  }

  isSelecting = false;
});

canvas.addEventListener("click", (e) => {
  if (!creatingMessage) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clickedParticipant = participants.find((p) => x >= p.x - 50 && x <= p.x + 50 && y >= p.y && y <= p.y + 30);

  if (clickedParticipant) {
    if (!messageFrom) {
      messageFrom = clickedParticipant;
      clickedParticipant.highlighted = true;
    } else if (messageFrom !== clickedParticipant) {
      const message = new Message(messageFrom, clickedParticipant, `Message${messageCounter++}`);
      if (contextMenuPosition.y) {
        message.y = contextMenuPosition.y - rect.top;
        contextMenuPosition.y = 0; // Reset the position
      }
      messages.push(message);

      messageFrom.highlighted = false;
      creatingMessage = false;
      messageFrom = null;
      canvas.style.cursor = "default";
      participants.forEach((p) => (p.selectable = false));
    }
    redraw();
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
  redraw();
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  blocks.sort((a, b) => a.y - b.y);
  blocks.forEach((b) => b.draw());

  participants.forEach((p) => {
    ctx.strokeStyle = "#000";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 30);
    ctx.lineTo(p.x, canvas.height - 50);
    ctx.stroke();
  });

  messages.forEach((m, i) => {
    m.y = 100 + i * 50;
  });

  messages.forEach((m) => {
    if (!m.isReturn) {
      const returnMessage = messages.find(
        (msg) => msg.isReturn && msg.from === m.to && msg.to === m.from && msg.y > m.y
      );
      if (returnMessage) {
        m.activation.endY = returnMessage.y;
      } else {
        m.activation.endY = m.y + 40;
      }
    }
  });

  messages.forEach((m) => m.draw());

  participants.forEach((p) => {
    ctx.fillStyle = p.highlighted ? "#4CAF50" : "#000";
    ctx.fillRect(p.x - 50, p.y, 100, 30);

    if (p.editing) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.x - 48, p.y + 2, 96, 26);
      ctx.fillStyle = "#000";
      ctx.fillRect(p.x + ctx.measureText(p.name).width / 2, p.y + 5, 2, 20);
    }

    ctx.fillStyle = p.editing ? "#000" : "#fff";
    ctx.textAlign = "center";
    ctx.fillText(p.name, p.x, p.y + 20);

    if (p.selectable) {
      ctx.strokeStyle = "#4CAF50";
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.strokeRect(p.x - 51, p.y - 1, 102, 32);
    }
  });
}

window.addEventListener("load", initCanvas);
window.addEventListener("resize", () => {
  initCanvas();
  redraw();
});

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

function serializeDiagram() {
  return {
    participants: participants.map((p) => ({
      name: p.name,
      x: p.x,
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

  redraw();
}

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
  loadFile.value = ""; // Reset file input
});

let isSelecting = false;
let selectionStartX = 0;

canvas.addEventListener("mousedown", (e) => {
  const editingElement =
    participants.find((p) => p.editing) || messages.find((m) => m.editing) || blocks.find((b) => b.editing);

  if (editingElement) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isSelecting = true;
    selectionStartX = x;

    const text = editingElement.name || editingElement.text || editingElement.condition || "";
    editingElement.selectionStart = getCharacterIndexFromX(text, x, editingElement);
    editingElement.selectionEnd = editingElement.selectionStart;
    redraw();
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isSelecting) {
    const editingElement =
      participants.find((p) => p.editing) || messages.find((m) => m.editing) || blocks.find((b) => b.editing);

    if (editingElement) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;

      const text = editingElement.name || editingElement.text || editingElement.condition || "";
      editingElement.selectionEnd = getCharacterIndexFromX(text, x, editingElement);
      redraw();
    }
  }
});

canvas.addEventListener("mouseup", () => {
  isSelecting = false;
});

function getCharacterIndexFromX(text, x, element) {
  let baseX;
  let textX;

  if (element instanceof Participant) {
    baseX = element.x - 48 + 5;
  } else if (element instanceof Message) {
    baseX = (element.from.x + element.to.x) / 2;
  } else {
    baseX = element.x + element.headerWidth + 5;
  }

  if (element instanceof Message) {
    const fullWidth = ctx.measureText(text).width;
    textX = x - (baseX - fullWidth / 2);
  } else {
    textX = x - baseX;
  }

  let totalWidth = 0;
  for (let i = 0; i <= text.length; i++) {
    const charWidth = ctx.measureText(text.charAt(i)).width;
    if (totalWidth + charWidth / 2 > textX) {
      return i;
    }
    totalWidth += charWidth;
  }

  return text.length;
}

function startCursorBlink() {
  if (cursorBlinkInterval) clearInterval(cursorBlinkInterval);
  cursorVisible = true;
  cursorBlinkInterval = setInterval(() => {
    cursorVisible = !cursorVisible;
    redraw();
  }, 530);  
}

function stopCursorBlink() {
  if (cursorBlinkInterval) {
    clearInterval(cursorBlinkInterval);
    cursorBlinkInterval = null;
  }
  cursorVisible = true;
  redraw();
}

function endEditing() {
  participants.forEach((p) => (p.editing = false));
  messages.forEach((m) => (m.editing = false));
  blocks.forEach((b) => (b.editing = false));
  stopCursorBlink();
  redraw();
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
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
      canvas.style.cursor = "default";
      participants.forEach((p) => (p.selectable = false));
    }
    redraw();
  }
});
