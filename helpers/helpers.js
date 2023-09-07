const seedrandom = require("seedrandom");
const { logDebug } = require("./loggerApi");
const pluginStatuses = ["on", "off", "obsolete"];
const { getConfigValue } = require("../config/configManager");
const { ConfigKeys } = require("../config/enums");
const { formatYmd } = require("./datetime.helpers");

function formatErrorResponse(message, details = undefined, id = undefined) {
  const body = { error: { message: message, details: details }, id };
  logDebug("formatErrorResponse:", body);
  return body;
}

function formatInvalidTokenErrorResponse() {
  return formatErrorResponse("Access token for given user is invalid!");
}

function formatInvalidFieldErrorResponse(isValid, all_fields) {
  return formatErrorResponse(
    `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
    all_fields
  );
}

function formatMissingFieldErrorResponse(all_fields) {
  return formatErrorResponse("One of mandatory field is missing", all_fields);
}

function getIdFromUrl(urlEnds) {
  const urlParts = urlEnds.split("/");
  let id = urlParts[urlParts.length - 1];
  return id;
}

function getRandomIdBasedOnDay(length = 32) {
  var result = "";
  var charactersLength = getConfigValue(ConfigKeys.CHARACTERS).length;
  const generator = seedrandom(formatYmd(new Date()));
  for (var i = 0; i < length; i++) {
    result += getConfigValue(ConfigKeys.CHARACTERS).charAt(Math.floor(generator() * charactersLength));
  }
  return result;
}

function getRandomIntBasedOnDay() {
  const generator = seedrandom(formatYmd(new Date()));
  const randomValue = generator();

  return randomValue.toString().replace(".", "");
}

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isAdminUser(email, pass) {
  return email === getConfigValue(ConfigKeys.ADMIN_USER_EMAIL) && pass === getConfigValue(ConfigKeys.ADMIN_USER_PASS);
}

function isSuperAdminUser(email, pass) {
  return (
    email === getConfigValue(ConfigKeys.SUPER_ADMIN_USER_EMAIL) &&
    pass === getConfigValue(ConfigKeys.SUPER_ADMIN_USER_PASS)
  );
}

function isAnyAdminUser(email, pass) {
  return isAdminUser(email, pass) || isSuperAdminUser(email, pass);
}

function pad(num, size = 2) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

function parseUserStats(dbDataJson, dataType) {
  const articlesData = dbDataJson["articles"];
  const usersData = dbDataJson["users"];
  const commentsData = dbDataJson["comments"];

  const articlesPerUser = {};
  const commentsPerUser = {};
  const userIdToName = {};

  for (let j = 0; j < usersData.length; j++) {
    userIdToName[usersData[j].id] = `${usersData[j].firstname} ${usersData[j].lastname}`;
  }

  for (let j = 0; j < articlesData.length; j++) {
    if (!(articlesData[j].user_id in articlesPerUser)) {
      articlesPerUser[articlesData[j].user_id] = 0;
    }
    articlesPerUser[articlesData[j].user_id]++;
  }

  for (let j = 0; j < commentsData.length; j++) {
    if (!(commentsData[j].user_id in commentsPerUser)) {
      commentsPerUser[commentsData[j].user_id] = 0;
    }
    commentsPerUser[commentsData[j].user_id]++;
  }

  let articlesDataForChart = [["User", "Articles"]];
  let commentsDataForChart = [["User", "Comments"]];

  for (const user_id in articlesPerUser) {
    articlesDataForChart.push([userIdToName[user_id], articlesPerUser[user_id]]);
  }

  // TODO:INVOKE_BUG: comment this if to break stats charts when there are no data
  if (articlesData.length === 0) {
    articlesDataForChart = [];
  }

  for (const user_id in commentsPerUser) {
    commentsDataForChart.push([userIdToName[user_id], commentsPerUser[user_id]]);
  }

  // TODO:INVOKE_BUG: comment this if to break stats charts when there are no data
  if (commentsData.length === 0) {
    commentsDataForChart = [];
  }

  if (dataType.includes("table")) {
    return {
      articlesDataForChart: undefined,
      commentsDataForChart: undefined,
      userIdToName,
      articlesPerUser,
      commentsPerUser,
    };
  } else {
    return {
      articlesDataForChart,
      commentsDataForChart,
      userIdToName,
      articlesPerUser: undefined,
      commentsPerUser: undefined,
    };
  }
}

function parseArticleStats(dbDataJson, dataType) {
  const articlesData = dbDataJson["articles"];
  const commentsData = dbDataJson["comments"];

  const commentsPerArticle = {};
  const articleIdToTitle = {};

  for (let j = 0; j < articlesData.length; j++) {
    articleIdToTitle[articlesData[j].id] = `${articlesData[j].title?.substring(0, 200)} (...)`;
  }

  for (let j = 0; j < commentsData.length; j++) {
    if (!(commentsData[j].article_id in commentsPerArticle)) {
      commentsPerArticle[commentsData[j].article_id] = 0;
    }
    commentsPerArticle[commentsData[j].article_id]++;
  }

  const articlesDataForChart = [["Article", "Number of comments"]];

  for (const article_id in commentsPerArticle) {
    articlesDataForChart.push([articleIdToTitle[article_id], commentsPerArticle[article_id]]);
  }

  if (dataType.includes("table")) {
    return {
      articlesDataForChart: undefined,
      articleIdToTitle,
      commentsPerArticle,
    };
  } else {
    return {
      articlesDataForChart,
      articleIdToTitle: undefined,
      commentsPerArticle: undefined,
    };
  }
}

function parsePublishStats(dbDataJson, type = "comments") {
  const yearly = {};
  const monthly = {};
  const daily = {};
  let entriesData;

  if (type === "articles") {
    entriesData = dbDataJson["articles"];
  }
  if (type === "comments") {
    entriesData = dbDataJson["comments"];
  }

  if (entriesData === undefined) {
    return {
      yearly,
      monthly,
      daily,
    };
  }

  for (const entry of entriesData) {
    let date = new Date(entry.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (!(year in yearly)) {
      yearly[year] = 0;
    }
    yearly[year]++;

    const yearMonth = `${year}-${pad(month)}`;
    if (!(yearMonth in monthly)) {
      monthly[yearMonth] = 0;
    }
    monthly[yearMonth]++;

    const yearMonthDay = `${year}-${pad(month)}-${pad(day)}`;
    if (!(yearMonthDay in daily)) {
      daily[yearMonthDay] = 0;
    }
    daily[yearMonthDay]++;
  }

  return {
    yearly,
    monthly,
    daily,
  };
}

function shuffleArray(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

module.exports = {
  getRandomIntBasedOnDay,
  getRandomIdBasedOnDay,
  pluginStatuses,
  formatErrorResponse,
  formatInvalidFieldErrorResponse,
  formatMissingFieldErrorResponse,
  formatInvalidTokenErrorResponse,
  getRandomInt,
  sleep,
  isAdminUser,
  isSuperAdminUser,
  isAnyAdminUser,
  parseUserStats,
  parseArticleStats,
  parsePublishStats,
  getIdFromUrl,
  shuffleArray,
};
