function loadIframe() {
  const iframe = document.getElementById("statsIframe");
  iframe.setAttribute("src", `./publicationCharts.html?data=${dataType}`);
}

function getParams() {
  var values = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    values[key] = value;
  });
  return values;
}

const dataType = getParams()["data"];
loadIframe();
