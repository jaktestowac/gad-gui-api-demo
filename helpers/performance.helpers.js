let totalTimePerType = {};

const perfObserver = new PerformanceObserver((items) => {
  const duration = items.getEntries()[0].duration;
  const name = items.getEntries()[0].name;
  if (totalTimePerType[name] === undefined) {
    totalTimePerType[name] = 0;
  }
  totalTimePerType[name] += duration;
  console.log("totalTimePerType", totalTimePerType);
  //   console.log(`Request ${name} time: ${duration} [ms]`);
  //   console.log(`Total time of tests: ${totalTime} [ms]`);
  //   console.log(`Total time of tests: ${Math.round(totalTime) / 1000} [s]`);
});

perfObserver.observe({ entryTypes: ["measure"], buffer: true });

function markStart(tag) {
  performance.mark(`${tag}-start`);
}

function markEnd(tag) {
  performance.mark(`${tag}-end`);
}

function measure(tag) {
  const measureValues = performance.measure(`Total time of ${tag}`, `${tag}-start`, `${tag}-end`);
  return { tag, ms: measureValues.duration, s: measureValues.duration / 1000 };
}

function getTotalTimePerType() {
  return totalTimePerType;
}

module.exports = { markStart, markEnd, measure, getTotalTimePerType };
