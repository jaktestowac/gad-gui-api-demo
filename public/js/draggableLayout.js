Packery.prototype.getShiftPositions = function (attrName) {
  attrName = attrName || "id";
  const _this = this;
  return this.items.map(function (item) {
    return {
      attr: item.element.getAttribute(attrName),
      x: item.rect.x / _this.packer.width,
    };
  });
};

Packery.prototype.initShiftLayout = function (positions, attr) {
  if (!positions) {
    // if no initial positions, run packery layout
    this.layout();
    return;
  }
  // parse string to JSON
  if (typeof positions == "string") {
    try {
      positions = JSON.parse(positions);
    } catch (error) {
      console.error("JSON parse error: " + error);
      this.layout();
      return;
    }
  }

  attr = attr || "id"; // default to id attribute
  this._resetLayout();

  // set item order and horizontal position from saved positions
  this.items = positions.map(function (itemPosition) {
    const selector = "[" + attr + '="' + itemPosition.attr + '"]';
    const itemElem = this.element.querySelector(selector);
    const item = this.getItem(itemElem);
    item.rect.x = itemPosition.x * this.packer.width;
    return item;
  }, this);
  this.shiftLayout();
};

$(".packery").packery();
const $grid = $(".grid").packery({
  itemSelector: ".grid-item",
  // columnWidth helps with drop positioning
  columnWidth: 100,
  percentPosition: true,
  initLayout: false,
});

// get saved dragged positions
let initPositions = localStorage.getItem("dragPositions");
if (initPositions === null || !initPositions) {
  const basePosition = [
    { attr: "4", x: 0 },
    { attr: "1", x: 0.25 },
    { attr: "5", x: 0.75 },
    { attr: "2", x: 0.375 },
    { attr: "3", x: 0.375 },
    { attr: "6", x: 0.375 },
  ];
  localStorage.setItem("dragPositions", JSON.stringify(basePosition));
  initPositions = basePosition;
}

// init layout with saved positions
$grid.packery("initShiftLayout", initPositions, "data-item-id");
$grid.find(".grid-item").each(function (i, gridItem) {
  const draggie = new Draggabilly(gridItem, {
    handle: ".handle",
  });
  $grid.packery("bindDraggabillyEvents", draggie);
});

// save drag positions on event
$grid.on("dragItemPositioned", function () {});

function hideDraggable() {
  $(".handle").hide();
  const gridElements = document.querySelectorAll(".grid-item");
  gridElements.forEach((element) => {
    element.style.border = "none";
  });
}

function showDraggable() {
  $(".handle").show();
  const gridElements = document.querySelectorAll(".grid-item");
  gridElements.forEach((element) => {
    element.style.border = "1px dashed grey";
  });
}

function toggleEditDashboard() {
  const handleElements = document.querySelectorAll(".handle");
  if (handleElements[0].style.display === "none") {
    showDraggable();
    const button = document.querySelector("#btnEditDashbaord");
    button.innerHTML = "Save Dashboard";
  } else {
    // save drag positions
    const positions = $grid.packery("getShiftPositions", "data-item-id");
    console.log("positions", positions);
    localStorage.setItem("dragPositions", JSON.stringify(positions));
    hideDraggable();
    const button = document.querySelector("#btnEditDashbaord");
    button.innerHTML = "Edit Dashboard";
  }
}

hideDraggable();

document.querySelector("#btnEditDashbaord").addEventListener("click", toggleEditDashboard);
