const container = document.getElementById("container");
const addBoxButton = document.getElementById("addBoxButton");
let boxCount = 3;

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

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.style.position = "absolute";
svg.style.width = "100%";
svg.style.height = "100%";
svg.style.top = "0";
svg.style.left = "0";
container.appendChild(svg);

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

function createBox(x, y, label) {
  const uuid = generateUUID();
  const box = document.createElement("div");
  box.classList.add("linkedBox");
  box.style.left = `${x}px`;
  box.style.top = `${y}px`;
  box.textContent = label;

  box.dataset.uuid = uuid;
  boxData[uuid] = { uuid, label, element: box, color: "#007bff" };

  let isDragging = false;

  box.addEventListener("mousedown", (e) => {
    if (e.button === 2) return;
    isDragging = true;
    box.style.cursor = "grabbing";

    const offsetX = e.clientX - box.offsetLeft;
    const offsetY = e.clientY - box.offsetTop;

    const onMouseMove = (e) => {
      if (isDragging) {
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

  box.addEventListener("click", () => {
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

  const removeOption = document.createElement("div");
  removeOption.classList.add("remove-option");

  const trashIcon = document.createElement("span");
  trashIcon.innerHTML = "🗑️";
  trashIcon.alt = "Remove Box";
  removeOption.appendChild(trashIcon);

  removeOption.addEventListener("click", () => {
    removeBox(uuid);
    document.body.removeChild(menu);
  });

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

function removeBox(uuid) {
  const box = boxData[uuid].element;

  lines.forEach((line, index) => {
    if (line.uuid1 === uuid || line.uuid2 === uuid) {
      line.line.remove();
      line.uuid1 = "";
      line.uuid2 = "";
    }
  });
  box.remove();
  delete boxData[uuid];

  updateConnectionsSummary();
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
  svg.appendChild(line);

  lines.push({ line, uuid1, uuid2 });
  updateLines();
  updateConnectionsSummary();
}

function updateLines() {
  lines.forEach(({ line, uuid1, uuid2 }) => {
    const box1 = boxData[uuid1]?.element;
    const box2 = boxData[uuid2]?.element;

    if (!box1 || !box2) {
      line.remove();
      return;
    }

    const box1Rect = box1.getBoundingClientRect();
    const box2Rect = box2.getBoundingClientRect();

    const x1 = box1Rect.left + box1Rect.width / 2;
    const y1 = box1Rect.top + box1Rect.height / 2;

    const x2 = box2Rect.left + box2Rect.width / 2;
    const y2 = box2Rect.top + box2Rect.height / 2;

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
  });
}

addBoxButton.addEventListener("click", () => {
  const randomX = Math.random() * (window.innerWidth - 100);
  const randomY = Math.random() * (window.innerHeight - 50);
  boxCount++;
  createBox(randomX, randomY, `Box ${boxCount}`);
});

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

let isDraggingPanel = false;
let panelOffsetX, panelOffsetY;

summaryPanel.addEventListener("mousedown", (e) => {
  isDraggingPanel = true;
  summaryPanel.classList.add("dragging");

  panelOffsetX = e.clientX - summaryPanel.offsetLeft;
  panelOffsetY = e.clientY - summaryPanel.offsetTop;

  const onMouseMove = (e) => {
    if (isDraggingPanel) {
      const newX = e.clientX - panelOffsetX;
      const newY = e.clientY - panelOffsetY;

      summaryPanel.style.left = `${newX}px`;
      summaryPanel.style.top = `${newY}px`;
    }
  };

  const onMouseUp = () => {
    isDraggingPanel = false;
    summaryPanel.classList.remove("dragging");
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

  sortedLinesByFirstName.forEach(({ uuid1, uuid2 }) => {
    const label1 = boxData[uuid1]?.label;
    const label2 = boxData[uuid2]?.label;
    const color1 = boxData[uuid1]?.color;
    const color2 = boxData[uuid2]?.color;

    if (!label1 || !label2) return;

    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <span style="color: ${color1}">${label1}</span> ↔ 
      <span style="color: ${color2}">${label2}</span>
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

createBox(300, 400, "Box 1");
createBox(300, 200, "Box 2");
createBox(500, 100, "Box 3");
