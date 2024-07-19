function prepareClockElements(
  timeZones = ["America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney", "America/Los_Angeles"]
) {
  const clockContainer = document.createElement("div");
  clockContainer.style.display = "flex";
  clockContainer.style.flexDirection = "column";
  clockContainer.style.alignItems = "center";

  timeZones.forEach((timeZone) => {
    addNewTimeZone(clockContainer, timeZone);
  });

  const errorMessageElement = document.createElement("div");
  errorMessageElement.style.color = "red";
  errorMessageElement.style.textAlign = "center";
  errorMessageElement.style.position = "absolute";
  errorMessageElement.style.zIndex = "999";
  errorMessageElement.style.borderRadius = "5px";
  errorMessageElement.style.marginTop = "-20px";
  errorMessageElement.style.padding = "5px";
  errorMessageElement.style.backgroundColor = "rgb(255, 220, 220)";
  errorMessageElement.style.display = "none";

  const inputElement = document.createElement("input");
  inputElement.type = "text";
  inputElement.placeholder = "Enter a time zone";
  inputElement.style.width = "200px";
  inputElement.style.margin = "10px";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Time Zone";
  addButton.addEventListener("click", () => {
    const timeZone = inputElement.value;
    if (!isValidTimeZone(timeZone)) {
      inputElement.style.borderColor = "red";
      errorMessageElement.textContent = "Invalid time zone";
      errorMessageElement.style.display = "block";
      setTimeout(() => {
        errorMessageElement.style.display = "none";
      }, 3000);
      return;
    } else {
      inputElement.style.borderColor = "";
      errorMessageElement.textContent = "";
    }
    addNewTimeZone(clockContainer, timeZone);
    inputElement.value = "";
  });

  function isValidTimeZone(timeZone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone });
      return true;
    } catch (error) {
      return false;
    }
  }

  const controlsContainer = document.createElement("div");
  controlsContainer.style.display = "flex";
  controlsContainer.style.flexDirection = "column";
  controlsContainer.style.alignItems = "center";

  const inputButtonContainer = document.createElement("div");
  inputButtonContainer.style.display = "flex";
  inputButtonContainer.style.margin = "10px";

  inputButtonContainer.appendChild(inputElement);
  inputButtonContainer.appendChild(addButton);

  controlsContainer.appendChild(inputButtonContainer);
  controlsContainer.appendChild(errorMessageElement);
  clockContainer.appendChild(controlsContainer);

  return clockContainer;
}

function addNewTimeZone(clockContainer, timeZone) {
  const clockElementContainer = document.createElement("div");
  clockElementContainer.style.display = "flex";
  clockElementContainer.style.flexDirection = "row";

  const clockElement = document.createElement("div");
  clockElement.textContent = getTimeZoneOffset(timeZone);
  clockElement.style.backgroundColor = "lightgray";
  clockElement.style.padding = "5px";
  clockElement.style.borderRadius = "5px";
  clockElement.style.textAlign = "center";
  clockElement.style.margin = "0 auto";
  clockElement.style.width = "200px";
  clockElement.style.marginBottom = "5px";
  clockElement.setAttribute("title", `Current time in ${timeZone}`);

  const clockNameElement = document.createElement("div");
  clockNameElement.textContent = timeZone;
  clockNameElement.style.fontWeight = "bold";
  clockNameElement.style.marginBottom = "5px";

  const timeShiftElement = document.createElement("div");
  timeShiftElement.style.backgroundColor = "lightgray";
  timeShiftElement.style.padding = "5px";
  timeShiftElement.style.borderRadius = "5px";
  timeShiftElement.style.textAlign = "center";
  timeShiftElement.style.margin = "0 auto";
  timeShiftElement.style.width = "200px";
  timeShiftElement.style.marginBottom = "5px";
  timeShiftElement.textContent = getTimeZoneOffsetDetailed(timeZone);

  clockElement.style.margin = "5px";
  clockElement.style.padding = "5px";

  timeShiftElement.style.margin = "5px";
  timeShiftElement.style.padding = "5px";
  clockElement.appendChild(clockNameElement);
  clockElementContainer.appendChild(clockElement);
  clockElementContainer.appendChild(timeShiftElement);
  clockContainer.appendChild(clockElementContainer);

  return clockContainer;
}

function getTimeZoneOffsetDetailed(timeZone) {
  const date = new Date();
  const options = {
    timeZone,
    timeZoneName: "long",
    hour12: false,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  };

  const timeString = date.toLocaleTimeString("en-US", options);
  const temp = timeString.split(" ");
  temp.shift();
  const modifiedTimeString = temp.join(" ");
  return modifiedTimeString;
}

function getTimeZoneOffset(timeZone) {
  return new Date().toLocaleTimeString("en-US", { timeZone, timeZoneName: "short" });
}

function prepareButtonElement(text, onclick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.addEventListener("click", onclick);

  return button;
}

function attachButtonToElement(selector, text, onclick) {
  const element = document.querySelector(selector);
  const button = prepareButtonElement(text, onclick);
  element.appendChild(button);
}

function attachPlacesOfInterestToElement(selector, placeOfInterest, addIds = true) {
  const rootElement = document.querySelector(selector);
  const element = preparePlacesInfInterestElements([placeOfInterest], undefined, addIds)[0];
  rootElement.appendChild(element);
}

function addElementsToContainer(containerSelector, elementHTML) {
  const container = document.querySelector(containerSelector);
  container.innerHTML += elementHTML;
}

function preparePlacesInfInterestElements(placesOfInterest, numberOfPlaces = 3, addIds = true) {
  const elements = [];

  placesOfInterest.forEach((place) => {
    const placeOfInterestContainer = document.createElement("div");
    placeOfInterestContainer.style.backgroundColor = "lightgray";
    placeOfInterestContainer.style.padding = "10px";
    placeOfInterestContainer.style.borderRadius = "5px";
    placeOfInterestContainer.style.textAlign = "center";
    placeOfInterestContainer.style.margin = "0 auto";
    placeOfInterestContainer.style.maxWidth = "600px";
    placeOfInterestContainer.style.marginBottom = "10px";
    placeOfInterestContainer.style.fontSize = "12px";
    if (addIds) {
      placeOfInterestContainer.setAttribute("id", `id-${formatId(place.restaurantName)}-placeholder`);
    }

    const tableElement = document.createElement("table");
    tableElement.style.width = "100%";

    const tableRowElement = document.createElement("tr");

    const restaurantNameCell = document.createElement("td");
    restaurantNameCell.textContent = place.restaurantName;
    restaurantNameCell.style.fontWeight = "bold";
    restaurantNameCell.style.paddingBottom = "5px";
    restaurantNameCell.style.fontSize = "16px";
    restaurantNameCell.style.width = "40%";

    if (addIds) {
      restaurantNameCell.setAttribute("id", `id-${formatId(place.restaurantName)}`);
    }
    tableRowElement.appendChild(restaurantNameCell);

    const addressCell = document.createElement("td");
    addressCell.textContent = place.address;
    addressCell.style.paddingBottom = "5px";
    addressCell.style.width = "40%";

    const bookingCell = document.createElement("td");
    bookingCell.style.width = "20%";
    const bookingButton = document.createElement("button");
    bookingButton.textContent = "Book Now";
    bookingButton.onclick = () => {
      const resultsContainer = document.getElementById("results-container");
      if (resultsContainer !== null) {
        resultsContainer.innerHTML = `You have booked a table at ${place.restaurantName}! (${place.rating} ⭐️)`;
      }
    };

    bookingCell.appendChild(bookingButton);
    tableRowElement.appendChild(addressCell);
    tableRowElement.appendChild(bookingCell);
    tableElement.appendChild(tableRowElement);

    const detailsRowElement = document.createElement("tr");

    const detailsCellElement = document.createElement("td");
    detailsCellElement.setAttribute("colspan", "3");

    const detailsTableElement = document.createElement("table");
    detailsTableElement.style.width = "100%";
    detailsTableElement.style.margin = "0 auto";
    detailsTableElement.style.fontSize = "12px";
    detailsTableElement.style.border = "1px solid black";

    const headerRowElement = document.createElement("tr");

    const columnPrice = document.createElement("th");
    columnPrice.textContent = "Price Range";
    headerRowElement.appendChild(columnPrice);

    const columnAddress = document.createElement("th");
    columnAddress.textContent = "Address";
    headerRowElement.appendChild(columnAddress);

    const columnRating = document.createElement("th");
    columnRating.textContent = "Rating";
    headerRowElement.appendChild(columnRating);

    const columnCuisine = document.createElement("th");
    columnCuisine.textContent = "Cuisine Type";
    headerRowElement.appendChild(columnCuisine);

    detailsTableElement.appendChild(headerRowElement);

    const rowElement = document.createElement("tr");

    const column1 = document.createElement("td");
    column1.textContent = place.priceRange;
    if (addIds) {
      column1.setAttribute("id", `id-${formatId(place.restaurantName)}-rating`);
    }
    rowElement.appendChild(column1);

    const column2 = document.createElement("td");
    column2.textContent = place.restaurantName;
    if (addIds) {
      column2.setAttribute("id", `id-${formatId(place.restaurantName)}-name`);
    }
    rowElement.appendChild(column2);

    const column3 = document.createElement("td");
    column3.textContent = `${place.rating} ⭐️`;
    if (addIds) {
      column3.setAttribute("id", `id-${formatId(place.restaurantName)}-rating`);
    }
    rowElement.appendChild(column3);

    const column4 = document.createElement("td");
    column4.textContent = place.cuisineType;
    if (addIds) {
      column4.setAttribute("id", `id-${formatId(place.restaurantName)}-cuisineType`);
    }
    rowElement.appendChild(column4);
    detailsTableElement.appendChild(rowElement);

    detailsCellElement.appendChild(detailsTableElement);
    detailsRowElement.appendChild(detailsCellElement);
    tableElement.appendChild(detailsRowElement);

    const reviewsRowElement = document.createElement("tr");

    const reviewsCell = document.createElement("td");
    reviewsCell.textContent = "Reviews:";
    reviewsCell.style.fontWeight = "bold";
    reviewsCell.style.width = "25%";
    reviewsRowElement.appendChild(reviewsCell);

    const reviewsValueCell = document.createElement("td");

    reviewsValueCell.setAttribute("colspan", "2");
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "Toggle Reviews";
    toggleButton.style.fontSize = "12px";
    if (addIds) {
      toggleButton.setAttribute("id", `id-${formatId(place.restaurantName)}-reviews-btn`);
    }
    toggleButton.addEventListener("click", () => {
      reviewsList.style.display = reviewsList.style.display === "none" ? "block" : "none";
    });

    reviewsValueCell.appendChild(toggleButton);
    const reviewsList = document.createElement("ul");
    reviewsValueCell.appendChild(reviewsList);

    let idx = 1;
    place.reviews.forEach((review) => {
      const reviewItem = document.createElement("li");
      reviewItem.textContent = review;
      if (addIds) {
        reviewItem.setAttribute("id", `id-${formatId(place.restaurantName)}-review-${idx}`);
        idx++;
      }
      reviewItem.style.textAlign = "left";
      reviewsList.appendChild(reviewItem);
    });

    reviewsList.style.display = "none";

    reviewsRowElement.appendChild(reviewsValueCell);

    tableElement.appendChild(reviewsRowElement);
    placeOfInterestContainer.appendChild(tableElement);
    elements.push(placeOfInterestContainer);
  });

  if (numberOfPlaces !== undefined) {
    elements.splice(numberOfPlaces);
  }

  return elements;
}
