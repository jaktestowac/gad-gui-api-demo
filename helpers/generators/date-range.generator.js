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

function generateRandomDate(startDate, endDate) {
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

module.exports = {
  generateDateRange,
  generateDateRangeInSteps,
  generateRandomDate,
};
