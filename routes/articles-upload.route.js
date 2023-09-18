const formidable = require("formidable");
const { getConfigValue } = require("../config/config-manager");
const { ConfigKeys } = require("../config/enums");
const { logDebug, logError, logTrace } = require("../helpers/logger-api");
const { formatErrorResponse } = require("../helpers/helpers");
const {
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_UNPROCESSABLE_ENTITY,
} = require("../helpers/response.helpers");
const {
  are_all_fields_valid,
  mandatory_non_empty_fields_article,
  all_fields_article,
} = require("../helpers/validation.helpers");
const fs = require("fs");
const path = require("path");

const articlesUpload = (req, res, next) => {
  try {
    if (req.method === "POST" && req.url.endsWith("/api/articles/upload")) {
      const form = new formidable.IncomingForm();
      form.multiples = true;
      let uploadDir = path.join(__dirname, "..", "uploads");
      form.uploadDir = uploadDir;
      let userId = req.headers["userid"];
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
        if (err) {
          res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(`There was an error parsing the file: ${err.message}`));
          return;
        }

        const file = files.jsonFile[0];

        // TODO:INVOKE_BUG: same file name might cause file overwrite in parallel scenarios
        const fileName = `uploaded.json`;
        const newFullFilePath = path.join(uploadDir, fileName);

        logDebug("[articles/upload]: Renaming files:", { file, from: file.filepath, to: newFullFilePath });
        try {
          fs.renameSync(file.filepath, newFullFilePath);
          const fileDataRaw = fs.readFileSync(newFullFilePath, "utf8");
          const fileData = JSON.parse(fileDataRaw);
          fileData["user_id"] = userId;
          const isValid = are_all_fields_valid(fileData, all_fields_article, mandatory_non_empty_fields_article);
          if (!isValid.status) {
            logError("[articles/upload] Error after validation:", { error: isValid.error });
            res
              .status(HTTP_UNPROCESSABLE_ENTITY)
              .send(
                formatErrorResponse(
                  `One of field is invalid (empty, invalid or too long) or there are some additional fields: ${isValid.error}`,
                  all_fields_article
                )
              );
            return;
          }

          // TODO: rework:
          // req.method = "POST";
          // req.url = req.url.replace("/upload", "");
          // req.body = fileData;
          // logTrace("[articles/upload]: Finalization: POST:", {
          //   userId,
          //   body: req.body,
          //   headersSent: res.headersSent,
          //   url: req.url,
          //   method: req.method,
          // });
          // next();
        } catch (error) {
          logError("[articles/upload] Error:", error);
          res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("There was an error during file creation"));
          return;
        }
      });
    }
  } catch (error) {
    logError("Fatal error. Please contact administrator.", {
      error,
      stack: error.stack,
    });
  }
  if (res.headersSent !== true) {
    next();
  }
};

exports.articlesUpload = articlesUpload;
