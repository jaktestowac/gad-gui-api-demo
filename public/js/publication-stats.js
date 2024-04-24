function loadIframe() {
  const iframe = document.getElementById("statsIframe");
  iframe.setAttribute("src", `./partial-publicationCharts.html?data=${dataType}`);
}

const dataType = getParams()["data"];
loadIframe();
