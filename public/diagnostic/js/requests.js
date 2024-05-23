const url = "/diagnostic/request/histogram";

async function issueGetHtmlReportRequest(settings) {
  const data = fetch(url, {
    method: "GET",
    body: JSON.stringify(settings),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return data;
}

issueGetHtmlReportRequest()
  .then((r) => {
    if (r.status !== 200) {
      return `<br>Error: ${r.status} - ${r.statusText}.<br>Check config - was the diagnostics enabled?`;
    }

    return r.text();
  })
  .then((results) => {
    const reportPlaceholder = document.getElementById("reportPlaceholder");
    reportPlaceholder.innerHTML = results;
    $(document).ready(function () {
      $("#reportTable").DataTable();
    });
  });
