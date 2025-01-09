const container = document.getElementById("container");
let boxCount = 0;

const colors = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#17a2b8", "#fd7e14", "#6c757d", "#343a40"];
const darkColors = {
  "#007bff": "#0056b3",
  "#28a745": "#1e7e34",
  "#ffc107": "#d39e00",
  "#dc3545": "#a71d2a",
  "#6f42c1": "#4b288f",
  "#17a2b8": "#0f6674",
  "#fd7e14": "#c25e0f",
  "#6610f2": "#4b0bcb",
  "#6c757d": "#495057",
  "#343a40": "#1d2124",
};

const shapeSizes = {
  rectangle: { width: 100, height: 50 },
  circle: { width: 100, height: 100 },
  box: { width: 50, height: 50 },
};

const lineStyles = {
  solid: { style: "solid", label: "Solid", strokeDasharray: "none" },
  dashed: { style: "dashed", label: "Dashed", strokeDasharray: "5,5" },
  dotted: { style: "dotted", label: "Dotted", strokeDasharray: "1,1" },
};

const defaultName = "Object";

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.style.position = "absolute";
svg.style.width = "100%";
svg.style.height = "100%";
svg.style.top = "0";
svg.style.left = "0";
container.appendChild(svg);

const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
const markerEnd = document.createElementNS("http://www.w3.org/2000/svg", "marker");
markerEnd.setAttribute("id", "arrow-end");
markerEnd.setAttribute("markerWidth", "10");
markerEnd.setAttribute("markerHeight", "10");
markerEnd.setAttribute("refX", "9");
markerEnd.setAttribute("refY", "5");
markerEnd.setAttribute("orient", "auto");
markerEnd.setAttribute("markerUnits", "strokeWidth");

const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
path.setAttribute("fill", "black");

markerEnd.appendChild(path);
defs.appendChild(markerEnd);
svg.appendChild(defs);

const markerStart = document.createElementNS("http://www.w3.org/2000/svg", "marker");
markerStart.setAttribute("id", "arrow-start");
markerStart.setAttribute("markerWidth", "10");
markerStart.setAttribute("markerHeight", "10");
markerStart.setAttribute("refX", "0");
markerStart.setAttribute("refY", "5");
markerStart.setAttribute("orient", "auto");
markerStart.setAttribute("markerUnits", "strokeWidth");

const startPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
startPath.setAttribute("d", "M 10 0 L 0 5 L 10 10 z");
startPath.setAttribute("fill", "black");

markerStart.appendChild(startPath);
defs.appendChild(markerStart);

const lines = [];
let selectedBox = null;
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const boxData = {};

function createBox(x, y, boxOptions) {
  const label = boxOptions.label;
  let uuid = boxOptions.uuid;
  const shape = boxOptions.shape || "rectangle";
  const color = boxOptions.color || "#007bff";
  const locked = boxOptions.locked || false;

  if (uuid === null || uuid === undefined) {
    uuid = generateUUID();
  }

  boxCount += 1;
  const box = document.createElement("div");
  box.classList.add("linkedShape");

  if (shape === "rectangle") {
    box.style.width = shapeSizes.rectangle.width + "px";
    box.style.height = shapeSizes.rectangle.height + "px";
    box.style.borderRadius = "5px";
  } else if (shape === "box") {
    box.style.width = shapeSizes.box.width + "px";
    box.style.height = shapeSizes.box.height + "px";
    box.style.borderRadius = "5px";
    box.style.display = "flex";
    box.style.alignItems = "center";
    box.style.justifyContent = "center";
  } else if (shape === "circle") {
    box.style.borderRadius = "50%";
    box.style.width = shapeSizes.circle.width + "px";
    box.style.height = shapeSizes.circle.height + "px";
    box.style.display = "flex";
    box.style.alignItems = "center";
    box.style.justifyContent = "center";
  } else {
    console.error("Invalid shape type", shape);
  }

  box.style.left = `${x}px`;
  box.style.top = `${y}px`;
  box.textContent = label;
  box.style.background = color;

  box.dataset.uuid = uuid;
  boxData[uuid] = { uuid, label, element: box, color, shape, locked };

  let isDragging = false;
  let hasMoved = false;

  box.addEventListener("mousedown", (e) => {
    if (e.button === 2 || boxData[uuid].locked) return;
    isDragging = true;
    hasMoved = false;
    box.style.cursor = "grabbing";

    const offsetX = e.clientX - box.offsetLeft;
    const offsetY = e.clientY - box.offsetTop;

    const onMouseMove = (e) => {
      if (isDragging) {
        hasMoved = true;
        const newX = e.clientX - offsetX;
        const newY = e.clientY - offsetY;
        box.style.left = `${newX}px`;
        box.style.top = `${newY}px`;

        updateLines();
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      box.style.cursor = "grab";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  box.addEventListener("dblclick", () => {
    if (boxData[uuid].locked) return;
    const currentLabel = boxData[uuid].label;

    const input = document.createElement("input");
    input.type = "text";
    input.value = currentLabel;
    input.style.width = "90%";
    input.style.textAlign = "center";
    input.maxLength = 20;

    box.textContent = "";
    box.appendChild(input);

    input.focus();

    input.addEventListener("blur", () => {
      const newLabel = input.value.trim() || currentLabel;
      boxData[uuid].label = newLabel;
      box.textContent = newLabel;
      updateConnectionsSummary();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
    });
  });

  box.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openColorMenu(e.clientX, e.clientY, uuid);
  });

  box.addEventListener("click", (e) => {
    if (hasMoved) {
      hasMoved = false;
      return;
    }

    const icon = box.querySelector(".selected-icon");
    if (selectedBox === null) {
      selectedBox = box;
      box.style.background = darkColors[boxData[uuid].color];
      addIcon(box, "🔗");
    } else if (selectedBox !== box) {
      const selectedIcon = selectedBox.querySelector(".selected-icon");
      if (selectedIcon) selectedIcon.remove();

      createLine(selectedBox.dataset.uuid, box.dataset.uuid);
      selectedBox.style.background = boxData[selectedBox.dataset.uuid].color;
      selectedBox = null;
    } else {
      box.style.background = boxData[uuid].color;
      if (icon) icon.remove();
      selectedBox = null;
    }
  });

  container.appendChild(box);
  return box;
}

function addIcon(box, icon) {
  const existingIcon = box.querySelector(".selected-icon");
  if (existingIcon) existingIcon.remove();

  const selectionIcon = document.createElement("span");
  selectionIcon.classList.add("selected-icon");
  selectionIcon.innerHTML = icon;
  selectionIcon.style.color = "white";
  selectionIcon.style.fontSize = "20px";
  selectionIcon.style.position = "absolute";
  selectionIcon.style.top = "5px";
  selectionIcon.style.right = "5px";

  box.appendChild(selectionIcon);
}

function openColorMenu(x, y, uuid) {
  const existingMenu = document.getElementById("colorMenu");
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement("div");
  menu.id = "colorMenu";

  colors.forEach((color) => {
    const colorOption = document.createElement("div");
    colorOption.style.background = color;

    colorOption.addEventListener("click", () => {
      const box = boxData[uuid].element;
      box.style.background = color;
      boxData[uuid].color = color;
      document.body.removeChild(menu);
      updateConnectionsSummary();
    });

    menu.appendChild(colorOption);
  });

  const lockOption = document.createElement("div");
  lockOption.classList.add("lock-option");

  const isLocked = boxData[uuid].locked;
  const lockIcon = document.createElement("span");
  lockIcon.innerHTML = isLocked ? "🔓" : "🔒";
  lockIcon.alt = isLocked ? "Unlock Box" : "Lock Box";
  lockOption.appendChild(lockIcon);

  // const lockText = document.createElement("span");
  // lockText.innerHTML = ` ${isLocked ? "Unlock" : "Lock"}`;
  // lockOption.appendChild(lockText);

  lockOption.addEventListener("click", () => {
    boxData[uuid].locked = !boxData[uuid].locked;
    const box = boxData[uuid].element;
    updateBoxLockIndicator(box, uuid);
    document.body.removeChild(menu);
  });

  const removeOption = document.createElement("div");
  removeOption.classList.add("remove-option");

  const trashIcon = document.createElement("span");
  trashIcon.innerHTML = "🗑️";
  trashIcon.alt = "Remove Box";
  removeOption.appendChild(trashIcon);

  removeOption.addEventListener("click", () => {
    if (!boxData[uuid].locked) {
      removeBox(uuid);
      document.body.removeChild(menu);
    }
  });

  menu.appendChild(lockOption);
  menu.appendChild(removeOption);

  document.body.appendChild(menu);

  const menuRect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (menuRect.right > viewportWidth) {
    menu.style.left = `${x - menuRect.width}px`;
  } else {
    menu.style.left = `${x}px`;
  }

  if (menuRect.bottom > viewportHeight) {
    menu.style.top = `${y - menuRect.height}px`;
  } else {
    menu.style.top = `${y}px`;
  }

  document.addEventListener(
    "click",
    (e) => {
      if (e.target !== menu && !menu.contains(e.target)) {
        menu.remove();
      }
    },
    { once: true }
  );
}

function updateBoxLockIndicator(box, uuid) {
  const existingLockIcon = box.querySelector(".lock-indicator");
  if (existingLockIcon) {
    existingLockIcon.remove();
  }

  if (boxData[uuid].locked) {
    const lockIcon = document.createElement("span");
    lockIcon.classList.add("lock-indicator");
    lockIcon.innerHTML = "🔒";
    lockIcon.style.position = "absolute";
    lockIcon.style.top = "5px";
    lockIcon.style.left = "5px";
    lockIcon.style.fontSize = "12px";
    lockIcon.style.opacity = "0.7";
    box.appendChild(lockIcon);
  }
}

function createLineRemoveIcon() {
  const removeIcon = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

  circle.setAttribute("r", "8");
  circle.setAttribute("fill", "#dc3545");

  text.textContent = "×";
  text.setAttribute("fill", "white");
  text.setAttribute("font-size", "12");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.style.cursor = "pointer";

  removeIcon.appendChild(circle);
  removeIcon.appendChild(text);
  return removeIcon;
}

function isPointNearLine(x, y, x1, y1, x2, y2, threshold = 5) {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance <= threshold;
}

function createLine(uuid1, uuid2) {
  if (
    lines.some(
      (line) => (line.uuid1 === uuid1 && line.uuid2 === uuid2) || (line.uuid1 === uuid2 && line.uuid2 === uuid1)
    )
  ) {
    return;
  }

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.classList.add("line");
  line.setAttribute("marker-end", "url(#arrow-end)");

  line.style.strokeWidth = "2";
  line.style.stroke = "black";

  const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "line");
  hitArea.style.stroke = "transparent";
  hitArea.style.strokeWidth = "15";
  hitArea.classList.add("line-hit-area");

  const removeIcon = createLineRemoveIcon();
  const lineData = { line, hitArea, uuid1, uuid2, removeIcon, direction: "forward", lineStyle: "solid" };

  line.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showLineMenu(e.clientX, e.clientY, lineData);
  });

  hitArea.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showLineMenu(e.clientX, e.clientY, lineData);
  });

  removeIcon.style.cursor = "pointer";

  removeIcon.addEventListener("click", () => {
    line.remove();
    hitArea.remove();
    removeIcon.remove();
    lines.splice(
      lines.findIndex((l) => l.line === line),
      1
    );
    updateConnectionsSummary();
  });

  svg.appendChild(hitArea);
  svg.appendChild(line);
  svg.appendChild(removeIcon);

  lines.push(lineData);
  updateLines();
  updateConnectionsSummary();
}

function updateLines() {
  lines.forEach(({ line, hitArea, uuid1, uuid2, removeIcon, direction, lineStyle }) => {
    const box1 = boxData[uuid1]?.element;
    const box2 = boxData[uuid2]?.element;

    if (!box1 || !box2) {
      line.remove();
      hitArea?.remove();
      removeIcon?.remove();
      return;
    }

    const box1Rect = box1.getBoundingClientRect();
    const box2Rect = box2.getBoundingClientRect();

    const x1 = box1Rect.left + box1Rect.width / 2;
    const y1 = box1Rect.top + box1Rect.height / 2;
    const x2 = box2Rect.left + box2Rect.width / 2;
    const y2 = box2Rect.top + box2Rect.height / 2;

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const boxPaddingY1 = shapeSizes[boxData[uuid1].shape].height / 2;
    const boxPaddingX1 = shapeSizes[boxData[uuid1].shape].width / 2;
    const boxPaddingY2 = shapeSizes[boxData[uuid2].shape].height / 2;
    const boxPaddingX2 = shapeSizes[boxData[uuid2].shape].width / 2;

    const endX1 = x1 + Math.cos(angle) * boxPaddingX1;
    const endY1 = y1 + Math.sin(angle) * boxPaddingY1;
    const endX2 = x2 - Math.cos(angle) * boxPaddingX2;
    const endY2 = y2 - Math.sin(angle) * boxPaddingY2;

    if (direction === "forward") {
      line.setAttribute("x1", endX1);
      line.setAttribute("y1", endY1);
      line.setAttribute("x2", endX2);
      line.setAttribute("y2", endY2);
      hitArea.setAttribute("x1", endX1);
      hitArea.setAttribute("y1", endY1);
      hitArea.setAttribute("x2", endX2);
      hitArea.setAttribute("y2", endY2);
    } else {
      line.setAttribute("x1", endX2);
      line.setAttribute("y1", endY2);
      line.setAttribute("x2", endX1);
      line.setAttribute("y2", endY1);
      hitArea.setAttribute("x1", endX2);
      hitArea.setAttribute("y1", endY2);
      hitArea.setAttribute("x2", endX1);
      hitArea.setAttribute("y2", endY1);
    }

    if (direction === "bidirectional") {
      line.setAttribute("marker-start", "url(#arrow-start)");
      line.setAttribute("marker-end", "url(#arrow-end)");
    } else {
      line.setAttribute("marker-start", "none");
      line.setAttribute("marker-end", "url(#arrow-end)");
    }

    line.style.strokeDasharray = lineStyles[lineStyle].strokeDasharray;

    const midX = (endX1 + endX2) / 2;
    const midY = (endY1 + endY2) / 2;
    removeIcon.setAttribute("transform", `translate(${midX}, ${midY})`);
  });
}

function showLineMenu(x, y, lineData) {
  const existingMenu = document.getElementById("lineMenu");
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement("div");
  menu.id = "lineMenu";
  menu.style.position = "absolute";
  menu.style.background = "white";
  menu.style.border = "1px solid #ccc";
  menu.style.borderRadius = "5px";
  menu.style.padding = "5px";
  menu.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  menu.style.zIndex = "1000";

  const toggleDirectionOption = document.createElement("div");
  toggleDirectionOption.innerHTML = `<i class="fa-solid fa-arrow-right-arrow-left"></i> &nbsp;Change Direction`;
  toggleDirectionOption.style.padding = "8px 12px";
  toggleDirectionOption.style.cursor = "pointer";
  toggleDirectionOption.style.fontSize = "14px";

  const removeLineOption = document.createElement("div");
  removeLineOption.innerHTML = `<i class="fa-solid fa-trash"></i> &nbsp;Remove Line`;
  removeLineOption.style.padding = "8px 12px";
  removeLineOption.style.cursor = "pointer";
  removeLineOption.style.fontSize = "14px";
  removeLineOption.style.color = "#dc3545";

  const toggleBidirectionalOption = document.createElement("div");
  toggleBidirectionalOption.innerHTML = `<i class="fa-solid fa-arrows-left-right"></i> &nbsp;Toggle Bidirectional`;
  toggleBidirectionalOption.style.padding = "8px 12px";
  toggleBidirectionalOption.style.cursor = "pointer";
  toggleBidirectionalOption.style.fontSize = "14px";

  const lineStyleOption = document.createElement("div");
  lineStyleOption.innerHTML = `<i class="fa-solid fa-ruler"></i> &nbsp;Line Style&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▸`;
  lineStyleOption.style.padding = "8px 12px";
  lineStyleOption.style.cursor = "pointer";
  lineStyleOption.style.fontSize = "14px";
  lineStyleOption.style.position = "relative";

  const lineStyleSubMenu = document.createElement("div");
  lineStyleSubMenu.style.position = "absolute";
  lineStyleSubMenu.style.left = "100%";
  lineStyleSubMenu.style.top = "0";
  lineStyleSubMenu.style.background = "white";
  lineStyleSubMenu.style.border = "1px solid #ccc";
  lineStyleSubMenu.style.borderRadius = "5px";
  lineStyleSubMenu.style.padding = "5px";
  lineStyleSubMenu.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  lineStyleSubMenu.style.display = "none";

  Object.entries(lineStyles).forEach(([style, { label }]) => {
    const styleOption = document.createElement("div");
    styleOption.textContent = label;
    styleOption.style.padding = "8px 12px";
    styleOption.style.cursor = "pointer";
    styleOption.style.fontSize = "14px";

    styleOption.addEventListener("mouseover", () => {
      styleOption.style.background = "#f0f0f0";
    });

    styleOption.addEventListener("mouseout", () => {
      styleOption.style.background = "white";
    });

    styleOption.addEventListener("click", () => {
      lineData.lineStyle = style;
      updateLines();
      menu.remove();
    });

    lineStyleSubMenu.appendChild(styleOption);
  });

  lineStyleOption.appendChild(lineStyleSubMenu);

  lineStyleOption.addEventListener("mouseover", () => {
    lineStyleOption.style.background = "#f0f0f0";
    lineStyleSubMenu.style.display = "block";
  });

  lineStyleOption.addEventListener("mouseout", (e) => {
    if (!lineStyleOption.contains(e.relatedTarget)) {
      lineStyleOption.style.background = "white";
      lineStyleSubMenu.style.display = "none";
    }
  });

  [toggleDirectionOption, removeLineOption, toggleBidirectionalOption, lineStyleOption].forEach((option) => {
    option.addEventListener("mouseover", () => {
      if (option !== lineStyleOption) {
        lineStyleSubMenu.style.display = "none";
      }
      option.style.background = "#f0f0f0";
    });

    option.addEventListener("mouseout", () => {
      option.style.background = "white";
    });
  });

  removeLineOption.addEventListener("click", () => {
    lineData.line.remove();
    lineData.hitArea.remove();
    lineData.removeIcon.remove();
    lines.splice(
      lines.findIndex((l) => l.line === lineData.line),
      1
    );
    updateConnectionsSummary();
    menu.remove();
  });

  toggleDirectionOption.addEventListener("click", () => {
    lineData.direction = lineData.direction === "forward" ? "backward" : "forward";
    updateLines();
    updateConnectionsSummary();
    menu.remove();
  });

  toggleBidirectionalOption.addEventListener("click", () => {
    if (lineData.direction === "bidirectional") {
      lineData.direction = "forward";
    } else {
      lineData.direction = "bidirectional";
    }
    updateLines();
    updateConnectionsSummary();
    menu.remove();
  });

  menu.appendChild(toggleDirectionOption);
  menu.appendChild(toggleBidirectionalOption);
  menu.appendChild(lineStyleOption);
  menu.appendChild(removeLineOption);
  document.body.appendChild(menu);

  const menuRect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  menu.style.left = `${x + menuRect.width > viewportWidth ? x - menuRect.width : x}px`;
  menu.style.top = `${y + menuRect.height > viewportHeight ? y - menuRect.height : y}px`;

  document.addEventListener(
    "click",
    (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
      }
    },
    { once: true }
  );
}

const instructions = document.querySelector(".instructions");

let isDraggingInstructions = false;
let offsetX, offsetY;

instructions.addEventListener("mousedown", (e) => {
  isDraggingInstructions = true;
  instructions.classList.add("dragging");
  offsetX = e.clientX - instructions.offsetLeft;
  offsetY = e.clientY - instructions.offsetTop;

  const onMouseMove = (e) => {
    if (isDraggingInstructions) {
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;

      instructions.style.left = `${newX}px`;
      instructions.style.top = `${newY}px`;
    }
  };

  const onMouseUp = () => {
    isDraggingInstructions = false;
    instructions.classList.remove("dragging");
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});

const summaryPanel = document.querySelector(".summary-panel");
const connectionsList = document.getElementById("connectionsList");
const resizeHandle = document.querySelector(".resize-handle");

let isDraggingPanel = false;
let isResizing = false;
let panelOffsetX, panelOffsetY;
let initialWidth, initialHeight, initialX, initialY;

resizeHandle.addEventListener("mousedown", (e) => {
  e.stopPropagation();
  isResizing = true;
  initialWidth = summaryPanel.offsetWidth;
  initialHeight = summaryPanel.offsetHeight;
  initialX = e.clientX;
  initialY = e.clientY;

  const onMouseMove = (e) => {
    if (!isResizing) return;

    const deltaX = e.clientX - initialX;
    const deltaY = e.clientY - initialY;

    const newWidth = Math.max(150, initialWidth + deltaX);
    const newHeight = Math.max(100, initialHeight + deltaY);

    summaryPanel.style.width = `${newWidth}px`;
    summaryPanel.style.height = `${newHeight}px`;
  };

  const onMouseUp = () => {
    isResizing = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});

function updateConnectionsSummary() {
  connectionsList.innerHTML = "";

  const sortedLinesByFirstName = lines.slice().sort((a, b) => {
    const label1 = boxData[a.uuid1]?.label;
    const label2 = boxData[a.uuid2]?.label;
    return label1?.localeCompare(label2);
  });

  sortedLinesByFirstName.forEach(({ uuid1, uuid2, direction }) => {
    const label1 = boxData[uuid1]?.label;
    const label2 = boxData[uuid2]?.label;
    const color1 = boxData[uuid1]?.color;
    const color2 = boxData[uuid2]?.color;

    if (!label1 || !label2) return;

    const arrow =
      direction === "forward" ? "→" : direction === "backward" ? "←" : direction === "bidirectional" ? "↔" : "→";
    const [firstLabel, firstColor, secondLabel, secondColor] =
      direction === "forward" ? [label1, color1, label2, color2] : [label2, color2, label1, color1];

    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <span style="color: ${firstColor}">${firstLabel}</span><span style="font-size:12px;">${arrow}</span>
      <span style="color: ${secondColor}">${secondLabel}</span>
    `;
    connectionsList.appendChild(listItem);
  });
}

const resetBoxesButton = document.getElementById("resetBoxesButton");

resetBoxesButton.addEventListener("click", () => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  Object.values(boxData).forEach((boxInfo, index) => {
    const box = boxInfo.element;
    const boxRect = box.getBoundingClientRect();

    let newX = box.offsetLeft;
    let newY = box.offsetTop;

    if (boxRect.right > viewportWidth) {
      newX = viewportWidth - boxRect.width - 80;
    }
    if (boxRect.bottom > viewportHeight - 50) {
      newY = viewportHeight - boxRect.height - 80;
    }
    if (boxRect.left < 0) {
      newX = 80;
    }
    if (boxRect.top < 30) {
      newY = 80;
    }

    box.style.left = `${newX}px`;
    box.style.top = `${newY}px`;
  });

  updateLines();
});

function exportToJson() {
  const exportData = {
    boxes: Object.values(boxData).map(({ uuid, label, color, element, shape, locked }) => ({
      uuid,
      label,
      color,
      shape,
      locked,
      position: {
        x: parseInt(element.style.left),
        y: parseInt(element.style.top),
      },
    })),
    connections: lines.map(({ uuid1, uuid2, direction, lineStyle }) => ({
      from: uuid1,
      to: uuid2,
      direction: direction,
      lineStyle: lineStyle || "solid",
    })),
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "boxes-layout.json";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

function clearAll() {
  Object.keys(boxData).forEach((uuid) => {
    removeBox(uuid, false);
  });
  updateConnectionsSummary();
}

function removeBox(uuid, updateLines = true) {
  if (boxData[uuid].locked) return;

  const box = boxData[uuid].element;

  lines.forEach((line, index) => {
    if (line.uuid1 === uuid || line.uuid2 === uuid) {
      line.line.remove();
      line.hitArea.remove();
      line.uuid1 = "";
      line.uuid2 = "";
      line.removeIcon.remove();
    }
  });
  box.remove();
  boxData[uuid].element = null;
  delete boxData[uuid];
  boxCount -= 1;

  if (updateLines) updateConnectionsSummary();
}

function importFromJson() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        clearAll();

        data.boxes.forEach(({ uuid, label, color, position, shape, locked }) => {
          const box = createBox(position.x, position.y, { label, uuid, shape, locked });
          box.style.background = color;
          boxData[uuid] = {
            uuid,
            label,
            color,
            shape,
            locked,
            element: box,
          };
          box.dataset.uuid = uuid;
          updateBoxLockIndicator(box, uuid);
        });

        data.connections.forEach(({ from, to, direction, lineStyle }) => {
          createLine(from, to);
          const line = lines[lines.length - 1];
          line.direction = direction || "forward";
          line.lineStyle = lineStyle || "solid";
          updateLines();
        });

        updateConnectionsSummary();
      } catch (err) {
        console.error("Error importing file:", err);
        displaySimpleAlert("Error importing file. Please check if the file format is correct.", 2);
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

container.addEventListener("contextmenu", (e) => {
  if (e.target === container || e.target === svg) {
    e.preventDefault();
    showCanvasMenu(e.clientX, e.clientY);
  }
});

function showCanvasMenu(x, y) {
  const existingMenu = document.getElementById("canvasMenu");
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement("div");
  menu.id = "canvasMenu";
  menu.style.position = "absolute";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.background = "white";
  menu.style.border = "1px solid #ccc";
  menu.style.borderRadius = "5px";
  menu.style.padding = "5px";
  menu.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  menu.style.zIndex = "1000";

  const addRectangleOption = document.createElement("div");
  addRectangleOption.innerHTML = `<i class="fa-regular fa-square"></i> &nbsp;Add Rectangle`;
  addRectangleOption.style.padding = "8px 12px";
  addRectangleOption.style.cursor = "pointer";
  addRectangleOption.style.fontSize = "14px";

  const addCircleOption = document.createElement("div");
  addCircleOption.innerHTML = `<i class="fa-regular fa-circle"></i> &nbsp;Add Circle`;
  addCircleOption.style.padding = "8px 12px";
  addCircleOption.style.cursor = "pointer";
  addCircleOption.style.fontSize = "14px";

  const addBoxOption = document.createElement("div");
  addBoxOption.innerHTML = `<i class="fa-regular fa-square"></i> &nbsp;Add Box`;
  addBoxOption.style.padding = "8px 12px";
  addBoxOption.style.cursor = "pointer";
  addBoxOption.style.fontSize = "14px";

  [addRectangleOption, addCircleOption, addBoxOption].forEach((option) => {
    option.addEventListener("mouseover", () => {
      option.style.background = "#f0f0f0";
    });

    option.addEventListener("mouseout", () => {
      option.style.background = "white";
    });
  });

  addRectangleOption.addEventListener("click", () => {
    boxCount++;
    createBox(x, y, { label: `${defaultName} ${boxCount}`, uuid: null, shape: "rectangle" });
    menu.remove();
  });

  addCircleOption.addEventListener("click", () => {
    boxCount++;
    createBox(x, y, { label: `${defaultName} ${boxCount}`, uuid: null, shape: "circle" });
    menu.remove();
  });

  addBoxOption.addEventListener("click", () => {
    boxCount++;
    createBox(x, y, { label: `${defaultName} ${boxCount}`, uuid: null, shape: "box" });
    menu.remove();
  });

  menu.appendChild(addRectangleOption);
  menu.appendChild(addBoxOption);
  menu.appendChild(addCircleOption);

  document.body.appendChild(menu);

  const menuRect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (menuRect.right > viewportWidth) {
    menu.style.left = `${x - menuRect.width}px`;
  } else {
    menu.style.left = `${x}px`;
  }

  if (menuRect.bottom > viewportHeight) {
    menu.style.top = `${y - menuRect.height}px`;
  } else {
    menu.style.top = `${y}px`;
  }

  document.addEventListener(
    "click",
    (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
      }
    },
    { once: true }
  );
}

createBox(300, 400, { label: `${defaultName} 1`, uuid: null, shape: "rectangle", color: "#28a745" });
createBox(300, 200, { label: `${defaultName} 2`, uuid: null, shape: "rectangle" });
createBox(500, 100, { label: `${defaultName} 3`, uuid: null, shape: "circle" });
