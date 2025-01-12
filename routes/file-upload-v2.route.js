const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { logDebug, logError } = require("../helpers/logger-api");
const { formatErrorResponse } = require("../helpers/helpers");

const handleError = (err, res) => {
  logError("[fileUploadV2Routes]:", { err });
  res.status(500).contentType("text/plain").end("Oops! Something went wrong!");
};

const multerErrorHandling = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logError("[multerErrorHandling]:", { err });
    res.status(422).send(formatErrorResponse(err.message));
  } else {
    next();
  }
};

const bookCoverUploadDir = path.join(__dirname, "..", "public", "data", "books");
const uploadTempDir = path.join(__dirname, "..", "uploads");

const multerUpload = multer({
  dest: uploadTempDir,
  limits: {
    fileSize: 50 * 1024, // 50 KB
  },
});

const bookShopCoverUploadRoutes = (req, res, next) => {
  const tempPath = req.file.path;
  const targetPath = path.join(bookCoverUploadDir, req.file.originalname);

  logDebug("[bookShopCoverUploadRoutes]:", { tempPath, targetPath });

  const fileExtention = path.extname(req.file.originalname).toLowerCase();
  if ([".png", ".jpg", ".jpeg"].includes(fileExtention)) {
    fs.rename(tempPath, targetPath, (err) => {
      if (err) return handleError(err, res);

      res.status(200).contentType("text/plain").end("File uploaded!");
    });
  } else {
    fs.unlink(tempPath, (err) => {
      if (err) return handleError(err, res);

      res.status(403).contentType("text/plain").end("Only .png files are allowed!");
    });
  }
};

exports.bookShopCoverUploadRoutes = bookShopCoverUploadRoutes;
exports.multerUpload = multerUpload;
exports.multerErrorHandling = multerErrorHandling;
