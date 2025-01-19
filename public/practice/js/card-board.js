let draggedElement = null;
let offset = { x: 0, y: 0 };

let linkMode = false;
let sourceCard = null;
let connections = [];

let currentZoom = 1;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

document.addEventListener("DOMContentLoaded", function () {
  const defaultColorOption = document.querySelector(".color-option[data-color='#ffeb3b']");
  if (defaultColorOption) {
    defaultColorOption.classList.add("selected");
    document.getElementById("cardColor").value = defaultColorOption.dataset.color;
    document.getElementById("colorBtn").style.backgroundColor = defaultColorOption.dataset.color;
  }

  document.getElementById("linkModeBtn").addEventListener("click", toggleLinkMode);
  updateZoomButtons();
});

document.getElementById("colorBtn").addEventListener("click", function (e) {
  e.stopPropagation();
  document.getElementById("colorPalette").classList.toggle("visible");
});

document.addEventListener("click", function (e) {
  if (!e.target.closest("#colorPalette")) {
    document.getElementById("colorPalette").classList.remove("visible");
  }
});

document.querySelectorAll(".color-menu").forEach((option) => {
  option.addEventListener("click", function (e) {
    const color = this.dataset.color;
    if (color) {
      document.getElementById("cardColor").value = color;
      document.querySelectorAll(".color-menu").forEach((opt) => opt.classList.remove("selected"));
      this.classList.add("selected");
    }
    const selectedColor = document.querySelector(".color-menu.selected");
    if (selectedColor) {
      document.getElementById("colorBtn").style.backgroundColor = selectedColor.dataset.color;
    }
    document.getElementById("colorPalette").classList.remove("visible");
  });
});

function createCardFromContextMenu(shape) {
  const contextMenu = document.getElementById("boardContextMenu");
  const x = parseInt(contextMenu.dataset.clickX);
  const y = parseInt(contextMenu.dataset.clickY);
  createCard(shape, x, y);
}

function createCard(shape, x = 100, y = 100) {
  const board = document.getElementById("board");
  const card = document.createElement("div");
  card.id = "card_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  const header = document.createElement("div");
  const textarea = document.createElement("textarea");
  const color = document.getElementById("cardColor").value;

  card.className = `card ${shape}`;
  card.style.backgroundColor = color;

  header.className = "card-header";
  header.textContent = "Title";
  header.contentEditable = true;

  textarea.className = "card-text";
  textarea.placeholder = "Enter text...";

  card.appendChild(header);
  card.appendChild(textarea);
  board.appendChild(card);

  const boardRect = board.getBoundingClientRect();
  card.style.left = `${(x - boardRect.left) / currentZoom}px`;
  card.style.top = `${(y - boardRect.top) / currentZoom}px`;

  setupDraggable(card);

  if (linkMode) {
    card.classList.add("linkable");
  }
  card.addEventListener("click", handleCardClick);

  return card;
}

function setupDraggable(element) {
  element.addEventListener("mousedown", startDragging);
}

function startDragging(e) {
  if (e.button !== 0) return;
  draggedElement = e.target.closest(".card");
  if (!draggedElement) return;

  const rect = draggedElement.getBoundingClientRect();
  offset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };

  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDragging);
}

function drag(e) {
  if (!draggedElement) return;

  const board = document.getElementById("board");
  const boardRect = board.getBoundingClientRect();

  let x = (e.clientX - offset.x - boardRect.left) / currentZoom;
  let y = (e.clientY - offset.y - boardRect.top) / currentZoom;

  draggedElement.style.left = `${x}px`;
  draggedElement.style.top = `${y}px`;

  requestAnimationFrame(drawConnections);
}

function stopDragging() {
  draggedElement = null;
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDragging);

  setTimeout(drawConnections, 250);
}

document.addEventListener("contextmenu", handleContextMenu);
document.addEventListener("click", hideContextMenus);

function handleContextMenu(e) {
  e.preventDefault();
  hideContextMenus();

  const cardElement = e.target.closest(".card");
  const connectionElement = e.target.closest(".connection-line");
  const board = document.getElementById("board");
  const cardMenu = document.getElementById("cardContextMenu");
  const boardMenu = document.getElementById("boardContextMenu");
  const connectionMenu = document.getElementById("connectionContextMenu");

  if (connectionElement && connectionMenu) {
    const x = Math.min(e.pageX, window.innerWidth - connectionMenu.offsetWidth);
    const y = Math.min(e.pageY, window.innerHeight - connectionMenu.offsetHeight);
    showConnectionContextMenu(x, y, connectionElement);
  } else if (cardElement && cardMenu) {
    const x = Math.min(e.pageX, window.innerWidth - cardMenu.offsetWidth);
    const y = Math.min(e.pageY, window.innerHeight - cardMenu.offsetHeight);
    showCardContextMenu(x, y, cardElement);
  } else if (e.target === board && boardMenu) {
    const x = Math.min(e.pageX, window.innerWidth - boardMenu.offsetWidth);
    const y = Math.min(e.pageY, window.innerHeight - boardMenu.offsetHeight);
    showBoardContextMenu(x, y, e.clientX, e.clientY);
  }
}

function showCardContextMenu(x, y, card) {
  const menu = document.getElementById("cardContextMenu");
  if (!menu) return;

  const currentCard = card;
  menu.style.display = "block";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  const colorSubmenuTrigger = menu.querySelector('[data-submenu="colorSubmenu"]');
  if (colorSubmenuTrigger) {
    colorSubmenuTrigger.addEventListener("mouseenter", (e) => {
      const submenu = document.getElementById("colorSubmenu");
      if (!submenu) return;

      const rect = e.target.getBoundingClientRect();
      submenu.style.left = `${rect.right + 2}px`;
      submenu.style.top = `${rect.top}px`;
      submenu.style.display = "block";

      submenu.querySelectorAll(".color-submenu").forEach((option) => {
        option.onclick = (e) => {
          e.stopPropagation();
          const color = option.dataset.color;
          if (color && currentCard) {
            currentCard.style.backgroundColor = color;
            document.getElementById("cardColor").value = color;
            // document.getElementById("colorBtn").style.backgroundColor = color;
          }
          hideContextMenus();
        };
      });
    });
  }

  menu.onclick = (e) => {
    const action = e.target.dataset.action;
    if (action === "delete") {
      deleteCard(card);
    }
    hideContextMenus();
  };
}

function showConnectionContextMenu(x, y, connection) {
  const menu = document.getElementById("connectionContextMenu");
  if (!menu) return;

  hideContextMenus();

  menu.style.display = "block";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  const sourceId = connection.getAttribute("data-source");
  const targetId = connection.getAttribute("data-target");

  menu.onclick = (e) => {
    const action = e.target.dataset.action;
    if (action === "deleteLine") {
      removeConnection(sourceId, targetId);
    }
    hideContextMenus();
  };
}

function deleteCard(card) {
  connections = connections.filter((conn) => conn.source !== card && conn.target !== card);

  card.remove();

  drawConnections();
}

function showBoardContextMenu(x, y, clickX, clickY) {
  const menu = document.getElementById("boardContextMenu");
  if (!menu) return;

  hideContextMenus();
  menu.style.display = "block";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  menu.dataset.clickX = clickX;
  menu.dataset.clickY = clickY;

  const submenuTriggers = menu.querySelectorAll(".has-submenu");
  submenuTriggers.forEach((trigger) => {
    trigger.addEventListener("mouseenter", showSubmenu);
    trigger.addEventListener("mouseleave", hideSubmenuWithDelay);
  });

  menu.onclick = (e) => {
    const menuItem = e.target.closest(".menu-item");
    if (!menuItem) return;

    const action = menuItem.dataset.action;
    switch (action) {
      case "saveBoard":
        saveBoard();
        break;
      case "loadBoard":
        document.getElementById("loadFile").click();
        break;
      case "toggleLink":
        toggleLinkMode();
        break;
      default:
        if (action) createCard(action, clickX, clickY);
    }
    hideContextMenus();
  };
}

function showSubmenu(e) {
  const trigger = e.target;
  const submenuId = trigger.dataset.submenu;
  const submenu = document.getElementById(submenuId);
  if (!submenu) return;

  const triggerRect = trigger.getBoundingClientRect();
  const parentMenu = trigger.closest(".context-menu");

  submenu.style.left = `${triggerRect.right}px`;
  submenu.style.top = `${triggerRect.top}px`;
  submenu.classList.add("visible");

  const submenuRect = submenu.getBoundingClientRect();
  if (submenuRect.right > window.innerWidth) {
    submenu.style.left = `${triggerRect.left - submenuRect.width}px`;
  }
}

function hideSubmenuWithDelay() {
  setTimeout(() => {
    const submenus = document.querySelectorAll(".submenu");
    submenus.forEach((submenu) => submenu.classList.remove("visible"));
  }, 100);
}

function hideContextMenus() {
  const menus = document.querySelectorAll(".context-menu, .submenu");
  menus.forEach((menu) => {
    if (menu) {
      menu.style.display = "none";
    }
  });
  document.getElementById("colorPalette").classList.remove("visible");
  hideColorPicker();
}

function getRGBToHex(rgb) {
  if (rgb.startsWith("#")) return rgb;

  if (!rgb || rgb === "transparent") return "#ffeb3b";

  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (match) {
    return (
      "#" +
      match
        .slice(1)
        .map((n) => {
          const hex = parseInt(n).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  return "#ffeb3b";
}

function showColorPaletteForCard(card) {
  const colorPalette = document.getElementById("colorPalette");
  if (!colorPalette) return;

  // Only hide other menus, not the card context menu
  const menus = document.querySelectorAll(".context-menu:not(#cardContextMenu)");
  menus.forEach((menu) => {
    if (menu) menu.style.display = "none";
  });

  // Get positions for context menu and card
  const contextMenu = document.getElementById("cardContextMenu");
  const contextMenuRect = contextMenu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const paletteWidth = 160; // Width of the color palette

  // Calculate position relative to context menu
  let left = contextMenuRect.right + 2; // Add small gap
  if (left + paletteWidth > viewportWidth) {
    // If would go off screen right, position to left of context menu
    left = contextMenuRect.left - paletteWidth - 2;
  }

  // Use same vertical alignment as context menu
  colorPalette.style.top = `${contextMenuRect.top}px`;
  colorPalette.style.left = `${left}px`;
  colorPalette.classList.add("visible");

  // Rest of the color palette setup...
  // ...existing color option handling code...
}

function hideColorPicker() {
  const colorPicker = document.querySelector(".color-picker-popup");
  if (colorPicker) {
    colorPicker.remove();
  }

  const colorPickerEl = document.getElementById("colorPalette");
  if (colorPickerEl) {
    colorPickerEl.style.display = "none";
  }
}

function toggleLinkMode() {
  linkMode = !linkMode;
  const btn = document.getElementById("linkModeBtn");
  if (btn) {
    if (btn.classList.contains("active")) {
      btn.classList.remove("active");
    } else {
      btn.classList.add("active");
    }
    btn.style.backgroundColor = linkMode ? "#4caf50" : "transparent";
    btn.style.color = linkMode ? "white" : "#666";
  }

  document.querySelectorAll(".card").forEach((card) => {
    card.classList.toggle("linkable");
  });

  if (!linkMode) {
    if (sourceCard) {
      sourceCard.classList.remove("link-source");
    }
    sourceCard = null;
  }
}

function handleCardClick(e) {
  if (!linkMode) return;

  const card = e.target.closest(".card");
  if (!card) return;

  if (!sourceCard) {
    sourceCard = card;
    card.classList.add("link-source");
  } else if (sourceCard !== card) {
    createConnection(sourceCard, card);
    sourceCard.classList.remove("link-source");
    sourceCard = null;
  }
}

function createConnection(source, target) {
  connections = connections.filter((conn) => conn.source.isConnected && conn.target.isConnected);

  connections.push({ source, target });
  drawConnections();
}

function drawConnections() {
  const svg = document.getElementById("connections");
  const board = document.getElementById("board");
  const boardRect = board.getBoundingClientRect();
  const OFFSET = 8;

  svg.innerHTML = "";
  const viewBoxWidth = boardRect.width / currentZoom;
  const viewBoxHeight = boardRect.height / currentZoom;
  svg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
  svg.setAttribute("width", boardRect.width);
  svg.setAttribute("height", boardRect.height);

  const connectionGroups = {};
  connections.forEach((conn) => {
    const sourceRect = conn.source.getBoundingClientRect();
    const targetRect = conn.target.getBoundingClientRect();

    const source = {
      x: (sourceRect.left - boardRect.left) / currentZoom + sourceRect.width / (2 * currentZoom),
      y: (sourceRect.top - boardRect.top) / currentZoom + sourceRect.height / (2 * currentZoom),
      width: sourceRect.width / currentZoom,
      height: sourceRect.height / currentZoom,
    };
    const target = {
      x: (targetRect.left - boardRect.left) / currentZoom + targetRect.width / (2 * currentZoom),
      y: (targetRect.top - boardRect.top) / currentZoom + targetRect.height / (2 * currentZoom),
      width: targetRect.width / currentZoom,
      height: targetRect.height / currentZoom,
    };

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const isHorizontal = Math.abs(dx) > Math.abs(dy);

    let sourceSide, targetSide;
    if (isHorizontal) {
      sourceSide = dx > 0 ? "right" : "left";
      targetSide = dx > 0 ? "left" : "right";
      source.x += dx > 0 ? source.width / 2 : -source.width / 2;
      target.x += dx > 0 ? -target.width / 2 : target.width / 2;
    } else {
      sourceSide = dy > 0 ? "bottom" : "top";
      targetSide = dy > 0 ? "top" : "bottom";
      source.y += dy > 0 ? source.height / 2 : -source.height / 2;
      target.y += dy > 0 ? -target.height / 2 : target.height / 2;
    }

    const key = `${sourceSide}_${targetSide}_${conn.source.id}_${conn.target.id}_${
      isHorizontal ? `H_${Math.round(source.y)}` : `V_${Math.round(source.x)}`
    }`;

    if (!connectionGroups[key]) {
      connectionGroups[key] = [];
    }
    connectionGroups[key].push({ conn, source, target, isHorizontal, sourceSide, targetSide });
  });

  Object.values(connectionGroups).forEach((group) => {
    const sameSideConnections = group.length > 1;
    group.forEach((item, index) => {
      const { source, target, isHorizontal, sourceSide, targetSide } = item;
      const offset = sameSideConnections ? (index - (group.length - 1) / 2) * OFFSET : 0;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      let d;

      if (isHorizontal) {
        const sourceY = source.y + offset;
        const targetY = target.y + offset;
        const midX = (source.x + target.x) / 2;
        d = `M ${source.x} ${sourceY}
             L ${midX} ${sourceY}
             L ${midX} ${targetY}
             L ${target.x} ${targetY}`;
      } else {
        const sourceX = source.x + offset;
        const targetX = target.x + offset;
        const midY = (source.y + target.y) / 2;
        d = `M ${sourceX} ${source.y}
             L ${sourceX} ${midY}
             L ${targetX} ${midY}
             L ${targetX} ${target.y}`;
      }

      path.setAttribute("d", d);
      path.setAttribute("class", "connection-line");
      path.setAttribute("data-source", item.conn.source.id);
      path.setAttribute("data-target", item.conn.target.id);

      // Add both contextmenu and click handlers
      path.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = path.getBoundingClientRect();
        const x = Math.min(e.clientX, window.innerWidth - 180); // 180 is menu width
        const y = Math.min(e.clientY, window.innerHeight - 50); // 50 is menu height
        showConnectionContextMenu(x, y, path);
      });

      // Optional: still keep click deletion as alternative
      path.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.ctrlKey) {
          // Only delete on Ctrl+Click
          if (confirm("Remove this connection?")) {
            removeConnection(item.conn.source.id, item.conn.target.id);
          }
        }
      });

      svg.appendChild(path);
    });
  });
}

function saveBoard() {
  const board = document.getElementById("board");
  const cards = Array.from(board.querySelectorAll(".card"));

  const boardState = {
    cards: cards.map((card) => ({
      type: Array.from(card.classList).find((c) => c !== "card"),
      x: card.style.left,
      y: card.style.top,
      color: card.style.backgroundColor,
      title: card.querySelector(".card-header").textContent,
      content: card.querySelector(".card-text").value,
    })),
    connections: connections.map((conn) => ({
      sourceIndex: cards.indexOf(conn.source),
      targetIndex: cards.indexOf(conn.target),
    })),
  };

  const json = JSON.stringify(boardState);
  localStorage.setItem("boardState", json);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "board-state.json";
  a.click();
}

function loadBoardFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const savedState = JSON.parse(e.target.result);
      applyBoardState(savedState);
    } catch (error) {
      console.error("Error loading board state:", error);
      alert("Invalid board state file");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function loadBoard() {
  const json = localStorage.getItem("boardState");
  if (!json) {
    document.getElementById("loadFile").click();
    return;
  }

  try {
    const savedState = JSON.parse(json);
    applyBoardState(savedState);
  } catch (error) {
    console.error("Error loading board state:", error);
    alert("Invalid board state in localStorage");
  }
}

function applyBoardState(savedState) {
  if (!savedState || !savedState.cards) {
    console.error("Invalid board state format");
    return;
  }

  const board = document.getElementById("board");

  board.innerHTML = '<svg id="connections" class="connections"></svg>';
  connections = [];

  const cards = savedState.cards.map((cardData) => {
    const card = createCard(cardData.type);
    card.style.left = cardData.x;
    card.style.top = cardData.y;
    card.style.backgroundColor = cardData.color || "#ffeb3b";
    card.querySelector(".card-header").textContent = cardData.title || "Title";
    card.querySelector(".card-text").value = cardData.content || "";
    return card;
  });

  if (savedState.connections) {
    savedState.connections.forEach((conn) => {
      if (cards[conn.sourceIndex] && cards[conn.targetIndex]) {
        createConnection(cards[conn.sourceIndex], cards[conn.targetIndex]);
      }
    });
  }

  drawConnections();
}

document.getElementById("loadFile").addEventListener("change", loadBoardFromFile);

window.addEventListener("resize", drawConnections);

function zoomIn() {
  if (currentZoom < MAX_ZOOM) {
    currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
    applyZoom();
    drawConnections(); // Add explicit redraw
  }
  updateZoomButtons();
}

function zoomOut() {
  if (currentZoom > MIN_ZOOM) {
    currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
    applyZoom();
    drawConnections(); // Add explicit redraw
  }
  updateZoomButtons();
}

function updateZoomButtons() {
  const zoomInBtn = document.querySelector('button[title="Zoom In"]');
  const zoomOutBtn = document.querySelector('button[title="Zoom Out"]');

  if (zoomInBtn) {
    zoomInBtn.disabled = currentZoom >= MAX_ZOOM;
    zoomInBtn.style.opacity = currentZoom >= MAX_ZOOM ? "0.5" : "1";
  }

  if (zoomOutBtn) {
    zoomOutBtn.disabled = currentZoom <= MIN_ZOOM;
    zoomOutBtn.style.opacity = currentZoom <= MIN_ZOOM ? "0.5" : "1";
  }
}

function applyZoom() {
  const board = document.getElementById("board");
  
  // Update board scale and grid
  board.style.transform = `scale(${currentZoom})`;
  board.style.backgroundSize = `${20 * currentZoom}px ${20 * currentZoom}px`;

  // Update zoom level display
  document.getElementById("zoomLevel").textContent = `${Math.round(currentZoom * 100)}%`;

  // Remove existing requestAnimationFrame call since we're calling drawConnections directly
  updateZoomButtons();
}

// Update wheel zoom handler
document.getElementById("board").addEventListener("wheel", function (e) {
  if (e.ctrlKey) {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
    // Force connection redraw after zoom
    requestAnimationFrame(drawConnections);
  }
});

function clearBoard() {
  if (confirm("Are you sure you want to clear the board?")) {
    const board = document.getElementById("board");
    board.innerHTML = '<svg id="connections" class="connections"></svg>';
    connections = [];
  }
}

function removeConnection(sourceId, targetId) {
  connections = connections.filter(
    (conn) =>
      !(conn.source.id === sourceId && conn.target.id === targetId) &&
      !(conn.source.id === targetId && conn.target.id === sourceId)
  );
  drawConnections();
}
