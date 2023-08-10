function loadIframe() {
  const iframe = document.getElementById("visitsIframe");
  iframe.setAttribute("src", `./visitscharts.html?data=${chartType}`);
}

const chartType = getParams()["type"];
loadIframe();
