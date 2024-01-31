const formidable = require("formidable");
const { getConfigValue, getFeatureFlagConfigValue } = require("../config/config-manager");
const { ConfigKeys, FeatureFlagConfigKeys } = require("../config/enums");
const { logDebug, logError, logTrace } = require("../helpers/logger-api");
const { formatErrorResponse, getTodayDate, getIdFromUrl } = require("../helpers/helpers");
const {
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_OK,
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
} = require("../helpers/response.helpers");
const {
  areAllFieldsValid,
  mandatory_non_empty_fields_article,
  all_fields_article,
  verifyAccessToken,
} = require("../helpers/validation.helpers");
const fs = require("fs");
const path = require("path");
const { getUploadedFilePath, getAndFilterUploadedFileList } = require("../helpers/db.helpers");
const { formatFileName, checkFileName } = require("../helpers/file-upload.helper");
const { searchForUserWithEmail } = require("../helpers/db-operation.helpers");
const { isUndefined } = require("../helpers/compare.helpers");

const uploadDir = path.join(__dirname, "..", "uploads");

const maxFiles = 5;
let currentFilePerUser = {};

const fileUploadRoutes = (req, res, next) => {
  const isFeatureEnabled = getFeatureFlagConfigValue(FeatureFlagConfigKeys.FEATURE_FILES);
  if (isFeatureEnabled) {
    try {
      // TODO: rework:
      if (req.method === "POST" && req.url.endsWith("/api/files/articles/upload")) {
        const verifyTokenResult = verifyAccessToken(req, res, "files/articles/upload", req.url);
        if (isUndefined(verifyTokenResult)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
          return;
        }

        const form = new formidable.IncomingForm();
        form.multiples = true;
        form.uploadDir = uploadDir;
        let userId = req.headers["userid"];
        let isPublic = req.headers["ispublic"] === "true";
        logTrace("[articles/upload]:", { method: req.method, url: req.url, userId });

        form.on("progress", function (bytesReceived, bytesExpected) {
          const uploadSizeLimitBytes = getConfigValue(ConfigKeys.UPLOAD_SIZE_LIMIT_BYTES);
          logDebug("[articles/upload]: progress: formidable data received:", {
            bytesReceived,
            bytesExpected,
            uploadSizeLimitBytes,
          });
          if (bytesReceived > uploadSizeLimitBytes) {
            throw new Error(`File too big. Actual: ${bytesExpected} bytes, Max: ${uploadSizeLimitBytes} bytes`);
          }
        });
        form.parse(req, async (err, fields, files) => {
          req.on("end", () => {
            logDebug("[articles/upload]: end: Upload finished");
          });
          if (err) {
            logError("[articles/upload] There was an error parsing the file:", { error: err.message });
            return;
          }

          const file = files.jsonFile[0];

          // TODO:INVOKE_BUG: same file name might cause file overwrite in parallel scenarios
          // const fileName = `uploaded-${getTodayDateForFileName()}.json`;
          if (isUndefined(currentFilePerUser[userId])) {
            currentFilePerUser[userId] = 0;
          }

          const fileName = formatFileName(userId, currentFilePerUser[userId], isPublic);
          logTrace("[articles/upload] Saving:", { fileName, userId, isPublic });
          currentFilePerUser[userId] = (currentFilePerUser[userId] + 1) % maxFiles;

          const newFullFilePath = path.join(uploadDir, fileName);

          logTrace("[articles/upload]: Stats:", { currentFilePerUser });
          logDebug("[articles/upload]: Renaming files:", { file, from: file.filepath, to: newFullFilePath });
          try {
            fs.renameSync(file.filepath, newFullFilePath);
            const fileDataRaw = fs.readFileSync(newFullFilePath, "utf8");
            const fileData = JSON.parse(fileDataRaw);
            fileData["user_id"] = userId;
            fileData["date"] = getTodayDate();

            fs.writeFileSync(newFullFilePath, JSON.stringify(fileData, null, 4));

            const isValid = areAllFieldsValid(fileData, all_fields_article, mandatory_non_empty_fields_article);
            if (!isValid.status) {
              logError("[articles/upload] Error after validation:", { error: isValid.error });
              return;
            }
            res.status(HTTP_OK).send({});
          } catch (error) {
            logError("[articles/upload] Error:", error);
            res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("There was an error during file creation"));
            return;
          }
        });
        res.status(HTTP_OK);
        return;
      } else if (req.method === "GET" && req.url.includes("/api/files/articles/download/")) {
        const urlEnds = req.url.replace(/\/\/+/g, "/");

        const fileName = getIdFromUrl(urlEnds);
        const canFileBeDownloaded = checkFileName(fileName, undefined, true, true);

        if (!canFileBeDownloaded) {
          logDebug("[files/articles/download] CanFileBeDownloaded:", { canFileBeDownloaded });
          res.status(HTTP_NOT_FOUND).json({ fileName, found: false });
          return;
        }

        logDebug("[articles/download] Searching for file:", { fileName });
        const foundFile = getUploadedFilePath(fileName);
        logDebug("[articles/download] Found file:", { fileName, found: !isUndefined(foundFile) });

        if (isUndefined(foundFile)) {
          res.status(HTTP_NOT_FOUND).json({ fileName, found: !isUndefined(foundFile) });
          return;
        } else {
          res.status(HTTP_OK).download(foundFile);
          return;
        }
      } else if (req.method === "GET" && req.url.endsWith("/api/files/articles/uploaded") && isFeatureEnabled) {
        const verifyTokenResult = verifyAccessToken(req, res, "files/articles/uploaded", req.url);
        if (isUndefined(verifyTokenResult)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
          return;
        }

        const foundUser = searchForUserWithEmail(verifyTokenResult?.email);

        const files = getAndFilterUploadedFileList([foundUser.id], false);
        res.json(files);
        req.body = files;
      } else if (
        req.method === "GET" &&
        req.url.includes("/api/files/articles/uploaded/public?userIds=") &&
        isFeatureEnabled
      ) {
        const ids = req.url.split("userIds=").slice(-1)[0];
        const userIds = ids.split(",");

        const files = getAndFilterUploadedFileList(userIds, true);
        res.json(files);
        req.body = files;
      } else if (req.method === "GET" && req.url.endsWith("/api/files/articles/uploaded/public") && isFeatureEnabled) {
        const file = getAndFilterUploadedFileList(undefined, true);

        res.json(file);
        req.body = file;
        return;
        // } else if (req.method === "POST" && req.url.endsWith("/api/files/articles/uploaded/download")) {
        //   const fileName = req.body.fileName;

        //   const fileExists = fs.existsSync(path.join(uploadDir, fileName));
        //   if (fileExists) {
        //     res.sendFile(fileName, { root: "./uploads" });
        //   } else {
        //     res.status(HTTP_NOT_FOUND);
        //     return;
        //   }
        //   return;
      } else if (req.method === "GET" && req.url.includes("/api/files/articles/uploaded?userId=") && isFeatureEnabled) {
        const userId = req.url.split("userId=").slice(-1)[0];

        const verifyTokenResult = verifyAccessToken(req, res, "files/articles/uploaded", req.url);
        if (isUndefined(verifyTokenResult)) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!"));
          return;
        }

        const foundUser = searchForUserWithEmail(verifyTokenResult?.email);
        if (`${foundUser?.id}` !== `${userId}`) {
          res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Access token not provided!!"));
          return;
        }

        const files = getAndFilterUploadedFileList([userId], false);
        res.json(files);
        req.body = files;
      }
    } catch (error) {
      logError("Fatal error. Please contact administrator.", {
        error,
        stack: error.stack,
      });
    }
  }
  if (res.headersSent !== true) {
    next();
  }
};

exports.fileUploadRoutes = fileUploadRoutes;
