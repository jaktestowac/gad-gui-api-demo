const { getDateTimeFromString } = require("../datetime.helpers");

function generateDateRange(startDate, endDate) {
  const dateRange = [];
  const currentDate = getDateTimeFromString(startDate);
  while (currentDate <= endDate) {
    dateRange.push(getDateTimeFromString(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateRange;
}

function generateDateRangeInSteps(startDate, endDate, daysStep) {
  const dateRange = [];
  const currentDate = getDateTimeFromString(startDate);
  while (currentDate <= endDate) {
    dateRange.push(getDateTimeFromString(currentDate));
    currentDate.setDate(currentDate.getDate() + daysStep);
  }
  return dateRange;
}

module.exports = {
  generateDateRange,
  generateDateRangeInSteps,
};
