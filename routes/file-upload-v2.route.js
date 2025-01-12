const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { logDebug, logError, logTrace } = require("../helpers/logger-api");
const { formatErrorResponse } = require("../helpers/helpers");
const { verifyAccessToken } = require("../helpers/validation.helpers");
const { searchForUserWithOnlyToken } = require("../helpers/db-operation.helpers");
const { isUndefined } = require("../helpers/compare.helpers");
const { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } = require("../helpers/response.helpers");
const { formatInvalidTokenErrorResponse } = require("../helpers/helpers");
const {
  searchForBookShopAccountWithUserId,
  searchForBookShopActions,
} = require("../helpers/db-operations/db-book-shop.operations");
const { isStringOnTheList } = require("../helpers/compare.helpers");

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
    fileSize: 30 * 1024, // 30 KB
  },
});

const bookShopCoverUploadRoutes = (req, res, next) => {
  // validate account
  const verifyTokenResult = verifyAccessToken(req, res, "GET book-shop-accounts", req.url);
  const foundUser = searchForUserWithOnlyToken(verifyTokenResult);

  logTrace("handleBookShopManage: Found User", { id: foundUser?.id });

  if (isUndefined(foundUser)) {
    res.status(HTTP_UNAUTHORIZED).send(formatInvalidTokenErrorResponse());
    return false;
  }

  const booksShopAccount = searchForBookShopAccountWithUserId(foundUser.id);

  if (booksShopAccount === undefined) {
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User does not have a book shop account"));
    return false;
  }

  const action = searchForBookShopActions("manage-books");
  logDebug("handleBookShopManage: possibleRoleIds", { user_role_id: booksShopAccount.role_id, action });

  if (isStringOnTheList(booksShopAccount.role_id, action.role_ids) === false) {
    res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User does not have a permission"));
    return false;
  }

  // validation passed

  const tempPath = req.file.path;
  const targetPath = path.join(bookCoverUploadDir, req.file.originalname);
  const allowedFileTypes = [".png", ".jpg", ".jpeg"];

  logDebug("[bookShopCoverUploadRoutes]:", { tempPath, targetPath });

  const fileExtention = path.extname(req.file.originalname).toLowerCase();
  if (allowedFileTypes.includes(fileExtention)) {
    fs.rename(tempPath, targetPath, (err) => {
      if (err) return handleError(err, res);

      res.status(200).contentType("text/plain").end("File uploaded!");
    });
  } else {
    fs.unlink(tempPath, (err) => {
      if (err) return handleError(err, res);

      res
        .status(403)
        .contentType("text/plain")
        .end(`Only ${allowedFileTypes.join(", ")} files are allowed!`);
    });
  }
};

exports.bookShopCoverUploadRoutes = bookShopCoverUploadRoutes;
exports.multerUpload = multerUpload;
exports.multerErrorHandling = multerErrorHandling;
