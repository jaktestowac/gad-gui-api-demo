const userstatsEndpoint = "../../api/stats/users";
let results;

async function issueGetRequest() {
  // get data from the server:
  results = await Promise.all(
    [userstatsEndpoint].map((url) => fetch(url + `?chartType=${chartType}`).then((r) => r.json()))
  );

  google.charts.setOnLoadCallback(displayData);
}

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
};

const displayData = () => {
  const articlesDataForChart = results[0]["articlesDataForChart"];
  const commentsDataForChart = results[0]["commentsDataForChart"];
  const userIdToName = results[0]["userIdToName"];
  const articlesPerUser = results[0]["articlesPerUser"];
  const commentsPerUser = results[0]["commentsPerUser"];

  let articlesOptions;
  let commentsOptions;
  let articlesChart;
  let commentsChart;
  let typeIsCharts = false;
  let typeIsTable = false;

  if (chartType === "pie") {
    articlesChart = new google.visualization.PieChart(document.getElementById("articlesPerUserChart"));
    commentsChart = new google.visualization.PieChart(document.getElementById("commentsPerUserChart"));

    articlesOptions = {
      title: "Number of articles",
      width: 400,
      height: 400,
      vAxis: {
        minValue: 0,
        format: "0",
      },
      legend: { position: "left", textStyle: { fontSize: 10 } },
    };
    commentsOptions = {
      title: "Number of comments",
      width: 400,
      height: 400,
      vAxis: {
        minValue: 0,
        format: "0",
      },
      legend: { position: "left", textStyle: { fontSize: 10 } },
    };
    articlesOptions.chartArea = { left: 20, right: 20, top: 40, bottom: 20 };
    commentsOptions.chartArea = { left: 20, right: 20, top: 40, bottom: 20 };
    typeIsCharts = true;
  } else if (chartType === "table") {
    typeIsTable = true;
  } else {
    articlesChart = new google.visualization.ColumnChart(document.getElementById("articlesPerUserChart"));
    commentsChart = new google.visualization.ColumnChart(document.getElementById("commentsPerUserChart"));

    articlesOptions = {
      title: "Number of articles",
      width: 400,
      height: 400,
      vAxis: {
        minValue: 0,
        format: "0",
      },
      legend: { position: "none" },
    };
    commentsOptions = {
      title: "Number of comments",
      width: 400,
      height: 400,
      vAxis: {
        minValue: 0,
        format: "0",
      },
      legend: { position: "none" },
    };
    typeIsCharts = true;
  }

  if (typeIsCharts) {
    // Doc: https://developers.google.com/chart/interactive/docs/gallery/columnchart?hl=pl
    const articlesDataTable = google.visualization.arrayToDataTable(articlesDataForChart);
    const commentsDataTable = google.visualization.arrayToDataTable(commentsDataForChart);

    articlesChart.draw(articlesDataTable, articlesOptions);
    commentsChart.draw(commentsDataTable, commentsOptions);

    document.querySelector("#btnDownloadArticlesDataCsv").onclick = () => {
      download("articles_data.csv", articlesDataForChart);
    };
    document.querySelector("#btnDownloadCommentsDataCsv").onclick = () => {
      download("comments_data.csv", commentsDataForChart);
    };
    document.querySelector("#btnDownloadArticlesDataJson").onclick = () => {
      download("articles_data.json", articlesDataForChart);
    };
    document.querySelector("#btnDownloadCommentsDataJson").onclick = () => {
      download("comments_data.json", commentsDataForChart);
    };
    document.querySelector("#btnDownloadArticlesDataCsv").disabled = false;
    document.querySelector("#btnDownloadCommentsDataCsv").disabled = false;
    document.querySelector("#btnDownloadArticlesDataJson").disabled = false;
    document.querySelector("#btnDownloadCommentsDataJson").disabled = false;
    document.querySelector("#tableChart").style.visibility = "visible";
    document.querySelector("#tableArea").style.visibility = "collapse";
  }
  if (typeIsTable) {
    const tableDataForCsv = [["User", "Articles", "Comments"]];
    const tableElement = document.getElementById("tableDataBody");
    for (const user_id in userIdToName) {
      let userName = userIdToName[user_id];
      let userLink = `<a href="user.html?id=${user_id}">${userName}</a>`;
      let articlesCount = articlesPerUser[user_id] ?? 0;
      let commentsCount = commentsPerUser[user_id] ?? 0;
      tableElement.innerHTML += `<tr><td style="text-align: center">${userLink}</td>
                <td style="text-align: center">${articlesCount}</td>
                <td style="text-align: center">${commentsCount}</td></tr>`;
      tableDataForCsv.push([userName, articlesCount, commentsCount]);
    }
    document.querySelector("#tableArea").style.visibility = "visible";
    document.querySelector("#tableChart").style.visibility = "collapse";
    document.querySelector("#btnDownloadTableDataCsv").onclick = () => {
      download("user_table_data.csv", tableDataForCsv);
    };
    document.querySelector("#btnDownloadTableDataJson").onclick = () => {
      download("user_table_data.json", tableDataForCsv);
    };
    document.querySelector("#btnDownloadTableDataCsv").disabled = false;
    document.querySelector("#btnDownloadTableDataJson").disabled = false;
  }
};

const CSV_SEP = ";";
const jsonToCSV = (object) => {
  let csv = "";
  if (!Array.isArray(object)) {
    csv = Object.entries(Object.entries(object)[0][1])
      .map((e) => e[0])
      .join(CSV_SEP);
    csv += "\r\n";
  }

  for (const [k, v] of Object.entries(object)) {
    csv += Object.values(v).join(CSV_SEP) + "\r\n";
  }
  return csv;
};

const download = (filename, data) => {
  let text = "NO DATA";
  if (filename.includes("csv")) {
    text = jsonToCSV(data);
  } else if (filename.includes("json")) {
    text = JSON.stringify(data, null, 4);
  }

  var element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

function getParams() {
  var values = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    values[key] = value;
  });
  return values;
}

function generatePDF() {
  const element = document.getElementById("tableChart");
  var opt = {
    margin: 1,
    filename: "user_stats.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 1 },
    jsPDF: { unit: "mm", format: "a3", orientation: "portrait" },
  };
  // Docs: https://github.com/eKoopmans/html2pdf.js
  html2pdf().set(opt).from(element).save();
}

// Load google charts
google.charts.load("current", { packages: ["corechart"] });

const chartType = getParams()["type"];
issueGetRequest();
