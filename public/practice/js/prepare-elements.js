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

function preparePlacesInfInterestElements(placesOfInterest) {
  const elements = [];

  placesOfInterest.forEach((place) => {
    const placeOfInterestContainer = document.createElement("div");
    placeOfInterestContainer.style.backgroundColor = "lightgray";
    placeOfInterestContainer.style.padding = "10px";
    placeOfInterestContainer.style.borderRadius = "5px";
    placeOfInterestContainer.style.textAlign = "center";
    placeOfInterestContainer.style.margin = "0 auto";
    placeOfInterestContainer.style.maxWidth = "700px";
    placeOfInterestContainer.style.marginBottom = "10px";

    const tableElement = document.createElement("table");
    tableElement.style.width = "100%";

    const tableRowElement = document.createElement("tr");

    const restaurantNameCell = document.createElement("td");
    restaurantNameCell.textContent = place.restaurantName;
    restaurantNameCell.style.fontWeight = "bold";
    restaurantNameCell.style.paddingBottom = "5px";
    tableRowElement.appendChild(restaurantNameCell);

    const addressCell = document.createElement("td");
    addressCell.textContent = place.address;
    addressCell.style.paddingBottom = "5px";
    tableRowElement.appendChild(addressCell);

    tableElement.appendChild(tableRowElement);

    const ratingRowElement = document.createElement("tr");

    const ratingCell = document.createElement("td");
    ratingCell.textContent = "Rating:";
    ratingCell.style.fontWeight = "bold";
    ratingRowElement.appendChild(ratingCell);

    const ratingValueCell = document.createElement("td");
    ratingValueCell.textContent = `${place.rating} ⭐️`;
    ratingRowElement.appendChild(ratingValueCell);

    tableElement.appendChild(ratingRowElement);

    const cuisineTypeRowElement = document.createElement("tr");

    const cuisineTypeCell = document.createElement("td");
    cuisineTypeCell.textContent = "Cuisine Type:";
    cuisineTypeCell.style.fontWeight = "bold";
    cuisineTypeRowElement.appendChild(cuisineTypeCell);

    const cuisineTypeValueCell = document.createElement("td");
    cuisineTypeValueCell.textContent = place.cuisineType;
    cuisineTypeRowElement.appendChild(cuisineTypeValueCell);

    tableElement.appendChild(cuisineTypeRowElement);

    const priceRangeRowElement = document.createElement("tr");

    const priceRangeCell = document.createElement("td");
    priceRangeCell.textContent = "Price Range:";
    priceRangeCell.style.fontWeight = "bold";
    priceRangeRowElement.appendChild(priceRangeCell);

    const priceRangeValueCell = document.createElement("td");
    priceRangeValueCell.textContent = place.priceRange;
    priceRangeRowElement.appendChild(priceRangeValueCell);

    tableElement.appendChild(priceRangeRowElement);

    const openingHoursRowElement = document.createElement("tr");

    const openingHoursCell = document.createElement("td");
    openingHoursCell.textContent = "Opening Hours:";
    openingHoursCell.style.fontWeight = "bold";
    openingHoursRowElement.appendChild(openingHoursCell);

    const openingHoursValueCell = document.createElement("td");
    openingHoursValueCell.textContent = place.openingHours;
    openingHoursRowElement.appendChild(openingHoursValueCell);

    tableElement.appendChild(openingHoursRowElement);

    const reviewsRowElement = document.createElement("tr");

    const reviewsCell = document.createElement("td");
    reviewsCell.textContent = "Reviews:";
    reviewsCell.style.fontWeight = "bold";
    reviewsRowElement.appendChild(reviewsCell);

    const reviewsValueCell = document.createElement("td");
    const reviewsList = document.createElement("ul");
    reviewsValueCell.appendChild(reviewsList);

    place.reviews.forEach((review) => {
      const reviewItem = document.createElement("li");
      reviewItem.textContent = review;
      reviewItem.style.textAlign = "left";
      reviewsList.appendChild(reviewItem);
    });

    reviewsRowElement.appendChild(reviewsValueCell);

    tableElement.appendChild(reviewsRowElement);
    placeOfInterestContainer.appendChild(tableElement);
    elements.push(placeOfInterestContainer);
  });

  return elements;
}
