function createIframe(src) {
  const iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.style = "border: none";

  return iframe;
}

function createEmptyIframe() {
  const iframe = document.createElement("iframe");
  iframe.src = "./partials/emptyIframe.html";
  iframe.style = "border: none";

  return iframe;
}

function createAndAppendIframeToElement(element, src) {
  const iframe = createIframe(src);
  element.appendChild(iframe);
}

function createAndAppendIframe(selector, src) {
  const element = document.querySelector(selector);
  createAndAppendIframeToElement(element, src);
}
