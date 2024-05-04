function loadIframe() {
  const iframe = document.getElementById("visitsIframe");
  iframe.setAttribute("src", `./partial-visitscharts.html?data=${chartType}`);
}

const chartType = getParams()["type"];
loadIframe();
