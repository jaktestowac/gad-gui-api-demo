const { createHistogram, performance, PerformanceObserver } = require("perf_hooks");
const { saveJsonFile, saveFile, createDirectoryForFilePath } = require("../io.helpers");

class TimeHistogramReporterHtml {
  constructor(timeHistogram) {
    this.timeHistogram = timeHistogram;
    this.defaultPath = "reports/time-histogram-report.html";
  }

  getReport() {
    const content = `${this.prepareHeader()}${this.prepareBody()}${this.prepareFooter()}`;
    return content;
  }

  saveReport(path) {
    path = path || this.defaultPath;
    const content = this.getReport();
    createDirectoryForFilePath(path);
    saveFile(path, content);
  }

  prepareHeader() {
    return `
      <html lang="en">
      <head>
          <meta charset="UTF-8"></meta>
          <title>Time report</title>
          <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.11.5/css/jquery.dataTables.css"></link>
      </head>
      <body>
      <span id="header"></span>
      <table id="reportTable" class="display" data-order='[[ 4, "desc" ]]' data-page-length="25">
          <thead>
          <tr>
              <th rowspan="2">Label</th>
              <th colspan="4">Time [ms]</th>
              <th rowspan="2">Execution count</th>
              <th colspan="4">Percentiles [ms]</th>
          </tr>
          <tr>
              <th>Min</th>
              <th>Max</th>
              <th>Mean</th>
              <th>Sum</th>
              <th>25%</th>
              <th>50%</th>
              <th>75%</th>
              <th>100%</th>
          </tr>
          </thead>
          <tbody>`;
  }

  prepareBody() {
    return this.timeHistogram
      .getReport()
      .items.map(
        (item) => `
          <tr>
              <td>${item.name}</td>
              <td>${item.histogram.min}</td>
              <td>${item.histogram.max}</td>
              <td>${item.histogram.mean.toFixed(2)}</td>
              <td>${(item.histogram.count * item.histogram.mean).toFixed(2)}</td>
              <td>${item.histogram.count}</td>
              <td>${item.histogram.percentile(25)}</td>
              <td>${item.histogram.percentile(50)}</td>
              <td>${item.histogram.percentile(75)}</td>
              <td>${item.histogram.percentile(100)}</td>
          </tr>`
      )
      .join("\n");
  }

  prepareFooter() {
    return `
          </tbody>
      </table>
      
      <script type="text/javascript" src="https://code.jquery.com/jquery-3.6.0.slim.min.js"></script>
      <script type="text/javascript" src="https://cdn.datatables.net/1.11.5/js/jquery.dataTables.js"></script>
      <script type="text/javascript">
          $(document).ready( function () {
              $('#reportTable').DataTable();
          });
      </script>
      </body>
      </html>`;
  }
}

class TimeHistogramReporterJson {
  constructor(timeHistogram) {
    this.timeHistogram = timeHistogram;
    this.defaultPath = "reports/time-histogram-report.json";
  }

  getReport() {
    return this.timeHistogram.getReport();
  }

  saveReport(path) {
    path = path || this.defaultPath;
    saveJsonFile(path, this.getReport());
  }
}

class TimeHistogram {
  constructor(startMarkName, stopMarkName, measureName, labelTransform) {
    this.startMarkName = startMarkName;
    this.stopMarkName = stopMarkName;
    this.measureName = measureName;
    this.labelTransform = labelTransform;
    this.histogramMap = new Map();
    this.performanceObserver = new PerformanceObserver((perfObserverList) => {
      this.addMeasureEntryToHistogram(perfObserverList);
    });
    this.performanceObserver.observe({ type: "measure" });
  }

  start = (label) => {
    const transformedLabel = this.labelTransform ? this.labelTransform(label) : label;
    performance.mark(this.startMarkName, { detail: transformedLabel });
  };

  stop = (label) => {
    const transformedLabel = this.labelTransform ? this.labelTransform(label) : label;
    performance.mark(this.stopMarkName, { detail: transformedLabel });
    performance.measure(this.measureName, {
      detail: transformedLabel,
      start: this.startMarkName,
      end: this.stopMarkName,
    });
  };

  getReport() {
    const items = Array.from(this.histogramMap.entries()).map(([label, histogram]) => ({
      name: label,
      histogram,
    }));
    const timeline = performance
      .getEntries()
      .filter(
        (item) =>
          (item.entryType === "measure" && item.name === this.measureName) ||
          (item.entryType === "mark" && [this.startMarkName, this.stopMarkName].includes(item.name))
      );
    return {
      items,
      timeline,
    };
  }

  addMeasureEntryToHistogram(perfObserverList) {
    perfObserverList
      .getEntriesByType("measure")
      .filter((entry) => entry.name === this.measureName)
      .forEach((entry) => {
        const name = typeof entry.detail === "string" ? entry.detail : entry.name;
        const histogram = this.histogramMap.get(name) || createHistogram();
        histogram.record(Math.ceil(entry.duration));
        this.histogramMap.set(name, histogram);
      });
  }
}

module.exports = {
  TimeHistogramReporterHtml,
  TimeHistogramReporterJson,
  TimeHistogram,
};
