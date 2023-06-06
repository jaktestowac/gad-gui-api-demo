function loadIframe() {
  const iframe = document.getElementById("visitsIframe");
  iframe.setAttribute("src", `./visitscharts.html?data=${chartType}`);
}

function getParams() {
  var values = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    values[key] = value;
  });
  return values;
}

const chartType = getParams()["type"];
loadIframe();
