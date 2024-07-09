const { roundNumber } = require("./number.helper");

function getCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedDateTime;
}

function isDateRecentInHoursRange(dateString, hours) {
  const now = new Date();
  const date = getDateTimeFromString(dateString);
  const differenceInSeconds = Math.floor((now - date) / 1000);
  const totalHours = Math.floor(differenceInSeconds / 3600);

  return totalHours < hours;
}

function isDateBeforeOtherDate(dateString, otherDateString) {
  const date = getDateTimeFromString(dateString);
  const otherDate = getDateTimeFromString(otherDateString);

  return date > otherDate;
}

function checkHowLongInThePast(dateString) {
  const now = new Date();
  const date = getDateTimeFromString(dateString);
  const differenceInSeconds = Math.floor((now - date) / 1000);
  const totalSeconds = differenceInSeconds;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  return {
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
  };
}

function getCurrentDateTimeISO() {
  const formattedDateTime = new Date().toISOString();
  return formattedDateTime;
}

function getDateTimeFromString(dateString) {
  const date = new Date(dateString);
  return date;
}

function dateToDateStringISO(date) {
  let dateToFormat = date;
  if (dateToFormat === undefined) {
    dateToFormat = new Date();
  }

  const year = dateToFormat.getFullYear();
  const month = String(dateToFormat.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(dateToFormat.getDate()).padStart(2, "0");

  const formattedDateTime = `${year}-${month}-${day}T`;
  return formattedDateTime;
}

function tomorrow() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatYmd(tomorrow);
}

const formatYmd = (date) => date.toISOString().slice(0, 10);

function addSecondsToDate(date, seconds) {
  date.setSeconds(date.getSeconds() + seconds);
  return date;
}

function calculateTimeDifferenceInSeconds(date1, date2) {
  const differenceInSeconds = roundNumber((date2 - date1) / 1000);
  return differenceInSeconds;
}

function isDateStringGreaterThan(date1, date2) {
  const date1Date = new Date(date1);
  const date2Date = new Date(date2);
  return date1Date > date2Date;
}

function pad(num, size = 2) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

function getTodayDate() {
  const today = new Date();
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(
    today.getHours()
  )}:${pad(today.getMinutes())}:${pad(today.getSeconds())}Z`;
  return date;
}

function getTodayDateForFileName() {
  const today = new Date();
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(
    today.getHours()
  )}-${pad(today.getMinutes())}-${pad(today.getSeconds())}Z`;
  return date;
}

module.exports = {
  getCurrentDateTime,
  getCurrentDateTimeISO,
  tomorrow,
  formatYmd,
  addSecondsToDate,
  dateToDateStringISO,
  calculateTimeDifferenceInSeconds,
  isDateStringGreaterThan,
  getTodayDate,
  getTodayDateForFileName,
  getDateTimeFromString,
  checkHowLongInThePast,
  isDateRecentInHoursRange,
  isDateBeforeOtherDate,
};
