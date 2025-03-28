const fs = require("fs");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const path = require("path");
const { checkFileName } = require("./file-upload.helper");
const { logTrace, logDebug } = require("./logger-api");
const { isUndefined } = require("./compare.helpers");
const { getSeededRandomVisitsForEntities } = require("./generators/random-data.generator");
const { createPathIfNotExists } = require("./io.helpers");
const { roles, actions } = require("../db/user-roles-db");

const visits = (function () {
  let instance;

  function createInstance() {
    let visitsPerArticle = {};
    let visitsPerComment = {};
    let visitsPerUsers = {};
    let apiCalls = {};
    let nonApiCalls = {};
    let apiRequestsDetails = {};
    let nonApiRequestsDetails = {};

    function getVisitsPerArticle() {
      return visitsPerArticle;
    }

    function getVisitsPerComment() {
      return visitsPerComment;
    }

    function getVisitsPerUsers() {
      return visitsPerUsers;
    }

    function getApiCalls() {
      return apiCalls;
    }

    function getNonApiCalls() {
      return nonApiCalls;
    }

    function getApiRequestsDetails() {
      return apiRequestsDetails;
    }

    function getNonApiRequestsDetails() {
      return nonApiRequestsDetails;
    }

    function generateVisits() {
      visitsPerArticle = getSeededRandomVisitsForEntities(
        articlesDb(),
        getConfigValue(ConfigKeys.MIN_RANDOM_VISITS_FOR_ARTICLES),
        getConfigValue(ConfigKeys.MAX_RANDOM_VISITS_FOR_ARTICLES)
      );

      visitsPerComment = getSeededRandomVisitsForEntities(
        commentsDb(),
        getConfigValue(ConfigKeys.MIN_RANDOM_VISITS_FOR_COMMENTS),
        getConfigValue(ConfigKeys.MAX_RANDOM_VISITS_FOR_COMMENTS)
      );

      visitsPerUsers = getSeededRandomVisitsForEntities(
        userDb(),
        getConfigValue(ConfigKeys.MIN_RANDOM_VISITS_FOR_USERS),
        getConfigValue(ConfigKeys.MAX_RANDOM_VISITS_FOR_USERS)
      );

      logDebug("Visits: generated for articles, comments and users");
    }
    return {
      visitsPerArticle,
      visitsPerComment,
      visitsPerUsers,
      generateVisits,
      getVisitsPerArticle,
      getVisitsPerComment,
      getVisitsPerUsers,
      getApiCalls,
      getNonApiCalls,
      getApiRequestsDetails,
      getNonApiRequestsDetails,
    };
  }
  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

function initVisits() {
  const visitsData = visits.getInstance();
  visitsData.generateVisits();
}

function getDbPath(dbPath) {
  return path.resolve(__dirname, "..", dbPath);
}

function fullDb() {
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, "..", getConfigValue(ConfigKeys.DB_PATH)), "utf8"));
  return db;
}

function fullBaseDb() {
  const db = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", getConfigValue(ConfigKeys.DB_RESTORE_PATH)), "utf8")
  );
  return db;
}

function gamesDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.GAMES_DB)), "UTF-8"));
  return db["games"];
}

function translationsDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.TRANSLATIONS_DB)), "UTF-8"));
  return db;
}

function getLanguages() {
  const translations = translationsDb();
  const keys = Object.keys(translations);
  const keyNamePair = keys.reduce((acc, key) => {
    acc[key] = translations[key]["_name"];
    return acc;
  }, {});
  return keyNamePair;
}

function userDb() {
  return fullDb()["users"];
}

function articlesDb() {
  return fullDb()["articles"];
}

function commentsDb() {
  return fullDb()["comments"];
}

function flashpostsDb() {
  return fullDb()["flashposts"];
}

function contactsDb() {
  return fullDb()["contacts"];
}

function messageCheckDb() {
  return fullDb()["message-check"];
}

function messagesDb() {
  return fullDb()["messages"];
}

function likesDb() {
  return fullDb()["likes"];
}

function labelsDb() {
  return fullDb()["labels"];
}

function scoresDb() {
  return fullDb()["scores"];
}

function articleLabelsDb() {
  return fullDb()["article-labels"];
}

function surveyResponsesDb() {
  return fullDb()["survey-responses"];
}

function bookmarksDb() {
  return fullDb()["bookmarks"];
}

function booksDb() {
  return fullDb()["books"] || [];
}

function bookShopAccountsDb() {
  return fullDb()["book-shop-accounts"] || [];
}

function bookShopAccountPaymentHistoryDb() {
  return fullDb()["book-shop-account-payment-history"] || [];
}

function bookShopAccountPaymentCardDb() {
  return fullDb()["book-shop-account-payment-cards"] || [];
}

function bookShopOrderCouponsDb() {
  return fullDb()["book-shop-order-coupons"] || [];
}

function bookShopOrdersDb() {
  return fullDb()["book-shop-orders"] || [];
}

function bookShopOrderStatusesDb() {
  return fullDb()["book-shop-order-statuses"] || [];
}

function bookShopActionsDb() {
  return fullDb()["book-shop-actions"] || [];
}

function bookShopRolesDb() {
  return fullDb()["book-shop-roles"] || [];
}

function bookShopBookReviewsDb() {
  return fullDb()["book-reviews"] || [];
}

function bookShopItemsDb() {
  return fullDb()["book-shop-items"] || [];
}

function quizQuestionsDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.QUIZ_QUESTIONS_PATH), "UTF-8")));
  return db;
}

function userRolesDb() {
  // const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.USER_ROLES_PATH), "UTF-8")));
  // return db["roles"];
  return roles;
}

function userRoleActionsDb() {
  // const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.USER_ROLE_ACTIONS_PATH), "UTF-8")));
  // return db["actions"];
  return actions;
}

function hangmanDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.HANGMAN_DATA_PATH), "UTF-8")));
  return db;
}

function randomDbEntry(db) {
  return db[Math.floor(Math.random() * db.length)];
}

function getUserAvatars() {
  let files = fs.readdirSync(path.join(__dirname, getConfigValue(ConfigKeys.USER_AVATAR_PATH)));
  files = files.filter((file) => !file.startsWith("face_"));
  return files;
}

function getImagesForArticles() {
  let files = fs.readdirSync(path.join(__dirname, getConfigValue(ConfigKeys.ARTICLE_IMAGE_PATH)));
  files = files.filter((file) => file.toLowerCase().endsWith(".jpg") || file.toLowerCase().endsWith(".jpeg"));
  return files;
}

function getUploadedFileList() {
  let files = fs.readdirSync(path.join(__dirname, getConfigValue(ConfigKeys.UPLOADS_PATH)));
  files = files.filter((file) => file.endsWith(".json"));

  const foundFiles = [];

  files.forEach((fileName) => {
    const filePath = path.join(__dirname, getConfigValue(ConfigKeys.UPLOADS_PATH), fileName);
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size; // Size in bytes
    const fileModificationDate = fileStats.mtime; // Last modification date
    foundFiles.push({ name: fileName, size: fileSize, lastModified: fileModificationDate });
  });

  return foundFiles;
}

function getAndFilterUploadedFileList(userIds, isPublic = true) {
  let files = getUploadedFileList();

  logTrace("getAndFilterUploadedFileList:", { userIds, isPublic });
  const foundFiles = [];
  files.forEach((file) => {
    if (isUndefined(userIds) || userIds.length === 0) {
      if (checkFileName(file.name, undefined, isPublic, true)) {
        foundFiles.push(file);
      }
    } else {
      userIds.forEach((userId) => {
        if (checkFileName(file.name, userId, isPublic)) {
          foundFiles.push(file);
        }
      });
    }
  });

  return foundFiles;
}

function getUploadedFilePath(fileName) {
  const filesPath = path.join(__dirname, getConfigValue(ConfigKeys.UPLOADS_PATH));
  logTrace("getUploadedFilePath:", { filesPath });
  createPathIfNotExists(filesPath);

  let files = fs.readdirSync(filesPath);
  const foundFile = files.find((file) => file === fileName);
  logTrace("getUploadedFilePath:", { fileName, files, foundFile });

  if (isUndefined(foundFile)) return foundFile;

  return path.join(__dirname, getConfigValue(ConfigKeys.UPLOADS_PATH), foundFile);
}

function getUploadedFile(fileName) {
  const foundFile = getUploadedFilePath(fileName);
  if (isUndefined(foundFile)) return foundFile;
  const fileContent = JSON.parse(fs.readFileSync(foundFile, "UTF-8"));
  return fileContent;
}

function countEntities(db) {
  const entities = {};

  Object.keys(db).forEach((key) => {
    entities[key] = db[key].length;
  });

  return entities;
}

module.exports = {
  userDb,
  articlesDb,
  commentsDb,
  likesDb,
  flashpostsDb,
  quizQuestionsDb,
  userRolesDb,
  hangmanDb,
  fullDb,
  fullBaseDb,
  randomDbEntry,
  contactsDb,
  messageCheckDb,
  messagesDb,
  getDbPath,
  gamesDb,
  scoresDb,
  bookmarksDb,
  surveyResponsesDb,
  getUserAvatars,
  getImagesForArticles,
  getUploadedFileList,
  getUploadedFile,
  getUploadedFilePath,
  getAndFilterUploadedFileList,
  articleLabelsDb,
  labelsDb,
  countEntities,
  getVisitsPerArticle: visits.getInstance().getVisitsPerArticle,
  getVisitsPerComment: visits.getInstance().getVisitsPerComment,
  getVisitsPerUsers: visits.getInstance().getVisitsPerUsers,
  getApiCalls: visits.getInstance().getApiCalls,
  getNonApiCalls: visits.getInstance().getNonApiCalls,
  getApiRequestsDetails: visits.getInstance().getApiRequestsDetails,
  getNonApiRequestsDetails: visits.getInstance().getNonApiRequestsDetails,
  visitsData: visits.getInstance(),
  initVisits,
  translationsDb,
  getLanguages,
  bookShopAccountsDb,
  bookShopOrdersDb,
  bookShopActionsDb,
  bookShopRolesDb,
  bookShopAccountPaymentCardDb,
  bookShopAccountPaymentHistoryDb,
  bookShopItemsDb,
  bookShopOrderStatusesDb,
  bookShopOrderCouponsDb,
  booksDb,
  bookShopBookReviewsDb,
  userRoleActionsDb,
};
