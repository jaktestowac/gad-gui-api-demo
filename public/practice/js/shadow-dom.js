function attachClockForTimeZones(
  selector,
  timeZones = ["America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney", "America/Los_Angeles"]
) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.attachShadow({ mode: "open" });

  const clockContainer = prepareClockElements(timeZones);

  shadowRoot.appendChild(clockContainer);
}

function attachPlacesOfInterests(selector, placesOfInterest) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.attachShadow({ mode: "open" });

  const elements = preparePlacesInfInterestElements(placesOfInterest);

  elements.forEach((element) => {
    shadowRoot.appendChild(element);
  });
}

function addPlacesOfInterest(selector, placeOfInterest) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.shadowRoot;

  const element = preparePlacesInfInterestElements([placeOfInterest])[0];

  shadowRoot.appendChild(element);
}

function attachButton(selector, text, onclick) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.attachShadow({ mode: "open" });

  shadowRoot.appendChild(prepareButtonElement(text, onclick));
}

function addButton(selector, text, onclick) {
  const shadowRootContainer = document.querySelector(selector);
  const shadowRoot = shadowRootContainer.shadowRoot;

  shadowRoot.appendChild(prepareButtonElement(text, onclick));
}
