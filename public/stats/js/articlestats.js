const articleStatsEndpoint = "../../api/stats/articles";
let results;

async function issueGetRequest() {
  // get data from the server:
  results = await Promise.all(
    [articleStatsEndpoint].map((url) => fetch(url + `?chartType=${chartType}`).then((r) => r.json()))
  );
  return results;
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
      let articleLink = `<a href="/article.html?id=${article_id}">${articleName}</a>`;
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
    document.querySelector("#btnDownloadTableDataXlsx").onclick = () => {
      downloadXlsx("articles_table_data.xlsx", tableDataForCsv);
    };
    document.querySelector("#btnDownloadTableDataCsv").disabled = false;
    document.querySelector("#btnDownloadTableDataJson").disabled = false;
    document.querySelector("#btnDownloadTableDataXlsx").disabled = false;
  }
};

function generateChartPDF(filename) {
  generatePDF(filename, "tableChart");
}

function displayChart(chartId, xLabels, data) {
  if (window.myCharts === undefined) {
    window.myCharts = {};
  }

  if (window.myCharts[chartId] != undefined) {
    window.myCharts[chartId].destroy();
  }

  const ctx = document.getElementById(chartId).getContext("2d");
  window.myCharts[chartId] = new Chart(ctx, {
    type: "polarArea",
    data: {
      labels: xLabels,
      datasets: [{ data: data }],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Articles per User",
          font: {
            size: 24,
          },
        },
      },
    },
  });
}

function displayCanvasChart(results) {
  document.querySelector("#canvasPolarChartArticlesData").style.display = "inherit";

  const xLabels = [];
  const articlesData = [];

  results.articlesDataForChart.sort((a, b) => b[1] - a[1]); // Sort by numbers in descending order

  const filteredResults = results.articlesDataForChart.slice(0, 15);
  const skippedResults = results.articlesDataForChart.slice(15);
  const sumOfSkippedValues = skippedResults.reduce((sum, element) => sum + element[1], 0);

  filteredResults.forEach((element) => {
    if (typeof element[1] === "number") {
      xLabels.push(element[0]);
      articlesData.push(element[1]);
    }
  });

  if (sumOfSkippedValues > 0) {
    xLabels.push("Others");
    articlesData.push(sumOfSkippedValues);
  }

  displayChart("canvasPolarChartArticlesData", xLabels, articlesData);
}

// Load google charts
google.charts.load("current", { packages: ["corechart"] });

const chartType = getParams()["type"];
menuButtonDisable();

if (chartType === "polar") {
  issueGetRequest().then(() => {
    displayCanvasChart(results[0]);
  });
} else {
  issueGetRequest().then(() => {
    google.charts.setOnLoadCallback(displayData);
  });
}
