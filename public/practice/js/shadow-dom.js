function appendClockForTimeZones(
  selector,
  timeZones = ["America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney", "America/Los_Angeles"]
) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.attachShadow({ mode: "open" });

  const clockContainer = prepareClockElements(timeZones);

  shadowRoot.appendChild(clockContainer);
}

function appendPlacesOfInterests(selector, placesOfInterest) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.attachShadow({ mode: "open" });

  const elements = preparePlacesInfInterestElements(placesOfInterest);

  elements.forEach((element) => {
    shadowRoot.appendChild(element);
  });
}
