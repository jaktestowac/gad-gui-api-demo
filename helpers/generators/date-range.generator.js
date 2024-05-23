function generateDateRange(startDate, endDate) {
  const dateRange = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dateRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateRange;
}

function generateDateRangeInSteps(startDate, endDate, daysStep) {
  const dateRange = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dateRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + daysStep);
  }
  return dateRange;
}

module.exports = {
  generateDateRange,
  generateDateRangeInSteps,
};
