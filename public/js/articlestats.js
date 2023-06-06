const articleStatsEndpoint = "../../api/stats/articles";
let results;

async function issueGetRequest() {
  // get data from the server:
  results = await Promise.all(
    [articleStatsEndpoint].map((url) => fetch(url + `?chartType=${chartType}`).then((r) => r.json()))
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
  const commentsPerArticle = results[0]["commentsPerArticle"];
  const articleIdToTitle = results[0]["articleIdToTitle"];

  let commentsPerArticleOptions;
  let commentsPerArticleChart;
  let typeIsCharts = false;
  let typeIsTable = false;

  if (chartType === "pie") {
    commentsPerArticleChart = new google.visualization.PieChart(document.getElementById("commentsPerArticle"));

    commentsPerArticleOptions = {
      title: "Number of comments per article",
      width: 720,
      height: 400,
      legend: { position: "left", textStyle: { fontSize: 10 } },
    };
    commentsPerArticleOptions.chartArea = { left: 20, right: 20, top: 40, bottom: 20 };
    typeIsCharts = true;
  } else if (chartType === "table") {
    typeIsTable = true;
  } else {
    commentsPerArticleChart = new google.visualization.ColumnChart(document.getElementById("commentsPerArticle"));
    commentsPerArticleOptions = {
      title: "Number of comments per article",
      width: 720,
      height: 400,
      legend: { position: "none" },
    };
    typeIsCharts = true;
  }

  if (typeIsCharts) {
    // Doc: https://developers.google.com/chart/interactive/docs/gallery/columnchart?hl=pl
    const articlesDataTable = google.visualization.arrayToDataTable(articlesDataForChart);

    commentsPerArticleChart.draw(articlesDataTable, commentsPerArticleOptions);

    document.querySelector("#btnDownloadArticlesDataCsv").onclick = () => {
      download("comments_per_article_data.csv", articlesDataForChart);
    };
    document.querySelector("#btnDownloadArticlesDataJson").onclick = () => {
      download("comments_per_article_data.json", articlesDataForChart);
    };
    document.querySelector("#btnDownloadArticlesDataCsv").disabled = false;
    document.querySelector("#btnDownloadArticlesDataJson").disabled = false;
    document.querySelector("#tableChart").style.visibility = "visible";
    document.querySelector("#tableArea").style.visibility = "collapse";
  }
  if (typeIsTable) {
    const tableDataForCsv = [["Article", "Comments"]];
    const tableElement = document.getElementById("tableDataBody");
    for (const article_id in articleIdToTitle) {
      let articleName = articleIdToTitle[article_id];
      let articleLink = `<a href="article.html?id=${article_id}">${articleName}</a>`;
      let commentsCount = commentsPerArticle[article_id] ?? 0;
      tableElement.innerHTML += `<tr><td style="text-align: center">${articleLink}</td>
                <td style="text-align: center">${commentsCount}</td></tr>`;
      tableDataForCsv.push([articleName, commentsCount]);
    }
    document.querySelector("#tableArea").style.visibility = "visible";
    document.querySelector("#tableChart").style.visibility = "collapse";
    document.querySelector("#btnDownloadTableDataCsv").onclick = () => {
      download("articles_table_data.csv", tableDataForCsv);
    };
    document.querySelector("#btnDownloadTableDataJson").onclick = () => {
      download("articles_table_data.json", tableDataForCsv);
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
    filename: "article_stats.pdf",
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
menuButtonDisable();
