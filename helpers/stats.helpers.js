const { isBugDisabled } = require("../config/config-manager");
const { BugConfigKeys } = require("../config/enums");
const { isUndefined } = require("./compare.helpers");
const { pad } = require("./helpers");

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

  if (isBugDisabled(BugConfigKeys.BUG_CHARTS_001)) {
    // if there are no articlesData stats - prepare empty array
    if (articlesData.length === 0) {
      articlesDataForChart = [];
    }
  }

  for (const user_id in commentsPerUser) {
    commentsDataForChart.push([userIdToName[user_id], commentsPerUser[user_id]]);
  }

  if (isBugDisabled(BugConfigKeys.BUG_CHARTS_002)) {
    // if there are no commentsData stats - prepare empty array
    if (commentsData.length === 0) {
      commentsDataForChart = [];
    }
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

function parseUserActivityStats(dbDataJson) {
  const usersData = dbDataJson["users"];
  const articlesData = dbDataJson["articles"];
  const commentsData = dbDataJson["comments"];

  const userActivity = {};

  for (let i = 0; i < usersData.length; i++) {
    const userId = usersData[i].id;
    const userActivityByDay = {
      Monday: { articles: 0, comments: 0 },
      Tuesday: { articles: 0, comments: 0 },
      Wednesday: { articles: 0, comments: 0 },
      Thursday: { articles: 0, comments: 0 },
      Friday: { articles: 0, comments: 0 },
      Saturday: { articles: 0, comments: 0 },
      Sunday: { articles: 0, comments: 0 },
    };

    const userActivityByMonth = {};
    const userActivityByYear = {};

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    for (const month of months) {
      userActivityByMonth[month] = { articles: 0, comments: 0 };
    }

    for (let j = 0; j < articlesData.length; j++) {
      if (articlesData[j].user_id === userId) {
        const articleDate = new Date(articlesData[j].date);
        const month = articleDate.toLocaleDateString("en-US", { month: "long" });
        const dayOfWeek = articleDate.toLocaleDateString("en-US", { weekday: "long" });
        const year = articleDate.toLocaleDateString("en-US", { year: "numeric" });
        userActivityByDay[dayOfWeek].articles++;

        if (!(month in userActivityByMonth)) {
          userActivityByMonth[month] = { articles: 0, comments: 0 };
        }
        userActivityByMonth[month].articles++;

        if (userActivityByYear[year] === undefined) {
          userActivityByYear[year] = { articles: 0, comments: 0, total: 0 };
        }
        userActivityByYear[year].articles++;
        userActivityByYear[year].total++;
      }
    }

    for (let j = 0; j < commentsData.length; j++) {
      if (commentsData[j].user_id === userId) {
        const commentDate = new Date(commentsData[j].date);
        const month = commentDate.toLocaleDateString("en-US", { month: "long" });
        const dayOfWeek = commentDate.toLocaleDateString("en-US", { weekday: "long" });
        const year = commentDate.toLocaleDateString("en-US", { year: "numeric" });
        userActivityByDay[dayOfWeek].comments++;

        if (!(month in userActivityByMonth)) {
          userActivityByMonth[month] = { articles: 0, comments: 0 };
        }
        userActivityByMonth[month].comments++;

        if (userActivityByYear[year] === undefined) {
          userActivityByYear[year] = { articles: 0, comments: 0, total: 0 };
        }
        userActivityByYear[year].comments++;
        userActivityByYear[year].total++;
      }
    }

    const userData = usersData.find((user) => user.id === userId);
    userActivity[userId] = {
      user: { name: `${userData.firstname} ${userData.lastname}`, id: userId },
      userActivityByDay,
      userActivityByMonth,
      userActivityByYear,
    };
  }

  return userActivity;
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

  if (isUndefined(entriesData)) {
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

    if (isBugDisabled(BugConfigKeys.BUG_CHARTS_003)) {
      monthly[yearMonth]++;
    }

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

function parseUserPublicationStats(dbDataJson, entityName = "articles") {
  const data = [];
  const usersData = dbDataJson["users"];
  const entitiesData = dbDataJson[entityName];

  for (let i = 0; i < usersData.length; i++) {
    const userId = usersData[i].id;
    const userData = usersData.find((user) => user.id === userId);
    const userEntities = entitiesData.filter((entity) => entity.user_id === userId);

    const userArticlesData = {
      user: { name: `${userData.firstname} ${userData.lastname}`, id: userId },
    };
    userArticlesData[entityName] = userEntities.length;

    data.push(userArticlesData);
  }
  return data;
}

function parseUserPublicationStatsByDates(dbDataJson, entityName = "articles") {
  const entitiesData = dbDataJson[entityName];

  const entitiesByYear = {};
  const entitiesByMonth = {};
  const entitiesByDay = {};

  entitiesData.forEach((entity) => {
    const publishedDate = new Date(entity.date);
    const year = publishedDate.getFullYear();
    const month = publishedDate.getMonth();
    const day = publishedDate.getDay();

    const yearMonth = `${year}-${pad(month)}`;
    const yearMonthDay = `${year}-${pad(month)}-${pad(day)}`;

    if (!entitiesByYear[year]) {
      entitiesByYear[year] = 0;
    }

    if (!entitiesByMonth[yearMonth]) {
      entitiesByMonth[yearMonth] = 0;
    }

    if (!entitiesByDay[yearMonthDay]) {
      entitiesByDay[yearMonthDay] = 0;
    }

    entitiesByYear[year]++;
    entitiesByMonth[yearMonth]++;
    entitiesByMonth[yearMonthDay]++;
  });

  return { entitiesByYear, entitiesByMonth, entitiesByDay };
}

module.exports = {
  parseUserStats,
  parseArticleStats,
  parseUserActivityStats,
  parsePublishStats,
  parseUserPublicationStats,
  parseUserPublicationStatsByDates,
};
