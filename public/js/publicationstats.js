function loadIframe() {
  const iframe = document.getElementById("statsIframe");
  iframe.setAttribute("src", `./publicationCharts.html?data=${dataType}`);
}

const dataType = getParams()["data"];
loadIframe();
