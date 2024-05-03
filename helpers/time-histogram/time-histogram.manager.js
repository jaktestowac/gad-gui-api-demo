const { TimeHistogram } = require("./time-histogram");

class TimeHistogramManager {
  constructor() {
    this.iteration = 0;
    this.actionsTimeHistogram = new TimeHistogram("actionStarted", "actionEnded", "action", (label) => label);
  }

  getActionsTimeHistogram() {
    return this.actionsTimeHistogram;
  }

  startAction(label) {
    this.actionsTimeHistogram.start(label);
  }

  stopAction(label) {
    this.actionsTimeHistogram.stop(label);
  }

  static getInstance() {
    if (TimeHistogramManager.instance === undefined) {
      TimeHistogramManager.instance = new TimeHistogramManager();
    }
    return TimeHistogramManager.instance;
  }
}

module.exports = {
  TimeHistogramManager,
};
