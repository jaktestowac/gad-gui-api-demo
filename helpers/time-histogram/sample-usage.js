const { sleep } = require("../helpers");
const { markStart, markEnd, measure } = require("../performance.helpers");
const { TimeHistogramReporterJson, TimeHistogramReporterHtml } = require("./time-histogram");
const { TimeHistogramManager } = require("./time-histogram.manager");

// this file is a simple example of how to use the TimeHistogramManager
// and how to measure the time of a simple operation

const startDate = new Date("2021-01-01");
const endDate = new Date("2022-12-31");

// simple time consuming operation
function generateRandomValueSet(startDate, endDate) {
  const values = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const value = 10 + Math.random() * 2;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const decrease = 0.4 + Math.random() * 0.2; // 0.4 - 0.6
      values.push(value * decrease);
    } else {
      values.push(value);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return values;
}

const timeHistogramManager = TimeHistogramManager.getInstance();
timeHistogramManager.startAction("test1");
markStart("generateRandomValueSet1");
generateRandomValueSet(startDate, endDate);
markEnd("generateRandomValueSet1");
timeHistogramManager.stopAction("test1");

timeHistogramManager.startAction("test1");
markStart("generateRandomValueSet2");
generateRandomValueSet(startDate, endDate);
markEnd("generateRandomValueSet2");
timeHistogramManager.stopAction("test1");

for (let index = 0; index < 5; index++) {
  timeHistogramManager.startAction("test1");
  generateRandomValueSet(startDate, endDate);
  timeHistogramManager.stopAction("test1");
}

sleep(1000).then(() => {
  console.log(measure("generateRandomValueSet1"));
  console.log(measure("generateRandomValueSet2"));
  new TimeHistogramReporterJson(timeHistogramManager.getActionsTimeHistogram()).saveReport(
    "reports/time-histogram-report.json"
  );

  new TimeHistogramReporterHtml(timeHistogramManager.getActionsTimeHistogram()).saveReport(
    "reports/time-histogram-report.html"
  );
});
