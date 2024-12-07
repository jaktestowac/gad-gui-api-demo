function invokeActionsOnDifferentStatusCodes(statusCode, response) {
  const messageElement = document.getElementById("message-container");
  let message = "";
  switch (statusCode) {
    case 200:
      displaySimpleAlertWithCustomMessage("Success", "green", true);
      break;
    case 204:
      displaySimpleAlertWithCustomMessage("No content", "green", true);
      break;
    case 304:
      displaySimpleAlertWithCustomMessage("Not modified", "yellow", true);
      break;
    case 307:
      displaySimpleAlertWithCustomMessage("Temporary redirect", "yellow", true);
      message = "Please update your bookmarks";
      break;
    case 308:
      displaySimpleAlertWithCustomMessage("Permanent redirect", "yellow", true);
      message = "Please update your bookmarks";
      break;
    case 400:
      displaySimpleAlertWithCustomMessage("Bad request", "red", true);
      message = "Please check your request and try again";
      break;
    case 401:
      displaySimpleAlertWithCustomMessage("You are not authorized to view this page", "red", true);
      message = "Please log in and try again";
      break;
    case 403:
      displaySimpleAlertWithCustomMessage("You do not have permission to view this page", "red", true);
      message = "Please contact the administrator for more information";
      break;
    case 404:
      displaySimpleAlertWithCustomMessage("The page you are looking for does not exist", "red", true);
      message = "Please check the URL and try again";
      break;
    case 408:
      displaySimpleAlertWithCustomMessage("Request timeout", "red", true);
      message = "Please try again later";
      break;
    case 413:
      displaySimpleAlertWithCustomMessage("Request entity too large", "red", true);
      message = "Please try again with a smaller request";
      break;
    case 414:
      displaySimpleAlertWithCustomMessage("Request URI too long", "red", true);
      message = "Please try again with a shorter request";
      break;
    case 415:
      displaySimpleAlertWithCustomMessage("Unsupported media type", "red", true);
      message = "Please try again with a different media type";
      break;
    case 418:
      displaySimpleAlertWithCustomMessage("I'm a teapot ☕", "red", true);
      message = "I'm a teapot, I can't make coffee";
      break;
    case 429:
      displaySimpleAlertWithCustomMessage("Too many requests", "red", true);
      message = "Please try again later";
      break;
    case 500:
      displaySimpleAlertWithCustomMessage("Internal server error", "red", true);
      message = "Oh no! Something went wrong on our end. Please try again later";
      break;
    case 501:
      displaySimpleAlertWithCustomMessage("Not implemented", "red", true);
      message = "I'm sorry, this feature is not implemented yet";
      break;
    case 502:
      displaySimpleAlertWithCustomMessage("Bad gateway", "red", true);
      message = "The server is broken. Please try again later";
      break;
    case 503:
      displaySimpleAlertWithCustomMessage("Service unavailable", "red", true);
      message = "The server is down. Please try again later";
      break;
    case 504:
      displaySimpleAlertWithCustomMessage("Gateway timeout", "red", true);
      message = "The server response is too slow. Please try again later";
      break;
    case 505:
      displaySimpleAlertWithCustomMessage("HTTP version not supported", "red", true);
      message = "Please try again with a different HTTP version";
      break;
    case 507:
      displaySimpleAlertWithCustomMessage("Insufficient storage", "red", true);
      message = "Please try again with a smaller request";
      break;
    case 511:
      displaySimpleAlertWithCustomMessage("Network authentication required", "red", true);
      message = "Please log in and try again";
      break;
    default:
      displaySimpleAlertWithCustomMessage("Something went wrong", "red", true);
      message = "Great Scott! Something went wrong! Please try again later";
  }

  if (messageElement !== null) {
    const messageEl = document.createElement("div");
    messageEl.innerHTML = message;

    messageElement.appendChild(messageEl);

    if (message === "") {
      messageElement.style.display = "none";
    } else {
      messageElement.style.display = "block";
    }
    response.json().then((data) => {
      const detailsEl = document.createElement("div");
      let formattedData = "No additional details available";
      if (data?.error !== undefined) {
        formattedData = data?.error;
      }
      detailsEl.innerHTML = formattedData;
      messageElement.appendChild(detailsEl);

      if (data?.error !== undefined) {
        messageElement.style.display = "block";
      }
    });
  }
}
