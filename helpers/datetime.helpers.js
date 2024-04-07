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

function getCurrentDateTimeISO() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
  return formattedDateTime;
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

module.exports = {
  getCurrentDateTime,
  getCurrentDateTimeISO,
  tomorrow,
  formatYmd,
  addSecondsToDate,
  dateToDateStringISO,
};
