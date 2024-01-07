const fs = require("fs");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const path = require("path");
const { checkFileName } = require("./file-upload.helper");
const { logTrace, logDebug } = require("./logger-api");
const { getRandomVisitsForEntities } = require("./random-data.generator");

const visits = (function () {
  let instance;

  function createInstance() {
    let visitsPerArticle = {};
    let visitsPerComment = {};
    let visitsPerUsers = {};
    let apiCalls = {};

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

    function generateVisits() {
      visitsPerArticle = getRandomVisitsForEntities(
        articlesDb(),
        getConfigValue(ConfigKeys.MIN_RANDOM_VISITS_FOR_ARTICLES),
        getConfigValue(ConfigKeys.MAX_RANDOM_VISITS_FOR_ARTICLES)
      );

      visitsPerComment = getRandomVisitsForEntities(
        commentsDb(),
        getConfigValue(ConfigKeys.MIN_RANDOM_VISITS_FOR_COMMENTS),
        getConfigValue(ConfigKeys.MAX_RANDOM_VISITS_FOR_COMMENTS)
      );

      visitsPerUsers = getRandomVisitsForEntities(
        userDb(),
        getConfigValue(ConfigKeys.MIN_RANDOM_VISITS_FOR_USERS),
        getConfigValue(ConfigKeys.MAX_RANDOM_VISITS_FOR_USERS)
      );

      logDebug("visits: generateVisits() invoked");
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

const visitsData = visits.getInstance();
visitsData.generateVisits();

function getDbPath(dbPath) {
  return path.resolve(__dirname, "..", dbPath);
}

function fullDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.AUTH_USER_DB)), "UTF-8"));
  return db;
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

function likesDb() {
  return fullDb()["likes"];
}

function labelsDb() {
  return fullDb()["labels"];
}

function articleLabelsDb() {
  return fullDb()["article-labels"];
}

function quizQuestionsDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.QUIZ_QUESTIONS_PATH), "UTF-8")));
  return db;
}

function getQuizHighScoresDb() {
  const db = JSON.parse(fs.readFileSync(getDbPath(getConfigValue(ConfigKeys.QUIZ_DB_PATH), "UTF-8")));
  return db;
}

function saveQuizHighScoresDb(data, gameId) {
  const db = getQuizHighScoresDb();
  db["scores"][gameId] = data;
  fs.writeFileSync(getDbPath(getConfigValue(ConfigKeys.QUIZ_DB_PATH)), JSON.stringify(db, null, 4));
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
    if (userIds === undefined || userIds.length === 0) {
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
  let files = fs.readdirSync(path.join(__dirname, getConfigValue(ConfigKeys.UPLOADS_PATH)));
  const foundFile = files.find((file) => file === fileName);

  if (foundFile === undefined) return foundFile;

  return path.join(__dirname, getConfigValue(ConfigKeys.UPLOADS_PATH), foundFile);
}

function getUploadedFile(fileName) {
  const foundFile = getUploadedFilePath(fileName);
  if (foundFile === undefined) return foundFile;
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
  quizQuestionsDb,
  hangmanDb,
  fullDb,
  randomDbEntry,
  getDbPath,
  getQuizHighScoresDb,
  saveQuizHighScoresDb,
  getUserAvatars,
  getImagesForArticles,
  getUploadedFileList,
  getUploadedFile,
  getUploadedFilePath,
  getAndFilterUploadedFileList,
  articleLabelsDb,
  labelsDb,
  countEntities,
  getVisitsPerArticle: visitsData.getVisitsPerArticle,
  getVisitsPerComment: visitsData.getVisitsPerComment,
  getVisitsPerUsers: visitsData.getVisitsPerUsers,
  getApiCalls: visitsData.getApiCalls,
  visitsData,
};
