const url = "/diagnostic/request/histogram";

async function issueGetHtmlReportRequest(settings) {
  const data = fetch(url, {
    method: "GET",
    body: JSON.stringify(settings),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).then((r) => r.text());
  return data;
}

issueGetHtmlReportRequest().then((results) => {
  const reportPlaceholder = document.getElementById("reportPlaceholder");
  reportPlaceholder.innerHTML = results;
  $(document).ready(function () {
    $("#reportTable").DataTable();
  });
});
